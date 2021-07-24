import { Injectable } from '@angular/core';
import { DID } from "@elastosfoundation/elastos-connectivity-sdk-cordova";
import { LogUtils } from 'src/app/services/LogUtils';
import { StorageService } from 'src/app/services/StorageService';

declare let didManager: DIDPlugin.DIDManager;
let TAG: string = "StandardAuthService";

@Injectable()
export class StandardAuthService {
    // private didAccess: DID.DIDAccess;
    private appIdCredential:DIDPlugin.VerifiableCredential = null;
    constructor(private logUtils: LogUtils,
                private storeService: StorageService) {
    }

    getCredentials(): Promise<any>{
        return new Promise(async (resolve, reject) =>{
            let didAccess = new DID.DIDAccess();
            let params = {
                claims: {
                    name: true,
                    avatar: {
                        required: false,
                        reason: "For profile picture"
                    },
                    email: {
                        required: false,
                        reason: "Maybe Feeds dapp need"
                    },
                    gender: {
                        required: false,
                        reason: "Maybe Feeds dapp need"
                    },
                    telephone: {
                        required: false,
                        reason: "Maybe Feeds dapp need"
                    },
                    nation: {
                        required: false,
                        reason: "Maybe Feeds dapp need"
                    },
                    nickname:{
                        required: false,
                        reason: "Maybe Feeds dapp need"
                    },
                    description:{
                        required: false,
                        reason: "Maybe Feeds dapp need"
                    },
                    interests:{
                        required: false,
                        reason: "Maybe Feeds dapp need"
                    }
                }
            }
            try {
                let presentation = await didAccess.getCredentials(params);
                console.log("Got credentials result, presentation is",presentation);
                if (presentation) {
                    resolve(presentation);
                    console.log("Got credentials:", presentation);
                    // alert(JSON.stringify(presentation));
                } else {
                    alert("Empty presentation returned, something wrong happened, or operation was cancelled");
                    console.log("Empty ....",presentation);
                }
            } catch (error) {
                alert("error "+JSON.stringify(error));
                console.log("error",error);
            }
        });
    }

    getInstanceDID(): Promise<DIDPlugin.DID>{
        return new Promise(async (resolve, reject)=>{
            let didAccess = new DID.DIDAccess();
            let instanceDIDInfo = await didAccess.getOrCreateAppInstanceDID();
            resolve(instanceDIDInfo.did);
        });
    }

    getInstanceDIDDoc(): Promise<string>{
        return new Promise(async (resolve, reject)=>{
            let didAccess = new DID.DIDAccess();
            let instanceDIDInfo = await didAccess.getOrCreateAppInstanceDID();
            instanceDIDInfo.didStore.loadDidDocument(instanceDIDInfo.did.getDIDString(),(didDocument)=>{
                resolve(didDocument.toJson());
            });
        });
    }
    
    generateAuthPresentationJWT(authChallengeJwttoken: string): Promise<FeedsData.StandardAuthResult> {
        return new Promise(async (resolve, reject)=>{
            this.logUtils.logd("Starting process to generate auth presentation JWT, authChallengeJwttoken is "+authChallengeJwttoken,TAG);
            if (authChallengeJwttoken == null || authChallengeJwttoken == undefined || authChallengeJwttoken == ""){
                reject("Params error");
            }

            // Parse, but verify on chain that this JWT is valid first
            let parseResult: DIDPlugin.ParseJWTResult = null;
            try{
                parseResult = await didManager.parseJWT(true, authChallengeJwttoken);
            }catch(error){
                this.logUtils.loge("Parse JWT error,"+JSON.stringify(error),TAG);
            }
            this.logUtils.logd("Parse JWT Result is"+JSON.stringify(parseResult),TAG);
            if (!parseResult){
                reject("Parse jwt error, parse result null");
                return;
            }
            if (!parseResult.signatureIsValid) {
                // Could not verify the received JWT as valid - reject the authentication request by returning a null token
                reject("The received authentication JWT token signature cannot be verified or failed to verify: "+parseResult.errorReason+". Is the back-end DID published? Are you on the right network?");
                return;
            }

            // The request JWT must contain iss and nonce fields
            if (!("iss" in parseResult.payload) || !("nonce" in parseResult.payload)) {
                reject("The received authentication JWT token does not contain iss or nonce");
                return;
            }

            // Generate a authentication presentation and put the credential + back-end info such as nonce inside
            let nonce = parseResult.payload["nonce"] as string;
            let realm = parseResult.payload["iss"] as string;

            let name = parseResult.payload["name"] as string||"";
            let description = parseResult.payload["description"] as string||"";
            let elaAddress = parseResult.payload["elaAddress"] as string||"";


            this.logUtils.logd("Getting app instance DID",TAG);
            let didAccess = new DID.DIDAccess();
            let appInstanceDID = (await didAccess.getOrCreateAppInstanceDID()).did;
            let appInstanceDIDInfo = await didAccess.getExistingAppInstanceDIDInfo();
            //work around
            this.appIdCredential = await this.getAppIdCredentialFromStorage(this.appIdCredential);
            this.appIdCredential = await this.checkAppIdCredentialStatus(this.appIdCredential);

            this.logUtils.logd("AppIdCredential is "+JSON.stringify(this.appIdCredential),TAG);
            if (!this.appIdCredential) {
                this.logUtils.logw("Empty app id credential",TAG);
                resolve(null);
                return;
            }

            // Create the presentation that includes back end challenge (nonce) and the app id credential.
            appInstanceDID.createVerifiablePresentation([
                this.appIdCredential
            ], realm, nonce, appInstanceDIDInfo.storePassword, async (presentation)=>{
                if (presentation) {
                    // Generate the back end authentication JWT
                    this.logUtils.logd("Opening DID store to create a JWT for presentation:"+presentation,TAG);
                    let didStore = await DID.DIDHelper.openDidStore(appInstanceDIDInfo.storeId);

                    this.logUtils.logd("Loading DID document",TAG);
                    didStore.loadDidDocument(appInstanceDIDInfo.didString, async (didDocument)=>{
                        let validityDays = 2;
                        this.logUtils.logd("Creating JWT",TAG);
                        didDocument.createJWT({
                            presentation: JSON.parse(await presentation.toJson())
                        }, validityDays, appInstanceDIDInfo.storePassword, (jwtToken)=>{
                            this.logUtils.logd("JWT created for presentation:"+ jwtToken,TAG);
                            let result:FeedsData.StandardAuthResult = {
                                jwtToken            : jwtToken,
                                serverName          : name,
                                serverDescription   : description,
                                elaAddress          : elaAddress
                            }
                            resolve(result);
                        }, (err)=>{
                            reject(err);
                        });
                    }, (err)=>{
                        reject(err);
                    });
                }
                else {
                    reject("No presentation generated");
                }
            },(err)=>{
                this.logUtils.logd("CreateVerifiablePresentation error:"+JSON.stringify(err),TAG);

            });
        });
    }

