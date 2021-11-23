import { Injectable } from '@angular/core';
import { HiveException, VaultServices, AppContext, Logger, Utils, File } from "@elastosfoundation/elastos-hive-js-sdk";
import { Claims, DIDDocument, JWTParserBuilder, DID } from '@elastosfoundation/did-js-sdk';
import { AppDID } from './appdid';
import { UserDID } from './userdid';
import { StandardAuthService } from 'src/app/services/StandardAuthService';

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

  public async init(appInstanceDidString: string, userDidString: string, resolverUrl: string): Promise<HiveService> {

    let userDirFile = new File(this.userDir);
    userDirFile.delete();

    AppContext.setupResolver(resolverUrl, HiveService.RESOLVE_CACHE);

    // TODO: appinstance did
    // TODO: user did

    //Application Context
    let self = this;
    this.context = await AppContext.build({

      getLocalDataDir(): string {
        console.log(self.getLocalStorePath())
        return self.getLocalStorePath();
      },


      async getAppInstanceDocument(): Promise<DIDDocument> {
        try {
          HiveService.LOG.debug("appInstanceDidString ==== {}", appInstanceDidString)
          let appinstanceDid = new DID(appInstanceDidString)
          HiveService.LOG.debug("appinstanceDid === {}", appinstanceDid)

          let appinstanceDidDocument = await appinstanceDid.resolve()
          HiveService.LOG.debug("appinstanceDidDocument === {}", )

          HiveService.LOG.debug("getAppInstanceDocument ======= {}", appinstanceDidDocument.toString())
          return await appinstanceDid.resolve()
        } catch (e) {
          HiveService.LOG.debug("HiveService.getAppInstanceDocument Error {}", e);
          HiveService.LOG.error(e.stack);
        }
        

        return null;
      },

      async getAuthorization(jwtToken: string): Promise<string> {
        HiveService.LOG.debug("jwtToken ========== {}", jwtToken)
        HiveService.LOG.debug("jwtToken ========== {}", jwtToken)

        HiveService.LOG.debug("jwtToken ========== {}", jwtToken)
        HiveService.LOG.debug("jwtToken ========== {}", jwtToken)
        HiveService.LOG.debug("jwtToken ========== {}", jwtToken)
        HiveService.LOG.debug("jwtToken ========== {}", jwtToken)

        return await this.standardAuth.generateHiveAuthPresentationJWT(jwtToken)
      }
    }, userDidString);

    return this;
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
