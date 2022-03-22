import { Injectable } from '@angular/core';
import { ScriptingService, Executable, InsertOptions, File as HiveFile, VaultServices, AppContext, Logger as HiveLogger, UpdateResult, UpdateOptions, Condition, InsertResult } from "@elastosfoundation/hive-js-sdk";
import { Claims, DIDDocument, JWTParserBuilder, DID, DIDBackend, DefaultDIDAdapter, JSONObject, VerifiableCredential } from '@elastosfoundation/did-js-sdk';
import { StandardAuthService } from 'src/app/services/StandardAuthService';
import { Console } from 'console';
import { resolve } from 'url';
import { FileService } from 'src/app/services/FileService';
import { Logger } from 'src/app/services/logger';
import { DataHelper } from 'src/app/services/DataHelper';
// import { InsertResult } from '@dchagastelles/elastos-hive-js-sdk/typings/restclient/database/insertresult';
import { } from '@elastosfoundation/hive-js-sdk'
import { isEqual, isNil, reject } from 'lodash';
import { on } from 'process';
import { VideoService } from './video.service';
import { stringify } from 'querystring';
import { Events } from 'src/app/services/events.service';

import { FileHelperService } from 'src/app/services/FileHelperService';
let TAG: string = 'Feeds-HiveService';

let eventBus: Events = null;

@Injectable()
export class HiveService {
  public static CREATEALLCollECTION = "feeds_createALLCollections" // 本地标识是否创建了Collection
  public static readonly CHANNEL = "channels"
  public static readonly TARGETDID = "targetDid"
  public static readonly postId = "channelId"
  private static readonly RESOLVE_CACHE = "data/didCache"

  public image = null
  public appinstanceDid: string
  private avatarScriptNameMap: { [userDid: string]: string } = {}
  private avatarParamMap: { [userDid: string]: string } = {}
  private tarDIDMap: { [userDid: string]: string } = {}
  private tarAppDIDMap: { [userDid: string]: string } = {}
  private vaultMap: { [userDid: string]: VaultServices } = {}

  constructor(
    private standardAuthService: StandardAuthService,
    private fileService: FileService,
    private dataHelper: DataHelper,
    private events: Events,
  ) {
    eventBus = events;
  }

  public async creatAppContext(appInstanceDocumentString: string, userDidString: string): Promise<AppContext> {
    return new Promise(async (resolve, reject) => {
      try {
        const currentNet = this.dataHelper.getDevelopNet().toLowerCase()
        HiveLogger.setDefaultLevel(HiveLogger.TRACE)
        DIDBackend.initialize(new DefaultDIDAdapter(currentNet))
        AppContext.setupResolver(currentNet, HiveService.RESOLVE_CACHE)
        const rootDirEntry = await this.fileService.resolveLocalFileSystemURL()
        const path = rootDirEntry.fullPath
        // auth
        let self = this
        const context = await AppContext.build({
          getLocalDataDir(): string {
            return path
          },
          getAppInstanceDocument(): Promise<DIDDocument> {
            return new Promise(async (resolve, reject) => {
              try {
                let appInstanceDidDocument = DIDDocument._parseOnly(appInstanceDocumentString)
                resolve(appInstanceDidDocument)
              } catch (error) {
                Logger.error(TAG, "get AppInstanceDocument Error: ", error)
                reject(error)
              }
            })
          },
          getAuthorization(jwtToken: string): Promise<string> {
            return new Promise(async (resolve, reject) => {
              try {
                const authToken = await self.standardAuthService.generateHiveAuthPresentationJWT(jwtToken)
                resolve(authToken)
              } catch (error) {
                Logger.error(TAG, "get Authorization Error: ", error)
                reject(error)
              }
            })
          }
        }, userDidString);
        resolve(context)
      } catch (error) {
        Logger.error(TAG, "creat Error: ", error)
        reject(error)
      }
    })
  }

  async creatVault(userDid: string) {
    try {
      let appinstanceDocument = await this.standardAuthService.getInstanceDIDDoc()
      const userDID = DID.from(userDid)
      const context = await this.creatAppContext(appinstanceDocument, userDid)
      const userDIDDocument = await userDID.resolve()
      let provider = this.parseUserDIDDocument(userDid, userDIDDocument)
      const vault = new VaultServices(context, provider)
      this.vaultMap[userDid] = vault
    }
    catch (error) {
      Logger.error(TAG, 'Create vault error:', error);
    }
  }

