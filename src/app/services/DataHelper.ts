import { Injectable } from '@angular/core';
import { LogUtils } from 'src/app/services/LogUtils';
import { StorageService } from 'src/app/services/StorageService';

import * as _ from 'lodash';
let TAG: string = "DataHelper";

@Injectable()
export class DataHelper {
    private channelsMap: {[nodeChannelId: string]: FeedsData.Channels} = {};
    private postMap: {[ncpId: string]: FeedsData.Post} = {};
    private commentsMap: {[nodeId: string]: FeedsData.NodeChannelPostComment} = {};
    private serverMap: {[nodeId: string]: FeedsData.Server} = {};
    private accessTokenMap: {[nodeId:string]:FeedsData.AccessToken} = {};
    private likeMap: {[key:string]:FeedsData.Likes} = {};
    private likeCommentMap: {[nodechannelpostCommentId: string]: FeedsData.LikedComment} = {};

    private lastSubscribedFeedsUpdateMap: {[nodeId:string]: FeedsData.FeedUpdateTime} = {};
    private lastCommentUpdateMap: {[key: string]: FeedsData.CommentUpdateTime} = {};
    private lastMultiLikesAndCommentsCountUpdateMap: {[key: string]: FeedsData.LikesAndCommentsCountUpdateTime} = {};
    private lastMultiLikesAndCommentsCountUpdateMapCache: {[key: string]: FeedsData.LikesAndCommentsCountUpdateTime} = {};
    private lastPostUpdateMap: {[nodeChannelId:string]: FeedsData.PostUpdateTime} = {};

    private unreadMap: {[nodeChannelId: string]: number} = {};
    private serverStatisticsMap: {[nodeId: string]: FeedsData.ServerStatistics} = {};
    
    private serversStatus: {[nodeId: string]: FeedsData.ServerStatus} = {};

    private bindingServer: FeedsData.Server = null;
    private bindingServerCache: FeedsData.Server = null;

    private notificationList: FeedsData.Notification[] = [];
    private cacheBindingAddress: string = "";
    private localCredential: string = "";
    private cachedPost:{[key:string]:FeedsData.Post} = {};

    
    private localSignInData = null; //TODO

    private developerMode = false;
    private hideDeletedPosts = false;
    private hideDeletedComments = false;
    private hideOfflineFeeds = false;
    private currentLang ="";
    
    private serverVersions: {[nodeId: string]: FeedsData.ServerVersion} = {};

    private curtab: string = "home";
    private nonce = "";
    private realm = "";
    private serviceNonce = "";
    private serviceRealm = "";
    private profileIamge = "assets/images/profile-1.svg";
    private clipProfileIamge = "";


    private carrierStatus = FeedsData.ConnState.disconnected;
    private networkStatus = FeedsData.ConnState.disconnected;
    private connectionStatus = FeedsData.ConnState.disconnected ;
    private lastConnectionStatus = FeedsData.ConnState.disconnected ;
    private isLogging: {[nodeId: string]: boolean} = {};
    private signinChallengeTimeout = null;
    private isSavingChannel = false;
    private isDeclearing = false;
    private declareOwnerTimeout = null;
    private declareOwnerInterval = null;
    private isDeclareFinish: boolean = false;
    
    private feedPublicStatus:any = {};
    private channelInfo: any = {};

    constructor(
        private logUtils: LogUtils,
        private storageService: StorageService) {
    }

    ////subscribedChannelsMap
    getSubscribedFeedsList(): FeedsData.Channels[]{
        let list: FeedsData.Channels[] = [];
        let map = this.getChannelsMap();
        let keys: string[] = Object.keys(map) || [];
    
        for (let index = 0; index < keys.length; index++) {
            const feed = this.getChannel(keys[index]);
            if (feed == null || feed == undefined)
                continue;
            if (feed.isSubscribed)
                list.push(feed);
        }
        return list;
    }

