import { Injectable } from '@angular/core';
import { FilesService, ScriptingService, QueryHasResultCondition, Executable, InsertOptions, File as HiveFile, StreamResponseParser, InsertExecutable, FileUploadExecutable, HiveException, VaultServices, AppContext, Logger as HiveLogger, Utils, File, AppContextParameters, DefaultAppContextProvider, VaultSubscriptionService, UpdateResult, UpdateOptions, HttpClient } from "@dchagastelles/elastos-hive-js-sdk";
import { Claims, DIDDocument, JWTParserBuilder, DID, DIDBackend, DefaultDIDAdapter, JSONObject } from '@elastosfoundation/did-js-sdk';
import { StandardAuthService } from 'src/app/services/StandardAuthService';
import { Console } from 'console';
import { resolve } from 'url';
import { FileService } from 'src/app/services/FileService';
import { Logger } from 'src/app/services/logger';
import { DataHelper } from 'src/app/services/DataHelper';
import { InsertResult } from '@dchagastelles/elastos-hive-js-sdk/typings/restclient/database/insertresult';
import { isEqual, isNil, reject } from 'lodash';
import { on } from 'process';

let TAG: string = 'feeds-HiveService';

@Injectable()
export class HiveService {
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

  constructor(
    private standardAuthService: StandardAuthService,
    private fileService: FileService,
    private dataHelper: DataHelper,
  ) {
  }

