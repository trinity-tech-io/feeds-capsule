import { Injectable } from '@angular/core';
import { FilesService, ScriptingService, QueryHasResultCondition, Executable, InsertOptions, File as HiveFile, StreamResponseParser, InsertExecutable, FileUploadExecutable, FindExecutable, HiveException, VaultServices, AppContext, Logger as HiveLogger, Utils, File, AppContextParameters, DefaultAppContextProvider, VaultSubscriptionService, UpdateResult, UpdateOptions, HttpClient, AndCondition, FindOptions, Condition } from "@dchagastelles/elastos-hive-js-sdk";
import { Claims, DIDDocument, JWTParserBuilder, DID, DIDBackend, DefaultDIDAdapter, JSONObject, VerifiableCredential } from '@elastosfoundation/did-js-sdk';
import { StandardAuthService } from 'src/app/services/StandardAuthService';
import { Console } from 'console';
import { resolve } from 'url';
import { FileService } from 'src/app/services/FileService';
import { Logger } from 'src/app/services/logger';
import { DataHelper } from 'src/app/services/DataHelper';
import { InsertResult } from '@dchagastelles/elastos-hive-js-sdk/typings/restclient/database/insertresult';
import { isEqual, isNil, reject } from 'lodash';
import { on } from 'process';
import { VideoService } from './video.service';
import { stringify } from 'querystring';
import { Events } from 'src/app/services/events.service';

let TAG: string = 'Feeds-HiveService';

let eventBus: Events = null;

@Injectable()
export class HiveService {
  public static CREATEALLCollECTION = "feeds_createALLCollections" // 本地标识是否创建了Collection
  public static readonly CHANNEL = "channels"
  private static readonly POST = "posts"
  private static readonly SUBSCRIPTION = "subscriptions"
  public static readonly TARGETDID = "targetDid"
  public static readonly postId = "channelId"
  private static readonly RESOLVE_CACHE = "data/didCache"
  private static collectName = "feeds_subscription"//标识是否备份到hive
  private static isSync = "feeds_subscription_synchronize" // 标识是否同步数据到本地
  private static createCollection = "feeds_subscription_createCollection" // 本地标识是否创建了Collection
  private static INSTANCE: HiveService
  public context: AppContext
  public vault: VaultServices
  public tarDID: string
  public tarAppDID: string
  public avatarParam: string
  public avatarScriptName: string
  public image = null
  public appinstanceDid: string

  private avatarVC: VerifiableCredential
  constructor(
    private standardAuthService: StandardAuthService,
    private fileService: FileService,
    private dataHelper: DataHelper,
    private events: Events,
  ) {
    console.log("++++++ event = " + events);
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
        this.context = await AppContext.build({
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
        resolve(this.context)
      } catch (error) {
        Logger.error(TAG, "creat Error: ", error)
        reject(error)
      }
    })
  }

  async creatVault() {
    try {
      let appinstanceDocument = await this.standardAuthService.getInstanceDIDDoc()
      let userDid = (await this.dataHelper.getSigninData()).did
      const userDID = DID.from(userDid)
      const userDIDDocument = await userDID.resolve()
      let provider = this.parseUserDIDDocument(userDid, userDIDDocument)
      if (this.context == null) {
        this.context = await this.creatAppContext(appinstanceDocument, userDid)
      }
      this.vault = new VaultServices(this.context, provider)
    }
    catch (error) {
      Logger.error(TAG, 'Create vault error:', error);
    }
  }

  parseUserDIDDocument(userDID: string, userDIDDocument: DIDDocument) {
    const avatarDid = userDID + "#avatar"
    this.avatarVC = userDIDDocument.getCredential(avatarDid)
    if (this.avatarVC != null) { // 有头像
      const sub = this.avatarVC.getSubject()
      const pro = sub.getProperty("avatar")
      const data: string = pro["data"]
      const type = pro["type"]
      const prefix = "hive://"
      this.avatarParam = data.substr(prefix.length)
      const parts = this.avatarParam.split("/")
      if (parts.length < 2) // TODO 验证parts是否大于2个 ，否则 抛出异常
        throw "userDIDDocument 中缺少参数"

      const dids = parts[0].split("@")
      if (dids.length != 2) // TODO 验证dids是否等于2个 ，否则 抛出异常
        throw "userDIDDocument 中缺少参数"

      const star = data.length - (prefix.length + parts[0].length + 1)
      const values = parts[1].split("?")
      if (values.length != 2) // TODO 验证values是否等于2个 ，否则 抛出异常
        throw "userDIDDocument 中缺少参数"

      this.avatarScriptName = values[0]
      const paramStr = values[1]
      const scriptParam = JSON.parse(paramStr.substr(7))
      this.tarDID = dids[0]
      this.tarAppDID = dids[1]
    }
    const serviceDid = userDID + "#hivevault"
    const service = userDIDDocument.getService(serviceDid)
    const provider = service.getServiceEndpoint() + ":443"
    return provider
  }

  async getVault() {
    if (this.vault == null) {
      await this.creatVault()
    }
    return this.vault
  }

  async getDatabaseService() {
    return (await this.getVault()).getDatabaseService()
  }

  async getScriptingService() {
    return (await this.getVault()).getScriptingService()
  }

  async getFilesService() {
    return (await this.getVault()).getFilesService()
  }

  async createCollection(channelName: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const databaseService = await this.getDatabaseService()
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
        let scriptingService = await this.getScriptingService()
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
        let dbService = await this.getDatabaseService()
        let result = dbService.findMany(collectionName, filter)
        console.log("findPostDB ======  ", result)
        resolve(result)
      } catch (error) {
        Logger.error(TAG, 'listPostDB error:', error)
        reject(error)
      }
    })
  }

  async callScript(scriptName: string, document: any, userDid: string, appid: string): Promise<any> {
    let scriptingService = await this.getScriptingService()
    let result = await scriptingService.callScript<any>(scriptName, document, userDid, appid)
    console.log("callChannel result ======= ", result)
    return result
  }

  async getMyChannelList() {
    let userDid = (await this.dataHelper.getSigninData()).did
    this.dataHelper.getMyChannelListWithHive(userDid)
  }

  async downloadEssAvatarTransactionId() {
    try {
      if (this.avatarVC === null) {
        return
        }
      const scriptingService = await this.getScriptingService()
      return await scriptingService.callScript(this.avatarScriptName, this.avatarParam, this.tarDID, this.tarAppDID)
    } catch (error) {
      Logger.error(TAG, "Download Ess Avatar transactionId error: ", error)
      reject(error)
    }
  }

  async downloadScripting(transaction_id: string) {
    const scriptingService = await this.getScriptingService()
    return await scriptingService.downloadFile(transaction_id)
  }

  async downloadFile(remotePath: string) {
    const fileService = await this.getFilesService()
    return await fileService.download(remotePath)
  }

  async uploadCustomeAvatar(remotePath: string, img: any) {
    try {
      const fileService = await this.getFilesService()
      await fileService.upload(remotePath, Buffer.from(img, 'utf8'))
    }
    catch (error) {
      Logger.error(TAG, "Upload custome avatar error: ", error);
    }
  }

  insertDBData(collectName: string, doc: any): Promise<InsertResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const dbService = await this.getDatabaseService()
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
        const dbService = await this.getDatabaseService()
        const insertResult = await dbService.updateOne(collectName, origin, update, option)
        resolve(insertResult)
      } catch (error) {
        Logger.error(TAG, 'update one error:', error)
        reject(error)
      }
    })
  }

  deleateOneDBData(collectName: string, fillter: JSONObject): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const dbService = await this.getDatabaseService()
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

