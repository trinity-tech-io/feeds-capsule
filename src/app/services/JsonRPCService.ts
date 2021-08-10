import { Injectable } from '@angular/core';
import { Events } from 'src/app/services/events.service';
import { SerializeDataService } from 'src/app/services/SerializeDataService';
import { TransportService } from 'src/app/services/TransportService';
import { Logger } from './logger';

let TAG: string = 'Feeds-JSONRpc';
let eventBus = null;
let requestQueue: RequestBean[] = [];
let autoIncreaseId: number = 0;
export class RequestBean {
  constructor(
    public requestId: number,
    public method: string,
    public requestParams: any,
    public memo: any,
  ) {}
}

// 1:Result,
// 0:param,
// -1:error
export class Result {
  constructor(
    public type: number,
    public nodeId: string,
    public method: string,
    public request: object,
    public result: object,
    public error: object,
    public params: object,
  ) {}
}

export class LoginResult {
  constructor(
    public nodeId: string,
    public payload: object,
    public signature: string,
  ) {}
}

@Injectable()
export class JsonRPCService {
  constructor(
    private serializeDataService: SerializeDataService,
    private transportService: TransportService,
    private events: Events
  ) {
    eventBus = events;
    this.events.subscribe(
      FeedsEvent.PublishType.transportReceiveMessage,
      event => {
        let data = serializeDataService.decodeData(event.message);
        Logger.log(TAG, 'Receive RPC msg , nodeId is ', event.from, ' msg is ', data);
        eventBus.publish(
          FeedsEvent.PublishType.jrpcReceiveMessage,
          this.response(event.from, data),
        );
      },
    );
  }

  resolveResult(nodeId: string, msg: any): LoginResult {
    let substr = msg.substring(0, msg.length - 1);
    let data = JSON.parse(substr);

    return new LoginResult(nodeId, data.payload, data.signature);
  }

  request(
    method: string,
    nodeId: string,
    params: any,
    memo: any,
    version: string,
    onSuccess: () => void,
    onError?: (err: string) => void,
  ) {
    let id = autoIncreaseId++;
    let requestBean = new RequestBean(id, method, params, memo);
    requestQueue.push(requestBean);
    let request = this.assembleJson(id, method, params, memo, version);
    Logger.log(TAG, 'Send RPC msg , nodeId is ', nodeId, ' msg is ', request);
    let encodeData = this.serializeDataService.encodeData(request);

    this.transportService.sendArrayMessage(
      nodeId,
      encodeData,
      onSuccess,
      onError,
    );
  }

  response(nodeId: string, data: any): Result {
    // return this.parseJson(nodeId, msg);
    let res = this.parse(nodeId, data);
    return res;
  }

  assembleJson(
    id: number,
    method: string,
    params: any,
    memo: any,
    version: string,
  ): any {
    let data = {
      version: version,
      method: method,
      id: id,
    };

    if (params != null) data['params'] = params;
    return data;
  }

  parse(nodeId: string, data: any): Result {
    if (data.jsonrpc != undefined && data.jsonrpc != '2.0')
      return this.createError(nodeId, -60003, 'JsonRPC version error');

    if (data.result != undefined) {
      let request = this.queryRequest(data.id, data.result);
      return this.createResult(nodeId, request.method, request, data.result);
    }

    if (data.params != undefined)
      return this.createParamsResult(nodeId, data.params, data.method);

    if (data.error != undefined) {
      let request = this.queryRequest(data.id, data.result);
      return this.createError2(nodeId, request.method, request, data.error);
    }

    if (data.result == null) {
      let request = this.queryRequest(data.id, data.result);
      return this.createResult(nodeId, request.method, request, data.result);
    }

    return this.createError(nodeId, -69000, 'Unknown error');
  }

  queryRequest(responseId: number, result: any): any {
    for (let index = 0; index < requestQueue.length; index++) {
      if (requestQueue[index].requestId == responseId) {
        let request = requestQueue[index];
        if (
          result == null ||
          result.is_last == null ||
          result.is_last == undefined ||
          result.is_last
        )
          return requestQueue.splice(index, 1)[0];

        return request;
      }
    }
    return {};
  }

  createError(nodeId: string, errorCode: number, errorMsg: string): Result {
    let error = {};
    error['code'] = errorCode;
    error['message'] = errorMsg;
    return new Result(-1, nodeId, '', {}, {}, error, {});
  }

  createError2(
    nodeId: string,
    method: string,
    request: object,
    error: any,
  ): Result {
    return new Result(0, nodeId, method, request, {}, error, {});
  }

  createResult(
    nodeId: string,
    method: string,
    request: object,
    result: any,
  ): Result {
    if (request == null) request = {};
    return new Result(0, nodeId, method, request, result, {}, {});
  }

  createParamsResult(nodeId: string, params: any, method: string) {
    return new Result(1, nodeId, method, {}, {}, {}, params);
  }
}
