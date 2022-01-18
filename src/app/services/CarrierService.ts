/*
 * Copyright (c) 2019 Elastos Foundation
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { FileHelperService } from 'src/app/services/FileHelperService';
import { Events } from 'src/app/services/events.service';

declare let carrierManager: CarrierPlugin.CarrierManager;

let FriendInfo: CarrierPlugin.FriendInfo;
let UserInfo: CarrierPlugin.UserInfo;
let carrierInst: CarrierPlugin.Carrier;
let eventBus: Events = null;
// var connectStatus ;

// const bootstrapsOpts = [
//     { ipv4: "13.58.208.50", port: "33445", publicKey: "89vny8MrKdDKs7Uta9RdVmspPjnRMdwMmaiEW27pZ7gh" },
//     { ipv4: "18.216.102.47", port: "33445", publicKey: "G5z8MqiNDFTadFUPfMdYsYtkUDbX5mNCMVHMZtsCnFeb" },
//     { ipv4: "18.216.6.197", port: "33445", publicKey: "H8sqhRrQuJZ6iLtP2wanxt4LzdNrN2NNFnpPdq1uJ9n2" },
//     { ipv4: "52.83.171.135", port: "33445", publicKey: "5tuHgK1Q4CYf4K5PutsEPK5E3Z7cbtEBdx7LwmdzqXHL" },
//     { ipv4: "52.83.191.228", port: "33445", publicKey: "3khtxZo89SBScAMaHhTvD68pPHiKxgZT6hTCSZZVgNEm" }
// ];

@Injectable()
export class CarrierService {
  private mIsReady = false;
  private myInterval: any;

  private callbacks = {
    onConnection: this.conectionCallback,
    onReady: this.readyCallback,
    onFriends: this.friendListCallback,
    onFriendConnection: this.friendConnectionCallback,
    onFriendInfoChanged: this.friendInfoCallback,
    onFriendAdded: this.friendAddedCallback,
    onFriendRemoved: this.friendRemovedCallback,
    onFriendMessage: this.friendMessageCallback,
    onFriendBinaryMessage: this.friendBinaryMessageCallback,
    onSessionRequest: this.sessionRequestCallback,
  };

  constructor(
    public events: Events,
    public platform: Platform,
    private fileHelperService: FileHelperService,
  ) {
    eventBus = events;
  }

  init(did: string) {
    if (this.platform.platforms().indexOf('cordova') < 0) {
      this.myInterval = setInterval(() => {
        this.readyCallback(null);
        clearInterval(this.myInterval);
      }, 2000);
    } else {
      if (!this.mIsReady)
        this.createObject(
          did,
          this.createCarrierInstanceSuccess,
          this.createCarrierInstanceError,
        );
    }
  }

  isReady(): boolean {
    return this.mIsReady;
  }

  readyCallback(ret) {
    this.mIsReady = true;
    eventBus.publish(FeedsEvent.PublishType.carrierReady);
  }

  createCarrierInstanceSuccess(ret: any) {
    carrierInst = ret;
    carrierInst.start(50, null, null);
  }

  createCarrierInstanceError(err: string) {
    alert('createCarrierInstanceError' + err);
  }

  conectionCallback(event) {
    eventBus.publish(
      FeedsEvent.PublishType.carrierConnectionChanged,
      event.status,
    );
  }

  friendConnectionCallback(ret) {
    eventBus.publish(FeedsEvent.PublishType.carrierFriendConnection, ret);
  }

  friendInfoCallback(ret) {
    eventBus.publish(FeedsEvent.PublishType.carrierFriendInfo, ret);
  }

  friendListCallback(event) {
    eventBus.publish(
      FeedsEvent.PublishType.carrierFriendList,
      event.friends.length,
    );
  }

  friendAddedCallback(ret) {
    eventBus.publish(FeedsEvent.PublishType.carrierFriendAdded, ret);
  }

  friendRemovedCallback(ret) {
    eventBus.publish(FeedsEvent.PublishType.carrierFriendRemoved, ret);
  }

  friendMessageCallback(event) {
    eventBus.publish(FeedsEvent.PublishType.carrierFriendMessage, event);
  }

  friendBinaryMessageCallback(event) {
    eventBus.publish(FeedsEvent.PublishType.carrierFriendBinaryMessage, event);
  }

  sessionRequestCallback(event) {
    eventBus.publish(FeedsEvent.PublishType.carrierSessionRequest, event);
  }

  destroyCarrier() {
    if (carrierInst != null) {
      carrierInst.destroy();
      carrierInst = null;
    }
  }

  private processDid(did: string): string {
    let checkStr = 'did:elastos:';
    return '.' + did.replace(checkStr, '');
  }

  async createObject(did: string, success, error) {
    let newName = this.processDid(did);
    try {
      await this.fileHelperService.moveCarrierData('.data', newName);
    } catch (error) {}

    let createOption = this.generateCreateOption(newName);
    carrierManager.createObject(
      this.callbacks,
      createOption,
      (ret: any) => {
        success(ret);
      },
      (err: string) => {
        error(err);
      },
    );
  }

  isValidAddress(address, success, error) {
    carrierManager.isValidAddress(
      address,
      (isValid: boolean) => {
        success(isValid);
      },
      (err: string) => {
        // alert(err);
      },
    );
  }

  getUserId(): string {
    if (this.platform.platforms().indexOf('cordova') < 0) {
      return 'deafultUserId';
    }
    return carrierInst.userId;
  }

  getNodeId(): string {
    if (this.platform.platforms().indexOf('cordova') < 0) {
      return 'deafultNodeId';
    }
    return carrierInst.nodeId;
  }

  getAddress(): string {
    if (this.platform.platforms().indexOf('cordova') < 0) {
      return 'EXfdeeeeeeeeeeeeeeeeeee';
    }
    return carrierInst.address;
  }

  getSelfInfo(success: any, error: any) {
    if (this.platform.platforms().indexOf('cordova') < 0) {
      success(null);
      return;
    }

    carrierInst.getSelfInfo(
      // (userInfo) =>{
      //     userInfo.userId,
      //     userInfo.name,
      //     userInfo.description,
      //     userInfo.hasAvatar,
      //     userInfo.gender,
      //     userInfo.phone,
      //     userInfo.email,
      //     userInfo.region
      // },
      ret => {
        success(ret);
      },
      err => {
        this.errorFun(err, error);
      },
    );
  }

  setSelfInfo(key: string, value: string) {
    carrierInst.setSelfInfo(
      key,
      value,
      () => {},
      err => {
        this.errorFun(err, null);
      },
    );
  }

  getFriends(
    onSuccess: (friends: CarrierPlugin.FriendInfo[]) => void,
    onError?: (err: string) => void,
  ) {
    if (this.platform.platforms().indexOf('cordova') < 0) {
      onSuccess(null);
      return;
    }

    carrierInst.getFriends(onSuccess, onError);
  }

  isFriends(
    userId: string,
    onSuccess: (res: any) => void,
    onError?: (err: string) => void,
  ) {
    if (this.platform.platforms().indexOf('cordova') < 0) {
      onSuccess(null);
      return;
    }

    carrierInst.isFriend(userId, onSuccess, onError);
  }

  addFriend(address, hello: string, success, error: (err: string) => void) {
    if (this.platform.platforms().indexOf('cordova') < 0) {
      success();
      this.myInterval = setInterval(() => {
        this.friendAddedCallback(null);
        clearInterval(this.myInterval);
      }, 1000);
      return;
    }

    carrierInst.addFriend(
      address,
      hello,
      () => {
        success();
      },
      err => {
        this.errorFun(err, error);
      },
    );
  }

  removeFriend(
    userId: string,
    onSuccess: () => void,
    onError?: (err: string) => void,
  ) {
    if (this.platform.platforms().indexOf('cordova') < 0) {
      return onSuccess();
    }

    carrierInst.removeFriend(
      userId,
      () => {
        onSuccess();
      },
      err => {
        onError(err);
      },
    );
  }

  sendMessage(nodeId: string, message: string, success: any, error: any) {
    if (this.platform.platforms().indexOf('cordova') < 0) {
      success();
      return;
    }

    carrierInst.sendFriendMessage(
      nodeId,
      message,
      () => {
        success();
      },
      err => {
        this.errorFun(err, error);
      },
    );
  }

  sendBinaryMessage(
    nodeId: string,
    message: Uint8Array,
    onSuccess: () => void,
    onError?: (err: string) => void,
  ) {
    if (this.platform.platforms().indexOf('cordova') < 0) {
      onSuccess();
      return;
    }

    carrierInst.sendFriendBinaryMessage(
      nodeId,
      message,
      () => {
        onSuccess();
      },
      err => {
        onError(err);
      },
    );
  }

  sendFriendBinaryMessageWithReceipt(
    nodeId: string,
    message: Uint8Array,
    onSuccess: () => void,
    onError?: (err: string) => void,
  ) {
    if (this.platform.platforms().indexOf('cordova') < 0) {
      onSuccess();
      return;
    }

    carrierInst.sendFriendBinaryMessageWithReceipt(
      nodeId,
      message,
      (messageId: number, state: Number) => {},
      () => {
        onSuccess();
      },
      err => {
        onError(err);
      },
    );
  }

  errorFun(err, errorFun = null) {
    // alert('error=>' + err);
    // alert('errorFun' + JSON.stringify(errorFun));
  }

  getIdFromAddress(
    address: string,
    onSuccess: (userId: string) => void,
    onError?: (err: string) => void,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      carrierManager.getIdFromAddress(address, (userId: string) => {
        if (userId) {
          onSuccess(userId);
          resolve(userId);
        } else {
          reject();
        }
      }, onError);
    });
  }

  newSession(
    to: string,
    onSuccess: (session: CarrierPlugin.Session) => void,
    onError?: (err: string) => void,
  ) {
    carrierInst.newSession(to, onSuccess, onError);
  }

  sessionRequest(
    session: CarrierPlugin.Session,
    handler: CarrierPlugin.OnSessionRequestComplete,
    onSuccess: () => void,
    onError?: (err: string) => void,
  ) {
    session.request(handler, onSuccess, onError);
  }

  sessionStart(
    session: CarrierPlugin.Session,
    sdp: string,
    onSuccess: () => void,
    onError?: (err: string) => void,
  ) {
    session.start(sdp, onSuccess, onError);
  }

  sessionClose(
    session: CarrierPlugin.Session,
    onSuccess?: () => void,
    onError?: (err: string) => void,
  ) {
    session.close(onSuccess, onError);
  }

  sessionAddStream(
    session: CarrierPlugin.Session,
    type: CarrierPlugin.StreamType,
    options: number,
    callbacks: CarrierPlugin.StreamCallbacks,
    onSuccess: (stream: CarrierPlugin.Stream) => void,
    onError?: (err: string) => void,
  ) {
    session.addStream(type, options, callbacks, onSuccess, onError);
  }

  sessionRemoveStream(
    session: CarrierPlugin.Session,
    stream: CarrierPlugin.Stream,
    onSuccess: (stream: CarrierPlugin.Stream) => void,
    onError?: (err: string) => void,
  ) {
    session.removeStream(stream, onSuccess, onError);
  }

  sessionReplyRequest(
    session: CarrierPlugin.Session,
    status: number,
    reason: string,
    onSuccess: () => void,
    onError?: (err: string) => void,
  ) {
    session.replyRequest(status, reason, onSuccess, onError);
  }

  streamWrite(
    stream: CarrierPlugin.Stream,
    data: Uint8Array,
    onSuccess: (bytesSent: Number) => void,
    onError?: (err: string) => void,
  ) {
    stream.write(data, onSuccess, onError);
  }

  generateCreateOption(path: string) {
    return {
      udpEnabled: true,
      persistentLocation: path,
      binaryUsed: true,
      expressEnabled: false,
    };
  }
}
