import { Injectable } from '@angular/core';
import { Events } from '@ionic/angular';
import { CarrierService } from 'src/app/services/CarrierService';
import { AgentService } from 'src/app/services/AgentService';

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

@Injectable()
export class JsonRPCService {
    constructor(
        private carrierService: CarrierService,
        private events: Events,
        private agentService: AgentService) {
        eventBus = events;
        this.events.subscribe('carrier:friendMessage', event => {
            eventBus.publish('transport:receiveMessage',this.response(event.from, event.message));
        });
    }

    request(method: string, nodeId: string,params: any, success: any, error: any){
        let id = autoIncreaseId++;
        let requestBean = new RequestBean(String(id),method,params);
        requestQueue.push(requestBean);
        let request = this.assembleJson(String(id), method, params);

        this.carrierService.sendMessage(
            nodeId,
            JSON.stringify(request),
            success,
            error
        )
    }

    response(nodeId: string, msg: string): Result{
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

    parseJson(nodeId: string, msg: string): Result{
        //TODO errorcode
        if (typeof msg != "string")
            return this.createError(nodeId, -60001, "ResultType error");

        if (msg.indexOf("jsonrpc")==-1)
            return this.createError(nodeId, -60002, "Result formate error");
        

        let substr = msg.substring(0,msg.length-1);
        let data = JSON.parse(substr);
        // let data = JSON.parse(msg);

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
