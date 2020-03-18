import { Injectable } from '@angular/core';

@Injectable()
export class JsonRPCService {
    constructor() {
    }

    //request
    assembleJson(method: string,  params: any, id: string): any{
        let json_data = {}
        json_data["jsonrpc"] = "2.0";
        json_data["method"] = method;
        json_data["id"] = id;
        if (params != null) {
            json_data["params"] = params;    
        }
        return json_data ;
    }

    /*
    {
        "jsonrpc": "2.0",
        "result": [{
            "seqno": "序列号（以升序返回）(number)", 
            "event": "事件内容(string)",
            "ts": "事件发布时的时间戳（UNIX Epoch格式）(number)"
        }],
        "id": "id(JSON-RPC conformed type)"
    }
    */
    //response
    /*
    {
        "jsonrpc":"2.0",
        "error":{
            "code":-32602,
            "message":"Operation Not Authorized"
        },
        "id":"11"}
    */

    checkError(response: string): boolean{
        if (typeof response != "string") {
            return;
        }

        if (response.indexOf("error") != -1){
            console.log("error");
            return true;
        }
        console.log("else");
        return false ;
    }

    parseJson(msg: string){
        if (typeof msg != "string") {
            return;
        }

        let substr = msg.substring(0,msg.length-1);
        let data = JSON.parse(substr);


        //TODO
        if (data.result==null){
        }

        if (data.method==null){
        }


        return data;
        // return data ;
        // console.log(jsonrpc);

        // let result = data.result;
        // console.log(result);

        // let id = data.id;
        // console.log(id);

        // return result;
    }
}
