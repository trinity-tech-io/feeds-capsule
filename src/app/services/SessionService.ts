import { Injectable } from '@angular/core';
import { Events } from 'src/app/services/events.service';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { CarrierService } from 'src/app/services/CarrierService';
import { SerializeDataService } from 'src/app/services/SerializeDataService';
import { StorageService } from 'src/app/services/StorageService';
import { Logger } from './logger';

let TAG: string = 'Feeds-session';

let autoIncreaseId: number = 1;
type WorkedSession = {
  nodeId: string;
  session: CarrierPlugin.Session;
  stream: CarrierPlugin.Stream;
  sdp: string;
  StreamState: FeedsData.StreamState;
  sessionTimeout: NodeJS.Timer;
};

type Progress = {
  nodeId: string;
  key: string;
  method: string;
  pointer: number;
  totalSize: number;
  progress: number;
};

type CachedData = {
  nodeId: string;
  data: Uint8Array;
  pointer: number;
  headSize: number;
  bodySize: number;
  state: DecodeState;
  method: string;
  key: string;
  mediaType: string;
  unprocessLength: number;
  unProcessDatas: Uint8Array[];
};

const enum DecodeState {
  prepare,
  decodeHead,
  decodeBody,
  finish,
}

const pow32 = 0x100000000; // 2^32
const magicNumber: number = 0x0000a5202008275a;
const version: number = 10000;

let requestQueue: RequestBean[] = [];

type RequestBean = {
  requestId: number;
  nodeId: string;
  method: string;
  requestParams: any;
  memo: any;
};

let eventBus: Events = null;
let workedSessions: { [nodeId: string]: WorkedSession } = {};
let progress: { [nodeId: string]: Progress } = {};
let cacheData: { [nodeId: string]: CachedData } = {};
let mCarrierService: CarrierService;
let mSerializeDataService: SerializeDataService;
let mStorageService: StorageService;
let sessionConnectionTimeOut = 1 * 60 * 1000;
let isBusy = false;
@Injectable()
export class SessionService {
  public friendConnectionMap: { [nodeId: string]: FeedsData.ConnState };
  constructor(
    private events: Events,
    private native: NativeService,
    private translate: TranslateService,
    private carrierService: CarrierService,
    private serializeDataService: SerializeDataService,
    private storageService: StorageService
  ) {
    eventBus = events;
    mStorageService = this.storageService;
    mCarrierService = this.carrierService;
    mSerializeDataService = this.serializeDataService;
  }

