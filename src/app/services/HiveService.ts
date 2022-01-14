import { Injectable } from '@angular/core';
import { FilesService, ScriptingService, QueryHasResultCondition, Executable, InsertOptions, File as HiveFile, StreamResponseParser, InsertExecutable, FileUploadExecutable, HiveException, VaultServices, AppContext, Logger as HiveLogger, Utils, File, AppContextParameters, DefaultAppContextProvider, VaultSubscriptionService, UpdateResult, UpdateOptions, HttpClient} from "@dchagastelles/elastos-hive-js-sdk";
import { Claims, DIDDocument, JWTParserBuilder, DID, DIDBackend, DefaultDIDAdapter, JSONObject} from '@elastosfoundation/did-js-sdk';
import { StandardAuthService } from 'src/app/services/StandardAuthService';
import { Console } from 'console';
import { resolve } from 'url';
import { FileService } from 'src/app/services/FileService';
import { Logger } from 'src/app/services/logger';
import { DataHelper } from 'src/app/services/DataHelper';
import { InsertResult} from '@dchagastelles/elastos-hive-js-sdk/typings/restclient/database/insertresult';
import { isEqual, isNil } from 'lodash';
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
  public avatarParam : string
  public avatarScriptName: string
  public image = null

  constructor(
    private standardAuthService: StandardAuthService,
    private fileService: FileService,
    private dataHelper: DataHelper,
    ) {
  }

  public async creat(appInstanceDocumentString: string, userDidString: string, resolverUrl: string): Promise<AppContext>{
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
          return  path
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
    // auth
    let appinstanceDocument = await this.standardAuthService.getInstanceDIDDoc()
    let userDid =  (await this.dataHelper.getSigninData()).did

    const resolverUrl = "https://api.elastos.io/eid"
    if (this.context == null) {
      this.context = await this.creat(appinstanceDocument, userDid, resolverUrl)
    }
    // userdid : "did:elastos:ikHP389FhssAADnUwM3RFF415F1wviZ8CC"
    const userDID =  DID.from(userDid)
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

  async getVault() {
    if (this.vault == null) {
      await this.creatVault()
    }
    return this.vault
  }

 async backupSubscriptionToHive() {
  console.log("list  ==== 1111")

  const list = this.dataHelper.getSubscribedFeedsList()
  console.log("list  ==== ", list)

  const feeds_logo_subscription = localStorage.getItem(HiveService.collectName) || '' 
  const feeds_logo_createCollection = localStorage.getItem(HiveService.createCollection) || '' 
  const isSync = localStorage.getItem(HiveService.isSync) || '' 

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
      // console.log("i = " + i + " nodeChannelId = " + nodeChannelId)
      /*
      avatar: "assets/images/profile-2.svg"
      id: 1
      introduction: "Feeds team official account"
      isSubscribed: true
      last_post: ""
      last_update: 1631809522000
      name: "Feeds Help"
      nodeId: "YDQTAJLcYgi1BYsh6qxLFihVrx39Xta4VhxHpfBwVMF"
      owner_did: "did:elastos:iUiJQ5FFTeaUwG77PdihuASGSqQSqP7uWL"
      owner_name: "Feeds-dev"
      subscribers: 444
      */
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
        this.dataHelper.updateChannel(nodeChannelId, channel)
    })

    const list0 = this.dataHelper.getSubscribedFeedsList() //删除
    console.log("list0  ==== ", list0)//删除
    localStorage.setItem(HiveService.isSync, "true")
    localStorage.setItem(HiveService.createCollection, "true")
  }
  else if (feeds_logo_subscription === '' && list.length > 0){
    console.log("方法 feeds_logo_subscription  ==== 0")//删除
    let vault = await this.getVault()
    console.log("方法 feeds_logo_subscription  ==== 1")//删除
    await vault.getDatabaseService().insertMany(HiveService.collectName, list, new InsertOptions(false, true))
    console.log("方法 feeds_logo_subscription  ==== 2")//删除
    localStorage.setItem(HiveService.collectName, "true")
  }
  else if (feeds_logo_createCollection === '' && list.length > 0) {
    console.log("方法 feeds_logo_createCollection  ==== 0")//删除
        let vault = await this.getVault()
        console.log("方法 feeds_logo_createCollection  ==== 1")//删除
        localStorage.setItem(HiveService.createCollection, "true")// 容错：拿不到error
        await vault.getDatabaseService().createCollection(HiveService.collectName)
        console.log("方法 feeds_logo_createCollection  ==== 2")//删除
        localStorage.setItem(HiveService.createCollection, "true")
        await vault.getDatabaseService().insertMany(HiveService.collectName, list, new InsertOptions(false, true))
        console.log("方法 feeds_logo_createCollection  ==== 3")//删除
        localStorage.setItem(HiveService.collectName, "true")
  }
 }

  insertOne(one: any) {
    // 检测app启动时是否 备份成功
    const feeds_subscription = localStorage.getItem(HiveService.collectName) || '' 
    if (feeds_subscription === '') {
      this.backupSubscriptionToHive()
    }
    else {
      this.getVault().then(async (vault:VaultServices) => {
        return vault.getDatabaseService().insertOne(HiveService.collectName, one, new InsertOptions(false, true))
      })
      .then((result: InsertResult) => {
        console.log("insertOne successed")
      })
      .catch((error)=>{
       console.log("insertOne error: ", error)
      })
    }
  }

  deleteOne(one: any) {
    const feeds_subscription = localStorage.getItem(HiveService.collectName) || '' 
    if (feeds_subscription === '') {
      // 如果本地没有本分成功，则直接返回，不做处理
      this.backupSubscriptionToHive()
    }
    else {
      this.getVault().then(async (vault:VaultServices) => {
        return vault.getDatabaseService().deleteOne(HiveService.collectName, one)
     })
      .then((result: void) => {
        console.log("deleteOne success === ", result)
      })
      .catch((error)=>{
        console.log("deleteOne error: ", error)
      })
    }
  }

  updateOne(origin: FeedsData.Channels, update: FeedsData.Channels) {
    const feeds_subscription = localStorage.getItem(HiveService.collectName) || '' 
    if (feeds_subscription === '') {
      // 如果本地没有本分成功，则直接返回，不做处理
      this.backupSubscriptionToHive()
    }
    else {
      this.getVault().then(async (vault:VaultServices) => {
        let updateNode = { "$set": update }
        // 参数有误
        return vault.getDatabaseService().updateOne(HiveService.collectName, origin, updateNode, new UpdateOptions(false, true))
     })
      .then((result: UpdateResult) => {
        console.log("updateOne success === ", result)
      })
      .catch((error)=>{
        console.log("updateOne error: ", error)
      })
    }
  }

  async getEssAvatar() {
    let scriptingService: ScriptingService
    const vault = await this.getVault()
    scriptingService = vault.getScriptingService()
    const result = await scriptingService.callScript(this.avatarScriptName, this.avatarParam, this.tarDID, this.tarAppDID)
    const transaction_id = result["download"]["transaction_id"]
    let self = this   

    let userDid =  (await this.dataHelper.getSigninData()).did
    let dataBuffer = await scriptingService.downloadFile(transaction_id);
    const imgstr = dataBuffer.toString()

    const savekey = userDid + "_ess_avatar"
    const rawImage =  rawImageToBase64DataUrl(dataBuffer)
    self.dataHelper.saveUserAvatar(savekey, rawImage)
    await this.backupSubscriptionToHive()
  }
  
  async uploadCustomeAvatar(remotePath: string, img: any){
    const vault = await this.getVault()
    const fileService = vault.getFilesService()
    const file = await fileService.upload(remotePath, Buffer.from(img, 'utf8'))
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

  return "data:"+mimeType+";base64,"+rawImageToBase64(rawImageData)
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