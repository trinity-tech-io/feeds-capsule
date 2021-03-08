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
                    this.channelsMap = await this.loadData(FeedsData.PersistenceKey.channelsMap) || {};
                    resolve(this.channelsMap);
                    return ;
                }
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
    getMyChannelList(nodeId: string){
        return this.getChannelsListFromNodeId(nodeId);
    }

    //// postMap
    setPostMap(postMap: {[ncpId: string]: FeedsData.Post}){
        this.postMap = postMap;
        this.saveData(FeedsData.PersistenceKey.postMap, this.postMap);
    }

    loadPostMap(): Promise<{[ncpId: string]: FeedsData.Post}>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (JSON.stringify(this.postMap) == "{}"){
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

    deletePost(key: string){
        this.postMap[key].post_status = FeedsData.PostCommentStatus.deleted;
        this.saveData(FeedsData.PersistenceKey.postMap, this.postMap);
    }

    updatePost(key: string, post: FeedsData.Post){
        this.postMap[key] = post;
        this.saveData(FeedsData.PersistenceKey.postMap, this.postMap);
    }

    getPost(key: string): FeedsData.Post{
        if (!this.postMap)
            return null;
        return this.postMap[key];
    }

    generatePost(nodeId: string, feedId: number, postId: number, content: any, 
                comments: number, likes: number, createdAt: number, updatedAt: number, 
                postStatus: FeedsData.PostCommentStatus){
        let post: FeedsData.Post = {
            nodeId: nodeId,
            channel_id: feedId,
            id: postId,
            content: content,
            comments: comments,
            likes: likes,
            created_at: createdAt,
            updated_at: updatedAt,
            post_status: postStatus
        }
        return post;
    }

    isExistPost(key: string): boolean{
        if (this.postMap[key] == null || this.postMap[key] == undefined)
            return false ;
        return true;
    }

    getPostList(): FeedsData.Post[]{
        let list: FeedsData.Post[] = [];
        this.postMap = this.postMap || {};
        let keys: string[] = Object.keys(this.postMap) || [];
        for (let index in keys) {
          if (this.postMap[keys[index]] == null || this.postMap[keys[index]] == undefined)
            continue;
    
          let nodeChannelId = this.getKey(this.postMap[keys[index]].nodeId, this.postMap[keys[index]].channel_id, 0, 0);
          let feed = this.getChannel(nodeChannelId);
          if (feed.isSubscribed)
            list.push(this.postMap[keys[index]]);
        }
    
        list.sort((a, b) => Number(b.created_at) - Number(a.created_at));
        return list;
    }

    getPostListFromChannel(nodeId: string, channelId: number){
        let list: FeedsData.Post[] = [];
        let keys: string[] = Object.keys(this.postMap);
        // localPostList = [];
        for (const index in keys) {
          if (this.postMap[keys[index]] == null || this.postMap[keys[index]] == undefined)
            continue;
    
          if (this.postMap[keys[index]].nodeId == nodeId && this.postMap[keys[index]].channel_id == channelId)
            list.push(this.postMap[keys[index]]);
        }
    
        list.sort((a, b) => Number(b.created_at) - Number(a.created_at));
        return list;
    }

    initPostMap(){
        this.channelsMap = {};
    }
    //// commentsMap
    setCommentsMap(commentsMap: {[nodeId: string]: FeedsData.NodeChannelPostComment}){
        this.commentsMap = commentsMap;
        this.saveData(FeedsData.PersistenceKey.commentsMap, this.commentsMap);
    }

    loadCommentsMap(): Promise<{[nodeId: string]: FeedsData.NodeChannelPostComment}>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (JSON.stringify(this.commentsMap) == "{}"){
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

    getComment(nodeId: string, feedId: number, postId: number, commentId: number): FeedsData.Comment{
        if (this.commentsMap == null || this.commentsMap == undefined ||
            this.commentsMap[nodeId] == null || this.commentsMap[nodeId] == undefined||
            this.commentsMap[nodeId][feedId] == null || this.commentsMap[nodeId][feedId] == undefined ||
            this.commentsMap[nodeId][feedId][postId] ==null || this.commentsMap[nodeId][feedId][postId] == undefined ||
            this.commentsMap[nodeId][feedId][postId][commentId] == null || this.commentsMap[nodeId][feedId][postId][commentId] == undefined){
                return null ;
            }
        return this.commentsMap[nodeId][feedId][postId][commentId];
    }

    updateComment(nodeId: string, feedId: number, postId: number, commentId: number, comment: FeedsData.Comment){
        if (this.commentsMap == null || this.commentsMap == undefined)
            this.commentsMap = {};
        if (this.commentsMap[nodeId] == null || this.commentsMap[nodeId] == undefined)
            this.commentsMap[nodeId] = {};
        if (this.commentsMap[nodeId][feedId] == null || this.commentsMap[nodeId][feedId] == undefined)
            this.commentsMap[nodeId][feedId] = {};
        if (this.commentsMap[nodeId][feedId][postId] == null || this.commentsMap[nodeId][feedId][postId] == undefined)
            this.commentsMap[nodeId][feedId][postId] = {};
        this.commentsMap[nodeId][feedId][postId][commentId] = comment;
        this.saveData(FeedsData.PersistenceKey.commentsMap, this.commentsMap);
    }

    deleteComment(nodeId: string, feedId: number, postId: number, commentId: number){
        this.commentsMap[nodeId][feedId][postId][commentId] = undefined;
        delete this.commentsMap[nodeId][feedId][postId][commentId];
        this.saveData(FeedsData.PersistenceKey.commentsMap, this.commentsMap);
    }

    deleteCommentFromPost(nodeId: string, feedId: number, postId: number){
        this.commentsMap[nodeId][feedId][postId] = undefined;
        delete this.commentsMap[nodeId][feedId][postId];
        this.saveData(FeedsData.PersistenceKey.commentsMap, this.commentsMap);
    }

    getCommentList(nodeId: string, channelId: number, postId: number): FeedsData.Comment[]{
        if (this.commentsMap == null || this.commentsMap == undefined ||
           this.commentsMap[nodeId] == null || this.commentsMap == undefined ||
           this.commentsMap[nodeId][channelId] == null || this.commentsMap[nodeId][channelId] == undefined ||
           this.commentsMap[nodeId][channelId][postId] == null || this.commentsMap[nodeId][channelId][postId] == undefined){
             return [];
        }
    
        let list: FeedsData.Comment[] =[];
        let keys: string[] = Object.keys(this.commentsMap[nodeId][channelId][postId]);
        for (const index in keys) {
          let comment: FeedsData.Comment = this.commentsMap[nodeId][channelId][postId][keys[index]];
          if (comment == undefined)
            continue;
    
          list.push(comment);
          // if (commentById == 0)
          //   list.push(comment); //post comment list
          // else if (comment.comment_id == commentById)
          //   list.push(comment); //comment comment list
        }
    
        list.sort((a, b) => Number(b.created_at) - Number(a.created_at));
        return list;
    }

    initCommentsMap(){
        this.commentsMap = {};
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

    loadLikeMap(): Promise<{[key:string]:FeedsData.Likes}>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (JSON.stringify(this.likeMap) == "{}"){
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

    generateLikes(nodeId: string, feedId: number, postId: number, commentId: number): FeedsData.Likes{
        return {
            nodeId    : nodeId,
            channelId : feedId,
            postId    : postId,
            commentId : commentId
        }
    }

    getLikes(key: string): FeedsData.Likes{
        if (this.likeMap == null || this.likeMap == undefined || 
            this.likeMap[key] == null || this.likeMap[key] == undefined)
                return null;
        return this.likeMap[key];
    }

    updateLikes(key: string, likes: FeedsData.Likes){
        if (this.likeMap == null || this.likeMap == undefined)
            this.likeMap = {};
        this.likeMap[key] = likes;
        this.saveData(FeedsData.PersistenceKey.likeMap, this.likeMap);
    }

    deleteLikes(key: string) {
        this.likeMap[key] = null;
        delete this.likeMap[key];
        this.saveData(FeedsData.PersistenceKey.likeMap, this.likeMap);
    }

    getLikedPostList(): FeedsData.Post[]{
        let list: FeedsData.Post[] = [];
    
        let keys: string[] = [];
        if (this.likeMap != null && this.likeMap != undefined)
            keys = Object.keys(this.likeMap);
    
        for (const index in keys) {
            let like = this.likeMap[keys[index]];
            if (like == null || like == undefined)
                continue;
            let key = this.getKey(like.nodeId, like.channelId, like.postId, 0);
            let post = this.getPost(key);
            if (post == undefined)
                continue;
            list.push(post);
        }
    
        list.sort((a, b) => Number(b.created_at) - Number(a.created_at));
        return list;
    }

    initLikeMap(){
        this.likeMap = {};
    }
    ////likeCommentMap
    setLikeCommentMap(likeCommentMap: {[nodechannelpostCommentId: string]: FeedsData.LikedComment}){
        this.likeCommentMap = likeCommentMap;
        this.saveData(FeedsData.PersistenceKey.likeCommentMap, this.likeCommentMap);
    }

    loadLikeCommentMap(): Promise<{[nodechannelpostCommentId: string]: FeedsData.LikedComment}>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (JSON.stringify(this.likeCommentMap) == "{}"){
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

    generatedLikedComment(nodeId: string, feedId: number, postId: number, commentId: number): FeedsData.LikedComment{
        return {
            nodeId     : nodeId,
            channel_id : feedId,
            post_id    : postId,
            id         : commentId,
        }
    }

    getLikedComment(key: string): FeedsData.LikedComment{
        if (this.likeCommentMap == null || this.likeCommentMap == undefined)
            return null;
        return this.likeCommentMap[key];
    }

    updateLikedComment(key: string, likedComment: FeedsData.LikedComment){
        if (this.likeCommentMap == null || this.likeCommentMap == undefined)
            this.likeCommentMap = {};
        this.likeCommentMap[key] = likedComment;
        this.saveData(FeedsData.PersistenceKey.likeCommentMap, this.likeCommentMap);
    }

    deleteLikedComment(key: string){
        if (this.likeCommentMap == null || this.likeCommentMap == undefined)
            this.likeCommentMap = {};
        this.likeCommentMap[key] = null;
        delete this.likeCommentMap[key];
        this.saveData(FeedsData.PersistenceKey.likeCommentMap, this.likeCommentMap);
    }

    getCommentFromLikedComment(){

    }

    initLikedCommentMap(){
        this.likeCommentMap = {};
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

    loadUnreadMap(): Promise<{[nodeChannelId: string]: number}>{
        return new Promise(async (resolve, reject) =>{
            try {
                if (JSON.stringify(this.unreadMap) == "{}"){
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

    getUnreadNumber(nodeChannelId: string): number{
        if (this.unreadMap == null || this.unreadMap == undefined)
            this.unreadMap = {};
        if (this.unreadMap[nodeChannelId] == null || this.unreadMap[nodeChannelId] == undefined)
            return 0;
        return this.unreadMap[nodeChannelId];
    }

    readMsg(nodeChannelId: string){
        if (this.unreadMap == null || this.unreadMap == undefined)
            this.unreadMap = {};
        this.unreadMap[nodeChannelId] = 0;
        this.saveData(FeedsData.PersistenceKey.unreadMap, this.unreadMap);
    }

    receivedUnread(nodeChannelId: string){
        if (this.unreadMap == null || this.unreadMap == undefined)
            this.unreadMap = {};
        this.unreadMap[nodeChannelId] = this.unreadMap[nodeChannelId]+1;
        this.saveData(FeedsData.PersistenceKey.unreadMap, this.unreadMap);
    }

    deleteUnread(nodeChannelId: string){
        this.unreadMap[nodeChannelId] = 0;
        delete this.unreadMap[nodeChannelId];
        this.saveData(FeedsData.PersistenceKey.unreadMap, this.unreadMap);
    }

    initUnreadMap(){
        this.unreadMap = {};
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

    loadBindingServer(): Promise<FeedsData.Server>{
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
    
    getBindingServer(): FeedsData.Server{
        return this.bindingServer;
    }

    updateBindingServer(server: FeedsData.Server){
        this.bindingServer = server
        this.saveData(FeedsData.PersistenceKey.bindingServer, this.bindingServer);
    }

    deleteBindingServer(){
        this.bindingServer = null;
        this.saveData(FeedsData.PersistenceKey.bindingServer, this.bindingServer);
    }

    isBindingServer(nodeId: string): boolean{
        if(this.bindingServer == null || this.bindingServer == undefined)
            return false;
        if (this.bindingServer.nodeId != nodeId)
            return false;
        return true;
    }

    initBindingServer(){
        this.bindingServer = null;
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