    getNameFromCredential(credentialJson: string): string{
        if (credentialJson == null || credentialJson == undefined || credentialJson == "")
            return "";
        try {
            let credential = JSON.parse(credentialJson);
            if (credential == null || credential == undefined || credential == "")
                return "";

            if (credential.credentialSubject == null || credential.credentialSubject == undefined || credential.credentialSubject == "")
                return "";

            if (credential.credentialSubject.name == null || credential.credentialSubject.name == undefined || credential.credentialSubject.name == "")
                return "";
            return credential.credentialSubject.name;
        } catch (error) {
            this.logUtils.loge("Parse local credential error "+error,TAG);
        }
    }

    appendNameToCredential(vc: DIDPlugin.VerifiableCredential, name: string): Promise<DIDPlugin.VerifiableCredential>{
        return new Promise(async (resolve, reject)=>{
            let vcstring = await vc.toString();
            this.logUtils.logd("Start append name, vc is "+vcstring);

            try {
                let vcJSON = JSON.parse(vcstring);
                if (vcJSON == null || vcJSON == undefined || vcJSON == "")
                    resolve(null);
                if (vcJSON.credentialSubject == null || vcJSON.credentialSubject == undefined || vcJSON.credentialSubject == "")
                    resolve(null);
                vcJSON.credentialSubject["name"] = name;

                this.logUtils.logd("Append name to credential "+JSON.stringify(vcJSON));
                resolve(didManager.VerifiableCredentialBuilder.fromJson(JSON.stringify(vcJSON)));
            } catch (error) {
                this.logUtils.loge("Append name to credential error "+error,TAG);
                resolve(null);
            }
        });
    }

    getAppIdCredentialFromStorage(appIdCredential: DIDPlugin.VerifiableCredential): Promise<DIDPlugin.VerifiableCredential>{
        return new Promise(async (resolve, reject)=>{
            if (appIdCredential != null && appIdCredential != undefined){
                this.logUtils.logd("Get credential from memory , credential is "+JSON.stringify(appIdCredential),TAG);
                resolve(appIdCredential);
                return ;
            }

            let mAppIdCredential = await this.storeService.get("appIdCredential")
            this.logUtils.logd("Get credential from storage , credential is "+JSON.stringify(mAppIdCredential),TAG);
            resolve(mAppIdCredential);
        });
    }

    checkAppIdCredentialStatus(appIdCredential: DIDPlugin.VerifiableCredential): Promise<DIDPlugin.VerifiableCredential>{
        return new Promise(async (resolve, reject)=>{
            if (this.checkCredentialValid(appIdCredential)){
                this.logUtils.logd("Credential valid , credential is "+JSON.stringify(appIdCredential),TAG);
                resolve(appIdCredential);
                return ;
            }

            this.logUtils.logd("Credential invalid",TAG);
            this.logUtils.logd("Getting app identity credential",TAG);
            let didAccess = new DID.DIDAccess();
            try {
                let mAppIdCredential = await didAccess.getExistingAppIdentityCredential();
                if (mAppIdCredential){
                    this.logUtils.logd("Get app identity credential, credential is "+JSON.stringify(mAppIdCredential),TAG);
                    resolve(mAppIdCredential);
                    return;
                }

                mAppIdCredential = await didAccess.generateAppIdCredential();
                if (mAppIdCredential){
                    this.logUtils.logd("Generate app identity credential, credential is "+JSON.stringify(mAppIdCredential),TAG);
                    resolve(mAppIdCredential);
                    return;
                }

                let error = "Get app identity credential error, credential is "+JSON.stringify(mAppIdCredential);
                this.logUtils.loge(error,TAG);
                reject(error);
            } catch (error) {
                reject(error);
            }
        });
    }

    checkCredentialValid(appIdCredential: DIDPlugin.VerifiableCredential): boolean{
        if (appIdCredential == null || appIdCredential == undefined){
            return false;
        }

        let currentData = new Date;
        if (appIdCredential.getExpirationDate().valueOf()<currentData.valueOf()){
            return false;
        }

        return true;
    }

}