    ////channelsMap
    setChannelsMap(channelsMap: {[nodeChannelId: string]: FeedsData.Channels}){
        this.channelsMap = channelsMap;
        this.saveData(FeedsData.PersistenceKey.channelsMap, this.channelsMap);
    }

    loadChannelsMap(): Promise<{[nodeChannelId: string]: FeedsData.Channels}>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (JSON.stringify(this.channelsMap) == "{}"){
                    console.log("11111111111111111channelsMap {}")
                    this.channelsMap = await this.loadData(FeedsData.PersistenceKey.channelsMap) || {};

                    console.log("2222222222222222channelsMap = "+JSON.stringify(this.channelsMap));

                    resolve(this.channelsMap);
                    return ;
                }
                console.log("333333333333333channelsMap {}")

                resolve(this.channelsMap);
            } catch (error) {
                reject(error);
            }
        });
    }

    getChannelsMap(): {[nodeChannelId: string]: FeedsData.Channels}{
        return this.channelsMap||{};
    }

    getChannel(key: string): FeedsData.Channels{
        if (!this.channelsMap){
            return null;
        }
        
        return this.channelsMap[key]||null;
    }

    updateChannel(key: string, channel: FeedsData.Channels){
        this.channelsMap[key] = channel;
        this.saveData(FeedsData.PersistenceKey.channelsMap, this.channelsMap);
    }

    deleteChannel(key: string): Promise<any>{
        this.channelsMap[key] = null;
        delete this.channelsMap[key];
        return this.saveData(FeedsData.PersistenceKey.channelsMap, this.channelsMap);
    }

    isExistChannel(key: string): boolean{
        if (this.channelsMap[key] == null || this.channelsMap[key] == undefined)
            return false;

        return true;
    }

    initChannelsMap(){
        this.channelsMap = {};
    }

    getChannelsList():FeedsData.Channels[]{
        let list: FeedsData.Channels[] = [];
        let keys: string[] = Object.keys(this.channelsMap);
    
        for (let index in keys) {
          let item = this.getChannel[keys[index]] || "";
          if (item == "")
            continue;
          list.push(this.getChannel[keys[index]]);
        }
    
        let sortArr = [];
    
        sortArr = _.sortBy(list,(item:any)=> {
          return - Number(item.last_update);
        });
    
        return sortArr;
    }

    getChannelsListFromNodeId(nodeId: string): FeedsData.Channels[]{
        let list: FeedsData.Channels[] = [];
        let keys: string[] = Object.keys(this.channelsMap);
        for (const index in keys) {
            let feed = this.getChannel(keys[index])
            if (feed == null)
                continue;
            
            if (feed.nodeId == nodeId)
                list.push(feed);
        }
        return list;
    }

    //// myChannelsMap
    // setMyChannelMap(myChannelsMap: {[nodeChannelId: string]: FeedsData.MyChannel}){
    //     this.myChannelsMap = myChannelsMap;
    //     this.saveData(FeedsData.PersistenceKey.myChannelsMap, this.myChannelsMap);
    // }

    // loadMyChannelMap(): Promise<{[nodeChannelId: string]: FeedsData.MyChannel}>{
    //     return new Promise(async (resolve, reject) =>{
    //         try {
    //             if (this.myChannelsMap == {}){
    //                 this.myChannelsMap = await this.loadData(FeedsData.PersistenceKey.myChannelsMap) || {};
    //                 resolve(this.myChannelsMap);
    //                 return ;
    //             }
    //             resolve(this.myChannelsMap);
    //         } catch (error) {
    //             reject(error);
    //         }
    //     });
    // }

    // getMyChannelsMap(): {[nodeChannelId: string]: FeedsData.MyChannel}{
    //     return this.myChannelsMap||{};
    // }

    // getMyChannel(key: string): FeedsData.MyChannel{
    //     if (!this.myChannelsMap){
    //         return null;
    //     }

    //     return this.myChannelsMap[key];
    // }

    // updateMyChannel(key: string, myChannelsMap: FeedsData.MyChannel){
    //     this.myChannelsMap[key] = myChannelsMap;
    //     this.saveData(FeedsData.PersistenceKey.myChannelsMap, this.myChannelsMap);
    // }

    // deleteMyChannel(key: string): Promise<any>{
    //     this.myChannelsMap[key] = undefined;
    //     delete this.myChannelsMap[key];
    //     return this.saveData(FeedsData.PersistenceKey.myChannelsMap, this.myChannelsMap);
    // }

    // isExistMyChannel(key: string): boolean{
    //     if (this.myChannelsMap[key] == null || this.myChannelsMap[key] == undefined)
    //         return false;
    //     return true;
    // }

    // initMyChannelsMap(){
    //     this.myChannelsMap = {};
    // }

    getMyChannelList(nodeId: string){
        // let list: FeedsData.Channels[] = [];
        // let keys: string[] = Object.keys(this.myChannelsMap);
        // for (const index in keys) {
        //   if (this.myChannelsMap[keys[index]] == undefined)
        //     continue;
    
        //   if(this.isExistChannel(keys[index])){
        //     let channel = this.getChannel[keys[index]];
        //     list.push(channel);
        //   }
        // }
        // list.sort((a, b) => Number(b.last_update) - Number(a.last_update));
        // return list;
        return this.getChannelsListFromNodeId(nodeId);
    }

    //// postMap
    setPostMap(postMap: {[ncpId: string]: FeedsData.Post}){
        this.postMap = postMap;
        this.saveData(FeedsData.PersistenceKey.postMap, this.postMap);
    }

    getPostMap(): Promise<{[ncpId: string]: FeedsData.Post}>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (this.postMap == {}){
                    this.postMap = await this.loadData(FeedsData.PersistenceKey.postMap) || {};
                    resolve(this.postMap);
                    return ;
                }
                resolve(this.postMap);
            } catch (error) {
                reject(error);
            }
        });
    }

    //// commentsMap
    setCommentsMap(commentsMap: {[nodeId: string]: FeedsData.NodeChannelPostComment}){
        this.commentsMap = commentsMap;
        this.saveData(FeedsData.PersistenceKey.commentsMap, this.commentsMap);
    }

    getCommentsMap(): Promise<{[nodeId: string]: FeedsData.NodeChannelPostComment}>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (this.commentsMap == {}){
                    this.commentsMap = await this.loadData(FeedsData.PersistenceKey.commentsMap) || {};
                    resolve(this.commentsMap);
                    return ;
                }
                resolve(this.commentsMap);
            } catch (error) {
                reject(error);
            }
        });
    }

    ////serverMap
    setServerMap(serverMap: {[nodeId: string]: FeedsData.Server}){
        this.serverMap = serverMap;
        this.saveData(FeedsData.PersistenceKey.serverMap, this.serverMap);
    }

    getServerMap(): Promise<{[nodeId: string]: FeedsData.Server}>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (this.serverMap == {}){
                    this.serverMap = await this.loadData(FeedsData.PersistenceKey.serverMap) || {};
                    resolve(this.serverMap);
                    return ;
                }
                resolve(this.serverMap);
            } catch (error) {
                reject(error);
            }
        });
    }

    ////accessTokenMap
    setAccessTokenMap(accessTokenMap: {[nodeId:string]:FeedsData.AccessToken}){
        this.accessTokenMap = accessTokenMap;
        this.saveData(FeedsData.PersistenceKey.accessTokenMap, this.accessTokenMap);
    }

    getAccessTokenMap(): Promise<{[nodeId:string]:FeedsData.AccessToken}>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (this.accessTokenMap == {}){
                    this.accessTokenMap = await this.loadData(FeedsData.PersistenceKey.accessTokenMap) || {};
                    resolve(this.accessTokenMap);
                    return ;
                }
                resolve(this.accessTokenMap);
            } catch (error) {
                reject(error);
            }
        });
    }

    ////likeMap
    setLikeMap(likeMap: {[key:string]:FeedsData.Likes}){
        this.likeMap = likeMap;
        this.saveData(FeedsData.PersistenceKey.likeMap, this.likeMap);
    }

    getLikeMap(): Promise<{[key:string]:FeedsData.Likes}>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (this.likeMap == {}){
                    this.likeMap = await this.loadData(FeedsData.PersistenceKey.likeMap) || {};
                    resolve(this.likeMap);
                    return ;
                }
                resolve(this.likeMap);
            } catch (error) {
                reject(error);
            }
        });
    }

    ////likeCommentMap
    setLikeCommentMap(likeCommentMap: {[nodechannelpostCommentId: string]: FeedsData.LikedComment}){
        this.likeCommentMap = likeCommentMap;
        this.saveData(FeedsData.PersistenceKey.likeCommentMap, this.likeCommentMap);
    }

    getLikeCommentMap(): Promise<{[nodechannelpostCommentId: string]: FeedsData.LikedComment}>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (this.likeCommentMap == {}){
                    this.likeCommentMap = await this.loadData(FeedsData.PersistenceKey.likeCommentMap) || {};
                    resolve(this.likeCommentMap);
                    return ;
                }
                resolve(this.likeCommentMap);
            } catch (error) {
                reject(error);
            }
        });
    }

    ////lastSubscribedFeedsUpdateMap
    setLastSubscribedFeedsUpdateMap(lastSubscribedFeedsUpdateMap:{[nodeId:string]: FeedsData.FeedUpdateTime}){
        this.lastSubscribedFeedsUpdateMap = lastSubscribedFeedsUpdateMap;
        this.saveData(FeedsData.PersistenceKey.lastSubscribedFeedsUpdateMap, this.lastSubscribedFeedsUpdateMap);
    }

    getLastSubscribedFeedsUpdateMap(): Promise<{[nodeId:string]: FeedsData.FeedUpdateTime}>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (this.lastSubscribedFeedsUpdateMap == {}){
                    this.lastSubscribedFeedsUpdateMap = await this.loadData(FeedsData.PersistenceKey.lastSubscribedFeedsUpdateMap) || {};
                    resolve(this.lastSubscribedFeedsUpdateMap);
                    return ;
                }
                resolve(this.lastSubscribedFeedsUpdateMap);
            } catch (error) {
                reject(error);
            }
        });
    }

    ////lastCommentUpdateMap
    setLastCommentUpdateMap(lastCommentUpdateMap: {[key: string]: FeedsData.CommentUpdateTime}){
        this.lastCommentUpdateMap = lastCommentUpdateMap;
        this.saveData(FeedsData.PersistenceKey.lastCommentUpdateMap, this.lastCommentUpdateMap);
    }

    getLastCommentUpdateMap(): Promise<{[key: string]: FeedsData.CommentUpdateTime}>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (this.lastCommentUpdateMap == {}){
                    this.lastCommentUpdateMap = await this.loadData(FeedsData.PersistenceKey.lastCommentUpdateMap) || {};
                    resolve(this.lastCommentUpdateMap);
                    return ;
                }
                resolve(this.lastCommentUpdateMap);
            } catch (error) {
                reject(error);
            }
        });
    }

    ////lastMultiLikesAndCommentsCountUpdateMap
    setLastMultiLikesAndCommentsCountUpdateMap(lastMultiLikesAndCommentsCountUpdateMap: {[key: string]: FeedsData.LikesAndCommentsCountUpdateTime}){
        this.lastMultiLikesAndCommentsCountUpdateMap = lastMultiLikesAndCommentsCountUpdateMap;
        this.saveData(FeedsData.PersistenceKey.lastMultiLikesAndCommentsCountUpdateMap, this.lastMultiLikesAndCommentsCountUpdateMap);
    }

    getLastMultiLikesAndCommentsCountUpdateMap(): Promise<{[key: string]: FeedsData.LikesAndCommentsCountUpdateTime}>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (this.lastMultiLikesAndCommentsCountUpdateMap == {}){
                    this.lastMultiLikesAndCommentsCountUpdateMap = await this.loadData(FeedsData.PersistenceKey.lastMultiLikesAndCommentsCountUpdateMap) || {};
                    resolve(this.lastMultiLikesAndCommentsCountUpdateMap);
                    return ;
                }
                resolve(this.lastMultiLikesAndCommentsCountUpdateMap);
            } catch (error) {
                reject(error);
            }
        });
    }


    ////lastMultiLikesAndCommentsCountUpdateMapCache
    setLastMultiLikesAndCommentsCountUpdateMapCache(lastMultiLikesAndCommentsCountUpdateMapCache: {[key: string]: FeedsData.LikesAndCommentsCountUpdateTime}){
        this.lastMultiLikesAndCommentsCountUpdateMapCache = lastMultiLikesAndCommentsCountUpdateMapCache;
    }

    getLastMultiLikesAndCommentsCountUpdateMapCache(): {[key: string]: FeedsData.LikesAndCommentsCountUpdateTime}{
        return this.lastMultiLikesAndCommentsCountUpdateMapCache;
    }

    ////lastPostUpdateMap
    setLastPostUpdateMap(lastPostUpdateMap: {[nodeChannelId:string]: FeedsData.PostUpdateTime}){
        this.lastPostUpdateMap = lastPostUpdateMap;
        this.saveData(FeedsData.PersistenceKey.lastPostUpdateMap, this.lastPostUpdateMap);
    }

    getLastPostUpdateMap(): Promise<{[nodeChannelId:string]: FeedsData.PostUpdateTime}>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (this.lastPostUpdateMap == {}){
                    this.lastPostUpdateMap = await this.loadData(FeedsData.PersistenceKey.lastPostUpdateMap) || {};
                    resolve(this.lastPostUpdateMap);
                    return ;
                }
                resolve(this.lastPostUpdateMap);
            } catch (error) {
                reject(error);
            }
        });
    }

    ////unreadMap
    setUnreadMap(unreadMap: {[nodeChannelId: string]: number}){
        this.unreadMap = unreadMap;
        this.saveData(FeedsData.PersistenceKey.unreadMap, this.unreadMap);
    }

    getUnreadMap(): Promise<{[nodeChannelId: string]: number}>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (this.unreadMap == {}){
                    this.unreadMap = await this.loadData(FeedsData.PersistenceKey.unreadMap) || {};
                    resolve(this.unreadMap);
                    return ;
                }
                resolve(this.unreadMap);
            } catch (error) {
                reject(error);
            }
        });
    }

    ////serverStatisticsMap
    setServerStatisticsMap(serverStatisticsMap: {[nodeId: string]: FeedsData.ServerStatistics}){
        this.serverStatisticsMap = serverStatisticsMap;
        this.saveData(FeedsData.PersistenceKey.serverStatisticsMap, this.serverStatisticsMap);
    }

    getServerStatisticsMap():Promise<{[nodeId: string]: FeedsData.ServerStatistics}>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (this.serverStatisticsMap == {}){
                    this.serverStatisticsMap = await this.loadData(FeedsData.PersistenceKey.serverStatisticsMap) || {};
                    resolve(this.serverStatisticsMap);
                    return ;
                }
                resolve(this.serverStatisticsMap);
            } catch (error) {
                reject(error);
            }
        });
    }

    ////serversStatus
    setServersStatus(serversStatus: {[nodeId: string]: FeedsData.ServerStatus}){
        this.serversStatus = serversStatus;
        this.saveData(FeedsData.PersistenceKey.serversStatus, this.serversStatus);
    }

    getServersStatus(): Promise<{[nodeId: string]: FeedsData.ServerStatus}>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (this.serversStatus == {}){
                    this.serversStatus = await this.loadData(FeedsData.PersistenceKey.serversStatus) || {};
                    resolve(this.serversStatus);
                    return ;
                }
                resolve(this.serversStatus);
            } catch (error) {
                reject(error);
            }
        });
    }

    ////bindingServer
    setBindingServer(bindingServer: FeedsData.Server){
        this.bindingServer = bindingServer;
        this.saveData(FeedsData.PersistenceKey.bindingServer, this.bindingServer);
    }

    getBindingServer(): Promise<FeedsData.Server>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (this.bindingServer == null){
                    this.bindingServer = await this.loadData(FeedsData.PersistenceKey.bindingServer) || {};
                    resolve(this.bindingServer);
                    return ;
                }
                resolve(this.bindingServer);
            } catch (error) {
                reject(error);
            }
        });
    }

    ////bindingServerCache
    setBindingServerCache(bindingServerCache: FeedsData.Server){
        this.bindingServerCache = bindingServerCache;
    }

    getBindingServerCache(): FeedsData.Server{
        return this.bindingServerCache;
    }

    ////notificationList
    setnotificationList(notificationList: FeedsData.Notification[]){
        this.notificationList = notificationList;
        this.saveData(FeedsData.PersistenceKey.notificationList, this.notificationList);
    }

    getNotificationList(){
        return new Promise(async (resolve, reject) =>{
            try {
                if (this.notificationList == null){
                    this.notificationList = await this.loadData(FeedsData.PersistenceKey.notificationList) || {};
                    resolve(this.notificationList);
                    return ;
                }
                resolve(this.notificationList);
            } catch (error) {
                reject(error);
            }
        });
    }

    ////cacheBindingAddress
    setCacheBindingAddress(cacheBindingAddress: string){
        this.cacheBindingAddress = cacheBindingAddress
    }

    getCacheBindingAddress(): string{
        return this.cacheBindingAddress;
    }


    ////localCredential
    setLocalCredential(localCredential: string){
        this.localCredential = localCredential
        this.saveData(FeedsData.PersistenceKey.credential, this.localCredential);
    }

    getLocalCredential(): Promise<string>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (this.localCredential == ""){
                    this.localCredential = await this.loadData(FeedsData.PersistenceKey.credential) || {};
                    resolve(this.localCredential);
                    return ;
                }
                resolve(this.localCredential);
            } catch (error) {
                reject(error);
            }
        });
    }

    ////cachedPost
    setCachedPost(cachedPost: {[key:string]:FeedsData.Post}){
        this.cachedPost = cachedPost;
    }

    getCachedPost(): {[key:string]:FeedsData.Post}{
        return this.cachedPost;
    }


    ////feedPublicStatus
    setFeedPublicStatus(feedPublicStatus: any){
        this.feedPublicStatus = feedPublicStatus
    }

    getFeedPublicStatus():any{
        return this.feedPublicStatus;
    }


    ////carrierStatus
    setCarrierStatus(carrierStatus: FeedsData.ConnState){
        this.carrierStatus = carrierStatus;
    }

    getCarrierStatus(): FeedsData.ConnState{
        return this.carrierStatus;
    }

    ////networkStatus
    setNetworkStatus(networkStatus: FeedsData.ConnState){
        this.networkStatus = networkStatus;
    }

    getNetworkStatus(): FeedsData.ConnState{
        return this.networkStatus;
    }

    ////connectionStatus
    setConnectionStatus(connectionStatus: FeedsData.ConnState){
        this.connectionStatus = connectionStatus;
    }

    getConnectionStatus(): FeedsData.ConnState{
        return this.connectionStatus;
    }

    ////lastConnectionStatus
    setLastConnectionStatus(lastConnectionStatus: FeedsData.ConnState){
        this.lastConnectionStatus = lastConnectionStatus;
    }

    getlastConnectionStatus(): FeedsData.ConnState{
        return this.lastConnectionStatus;
    }

    ////isDeclareFinish
    setIsDeclareFinish(isDeclareFinish: boolean){
        this.isDeclareFinish = isDeclareFinish;
    }

    getisDeclareFinish():boolean{
        return this.isDeclareFinish;
    }

    ////serverVersions
    setServerVersions(serverVersions: {[nodeId: string]: FeedsData.ServerVersion}){
        this.serverVersions = serverVersions;
    }

    getServerVersion(): {[nodeId: string]: FeedsData.ServerVersion}{
        return this.serverVersions;
    }

    ////currentLang
    setCurrentLang(currentLang: string){
        this.currentLang = currentLang;
    }

    getCurrentLang(): string{
        return this.currentLang;
    }

    ////developerMode
    setDeveloperMode(developerMode: boolean){
        this.developerMode = developerMode;
    }

    getDeveloperMode(): boolean{
        return this.developerMode;
    }

    ////hideDeletedPosts
    setHideDeletedPosts(hideDeletedPosts:boolean){
        this.hideDeletedPosts = hideDeletedPosts;
    }

    getHideDeletedPosts(): boolean{
        return this.hideDeletedPosts;
    }

    ////hideDeletedComments
    setHideDeletedComments(hideDeletedComments: boolean){
        this.hideDeletedComments = hideDeletedComments;
    }

    getHideDeletedComments(): boolean{
        return this.hideDeletedComments;
    }

    ////hideOfflineFeeds
    setHideOfflineFeeds(hideOfflineFeeds: boolean){
        this.hideOfflineFeeds = hideOfflineFeeds;
    }

    getHideOfflineFeeds(){
        return this.hideOfflineFeeds;
    }

    ////channelInfo
    setChannelInfo(channelInfo: any){
        this.channelInfo = channelInfo;
    }

    getChannelInfo(): any{
        return this.channelInfo;
    }

    ////curtab
    setCurtab(curtab: string){
        this.curtab = curtab
    }

    getCurtab(){
        return this.curtab;
    }

    //// nonce
    setNonce(nonce: string){
        this.nonce = nonce;
    }

    getNonce():string{
        return this.nonce;
    }

    //// realm
    setRealm(realm: string){
        this.realm = realm;
    }

    getRealm():string{
        return this.realm;
    }

    ////serviceNonce
    setServiceNonce(serviceNonce: string){
        this.serviceNonce = serviceNonce;
    }

    getServiceNonce(): string{
        return this.serviceNonce;
    }

    ////serviceRealm
    setServiceRealm(serviceRealm: string){
        this.serviceRealm = serviceRealm
    }

    getServiceRealm(){
        return this.serviceRealm;
    }

    ////profileIamge
    setProfileIamge(profileIamge: string){
        this.profileIamge = profileIamge;
    }

    getProfileIamge(): string{
        return this.profileIamge;
    }

    ////clipProfileIamge
    setClipProfileIamge(clipProfileIamge: string){
        this.clipProfileIamge = clipProfileIamge;
    }

    getClipProfileIamge(){
        return this.clipProfileIamge;
    }

    ////isLogging
    setIsLogging(isLogging: {[nodeId: string]: boolean}){
        this.isLogging = isLogging;
    }

    getIsLogging(): {[nodeId: string]: boolean}{
        return this.isLogging;
    }

    getKey(nodeId: string, channelId: number, postId: number, commentId: number): string{
        return nodeId + "-" + channelId + "-"+ postId + "-" + commentId;
    }

    ////
    saveData(key: string, value: any): Promise<any>{
        return this.storageService.set(key, value);
    }

    loadData(key: string): Promise<any>{
        return this.storageService.get(key);
    }
}
