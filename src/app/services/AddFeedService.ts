import { Injectable } from '@angular/core';
import { Events } from '@ionic/angular';

import { LogUtils } from 'src/app/services/LogUtils';
import { CarrierService } from 'src/app/services/CarrierService';
import { StorageService } from 'src/app/services/StorageService';

let TAG: string = "Feeds::AddFeedService";



@Injectable()
export class AddFeedService {
    //feeds://did:elastos:ixxxxxxx/carrieraddress/feedid#feedname
    //feeds://did:elastos:ixxxxxxx/carrieraddress/feedid
    private tobeAddedFeedMap: {[nodeId: string]: {[feedId: string]: FeedsData.ToBeAddedFeed}} = {};
    constructor(
        private carrierService: CarrierService,
        private storageService: StorageService,
        private events: Events,
        private logUtils: LogUtils) {
        this.loadData().then((map)=>{
            this.tobeAddedFeedMap = map||{};
            this.subscribeEvent();
        })
    }

    subscribeEvent(){
        this.events.subscribe("feeds:friendConnectionChanged",(friendId, friendStatus)=>{
            if (friendStatus == FeedsData.ConnState.connected){
                this.changeTobeAddedFeedStatusByNodeId(friendId, FeedsData.FollowFeedStatus.FRIEND_ONLINE);
                return ;
            }

            if (friendStatus == FeedsData.ConnState.disconnected){
                this.changeTobeAddedFeedStatusByNodeId(friendId, FeedsData.FollowFeedStatus.FRIEND_OFFLINE);
                return;
            }
        });

        this.events.subscribe("feeds:login_finish",(nodeId)=>{
            this.changeTobeAddedFeedStatusByNodeId(nodeId, FeedsData.FollowFeedStatus.SIGNIN_FINISH);
        });
        
        this.events.subscribe("feeds:addFeedFinish",async (nodeId, feedId, feedName)=>{
            await this.changeTobeAddedFeedStatusByNodeFeedId(nodeId, feedId, FeedsData.FollowFeedStatus.FOLLOW_FEED_FINISH);
            await this.changeTobeAddedFeedStatusByNodeFeedId(nodeId, feedId, FeedsData.FollowFeedStatus.FINISH);
            await this.removeTobeAddedFeedStatusByNodeFeedId(nodeId, feedId);
            this.events.publish("addFeed:finish",nodeId,feedId);
        });
    }

    addFeed(decodeResult:FeedsData.FeedUrl, nodeId: string, inputAvatar: string, inputFollower: number, inputFeedName: string): Promise<FeedsData.ToBeAddedFeed>{
        return new Promise(async (resolve, reject) =>{
            this.logUtils.logd("Start process addFeed",TAG);
            try{
                this.logUtils.logd("Decode result = "+JSON.stringify(decodeResult), TAG);
                let feedName = decodeResult.feedName;
                let avatar = "./assets/images/profile-1.svg";
                let follower = 0;

                if (inputFeedName != null && inputFeedName != undefined && inputFeedName != "")
                    feedName = inputFeedName;

                if (inputAvatar != null && inputAvatar != undefined && inputAvatar != "")
                    avatar = inputAvatar;

                if (inputFollower != null && inputFollower != undefined && inputFollower >0)
                    follower = inputFollower;

                if (decodeResult == null || decodeResult == undefined){
                    let error = "Feed Url decode error";
                    this.logUtils.loge(error, TAG);
                    reject(error);
                    return;
                }
                
                this.checkTobeAddedFeedMap(nodeId);

                this.tobeAddedFeedMap[nodeId][decodeResult.feedId] = 
                    this.generateToBeAddedFeed(nodeId, decodeResult.carrierAddress, decodeResult.feedId, 
                        feedName, decodeResult.did, decodeResult.serverUrl, decodeResult.feedUrl, 
                        FeedsData.FollowFeedStatus.NONE, FeedsData.FriendState.NONE_STATE, avatar, follower);

                this.changeTobeAddedFeedStatusByNodeId(nodeId, FeedsData.FollowFeedStatus.ADD_FRIEND_READY);

                this.tobeAddedFeedMap[nodeId][decodeResult.feedId].friendState = await this.addFriends(nodeId, decodeResult.carrierAddress);
                this.saveData();
                resolve(this.tobeAddedFeedMap[nodeId][decodeResult.feedId]);
            }catch(error){
                reject("Add feed error");
            }
        });
    }

    checkFeedUrl(feedUrl: string): boolean{
        if (feedUrl == null || feedUrl == undefined || feedUrl == ""){
            this.logUtils.loge("feedUrl is null", TAG);
            return false;
        }

        if (!feedUrl.startsWith("feeds://") || feedUrl.indexOf("/") < 4 || feedUrl.length < 54){
            this.logUtils.loge("feedUrl formate error", TAG);
            return false;
        }
    }

    checkToBeAddedList(){
        return this.tobeAddedFeedMap;
    }

