import { Injectable } from '@angular/core';
import { FilesService, ScriptingService, QueryHasResultCondition, Executable, InsertOptions, File as HiveFile, StreamResponseParser, InsertExecutable, FileUploadExecutable, HiveException, VaultServices, AppContext, Logger as HiveLogger, Utils, File, AppContextParameters, DefaultAppContextProvider, VaultSubscriptionService, UpdateResult, UpdateOptions, HttpClient} from "@dchagastelles/elastos-hive-js-sdk";
import { Claims, DIDDocument, JWTParserBuilder, DID, DIDBackend, DefaultDIDAdapter} from '@elastosfoundation/did-js-sdk';
import { StandardAuthService } from 'src/app/services/StandardAuthService';
import { Console } from 'console';
import { resolve } from 'url';
import { FileService } from 'src/app/services/FileService';
import { Logger } from 'src/app/services/logger';
import { DataHelper } from 'src/app/services/DataHelper';
import { InsertResult} from '@dchagastelles/elastos-hive-js-sdk/typings/restclient/database/insertresult';
import { isNil } from 'lodash';
import { on } from 'process';

let TAG: string = 'feeds-HiveService';

@Injectable()
export class HiveService {
  private static readonly RESOLVE_CACHE = "data/didCache"
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
    const sub = cre.getSubject()
    const pro = sub.getProperty("avatar")
    const data: string = pro["data"]
    const type = pro["type"]

    const serviceDid = userDid + "#hivevault"
    const service = userDiddocument.getService(serviceDid)
    const provider = service.getServiceEndpoint() + ":443" 
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
    const vaultSubscription: VaultSubscriptionService = new VaultSubscriptionService(this.context, provider)
    this.vault = new VaultServices(this.context, provider)
  }

  async getVault() {
    if (this.vault == null) {
      await this.creatVault()
    }
    return this.vault
  }

  backupSubscriptionToHive() {
    // const vault = await this.getVault()
    // const databaseService = vault.getDatabaseService()

    const collectName = "feeds_subscription"
    const createCollection = "feeds_subscription_createCollection"
    const list = this.dataHelper.getSubscribedFeedsList()
    console.log("list ==== ", list)
    const feeds_subscription = localStorage.getItem(collectName) || '' 
    if (feeds_subscription === '') {
      // 只能创建一次，先用本地标识查询是否创建过create（因为接不到error信息）
      const collectionName = localStorage.getItem(createCollection) || '' 
      if (collectionName === createCollection) {
        this.getVault().then(async (vault:VaultServices) => {
          return vault.getDatabaseService().insertMany(collectName, list, new InsertOptions(false, true))
        })
        .then((result: InsertResult) => {

        })
        .catch((error)=>{
          console.log("backupSubscriptionToHive error - 1")
        })
      }
      let vault = null
      this.getVault().then(async (v:VaultServices) => {
        vault = v
        localStorage.setItem(createCollection, createCollection)
        // return vault.getDatabaseService().createCollection(collectName)
        return
      })
      .then(async() => {
        localStorage.setItem(createCollection, createCollection)
        return vault.getDatabaseService().insertMany(collectName, list, new InsertOptions(false, true))
      })
      .then(async (result: InsertResult) => {
        localStorage.setItem(collectName, "true")
      })
      .catch((error)=>{
        console.log("backupSubscriptionToHive error - 2")
      })
    }
  }

  insertOne(one: any) {
    const collectName = "feeds_subscription"
    const createCollection = "feeds_subscription_createCollection"
    // 检测app启动时是否 备份成功
    const feeds_subscription = localStorage.getItem(collectName) || '' 
    if (feeds_subscription === '') {
      this.backupSubscriptionToHive()
    }
    else {
      this.getVault().then(async (vault:VaultServices) => {
        return vault.getDatabaseService().insertOne(collectName, one, new InsertOptions(false, true))
      })
      .then((result: InsertResult) => {

      })
      .catch((error)=>{
       console.log("backupSubscriptionToHive error - 3")
      })
    }
  }

  deleteOne(one: any) {
    const collectName = "feeds_subscription"
    const createCollection = "feeds_subscription_createCollection"
    const feeds_subscription = localStorage.getItem(collectName) || '' 
    if (feeds_subscription === '') {
      // 如果本地没有本分成功，则直接返回，不做处理
      this.backupSubscriptionToHive()
    }
    else {
      this.getVault().then(async (vault:VaultServices) => {
        return vault.getDatabaseService().deleteOne(collectName, one)
     })
      .then((result: void) => {
        console.log("deleteOne success === ", result)
      })
      .catch((error)=>{
        console.log("backupSubscriptionToHive error - 4")
      })
    }
  }

  updateOne(origin: FeedsData.Channels, update: FeedsData.Channels) {
    const collectName = "feeds_subscription"
    const createCollection = "feeds_subscription_createCollection"
    const feeds_subscription = localStorage.getItem(collectName) || '' 
    if (feeds_subscription === '') {
      // 如果本地没有本分成功，则直接返回，不做处理
      this.backupSubscriptionToHive()
    }
    else {
      this.getVault().then(async (vault:VaultServices) => {
        let updateNode = { "$set": update }
        // 参数有误
        return vault.getDatabaseService().updateOne(collectName, origin, updateNode, new UpdateOptions(false, true))
     })
      .then((result: UpdateResult) => {
        console.log("updateOne success === ", result)
      })
      .catch((error)=>{
        console.log("backupSubscriptionToHive error - 5")
      })
    }
  }