  parseUserDIDDocument(userDid: string, userDIDDocument: DIDDocument) {
    const avatarDid = userDid + "#avatar"
    const avatarVC = userDIDDocument.getCredential(avatarDid)
    if (avatarVC != null) { // 有头像
      const sub = avatarVC.getSubject()
      const pro = sub.getProperty("avatar")
      const data: string = pro["data"]
      const type = pro["type"]
      const prefix = "hive://"
      const avatarParam = data.substr(prefix.length)
      this.avatarParamMap[userDid] = avatarParam
      const parts = avatarParam.split("/")
      if (parts.length < 2) // TODO 验证parts是否大于2个 ，否则 抛出异常
        throw "userDIDDocument 中缺少参数"

      const dids = parts[0].split("@")
      if (dids.length != 2) // TODO 验证dids是否等于2个 ，否则 抛出异常
        throw "userDIDDocument 中缺少参数"

      const star = data.length - (prefix.length + parts[0].length + 1)
      const values = parts[1].split("?")
      if (values.length != 2) // TODO 验证values是否等于2个 ，否则 抛出异常
        throw "userDIDDocument 中缺少参数"

      const avatarScriptName = values[0]
      this.avatarScriptNameMap[userDid] = avatarScriptName
      const paramStr = values[1]
      const scriptParam = JSON.parse(paramStr.substr(7))
      const tarDID = dids[0]
      const tarAppDID = dids[1]
      this.tarDIDMap[userDid] = tarDID
      this.tarAppDIDMap[userDid] = tarAppDID
    }
    const serviceDid = userDid + "#hivevault"
    const service = userDIDDocument.getService(serviceDid)
    const provider = service.getServiceEndpoint() + ":443"
    return provider
  }

  async getVault(userDid: string) {
    let vault = this.vaultMap[userDid]
    if (vault == null) {
      await this.creatVault(userDid)
    }
    return this.vaultMap[userDid]
  }

  async getDatabaseService(userDid: string) {
    return (await this.getVault(userDid)).getDatabaseService()
  }

  async getScriptingService(userDid: string) {
    return (await this.getVault(userDid)).getScriptingService()
  }

  async getFilesService(userDid: string) {
    return (await this.getVault(userDid)).getFilesService()
  }