  createSession(
    nodeId: string,
    memo: FeedsData.SessionMemoData,
    onSuccess: (
      session: CarrierPlugin.Session,
      stream: CarrierPlugin.Stream,
    ) => void,
    onError?: (err: string) => void,
  ) {
    this.carrierService.newSession(
      nodeId,
      mSession => {
        isBusy = true;
        workedSessions[nodeId] = {
          nodeId: nodeId,
          session: mSession,
          stream: null,
          sdp: '',
          StreamState: FeedsData.StreamState.RAW,
          sessionTimeout: null,
        };

        this.carrierService.sessionAddStream(
          mSession,
          CarrierPlugin.StreamType.APPLICATION,
          CarrierPlugin.StreamMode.RELIABLE,
          {
            onStateChanged: function(event: any) {
              if (workedSessions[nodeId] == undefined) {
                isBusy = false;
                Logger.log(TAG, 'Session was closed, nodeId is ', nodeId);
                return;
              }

              if (event == undefined) {
                Logger.log(TAG, 'Session state change to unknow, nodeId is ', nodeId);
                workedSessions[nodeId].StreamState =
                  FeedsData.StreamState.UNKNOW;
              } else {
                workedSessions[nodeId].StreamState = event.state;
              }

              var state_name = [
                'raw',
                'initialized',
                'transport_ready',
                'connecting',
                'connected',
                'deactivated',
                'closed',
                'failed',
                'unknow',
              ];
              Logger.log(TAG, 'Session stream [', event.stream.id, '] state change to ', state_name[workedSessions[nodeId].StreamState], ' nodeId is ', nodeId);
              let streamStateChangedData: FeedsEvent.StreamStateChangedData = {
                nodeId: nodeId,
                streamState: workedSessions[nodeId].StreamState,
              };

              eventBus.publish(
                FeedsEvent.PublishType.innerStreamStateChanged,
                streamStateChangedData,
              );

              if (
                workedSessions[nodeId] != undefined &&
                FeedsData.StreamState.INITIALIZED ==
                  workedSessions[nodeId].StreamState
              ) {
                workedSessions[nodeId].sessionTimeout = setTimeout(() => {
                  if (
                    workedSessions[nodeId] != undefined &&
                    workedSessions[nodeId].StreamState !=
                      FeedsData.StreamState.CONNECTED
                  ) {
                    workedSessions[nodeId].StreamState =
                      FeedsData.StreamState.NOTINIT;
                    publishError(nodeId, createCreateSessionTimeout(), memo);
                  }
                  if (workedSessions[nodeId] != undefined)
                    clearTimeout(workedSessions[nodeId].sessionTimeout);
                }, sessionConnectionTimeOut);

                Logger.log(TAG, 'Prepare send session request to the friend, nodeId is ', nodeId);
                mCarrierService.sessionRequest(
                  mSession,
                  function(event: any) {
                    let sdp = event.sdp;
                    workedSessions[nodeId].sdp = sdp;
                    Logger.log(TAG, 'Receive the session response, nodeId is ', nodeId, ', sdp is ', sdp);
                    if (
                      workedSessions[nodeId] != undefined &&
                      workedSessions[nodeId].StreamState ==
                        FeedsData.StreamState.TRANSPORT_READY
                    ) {
                      sessionStart(nodeId, mSession, sdp, memo);
                    }
                  },
                  () => {
                    Logger.log(TAG, 'Session request success, nodeId is ', nodeId);
                  },
                  err => {
                    publishError(nodeId, createSessionRequestError(), memo);
                    Logger.error(TAG, 'Session request error, nodeId is ', nodeId, ' error msg is ', err);
                  },
                );
              }

              if (
                workedSessions[nodeId] != undefined &&
                FeedsData.StreamState.TRANSPORT_READY ==
                  workedSessions[nodeId].StreamState
              ) {
                let sdp = workedSessions[nodeId].sdp;
                Logger.log(TAG, "Get ready to execute 'start session', nodeId is ", nodeId, ' transport ready, sdp is ', sdp);
                if (sdp != '') {
                  sessionStart(nodeId, mSession, sdp, memo);
                }
              }

              if (
                workedSessions[nodeId] != undefined &&
                FeedsData.StreamState.ERROR ==
                  workedSessions[nodeId].StreamState
              ) {
                publishError(nodeId, createStateError(), memo);
              }

              if (
                workedSessions[nodeId] != undefined &&
                FeedsData.StreamState.DEACTIVATED ==
                  workedSessions[nodeId].StreamState
              ) {
                publishError(nodeId, createStateDeactivated(), memo);
              }

              if (
                workedSessions[nodeId] != undefined &&
                FeedsData.StreamState.CLOSED ==
                  workedSessions[nodeId].StreamState
              ) {
                publishCloseSession(nodeId);
              }
            },

            onStreamData: function(event: any) {
              let tmpData: Uint8Array = event.data;
              Logger.log(TAG, 'Receive stream data callback, nodeId is', nodeId, 'data length is', tmpData.length);
              if (cacheData[nodeId] == undefined) {
                cacheData[nodeId] = {
                  nodeId: nodeId,
                  data: new Uint8Array(0),
                  pointer: 0,
                  headSize: 0,
                  bodySize: 0,
                  state: DecodeState.prepare,
                  method: '',
                  key: '',
                  mediaType: '',
                  unprocessLength: 0,
                  unProcessDatas: [],
                };
              }

              if (DecodeState.decodeBody == cacheData[nodeId].state) {
                checkBody(nodeId, tmpData);
                return;
              }

              let cache: Uint8Array = cacheData[nodeId].data;
              cacheData[nodeId].data = new Uint8Array(
                tmpData.length + cache.length,
              );
              cacheData[nodeId].data.set(cache, 0);
              cacheData[nodeId].data.set(tmpData, cache.length);
              decodeData(nodeId);
            },
          },
          mStream => {
            workedSessions[nodeId].stream = mStream;
            workedSessions[nodeId].session = mSession;
            onSuccess(mSession, mStream);
            Logger.log(TAG, "Excute 'addStream' success, nodeId is ", nodeId);
          },
          err => {
            onError(err);
            publishError(nodeId, createAddStreamError(), memo);
            Logger.error(TAG, "Excute 'addStream' error, nodeId is ", nodeId, ' error msg is ', err);
          },
        );
      },
      err => {
        onError(err);
        publishError(nodeId, createNewSessionError(), memo);
        Logger.error(TAG, "Excute 'newSession' error, nodeId is", nodeId, ' error msg is', err);
      },
    );
  }