    getToBeAddedFeedsInfoByNodeFeedId(nodeId: string, feedId: number): FeedsData.ToBeAddedFeed{
        this.checkTobeAddedFeedMap(nodeId);
        return this.tobeAddedFeedMap[nodeId][feedId];
    }

    getToBeAddedFeedsInfoByNodeId(nodeId: string): FeedsData.ToBeAddedFeed[]{
        this.checkTobeAddedFeedMap(nodeId);
        let map = this.tobeAddedFeedMap[nodeId];
        let result:FeedsData.ToBeAddedFeed[] = [] ;

        let keys: string[] = Object.keys(map) || [];
        for (let index = 0; index < keys.length; index++) {
            if (map[keys[index]] == undefined)
                continue;
            if (map[keys[index]].feedId == 0)
                continue;
            if (map[keys[index]].nodeId == nodeId)
                result.push(map[keys[index]]);
        }

        this.logUtils.logd("getToBeAddedFeedsInfoByNodeId() result is "+JSON.stringify(result), TAG);
        return result;
    }

    getToBeAddedFeedsList(): FeedsData.ToBeAddedFeed[]{
        let list:FeedsData.ToBeAddedFeed[] = [];
        let keys: string[] = Object.keys(this.tobeAddedFeedMap) || [];
        for (let index = 0; index < keys.length; index++) {
            let listToBeAddedFeedFromNode = this.getToBeAddedFeedsInfoByNodeId(keys[index]);
            for (let fromNodeIndex = 0; fromNodeIndex < listToBeAddedFeedFromNode.length; fromNodeIndex++) {
                list.push(listToBeAddedFeedFromNode[fromNodeIndex]);
            }
        }

        return list;
    }

    decodeFeedUrl(feedUrl: string):FeedsData.FeedUrl{
        if (this.checkFeedUrl(feedUrl)){
            let error = "Feed Url is error";
            this.logUtils.loge(error, TAG);
            return null;
        }

        let tmpString = feedUrl.replace("feeds://","");
        
        let tmp: string[] = tmpString.split("/")
        let result: FeedsData.FeedUrl = null;
        if (tmp.length < 3){
            result = {
                did             : tmp[0],
                carrierAddress  : tmp[1],
                feedId          : 0,
                feedName        : "Unknow",
                feedUrl         : feedUrl,
                serverUrl       : feedUrl
            }
        }

        if (tmp.length = 3){
            let mFeedName = "Unknow";
            let mFeedId = 0;
            if (tmp[2].indexOf("#") > 0){
                let feedField = tmp[2].split("#");
                try{
                    mFeedId = Number(feedField[0]);
                }catch(error){
                    this.logUtils.loge("Type convert error "+error, TAG);
                }
                
                mFeedName = feedField[1]||"Unknow";
            }else{
                mFeedId = Number(tmp[2]);
            }

            let serverUrl = feedUrl.substring(0, feedUrl.lastIndexOf("/"));
            result = {
                did             : tmp[0],
                carrierAddress  : tmp[1],
                feedId          : mFeedId,
                feedName        : mFeedName,
                feedUrl         : feedUrl,
                serverUrl       : serverUrl
            }
        }
        return result;
    }

    getNodeIdFromAddress(carrierAddress: string): Promise<string>{
        return new Promise((resolve, reject) =>{
            this.carrierService.getIdFromAddress(carrierAddress,
                (userId)=>{
                    this.logUtils.logd("nodeId is "+userId, TAG);
                    resolve(userId);
                },
                (error)=>{
                    let err = "Get nodeId error "+error;
                    reject(err);
                }
            );
        });
    }

    getNodeFeedId(nodeId: string, feedId: number){
        return nodeId + "-" + feedId;
    }

    generateToBeAddedFeed(nodeId: string, carrierAddress: string, feedId: number, feedName: string, 
        did: string, serverUrl: string, feedUrl: string, status : FeedsData.FollowFeedStatus, state: FeedsData.FriendState,
        avatar: string, follower: number): FeedsData.ToBeAddedFeed{
        return {
            nodeId          : nodeId,
            did             : did,
            carrierAddress  : carrierAddress,
            feedId          : feedId,
            feedName        : feedName,
            feedUrl         : feedUrl,
            serverUrl       : serverUrl,
            status          : status,
            friendState     : state,
            avatar          : avatar,
            follower        : follower
        }
    }

    checkTobeAddedFeedMap(nodeId: string){
        if (this.tobeAddedFeedMap == null || this.tobeAddedFeedMap == undefined)
            this.tobeAddedFeedMap = {};
        if (this.tobeAddedFeedMap[nodeId] == null || this.tobeAddedFeedMap[nodeId] == undefined)
            this.tobeAddedFeedMap[nodeId] = {};
    }

    async changeTobeAddedFeedStatusByNodeId(nodeId: string, status: FeedsData.FollowFeedStatus){
        this.checkTobeAddedFeedMap(nodeId);
        let keys: string[] = Object.keys(this.tobeAddedFeedMap[nodeId]) || [];
        for (let index = 0; index < keys.length; index++) {
            this.changeTobeAddedFeedStatusByNodeFeedId(nodeId, keys[index], status);
        }
    }

