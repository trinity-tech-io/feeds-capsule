import {Injectable} from '@angular/core';
import { HttpClient,HttpHeaders} from '@angular/common/http';
import { NativeService } from 'src/app/services/NativeService';
@Injectable()
export class HttpService{
  public httpOptions = {
    headers: new HttpHeaders({
        "Content-Type": "application/json"
      })
  };


  constructor(
           public httpClient:HttpClient,
           public native:NativeService
           ){

  }

  ajaxGet(url:string,isLoading:boolean=true) {
    if(isLoading){
      this.native.showLoading("common.waitMoment");
    }
    return new Promise((resove, reject) => {
      this.httpClient.get(url).subscribe((response) => {
        this.native.hideLoading();
        if(response["code"] === 400){
          this.native.toast('common.error400');
        }else if(response["code"] === 500){
          this.native.toast('common.error500');
        }
        resove(response);
      }, (error) => {
        if(isLoading){
          this.native.hideLoading();
        }
        this.native.toast("common.httperror");
        reject(error);
      })
    })
  }

  ajaxPost(url:string, json:Object,isLoading:boolean=true) {
    if(isLoading){
      this.native.showLoading("common.waitMoment");
    }
    return new Promise((resove, reject) => {
      this.httpClient.post(url,JSON.stringify(json),this.httpOptions).subscribe((response) => {
        this.native.hideLoading();
        if(response["code"] === 400){
          this.native.toast('common.error400');
        }else if(response["code"] === 500){
          this.native.toast('common.error500');
        }
        resove(response);
      }, (error) => {
        if(isLoading){
          this.native.hideLoading();
        }
        this.native.toast(JSON.stringify(error));
        reject(error);
      })
    })
  }


}
