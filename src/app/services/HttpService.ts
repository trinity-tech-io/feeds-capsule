import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { NativeService } from 'src/app/services/NativeService';
import { PopupProvider } from 'src/app/services/popup';
import { PopoverController } from '@ionic/angular';
import _ from 'lodash';
import { resolve } from 'url';
import { Logger } from './logger';
export type HttpOptions = {
  headers?: HttpHeaders | {
    [header: string]: string | string[];
  };
  observe?: "body";
  params?: HttpParams | {
    [param: string]: string | string[];
  };
  reportProgress?: boolean;
  responseType?: "json";
  withCredentials?: boolean;
}

export type HttpTextOptions = {
  headers?: HttpHeaders | {
    [header: string]: string | string[];
  };
  observe: 'response';
  params?: HttpParams | {
    [param: string]: string | string[];
  };
  reportProgress?: boolean;
  responseType: 'text';
  withCredentials?: boolean;
}

const TAG: string = "HttpService";

@Injectable()
export class HttpService {
  public httpOptions: HttpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json;charset=utf-8',
    }),
  };
  private textHttpOption: HttpTextOptions = {
    // headers?: new HttpHeaders({
    //   'Content-Type': 'application/json;charset=utf-8',
    // }),
    // observe: 'response',
    // params?: new HttpParams (),
    // reportProgress?: false,
    responseType: 'text',
    observe: 'response'
  };
  public popover: any = null;
  constructor(
    public httpClient: HttpClient,
    public native: NativeService,
    public popupProvider: PopupProvider,
    private popoverController: PopoverController,
  ) {}

  /**
   * Base http get function
   * @param url
   */
  httpGet(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      Logger.log(TAG, "Send http get method", url);
      this.httpClient.get(url).subscribe(
        response => {
          Logger.log(TAG, "Receive http get method response", response);
          resolve(response);
        },
        error => {
          reject(error);
        }
      );
    });
  }

  httpGetWithText(url: string): Promise<HttpResponse<Object>> {
    return new Promise((resolve, reject) => {
      this.httpClient.get(url, this.textHttpOption).subscribe(
        response => {
          resolve(response);
        },
        error => {
          reject(error);
        }
      );
    });
  }

  /**
   * Base http post function
   * @param url
   */
  httpPost(url: string, body: any, httpOptions: HttpOptions = this.httpOptions): Promise<Object> {
    return new Promise((resolve, reject) => {
      Logger.log(TAG, "Send http post method", url, body, httpOptions);
      this.httpClient
        .post(url, body, httpOptions)
        .subscribe(
          response => {
            resolve(response);
          },
          error => {
            reject(error);
          },
        );
    });
  }

  httpPostWithText(url: string, body: any): Promise<HttpResponse<Object>> {
    return new Promise((resolve, reject) => {
      this.httpClient
        .post(url, body, this.textHttpOption)
        .subscribe(
          response => {
            resolve(response);
          },
          error => {
            reject(error);
          },
        );
    });
  }

  ajaxGet(url: string, isLoading: boolean = true) {
    if (isLoading) {
      this.native.showLoading('common.waitMoment', isDismiss => {});
    }
    return new Promise((resove, reject) => {
      this.httpClient.get(url).subscribe(
        response => {
          this.native.hideLoading();
          if (response['code'] === 400) {
            this.native.toast('common.error400');
          } else if (response['code'] === 500) {
            this.native.toast('common.error500');
          }
          resove(response);
        },
        error => {
          let sid = setTimeout(() => {
            if (isLoading) {
              this.native.hideLoading();
            }
            this.openAlert();
            clearTimeout(sid);
          }, 500);
          reject(error);
        },
      );
    });
  }

  ajaxPost(url: string, json: Object, isLoading: boolean = true) {
    if (isLoading) {
      this.native.showLoading('common.waitMoment', isDismiss => {});
    }
    return new Promise((resove, reject) => {
      this.httpClient
        .post(url, JSON.stringify(json),this.httpOptions)
        .subscribe(
          response => {
            this.native.hideLoading();
            if (response['code'] === 400) {
              this.native.toast('common.error400');
            } else if (response['code'] === 500) {
              this.native.toast('common.error500');
            }
            resove(response);
          },
          error => {
            let sid = setTimeout(() => {
              if (isLoading) {
                this.native.hideLoading();
              }
              this.openAlert();
              clearTimeout(sid);
            }, 500);
            reject(error);
          },
        );
    });
  }

  ajaxNftPost(url: string, json: Object) {
    return new Promise((resove, reject) => {
      this.httpClient.post(url, json).subscribe(
        response => {
          if (response['code'] === 400) {
            this.native.toast('common.error400');
          } else if (response['code'] === 500) {
            this.native.toast('common.error500');
          }
          resove(response);
        },
        error => {
          let sid = setTimeout(() => {
            reject(error);
            clearTimeout(sid);
          }, 500);
          reject(error);
        },
      );
    });
  }

  openAlert() {
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      return;
    }
    this.popover = this.popupProvider.ionicAlert(
      this,
      '',
      'common.httperror',
      this.confirm,
      'tskth.svg',
      'common.ok',
    );
  }

  confirm(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      this.popover = null;
    }
  }

  getElaPrice():Promise<string>{
    return new Promise((resove, reject) => {
      try{
       this.httpClient.get('https://assist.trinity-feeds.app/feeds/api/v1/price')
       .subscribe((result)=>{
        let newResult = result || {};
         let elaPrice =  newResult["ELA"] || "";
         if(elaPrice!=""){
          resove(elaPrice)
         }else{
          reject(null);
         }
       },(err)=>{
          reject(null);
       });
      }catch(err){
        reject(null);
      }
    });
  }
}
