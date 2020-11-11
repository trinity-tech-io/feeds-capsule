import { Injectable } from '@angular/core';
import { Events } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { CarrierService } from 'src/app/services/CarrierService';
import { SerializeDataService } from 'src/app/services/SerializeDataService';
import { StorageService } from 'src/app/services/StorageService';

// let base64 = require('cordova/base64');
let autoIncreaseId: number = 1;
type WorkedSession = {
    nodeId      : string,
    session     : CarrierPlugin.Session,
    stream      : CarrierPlugin.Stream,
    // isStart     : boolean,
    sdp         : string,
    StreamState : FeedsData.StreamState
    sessionTimeout : NodeJS.Timer
}

type CachedData = {
    nodeId          : string,
    data            : Uint8Array,
    pointer         : number,
    headSize        : number,
    bodySize        : number,
    state           : DecodeState,
    method          : string,
    key             : string,
    mediaType            : string
}

const enum DecodeState{
    prepare ,
    decodeHead,
    decodeBody,
    finish
}

const pow32 = 0x100000000;   // 2^32
const magicNumber: number = 0x0000A5202008275A;
const version: number = 10000;

const enum WorkedState {
    sessionInitialized = "sessionInitialized",
    streamInitialized = "streamInitialized",
    streamTransportReady = "streamTransportReady",
    sessionCompletion = "sessionCompletion",
    streamConnecting = "streamConnecting",
    streamConnected = "streamConnected",
    streamStateClosed = "streamStateClosed"
}
let requestQueue: RequestBean[] = [];

type RequestBean = {
    requestId: number,
    nodeId: string,
    method: string,
    requestParams: any,
    memo: any
}

let eventBus:Events = null;
let testSum = 0;
let workedSessions: {[nodeId:string]: WorkedSession} = {}; 
let cacheData: {[nodeId:string]: CachedData} = {};
let mCarrierService: CarrierService;
let mSerializeDataService:SerializeDataService;
let mStorageService: StorageService;
let sessionConnectionTimeOut = 1*60*1000;

@Injectable()
export class SessionService {
    public friendConnectionMap: {[nodeId:string]: FeedsData.ConnState};
    constructor(
        private events: Events,
        private native: NativeService,
        private translate: TranslateService,
        private carrierService: CarrierService,
        private serializeDataService: SerializeDataService,
        private storageService:StorageService) {
            eventBus = events;
            mStorageService = this.storageService;
            mCarrierService = this.carrierService;
            mSerializeDataService = this.serializeDataService;
    }
  
