import { Injectable } from '@angular/core';
import { DID } from '@elastosfoundation/elastos-connectivity-sdk-cordova';
import { StorageService } from 'src/app/services/StorageService';
import { Logger } from './logger';
import { DataHelper } from 'src/app/services/DataHelper';
import { Events } from 'src/app/services/events.service';

declare let didManager: DIDPlugin.DIDManager;
let TAG: string = 'StandardAuthService';

@Injectable()
export class StandardAuthService {
  private appIdCredential: DIDPlugin.VerifiableCredential = null;
  private appInstanceDID: DIDPlugin.DID
  private appInstanceDIDInfo: {
    storeId: string;
    didString: string;
    storePassword: string;
  }
  constructor(
    private storeService: StorageService,
    private dataHelper: DataHelper,
    private events: Events
  ) {}

  getCredentials(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let didAccess = new DID.DIDAccess();
      let params = {
        claims: {
          name: true,
          avatar: {
            required: false,
            reason: 'For profile picture',
          },
          email: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
          gender: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
          telephone: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
          nation: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
          nickname: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
          description: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
          interests: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
        },
      };
      try {
        let presentation = await didAccess.getCredentials(params);
        Logger.log(TAG, 'Got credentials result, presentation is', presentation);
        if (presentation) {
          resolve(presentation);
          Logger.log(TAG, 'Got credentials:', presentation);
        } else {
          // alert(
          //   'Empty presentation returned, something wrong happened, or operation was cancelled',
          // );
          Logger.log(TAG, 'Empty ....', presentation);
        }
      } catch (error) {
        alert('error ' + JSON.stringify(error));
        Logger.log(TAG, 'error', error);
      }
    });
  }

  getInstanceDID(): Promise<DIDPlugin.DID> {
    return new Promise(async (resolve, reject) => {
      let didAccess = new DID.DIDAccess();
      let instanceDIDInfo = await didAccess.getOrCreateAppInstanceDID();
      resolve(instanceDIDInfo.did);
    });
  }

  getInstanceDIDDoc(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let didAccess = new DID.DIDAccess();
      let instanceDIDInfo = await didAccess.getOrCreateAppInstanceDID();
      instanceDIDInfo.didStore.loadDidDocument(
        instanceDIDInfo.did.getDIDString(),
        didDocument => {
          resolve(didDocument.toJson());
        },
      );
    });
  }

  generateAuthPresentationJWT(
    authChallengeJwttoken: string,
  ): Promise<FeedsData.StandardAuthResult> {
    return new Promise(async (resolve, reject) => {
      Logger.log(TAG, 'Starting process to generate auth presentation JWT, authChallengeJwttoken is ', authChallengeJwttoken);
      if (
        authChallengeJwttoken == null ||
        authChallengeJwttoken == undefined ||
        authChallengeJwttoken == ''
      ) {
        reject('Params error');
      }
      // Parse, but verify on chain that this JWT is valid first
      let parseResult: DIDPlugin.ParseJWTResult = null;
      try {
        parseResult = await didManager.parseJWT(true, authChallengeJwttoken);
      } catch (error) {
        Logger.error(TAG, 'Parse JWT error,', error);
      }
      Logger.log(TAG, 'Parse JWT Result is', parseResult);
      if (!parseResult) {
        reject('Parse jwt error, parse result null');
        return;
      }
      if (!parseResult.signatureIsValid) {
        // Could not verify the received JWT as valid - reject the authentication request by returning a null token
        reject(
          'The received authentication JWT token signature cannot be verified or failed to verify: ' +
            parseResult.errorReason +
            '. Is the back-end DID published? Are you on the right network?',
        );
        return;
      }

      // The request JWT must contain iss and nonce fields
      if (
        !('iss' in parseResult.payload) ||
        !('nonce' in parseResult.payload)
      ) {
        reject(
          'The received authentication JWT token does not contain iss or nonce',
        );
        return;
      }

      // Generate a authentication presentation and put the credential + back-end info such as nonce inside
      let nonce = parseResult.payload['nonce'] as string;
      let realm = parseResult.payload['iss'] as string;

      let name = (parseResult.payload['name'] as string) || '';
      let description = (parseResult.payload['description'] as string) || '';
      let elaAddress = (parseResult.payload['elaAddress'] as string) || '';

      Logger.log(TAG, 'Getting app instance DID');
      let didAccess = new DID.DIDAccess();
      let appInstanceDID = (await didAccess.getOrCreateAppInstanceDID()).did;
      let appInstanceDIDInfo = await didAccess.getExistingAppInstanceDIDInfo();
      //work around
      this.appIdCredential = await this.getAppIdCredentialFromStorage(
        this.appIdCredential,
      );

      this.appIdCredential = await this.checkAppIdCredentialStatus(
        this.appIdCredential,
      );

      Logger.log(TAG, 'AppIdCredential is ', this.appIdCredential);
      if (!this.appIdCredential) {
        Logger.warn(TAG, 'Empty app id credential');
        resolve(null);
        return;
      }

      // Create the presentation that includes back end challenge (nonce) and the app id credential.
      appInstanceDID.createVerifiablePresentation(
        [this.appIdCredential],
        realm,
        nonce,
        appInstanceDIDInfo.storePassword,
        async presentation => {
          if (presentation) {
            // Generate the back end authentication JWT
            Logger.log(TAG,
              'Opening DID store to create a JWT for presentation:',
              presentation
            );
            let didStore = await DID.DIDHelper.openDidStore(
              appInstanceDIDInfo.storeId,
            );

            Logger.log(TAG, 'Loading DID document');
            didStore.loadDidDocument(
              appInstanceDIDInfo.didString,
              async didDocument => {
                let validityDays = 2;
                Logger.log(TAG, 'Creating JWT');
                didDocument.createJWT(
                  {
                    presentation: JSON.parse(await presentation.toJson()),
                  },
                  validityDays,
                  appInstanceDIDInfo.storePassword,
                  jwtToken => {
                    Logger.log(TAG, 'JWT created for presentation:', jwtToken);
                    let result: FeedsData.StandardAuthResult = {
                      jwtToken: jwtToken,
                      serverName: name,
                      serverDescription: description,
                      elaAddress: elaAddress,
                    };
                    resolve(result);
                  },
                  err => {
                    reject(err);
                  },
                );
              },
              err => {
                reject(err);
              },
            );
          } else {
            reject('No presentation generated');
          }
        },
        err => {
          Logger.error(TAG, 'Create Verifiable Presentation error', err);
        },
      );
    });
  }

  getNameFromCredential(credentialJson: string): string {
    if (
      credentialJson == null ||
      credentialJson == undefined ||
      credentialJson == ''
    )
      return '';
    try {
      let credential = JSON.parse(credentialJson);
      if (credential == null || credential == undefined || credential == '')
        return '';

      if (
        credential.credentialSubject == null ||
        credential.credentialSubject == undefined ||
        credential.credentialSubject == ''
      )
        return '';

      if (
        credential.credentialSubject.name == null ||
        credential.credentialSubject.name == undefined ||
        credential.credentialSubject.name == ''
      )
        return '';
      return credential.credentialSubject.name;
    } catch (error) {
      Logger.error(TAG, 'Parse local credential error ', error);
    }
  }

  appendNameToCredential(
    vc: DIDPlugin.VerifiableCredential,
    name: string,
  ): Promise<DIDPlugin.VerifiableCredential> {
    return new Promise(async (resolve, reject) => {
      let vcstring = await vc.toString();
      Logger.log(TAG, 'Start append name, vc is ', vcstring);

      try {
        let vcJSON = JSON.parse(vcstring);
        if (vcJSON == null || vcJSON == undefined || vcJSON == '')
          resolve(null);
        if (
          vcJSON.credentialSubject == null ||
          vcJSON.credentialSubject == undefined ||
          vcJSON.credentialSubject == ''
        )
          resolve(null);
        vcJSON.credentialSubject['name'] = name;

        Logger.log(TAG, 'Append name to credential ', vcJSON);
        resolve(
          didManager.VerifiableCredentialBuilder.fromJson(
            JSON.stringify(vcJSON),
          ),
        );
      } catch (error) {
        Logger.error(TAG, 'Append name to credential error ', error);
        resolve(null);
      }
    });
  }

  getAppIdCredentialFromStorage(
    appIdCredential: DIDPlugin.VerifiableCredential,
  ): Promise<DIDPlugin.VerifiableCredential> {
    return new Promise(async (resolve, reject) => {
      if (appIdCredential != null && appIdCredential != undefined) {
        Logger.log(TAG, 'Get credential from memory , credential is ', appIdCredential);

        resolve(appIdCredential);
        return;
      }

      let mAppIdCredential = await this.storeService.get('appIdCredential');
      Logger.log(TAG, 'Get credential from storage , credential is ', mAppIdCredential);

      resolve(mAppIdCredential);
    });
  }

  checkAppIdCredentialStatus(
    appIdCredential: DIDPlugin.VerifiableCredential,
  ): Promise<DIDPlugin.VerifiableCredential> {
    return new Promise(async (resolve, reject) => {

      if (this.checkCredentialValid(appIdCredential)) {

        Logger.log(TAG, 'Credential valid , credential is ', appIdCredential);
        resolve(appIdCredential);
        return;
      }

      Logger.warn(TAG, 'Credential invalid, Getting app identity credential');
      let didAccess = new DID.DIDAccess();

      try {
        let mAppIdCredential = await didAccess.getExistingAppIdentityCredential();
        if (mAppIdCredential) {

          Logger.log(TAG, 'Get app identity credential', mAppIdCredential);
          resolve(mAppIdCredential);
          return;
        }

        mAppIdCredential = await didAccess.generateAppIdCredential();

        if (mAppIdCredential) {

          Logger.log(TAG, 'Generate app identity credential, credential is ', mAppIdCredential);
          resolve(mAppIdCredential);
          return;
        }
        this.events.publish(FeedsEvent.PublishType.authEssentialFail,{type:0})
        let error =
          'Get app identity credential error, credential is ' +
          JSON.stringify(mAppIdCredential);
        Logger.error(TAG, error);
        reject(error);
      } catch (error) {
        reject(error);
        Logger.error(TAG, error);
      }
    });
  }

  checkCredentialValid(
    appIdCredential: DIDPlugin.VerifiableCredential,
  ): boolean {
    if (appIdCredential == null || appIdCredential == undefined) {
      return false;
    }

    let currentData = new Date();
    if (appIdCredential.getExpirationDate().valueOf() < currentData.valueOf()) {
      return false;
    }

    return true;
  }

  async getAppId(): Promise<string> {
    let userDid = (await this.dataHelper.getSigninData()).did
    let appid = await this.storeService.get(userDid + 'appDid');
    return appid
  }
  generateHiveAuthPresentationJWT(challeng: String): Promise<string> {
    let self = this ;
    return new Promise(async (resolver, reject) => {

      Logger.log(TAG, 'Starting process to generate auth presentation JWT, authChallengeJwttoken is ', challeng)
      if (
        challeng == null ||
        challeng == undefined ||
        challeng == ''
      ) {
        reject('Params error');
      }

      // Parse, but verify on chain that this JWT is valid first
      let parseResult: DIDPlugin.ParseJWTResult = null;
      try {
        parseResult = await didManager.parseJWT(true, challeng)
      } catch (error) {
        Logger.error(TAG, 'Parse JWT error,', error)
      }
      Logger.log(TAG, 'Parse JWT Result is', parseResult)
      if (!parseResult) {
        reject('Parse jwt error, parse result null')
        return;
      }
      if (!parseResult.signatureIsValid) {
        // Could not verify the received JWT as valid - reject the authentication request by returning a null token
        reject(
          'The received authentication JWT token signature cannot be verified or failed to verify: ' +
            parseResult.errorReason +
            '. Is the back-end DID published? Are you on the right network?',
        );
        return;
      }

      // The request JWT must contain iss and nonce fields
      if (
        !('iss' in parseResult.payload) ||
        !('nonce' in parseResult.payload)
      ) {
        reject(
          'The received authentication JWT token does not contain iss or nonce',
        );
        return;
      }

      // Generate a authentication presentation and put the credential + back-end info such as nonce inside
      let nonce = parseResult.payload['nonce'] as string;
      let realm = parseResult.payload['iss'] as string;

      let name = (parseResult.payload['name'] as string) || '';
      let didAccess = new DID.DIDAccess();
      this.appInstanceDID = (await didAccess.getOrCreateAppInstanceDID()).did;
      this.appInstanceDIDInfo = await didAccess.getExistingAppInstanceDIDInfo();
      this.appIdCredential = await this.getAppIdCredentialFromStorage(
        this.appIdCredential,
      );

      this.appIdCredential = await this.checkAppIdCredentialStatus(
        this.appIdCredential,
      );
      Logger.log(TAG, 'AppIdCredential is ', this.appIdCredential);
      if (!this.appIdCredential) {
        Logger.warn(TAG, 'Empty app id credential')
        resolver(null)
        return
      }

      let userDid = (await this.dataHelper.getSigninData()).did
      await this.storeService.set(userDid + 'appDid', this.appIdCredential.getSubject()["appDid"]);

      this.appInstanceDID.createVerifiablePresentation([this.appIdCredential], realm, nonce, this.appInstanceDIDInfo.storePassword,async presentation => {

        if (presentation) {
          // Generate the back end authentication JWT
          Logger.log(TAG,
            'Opening DID store to create a JWT for presentation:',
            presentation
          );
          let didStore = await DID.DIDHelper.openDidStore(
            this.appInstanceDIDInfo.storeId,
          );

          Logger.log(TAG, 'Loading DID document');
          didStore.loadDidDocument(
            this.appInstanceDIDInfo.didString,
            async didDocument => {
              let validityDays = 2;
              Logger.log(TAG, 'Creating JWT')
              didDocument.createJWT(
                {
                  presentation: JSON.parse(await presentation.toJson()),
                },
                validityDays,
                this.appInstanceDIDInfo.storePassword,
                jwtToken => {
                  Logger.log(TAG, 'JWT created for presentation:', jwtToken)
                  resolver(jwtToken)
                },
                err => {
                  reject(err)
                },
              );
            },
            err => {
              reject(err)
            },
          );
        } else {
          reject('No presentation generated')
        }
      },
      err => {
        Logger.error(TAG, 'Create Verifiable Presentation error', err)
      },)

    })
  }
}
