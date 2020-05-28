import { Injectable } from '@angular/core';
import { Events } from '@ionic/angular';
import { CarrierService } from 'src/app/services/CarrierService';
import { AgentService } from 'src/app/services/AgentService';
import { SerializeDataService } from 'src/app/services/SerializeDataService'
let eventBus = null;
let requestQueue: RequestBean[] = [];
let autoIncreaseId: number = 0
export class RequestBean{
    constructor(
        public requestId: string,
        public method: string,
        public requestParams: any){}
}

// 1:Result,
// 0:param,
// -1:error
export class Result{
    constructor(
        public type: number,
        public nodeId: string,
        public method: string,
        public request: object,
        public result: object,
        public error: object,
        public params: object,
    ){}
}

export class LoginResult{
    constructor(
        public nodeId: string,
        public payload: object,
        public signature: string,
    ){}
}

@Injectable()
export class JsonRPCService {
    constructor(
        private serializeDataService: SerializeDataService,
        private carrierService: CarrierService,
        private events: Events,
        private agentService: AgentService) {
        eventBus = events;
        this.events.subscribe('transport:receiveMessage', event => {
            let data = serializeDataService.decodeData(event.message);
            eventBus.publish('JRPC:receiveMessage',this.response(event.from, data));
        });
    }

    resolveResult(nodeId: string, msg: any): LoginResult{
        let substr = msg.substring(0,msg.length-1);
        let data = JSON.parse(substr);

        return new LoginResult(nodeId,data.payload,data.signature);
    }

    sendRealMessage(nodeId: string, msg: any , onSuccess:()=>void, onError?:(err: string)=>void){
        this.carrierService.sendMessage(
            nodeId,
            JSON.stringify(msg),
            onSuccess,
            onError
        )
    }

    request(method: string, nodeId: string,params: any, success: any, error: any){
        let id = autoIncreaseId++;
        let requestBean = new RequestBean(String(id),method,params);
        requestQueue.push(requestBean);
        let request = this.assembleJson(String(id), method, params);

        let encodeData = this.serializeDataService.encodeData(request);
        this.carrierService.sendMessage(
            nodeId,
            // encodeData,
            JSON.stringify(request),
            success,
            error
        )
    }

    response(nodeId: string, msg: any): Result{
        return this.parseJson(nodeId, msg);
    }

    assembleJson(id: string, method: string, params: any): any{
        let data = {
            jsonrpc:"2.0",
            method:method,
            params:params,
            id:id
        }
        return data;
    }

    parseJson(nodeId: string, msg: any): Result{
        let data: any ;
        if (typeof msg == "string"){
            let substr = msg.substring(0,msg.length-1);
            data = JSON.parse(substr);
        }else{
            data = msg;
        }

        if (data.jsonrpc!="2.0")
            return this.createError(nodeId, -60003, "JsonRPC version error");

        if (msg.indexOf("result") != -1){
            let request = this.queryRequest(data.id);
            return this.createResult(nodeId, request.method,request.requestParams , data.result);
        }

        if (msg.indexOf("params") != -1 && data.params!=null)
            return this.createParamsResult(nodeId, data.params);
        

        if(msg.indexOf("error")!=-1)
            return data.error;
            
        return this.createError(nodeId, -69000, "Unknown error");
    }

    queryRequest(responseId: string): any{
        for (let index = 0; index < requestQueue.length; index++) {
            if (requestQueue[index].requestId == responseId){
                let request = requestQueue.splice(index,1)[0];
                return request;
            }
        }
        return {};
    }

    createError(nodeId: string , errorCode: number , errorMsg: string): Result{
        let error = {};
        error["code"] = errorCode;
        error["message"] = errorMsg;
        return new Result(-1,nodeId,"",{},{},error,{});
    }

    createResult(nodeId: string, method: string, requestParams: object , result: any): Result{
        if (requestParams == null)
            requestParams = {};
        return new Result(0,nodeId,method,requestParams,result,{},{});
    }

    createParamsResult(nodeId: string, params: any){
        return new Result(1,nodeId,"",{},{},{},params);
    }
}
