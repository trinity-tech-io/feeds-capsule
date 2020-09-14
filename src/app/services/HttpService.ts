import {Injectable} from '@angular/core';
import { HttpClient, HttpParams,HttpHeaders} from '@angular/common/http';
import { map } from 'rxjs/operators';
@Injectable()
export class HttpService{
  public httpOptions = {
    headers: new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" , 
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token, Accept, Authorization, X-Request-With",
      "Access-Control-Allow-Credentials" : "true",
      "Access-Control-Allow-Methods" : "GET, POST, DELETE, PUT, OPTIONS, TRACE, PATCH, CONNECT"  
     }) 
  };
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
    
    return new Promise((resove, reject) => {
      this.httpClient.post(url,JSON.stringify(json),this.httpOptions).subscribe((response) => {
        resove(response);
      }, (error) => {
        reject(error);
      })
    })
  }

}
