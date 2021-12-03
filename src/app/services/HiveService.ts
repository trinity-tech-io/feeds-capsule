import { Injectable } from '@angular/core';
// import { HiveException, VaultServices, AppContext, Logger, Utils, File, AppContextParameters, DefaultAppContextProvider, VaultSubscriptionService} from "@elastosfoundation/elastos-hive-js-sdk";
import { HiveException, VaultServices, AppContext, Logger, Utils, File, AppContextParameters, DefaultAppContextProvider, VaultSubscriptionService} from "@dchagastelles/elastos-hive-js-sdk";
import { Claims, DIDDocument, JWTParserBuilder, DID, DIDBackend, DefaultDIDAdapter} from '@elastosfoundation/did-js-sdk';
import { AppDID } from './appdid';
import { UserDID } from './userdid';
import { StandardAuthService } from 'src/app/services/StandardAuthService';
import { Console } from 'console';
import { resolve } from 'url';
import { FileService } from 'src/app/services/FileService';

@Injectable()
export class HiveService {

  public static readonly USER_DIR = process.env["HIVE_USER_DIR"] ? process.env["HIVE_USER_DIR"] : "/home/diego/temp"

  private static LOG = new Logger("HiveService");
  private static readonly RESOLVE_CACHE = "data/didCache";
  private static INSTANCE: HiveService;

  private userDid: UserDID;
  private callerDid: UserDID;
  private appInstanceDid: AppDID;
  public context: AppContext;
  private callerContext: AppContext;
  private clientConfig: any;
  private userDir: string;

  constructor(
    private standardAuth: StandardAuthService,
    private fileService: FileService,
    ) {
  }

  public static getUniqueName(prefix: string) {
    return `${prefix}_${Date.now().toString()}`;
  }

  public static async getInstance(testName: string, clientConfig: any, userDir?: string): Promise<HiveService> {
    Utils.checkNotNull(clientConfig, "Test configuration cannot be empty");
    Utils.checkNotNull(clientConfig.node, "A valid test configuration is mandatory");
    if (!userDir) {
      userDir = HiveService.USER_DIR;
    }
    if (!HiveService.INSTANCE) {
      HiveService.LOG.info("***** Running {} using '{}' configuration *****", testName, clientConfig.node.storePath);
      HiveService.LOG.info("***** Data directory: '{}' *****", userDir);
      // HiveService.INSTANCE = new HiveService(clientConfig, userDir);
      // await HiveService.INSTANCE.init();
    }
    return HiveService.INSTANCE;
  }

  public getLocalStorePath(): string {
    return this.userDir + File.SEPARATOR + "data/store" + File.SEPARATOR;
  }

  public getAppContext(): AppContext {
    return this.context;
  }

  public getProviderAddress(): string {
    return this.clientConfig.node.provider;
  }

  public newVault(): VaultServices {
    return new VaultServices(this.context, this.getProviderAddress());
  }

  public async create() {
    DIDBackend.initialize(new DefaultDIDAdapter("testnet"))
    AppContext.setupResolver("testnet", "data/didcache")
    const rootDirEntry = await this.fileService.resolveLocalFileSystemURL()
    const path = rootDirEntry.fullPath
    let appContextParameters = {
        storePath: "/data/store/app1",
        appDID: "did:elastos:imMY7uHc5WCDUhWCVaH5MtFFCBMegCaEYH", 
        appMnemonics: "wash busy tell relief street maximum dumb fat legend end panic warrior", 
        appPhrasePass: "password",
        appStorePass: "password",
        userDID: "did:elastos:imedtHyjLS155Gedhv7vKP3FTWjpBUAUm4", 
        userMnemonics: "firm dash language credit twist puzzle crouch order slim now issue trap",
        userPhrasePass: "secret",
        userStorePass: "password"
    } as AppContextParameters
// TEST
  //   let appContextParameters = {
  //     storePath: "/data/store/feedsapp",
  //     appDID: "did:elastos:iYJ612Q4qyLRPnMTVgGZNAycDNWbdu4DE6", 
  // did:elastos:iXQQAGGiwicpeEf4ADCXE3AztRhjMgK2KC
  //     appMnemonics: "famous ship loop baby nature wine cannon wool swift misery injury eternal", 
  //     appPhrasePass: "password",
  //     appStorePass: "password",
  //     userDID: "did:elastos:ijH8kd7RgbyCKBqcWpFmpTYdYiveTvZEXt", 
  //     userMnemonics: "leopard net accuse weather arrow siege movie cheap true smoke love twist",
  //     userPhrasePass: "secret",
  //     userStorePass: "password"
  // } as AppContextParameters

    try{
        let appProvider = await DefaultAppContextProvider.create(appContextParameters)
        console.log("create =========== 0")
        let appContext = await AppContext.build(appProvider, appContextParameters.userDID as string)
        console.log("create =========== 1")

        let vaultSubscriptionService = new VaultSubscriptionService(appContext, "https://hive-testnet1.trinity-tech.io:443")
        console.log("create =========== 2")
        let vaultInfo = await vaultSubscriptionService.subscribe()
        console.log(vaultInfo)
        console.log("create =========== 3")
    } catch(e){
        console.debug(e);
    }
  }

  public async creat(appInstanceDocumentString: string, userDidString: string, resolverUrl: string): Promise<AppContext>{
    return new Promise(async (resolve, reject) => {
      try {
        Logger.setDefaultLevel(Logger.TRACE);
        console.log("appInstanceDocumentString ==== ")
        console.log(appInstanceDocumentString)
        console.log("userDidString ==== ")
        console.log(userDidString)
      let userDirFile = new File(this.userDir);
      userDirFile.delete();
      DIDBackend.initialize(new DefaultDIDAdapter("mainnet"))
      AppContext.setupResolver("mainnet", HiveService.RESOLVE_CACHE);
      console.log("AppContext.setupResolver")
                               
      // TODO: appinstance did
      // TODO: user did
      const rootDirEntry = await this.fileService.resolveLocalFileSystemURL();
      const path = rootDirEntry.fullPath
      //Application Context
      let self = this ;    
      this.context = await AppContext.build({
        getLocalDataDir(): string {
          console.log("path =============== ", path)
          return  path
        },
        getAppInstanceDocument(): Promise<DIDDocument> {
          return new Promise(async (resolve, reject) => {
            try {
              let appInstanceDidDocument = DIDDocument._parseOnly(appInstanceDocumentString)
              console.log("appInstanceDidDocument ===== ", appInstanceDidDocument)
              resolve(appInstanceDidDocument)
               } catch (e) {
                HiveService.LOG.debug("HiveService.getAppInstanceDocument Error {}", e);
                HiveService.LOG.error(e.stack);
                reject(e)
                }
          })
        },
        getAuthorization(jwtToken: string): Promise<string> {
          return new Promise(async (resolve, reject) => {
            try {
              HiveService.LOG.debug("jwtToken ========== {}", jwtToken)
              const authToken = await this.standardAuth.generateHiveAuthPresentationJWT(jwtToken) 
              resolve(authToken)
            } catch (error) {
              reject(error)
              }
          })
        }
      }, userDidString);
      resolve(this.context)
      } catch (error) {
      reject(error)
      }
    })
  }

  public getAppDid(): string {
    return this.appInstanceDid.getAppDid();
  }

  public getUserDid(): string {
    return this.userDid.toString();
  }

  public getCallerDid(): string {
    return this.callerDid.toString();
  }

}