    async changeTobeAddedFeedStatusByNodeFeedId(nodeId: string, feedId: string, status: FeedsData.FollowFeedStatus){
        this.logUtils.logd("Change status, nodeId = "+nodeId+" FeedId = "+feedId+ " status = "+ status, TAG);
        this.checkTobeAddedFeedMap(nodeId);
        if (this.tobeAddedFeedMap[nodeId][feedId] == null || this.tobeAddedFeedMap[nodeId][feedId] == undefined){
            this.logUtils.loge("tobeAddedFeedMap null", TAG);
            return;
        }

        this.tobeAddedFeedMap[nodeId][feedId].status = status;

        await this.saveData();

        this.events.publish("addFeed:statusChanged", nodeId, feedId, status);
    }

    async removeTobeAddedFeedStatusByNodeFeedId(nodeId: string, feedId: number): Promise<void>{
        return new Promise(async (resolve, reject) =>{
            let feedIdStr = String(feedId);
            this.checkTobeAddedFeedMap(nodeId);
            if (this.tobeAddedFeedMap[nodeId][feedIdStr] == null || this.tobeAddedFeedMap[nodeId][feedIdStr] == undefined){
                this.logUtils.loge("tobeAddedFeedMap null", TAG);
                return;
            }
    
            delete this.tobeAddedFeedMap[nodeId][feedIdStr];
    
            await this.saveData();
            resolve();
        });
    }

    saveData(): Promise<any>{
        return this.storageService.set("tobeAddedFeedMap", this.tobeAddedFeedMap);
    }

    loadData(): Promise<{[nodeFeedId: string]: {[feedId: string]: FeedsData.ToBeAddedFeed}}>{
        return this.storageService.get("tobeAddedFeedMap");
    }

    checkIsFriends(nodeId: string): Promise<Boolean>{
        return new Promise((resolve, reject) =>{
            this.carrierService.isFriends(nodeId,(res)=>{
                resolve(res.isFriend);
            },(err)=>{
                let error = "check friend error "+err;
                this.logUtils.logd(error);
                reject(error);
            })
        });
    }

    addFriends(nodeId: string, carrierAddress: string): Promise<FeedsData.FriendState>{
        return new Promise(async (resolve, reject) =>{
            this.logUtils.logd("Start add Friend");
            try{
                let isFriend = await this.checkIsFriends(nodeId);
                if (isFriend){
                    this.changeTobeAddedFeedStatusByNodeId(nodeId, FeedsData.FollowFeedStatus.ADD_FRIEND_FINISH);
                    resolve(FeedsData.FriendState.IS_FRIEND);
                    return;
                }

                await this.addFriend(carrierAddress);
                this.changeTobeAddedFeedStatusByNodeId(nodeId, FeedsData.FollowFeedStatus.ADD_FRIEND_FINISH);
                resolve(FeedsData.FriendState.IS_ADDED);
                return;
            }catch(err){
                this.logUtils.loge("Add Friend error "+err);
                this.changeTobeAddedFeedStatusByNodeId(nodeId, FeedsData.FollowFeedStatus.ADD_FRIEND_ERROR);
                reject(err);
            }
        });
    }

    addFriend(carrierAddress: string): Promise<void>{
        return new Promise(async (resolve, reject) =>{
            this.logUtils.logd("Prepare add friend carrierAddress is "+carrierAddress);
            this.carrierService.addFriend(carrierAddress, "addFeed", ()=>{
                this.logUtils.logd("addFriend success");
                resolve();
            },(err)=>{
                let error = "addFeed addFriends error, error is "+ JSON.stringify(err);
                this.logUtils.logd(error);
                reject(error);
            });
        });
    }

    checkIsTobeAddedFeeds(nodeId: string, feedId: number): boolean{
        if (feedId == 0){
            return this.checkIsTobeAddedFeedsFromNodeId(nodeId);
        }
        return this.checkIsTobeAddedFeedsFromFeedId(nodeId, feedId);
    }

    private checkIsTobeAddedFeedsFromNodeId(nodeId: string): boolean{
        if (this.tobeAddedFeedMap == null || this.tobeAddedFeedMap == undefined ||
            this.tobeAddedFeedMap[nodeId] == null || this.tobeAddedFeedMap[nodeId] == undefined){
            return false;
        }
        return true;
    }

    private checkIsTobeAddedFeedsFromFeedId(nodeId: string, feedId: number): boolean{
        let feedIdStr = String(feedId) ;
        if (this.tobeAddedFeedMap == null || this.tobeAddedFeedMap == undefined ||
            this.tobeAddedFeedMap[nodeId] == null || this.tobeAddedFeedMap[nodeId] == undefined ||
            this.tobeAddedFeedMap[nodeId][feedIdStr] == null || this.tobeAddedFeedMap[nodeId][feedIdStr] == undefined){
            return false ;
        }
        return true;
    }
}