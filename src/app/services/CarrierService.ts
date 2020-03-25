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
import { Events, Platform } from '@ionic/angular';
// import { StorageService } from '../services/StorageService';

// type UserInfo = {
//     userId: string;
//     name: string;
//     description: string;
//     hasAvatar: Boolean;
//     gender: string;
//     phone: string;
//     email: string;
//     region: string;
// }

// class SelfInfo{
//     nodeId: string;
//     userId: string;
//     address: string;
//     constructor(nodeId: string, userId: string, address: string){
//     }
// }





// let friendsMap = {};
// class FriendInfo{
//     userInfo: UserInfo;



//         /** The user info. */
//         userInfo: UserInfo;
//         /** The presence status. */
//         presence: PresenceStatus;
//         /** The connection status. */
//         connection: ConnectionStatus;
//         /** The friend's label name. */
//         label: string;
//     }
// }


/*
export class ChatMessage {
    messageId: string;
    userId: string;
    userAvatar: string;
    toUserId: string;
    time: number | string;
    message: string;
    status: string;
} */
// @Injectable()
// class FeedMessage{
//     nodeId: string;
//     method: string;
//     params: any;
//     constructor(nodeId: string,
//         method: string,
//         params: any){

//     }
// }

declare let carrierManager: CarrierPlugin.CarrierManager;

let FriendInfo: CarrierPlugin.FriendInfo;
let UserInfo: CarrierPlugin.UserInfo;


let carrierInst: CarrierPlugin.Carrier;

let eventBus = null;

// var connectStatus ;

// const bootstrapsOpts = [
//     { ipv4: "13.58.208.50", port: "33445", publicKey: "89vny8MrKdDKs7Uta9RdVmspPjnRMdwMmaiEW27pZ7gh" },
//     { ipv4: "18.216.102.47", port: "33445", publicKey: "G5z8MqiNDFTadFUPfMdYsYtkUDbX5mNCMVHMZtsCnFeb" },
//     { ipv4: "18.216.6.197", port: "33445", publicKey: "H8sqhRrQuJZ6iLtP2wanxt4LzdNrN2NNFnpPdq1uJ9n2" },
//     { ipv4: "52.83.171.135", port: "33445", publicKey: "5tuHgK1Q4CYf4K5PutsEPK5E3Z7cbtEBdx7LwmdzqXHL" },
//     { ipv4: "52.83.191.228", port: "33445", publicKey: "3khtxZo89SBScAMaHhTvD68pPHiKxgZT6hTCSZZVgNEm" }
// ];

const createOption = {
    udpEnabled: true,
    persistentLocation: ".data"
    // bootstraps: bootstrapsOpts
};

@Injectable()
export class CarrierService {
    private mIsReady = false;
    // private mIsReady = true; //for test
    private myInterval: any;
    

    private callbacks = {
        onConnection: this.conectionCallback,
        onReady: this.readyCallback,
        onFriends: this.friendListCallback,
        onFriendConnection: this.friendConnectionCallback,
        onFriendInfoChanged: this.friendInfoCallback,
        onFriendAdded: this.friendAddedCallback,
        onFriendRemoved: this.friendRemovedCallback,
        onFriendMessage: this.friendMessageCallback
    }

    constructor(public events: Events, public platform: Platform) {
        eventBus = events;
    }

    init() {
        if (this.platform.platforms().indexOf("cordova") < 0){
            this.myInterval = setInterval(() => {
                this.readyCallback(null);
                clearInterval(this.myInterval);
            }, 2000);
        } else {
            this.createObject(
                this.createCarrierInstanceSuccess, 
                this.createCarrierInstanceError);
        }
    }

    isReady():boolean{
        return this.mIsReady;
    }

    readyCallback(ret) {
        this.mIsReady = true;
        eventBus.publish('carrier:ready', ret, Date.now());
    }

    createCarrierInstanceSuccess(ret: any) {
        carrierInst = ret;
        carrierInst.start(50, null, null);
    }