/*
  getEssAvatar(){
    let scriptingService: ScriptingService
    this.getVault().then(async (vault: VaultServices) => {
      scriptingService = vault.getScriptingService()
      return scriptingService.callScript(this.avatarScriptName, this.avatarParam, this.tarDID, this.tarAppDID)
    }).then(async (result: any) => {
      const transaction_id = result["download"]["transaction_id"]
      console.log("transaction_id ==== ", transaction_id)
      return scriptingService.downloadFile(transaction_id)
    }).then((result: any)=>{
      console.log("getEssAvatar success")
    })
    .catch((error)=>{
      console.log("getEssAvatar error - 5")
    })
  }*/

  async getEssAvatar() {
    let scriptingService: ScriptingService
    const vault = await this.getVault()
    scriptingService = vault.getScriptingService()
    const result = await scriptingService.callScript(this.avatarScriptName, this.avatarParam, this.tarDID, this.tarAppDID)
    const transaction_id = result["download"]["transaction_id"]
    console.log("transaction_id ==== ", transaction_id)
    let self = this   

    let dataBuffer = Buffer.from("");
    let userDid =  (await this.dataHelper.getSigninData()).did
    await scriptingService.downloadFile(transaction_id, {
      onData(chunk: any): void {
        // self.image = chunk
        self.image = chunk
        console.log("chunk type === ", typeof(chunk))
        console.log("chunk length === ", chunk.length)
        console.log("chunk === ", chunk)
        console.log("image === ", self.image)
        dataBuffer = Buffer.concat([dataBuffer, Buffer.from(chunk)]);

        console.log("dataBuffer === ", dataBuffer)
        const key = userDid + "_ess_avatar" 
        console.log("avatar_key === ", key)

        self.dataHelper.saveUserAvatar(key, dataBuffer)

        // self.dataHelper.saveUserAvatar(this.userDid + "_ess_avatar" , self.image);
			},
			onEnd(): void {
        console.log("onEnd ++++++++++++++++++ end")
        return
			}
    } as StreamResponseParser)

  //   await scriptingService.downloadFile(transaction_id).then(res => {
  //     console.log(`get the downloaded file content: ${res}`)
  //     self.image = res
  //     console.log("scriptingService === self.image", self.image)

  // })

    // console.log("return self.image === ", self.image)
  console.log("return dataBuffer === ", dataBuffer)
  console.log("return image === ", self.image)

    return rawImageToBase64DataUrl(dataBuffer)
  
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
    return null;

    return Buffer.from(rawImageData).toString("base64");
}

/**
 * Converts a base64 encoded raw binary picture data into its original raw binary buffer.
 * Ex: "iVe89...." ---> âPNG   IHDR...
 */
export function base64ImageToBuffer(base64Picture: string): Buffer {
  return Buffer.from(base64Picture, "base64");
}

/**
 * Converts a raw binary picture data to a base64 data url usable on UI.
 * Ex: âPNG   IHDR... ---> "data:image/png;base64,iVe89...."
 */
export async function rawImageToBase64DataUrl(rawImageData: Buffer): Promise<string> {
  console.log("rawImageToBase64DataUrl === " + rawImageData)
  if (!rawImageData)
    return null;
    console.log("rawImageToBase64DataUrl")

  let mimeType = pictureMimeType(rawImageData);
  console.log("rawImageToBase64DataUrl" + mimeType)
  if (!mimeType) {
    Logger.warn("picturehelper", "Unable to extract mime type from picture buffer. rawImageToBase64DataUrl() returns null picture.");
    return null;
  }
  console.log("rawImageToBase64DataUrl" + rawImageToBase64(rawImageData))

  return "data:"+mimeType+";base64,"+rawImageToBase64(rawImageData);
}

/**
 * Returns a 1x1 px fully transparent picture, encoded as base64 data url.
 * Use https://png-pixel.com/ to generate.
 */
export function transparentPixelIconDataUrl(): string {
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
}

function isMime(bytes: Uint8Array, mime: Mime): boolean {
  return mime.pattern.every((p, i) => !p || bytes[i] === p);
}

/**
 * @param rawOrBase64ImageData Raw picture buffer, or base64 encoded raw picture (not a base64 data url)
 */
export function pictureMimeType(rawOrBase64ImageData: Buffer | string): Promise<string> {
  if (typeof rawOrBase64ImageData === "string")
    rawOrBase64ImageData = base64ImageToBuffer(rawOrBase64ImageData);

  const numBytesNeeded = Math.max(...imageMimes.map(m => m.pattern.length));
  const blob = new Blob([rawOrBase64ImageData.slice(0, numBytesNeeded)]); // Read the needed bytes of the file

  const fileReader = new FileReader();
  let p = new Promise<string>((resolve) => {
    fileReader.onloadend = e => {
      //console.log("DEBUG ONLOADEND", e);
      if (!e || !fileReader.result) {
        resolve(null);
        return;
      }

      const bytes = new Uint8Array(fileReader.result as ArrayBuffer);

      const mime = imageMimes.find(mime => isMime(bytes, mime));

      if (!mime)
        resolve(null);
      else
        resolve(mime.mime);
    };
  });

  fileReader.readAsArrayBuffer(blob);

  return p;
}