import { Injectable } from '@angular/core';
import { FilesService, ScriptingService, QueryHasResultCondition, Executable, InsertOptions, File as HiveFile, StreamResponseParser, InsertExecutable, FileUploadExecutable, HiveException, VaultServices, AppContext, Logger as HiveLogger, Utils, File, AppContextParameters, DefaultAppContextProvider, VaultSubscriptionService, UpdateResult, UpdateOptions} from "@dchagastelles/elastos-hive-js-sdk";
import { Claims, DIDDocument, JWTParserBuilder, DID, DIDBackend, DefaultDIDAdapter} from '@elastosfoundation/did-js-sdk';
import { StandardAuthService } from 'src/app/services/StandardAuthService';
import { Console } from 'console';
import { resolve } from 'url';
import { FileService } from 'src/app/services/FileService';
import { Logger } from 'src/app/services/logger';
import { DataHelper } from 'src/app/services/DataHelper';
import { InsertResult } from '@dchagastelles/elastos-hive-js-sdk/typings/restclient/database/insertresult';
import { isNil } from 'lodash';
import { on } from 'process';

let TAG: string = 'feeds-HiveService';

@Injectable()
export class HiveService {
  private static readonly RESOLVE_CACHE = "data/didCache"
  private static INSTANCE: HiveService
  public context: AppContext

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

  async getVault() {
    // auth
    let appinstanceDocument = await this.standardAuthService.getInstanceDIDDoc()
    let userDid =  (await this.dataHelper.getSigninData()).did

    const resolverUrl = "https://api.elastos.io/eid"
    let context = await this.creat(appinstanceDocument, userDid, resolverUrl)
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
    const param = data.substr(prefix.length)
    const parts = param.split("/")
    // TODO 验证parts是否大于2个 ，否则 抛出异常
    const dids = parts[0].split("@")
    // TODO 验证dids是否等于2个 ，否则 抛出异常
    const star = data.length - (prefix.length + parts[0].length + 1)
    const values = parts[1].split("?")
    // TODO 验证values是否等于2个 ，否则 抛出异常
    const scriptName = values[0]
    const paramStr = values[1]
    const scriptParam = JSON.parse(paramStr.substr(7))

    // 创建
    const tarDID = dids[0]
    const tarAppDID = dids[1]
    const vaultSubscription: VaultSubscriptionService = new VaultSubscriptionService(context, provider)
    const vault = new VaultServices(context, provider)

    return vault
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
          console.log("backupSubscriptionToHive error")
        })
      }
      let vault = null
      this.getVault().then(async (v:VaultServices) => {
        vault = v
        return vault.getDatabaseService().createCollection(collectName)
      })
      .then(async() => {
        localStorage.setItem(createCollection, createCollection)
        return vault.getDatabaseService().insertMany(collectName, list, new InsertOptions(false, true))
      })
      .then(async (result: InsertResult) => {
        localStorage.setItem(collectName, "true")
      })
      .catch((error)=>{
        console.log("backupSubscriptionToHive error")
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
       console.log("backupSubscriptionToHive error")
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
      .then((result: number) => {
        console.log("deleteOne success === ", result)
      })
      .catch((error)=>{
        console.log("backupSubscriptionToHive error")
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
        console.log("deleteOne success === ", result)
      })
      .catch((error)=>{
        console.log("backupSubscriptionToHive error")
      })
    }
  }
}