    createSession(nodeId: string, onSuccess:(session: CarrierPlugin.Session, stream: CarrierPlugin.Stream)=>void, onError?:(err: string)=>void){
        this.carrierService.newSession(nodeId,(mSession)=>{
            workedSessions[nodeId] = {
                nodeId      : nodeId,
                session     : mSession,
                stream      : null,
                sdp         : "",
                StreamState : FeedsData.StreamState.RAW,
                sessionTimeout : null
            }
            this.carrierService.sessionAddStream(
                mSession,
                CarrierPlugin.StreamType.APPLICATION,
                CarrierPlugin.StreamMode.RELIABLE, 
                {
                    onStateChanged: function(event: any) {
                        if (workedSessions[nodeId] == undefined){
                            console.log(nodeId + " current session is closed");
                            return ;
                        }

                        if (event == undefined){
                            console.log("onStateChanged event undefine");
                            workedSessions[nodeId].StreamState = FeedsData.StreamState.UNKNOW
                        }else{
                            workedSessions[nodeId].StreamState = event.state
                        }

                        console.log("workedSessions[nodeId].StreamState ====>"+workedSessions[nodeId].StreamState);
                        var state_name = [
                            "raw",
                            "initialized",
                            "transport_ready",
                            "connecting",
                            "connected",
                            "deactivated",
                            "closed",
                            "failed",
                            "unknow"
                        ];

                        var msg = "Stream [" + event.stream.id + "] state changed to: " + state_name[workedSessions[nodeId].StreamState];
                        console.log(msg);
                        eventBus.publish("stream:onStateChangedCallback", nodeId, workedSessions[nodeId].StreamState);

                        if (FeedsData.StreamState.INITIALIZED == workedSessions[nodeId].StreamState){
                            workedSessions[nodeId].sessionTimeout = setTimeout(() => {
                                if (workedSessions[nodeId].StreamState != FeedsData.StreamState.CONNECTED){
                                    workedSessions[nodeId].StreamState = -1;
                                    publishError(nodeId, createCreateSessionTimeout());
                                }
                                clearTimeout(workedSessions[nodeId].sessionTimeout);
                            }, sessionConnectionTimeOut);

                            console.log("start session request");
                            mCarrierService.sessionRequest(
                                mSession,
                                function (event:any){
                                    let sdp = event.sdp;
                                    workedSessions[nodeId].sdp = sdp;
                                    console.log("sessionRequest sdp ==="+sdp);

                                    if (workedSessions[nodeId].StreamState == FeedsData.StreamState.TRANSPORT_READY){
                                        console.log("start session");
                                        mCarrierService.sessionStart(mSession, sdp, ()=>{
                                                console.log("sessionStart success");
                                            },(err)=>{
                                                publishError(nodeId, createSessionStartError());
                                                console.log("sessionStart error=>"+err);
                                            }
                                        );
                                    }
                                },
                                ()=>{
                                    console.log("sessionRequest success");
                                },(err)=>{
                                    publishError(nodeId, createSessionRequestError());
                                    console.log("sessionRequest error"+err);
                                }
                              );
                        }

                        if (FeedsData.StreamState.TRANSPORT_READY == workedSessions[nodeId].StreamState){
                            let sdp = workedSessions[nodeId].sdp;
                            console.log("sdp ==="+sdp);

                            if (sdp != ""){
                                console.log("start session");
                                mCarrierService.sessionStart(mSession, sdp, ()=>{
                                        console.log("sessionStart success");
                                    },(err)=>{
                                        publishError(nodeId, createSessionStartError());
                                        console.log("sessionStart error");
                                    }
                                );
                            }
                        }

                        if (FeedsData.StreamState.ERROR == workedSessions[nodeId].StreamState){
                            publishError(nodeId, createStateError());
                        }

                        if (FeedsData.StreamState.DEACTIVATED == workedSessions[nodeId].StreamState){
                            publishError(nodeId, createStateDeactivated());
                        }


                    },
                    onStreamData: function(event: any) {
                        let tmpData: Uint8Array = event.data;
                        if (cacheData[nodeId] == undefined){
                            cacheData[nodeId] = {
                                nodeId          : nodeId,
                                data            : new Uint8Array(tmpData.length),
                                pointer         : 0,
                                headSize        : 0,
                                bodySize        : 0,
                                state           : DecodeState.prepare,
                                method          : "",
                                key             : "",
                                mediaType       : ""
                            }
                            cacheData[nodeId].data.set(tmpData,0);
                        }else{
                            let cache: Uint8Array = cacheData[nodeId].data;
                            cacheData[nodeId].data = new Uint8Array(tmpData.length+cache.length);
                            cacheData[nodeId].data.set(cache,0);
                            cacheData[nodeId].data.set(tmpData,cache.length);
                        }
                        let dataLength = cacheData[nodeId].data.length;
                        switch(cacheData[nodeId].state){
                            case DecodeState.prepare:
                                for (let index = 0; index < dataLength - 23; index++) {
                                    let decodeMagicNumData = cacheData[nodeId].data.subarray(index,index+8);
                                    let decodeMagicNumber = decodeNum(decodeMagicNumData,8);
                                    cacheData[nodeId].pointer = index;
        
                                    if( decodeMagicNumber != magicNumber )
                                        continue;

                                    let decodeVersionData = cacheData[nodeId].data.subarray(index+8,index+12);
                                    let decodeVersion = decodeNum(decodeVersionData,4);
                                    if (decodeVersion != version)
                                        continue;

                                    let decodeHeadSizeData = cacheData[nodeId].data.subarray(index+12,index+16);
                                    let decodeHeadSize = decodeNum(decodeHeadSizeData,4);

                                    let decodeBodySizeData = cacheData[nodeId].data.subarray(index+16,index+24);
                                    let decodeBodySize = decodeNum(decodeBodySizeData,8);

                                    cacheData[nodeId].headSize = decodeHeadSize;
                                    cacheData[nodeId].bodySize = decodeBodySize;
                                    cacheData[nodeId].state = DecodeState.decodeHead;
                                    cacheData[nodeId].pointer = cacheData[nodeId].pointer + 24;
                                    break;
                                }
                                
                                if (!decodeHeadData(nodeId, dataLength)){
                                    break;
                                }
                                    
                                if (!decodeBodyData(nodeId, dataLength)){
                                    break;
                                }

                                break;
                            case DecodeState.decodeHead:
                                if (!decodeHeadData(nodeId, dataLength)){
                                    break;
                                }
                                    
                                if (!decodeBodyData(nodeId, dataLength)){
                                    break;
                                }
                                
                                break;
                            case DecodeState.decodeBody:
                                if (!decodeBodyData(nodeId, dataLength)){
                                    break;
                                }
                                break;
                        }

                        combineData(nodeId, dataLength);
                    }
                }, 
                (mStream)=>{
                    workedSessions[nodeId].stream = mStream;
                    workedSessions[nodeId].session = mSession;
                    onSuccess(mSession,mStream);
                    console.log("addStream success");
                },(err) => {
                    onError(err);
                    publishError(nodeId, createAddStreamError());
                    console.log("addStream error");
                }
            );
            },(err)=>{
                onError(err);
                publishError(nodeId, createNewSessionError());
                console.log("newSession error");
            }
        );
    }