  streamAddMagicNum(nodeId: string, memo: any) {
    let bytesData = encodeNum(magicNumber, 8);
    this.streamAddData(nodeId, bytesData, memo);
  }

  streamAddVersion(nodeId: string, memo: any) {
    let bytesData = encodeNum(version, 4);
    this.streamAddData(nodeId, bytesData, memo);
  }

  streamAddRequestHeadSize(nodeId: string, headSize: number, memo: any) {
    let bytesData = encodeNum(headSize, 4);
    this.streamAddData(nodeId, bytesData, memo);
  }

  streamAddRequestBodySize(nodeId: string, bodySize: number, memo: any) {
    let bytesData = encodeNum(bodySize, 8);
    this.streamAddData(nodeId, bytesData, memo);
  }

  streamAddRequest(nodeId: string, request: any, memo: any) {
    this.streamAddData(nodeId, request, memo);
  }

  addHeader(
    nodeId: string,
    requestSize: number,
    bodySize: number,
    request: any,
    mediaType: string,
    method: string,
    key: string,
    memo: any,
  ) {
    this.streamAddMagicNum(nodeId, memo);
    this.streamAddVersion(nodeId, memo);
    this.streamAddRequestHeadSize(nodeId, requestSize, memo);
    this.streamAddRequestBodySize(nodeId, bodySize, memo);

    progress[nodeId] = {
      nodeId: nodeId,
      key: key,
      method: method,
      pointer: 0,
      totalSize: bodySize,
      progress: 0,
    };

    let requestBean: RequestBean = {
      requestId: request.id,
      nodeId: nodeId,
      method: request.method,
      requestParams: request.params,
      memo: memo,
    };
    requestQueue.push(requestBean);
    Logger.log(TAG, 'Generate request params, nodeId is', nodeId, ' params is ', request);
    cacheData[nodeId] = {
      nodeId: nodeId,
      data: new Uint8Array(0),
      pointer: 0,
      headSize: 0,
      bodySize: 0,
      state: DecodeState.prepare,
      method: '',
      key: '',
      mediaType: mediaType,
      unprocessLength: 0,
      unProcessDatas: [],
    };
  }

  buildSetBinaryRequest(accessToken: FeedsData.AccessToken, key: string) {
    let id = autoIncreaseId++;
    if (accessToken == null || accessToken == undefined) return;

    let request = {
      version: '1.0',
      method: 'set_binary',
      id: id,
      params: {
        access_token: accessToken.token,
        key: key,
        algo: 'None', // "None", "SHA256", "CRC"...
        checksum: '',
      },
    };
    return request;
  }

  buildGetBinaryRequest(accessToken: FeedsData.AccessToken, key: string) {
    let id = autoIncreaseId++;
    if (accessToken == null || accessToken == undefined) return;

    let request = {
      version: '1.0',
      method: 'get_binary',
      id: id,
      params: {
        access_token: accessToken.token,
        key: key,
      },
    };
    return request;
  }

  streamAddData(
    nodeId: string,
    data: Uint8Array,
    memo: FeedsData.SessionMemoData,
  ) {
    if (data.length <= 0) return;

    if (
      workedSessions == null ||
      workedSessions == undefined ||
      workedSessions[nodeId] == undefined
    ) {
      Logger.error(TAG, "Excute 'add data' error , session changed to null , nodeId is", nodeId);
      return;
    }

    let stream = workedSessions[nodeId].stream;

    let base64 = uint8arrayToBase64(data);

    if (
      progress[nodeId] != undefined &&
      progress[nodeId].method == 'set_binary'
    ) {
      progress[nodeId].pointer += data.length;
      calculateProgress(nodeId);
    }

    stream.write(
      base64,
      bytesSent => {
      },
      err => {
        publishError(nodeId, createWriteDataError(), memo);
        Logger.error(TAG, 'Write date to ', nodeId, ' error ', err);
      },
    );
  }

