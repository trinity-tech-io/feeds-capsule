import { Injectable } from '@angular/core';
import { LogUtils } from 'src/app/services/LogUtils';

let TAG: string = "IntentService";
declare let intentManager: IntentPlugin.IntentManager;

@Injectable()
export class IntentService {
    constructor(private logUtils: LogUtils) {
    }

    scanQRCode(): Promise<string>{
        return new Promise(async (resolve, reject) =>{
            try {
                let res = await intentManager.sendIntent("https://scanner.elastos.net/scanqrcode");
                if (res){
                    let content = res.result.scannedContent;
                    let contentStr = String(content);
                    resolve(contentStr);
                    return;
                }

                let error: string = "Scan QR code error, result is "+JSON.stringify(res);
                this.logUtils.loge(error,TAG);
                reject(error);

              } catch (error) {
                this.logUtils.loge(error,TAG);
                reject(error);
              }
        });
    }

    share(title: string, content: string): Promise<string>{
        return new Promise(async (resolve, reject) =>{
            let params = {
                title: title,
                url: content
            };

            try {
                let res = await intentManager.sendIntent("share", params);
            
                if (res){
                    resolve(res);
                    return;
                }
                let error: string = "Share error, result is "+JSON.stringify(res);
                this.logUtils.loge(error, TAG);
                reject(error);
            } catch (error) {
                this.logUtils.loge(error, TAG);
                reject(error);
            }
        });
        
    }

    private credaccess(params: any): Promise<any>{
        return intentManager.sendIntent("https://did.elastos.net/credaccess", params);
    }

    credaccessWithParams(): Promise<any>{
        return new Promise(async (resolve, reject) =>{
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
                let response = await this.credaccess(params);
                if (response && response.result && response.result.presentation) {
                    let data = response.result;
                    resolve(data);
                    return;
                }
                let error = "Credaccess error response is "+JSON.stringify(response)
                this.logUtils.loge(error);
                reject(error);
            } catch (error) {
                this.logUtils.loge(error);
                reject(error);
            }
        });
    }

    credaccessWithoutParams(): Promise<string>{
        return new Promise(async (resolve, reject) =>{
            let params = {};

            try {
                let response = await this.credaccess(params);
                if (response && response.result && response.result.presentation) {
                    let presentation = response.result.presentation;
                    resolve(presentation);
                    return;
                }
                let error = "Credaccess error response is "+JSON.stringify(response)
                this.logUtils.loge(error);
                reject(error);
            } catch (error) {
                this.logUtils.loge(error);
                reject(error);
            }
        });
    }

    didtransaction(payload: string): Promise<string> {
        return new Promise(async (resolve, reject) =>{
            let params = {
                didrequest: JSON.parse(payload)
            }

            try {
                let response = await intentManager.sendIntent("https://wallet.elastos.net/didtransaction", params);
                if (response){
                    resolve(response);
                    return ;
                }

                let error = "DIDtransaction error response is "+JSON.stringify(response);
                this.logUtils.loge(error);
                reject(error);
            } catch (error) {
                this.logUtils.loge(error);
                reject(error);
            }
        });
    }

    credissue(did: string, serverName: string, serverDesc: string, elaAddress: string): Promise<string>{
        return new Promise(async (resolve, reject) =>{
            let params = {
                identifier: "credential", // unique identifier for this credential
                types: ["BasicProfileCredential"], // Additional credential types (strings) such as BasicProfileCredential.
                subjectdid: did, // DID targeted by the created credential. Only that did will be able to import the credential.
                properties: {
                    name: serverName,
                    description: serverDesc,
                    elaAddress: elaAddress
                },
                expirationdate: new Date(2024, 10, 10).toISOString()
            }


            try {
                let response = await intentManager.sendIntent("https://did.elastos.net/credissue", params);
                if (response && response.result && response.result.credential){
                    let credential =  response.result.credential;
                    resolve(credential);
                    return ;
                }

                let error = "Credissue error response is "+JSON.stringify(response);
                this.logUtils.loge(error);
                reject(error);
            } catch (error) {
                this.logUtils.loge(error);
                reject(error);
            }
        }); 
    }
    
    pay(receiver: string, amount: number, memo: string): Promise<string>{
        return new Promise(async (resolve, reject) =>{
            let params = {
                receiver: receiver,
                amount: amount,
                memo: memo
            }

            try {
                let response = await intentManager.sendIntent("https://wallet.elastos.net/pay", params);
                if (response){
                    resolve(response);
                    return ;
                }

                let error = "Pay error response is "+JSON.stringify(response);
                this.logUtils.loge(error);
                reject(error);
            } catch (error) {
                this.logUtils.loge(error);
                reject(error);
            }
        });
    }

    promptpublishdid(): Promise<string>{
        return new Promise(async (resolve, reject) =>{
            let params = {};
            
            try{
                let response = await intentManager.sendIntent("https://did.elastos.net/promptpublishdid", params);
                if (response){
                    resolve(response);
                    return ;
                }

                let error = "Pay error response is "+JSON.stringify(response);
                this.logUtils.loge(error);
                reject(error);
            } catch (error) {
                this.logUtils.loge(error);
                reject(error);
            }
        });
    }

    addIntentListener(callback: (msg: IntentPlugin.ReceivedIntent)=>void){
        intentManager.addIntentListener(callback);
    }
    
}