    streamAddMagicNum(nodeId: string){
        let bytesData = encodeNum(magicNumber,8);
        // let base64 = uint8arrayToBase64(bytesData);
        this.streamAddData(nodeId, bytesData);
    }

    streamAddVersion(nodeId: string){
        
        let bytesData = encodeNum(version,4);
        // let base64 = uint8arrayToBase64(bytesData);
        this.streamAddData(nodeId, bytesData);
    }

    streamAddRequestHeadSize(nodeId: string, headSize: number){
        let bytesData = encodeNum(headSize,4);
        // let base64 = uint8arrayToBase64(bytesData);
        this.streamAddData(nodeId, bytesData);
    }

    streamAddRequestBodySize(nodeId: string, bodySize: number){
        let bytesData = encodeNum(bodySize,8);
        // let base64 = uint8arrayToBase64(bytesData);
        this.streamAddData(nodeId, bytesData);
    }

    streamAddRequest(nodeId: string, request: any){
        this.streamAddData(nodeId, request);
    }

    addHeader(nodeId: string, requestSize: number, bodySize: number, request: any, mediaType: string){
        this.streamAddMagicNum(nodeId);
        this.streamAddVersion(nodeId);
        this.streamAddRequestHeadSize(nodeId, requestSize);
        this.streamAddRequestBodySize(nodeId, bodySize);


        let requestBean: RequestBean = {
            requestId: request.id,
            nodeId: nodeId,
            method: request.method,
            requestParams: request.params,
            memo: ""
        };
        requestQueue.push(requestBean);
        console.log("request ===="+JSON.stringify(request));

        cacheData[nodeId] = {
            nodeId          : nodeId,
            data            : new Uint8Array(0),
            pointer         : 0,
            headSize        : 0,
            bodySize        : 0,
            state           : DecodeState.prepare,
            method          : "",
            key             : "",
            mediaType       : mediaType
        }
        
        // let requestBean: RequestBean = {
        //     requestId: number,
        //     method: string,
        //     requestParams: any,
        //     memo: any
        // }
        // requestQueue.push(requestBean);
    }