  sessionClose(nodeId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let obj = workedSessions || '';
      if (obj === '') {
        return;
      }
      let item = workedSessions[nodeId] || '';
      if (item === '') {
        return;
      }
      let session = workedSessions[nodeId].session || '';
      if (session === '') {
        return;
      }
      Logger.log(TAG, 'Close session , nodeId is ', nodeId);
      this.carrierService.sessionClose(
        workedSessions[nodeId].session,
        () => {
          workedSessions[nodeId] = undefined;
          delete workedSessions[nodeId];

          progress[nodeId] = undefined;
          delete progress[nodeId];

          cacheData[nodeId] = undefined;
          delete cacheData[nodeId];
          Logger.log(TAG, 'Close session success, nodeId is ', nodeId);
          isBusy = false;
          resolve('success');
        },
        error => {
          reject('error');
        },
      );
    });
  }

  getSession(nodeId: string): WorkedSession {
    if (workedSessions == null || workedSessions == undefined)
      workedSessions = {};
    return workedSessions[nodeId];
  }

  checkSessionIsBusy(): boolean {
    return isBusy;
  }

  stringToUint8Array(str: string): Uint8Array {
    var arr = [];
    for (var i = 0, j = str.length; i < j; ++i) {
      arr.push(str.charCodeAt(i));
    }

    var tmpUint8Array = new Uint8Array(arr);
    return tmpUint8Array;
  }

  getSessionState(nodeId: string): FeedsData.StreamState {
    if (
      workedSessions == null ||
      workedSessions == undefined ||
      workedSessions[nodeId] == null ||
      workedSessions[nodeId] == undefined
    )
      return -1;
    return workedSessions[nodeId].StreamState;
  }

  cleanData(nodeId: string) {
    delete cacheData[nodeId];
  }

  cleanSession(nodeId: string) {
    delete workedSessions[nodeId];
  }
}

function parseInt32(num: number): Uint8Array {
  let uint8array = new Uint8Array(4);
  uint8array[0] = (num >> 24) & 0xff;
  uint8array[1] = (num >> 16) & 0xff;
  uint8array[2] = (num >> 8) & 0xff;
  uint8array[3] = num & 0xff;

  return uint8array;
}

function parseInt64(value: number) {
  let uint8array = new Uint8Array(8);
  let hi, lo;
  if (value >= 0) {
    hi = value / pow32;
    lo = value % pow32;
  } else {
    value++;
    hi = Math.abs(value) / pow32;
    lo = Math.abs(value) % pow32;
    hi = ~hi;
    lo = ~lo;
  }

  uint8array[0] = (hi >> 24) & 0xff;
  uint8array[1] = (hi >> 16) & 0xff;
  uint8array[2] = (hi >> 8) & 0xff;
  uint8array[3] = hi & 0xff;
  uint8array[4] = (lo >> 24) & 0xff;
  uint8array[5] = (lo >> 16) & 0xff;
  uint8array[6] = (lo >> 8) & 0xff;
  uint8array[7] = lo & 0xff;

  return uint8array;
}

function encodeNum(data: number, size: number): Uint8Array {
  if (size === 4) {
    return parseInt32(data);
  } else if (size === 8) {
    return parseInt64(data);
  } else {
    Logger.error(TAG, 'Encode number size error, data size is ', size);
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
    } else {
      value *= 256;
      value += data[pos++];
    }
  }
  return value;
}

function uint8ArrayToString(data: Uint8Array): string {
  var dataString = '';
  for (var i = 0; i < data.length; i++) {
    dataString += String.fromCharCode(data[i]);
  }

  return dataString;
}

