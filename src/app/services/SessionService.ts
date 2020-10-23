import { Injectable } from '@angular/core';
import { Events } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { CarrierService } from 'src/app/services/CarrierService';
import { SerializeDataService } from 'src/app/services/SerializeDataService';
import { join } from 'path';
// let base64 = require('cordova/base64');

type WorkedSession = {
    nodeId      : string,
    session     : CarrierPlugin.Session,
    stream      : CarrierPlugin.Stream,
    isStart     : boolean,
    sdp         : string
}

type CachedData = {
    nodeId          : string,
    data            : Uint8Array,
    pointer         : number,
    headSize        : number,
    bodySize        : number,
    state           : DecodeState
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

let mCarrierService;
let eventBus:Events = null;
let testSum = 0;
let workedSessions: {[nodeId:string]: WorkedSession} = {}; 
let cacheData: {[nodeId:string]: CachedData} = {};
let mSerializeDataService:SerializeDataService;
@Injectable()
export class SessionService {
    public friendConnectionMap: {[nodeId:string]: FeedsData.ConnState};
    constructor(
        private events: Events,
        private native: NativeService,
        private translate: TranslateService,
        private carrierService: CarrierService,
        private serializeDataService: SerializeDataService) {
            eventBus = events;
            mCarrierService = this.carrierService;
            mSerializeDataService = this.serializeDataService;
    }
  
    createSession(nodeId: string, onSuccess:(session: CarrierPlugin.Session, stream: CarrierPlugin.Stream)=>void, onError?:(err: string)=>void){
        this.carrierService.newSession(nodeId,(mSession)=>{
            console.log("newSession success");
            if (workedSessions)
            workedSessions[nodeId] = {
                nodeId      : nodeId,
                session     : mSession,
                stream      : null,
                isStart     : false,
                sdp         : ""
            }
            this.carrierService.sessionAddStream(
                mSession,
                CarrierPlugin.StreamType.APPLICATION,
                CarrierPlugin.StreamMode.RELIABLE, 
                {
                    onStateChanged: function(event: any) {
                        var state_name = [
                            "raw",
                            "initialized",
                            "transport_ready",
                            "connecting",
                            "connected",
                            "deactivated",
                            "closed",
                            "failed"
                        ];

                        var msg = "Stream [" + event.stream.id + "] state changed to: " + state_name[event.state];
                        console.log(msg);
                        eventBus.publish("stream:onStateChangedCallback", nodeId, state_name[event.state]);

                        if (CarrierPlugin.StreamState.INITIALIZED == event.state){
                            console.log("aaaaaaaaaaaaaaa");
                            mCarrierService.sessionRequest(
                                mSession,
                                function (event:any){
                                  console.log("3333333333333333333onSessionRequestCompleteCallback status: " + event.status + ", reason:" + event.reason + ", event.sdp:"+event.sdp);
                      
                                  if (event.status != 0) {
                                      console.log("Session complete, status: " + event.status + ", reason:" + event.reason);
                                  }
                                  else {
                                    let sdp = event.sdp;
                                    workedSessions[nodeId].sdp = sdp;
                                    mCarrierService.sessionStart(mSession, sdp, ()=>{
                                        console.log("sessionStart success");
                                        workedSessions[nodeId].isStart = true;
                                        },(err)=>{
                                        console.log("sessionStart error=>"+err);
                                        }
                                    );
                                    
                                    console.log("onSessionRequestCompleteCallback status = "+event.status);
                                    console.log("onSessionRequestCompleteCallback reason = "+event.reason);
                                    console.log("onSessionRequestCompleteCallback sdp = "+event.sdp);
                          
                          
                                    console.log("22222222222222222222222");
                                  }
                                },
                                ()=>{
                                //   onSuccess();
                                  console.log("sessionRequest success");
                                },(err)=>{
                                //   onError(err);
                                  console.log("sessionRequest error"+err);
                          
                                }
                              );
                        }

                        if (CarrierPlugin.StreamState.TRANSPORT_READY == event.state){
                            console.log("bbbbbbbbbb");
                            let sdp = workedSessions[nodeId].sdp;
                            console.log("sdp" + sdp);
                            console.log("isStart" + !workedSessions[nodeId].isStart);
                            if (sdp != "" && !workedSessions[nodeId].isStart){
                                console.log("ccccccccc");
                                mCarrierService.sessionStart(mSession, sdp, ()=>{
                                    workedSessions[nodeId].isStart = true;
                                    console.log("sessionStart success");
                                    },(err)=>{
                                    console.log("sessionStart error");
                                
                                    }
                                );
                            }
                            
                        }
                    },
                    onStreamData: function(event: any) {
                        let tmpData: Uint8Array = event.data;
                        console.log("---onStreamData---"+tmpData.length);
                        if (cacheData[nodeId] == undefined){
                            cacheData[nodeId] = {
                                nodeId          : nodeId,
                                data            : new Uint8Array(tmpData.length),
                                pointer         : 0,
                                headSize        : 0,
                                bodySize        : 0,
                                state           : DecodeState.prepare
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
                                    console.log("decodeMagicNumber="+decodeMagicNumber);
        
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
                    console.log("addStream error");
                }
            );
            },(err)=>{
                onError(err);
                console.log("newSession error");
            }
        );
    }

    sessionRequest(nodeId: string, session: CarrierPlugin.Session, onSuccess:()=>void, onError?:(err: string)=>void){
        this.carrierService.sessionRequest(
          session,
          function (event:any){
            console.log("3333333333333333333onSessionRequestCompleteCallback status: " + event.status + ", reason:" + event.reason + ", event.sdp:"+event.sdp);

            if (event.status != 0) {
                console.log("Session complete, status: " + event.status + ", reason:" + event.reason);
            }
            else {
                // carrierService.session_ctx.remote_sdp = event.sdp;
                // carrierService.session_start();
                console.log("onSessionRequestCompleteCallback status = "+event.status);
                console.log("onSessionRequestCompleteCallback reason = "+event.reason);
                console.log("onSessionRequestCompleteCallback sdp = "+event.sdp);
    
    
                console.log("22222222222222222222222");
    
                mCarrierService.sessionStart(event.session, event.sdp, ()=>{
                    console.log("sessionStart success");
                    },(err)=>{
                    console.log("sessionStart error");
                
                    }
                );
            }
          },
          ()=>{
            onSuccess();
            console.log("sessionRequest success");
          },(err)=>{
            onError(err);
            console.log("sessionRequest error");
    
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

    addHeader(nodeId: string, requestSize: number, bodySize: number){
        this.streamAddMagicNum(nodeId);
        this.streamAddVersion(nodeId);
        this.streamAddRequestHeadSize(nodeId, requestSize);
        this.streamAddRequestBodySize(nodeId, bodySize);
    }

    buildSetBinaryRequest(accessToken: string, key: string){
        let request = {
            version: "1.0",
            method : "set_binary",
            id     : 1,
            params : {
                access_token: accessToken,
                key         : key,
                algo        : "None", // "None", "SHA256", "CRC"...
                checksum    : ""
            }
        }
        return request;
    }

    buildGetBinaryRequest(accessToken: string, key: string){
        let request = {
            version: "1.0",
            method : "get_binary",
            id     : 1,
            params : {
                access_token: accessToken,
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
        if (workedSessions == null ||
            workedSessions == undefined ||
            workedSessions[nodeId] == undefined){
            console.log("stream null");
            return ;
        }

        let stream = workedSessions[nodeId].stream;

        testSum += data.length
        console.log("==========streamAddData============testSum = "+testSum);
        console.log("==========streamAddData============data.length = "+data.length);
        

        // console.log("==========streamAddData============"+JSON.stringify(data));
        let base64 = uint8arrayToBase64(data);

        stream.write(base64,(bytesSent)=>{
            console.log("stream write success");
            // console.log("bytesSent===>"+JSON.stringify(bytesSent));
        },(err)=>{
            console.log("stream write error ==>"+err);
        });
    }
    
    onStreamDataCallback(event) {




        // let tmpData: Uint8Array = event.data;

        // cacheData[nodeId]

        // if(catchData)
        
        // console.log("Stream [" + event.stream.id + "] received data [" + event.data + "]");
        // console.log("data = "+uint8ArrayToString(event.data));


        // cacheData.push(event.data);
        // console.log("cacheData ==>"+cacheData.length);
        // console.log("cacheData ==>"+JSON.stringify(cacheData));
        // let magicNumberData = cacheData.slice(0,8);
        // console.log("magicNumberData = "+JSON.stringify(magicNumberData));
        // let magicNumber = mSerializeDataService.decodeData(event.data);
        // console.log("magicNumber = "+magicNumber);
        // if (cacheData.length>=12){
        //     let magicNumberData = cacheData.slice(0,8);
        //     console.log("magicNumberData = "+JSON.stringify(magicNumberData));
        //     let magicNumber = mSerializeDataService.decodeData(magicNumberData);
        //     console.log("magicNumber = "+magicNumber);
    
        //     let versionData = cacheData.slice(9,12);
        //     console.log("versionData = "+JSON.stringify(versionData));
        //     let version = mSerializeDataService.decodeData(versionData);
        //     console.log("version = "+version);
    
        //     console.log("data type= "+typeof(event.data));
            
        // }

        eventBus.publish("stream:onStreamDataCallback",(event.stream.id, event.data));
        
    }
    
    onStateChangedCallback(event) {
        var state_name = [
            "raw",
            "initialized",
            "transport_ready",
            "connecting",
            "connected",
            "deactivated",
            "closed",
            "failed"
        ];

        var msg = "Stream [" + event.stream.id + "] state changed to: " + state_name[event.state];
        console.log(msg);
        eventBus.publish("stream:onStateChangedCallback",(event.stream.id, state_name[event.state]));
    }

    sessionClose(nodeId: string){
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

    toBytes(oldBuffer: Uint8Array){
        let magicNumber = 0x0000A5202008275A;
        let magicNumberBytes = encodeNum(magicNumber, 8);
        console.log("777777=====>"+JSON.stringify(magicNumberBytes)); 
        console.log("777777=====>"+JSON.stringify(decodeNum(magicNumberBytes, 8))); 

        let version = 10000;
        let versionBytes = encodeNum(version, 4);
        console.log("3333333333===>"+JSON.stringify(versionBytes));
        console.log("3333333333===>"+JSON.stringify(decodeNum(versionBytes,4)));        
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
// function uint8ToBase64 (rawData) {
//     var numBytes = rawData.byteLength;
//     var output = '';
//     var segment;
//     var table = b64_12bitTable();
//     for (var i = 0; i < numBytes - 2; i += 3) {
//         segment = (rawData[i] << 16) + (rawData[i + 1] << 8) + rawData[i + 2];
//         output += table[segment >> 12];
//         output += table[segment & 0xfff];
//     }
//     if (numBytes - i === 2) {
//         segment = (rawData[i] << 16) + (rawData[i + 1] << 8);
//         output += table[segment >> 12];
//         output += b64_6bit[(segment & 0xfff) >> 6];
//         output += '=';
//     } else if (numBytes - i === 1) {
//         segment = (rawData[i] << 16);
//         output += table[segment >> 12];
//         output += '==';
//     }
//     return output;
// }

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
    console.log("--------cacheDataLength--------"+cacheDataLength);

    console.log("--------remainLength--------"+remainLength);
    console.log("--------pointer--------"+pointer);
    console.log("--------headSize--------"+headSize);
    let headResponse = cacheData[nodeId].data.subarray(pointer,pointer + headSize);
    console.log("--------headResponse--------"+JSON.stringify(headResponse));
    console.log("--------response--------"+headResponse.length);

    let test = uint8ArrayToString(headResponse);
    console.log("----------response body----------"+JSON.stringify(test));

    if (mSerializeDataService == undefined){
        console.log("----------undefined----------");
    }else{
        console.log("----------nononono----------");
    }
    let response = mSerializeDataService.decodeData(headResponse);
    console.log("----------response body----------"+JSON.stringify(response));

    
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

    if (remainLength < bodySize)
        return false;

    let body = cacheData[nodeId].data.subarray(pointer, pointer + bodySize);
    console.log("----------body----------"+body.length);
    

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

    console.log("remainData =="+remainData.length);
    console.log("pointer =="+pointer);
    cacheData[nodeId].data = new Uint8Array(remainData.length);
    cacheData[nodeId].data.set(remainData,0);
    cacheData[nodeId].pointer = 0;
    return true;
}