import { Injectable } from '@angular/core';
import { Events } from '@ionic/angular';
import { AgentService } from 'src/app/services/AgentService';
import { SerializeDataService } from 'src/app/services/SerializeDataService'
import { TransportService } from 'src/app/services/TransportService'

let eventBus = null;
let requestQueue: RequestBean[] = [];
let autoIncreaseId: number = 0
export class RequestBean{
    constructor(
        public requestId: number,
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
        private transportService: TransportService,
        private events: Events,
        private agentService: AgentService) {
        eventBus = events;
        this.events.subscribe('transport:receiveMessage', event => {
            let data = serializeDataService.decodeData(event.message);
            console.log("receive--->"+JSON.stringify(data));

            eventBus.publish('jrpc:receiveMessage',this.response(event.from, data));
        });
    }

    resolveResult(nodeId: string, msg: any): LoginResult{
        let substr = msg.substring(0,msg.length-1);
        let data = JSON.parse(substr);

        return new LoginResult(nodeId,data.payload,data.signature);
    }

    request(method: string, nodeId: string,params: any, success: any, error: any){
        let id = autoIncreaseId++;
        let requestBean = new RequestBean(id,method,params);
        requestQueue.push(requestBean);
        let request = this.assembleJson(id, method, params);

        console.log("request--->"+JSON.stringify(request));

        let encodeData = this.serializeDataService.encodeData(request);

        // this.carrierService.sendMessage(
        //     nodeId,
        //     // encodeData,
        //     JSON.stringify(request),
        //     success,
        //     error
        // )

        this.transportService.sendArrayMessage(
            nodeId,
            encodeData,
            success,
            error
        )
    }

    response(nodeId: string, data: any): Result{
        // return this.parseJson(nodeId, msg);
        return this.parse(nodeId, data);
    }

    assembleJson(id: number, method: string, params: any): any{
        let data = {
            version:"1.0",
            method:method,
            id:id
        }

        if (params != null)
            data["params"] = params;
        return data;
    }

    parse(nodeId: string, data: any): Result{
        if (data.jsonrpc != undefined && data.jsonrpc!="2.0")
            return this.createError(nodeId, -60003, "JsonRPC version error");

        if (data.result != undefined){
            let request = this.queryRequest(data.id);
            return this.createResult(nodeId, request.method,request.requestParams , data.result);
        }

        if (data.params != undefined)
            return this.createParamsResult(nodeId, data.params, data.method);
        

        if(data.error != undefined)
            return data.error;
            
        if(data.result == null){
            let request = this.queryRequest(data.id);
            return this.createResult(nodeId, request.method,request.requestParams , data.result);
        }
        return this.createError(nodeId, -69000, "Unknown error");
    }

    parseJson(nodeId: string, msg: string): Result{
        let data: any ;
        let substr = msg.substring(0,msg.length-1);
        data = JSON.parse(substr);

        // if (data.jsonrpc!="2.0")
        //     return this.createError(nodeId, -60003, "JsonRPC version error");

        if (msg.indexOf("result") != -1){
            let request = this.queryRequest(data.id);
            return this.createResult(nodeId, request.method,request.requestParams , data.result);
        }

        if (msg.indexOf("params") != -1 && data.params!=null)
            return this.createParamsResult(nodeId, data.params, data.method);
        

        if(msg.indexOf("error")!=-1)
            return data.error;
            
        return this.createError(nodeId, -69000, "Unknown error");
    }

    queryRequest(responseId: number): any{
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

    createParamsResult(nodeId: string, params: any, method: string){
        return new Result(1,nodeId,method,{},{},{},params);
    }
}
