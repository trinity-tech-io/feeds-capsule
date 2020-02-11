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

declare let carrierManager: CarrierPlugin.CarrierManager;

let carrierInst: CarrierPlugin.Carrier;

const createOption = {
    udpEnabled: true,
    persistentLocation: '.data'
}

@Injectable()
export class CarrierService {

    private eventBus: Events;
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
        onFriendMessage: this.friendMessageCallback
    }

    constructor(public event: Events, public platform: Platform) {
        this.eventBus = event;
    }

    init() {
        if (this.platform.is('desktop')) {
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

    isReady() {
        return this.mIsReady;
    }

    createCarrierInstanceSuccess(ret: any) {
        console.log('Carrier Service created:', ret);
        carrierInst = ret;
        carrierInst.start(50, null, null);
    }

    createCarrierInstanceError(err: string) {
        console.log('Carrier Service error: ', err);
    }

    conectionCallback(ret) {
        console.log('Connection state changed:', ret);
        this.eventBus.publish('carrier:connectionChanged', ret, Date.now());
    }

    readyCallback(ret) {
        console.log('Carrier Instance is ready');
        this.eventBus.publish('carrier:ready', ret, Date.now());
    }

    friendConnectionCallback(ret) {
        this.eventBus.publish('carrier:friendConnection', ret, Date.now());
    }

    friendInfoCallback(ret) {
        this.eventBus.publish('carrier:friendInfo', ret, Date.now());
    }

    friendListCallback(ret) {
        this.eventBus.publish('carrier:friendList', ret, Date.now());
    }

    friendAddedCallback(ret) {
        this.eventBus.publish('carrier:friendAdded', ret, Date.now());
    }

    friendRemovedCallback(ret) {
        this.eventBus.publish('carrier:friendRemoved', ret, Date.now());
    }

    friendMessageCallback(ret)  {
        this.eventBus.publish('carrier:friendMessage', ret, Date.now());
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
            (err: string) => {this.errorFun(err, error); });
    }

    isValidAddress(address, success, error) {
        carrierManager.isValidAddress(
            address,
            (ret: any) => {success(ret);},
            (err: string) => {this.errorFun(err, error);});
    }

    getUserId() {
        if (this.platform.is('desktop')) {
            return 'deafultUserId';
        }
        return carrierInst.userId;
    }

    getAddress(): string {
        if (this.platform.is('desktop')) {
            return 'EXfdeeeeeeeeeeeeeeeeeee';
        }
        return carrierInst.address;
    }

    getFriends(success, error: string) {
        /*
        carrierInst.getFriends(
            (ret) => {success(ret);},
            (err) => {this.errorFun(err, error);});
        */
    }


    addFriend(address, hello: string, success, error: (err: string) => void) {
        if (this.platform.is('desktop')) {
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
        if (this.platform.is('desktop')) {
            return success('ok');
        }
        carrierInst.removeFriend(
            userId,
            () => {success();},
            (err) => {this.errorFun(err, error);});
    }

    sendMessage(feedMessage, success, error) {
        /* messageList.push(chatMessage);

        if (this.platform.is('desktop')) {
            success();
            return;
        }

        let id = feedMessage.messageId;
        carrierInst.sendFriendMessage(
            feedMessage.toUserId, feedMessage.message,
            () => {
                let index = this.getMsgIndexById(id);
                if (index !== -1) {
                    messageList[index].status = 'success';
                }
                success();},
            (err) => {this.errorFun(err, error);});
        */
    }

    errorFun(err, errorFun = null) {
        /*
        this.native.info('errorFun:' + err);
        if (errorFun != null) {
            return errorFun(err);
        }
        */
    }
}
