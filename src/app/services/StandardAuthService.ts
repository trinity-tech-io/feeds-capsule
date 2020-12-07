import { Injectable } from '@angular/core';
import * as TrinitySDK from '@elastosfoundation/trinity-dapp-sdk';
import { LogUtils } from 'src/app/services/LogUtils';

declare let didManager: DIDPlugin.DIDManager;
let TAG: string = "StandardAuthService";

@Injectable()
export class StandardAuthService {
    private didHelper:TrinitySDK.DID.DIDHelper;
    constructor(private logUtils:LogUtils) {
        this.didHelper = new TrinitySDK.DID.DIDHelper();
    }

    getInstanceDID(): Promise<DIDPlugin.DID>{
        return new Promise(async (resolve, reject)=>{
            let instanceDIDInfo = await this.didHelper.getOrCreateAppInstanceDID();
            resolve(instanceDIDInfo.did);
        });
    }

    getInstanceDIDDoc(): Promise<string>{
        return new Promise(async (resolve, reject)=>{
            let instanceDIDInfo = await this.didHelper.getOrCreateAppInstanceDID();
            instanceDIDInfo.didStore.loadDidDocument(instanceDIDInfo.did.getDIDString(),(didDocument)=>{
                resolve(didDocument.toJson());
            })
        });
    }
    
    generateAuthPresentationJWT(authChallengeJwttoken: string): Promise<FeedsData.StandardAuthResult> {
        this.logUtils.logd("Start pro")
        return new Promise(async (resolve, reject)=>{
            this.logUtils.logd("Starting process to generate auth presentation JWT, authChallengeJwttoken is "+authChallengeJwttoken,TAG);
            if (authChallengeJwttoken == null || authChallengeJwttoken == undefined || authChallengeJwttoken == ""){
                reject("Params error");
            }
            
            // Parse, but verify on chain that this JWT is valid first
            let parseResult = await didManager.parseJWT(true, authChallengeJwttoken);
            this.logUtils.logd("parseJWTResult is"+JSON.stringify(parseResult),TAG);
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
            let appInstanceDID = (await this.didHelper.getOrCreateAppInstanceDID()).did;
            let appInstanceDIDInfo = await this.didHelper.getExistingAppInstanceDIDInfo();

            this.logUtils.logd("Getting app identity credential",TAG);
            let appIdCredential = await this.didHelper.getOrCreateAppIdentityCredential();
            this.logUtils.logd("appIdCredential is "+JSON.stringify(appIdCredential),TAG);
            if (!appIdCredential) {
                this.logUtils.logw("Empty app id credential",TAG);
                resolve(null);
                return;
            }

            // Create the presentation that includes back end challenge (nonce) and the app id credential.
            appInstanceDID.createVerifiablePresentation([
                appIdCredential
            ], realm, nonce, appInstanceDIDInfo.storePassword, async (presentation)=>{
                if (presentation) {
                    // Generate the back end authentication JWT
                    this.logUtils.logd("Opening DID store to create a JWT for presentation:"+presentation,TAG);
                    let didStore = await this.didHelper.openDidStore(appInstanceDIDInfo.storeId);

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
                this.logUtils.logd("createVerifiablePresentation error:"+JSON.stringify(err),TAG);

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
            this.logUtils.loge("Parse local credential error:"+error,TAG);
        }
    }

    appendNameToCredential(vc: DIDPlugin.VerifiableCredential, name: string): Promise<DIDPlugin.VerifiableCredential>{
        return new Promise(async (resolve, reject)=>{
            let vcstring = await vc.toString();
            this.logUtils.logd("Start append name "+vcstring);

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
                this.logUtils.loge("Append name to credential error:"+error,TAG);
                resolve(null);
            }
        });
    }
}