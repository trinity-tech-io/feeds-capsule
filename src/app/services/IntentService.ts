import { Injectable } from '@angular/core';
import { LogUtils } from 'src/app/services/LogUtils';

let TAG: string = "IntentService";
declare let intentManager: IntentPlugin.Intent;

@Injectable()
export class IntentService {
    constructor(private logUtils: LogUtils) {
    }

    scanQRCode(): Promise<string>{
        return new Promise(async (resolve, reject) =>{
            try {
                let res = await intentManager.sendIntent("https://scanner.elastos.net/scanqrcode");
                if (!res){
                    let error: string = "Scan QR code error, result is "+JSON.stringify(res);
                    this.logUtils.loge(error,TAG);
                    reject(error);
                    return;
                }
                let content = res.result.scannedContent;
                let contentStr = String(content);
                resolve(contentStr);
              } catch (error) {
                let catchError = "Scan QR code error, error is "+JSON.stringify(error);
                this.logUtils.loge(catchError,TAG);
                reject(catchError);
              }
        });
    }

    share(title: string, content: string){
        // appManager.sendIntent("share", {
        //     title:"",
        //     url: content
        //   }, {}, () => {

        //   });
    }

    credaccess(): Promise<string>{
        return new Promise(async (resolve, reject) =>{
        // appManager.sendIntent("https://did.elastos.net/credaccess", {}, {}, (response: any) => {
        //     if (response && response.result && response.result.presentation)
        //       onSuccess(response.result.presentation);
        //   },
        //   (err)=>{});


        //     appManager.sendIntent("https://did.elastos.net/credaccess", {
        //   claims: {
        //     name: true,
        //     avatar: {
        //       required: false,
        //       reason: "For profile picture"
        //     },
        //     email: {
        //       required: false,
        //       reason: "Maybe Feeds dapp need"
        //     },
        //     gender: {
        //       required: false,
        //       reason: "Maybe Feeds dapp need"
        //     },
        //     telephone: {
        //       required: false,
        //       reason: "Maybe Feeds dapp need"
        //     },
        //     nation: {
        //       required: false,
        //       reason: "Maybe Feeds dapp need"
        //     },
        //     nickname:{
        //       required: false,
        //       reason: "Maybe Feeds dapp need"
        //     },
        //     description:{
        //       required: false,
        //       reason: "Maybe Feeds dapp need"
        //     },
        //     interests:{
        //       required: false,
        //       reason: "Maybe Feeds dapp need"
        //     }
        //   }
        // }, {}, (response: any) => {
        //     if (response && response.result && response.result.presentation) {
        //       let data = response.result;
        //       resolve(data);
        //       return;
        //     }
        //     reject("credaccess error response is "+JSON.stringify(response));
        //   },(err)=>{
        //     reject(err);
        //   });
        // });
        });
    }

    didtransaction(): Promise<string> {
        return new Promise(async (resolve, reject) =>{
            // appManager.sendIntent("https://wallet.elastos.net/didtransaction", request, {}, onSuccess, onError);
        });
    }

    credissue(params: any): Promise<string>{
        return new Promise(async (resolve, reject) =>{
            // /**
            //  * Ask the DID app to generate a VerifiableCredential with some data, and use current DID
            //  * as the signing issuer for this credential, so that others can permanently verifiy who
            //  * issued the credential.
            //  * This credential can then be delivered to a third party who can import it (credimport) to
            //  * his DID profile.
            //  *
            //  * For this demo, the subject DID is ourself, so we will be able to import the credential we issued
            //  * to our own DID profile (which is a useless use case, as usually DIDs are issued for others).
            //  */
            // appManager.sendIntent("https://did.elastos.net/credissue", {
            // identifier: "credential", // unique identifier for this credential
            // types: ["BasicProfileCredential"], // Additional credential types (strings) such as BasicProfileCredential.
            // subjectdid: did, // DID targeted by the created credential. Only that did will be able to import the credential.
            // properties: {
            //     // customData: "test data.",
            //     name: serverName,
            //     description: serverDesc,
            //     elaAddress: elaAddress
            //     // moreComplexData: {
            //     //   info: "A sub-info"
            //     // }
            // },

            // expirationdate: new Date(2024, 10, 10).toISOString() // Credential will expire on 2024-11-10 - Note the month's 0-index...
            // }, {}, (response) => {
            // if (response.result == null){
            //     onError();
            //     return;
            // }
            // if (response.result.credential) {
            //     bindingServerCache.name = serverName;
            //     bindingServerCache.introduction = serverDesc;
            //     onSuccess(response.result.credential);
            // }
            // else {
            //     onError();
            //     this.logUtils.loge("Failed to issue a credential - empty credential returned" ,TAG);
            //     return;
            // }
            // }, (err)=>{
            // onError();
            // this.logUtils.loge("Failed to issue a credential, err msg is "+JSON.stringify(err), TAG);
            // return ;
            // })
        }); 
    }
    
    pay(param: any): Promise<string>{
        return new Promise(async (resolve, reject) =>{
            //     appManager.sendIntent("https://wallet.elastos.net/pay", param, {},
            //     (response: any) => {
            //       onSuccess(response);
            //     },
            //     (err)=>{
            //       onError(err);
            //     }
            //   );
        });
    }


    promptpublishdid(): Promise<string>{
        return new Promise(async (resolve, reject) =>{
            // appManager.sendIntent("https://did.elastos.net/promptpublishdid", {}, {}, (response: any) => {
            // },
            // (err)=>{
            //   this.native.toastdanger('common.promptPublishDidError');
            // });
        });
    }


}