  public async creat(appInstanceDocumentString: string, userDidString: string, resolverUrl: string): Promise<AppContext> {
    return new Promise(async (resolve, reject) => {
      try {
        HiveLogger.setDefaultLevel(HiveLogger.TRACE)
        DIDBackend.initialize(new DefaultDIDAdapter("mainnet"))
        AppContext.setupResolver("mainnet", HiveService.RESOLVE_CACHE)
        const rootDirEntry = await this.fileService.resolveLocalFileSystemURL()
        const path = rootDirEntry.fullPath

        let self = this
        this.context = await AppContext.build({
          getLocalDataDir(): string {
            console.log("path  TODO: =============== ", path)
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
                console.log("authToken === ", authToken)
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
      // auth
      let appinstanceDocument = await this.standardAuthService.getInstanceDIDDoc()
      let userDid = (await this.dataHelper.getSigninData()).did

      const resolverUrl = "https://api.elastos.io/eid"
      if (this.context == null) {
        this.context = await this.creat(appinstanceDocument, userDid, resolverUrl)
      }
      // userdid : "did:elastos:ikHP389FhssAADnUwM3RFF415F1wviZ8CC"
      const userDID = DID.from(userDid)
      const userDiddocument = await userDID.resolve()
      const ccount = userDiddocument.getCredentialCount()
      const avatarDid = userDid + "#avatar"
      const cre = userDiddocument.getCredential(avatarDid)
      if (cre != null) { // 有头像
        const sub = cre.getSubject()
        const pro = sub.getProperty("avatar")
        const data: string = pro["data"]
        const type = pro["type"]
        const prefix = "hive://"
        this.avatarParam = data.substr(prefix.length)
        const parts = this.avatarParam.split("/")
        // TODO 验证parts是否大于2个 ，否则 抛出异常
        const dids = parts[0].split("@")
        // TODO 验证dids是否等于2个 ，否则 抛出异常
        const star = data.length - (prefix.length + parts[0].length + 1)
        const values = parts[1].split("?")
        // TODO 验证values是否等于2个 ，否则 抛出异常
        this.avatarScriptName = values[0]
        const paramStr = values[1]
        const scriptParam = JSON.parse(paramStr.substr(7))
        // 创建
        this.tarDID = dids[0]
        this.tarAppDID = dids[1]
      }

      const serviceDid = userDid + "#hivevault"
      const service = userDiddocument.getService(serviceDid)
      const provider = service.getServiceEndpoint() + ":443"
      console.log("provider ====================", provider)

      const vaultSubscription: VaultSubscriptionService = new VaultSubscriptionService(this.context, provider)
      this.vault = new VaultServices(this.context, provider)
    }
    catch (error) {
      console.log("creatVault error: ", error)
    }
  }

  async getVault() {
    try {
      if (this.vault == null) {
        await this.creatVault()
      }
      return this.vault
    } catch (error) {
      console.log("getVault error: ", error)
    }

  }

  async backupSubscriptionToHive() {
    try {
      const list = this.dataHelper.getSubscribedFeedsList()
      console.log("list  ==== ", list)
      let userDid = (await this.dataHelper.getSigninData()).did

      const feeds_logo_subscription = localStorage.getItem(userDid + HiveService.collectName) || ''
      const feeds_logo_createCollection = localStorage.getItem(userDid + HiveService.createCollection) || ''
      const isSync = localStorage.getItem(userDid + HiveService.isSync) || ''

      console.log("feeds_subscription  ==== ", feeds_logo_subscription)
      console.log("feeds_logo_createCollection  ==== ", feeds_logo_createCollection)
      console.log("isSync  ==== ", isSync)

      if (isSync === '' && list.length === 0 && feeds_logo_subscription === '') { // 新用户/换手机
        let query = {}
        const vault = await this.getVault()
        // 容错处理： 新用户去hive端拿备份数据 会拿不到error，会有风险 // 
        localStorage.setItem(HiveService.isSync, "true")
        const result = await vault.getDatabaseService().query(HiveService.collectName, query, null)
        console.log("拿到query结果 ===== ", result)

        let i = 0
        let array = []
        result.forEach((obj) => {
          const nodeId = obj["nodeId"].toString()
          const channelId = Number(obj["id"])
          const name = obj["name"].toString()
          const desc = obj["introduction"].toString()
          const owner_name = obj["owner_name"].toString()
          const owner_did = obj["owner_did"].toString()
          const subscribers = Number(obj["subscribers"])
          const last_update = Number(obj["last_update"])
          const last_post = obj["last_post"].toString()
          const avatar = obj["avatar"].toString()
          const isSubscribed = Boolean(obj["isSubscribed"])
          const nodeChannelId = this.dataHelper.getKey(nodeId, channelId, 0, 0)

          array.push(nodeChannelId)
          i = i + 1
          let channel: FeedsData.Channels = {
            nodeId: nodeId,
            id: channelId,
            name: name,
            introduction: desc,
            owner_name: owner_name,
            owner_did: owner_did,
            subscribers: subscribers,
            last_update: last_update,
            last_post: last_post,
            avatar: avatar,
            isSubscribed: isSubscribed,
          }

          console.log('====query===nodeChannelId, channel=', nodeChannelId, channel);
          this.dataHelper.updateChannel(nodeChannelId, channel)
        })

        const list0 = this.dataHelper.getSubscribedFeedsList() //删除
        console.log("list0  ==== ", list0)//删除
        localStorage.setItem(userDid + HiveService.isSync, "true")
        localStorage.setItem(userDid + HiveService.createCollection, "true")
      }
      else if (feeds_logo_subscription === '' && feeds_logo_createCollection != '' && list.length > 0) {
        let vault = await this.getVault()
        await vault.getDatabaseService().insertMany(HiveService.collectName, list, new InsertOptions(false, true))
        console.log("方法 feeds_logo_subscription  ==== 2")//删除
        localStorage.setItem(userDid + HiveService.collectName, "true")
      }
      else if (feeds_logo_createCollection === '' && list.length > 0) {
        const status = await this.createCollection(userDid, list);
        console.log('status', status);
      }
    }
    catch (error) {
      console.log(error)
    }
  }

  async insertOne(one: any) {
    try {
      // 检测app启动时是否 备份成功
      let userDid = (await this.dataHelper.getSigninData()).did
      const feeds_subscription = localStorage.getItem(userDid + HiveService.collectName) || ''
      if (feeds_subscription === '') {
        this.backupSubscriptionToHive()
      }
      else {
        let vault = await this.getVault()
        let result = vault.getDatabaseService().insertOne(HiveService.collectName, one, new InsertOptions(false, true))
        console.log("insertOne successed: ", result)
      }
    }
    catch (error) {
      console.log("insertOne error: ", error)
    }
  }

  async deleteOne(one: any) {
    try {
      let userDid = (await this.dataHelper.getSigninData()).did
      const feeds_subscription = localStorage.getItem(userDid + HiveService.collectName) || ''
      if (feeds_subscription === '') {
        // 如果本地没有本分成功，则直接返回，不做处理
        this.backupSubscriptionToHive()
      }
      else {
        let vault = await this.getVault()
        let result = vault.getDatabaseService().deleteOne(HiveService.collectName, one)
        console.log("deleteOne success === ", result)
      }
    } catch (error) {
      console.log("deleteOne error: ", error)
    }
  }

  async updateOne(origin: FeedsData.Channels, update: FeedsData.Channels) {
    try {
      let userDid = (await this.dataHelper.getSigninData()).did
      const feeds_subscription = localStorage.getItem(userDid + HiveService.collectName) || ''

      if (feeds_subscription === '') {
        // 如果本地没有本分成功，则直接返回，不做处理
        this.backupSubscriptionToHive()
      }
      else {
        let vault = await this.getVault()
        let updateNode = { "$set": update }
        let result = vault.getDatabaseService().updateOne(HiveService.collectName, origin, updateNode, new UpdateOptions(false, true))
        console.log("updateOne success === ", result)
      }
    } catch (error) {
      console.log("updateOne error: ", error)
    }
  }

  async getEssAvatar() {
    try {
      let scriptingService: ScriptingService
      const vault = await this.getVault()
      scriptingService = vault.getScriptingService()
      const result = await scriptingService.callScript(this.avatarScriptName, this.avatarParam, this.tarDID, this.tarAppDID)
      const transaction_id = result["download"]["transaction_id"]
      let self = this

      let userDid = (await this.dataHelper.getSigninData()).did
      let dataBuffer = await scriptingService.downloadFile(transaction_id);
      const imgstr = dataBuffer.toString()

      const savekey = userDid + "_ess_avatar"
      const rawImage = rawImageToBase64DataUrl(dataBuffer)
      self.dataHelper.saveUserAvatar(savekey, rawImage)
      await this.backupSubscriptionToHive()
    }
    catch (error) {
      console.log("getEssAvatar error: ", error)
    }
  }

  async uploadCustomeAvatar(remotePath: string, img: any) {
    try {
      const vault = await this.getVault()
      const fileService = vault.getFilesService()
      const file = await fileService.upload(remotePath, Buffer.from(img, 'utf8'))
    }
    catch (error) {
      console.log("fileService upload error: ", error)
    }
  }

  async download(remotePath: string) {
    try {
      const vault = await this.getVault()
      const fileService = vault.getFilesService()
      let self = this
      let userDid = (await this.dataHelper.getSigninData()).did
      let dataBuffer = await fileService.download(remotePath)
      const imgstr = dataBuffer.toString()
    } catch (error) {
      console.log("fileService download error: ", error)
    }
  }

  createCollection(userDid: string, list: FeedsData.Channels[]): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let vault = await this.getVault()
      // localStorage.setItem(userDid + HiveService.createCollection, "true")// 容错：拿不到error
      let createCollectionFlag = localStorage.getItem(userDid + HiveService.createCollection) || ""
      console.log('createCollection, index 111111111111');
      if (!createCollectionFlag) {
        console.log('createCollection, index 22222222');
        try {
          await vault.getDatabaseService().createCollection(HiveService.collectName)
          console.log('createCollection, index 3333333333');
          createCollectionFlag = "true";
          localStorage.setItem(userDid + HiveService.createCollection, createCollectionFlag)
        } catch (error) {
        }
      }

      if (!createCollectionFlag) {
        console.log('Collection not create');
        resolve('NotFinish');
        return;
      }

      try {
        console.log('createCollection, index 44444444444');
        await vault.getDatabaseService().insertMany(HiveService.collectName, list, new InsertOptions(false, true))
        console.log('createCollection, index 555555555555');
        localStorage.setItem(userDid + HiveService.collectName, "true")
        resolve('Finish');
      } catch (error) {
      }
    })

  }
}

interface Mime {
  mime: string;
  pattern: (number | undefined)[];
}

const imageMimes: Mime[] = [
  {
    mime: 'image/png',
    pattern: [0x89, 0x50, 0x4e, 0x47]
  },
  {
    mime: 'image/jpeg',
    pattern: [0xff, 0xd8, 0xff]
  },
  {
    mime: 'image/gif',
    pattern: [0x47, 0x49, 0x46, 0x38]
  },
  {
    mime: 'image/webp',
    pattern: [0x52, 0x49, 0x46, 0x46, undefined, undefined, undefined, undefined, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50],
  }
];

/**
 * Encodes a raw binary picture data into a base64 string.
 * Ex: âPNG   IHDR... ---> "iVe89...."
 */
export function rawImageToBase64(rawImageData: Buffer): string {
  if (!rawImageData)
    return null

  return Buffer.from(rawImageData).toString("base64")
}

/**
 * Converts a base64 encoded raw binary picture data into its original raw binary buffer.
 * Ex: "iVe89...." ---> âPNG   IHDR...
 */
export function base64ImageToBuffer(base64Picture: string): Buffer {
  return Buffer.from(base64Picture, "base64")
}

/**
 * Converts a raw binary picture data to a base64 data url usable on UI.
 * Ex: âPNG   IHDR... ---> "data:image/png;base64,iVe89...."
 */
export async function rawImageToBase64DataUrl(rawImageData: Buffer): Promise<string> {
  if (!rawImageData)
    return null;

  let mimeType = await pictureMimeType(rawImageData)
  if (!mimeType) {
    Logger.warn("picturehelper", "Unable to extract mime type from picture buffer. rawImageToBase64DataUrl() returns null picture.")
    return null
  }

  return "data:" + mimeType + ";base64," + rawImageToBase64(rawImageData)
}

/**
 * Returns a 1x1 px fully transparent picture, encoded as base64 data url.
 * Use https://png-pixel.com/ to generate.
 */
export function transparentPixelIconDataUrl(): string {
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
}

function isMime(bytes: Uint8Array, mime: Mime): boolean {
  return mime.pattern.every((p, i) => !p || bytes[i] === p)
}

/**
 * @param rawOrBase64ImageData Raw picture buffer, or base64 encoded raw picture (not a base64 data url)
 */
export function pictureMimeType(rawOrBase64ImageData: Buffer | string): Promise<string> {
  if (typeof rawOrBase64ImageData === "string")
    rawOrBase64ImageData = base64ImageToBuffer(rawOrBase64ImageData)

  const numBytesNeeded = Math.max(...imageMimes.map(m => m.pattern.length))
  const blob = new Blob([rawOrBase64ImageData.slice(0, numBytesNeeded)]) // Read the needed bytes of the file

  const fileReader = new FileReader()
  let p = new Promise<string>((resolve) => {
    fileReader.onloadend = e => {
      //console.log("DEBUG ONLOADEND", e);
      if (!e || !fileReader.result) {
        resolve(null)
        return
      }

      const bytes = new Uint8Array(fileReader.result as ArrayBuffer)

      const mime = imageMimes.find(mime => isMime(bytes, mime))

      if (!mime)
        resolve(null)
      else
        resolve(mime.mime)
    };
  });

  fileReader.readAsArrayBuffer(blob)

  return p
}