  async createCollection(channelName: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        let userDid = (await this.dataHelper.getSigninData()).did
        const databaseService = await this.getDatabaseService(userDid)
        const result = await databaseService.createCollection(channelName);
        resolve(result)
      } catch (error) {
        Logger.error(TAG, 'createCollection error', error);
        reject(error);
      }
    })
  }

  registerScript(scriptName: string, executable: Executable, condition: Condition, allowAnonymousUser?: boolean, allowAnonymousApp?: boolean): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        let userDid = (await this.dataHelper.getSigninData()).did
        let scriptingService = await this.getScriptingService(userDid)
        await scriptingService.registerScript(scriptName, executable,
          condition, allowAnonymousUser, allowAnonymousApp)
        resolve()
      } catch (error) {
        Logger.error(TAG, 'register error:', error)
        reject(error)
      }
    })
  }

  findPostDB(collectionName: string, filter: any): Promise<JSONObject[]> {
    return new Promise(async (resolve, reject) => {
      try {
        let userDid = (await this.dataHelper.getSigninData()).did
        let dbService = await this.getDatabaseService(userDid)
        let result = dbService.findMany(collectionName, filter)
        resolve(result)
      } catch (error) {
        Logger.error(TAG, 'listPostDB error:', error)
        reject(error)
      }
    })
  }

  async callScript(userDid: string, scriptName: string, document: any, callerDid: string, appid: string): Promise<any> {
    let scriptingService = await this.getScriptingService(userDid)
    let result = await scriptingService.callScript<any>(scriptName, document, callerDid, appid)
    return result
  }

  async getMyChannelList(userDid: string) {
    this.dataHelper.getMyChannelListWithHive(userDid)
  }

  async uploadScriting(userDid: string, transactionId: string, data: string) {
    const scriptingService = await this.getScriptingService(userDid)
    return scriptingService.uploadFile(transactionId, data)
  }

  async downloadEssAvatarTransactionId(userDid: string) {
    try {
      const avatarParam = this.avatarParamMap[userDid]
      if (avatarParam === null) {
        return
      }
      const scriptingService = await this.getScriptingService(userDid)
      const avatarScriptName = this.avatarScriptNameMap[userDid]
      const tarDID = this.tarDIDMap[userDid]
      const tarAppDID = this.tarAppDIDMap[userDid]
      return await scriptingService.callScript(avatarScriptName, avatarParam, tarDID, tarAppDID)
    } catch (error) {
      Logger.error(TAG, "Download Ess Avatar transactionId error: ", error)
      reject(error)
    }
  }

  async downloadScripting(userDid: string, transaction_id: string) {
    try {
      const scriptingService = await this.getScriptingService(userDid)
      return await scriptingService.downloadFile(transaction_id)
    } catch (error) {
      console.log("scriptingService.downloadFile error: ==== ", error)
    }
  }

  async downloadScriptingURL(userDid: string, avatarHiveURL: string) {
    try {
      const scriptingService = await this.getScriptingService(userDid)
      // return await scriptingService.downloadScriptingURL(avatarHiveURL)
    } catch (error) {
      console.log("downloadScriptingURL  ===== ", error)
    }
  }

  async downloadFile(userDid: string, remotePath: string) {
    const fileService = await this.getFilesService(userDid)
    return await fileService.download(remotePath)
  }

  async getUploadDataFromScript(transactionId: string, img: any) {
    try {
      let userDid = (await this.dataHelper.getSigninData()).did
      const scriptingService = await this.getScriptingService(userDid)
      return scriptingService.uploadFile(transactionId, img)
    }
    catch (error) {
      Logger.error(TAG, "Upload custome avatar error: ", error);
    }
  }

  async uploadDataFromScript(transactionId: string, img: any) {
    try {
      let userDid = (await this.dataHelper.getSigninData()).did
      const scriptingService = await this.getScriptingService(userDid)
      return scriptingService.uploadFile(transactionId, img)
    }
    catch (error) {
      Logger.error(TAG, "Upload custome avatar error: ", error);
    }
  }

  async uploadScriptWithBlob(remotePath: string, img: Blob) {
    try {
      let userDid = (await this.dataHelper.getSigninData()).did
      const fileService = await this.getFilesService(userDid)
      return await fileService.upload(remotePath, img)
    }
    catch (error) {
      Logger.error(TAG, "Upload script blob error: ", error);
    }
  }

  async uploadScriptWithString(remotePath: string, img: any) {
    try {
      let userDid = (await this.dataHelper.getSigninData()).did
      const fileService = await this.getFilesService(userDid)
      return await fileService.upload(remotePath, Buffer.from(img, 'utf8'))
    }
    catch (error) {
      Logger.error(TAG, "Upload custome avatar error: ", error);
    }
  }

  insertDBData(collectName: string, doc: any,): Promise<InsertResult> {
    return new Promise(async (resolve, reject) => {
      try {
        let userDid = (await this.dataHelper.getSigninData()).did
        const dbService = await this.getDatabaseService(userDid)
        const insertResult = await dbService.insertOne(collectName, doc, new InsertOptions(false, true));
        resolve(insertResult)
      } catch (error) {
        Logger.error(TAG, 'Insert error:', error)
        reject(error)
      }
    })
  }

  updateOneDBData(collectName: string, origin: JSONObject, update: JSONObject, option: UpdateOptions): Promise<UpdateResult> {
    return new Promise(async (resolve, reject) => {
      try {
        let userDid = (await this.dataHelper.getSigninData()).did
        const dbService = await this.getDatabaseService(userDid)
        const result = await dbService.updateOne(collectName, origin, update, option)
        resolve(result)
      } catch (error) {
        Logger.error(TAG, 'update one error:', error)
        reject(error)
      }
    })
  }

  deleateOneDBData(collectName: string, fillter: JSONObject): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        let userDid = (await this.dataHelper.getSigninData()).did
        const dbService = await this.getDatabaseService(userDid)
        await dbService.deleteOne(collectName, fillter)
        resolve()
      } catch (error) {
        Logger.error(TAG, 'delete one error:', error)
        reject(error)
      }
    })
  }

  newInsertOptions() {
    return new InsertOptions(false, true);
  }
}

