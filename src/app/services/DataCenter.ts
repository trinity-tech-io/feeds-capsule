// import { Injectable } from '@angular/core';
// import { LogUtils } from 'src/app/services/LogUtils';
// import { ConnectionService } from 'src/app/services/ConnectionService';
// import { StorageService } from 'src/app/services/StorageService';
// import { DataHelper } from 'src/app/services/DataHelper';

// let TAG: string = "DataCenter";

// @Injectable()
// export class DataCenter {
//     constructor(
//         private logUtils: LogUtils,
//         private dataHelper: DataHelper) {
//     }

//     loadData(){

//     }

//     loadSubscribedChannels(){
//         return new Promise((resolve, reject) =>{
//             let subscribedChannels = this.subscribedChannelsMap || "";
//             if( subscribedChannels == ""){
//                 this.storageService.get(FeedsData.PersistenceKey.subscribedChannelsMap).then((mSubscribedChannelsMap)=>{
//                     this.subscribedChannelsMap = mSubscribedChannelsMap || {};
//                     resolve(mSubscribedChannelsMap);
//                 }).catch((error)=>{
//                     reject(error);
//                 });
//             }else{
//                 resolve(subscribedChannels);
//             }
//         });
//     }

//     getSubscribedFeedsList(): Channels[]{
//         let list: Channels[] = [];
//         let map = this.subscribedChannelsMap|| {};
//         let keys: string[] = Object.keys(map) || [];

//         for (let index = 0; index < keys.length; index++) {
//             const subscribedFeed = this.subscribedChannelsMap[keys[index]] || null;
//             if (subscribedFeed == null)
//             continue;
//             let feed = this.getChannelFromId(subscribedFeed.nodeId, subscribedFeed.id);
//             if (feed == null || feed == undefined)
//             continue;
//             list.push(feed);
//         }
//         return list;
//       }

//     getChannelFromId(nodeId: string, id: number): Channels{
//         if (this.channelsMap == null || this.channelsMap == undefined)
//             return undefined;

//         let nodeChannelId = this.getChannelId(nodeId, id);
//         return channelsMap[nodeChannelId];
//     }

//     cleanCacheData(){
//         subscribedChannelsMap = {};
//         channelsMap = {};
//         myChannelsMap = {};
//         unreadMap = {};
//         serverStatisticsMap = {};
//         commentsMap = {};
//         serversStatus = {};
//         creationPermissionMap = {};
//         likeMap = {};
//         likeCommentMap = {};
//         lastPostUpdateMap = {};

//         localSubscribedList = [];
//         localMyChannelList = [];
//         localChannelsList = [];

//         bindingServer = null;
//         bindingServerCache = null;
//         serverMap = {};

//         accessTokenMap = {};
//         signInServerList = [];

//         notificationList = [];
//         cacheBindingAddress = "";
//         localCredential = "";
//         cachedPost = {};

//         this.feedPublicStatus = {};
//         // this.localSignInData = null;

//         // this.developerMode = false;
//         // this.hideDeletedPosts = false;
//         // this.hideDeletedComments = false;
//         // this.hideOfflineFeeds = false;
//         // this.currentLang ="";

//         this.channelInfo = {};
//         this.postMap = {};

//         this.curtab = "home";
//         this.nonce = "";
//         this.realm = "";
//         this.serviceNonce = "";
//         this.serviceRealm = "";
//         this.profileIamge = "assets/images/profile-1.svg";
//         this.clipProfileIamge = "";
//         this.selsectIndex = 1;

//         // this.carrierStatus = FeedsData.ConnState.disconnected;
//         // this.networkStatus = FeedsData.ConnState.disconnected;
//         // this.connectionStatus = FeedsData.ConnState.disconnected ;
//         // this.lastConnectionStatus = FeedsData.ConnState.disconnected ;
//         this.isLogging = {};
//         this.signinChallengeTimeout = null;
//         this.isSavingChannel = false;
//         this.isDeclearing = false;
//         this.declareOwnerTimeout = null;
//         this.declareOwnerInterval = null;
//         this.isDeclareFinish = false;

//         this.lastSubscribedFeedsUpdateMap = {};
//         this.lastCommentUpdateMap = {};
//         this.lastMultiLikesAndCommentsCountUpdateMap = {};
//         this.lastMultiLikesAndCommentsCountUpdateMapCache = {};

//         this.alertPopover = null;
//         this.serverVersions = {};
//       }
// }