    buildSetBinaryRequest(accessToken: FeedsData.AccessToken, key: string){
        let id = autoIncreaseId++;
        if (accessToken == undefined)
            return ;

        let request = {
            version: "1.0",
            method : "set_binary",
            id     : id,
            params : {
                access_token: accessToken.token,
                key         : key,
                algo        : "None", // "None", "SHA256", "CRC"...
                checksum    : ""
            }
        }
        return request;
    }

    buildGetBinaryRequest(accessToken: FeedsData.AccessToken, key: string){
        let id = autoIncreaseId++;
        if (accessToken == undefined)
            return ;

        let request = {
            version: "1.0",
            method : "get_binary",
            id     : id,
            params : {
                access_token: accessToken.token,
                key         : key 
            }
        }
        return request;
    }

    handleSetBinaryResult(){

    }

    handleGetBinaryResult(){

    }

    stramAddBase64Data(nodeId: string, data: any){

    }
    
    streamAddData(nodeId: string, data: Uint8Array){
        if (data.length<=0)
            return ;

        if (workedSessions == null ||
            workedSessions == undefined ||
            workedSessions[nodeId] == undefined){
            console.log("stream null");
            return ;
        }

        let stream = workedSessions[nodeId].stream;

        testSum += data.length
        let base64 = uint8arrayToBase64(data);

        stream.write(base64,(bytesSent)=>{
            console.log("stream write success");
        },(err)=>{
            publishError(nodeId, createWriteDataError());
            console.log("stream write error ==>"+err);
        });
    }

    sessionClose(nodeId: string){
        let obj = workedSessions || "";
        if(obj === ""){
            return;
        }
        let item =  workedSessions[nodeId] || "";
        if(item === ""){
            return;
        }
        let session = workedSessions[nodeId].session || "";
        if(session === ""){
            return;
        }
        this.carrierService.sessionClose(workedSessions[nodeId].session,
            ()=>{
                delete workedSessions[nodeId];
                // workedSessions[nodeId] = undefined;
                console.log("close success");
            }
        );
    }

    getSession(nodeId: string): WorkedSession{        
        return workedSessions[nodeId];
    }
  
    stringToUint8Array(str: string): Uint8Array{
        var arr = [];
        for (var i = 0, j = str.length; i < j; ++i) {
          arr.push(str.charCodeAt(i));
        }

        var tmpUint8Array = new Uint8Array(arr);
        return tmpUint8Array
    }

    getSessionState(nodeId: string): FeedsData.StreamState{
        if (workedSessions[nodeId] == undefined)
            return -1 ;
        return workedSessions[nodeId].StreamState;
    }

    cleanData(nodeId: string){
        delete cacheData[nodeId];
    }

    cleanSession(nodeId: string){
        delete workedSessions[nodeId];
    }
}

function parseInt32(num: number): Uint8Array{
    let uint8array = new Uint8Array(4);
    uint8array[0] = (num >> 24) & 0xFF;
    uint8array[1] = (num >> 16) & 0xFF;
    uint8array[2] = (num >> 8) & 0xFF;
    uint8array[3] = num & 0xFF;

    return uint8array;
}

function parseInt64(value: number) {
    let uint8array = new Uint8Array(8);
    let hi, lo;
    if (value >= 0) {
        hi = value / pow32;
        lo = value % pow32;
    }
    else {
        value++;
        hi = Math.abs(value) / pow32;
        lo = Math.abs(value) % pow32;
        hi = ~hi;
        lo = ~lo;
    }

    uint8array[0] = (hi >> 24) & 0xFF;
    uint8array[1] = (hi >> 16) & 0xFF;
    uint8array[2] = (hi >> 8) & 0xFF;
    uint8array[3] = hi & 0xFF;
    uint8array[4] = (lo >> 24) & 0xFF;
    uint8array[5] = (lo >> 16) & 0xFF;
    uint8array[6] = (lo >> 8) & 0xFF;
    uint8array[7] = lo & 0xFF;
    
    return uint8array;
}