    createCarrierInstanceError(err: string) {
        alert("createCarrierInstanceError"+err);
        console.log('Carrier Service error: ', err);
    }

    conectionCallback(event) {
        eventBus.publish('carrier:connectionChanged', event.status, Date.now());
    }

    friendConnectionCallback(ret) {
        console.log(ret.friendId);
        console.log(ret.status);
        eventBus.publish('carrier:friendConnection', ret, Date.now());
    }

    friendInfoCallback(ret) {
        eventBus.publish('carrier:friendInfo', ret, Date.now());
    }

    friendListCallback(event) {
        eventBus.publish('carrier:friendList', event.friends.length, Date.now());
    }

    friendAddedCallback(ret) {
        eventBus.publish('carrier:friendAdded', ret, Date.now());
    }

    friendRemovedCallback(ret) {
        eventBus.publish('carrier:friendRemoved', ret, Date.now());
    }

    friendMessageCallback(event)  {
        eventBus.publish('carrier:friendMessage', event, Date.now());
    }

    destroyCarrier() {
        if (carrierInst != null) {
            carrierInst.destroy();
            carrierInst = null;
        }
    }

    /* getMessageByUserId(userId) {
        return messageList.filter(x => (x.toUserId == userId) || (x.userId == userId));
    }

    getMsgIndexById(id: string) {
        return messageList.findIndex(e => e.messageId === id)
    } */

    // ------------------------------------------------------------

    createObject(success, error) {
        carrierManager.createObject(
            this.callbacks, createOption,
            (ret: any) => {success(ret); },
            (err: string) => {error(err); });
    }

    isValidAddress(address, success, error) {
        carrierManager.isValidAddress(
            address,
            (ret: any) => {success(ret);},
            (err: string) => {this.errorFun(err, error);});
    }

    getUserId(): string {
        if (this.platform.platforms().indexOf("cordova") < 0){
            return 'deafultUserId';
        }
        return carrierInst.userId;
    }

    getNodeId(): string {
        if (this.platform.platforms().indexOf("cordova") < 0){
            return 'deafultNodeId';
        }
        return carrierInst.nodeId;
    }

    getAddress(): string {
        if (this.platform.platforms().indexOf("cordova") < 0){
            return 'EXfdeeeeeeeeeeeeeeeeeee';
        }
        return carrierInst.address;
    }



    getFriends(success: any, error: string) {
        if (this.platform.platforms().indexOf("cordova") < 0){
            success(null);
            return ;
        }
       
       carrierInst.getFriends(
        (ret) => {
            success(ret);
        },
        (err) => {this.errorFun(err, error)});
    }

    addFriend(address, hello: string, success, error: (err: string) => void) {
        if (this.platform.platforms().indexOf("cordova") < 0){
            success();
            this.myInterval = setInterval(() => {
                this.friendAddedCallback(null);
                clearInterval(this.myInterval);
            }, 1000);
            return;
        }
        
        carrierInst.addFriend(
            address, hello,
            () => {success(); },
            (err) => {this.errorFun(err, error); });
    }

    removeFriend(userId, success, error) {
        if (this.platform.platforms().indexOf("cordova") < 0){
            return success('ok');
        }
        
        carrierInst.removeFriend(
            userId,
            () => {success();},
            (err) => {this.errorFun(err, error);});
    }

    sendMessage(nodeId: string, message: string, success: any, error: any) {
        if (this.platform.platforms().indexOf("cordova") < 0){
            success();
            return;
        }
        carrierInst.sendFriendMessage(
            nodeId, message,
            () => {success();},
            (err) => {this.errorFun(err, error);});
    }

    errorFun(err, errorFun = null) {

        alert("error"+err);
        alert("errorFun"+JSON.stringify(errorFun));
        console.log("err =>"+err);
        console.log("errorFun =>"+errorFun);
        /*
        this.native.info('errorFun:' + err);
        if (errorFun != null) {
            return errorFun(err);
        }
        */
    }
}
