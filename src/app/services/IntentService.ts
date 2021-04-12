import { Injectable } from '@angular/core';
import { LogUtils } from 'src/app/services/LogUtils';

let TAG: string = "IntentService";
declare let intentManager: IntentPlugin.Intent;

@Injectable()
export class IntentService {
    constructor(private logUtils: LogUtils) {
    }

    scanAddress(): Promise<string>{
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
}