function encodeNum(data: number, size: number): Uint8Array{
    if (size === 4){
        return parseInt32(data);
    }else if (size === 8){
        return parseInt64(data);
    }else {
        console.log("Size error.")
        return null;
    }
}

function decodeNum(data: Uint8Array, size: number) {
    let pos = 0;
    let value = 0;
    let first = true;
    while (size-- > 0) {
        if (first) {
            let byte = data[pos++];
            value += byte & 0x7f;
            if (byte & 0x80) {
                value -= 0x80;
            }
            first = false;
        }
        else {
            value *= 256;
            value += data[pos++];
        }
    }
    return value;
}

function uint8ArrayToString(data: Uint8Array): string{
    var dataString = "";
    for (var i = 0; i < data.length; i++) {
      dataString += String.fromCharCode(data[i]);
    }
   
    return dataString
}

function uint8arrayToBase64(u8Arr: Uint8Array): any{
    let CHUNK_SIZE = 0x8000; 
    let index = 0;
    let length = u8Arr.length;
    let result = '';
    let slice;
    while (index < length) {
        slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
        result += String.fromCharCode.apply(null, slice);
        index += CHUNK_SIZE;
    }
    return btoa(result);
}

function base64ToUint8Array(base64String: string): Uint8Array {
    let padding = '='.repeat((4 - base64String.length % 4) % 4);
    let base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    let rawData = window.atob(base64);
    let outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function decodeHeadData(nodeId: string, cacheDataLength: number): boolean{
    if (cacheData == null || cacheData == undefined || cacheData[nodeId] == undefined)
        return false;

    if (cacheData[nodeId].state != DecodeState.decodeHead)
        return false;
    
    let pointer = cacheData[nodeId].pointer;
    let headSize = cacheData[nodeId].headSize;
    let remainLength = cacheDataLength - pointer;

    if (remainLength < headSize)
        return false;

    let headResponse = cacheData[nodeId].data.subarray(pointer,pointer + headSize);

    let response = mSerializeDataService.decodeData(headResponse);

    parseResponse(response);

    cacheData[nodeId].state = DecodeState.decodeBody;
    cacheData[nodeId].pointer = cacheData[nodeId].pointer + headSize;
    return true;
}

function decodeBodyData(nodeId: string, cacheDataLength: number): boolean{
    if (cacheData == null || cacheData == undefined || cacheData[nodeId] == undefined)
        return false;

    if (cacheData[nodeId].state != DecodeState.decodeBody)
        return false;

    let headSize = cacheData[nodeId].headSize;
    let pointer = cacheData[nodeId].pointer
    let bodySize = cacheData[nodeId].bodySize;
    let remainLength = cacheDataLength - pointer;

    if (remainLength < bodySize || bodySize == 0)
        return false;

    let body = cacheData[nodeId].data.subarray(pointer, pointer + bodySize);

    let value = mSerializeDataService.decodeData(body);
    
    let key = cacheData[nodeId].key;
    if (cacheData[nodeId].method == "get_binary" ){
        mStorageService.set(key,value).then(()=>{
            console.log("publish stream:getBinarySuccess "+ nodeId);
            eventBus.publish("stream:getBinarySuccess", nodeId, key, value, cacheData[nodeId].mediaType);
        });
    }
    
    cacheData[nodeId].state = DecodeState.finish;
    cacheData[nodeId].pointer = cacheData[nodeId].pointer + bodySize;
    return true;
}

function combineData(nodeId: string, cacheDataLength: number){
    if (cacheData == null || cacheData == undefined || cacheData[nodeId] == undefined)
        return false;

    if (cacheData[nodeId].state == DecodeState.finish)
        return false;

    let pointer = cacheData[nodeId].pointer;
    let remainData = cacheData[nodeId].data.subarray(pointer, cacheDataLength);

    cacheData[nodeId].data = new Uint8Array(remainData.length);
    cacheData[nodeId].data.set(remainData,0);
    cacheData[nodeId].pointer = 0;
    return true;
}

function parseResponse(response: any){
    // {"version":"1.0","id":1,"result":{"key":"8afJxa7RTamSrXWxUCcZt8jnAAjAGfx4gmN5ECwq2XSi230","algo":"None","checksum":""}}

    // {"version":"1.0","id":1,"result":{"key":"8afJxa7RTamSrXWxUCcZt8jnAAjAGfx4gmN5ECwq2XSi230"}}
    let version: string = response.version || "";
    if (version == "" || version != "1.0"){
        console.log("version error");
        return ;
    }

    let id = response.id || "";
    if (id == ""){
        console.log("id error");
        return ;
    }

    let request = queryRequest(response.id, response.result);
    let method = request.method;
    
    let nodeId = request.nodeId;
    cacheData[nodeId].method = method;
    
    // {"version":"1.0","id":1,"error":{"code":-154,"message":"MassDataUnsupportedAlgo"}}
    let error = response.error||"";
    if (error != ""){
        let code = error.code;
        let message = error.message;
        console.log("Error :: code :"+code+", message : "+message);
        publishError(nodeId, response.error);
        // return error;
        return ;
    }

    let key = response.result.key || "";
    if (key == ""){
        console.log("key error");
        return ;
    }

    cacheData[nodeId].key = key;
    if (method == "set_binary"){
        console.log("publish stream:setBinaryResponse "+ nodeId);
        console.log("publish stream:setBinarySuccess "+ nodeId);
        eventBus.publish("stream:setBinaryResponse", nodeId);
        eventBus.publish("stream:setBinarySuccess", nodeId);

    } else if (method == "get_binary"){
        console.log("publish stream:getBinaryResponse "+ nodeId);
        eventBus.publish("stream:getBinaryResponse", nodeId);

    }
}

function queryRequest(responseId: number, result: any): any{
    for (let index = 0; index < requestQueue.length; index++) {
        if (requestQueue[index].requestId == responseId){
            let request = requestQueue[index];
            if (result == null ||
                result.is_last == null ||
                result.is_last == undefined ||
                result.is_last)
                return requestQueue.splice(index,1)[0];
            
            return request;
        }
    }
    return {};
}

function createStateDeactivated(){
    let response = {
        code: FeedsData.SessionError.STREAM_STATE_DEACTIVATED,
        message: "onStateChange to DEACTIVATED"
    }

    return response;
}



function createStateError(){
    let response = {
        code: FeedsData.SessionError.STREAM_STATE_ERROR,
        message: "onStateChange to ERROR"
    }

    return response;
}
function createWriteDataError(){
    let response = {
        code: FeedsData.SessionError.WRITE_DATA_ERROR,
        message: "writeDataError"
    }

    return response;
}

function createSessionRequestError(){
    let response = {
        code: FeedsData.SessionError.SESSION_REQUEST_ERROR,
        message: "sessionRequestError"
    }
    return response;
}

function createSessionStartError(){
    let response = {
        code: FeedsData.SessionError.SESSION_START_ERROR,
        message: "sessionStartError"
    }
    return response;
}

function createAddStreamError(){
    let response = {
        code: FeedsData.SessionError.SESSION_ADD_STREAM_ERROR,
        message: "addStreamError"
    }
    return response;
}

function createNewSessionError(){
    let response = {
        code: FeedsData.SessionError.SESSION_NEW_SESSION_ERROR,
        message: "newSessionError"
    }
    return response;
}
function createCreateSessionTimeout(){
    let response = {
        code: FeedsData.SessionError.SESSION_CREATE_TIMEOUT,
        message: "createSessionTimeoutError"
    }
    return response;
}
function publishError(nodeId: string, response: any){
    eventBus.publish("stream:error", nodeId,response);
    if (cacheData == null || cacheData == undefined || cacheData[nodeId] == undefined)
        return;

    if (cacheData[nodeId].method == "set_binary"){
        eventBus.publish("stream:setBinaryError", nodeId,response);
        return ;
    }

    if (cacheData[nodeId].method == "get_binary"){
        eventBus.publish("stream:getBinaryError", nodeId,response);
        return ;
    }
}