function uint8arrayToBase64(u8Arr: Uint8Array): any {
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
  let padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  let base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  let rawData = window.atob(base64);
  let outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function decodeHeadData(nodeId: string): boolean {
  if (
    cacheData == null ||
    cacheData == undefined ||
    cacheData[nodeId] == undefined
  )
    return false;

  if (cacheData[nodeId].state != DecodeState.decodeHead) return false;

  let pointer = cacheData[nodeId].pointer;
  let headSize = cacheData[nodeId].headSize;
  let remainLength = cacheData[nodeId].data.length - pointer;

  if (remainLength < headSize) return false;

  let headResponse = cacheData[nodeId].data.subarray(
    pointer,
    pointer + headSize,
  );

  let response = mSerializeDataService.decodeData(headResponse);

  parseResponse(response);

  cacheData[nodeId].state = DecodeState.decodeBody;
  cacheData[nodeId].pointer = cacheData[nodeId].pointer + headSize;
  return true;
}

function decodeBodyData(nodeId: string): boolean {
  if (
    cacheData == null ||
    cacheData == undefined ||
    cacheData[nodeId] == undefined
  )
    return false;

  if (cacheData[nodeId].state != DecodeState.decodeBody) return false;

  let headSize = cacheData[nodeId].headSize;
  let pointer = cacheData[nodeId].pointer;
  let bodySize = cacheData[nodeId].bodySize;
  let remainLength = cacheData[nodeId].data.length - pointer;

  if (
    progress[nodeId] != undefined &&
    progress[nodeId].method == 'get_binary'
  ) {
    progress[nodeId].totalSize = bodySize;
    progress[nodeId].pointer = remainLength;
    calculateProgress(nodeId);
  }

  if (remainLength < bodySize || bodySize == 0) return false;

  let body = cacheData[nodeId].data.subarray(pointer, pointer + bodySize);

  let value = mSerializeDataService.decodeData(body);

  let key = cacheData[nodeId].key;
  if (cacheData[nodeId].method == 'get_binary') {
    mStorageService.set(key, value).then(() => {
      Logger.log(TAG, 'Decode body data and save to storage success, nodeId is ', nodeId, ', data key is ', key);
      let getBinaryData: FeedsEvent.GetBinaryData = {
        nodeId: nodeId,
        key: key,
        value: value,
      };
    });
  }

  cacheData[nodeId].state = DecodeState.finish;
  cacheData[nodeId].pointer = cacheData[nodeId].pointer + bodySize;
  return true;
}

function combineData(nodeId: string) {
  if (
    cacheData == null ||
    cacheData == undefined ||
    cacheData[nodeId] == undefined
  )
    return false;

  if (cacheData[nodeId].state == DecodeState.finish) return false;

  let pointer = cacheData[nodeId].pointer;
  let remainData = cacheData[nodeId].data.subarray(
    pointer,
    cacheData[nodeId].data.length,
  );

  cacheData[nodeId].data = new Uint8Array(remainData.length);
  cacheData[nodeId].data.set(remainData, 0);
  cacheData[nodeId].pointer = 0;

  cacheData[nodeId].unprocessLength = cacheData[nodeId].data.length;
  return true;
}

function parseResponse(response: any) {
  // {"version":"1.0","id":1,"result":{"key":"8afJxa7RTamSrXWxUCcZt8jnAAjAGfx4gmN5ECwq2XSi230","algo":"None","checksum":""}}

  // {"version":"1.0","id":1,"result":{"key":"8afJxa7RTamSrXWxUCcZt8jnAAjAGfx4gmN5ECwq2XSi230"}}
  let version: string = response.version || '';
  if (version == '' || version != '1.0') {
    Logger.error(TAG, 'Parse response version err, version is', version);
    return;
  }

  let id = response.id || '';
  if (id == '') {
    Logger.error(TAG, 'Parse response id err, id is', id);
    return;
  }

  let request = queryRequest(response.id, response.result);
  Logger.error(TAG, 'Receive Session Response, Request is ', request);

  let method = request.method;
  let nodeId = request.nodeId;
  cacheData[nodeId].method = method;

  let memo = request.memo;
  let tempId = "0";
  let feedId = "0";
  let postId = "0";
  let commentId = 0;
  if (memo != null || memo != undefined) {
    feedId = memo.feedId;
    postId = memo.postId;
    commentId = memo.commentId;
    tempId = memo.tempId;
  }

  // {"version":"1.0","id":1,"error":{"code":-154,"message":"MassDataUnsupportedAlgo"}}
  let error = response.error || '';
  if (error != '') {
    let code = error.code;
    let message = error.message;
    Logger.error(TAG,
      'Receive error form response, nodeId is ',
      nodeId,
      ', error code is ',
      code,
      ', error message is ',
      message
    );
    publishError(nodeId, response.error, memo);
    return;
  }

  let key = response.result.key || '';
  if (key == '') {
    Logger.error(TAG, 'Receive error form response, but data key is null');
    return;
  }

  isBusy = false;
  cacheData[nodeId].key = key;
  if (method == 'set_binary') {
    Logger.log(TAG, "Parse 'set_binary' data finish and publish events, nodeId is ", nodeId);
    let setBinaryFinishData: FeedsEvent.setBinaryFinishData = {
      nodeId: nodeId,
      feedId: feedId,
      postId: postId,
      commentId: commentId,
      tempId: tempId,
    };

    let setBinaryData: FeedsEvent.setBinaryFinishData = {
      nodeId: nodeId,
      feedId: feedId,
      postId: postId,
      commentId: commentId,
      tempId: tempId,
    };
    eventBus.publish(
      FeedsEvent.PublishType.innerStreamSetBinaryFinish,
      setBinaryData,
    );
  } else if (method == 'get_binary') {
    Logger.log(TAG, "Parse 'get_binary' data finish and publish events, nodeId is ", nodeId);
  }
}

function publishCloseSession(nodeId: string) {
  isBusy = false;
}

function queryRequest(responseId: number, result: any): any {
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

function createStateDeactivated() {
  let response = {
    code: FeedsData.SessionError.STREAM_STATE_DEACTIVATED,
    message: 'onStateChange to DEACTIVATED',
  };
  return response;
}

function createStateError() {
  let response = {
    code: FeedsData.SessionError.STREAM_STATE_ERROR,
    message: 'onStateChange to ERROR',
  };
  return response;
}

function createWriteDataError() {
  let response = {
    code: FeedsData.SessionError.WRITE_DATA_ERROR,
    message: 'writeDataError',
  };
  return response;
}

function createSessionRequestError() {
  let response = {
    code: FeedsData.SessionError.SESSION_REQUEST_ERROR,
    message: 'sessionRequestError',
  };
  return response;
}

function createSessionStartError() {
  let response = {
    code: FeedsData.SessionError.SESSION_START_ERROR,
    message: 'sessionStartError',
  };
  return response;
}

function createAddStreamError() {
  let response = {
    code: FeedsData.SessionError.SESSION_ADD_STREAM_ERROR,
    message: 'addStreamError',
  };
  return response;
}

function createNewSessionError() {
  let response = {
    code: FeedsData.SessionError.SESSION_NEW_SESSION_ERROR,
    message: 'newSessionError',
  };
  return response;
}

function createCreateSessionTimeout() {
  let response = {
    code: FeedsData.SessionError.SESSION_CREATE_TIMEOUT,
    message: 'createSessionTimeoutError',
  };
  return response;
}

function publishError(
  nodeId: string,
  error: any,
  memo: FeedsData.SessionMemoData = null,
) {
  isBusy = false;
  let streamErrorData: FeedsEvent.StreamErrorData = {
    nodeId: nodeId,
    error: error,
  };

  let innerStreamErrorData: FeedsEvent.InnerStreamErrorData = {
    nodeId: nodeId,
    error: error,
    memo: memo,
  };
  eventBus.publish(
    FeedsEvent.PublishType.innerStreamError,
    innerStreamErrorData,
  );

  if (
    cacheData == null ||
    cacheData == undefined ||
    cacheData[nodeId] == undefined
  )
    return;

  if (cacheData[nodeId].method == 'set_binary') {
    let streamErrorData: FeedsEvent.StreamErrorData = {
      nodeId: nodeId,
      error: error,
    };

    return;
  }

  if (cacheData[nodeId].method == 'get_binary') {
    let streamErrorData: FeedsEvent.StreamErrorData = {
      nodeId: nodeId,
      error: error,
    };

    return;
  }
}

function calculateProgress(nodeId: string) {
  if (progress[nodeId] == undefined) return;

  if (progress[nodeId].totalSize <= 0) return;

  let curProgress = Math.floor(
    (progress[nodeId].pointer / progress[nodeId].totalSize) * 100,
  );
  if (progress[nodeId].progress < curProgress) {
    progress[nodeId].progress = curProgress;
    publishProgress(
      nodeId,
      progress[nodeId].progress,
      progress[nodeId].method,
      progress[nodeId].key,
    );
  }
}

function publishProgress(
  nodeId: string,
  progress: number,
  method: string,
  key: string,
) {
  Logger.log(TAG,
    'Publish stream process progress, nodeId is ',
    nodeId,
    ', progress is ',
    progress
  );

  let streamProgressData: FeedsEvent.StreamProgressData = {
    nodeId: nodeId,
    progress: progress,
    method: method,
    key: key,
  };
}

function decodeHeader(nodeId: string) {
  for (let index = 0; index < cacheData[nodeId].data.length - 23; index++) {
    let decodeMagicNumData = cacheData[nodeId].data.subarray(index, index + 8);
    let decodeMagicNumber = decodeNum(decodeMagicNumData, 8);
    cacheData[nodeId].pointer = index;

    if (decodeMagicNumber != magicNumber) continue;

    let decodeVersionData = cacheData[nodeId].data.subarray(
      index + 8,
      index + 12,
    );
    let decodeVersion = decodeNum(decodeVersionData, 4);
    if (decodeVersion != version) continue;

    let decodeHeadSizeData = cacheData[nodeId].data.subarray(
      index + 12,
      index + 16,
    );
    let decodeHeadSize = decodeNum(decodeHeadSizeData, 4);

    let decodeBodySizeData = cacheData[nodeId].data.subarray(
      index + 16,
      index + 24,
    );
    let decodeBodySize = decodeNum(decodeBodySizeData, 8);

    cacheData[nodeId].headSize = decodeHeadSize;
    cacheData[nodeId].bodySize = decodeBodySize;
    cacheData[nodeId].state = DecodeState.decodeHead;
    cacheData[nodeId].pointer = cacheData[nodeId].pointer + 24;
    break;
  }
}

function decodeData(nodeId: string) {
  switch (cacheData[nodeId].state) {
    case DecodeState.prepare:
      decodeHeader(nodeId);
      if (!decodeHeadData(nodeId)) {
        break;
      }
      if (!decodeBodyData(nodeId)) {
        break;
      }
      break;
    case DecodeState.decodeHead:
      if (!decodeHeadData(nodeId)) {
        break;
      }
      if (!decodeBodyData(nodeId)) {
        break;
      }
      break;
    case DecodeState.decodeBody:
      if (!decodeBodyData(nodeId)) {
        break;
      }
      break;
  }

  combineData(nodeId);
}

function checkBody(nodeId: string, data: Uint8Array) {
  if (cacheData[nodeId].bodySize == 0) {
    Logger.log(TAG, 'Body size is 0');
    return;
  }

  cacheData[nodeId].unprocessLength += data.length;
  cacheData[nodeId].unProcessDatas.push(data);

  progress[nodeId].pointer = cacheData[nodeId].unprocessLength;
  progress[nodeId].totalSize = cacheData[nodeId].bodySize;
  calculateProgress(nodeId);

  if (cacheData[nodeId].unprocessLength >= cacheData[nodeId].bodySize) {
    let body = new Uint8Array(cacheData[nodeId].bodySize);
    let processPoint: number = 0;

    body.set(cacheData[nodeId].data, 0);
    processPoint += cacheData[nodeId].data.length;

    let unProcessDataArray = cacheData[nodeId].unProcessDatas;
    for (let index = 0; index < unProcessDataArray.length; index++) {
      body.set(unProcessDataArray[index], processPoint);
      processPoint += unProcessDataArray[index].length;
    }

    let value = mSerializeDataService.decodeData(body);

    let key = cacheData[nodeId].key;
    if (cacheData[nodeId].method == 'get_binary') {
      mStorageService.set(key, value).then(() => {
        Logger.log(TAG, "Publish 'streamGetBinarySuccess' event, nodeId is ", nodeId);
        let getBinaryData: FeedsEvent.GetBinaryData = {
          nodeId: nodeId,
          key: key,
          value: value,
        };
      });
    }

    cacheData[nodeId].state = DecodeState.finish;
    cacheData[nodeId].pointer = 0;

    return;
  }
}

function sessionStart(
  nodeId: string,
  mSession: CarrierPlugin.Session,
  sdp: string,
  memo: FeedsData.SessionMemoData,
) {
  Logger.log(TAG, 'Start session , nodeId is ', nodeId);
  mCarrierService.sessionStart(
    mSession,
    sdp,
    () => {
      Logger.log(TAG, 'Start session success, nodeId is ', nodeId);
    },
    err => {
      Logger.error(TAG, 'Start session error , nodeId is ', nodeId, ' error is ', err);
      publishError(nodeId, createSessionStartError(), memo);
    },
  );
}
