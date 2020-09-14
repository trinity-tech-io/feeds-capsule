import {Injectable} from '@angular/core';
import { HttpClient, HttpParams,HttpHeaders} from '@angular/common/http';
import { map } from 'rxjs/operators';
@Injectable()
export class HttpService{

  constructor(public httpClient:HttpClient){

  }

  ajaxGet(url:string) {
    return new Promise((resove, reject) => {
      this.httpClient.get(url).subscribe((response) => {
        resove(response);
      }, (error) => {
        reject(error);
      })
    })
  }

  ajaxPost(url:string, json:Object) {
    let httpHeaders = new HttpHeaders();
    httpHeaders = httpHeaders.set('Content-Type','application/json')
    //httpHeaders = httpHeaders.set('Cache-Control', 'no-cache');

    let _params = new HttpParams();
    for(let key in json){
      console.log("====key=="+key);
      console.log("====json=="+json[key]);
      _params = _params.set(key,json[key]);    
    }
    console.log("======"+_params.toString());

    const body = _params.toString();

    return new Promise((resove, reject) => {
      this.httpClient.post(url,body, {headers:httpHeaders,params: _params,responseType:'text'}).subscribe((response) => {
        resove(response);
      }, (error) => {
        reject(error);
      })
    })
  }

}
