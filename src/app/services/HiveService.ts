import { Injectable } from '@angular/core';
// import { HiveException, VaultServices, AppContext, Logger, Utils, File, AppContextParameters, DefaultAppContextProvider, VaultSubscriptionService} from "@elastosfoundation/elastos-hive-js-sdk";
import { HiveException, VaultServices, AppContext, Logger as HiveLogger, Utils, File, AppContextParameters, DefaultAppContextProvider, VaultSubscriptionService} from "@dchagastelles/elastos-hive-js-sdk";
import { Claims, DIDDocument, JWTParserBuilder, DID, DIDBackend, DefaultDIDAdapter} from '@elastosfoundation/did-js-sdk';
import { StandardAuthService } from 'src/app/services/StandardAuthService';
import { Console } from 'console';
import { resolve } from 'url';
import { FileService } from 'src/app/services/FileService';
import { Logger } from 'src/app/services/logger';
let TAG: string = 'feeds-HiveService';

@Injectable()
export class HiveService {
  private static readonly RESOLVE_CACHE = "data/didCache"
  private static INSTANCE: HiveService
  public context: AppContext

  constructor(
    private standardAuth: StandardAuthService,
    private fileService: FileService,
    ) {
  }

  public static getUniqueName(prefix: string) {
    return `${prefix}_${Date.now().toString()}`
  }

  public async creat(appInstanceDocumentString: string, userDidString: string, resolverUrl: string): Promise<AppContext>{
    return new Promise(async (resolve, reject) => {
      try {
      HiveLogger.setDefaultLevel(HiveLogger.TRACE)
      DIDBackend.initialize(new DefaultDIDAdapter("mainnet"))
      AppContext.setupResolver("mainnet", HiveService.RESOLVE_CACHE)

      const rootDirEntry = await this.fileService.resolveLocalFileSystemURL()
      const path = rootDirEntry.fullPath
      //Application Context
      let self = this ;    
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
              const authToken = await self.standardAuth.generateHiveAuthPresentationJWT(jwtToken) 
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
}
