import { Injectable } from "@angular/core";
import { Platform } from '@ionic/angular';
import { CarrierService } from 'src/app/services/CarrierService';
import { Events } from '@ionic/angular';
import { JsonRPCService } from 'src/app/services/JsonRPCService';
import { StorageService } from 'src/app/services/StorageService';
import { TranslateService } from '@ngx-translate/core';
import { NativeService } from 'src/app/services/NativeService';
import { SerializeDataService } from 'src/app/services/SerializeDataService';
import { JWTMessageService } from 'src/app/services/JWTMessageService';
import { ConnectionService } from 'src/app/services/ConnectionService';
import { HttpService } from 'src/app/services/HttpService';
import { ApiUrl } from 'src/app/services/ApiUrl';
import { FormatInfoService } from 'src/app/services/FormatInfoService';
import { SessionService } from 'src/app/services/SessionService';
import { PopupProvider } from 'src/app/services/popup';
import { LogUtils } from 'src/app/services/LogUtils';
import { StandardAuthService } from 'src/app/services/StandardAuthService';

import * as _ from 'lodash';

declare let didManager: DIDPlugin.DIDManager;
declare let appManager: AppManagerPlugin.AppManager;
declare let didSessionManager: DIDSessionManagerPlugin.DIDSessionManager;

let TAG: string = "Feeds-service";
let versionCode: number = 10400;
let newAuthVersion: number = 10400;
let newCommentVersion: number = 10400;
let subscribedChannelsMap:{[nodeChannelId: string]: Channels};
let channelsMap:{[nodeChannelId: string]: Channels} ;
let myChannelsMap:{[nodeChannelId: string]: MyChannel};
let unreadMap:{[nodeChannelId: string]: number};
let serverStatisticsMap:{[nodeId: string]: ServerStatistics};
let commentsMap:{[nodeId: string]: NodeChannelPostComment};
let serversStatus:{[nodeId: string]: ServerStatus};
let creationPermissionMap:{[nodeId: string]: boolean};
let likeMap:{[key:string]:Likes};
let likeCommentMap:{[nodechannelpostCommentId: string]: LikedComment};
let lastPostUpdateMap:{[nodeChannelId:string]: PostUpdateTime};

let localSubscribedList:Channels[] = new Array<Channels>();
let localMyChannelList:Channels[] = new Array<Channels>();
let localChannelsList:Channels[] = new Array<Channels>();

let bindingServer: Server;
let bindingServerCache: Server;

let serverMap: {[nodeId: string]: Server};

let accessTokenMap:{[nodeId:string]:FeedsData.AccessToken};
let signInServerList = [];

let notificationList:Notification[] = [];

let cacheBindingAddress: string = "";
let localCredential: string = undefined;

let cachedPost:{[key:string]:Post} = {};

type ServerVersion = {
  nodeId        : string,
  versionName   : string,
  versionCode   : number
}

type Likes = {
  nodeId    : string,
  channelId : number,
  postId    : number,
  commentId : number
}

const enum ConnState {
  connected = 0,
  disconnected = 1
}

type BindURLData = {
  did: string;
  carrierAddress: string;
  nonce: string;
}

type Notification = {
  id: string;
  userName: string;
  behavior: Behavior;
  behaviorText: string;
  details: Details;
  time: number;
  readStatus: number;
}

type Details = {
  nodeId: string;
  channelId: number;
  postId: number;
  commentId: number;
}

type SignResult = {
  signingdid: string,
  publickey: string,
  signature: string
}

type SignIntentResponse = {
  result: SignResult
}

type PostUpdateTime = {
  nodeId: string,
  channelId: number,
  time:number
}

type FeedUpdateTime = {
  nodeId: string,
  time:number
}

type CommentUpdateTime = {
  nodeId: string,
  channelId: number,
  postId: number,
  time: number
}

type ServerStatus = {
  nodeId: string,
  did: string,
  status: ConnState
}
type NodeChannelPostComment ={
  [channelId: number]: ChannelPostComment;
}
type ChannelPostComment = {
  [postId:number]: PostComment
}
type PostComment = {
  [commentId: number]: Comment
}

type MyChannel = {
  nodeId: string,
  channelId: number
}

type Channels = {
    nodeId:string,
    id: number,
    name: string,
    introduction: string,
    owner_name: string,
    owner_did: string,
    subscribers : number,
    last_update : number,
    last_post: any,
    avatar: any,
    isSubscribed: boolean
}

type Comment = {
    nodeId      : string,
    channel_id  : number,
    post_id     : number,
    id          : number,
    comment_id  : number | 0,
    user_name   : string,
    content     : any,
    likes       : number,
    created_at  : number,
    updated_at  : number,
    status      : FeedsData.PostCommentStatus,
    user_did    : string
}

type LikedComment = {
  nodeId     : string,
  channel_id : number,
  post_id    : number,
  id         : number,
}

type ChannelPost = {
  [postId: number]: Post
}

type Post = {
    nodeId      : string,
    channel_id  : number,
    id          : number,
    content     : any,
    comments    : number,
    likes       : number,
    created_at  : number,
    updated_at  : number,
    post_status : FeedsData.PostCommentStatus
}

type PostKey = {
  created_at: number;
}

type ServerStatistics = {
  did               : string
  connecting_clients: number
  total_clients     : number
}

type Server = {
  name              : string
  owner             : string
  introduction      : string
  did               : string
  carrierAddress    : string
  nodeId            : string
  feedsUrl          : string
  elaAddress        : string
}

export class DidData{
  constructor(
    public did: string,
    public carrierAddress: string,
    public serviceId: string,
  ){}
}

export class SignInData {
  constructor(
    public did: string,
    public name: string,
    public avatar: Avatar,
    public email: string,
    public telephone: string,
    public location: string,
    public nickname:string,
    public description: string,
    public expiresTS: number
  ) {}
}

export class Avatar {
  contentType: string;
  data: string;
  type?: string;
}

enum RequestAction{
  defaultAction,
  refreshPostDetail
}
enum Behavior {
  comment,
  likedPost,
  likedComment,
  follow
}

enum PublishType{
  ownFeedListChanged = "feeds:ownFeedListChanged  ",
  createTopicSuccess = "feeds:createTopicSuccess",
  postEventSuccess = "feeds:postEventSuccess",
  allFeedsListChanged= "feeds:allFeedsListChanged",
  subscribeFinish = "feeds:subscribeFinish",
  unsubscribeFinish = "feeds:unsubscribeFinish",
  updateServerList = "feeds:updateServerList",
  connectionChanged="feeds:connectionChanged",

  postDataUpdate = "feeds:postDataUpdate",
  commentDataUpdate = "feeds:commentDataUpdate",
  getCommentFinish = "feeds:getCommentFinish",

  myChannelsDataUpdate = "feeds:myChannelsDataUpdate",
  subscribedDataUpdate = "feeds:subscribedChannelsDataUpdate",
  channelsDataUpdate = "feeds:channelsDataUpdate",

  refreshMyChannel = "feeds:refreshMyChannel",
  loadMoreMyChannel = "feeds:loadMoreMyChannel",
  serverConnectionChanged = "feeds:serverConnectionChanged",

  serverStatisticsChanged = "feeds:serverStatisticsChanged",

  refreshPost = "feeds:refreshPost",
  loadMorePost = "feeds:loadMorePost",

  refreshChannels = "feeds:refreshChannels",
  loadMoreChannels = "feeds:loadMoreChannels",

  refreshSubscribedChannels = "feeds:refreshSubscribedChannels",
  loadMoreSubscribedChannels = "feeds:loadMoreSubscribedChannels",

  updataCommentLike = "feeds:updataCommentLike",

  updateLikeList = "feeds:updateLikeList",

  signInServerListChanged = "feeds:signInServerListChanged",

  friendConnectionChanged = "feeds:friendConnectionChanged",
  publishPostSuccess = "feeds:publishPostSuccess",

  bindServerFinish = "feeds:bindServerFinish",
  removeFeedSourceFinish = "feeds:removeFeedSourceFinish",

  refreshPage = "feeds:refreshPage",
  UpdateNotification = "feeds:UpdateNotification",
  publishPostFinish = "feeds:publishPostFinish",

  refreshPostDetail = "feeds:refreshPostDetail",

  editFeedInfoFinish = "feeds:editFeedInfoFinish",

  editPostFinish = "feeds:editPostFinish",
  editPostSuccess = "feeds:editPostSuccess",
  editCommentFinish = "feeds:editCommentFinish",
  deletePostFinish = "feeds:deletePostFinish",
  deleteCommentFinish = "feeds:deleteCommentFinish",

  declarePostSuccess = "feeds:declarePostSuccess",
  notifyPostSuccess = "feeds:notifyPostSuccess"
}

enum PersistenceKey{
  ///////////////////////////////
  signInData = "signInData",
  lastSignInData = "lastSignInData",

  signInRawData = "signInRawData",

  subscribedChannelsMap = "subscribedChannelsMap",
  channelsMap = "channelsMap",
  myChannelsMap = "myChannelsMap",
  unreadMap = "unreadMap",
  postMap = "postMap",
  lastPostUpdateMap = "lastPostUpdateMap",
  commentsMap = "commentsMap",
  serverStatisticsMap = "serverStatisticsMap",
  serversStatus = "serversStatus",
  subscribeStatusMap = "subscribeStatusMap",
  likeMap = "likeMap",

  // bindingServerMap = "bindingServerMap",
  accessTokenMap = "accessTokenMap",
  credential = "credential",

  bindingServer = "bindingServer",

  serverMap = "serverMap",

  notificationList = "notificationList",

  likeCommentMap = "likeCommentMap",
  lastFeedUpdateMap = "lastFeedUpdateMap",
  lastCommentUpdateMap = "lastCommentUpdateMap",

  serverVersions = "serverVersions",
}

let expDay = 10;

let eventBus = null;

let currentFeedEventKey: string = "";

let postEventTmp: FeedEvents;


export class AllFeed{
  constructor(
    public nodeId: string,
    public avatar: string,
    public topic: string,
    public desc: string,
    public subscribeState: string){
  }
}

export class MyFeed {
  constructor(
    public avatar: string,
    public nodeId: string,
    public name: string,
    public desc: string,
    public lastUpdated: string,
    public imageUrl: string,
    public lastEvent: string,
    public archive: boolean) {}
}

export class FeedEvents{
  constructor(
    public nodeId: string,
    public topic: string,
    public timestamp: string,
    public message: string,
    public seqno: number,
    public imageUrl: string){
  }
}

export class FeedIntro{
  constructor(public description: string){
  }
}

@Injectable()
export class FeedService {
  public developerMode:boolean = false;
  public hideDeletedPosts:boolean = false;
  public hideDeletedComments:boolean = false;
  public hideOfflineFeeds:boolean = true;
  public localSignInData: SignInData = undefined;
  public currentLang:string ="";
  public curtab:string ="home";
  public channelInfo:any ={};
  public postMap: {[ncpId: string]: Post};
  public testMode = true;
  private nonce = "";
  private realm = "";
  private serviceNonce = "";
  private serviceRealm = "";
  private profileIamge = "assets/images/profile-1.svg";
  private selsectIndex = 1;
  private carrierStatus:FeedsData.ConnState = FeedsData.ConnState.disconnected;
  private networkStatus:FeedsData.ConnState = FeedsData.ConnState.disconnected;
  private connectionStatus = FeedsData.ConnState.disconnected ;
  private lastConnectionStatus = FeedsData.ConnState.disconnected ;
  private isLogging: {[nodeId: string]: boolean} = {};
  private signinChallengeTimeout: NodeJS.Timer;
  private autoSigninInterval;
  private isSavingChannel:boolean = false;
  private isDeclearing = false;
  private declareOwnerTimeout: NodeJS.Timer;
  private declareOwnerInterval: NodeJS.Timer;
  private isDeclareFinish: boolean = false;
  private lastFeedUpdateMap:{[nodeId:string]: FeedUpdateTime};
  private lastCommentUpdateMap:{[key: string]: CommentUpdateTime};

  private throwMsgTransDataLimit = 4*1000*1000;
  private alertPopover:HTMLIonPopoverElement = null;
  private serverVersions: {[nodeId: string]: ServerVersion} = {};

  public constructor(
    private serializeDataService: SerializeDataService,
    private jwtMessageService: JWTMessageService,
    private platform: Platform,
    private events: Events,
    private jsonRPCService: JsonRPCService,
    private carrierService: CarrierService,
    private native: NativeService,
    private translate: TranslateService,
    private storeService: StorageService,
    private connectionService: ConnectionService,
    private httpService: HttpService,
    private formatInfoService: FormatInfoService,
    private sessionService:SessionService,
    private popupProvider:PopupProvider,
    private logUtils: LogUtils,
    private standardAuth: StandardAuthService
  ) {
    eventBus = events;
    this.init();
  }

  init(){
    this.initData();


    this.initCallback();
  }

  getNetworkStatus(): FeedsData.ConnState{
    return this.networkStatus;
  }

  getCarrierStatus(): FeedsData.ConnState{
    return this.carrierStatus;
  }

  public setSelsectIndex(index:any){
     this.selsectIndex = index;
  }

  public getSelsectIndex(){
    return this.selsectIndex;
 }

  public setProfileIamge(url:string){
    this.profileIamge = url;
  }

  public getProfileIamge(){
      return this.profileIamge;
  }

  loadServerVersions(){
    return new Promise((resolve, reject) =>{
      this.storeService.get(PersistenceKey.serverVersions).then((mServervVersions)=>{
        this.serverVersions = mServervVersions || {};
        resolve(mServervVersions);
      }).catch(()=>{
        reject();
      });
    });
  }

  loadPostData(){
    return new Promise((resolve, reject) =>{
      let postMap = this.postMap || "";
      if( postMap == ""){
        this.storeService.get(PersistenceKey.postMap).then((mPostMap)=>{
          this.postMap = mPostMap || {};
          resolve(mPostMap);
        }).catch(()=>{
          reject();
        });
      }else{
          resolve(postMap);
      }
    });
  }

  loadChannelData(){
    return new Promise((resolve, reject) =>{
      let channels = channelsMap || "";
      if( channels == ""){
        this.storeService.get(PersistenceKey.channelsMap).then((mChannelMap)=>{
          channelsMap = mChannelMap || {};
          resolve(mChannelMap);
        }).catch(()=>{
          reject();
      });
      }else{
          resolve(channels);
      }
    });
  }

  loadCredential(){
    return new Promise((resolve, reject) =>{
      let credential = localCredential || "";
      if( credential == ""){
        this.storeService.get(PersistenceKey.credential).then((mCredential)=>{
          localCredential = mCredential || "";
          resolve(mCredential);
        }).catch(()=>{
          reject();
        });
      }else{
          resolve(localCredential);
      }
    });
  }

  loadLastPostUpdate(){
    return new Promise((resolve, reject) =>{
      let lastPostUpdate = lastPostUpdateMap || "";
      if( lastPostUpdate == ""){
        this.storeService.get(PersistenceKey.lastPostUpdateMap).then((mLastPostUpdateMap)=>{
          lastPostUpdateMap = mLastPostUpdateMap || {};
          resolve(mLastPostUpdateMap);
        }).catch(()=>{
          reject();
        });
      }else{
          resolve(lastPostUpdate);
      }
    });
  }

  loadMyChannels(){
    return new Promise((resolve, reject) =>{
      let myChannels = myChannelsMap || "";
      if( myChannels == ""){
        this.storeService.get(PersistenceKey.myChannelsMap).then((mMyChannelsMap)=>{
          myChannelsMap = mMyChannelsMap || {};
          resolve(mMyChannelsMap);
        }).catch(()=>{
          reject();
        });
      }else{
          resolve(myChannels);
      }
    });
  }

  loadServersStatus(){
    return new Promise((resolve, reject) =>{
      let sStatus = serversStatus || "";
      if( sStatus == ""){
        this.storeService.get(PersistenceKey.serversStatus).then((mServersStatus)=>{
          serversStatus = mServersStatus || {};

          let keys: string[] = Object.keys(serversStatus);
          for (const index in keys) {
            if (serversStatus[keys[index]] == undefined)
              continue;
              serversStatus[keys[index]].status = ConnState.disconnected;
          }

          resolve(mServersStatus);
        }).catch(()=>{
          reject();
        });
      }else{
          resolve(sStatus);
      }
    });
  }

  loadServerStatistics(){
    return new Promise((resolve, reject) =>{
      let serverStatistics = serverStatisticsMap || "";
      if( serverStatistics == ""){
        this.storeService.get(PersistenceKey.serverStatisticsMap).then((mServerStatisticsMap)=>{
          serverStatisticsMap = mServerStatisticsMap || {};
          resolve(mServerStatisticsMap);
        }).catch(()=>{
          reject();
        });
      }else{
          resolve(serverStatistics);
      }
    });
  }

  loadServers(){
    return new Promise((resolve, reject) =>{
      let servers = serverMap || "";
      if( servers == ""){
        this.storeService.get(PersistenceKey.serverMap).then((mServerMap)=>{
          serverMap = mServerMap || {};
          resolve(mServerMap);
        }).catch(()=>{
          reject();
        });
      }else{
          resolve(servers);
      }
    });
  }

  loadSubscribedChannels(){
    return new Promise((resolve, reject) =>{
      let subscribedChannels = subscribedChannelsMap || "";
      if( subscribedChannels == ""){
        this.storeService.get(PersistenceKey.subscribedChannelsMap).then((mSubscribedChannelsMap)=>{
          subscribedChannelsMap = mSubscribedChannelsMap || {};
          resolve(mSubscribedChannelsMap);
        }).catch(()=>{
          reject();
        });
      }else{
          resolve(subscribedChannels);
      }
    });
  }

  loadComments(){
    return new Promise((resolve, reject) =>{
      let comments = commentsMap || "";
      if( comments == ""){
        this.storeService.get(PersistenceKey.commentsMap).then((mCommentsMap)=>{
          commentsMap = mCommentsMap || {};
          resolve(mCommentsMap);
        }).catch(()=>{
          reject();
        });
      }else{
          resolve(comments);
      }
    });
  }

  loadUnreadMap(){
    return new Promise((resolve, reject) =>{
      let unread = unreadMap || "";
      if( unread == ""){
        this.storeService.get(PersistenceKey.unreadMap).then((mUnreadMap)=>{
          unreadMap = mUnreadMap || {};
          resolve(mUnreadMap);
        }).catch(()=>{
          reject();
        });
      }else{
          resolve(unread);
      }
    });
  }

  loadLikeMap(){
    return new Promise((resolve, reject) =>{
      let likes = likeMap || "";
      if( likes == ""){
        this.storeService.get(PersistenceKey.likeMap).then((mLikeMap)=>{
          likeMap = mLikeMap || {};
          resolve(mLikeMap);
        }).catch(()=>{
          reject();
        });
      }else{
          resolve(likes);
      }
    });
  }

  loadAccessTokenMap(){
    return new Promise((resolve, reject) =>{
      let accessTokens = accessTokenMap || "";
      if( accessTokens == ""){
        this.storeService.get(PersistenceKey.accessTokenMap).then((mAccessTokenMap)=>{
          accessTokenMap = mAccessTokenMap || {};
          resolve(mAccessTokenMap);
        }).catch(()=>{
          reject();
        });
      }else{
          resolve(accessTokens);
      }
    });
  }

  loadBindingServer(){
    return new Promise((resolve, reject) =>{
      let bindServer = bindingServer || "";
      if( bindServer == ""){
        this.storeService.get(PersistenceKey.bindingServer).then((mBindingServer)=>{
          bindingServer = mBindingServer || undefined;
          resolve(mBindingServer);
        }).catch(()=>{
          reject();
        });
      }else{
          resolve(bindServer);
      }
    });
  }

  loadNotificationList(){
    return new Promise((resolve, reject) =>{
      let notifications = notificationList || "";
      if( notifications == ""){
        this.storeService.get(PersistenceKey.notificationList).then((mNotificationList)=>{
          notificationList = mNotificationList || [];
          resolve(mNotificationList);
        }).catch(()=>{
          reject();
        });
      }else{
          resolve(notifications);
      }
    });
  }

  loadLikeCommentMap(){
    return new Promise((resolve, reject) =>{
      let likeComments = likeCommentMap || "";
      if( likeComments == ""){
        this.storeService.get(PersistenceKey.likeCommentMap).then((mLikeCommentMap)=>{
          likeCommentMap = mLikeCommentMap || {};
          resolve(mLikeCommentMap);
        }).catch(()=>{
          reject();
        });
      }else{
          resolve(likeComments);
      }
    });
  }

  loadLastFeedUpdateMap(){
    return new Promise((resolve, reject) =>{
      let lastFeedUpdate = this.lastFeedUpdateMap || "";
      if( lastFeedUpdate == ""){
        this.storeService.get(PersistenceKey.lastFeedUpdateMap).then((mLastFeedUpdateMap)=>{
          this.lastFeedUpdateMap = mLastFeedUpdateMap || {};
          resolve(mLastFeedUpdateMap);
        }).catch(()=>{
          reject();
        });
      }else{
          resolve(lastFeedUpdate);
      }
    });
  }

  loadLastCommentUpdateMap(){
    return new Promise((resolve, reject) =>{
      let lastCommentUpdate = this.lastCommentUpdateMap || "";
      if( lastCommentUpdate == ""){
        this.storeService.get(PersistenceKey.lastCommentUpdateMap).then((mLastCommentUpdateMap)=>{
          this.lastCommentUpdateMap = mLastCommentUpdateMap || {};
          resolve(mLastCommentUpdateMap);
        }).catch(()=>{
          reject();
        });
      }else{
          resolve(lastCommentUpdate);
      }
    });
  }

  async loadData(){
    await Promise.all([
      this.loadServerVersions(),
      this.loadPostData(),
      this.loadChannelData(),
      this.loadCredential(),
      this.loadLastPostUpdate(),
      this.loadMyChannels(),
      this.loadServersStatus(),
      this.loadServerStatistics(),
      this.loadServers(),
      this.loadSubscribedChannels(),
      this.loadComments(),
      this.loadUnreadMap(),
      this.loadLikeMap(),
      this.loadAccessTokenMap(),
      this.loadBindingServer(),
      this.loadNotificationList(),
      this.loadLikeCommentMap(),
      this.loadLastFeedUpdateMap(),
      this.loadLastCommentUpdateMap()
    ]);
  }

  initData(){
    if(localCredential == null || localCredential == undefined){

      this.storeService.get(PersistenceKey.credential).then((credential)=>{
        localCredential = credential;
      });
    }

    // this.loadPostData();

    this.storeService.get(PersistenceKey.lastPostUpdateMap).then((mLastPostUpdateMap)=>{
      lastPostUpdateMap = mLastPostUpdateMap;
      if(lastPostUpdateMap == null || lastPostUpdateMap == undefined)
        lastPostUpdateMap = {}
    });

    this.storeService.get(PersistenceKey.myChannelsMap).then((mMyChannelsMap)=>{
      myChannelsMap = mMyChannelsMap;
      if (myChannelsMap == null || myChannelsMap ==undefined ){
        myChannelsMap ={};
      }
    });

    this.storeService.get(PersistenceKey.serversStatus).then((mServersStatus)=>{
      serversStatus = mServersStatus;
      if (serversStatus == null || serversStatus == undefined){
        serversStatus = {};
      }

      let keys: string[] = Object.keys(serversStatus);
      for (const index in keys) {
        if (serversStatus[keys[index]] == undefined)
          continue;
          serversStatus[keys[index]].status = ConnState.disconnected;
      }
    });

    this.storeService.get(PersistenceKey.serverStatisticsMap).then((mServerStatisticsMap)=>{
      serverStatisticsMap = mServerStatisticsMap ;
      if (serverStatisticsMap == null || serverStatisticsMap == undefined){
        serverStatisticsMap = {};
      }
    });


    this.storeService.get(PersistenceKey.serverMap).then((mServerMap)=>{
      serverMap = mServerMap;
      if(serverMap == null || serverMap == undefined)
        serverMap = {};
    });

    this.storeService.get(PersistenceKey.subscribedChannelsMap).then((mSubscribedChannelsMap)=>{
      subscribedChannelsMap = mSubscribedChannelsMap;
      if (subscribedChannelsMap == null || subscribedChannelsMap == undefined)
        subscribedChannelsMap = {};
    });

    this.storeService.get(PersistenceKey.commentsMap).then((mCommentsMap)=>{
      commentsMap = mCommentsMap;
      if(commentsMap == null || commentsMap == undefined)
        commentsMap = {};
    });

    this.storeService.get(PersistenceKey.unreadMap).then((mUnreadMap)=>{
      unreadMap = mUnreadMap;
      if(unreadMap == null || unreadMap == undefined)
        unreadMap = {};
    });

    this.storeService.get(PersistenceKey.likeMap).then((mLikeMap)=>{
      likeMap = mLikeMap;
      if (likeMap == null || likeMap == undefined)
        likeMap = {};
    });

    this.storeService.get(PersistenceKey.accessTokenMap).then((mAccessTokenMap)=>{
      accessTokenMap = mAccessTokenMap|| {};
    });

    this.storeService.get(PersistenceKey.bindingServer).then((mBindingServer)=>{
      bindingServer = mBindingServer ;
    });

    this.storeService.get(PersistenceKey.notificationList).then((mNotificationList)=>{
      notificationList = mNotificationList;
      if (notificationList == null || notificationList == undefined)
        notificationList = [];
    });

    this.storeService.get(PersistenceKey.likeCommentMap).then((mLikeCommentMap)=>{
      likeCommentMap = mLikeCommentMap;
      if (likeCommentMap == null || likeCommentMap == undefined)
        likeCommentMap = {};
    });

    this.storeService.get(PersistenceKey.lastFeedUpdateMap).then((mLastFeedUpdateMap)=>{
      this.lastFeedUpdateMap = mLastFeedUpdateMap || {};
    });

    this.storeService.get(PersistenceKey.lastCommentUpdateMap).then((mLastCommentUpdateMap) => {
      this.lastCommentUpdateMap = mLastCommentUpdateMap || {};
    });
  }

  initCallback(){
    this.networkstatusChangedCallback();
    this.carrierReadyCallback();
    this.friendAddCallback();
    this.friendConnectionCallback();
    this.friendMessageCallback();
    this.connectionChangedCallback();
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }

  getServerList(): Server[]{
    if (serverMap == null || serverMap == undefined)
      serverMap = {};
    let list: Server[] = [];
    let nodeIdArray: string[] = Object.keys(serverMap)||[];
    for (const index in nodeIdArray) {
      if (serverMap[nodeIdArray[index]] == undefined)
        continue;

      list.push(serverMap[nodeIdArray[index]]);
    }
    return list;
  }

  getOtherServerList(): Server[]{
    let list: Server[] = [];
    let nodeIdArray: string[] = Object.keys(serverMap);
    for (const index in nodeIdArray) {
      if (serverMap[nodeIdArray[index]] == undefined)
        continue;

      if (bindingServer != null &&
        bindingServer != undefined &&
        serverMap[nodeIdArray[index]].nodeId == bindingServer.nodeId)
        continue;

      list.push(serverMap[nodeIdArray[index]]);
    }
    return list;
  }

  getCreationServerList(): Server[]{
    let list: Server[] = [];
    if(bindingServer != null && bindingServer != undefined)
      list.push(bindingServer);
    return list;
  }

  getBindingserver():Server {
    return bindingServer;
  }

  getServersStatus():  {[nodeId: string]: ServerStatus} {
    return serversStatus;
  }

  getServerStatusFromId(nodeId: string): number{

    if (this.getConnectionStatus() == FeedsData.ConnState.disconnected ||
      serversStatus[nodeId] == null ||
      serversStatus[nodeId] == undefined){
        return 1;
    }

    return serversStatus[nodeId].status;
  }

  getServerStatisticsMap():{[nodeId: string]: ServerStatistics}{
    if (bindingServer != null &&
      bindingServer!= undefined &&
      serverStatisticsMap[bindingServer.nodeId] == undefined)
      serverStatisticsMap[bindingServer.nodeId] = {
        did               : "string",
        connecting_clients: 0,
        total_clients     : 0
      }

    let list = this.getServerList();
    for (let index = 0; index < list.length; index++) {
      if (serverStatisticsMap[list[index].nodeId] == null ||
        serverStatisticsMap[list[index].nodeId] == undefined)
        serverStatisticsMap[list[index].nodeId] ={
          did               : "string",
          connecting_clients: 0,
          total_clients     : 0
        }
    }

    return serverStatisticsMap;
  }

  getServerStatisticsNumber(nodeId: string): number{
    if (serverStatisticsMap[nodeId] == null || serverStatisticsMap[nodeId] == undefined)
      return 0;

    return serverStatisticsMap[nodeId].total_clients||0;
  }

  getMyChannelList(){
    let list: Channels[] = [];
    myChannelsMap = myChannelsMap || {};
    let keys: string[] = Object.keys(myChannelsMap);
    for (const index in keys) {
      if (myChannelsMap[keys[index]] == undefined)
        continue;

      if (channelsMap != null && channelsMap != undefined &&
          channelsMap[keys[index]] != undefined){
            let channel = channelsMap[keys[index]];
            list.push(channel);
          }
    }
    list.sort((a, b) => Number(b.last_update) - Number(a.last_update));

    return list;
  }

  getUnreadNumber(nodeChannelId: string){
    if (unreadMap == null || unreadMap == undefined)
      unreadMap = {};
    if (unreadMap[nodeChannelId]==null || unreadMap[nodeChannelId] == undefined)
      return 0;
    return unreadMap[nodeChannelId];
  }

  readChannel(nodeChannelId: string){
    if (unreadMap == null || unreadMap == undefined)
      unreadMap = {};
    unreadMap[nodeChannelId] = 0;
    this.storeService.set(PersistenceKey.unreadMap,unreadMap);
  }

  getChannelsList():Channels[]{

    let list: Channels[] = [];
    let map = channelsMap || {};
    let keys: string[] = Object.keys(map);

    for (let index in keys) {
      let item = channelsMap[keys[index]] || "";
      if (item == "")
        continue;
      list.push(channelsMap[keys[index]]);
    }

    let sortArr = [];

    sortArr = _.sortBy(list,(item:any)=> {
      return - Number(item.last_update);
    });

    return sortArr;
  }

  getFollowedChannelList():Channels[]{
    let list: Channels[] = [];
    let map = channelsMap || {};
    let keys: string[] = Object.keys(map);

    for (let index in keys) {
      let item = channelsMap[keys[index]] || "";
      if (item == "")
        continue;
      if (channelsMap[keys[index]].isSubscribed)
        list.push(channelsMap[keys[index]]);
    }

    let sortArr = [];

    sortArr = _.sortBy(list,(item:any)=> {
      return - Number(item.last_update);
    });

    return sortArr;
  }

  getChannelsListFromNodeId(nodeId: string): Channels[]{
    let list: Channels[] = [];
    let keys: string[] = Object.keys(channelsMap);
    for (const index in keys) {
      if (channelsMap[keys[index]] == undefined)
        continue;

      if (channelsMap[keys[index]].nodeId == nodeId)
        list.push(channelsMap[keys[index]]);
    }
    return list;
  }

  getAllChannelDetails(nodeId: string){
    let list = this.getChannelsList();
    for (let index = 0; index < list.length; index++) {
      let channel = list[index];
      if (nodeId == channel.nodeId)
        this.getChannelDetail(channel.nodeId, channel.id);
    }
  }

  sendJWTMessage(nodeId: string, properties: any){
    this.jwtMessageService.request(nodeId,properties,()=>{},()=>{});
  }

  createTopic(nodeId: string, channel: string, desc: string, avatar: any){
      this.createChannel(nodeId, channel, desc, avatar);
  }

  carrierReadyCallback(){
    this.events.subscribe('carrier:ready', () => {
      this.restoreRelation();
    });
  }

  restoreRelation(){
    this.storeService.get("SelfAddress").then((address)=>{


      let realAddress = address;
      let newAddress = this.carrierService.getAddress();

      if(realAddress!=newAddress){
        this.storeService.set("SelfAddress",newAddress);
        let serverList = this.getServerList();
        for (let index = 0; index < serverList.length; index++) {
          let carrierAddress = serverList[index].carrierAddress || "";
          this.carrierService.addFriend(carrierAddress,"hi",()=>{},(err)=>{});
        }
      }
    });
  }

  friendConnectionCallback(){
    this.events.subscribe('carrier:friendConnection', ret => {
      let friendId = ret.friendId;
      let friendStatus = ret.status;
      eventBus.publish(PublishType.friendConnectionChanged, friendId, friendStatus);

      if (this.connectionService.friendConnectionMap == null || this.connectionService.friendConnectionMap == undefined)
        this.connectionService.friendConnectionMap = {};

      this.connectionService.friendConnectionMap[friendId] = friendStatus;
      if(serversStatus == null ||serversStatus == undefined)
        serversStatus = {}

      serversStatus[friendId] = {
        nodeId: friendId,
        did: "string",
        status: friendStatus
      }

      // let serverVersionCode = this.getServerVersionCodeByNodeId(friendId);
      // if (serverVersionCode < versionCode)
      this.getServerVersion(friendId);

      let mServerMap = serverMap || {};
      let server = mServerMap[friendId]||"";
      if (server != "" )
        this.doFriendConnection(friendId, friendStatus);
    });
  }

  doFriendConnection(friendId: string, friendStatus:any){
    if (friendStatus == FeedsData.ConnState.connected){
      let accessToken = accessTokenMap[friendId]||undefined;
      if (this.checkExp(accessToken)){
        this.signinChallengeRequest(friendId,true);
      }else{
        this.prepare(friendId);
      }
    this.storeService.set(PersistenceKey.serversStatus,serversStatus);
    eventBus.publish(PublishType.serverConnectionChanged,serversStatus);
    }
  }

  friendAddCallback(){
    this.events.subscribe('carrier:friendAdded', msg => {
      let status: ConnState = msg.friendInfo.status;
      let nodeId = msg.friendInfo.userInfo.userId;
      if (bindingServer !=null && bindingServer == undefined)
        if (bindingServer.nodeId == nodeId)
          return ;

      let server = this.getServerbyNodeId(nodeId);
      if (server != null && server != undefined)
        this.resolveServer(server,status);
    });
  }

  resolveServer(server: Server, status: ConnState){
    if (serversStatus == null || serversStatus == undefined)
        serversStatus = {};

    if (serversStatus[server.nodeId] == undefined){
      serversStatus[server.nodeId] = {
        nodeId: server.nodeId,
        did: server.did,
        status: ConnState.disconnected
      }
    }

    if (status != null)
      return serversStatus[server.nodeId].status = status;

    if (serverStatisticsMap == null || serverStatisticsMap == undefined)
      serverStatisticsMap = {};

    if (serverStatisticsMap[server.nodeId] == undefined){
      serverStatisticsMap[server.nodeId] = {
        did               : server.did,
        connecting_clients: 0,
        total_clients     : 0
      }
    }

    if (serverMap == null || serverMap == undefined)
      serverMap = {}

    if (serverMap[server.nodeId] != undefined)
      this.native.toast("AddServerPage.serverAlreadyAdded");
    else
      this.native.toast("AddServerPage.serverAddedSuccess");

    // if (server != bindingServer)
    serverMap[server.nodeId] = server ;

    this.storeService.set(PersistenceKey.serversStatus,serversStatus);
    this.storeService.set(PersistenceKey.serverMap, serverMap);
    this.storeService.set(PersistenceKey.serverStatisticsMap,serverStatisticsMap);

    eventBus.publish(PublishType.updateServerList, this.getServerList(), Date.now());
  }

  connectionChangedCallback(){
    this.events.subscribe('carrier:connectionChanged', status => {
      this.carrierStatus = status;
      this.processConnetionStatus();
    });
  }

  networkstatusChangedCallback(){
    this.events.subscribe('feeds:networkStatusChanged', status => {
      this.networkStatus = status;
      this.processConnetionStatus();
    });
  }

  processConnetionStatus(){
    let networkStatus: number = this.getNetworkStatus();
    let carrierStatus: number = this.getCarrierStatus();
    if (networkStatus == FeedsData.ConnState.connected && carrierStatus == FeedsData.ConnState.connected){
      this.connectionStatus = FeedsData.ConnState.connected;
    }else if(networkStatus == FeedsData.ConnState.disconnected || carrierStatus == FeedsData.ConnState.disconnected){
      this.connectionStatus = FeedsData.ConnState.disconnected;
    }

    if (this.lastConnectionStatus != this.connectionStatus){
      this.lastConnectionStatus = this.connectionStatus;
      eventBus.publish(PublishType.connectionChanged, this.connectionStatus, Date.now());
    }
  }

  handleError(nodeId: string,error: any){
    eventBus.publish("rpcResponse:error");
    if(typeof error == "string")
      this.native.toastWarn(this.formatInfoService.formatErrorMsg(nodeId, error));
    else{
        this.processGeneralError(nodeId,error.code);
        return;
    }

  }

  handleResult(method:string, nodeId: string ,result: any , request: any, error: any){
    let requestParams = request.requestParams;
    switch (method) {
      case FeedsData.MethodType.create_channel:
        this.handleCreateChannelResult(nodeId, result, requestParams, error);
        break;
      case FeedsData.MethodType.publish_post:
        this.handlePublishPostResult(nodeId, result, requestParams, error);
        break;
      case FeedsData.MethodType.post_comment:
        this.handlePostCommentResult(nodeId, result, requestParams, error);
        break;
      case FeedsData.MethodType.post_like:
        this.handlePostLikeResult(nodeId, request, error);
        break;
      case FeedsData.MethodType.post_unlike:
        this.handlePostUnLikeResult(nodeId, request, error);
        break;
      case FeedsData.MethodType.get_my_channels:
        this.handleGetMyChannelsResult(nodeId, result, error);
        break;
      case FeedsData.MethodType.get_my_channels_metadata:
        this.handleGetMyChannelsMetaDataResult(nodeId, result, error);
        break;
      case FeedsData.MethodType.get_channels:
        this.handleGetChannelsResult(nodeId, result, requestParams, error);
        break;
      case FeedsData.MethodType.get_channel_detail:
        this.handleGetChannelDetailResult(nodeId, result, error);
        break;
      case FeedsData.MethodType.get_subscribed_channels:
        this.handleGetSubscribedChannelsResult(nodeId, result, requestParams, error);
        break;
      case FeedsData.MethodType.get_posts:
        this.handleGetPostsResult(nodeId, result, request, error);
        break;
      case FeedsData.MethodType.get_comments:
        this.handleGetCommentsResult(nodeId, result, request, error);
        break;
      case FeedsData.MethodType.get_statistics:
        this.handleGetStatisticsResult(nodeId, result, error);
        break;
      case FeedsData.MethodType.subscribe_channel:
        this.handleSubscribeChannelResult(nodeId, requestParams, error);
        break;
      case FeedsData.MethodType.unsubscribe_channel:
        this.handleUnsubscribeChannelResult(nodeId, requestParams, error);
        break;

      case FeedsData.MethodType.declare_post:
        this.handleDeclarePostResult(nodeId, result, requestParams, error);
        break;

      case FeedsData.MethodType.notify_post:
        this.handleNotifyPostResult(nodeId, result, requestParams, error);
        break;

      case "update_feedinfo":
        this.handleEditFeedInfo(nodeId,requestParams,error);
        break;
      case FeedsData.MethodType.enable_notification:
        this.handleEnableNotificationResult(nodeId, error);
        break;

      case "declare_owner":
        this.handleDeclareOwnerResponse(nodeId, result, error);
        break;
      case "import_did":
        this.handleImportDIDResponse(nodeId, result, error);
        break;
      case "issue_credential":
        this.handleIssueCredentialResponse(nodeId, result, error);
        break;
      case "signin_request_challenge":
        this.handleSigninChallenge(nodeId, result, error);
        break;
      case "signin_confirm_challenge":
        this.handleSigninConfirm(nodeId, result, error);
        break;

      case FeedsData.MethodType.editPost:
        this.handleEditPost(nodeId, requestParams, error);
        break;

      case FeedsData.MethodType.deletePost:
        this.handleDeletePost(nodeId, requestParams, error);
        break;

      case FeedsData.MethodType.editComment:
        this.handleEditComment(nodeId, requestParams, error);
        break;
      case FeedsData.MethodType.deleteComment:
        this.handleDeleteComment(nodeId, requestParams, error);
        break;

      case FeedsData.MethodType.getServerVersion:
        this.handleGetServerVersion(nodeId, result, error);
        break;

      case FeedsData.MethodType.updateCredential:
        this.handleUpdateCredentialResponse(nodeId, result, requestParams, error);
        break;

      case FeedsData.MethodType.setBinary:
        this.handleSetBinaryResponse(nodeId, result, requestParams, error);
        break;

      case FeedsData.MethodType.getBinary:
        this.handleGetBinaryResponse(nodeId, result, requestParams, error);
        break;

      case FeedsData.MethodType.standard_sign_in:
        this.handleStandardSignInResponse(nodeId, result, requestParams, error);
        break;

      case FeedsData.MethodType.standard_did_auth:
        this.handleStandardDidAuthResponse(nodeId, result, requestParams, error);
        break;

      case FeedsData.MethodType.get_multi_comments:
        this.handleGetMultiComments(nodeId, result, requestParams, error);
        break;
      default:
        break;
    }
  }

  friendMessageCallback(){
    this.events.subscribe('jrpc:receiveMessage', result => {
      switch(result.type){
        case -1:
          alert(result.error.code+":"+result.error.message);
          break;
        case 1:
          this.handleNotification(result.nodeId, result.method, result.params);//TODO
          break;
        case 0:
          this.handleResult(result.method, result.nodeId, result.result, result.request, result.error);
          break;
      }
    });
  }

  getCurrentTime(): string{
    return new Date().getTime().toString();
  }

  getCurrentTimeNum(): number{
    return new Date().getTime();
  }

  checkDIDValidity(){
  }

  parseDid(feedUrl: string): DidData{
    let startIndex = feedUrl.indexOf("did:elastos:");
    if (!feedUrl.startsWith("feeds://") || startIndex == -1){
      return null;
    }

    let hashPos = feedUrl.indexOf("#");
    let backSlashPos = feedUrl.lastIndexOf("/");

    // feeds://did:elastos:ixxxxxxx/1234carrieraddress5678
    if (hashPos == -1 && backSlashPos >7){
      let carrierAddress = this.getCarrierAddress(feedUrl,backSlashPos+1,feedUrl.length);
      let did = this.getDid(feedUrl, startIndex, backSlashPos);
      return new DidData(did,carrierAddress,null);
    }

    // feeds://did:elastos:ixxxxxxx
    if (hashPos == -1){
      let did = this.getDid(feedUrl, startIndex, feedUrl.length);
      return new DidData(did,null,null);
    }

    //feeds://did:elastos:ixxxxxxx#serviceid/carrieraddress
    if (backSlashPos>7){
      let did = this.getDid(feedUrl, startIndex, hashPos);
      // let serviceId = this.getServiceId(feedUrl, hashPos+1, backSlashPos);
      let serviceId = this.getServiceId(feedUrl, startIndex, backSlashPos);
      let carrierAddress = this.getCarrierAddress(feedUrl,backSlashPos+1,feedUrl.length);
      return new DidData(did,carrierAddress,serviceId);
    }

    // feeds://did:elastos:ixxxxxxx#serviceid
    let did = this.getDid(feedUrl, startIndex, hashPos);
    // let serviceId = this.getServiceId(feedUrl, hashPos+1, feedUrl.length);
    let serviceId = this.getServiceId(feedUrl, startIndex, feedUrl.length);
    return new DidData(did,null,serviceId);
  }

  getCarrierAddress(feedUrl: string, start: number, end: number): string{
    return "carrier://"+feedUrl.substring(start,end);
  }

  getDid(feedUrl: string, start: number, end: number): string{
    return feedUrl.substring(start,end);
  }

  getServiceId(feedUrl: string, start: number, end: number): string{
    return feedUrl.substring(start, end);
  }

  resolveDidDocument(feedsUrl: string, defaultServer:Server, onSuccess: (server: Server)=>void, onError?: (err: any)=>void){
    let didData = this.parseDid(feedsUrl);

    didManager.resolveDidDocument(didData.did, false,(didDocument)=>{
      if (didDocument == null){
        onError("The carrier node could not be found");
        return ;
      }
      let services = didDocument.getServices();
      if ((services == null || services == undefined || services.length == 0) &&
        defaultServer != null){
        onSuccess(defaultServer);
        return ;
      }

      for (let index = 0; index < services.length; index++) {
        const element = services[index];
        if(this.parseResult(didData, element)){

          let endpoint = element.getEndpoint();
          let carrierAddress = endpoint.substring(endpoint.lastIndexOf("//")+2,endpoint.length);
          onSuccess({
            name              : element.getId(),
            owner             : didDocument.getSubject().getDIDString(),
            introduction      : "introduction",
            did               : didDocument.getSubject().getDIDString(),
            carrierAddress    : carrierAddress,
            nodeId            : "",
            feedsUrl          : feedsUrl,
            elaAddress        : "",
            // status            : ConnState.disconnected
          });
          return;
        }else{
          // onError("The carrier node could not be found");
        }
      }
      if (didData.carrierAddress!=null || didData.carrierAddress != undefined){
        let carrierAddress = didData.carrierAddress.substring(didData.carrierAddress.lastIndexOf("//")+2,didData.carrierAddress.length);
        onSuccess({
            name              : this.translate.instant("DIDdata.NotprovidedfromDIDDocument"),
            owner             : didDocument.getSubject().getDIDString(),
            introduction      : this.translate.instant("DIDdata.NotprovidedfromDIDDocument"),
            did               : didDocument.getSubject().getDIDString(),
            carrierAddress    : carrierAddress,
            nodeId            : "",
            feedsUrl          : feedsUrl,
            elaAddress        : "",
            // status            : ConnState.disconnected
        });
      } else {
        onError("The carrier node could not be found");
      }
    },(err)=>{
      onError(err);
    });
  }

  createPresentation(nonce, realm, onSuccess: (presentation: any)=>void, onError?: (err:any)=>void){
    appManager.sendIntent("https://did.elastos.net/credaccess", {}, {}, (response: any) => {
      if (response && response.result && response.result.presentation)
        onSuccess(response.result.presentation);
    },
    (err)=>{});
  }

  verifyPresentation(presentationstr: string, onSuccess?: (isValid: boolean)=>void, onError?: (err:any)=>void){
    didManager.VerifiablePresentationBuilder.fromJson(presentationstr, (presentation)=>{
      presentation.isValid((isValid)=>{
        // if isValid && nonce == this.nonce && realm == this.realm onSuccess(true)
        // else onSuccess(false)
        onSuccess(isValid);
      },
      (err)=>{});
    });
  }

  loginRequest(nodeId: string){
    this.nonce = this.generateNonce();
    this.realm = this.carrierService.getAddress();
    let payload = {
      application: "feeds",
      version    : "0.1",
      method: "negotiate_login",
      nonce : this.nonce,
      realm : this.realm
    }

    this.sendJWTMessage(nodeId,payload);
  }

  loginResponse(nodeId: string, payload: any){
    let presentation = payload.presentation;
    //1.verify presentation
    this.verifyPresentation(payload.presentation,(isValid) =>{

      if (isValid){
        //2.verify noce & realm
        //TODO verify noce & realm

        this.serviceNonce = payload.nonce;
        this.serviceRealm = payload.realm;

        //3.send confirm msg
        this.confirmLoginRequest(nodeId);

      }
    });
  }

  confirmLoginRequest(nodeId: string){
    let presentation = this.createPresentation(
      this.serviceNonce,
      this.serviceRealm,
      (presentation)=>{
        let payload = {
          application: "feeds",
          version    : "0.1",
          method      : "confirm_login",
          presentation: presentation
        }

        this.jwtMessageService.request(nodeId, payload ,()=>{}, ()=>{});
    });
  }

  generateNonce(): string{
    return this.generateUUID();
  };

  generateUUID(): string{
    var d = new Date().getTime();
    var uuid = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, function(c) {
      var r = (d + Math.random()*16)%16 | 0;
      d = Math.floor(d/16);
      return (c=='x'? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
  }

  checkSignInServerList(nodeId: string){
    if (signInServerList.indexOf(nodeId) == -1){
      signInServerList.push(nodeId);
      eventBus.publish(PublishType.signInServerListChanged,signInServerList);
    }
  }

  checkSignInServerStatus(nodeId: string): boolean{
    let accessToken = accessTokenMap[nodeId] || undefined;
    return this.checkExp(accessToken);
  }

  hasAccessToken(nodeId: string): boolean{
    if (accessTokenMap == undefined)
      accessTokenMap = {};
    let accessToken = accessTokenMap[nodeId] || undefined
    if (this.checkExp(accessToken)){
      this.signinChallengeRequest(nodeId,true);
      return false;
    }else{
      return true;
    }
  }

  parseResult(didData: DidData ,service: DIDPlugin.Service) {
    if (didData == null){
      return ;
    }

    if (didData.carrierAddress == null && didData.serviceId == null){
      if (service.getType() == 'Feeds') return true;
    }

    if (didData.carrierAddress == null && didData.serviceId != null){
      if(didData.serviceId == service.getId()) return true;
    }

    if (didData.carrierAddress != null && didData.serviceId != null){
      if (didData.carrierAddress == service.getEndpoint()
        && didData.serviceId == service.getId()
      ) return true;
    }

    if (didData.carrierAddress != null && didData.serviceId == null){
      if (didData.carrierAddress == service.getEndpoint()) return true;
    }

    return false;
  }



  getServerbyNodeId(nodeId: string): Server{
    if (serverMap == undefined) {
      return undefined;
    }
    return serverMap[nodeId];
  }

  getServerNameByNodeId(nodeId: string): string{
    let serverName = "Unknow";
    let server = this.getServerbyNodeId(nodeId);
    if ( server != undefined ){
      serverName = server.name;
    }

    return serverName;
  }

  getFeedNameById(nodeId: string, channelId: number): string{
    let feedName = "Unknow";
    let channel = this.getChannelFromId(nodeId, channelId);
    if ( channel !=undefined ){
      feedName = channel.name;
    }

    return feedName;
  }

  saveSignInRAWData(jsonStr: string){
    this.storeService.set(PersistenceKey.signInRawData, jsonStr);
  }

  saveSignInData(
    did: string,
    name: string,
    avatar: Avatar,
    email: string,
    telephone: string,
    location: string,
    nickname:string,
    description: string
  ){
    this.localSignInData = new SignInData(
      did,
      name,
      avatar,
      email,
      telephone,
      location,
      nickname,
      description,
      this.getCurrentTimeNum()+this.getDaysTS(expDay)
    );

    this.checkSignInDataChange(this.localSignInData).then((isChange)=>{
      if (isChange){
        this.removeAllAccessToken();
        this.storeService.set(PersistenceKey.signInData, this.localSignInData);
        this.storeService.set(PersistenceKey.lastSignInData, this.localSignInData);
      }else{
        this.storeService.set(PersistenceKey.signInData, this.localSignInData);
        this.storeService.set(PersistenceKey.lastSignInData, this.localSignInData);
      }
    })
  }

  saveSignInData2(signInData: SignInData) {
    this.localSignInData = signInData;
    this.storeService.set(PersistenceKey.signInData, signInData);
  }

  cleanSignInData(){
    this.storeService.remove(PersistenceKey.signInData);
  }

  getSignInData(): SignInData {
    return this.localSignInData;
  }

  checkSignInDataChange(signInData: SignInData):Promise<boolean>{
    return new Promise((resolve, reject) =>{
      this.storeService.get(PersistenceKey.lastSignInData).then((lastSignInData)=>{
        if (lastSignInData == null || lastSignInData == undefined){
          resolve(true);
          return ;
        }

        if (signInData.did != lastSignInData.did){
          resolve(true);
          return ;
        }
        if (signInData.name != lastSignInData.name){
          resolve(true);
          return ;
        }
        if (JSON.stringify(signInData.avatar) != JSON.stringify(lastSignInData.avatar)){
          resolve(true);
          return ;
        }
        if (signInData.email != lastSignInData.email){
          resolve(true);
          return ;
        }
        if (signInData.telephone != lastSignInData.telephone){
          resolve(true);
          return ;
        }
        if (signInData.location != lastSignInData.location){
          resolve(true);
          return ;
        }
        if (signInData.nickname != lastSignInData.nickname){
          resolve(true);
          return ;
        }
        if (signInData.description != lastSignInData.description){
          resolve(true);
          return ;
        }

        resolve(false);
      },(reason)=>{
        reject(reason);
      })
    });
  }

  initSignInDataAsync(onSuccess:(signInData: SignInData) => void,onError?:(errorData: any) => void){
    if (this.localSignInData!= null || this.localSignInData != undefined){
      onSuccess(this.localSignInData);
      return ;
    }

    this.storeService.get(PersistenceKey.signInData).then((signinData)=>{
      this.localSignInData = signinData;
      onSuccess(this.localSignInData);
    }).catch((error)=>{
      onError(error);
    });
  }

  getDaysTS(days: number): number{
    return days*24*60*60*1000;
  }

  updateSignInDataExpTime(signInData: SignInData){
    signInData.expiresTS = this.getCurrentTimeNum()+this.getDaysTS(expDay);
    this.saveSignInData2(signInData);
  }

  updateSignInDataExpTimeTo(signInData: SignInData, timestamp: number){
    signInData.expiresTS = timestamp ;
    this.saveSignInData2(signInData);
  }

  //// get data from persistence
  getLocalSubscribedChannels(){
  }

  getLocalChannelsMap(){
  }

  getLocalMyChannelsMap(){
  }

  getLocalUnreadMap(){
  }

  getPostMap(){
  }

  //// do

  refreshSubscribedChannels(){
    let list = this.getServerList();
    let isLocalRefresh = true;

    for (let index = 0; index < list.length; index++) {
      if (serversStatus[list[index].nodeId] == undefined ||
        serversStatus[list[index].nodeId].status == ConnState.disconnected)
        continue;
      else {
        isLocalRefresh = false;
        this.getSubscribedChannels(list[index].nodeId, Communication.field.last_update, 0, 0,10);
      }
    }

    if (isLocalRefresh)
      this.refreshLocalSubscribedChannels();
  }

  refreshLocalSubscribedChannels():Channels[]{
    localSubscribedList.slice(0,localSubscribedList.length);
    localSubscribedList=[];
    let channels = this.sortChannels(0, subscribedChannelsMap,localSubscribedList);
    eventBus.publish(PublishType.refreshSubscribedChannels,localSubscribedList);
    return channels;
  }

  loadMoreSubscribedChannels(){
  }

  loadMoreLocalSubscribedChannels(){
    this.sortChannels(localSubscribedList.length, subscribedChannelsMap,localSubscribedList);
    eventBus.publish(PublishType.loadMoreSubscribedChannels,localSubscribedList);
  }

  refreshChannels(){
    let list = this.getServerList();
    let isLocalRefresh = true;

    for (let index = 0; index < list.length; index++) {
      let nodeId = list[index].nodeId;
      if (serversStatus[nodeId].status == ConnState.disconnected)
        continue;
      else {
        isLocalRefresh = false;
        // let lastFeedUpdate = this.lastFeedUpdateMap[nodeId].time || 0;
        // this.getChannels(nodeId, Communication.field.last_update, 0, lastFeedUpdate, 0);
        this.updateFeed(nodeId, false);
      }
    }

    if (isLocalRefresh)
      this.refreshLocalChannels();
  }

  refreshLocalChannels():Channels[]{
    localChannelsList.slice(0,localChannelsList.length);
    localChannelsList=[];
    let channels = this.sortChannels(0, channelsMap,localChannelsList);
    eventBus.publish(PublishType.refreshChannels,localChannelsList);
    return channels;
  }

  sortChannels(start: number, map: {}, localList: Channels[]): Channels[]{
    let list: Channels[] = [];
    if (map ==null || map == undefined)
      map = {}

    let keys: string[] = Object.keys(map);
    for (const index in keys) {
      if (map[keys[index]] == null || map[keys[index]] == undefined)
        continue;
        list.push(map[keys[index]]);
    }

    list.sort((a, b) => Number(b.last_update) - Number(a.last_update));
    let end: number;
    if (list.length>start+10){
      end = start+10;
    }else{
      end = list.length;
    }
    for (let index = start; index < end; index++)
      localList.push(list[index]);
    return localList;
  }

  loadMoreChannels(nodeId: string, upper_bound: number){
    this.getChannels(nodeId, Communication.field.last_update, upper_bound, 0, 10);
  }

  refreshMyChannels(): Channels[]{
    if (myChannelsMap == null || myChannelsMap == undefined){
      eventBus.publish(PublishType.refreshMyChannel,[]);
      return [];
    }

    let list: Channels[] = [];
    let keys: string[] = Object.keys(myChannelsMap);
    localMyChannelList = [];
    for (const index in keys) {
      if (myChannelsMap[keys[index]] == null || myChannelsMap[keys[index]] == undefined)
        continue;

      if (channelsMap != null && channelsMap != undefined &&
        channelsMap[keys[index]] != undefined){
          let channel = channelsMap[keys[index]];
          list.push(channel);
        }
    }

    list.sort((a, b) => Number(b.last_update) - Number(a.last_update));

    localMyChannelList.slice(0,localMyChannelList.length);
    let end:number = 0;
    if (list.length>10){
      end = 10;
    }else{
      end = list.length;
    }

    for (let index = 0; index < end; index++)
      localMyChannelList.push(list[index]);

    eventBus.publish(PublishType.refreshMyChannel,localMyChannelList);
    return localMyChannelList;
  }

  loadMoreMyChannels(){
    let end: number;
    let start: number = localMyChannelList.length;
    if (myChannelsMap == null || myChannelsMap == undefined){
      eventBus.publish(PublishType.loadMoreMyChannel,[]);
      return;
    }

    let list: Channels[] = [];
    let keys: string[] = Object.keys(myChannelsMap);
    for (const index in keys) {
      if (myChannelsMap[keys[index]] == null || myChannelsMap[keys[index]] == undefined)
        continue;

      if (channelsMap != null && channelsMap != undefined &&
        channelsMap[keys[index]] != undefined){
          let channel = channelsMap[keys[index]];
          list.push(channel);
        }
    }

    list.sort((a, b) => Number(b.last_update) - Number(a.last_update));

    if (localMyChannelList.length+10>list.length){
      end = list.length;
    }else{
      end = localMyChannelList.length+10;
    }

    for (let index = start ; index < end; index++)
      localMyChannelList.push(list[index]);

    eventBus.publish(PublishType.loadMoreMyChannel);
  }

  //// new request
  createChannel(nodeId: string, name: string, introduction: string, avatar: any){
    if(!this.hasAccessToken(nodeId))
      return;
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.createChannel(this.getServerNameByNodeId(nodeId),nodeId,name,introduction,avatar,accessToken);
  }

  publishPost(nodeId: string, channelId: number, content: any){
    if(!this.hasAccessToken(nodeId))
      return;
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.publishPost(this.getServerNameByNodeId(nodeId),nodeId, channelId,content,accessToken);
  }

  declarePost(nodeId: string, channelId: number, content: any, withNotify: boolean){
    if(!this.hasAccessToken(nodeId))
      return;
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.declarePost(this.getServerNameByNodeId(nodeId),nodeId, channelId,content,withNotify,accessToken);
  }

  notifyPost(nodeId: string, channelId: number, postId: number){
    if(!this.hasAccessToken(nodeId))
      return;
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.notifyPost(this.getServerNameByNodeId(nodeId),nodeId, channelId, postId,accessToken);
  }

  postComment(nodeId: string, channelId: number, postId: number,
              commentId: number, content: any){
    if(!this.hasAccessToken(nodeId))
      return;
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.postComment(this.getServerNameByNodeId(nodeId),nodeId,channelId,postId,commentId,content,accessToken);
  }

  postLike(nodeId: string, channelId: number, postId: number, commentId: number){
    if(!this.hasAccessToken(nodeId))
      return;
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.postLike(this.getServerNameByNodeId(nodeId),nodeId, channelId, postId, commentId, accessToken);
    if(!this.connectionService.checkServerConnection(nodeId)){
      return;
    }
    this.doPostLikeFinish(nodeId, channelId, postId, commentId);
  }

  postUnlike(nodeId:string, channelId: number, postId: number, commentId: number){
    if(!this.hasAccessToken(nodeId))
      return;
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.postUnlike(this.getServerNameByNodeId(nodeId), nodeId, channelId, postId, commentId, accessToken);
    if(!this.connectionService.checkServerConnection(nodeId)){
      return;
    }
    this.doPostUnLikeFinish(nodeId, channelId, postId, commentId);
  }

  getMyChannels(nodeId: string, field: Communication.field, upper_bound: number,
                lower_bound: number, max_counts: number){
    if(!this.hasAccessToken(nodeId))
      return;
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.getMyChannels(this.getServerNameByNodeId(nodeId), nodeId, field, upper_bound, lower_bound, max_counts,accessToken);
  }

  getMyChannelsMetaData(nodeId: string, field: Communication.field, upper_bound: number,
                        lower_bound: number, max_counts: number){
    if(!this.hasAccessToken(nodeId))
      return;
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.getMyChannelsMetaData(this.getServerNameByNodeId(nodeId), nodeId, field, upper_bound, lower_bound, max_counts, accessToken);
  }

  getChannels(nodeId: string, field: Communication.field, upper_bound: number,
              lower_bound: number, max_counts: number){
    if(!this.hasAccessToken(nodeId))
      return;

    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.getChannels(this.getServerNameByNodeId(nodeId), nodeId, field, upper_bound, lower_bound, max_counts, accessToken);
  }

  getChannelDetail(nodeId: string, id: number){
    if(!this.hasAccessToken(nodeId))
      return;
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.getChannelDetail(this.getServerNameByNodeId(nodeId), nodeId, id, accessToken);
  }

  getSubscribedChannels(nodeId: string, field: Communication.field, upper_bound: number,
                        lower_bound: number, max_counts: number){
    if(!this.hasAccessToken(nodeId))
      return;
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.getSubscribedChannels(this.getServerNameByNodeId(nodeId), nodeId, field, upper_bound, lower_bound, max_counts, accessToken);
  }

  getPost(nodeId: string, channel_id: number, by: Communication.field,
          upper_bound: number, lower_bound: number , max_counts: number, memo: any){
    if(!this.hasAccessToken(nodeId))
      return;
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.getPost(this.getServerNameByNodeId(nodeId), nodeId, channel_id, by, upper_bound, lower_bound, max_counts, memo, accessToken);
  }

  getComments(nodeId: string, channel_id: number, post_id: number,
              by:Communication.field, upper_bound: number, lower_bound: number, max_counts:number, isShowOfflineToast: boolean){
    if(!this.hasAccessToken(nodeId))
      return;
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.getComments(this.getServerNameByNodeId(nodeId), nodeId, channel_id, post_id, by, upper_bound, lower_bound,max_counts, isShowOfflineToast, accessToken);
  }

  getStatistics(nodeId: string){
    if(!this.hasAccessToken(nodeId))
      return;
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.getStatistics(this.getServerNameByNodeId(nodeId), nodeId, accessToken);
  }

  subscribeChannel(nodeId: string, id: number){
    if(!this.hasAccessToken(nodeId))
      return;
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.subscribeChannel(this.getServerNameByNodeId(nodeId),nodeId, id, accessToken);

    if(!this.connectionService.checkServerConnection(nodeId)){
      return;
    }

    this.doSubscribeChannelFinish(nodeId, id);
  }

  unsubscribeChannel(nodeId: string, id: number){
    if(!this.hasAccessToken(nodeId))
      return;

    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.unsubscribeChannel(this.getServerNameByNodeId(nodeId),nodeId, id, accessToken);

    if(!this.connectionService.checkServerConnection(nodeId)){
      return;
    }

    this.doUnsubscribeChannelFinish(nodeId, id);
  }

  editFeedInfo(nodeId: string, channelId: number, name: string , desc: string, avatar: any){
    if(!this.hasAccessToken(nodeId))
      return;

    let avatarBin = this.serializeDataService.encodeData(avatar);
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.editFeedInfo(this.getServerNameByNodeId(nodeId),nodeId, channelId, name, desc, avatarBin, accessToken);
  }

  editPost(nodeId: string, channelId: number, postId: number, content: any){
    if(!this.hasAccessToken(nodeId))
      return;

    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.editPost(this.getServerNameByNodeId(nodeId),nodeId, channelId, postId, content, accessToken);
  }

  deletePost(nodeId: string, channelId: number, postId: number){
    if(!this.hasAccessToken(nodeId))
      return;

    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.deletePost(this.getServerNameByNodeId(nodeId),nodeId, channelId, postId, accessToken);
  }

  editComment(nodeId: string, channelId: number, postId: number, commentId: number,
              commentById: number, content: any){
    if(!this.hasAccessToken(nodeId))
      return;

    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.editComment(this.getServerNameByNodeId(nodeId),nodeId, channelId, postId, commentId, commentById, content, accessToken);
  }

  deleteComment(nodeId: string, channelId: number, postId: number, commentId: number){
    if(!this.hasAccessToken(nodeId))
      return;

    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.deleteComment(this.getServerNameByNodeId(nodeId),nodeId, channelId, postId, commentId, accessToken);
  }

  getServerVersion(nodeId: string){
    this.connectionService.getServerVersion(this.getServerNameByNodeId(nodeId),nodeId);
  }

  updateCredential(nodeId: string, credential: string){
    if(!this.hasAccessToken(nodeId))
      return;

    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.updateCredential(this.getServerNameByNodeId(nodeId), nodeId, credential, accessToken);
  }

  handleEditPost(nodeId: string, request: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }
  }

  handleDeletePost(nodeId: string, request: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    let channelId = request.channel_id;
    let postId = request.id;

    let mPostId = this.getPostId(nodeId, channelId, postId);
    this.postMap[mPostId].post_status = FeedsData.PostCommentStatus.deleted;
    this.storeService.set(PersistenceKey.postMap, this.postMap);

    this.removeMediaData(nodeId, channelId, postId, 0);

    eventBus.publish(PublishType.deletePostFinish);
  }

  handleEditComment(nodeId: string, request: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }
  }

  handleDeleteComment(nodeId: string, request: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    let channelId = request.channel_id;
    let postId = request.post_id;
    let commentId = request.id

    commentsMap[nodeId][channelId][postId][commentId].status = FeedsData.PostCommentStatus.deleted;
    this.storeService.set(PersistenceKey.commentsMap, commentsMap);
    eventBus.publish(PublishType.deleteCommentFinish);
  }

  handleGetServerVersion(nodeId: string, result: any, error: any){
    // if (error != null && error != undefined && error.code != undefined){
    //   this.handleError(nodeId, error);
    //   return;
    // }

    let version = result.version;
    let versionCode = result.version_code||1;

    if (this.serverVersions == null ||
      this.serverVersions == undefined)
      this.serverVersions = {};

    let serverVersion = this.serverVersions[nodeId]||""
    if (serverVersion == ""){
      this.serverVersions[nodeId] = {
        nodeId        : nodeId,
        versionName   : version,
        versionCode   : versionCode
      }
    }else {
      this.serverVersions[nodeId].nodeId = nodeId;
      this.serverVersions[nodeId].versionCode = versionCode;
      this.serverVersions[nodeId].versionName = version;
    }
    this.storeService.set(PersistenceKey.serverVersions, this.serverVersions);
  }

  enableNotification(nodeId: string){
    if(!this.hasAccessToken(nodeId))
      return;

    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.enableNotification(this.getServerNameByNodeId(nodeId),nodeId, accessToken);
  }

  ////handle push
  handleNewPostNotification(nodeId: string, params: any){
    let channel_id: number = params.channel_id;
    let id: number = params.id;
    let contentBin:any = params.content;
    let created_at: number = params.created_at;
    let updateAt: number = params.updated_at||created_at;

    let contentStr = this.serializeDataService.decodeData(contentBin);

    let content = this.parseContent(nodeId,channel_id,id,0,contentStr);

    let mPostId = this.getPostId(nodeId, channel_id, id);
    this.postMap[mPostId] = {
      nodeId     : nodeId,
      channel_id : channel_id,
      id         : id,
      content    : content,
      comments   : 0,
      likes      : 0,
      created_at : created_at*1000,
      updated_at  : updateAt,
      post_status : FeedsData.PostCommentStatus.available
    }

    let nodeChannelId = this.getChannelId(nodeId, channel_id);

    this.updateLastPostUpdate(nodeChannelId, nodeId, channel_id, updateAt);

    this.storeService.set(PersistenceKey.postMap, this.postMap);

    if (!this.checkChannelIsMine(nodeId, channel_id))
      unreadMap[nodeChannelId] = unreadMap[nodeChannelId]+1;

    this.storeService.set(PersistenceKey.unreadMap,unreadMap);

    eventBus.publish(PublishType.postDataUpdate);
  }

  async handleNewCommentNotification(nodeId: string, params: any){
    let channelId: number= params.channel_id;
    let postId: number = params.post_id;
    let commentId: number = params.id;
    let referCommentId: number = params.comment_id;
    let contentBin: any = params.content;
    let userName: any = params.user_name;
    let createdAt: number = params.created_at || 0;
    let updatedAt: number = params.updated_at || createdAt;
    let status: FeedsData.PostCommentStatus = params.status || FeedsData.PostCommentStatus.available;
    let userDid: string = params.user_did || "";

    await this.processNewComment(nodeId,channelId,postId,commentId,referCommentId,
      userName,0,createdAt,updatedAt,status,userDid,contentBin);

    let ncpId = this.getPostId(nodeId, channelId, postId);
    this.postMap[ncpId].comments = this.postMap[ncpId].comments+1;
    await this.storeService.set(PersistenceKey.postMap,this.postMap);
    eventBus.publish(PublishType.postDataUpdate);

    if(this.checkChannelIsMine(nodeId,channelId)){
      let lastCommentUpdateKey = this.getPostId(nodeId, 0, 0);
      this.updateLastCommentUpdate(lastCommentUpdateKey, nodeId, channelId, postId, updatedAt);
    }
  }

  processNewComment(nodeId: string, channelId: number, postId: number, commentId: number, referCommentId: number,
                userName: string, likes: number, createdAt: number, updatedAt: number, status: FeedsData.PostCommentStatus,
                userDid: string, contentBin: any): Promise<void>{
    return new Promise(async (resolve, reject) =>{
      let content = this.serializeDataService.decodeData(contentBin);

      this.updateCommentMap(nodeId, channelId, postId, commentId, referCommentId,
        userName, likes, createdAt, updatedAt, status,userDid, content);
      await this.storeService.set(PersistenceKey.commentsMap, commentsMap);

      let ncpId = this.getPostId(nodeId, channelId, postId);
      this.updateLastCommentUpdate(ncpId, nodeId, channelId, postId, updatedAt);
      eventBus.publish(PublishType.commentDataUpdate);

      this.generateNotification(nodeId, channelId, postId,commentId,userName,Behavior.comment,this.translate.instant("NotificationPage.commentPost"))

      resolve();
    });
  }

  updateCommentMap(nodeId: string, channelId: number, postId: number, commentId: number, referCommentId: number,
                  userName: string, likes: number, createdAt: number, updatedAt: number, status: FeedsData.PostCommentStatus,
                  userDid: string, content: any){
    if (commentsMap == null || commentsMap == undefined)
      commentsMap = {};
    if (commentsMap[nodeId] == null || commentsMap[nodeId] == undefined)
      commentsMap[nodeId] = {};
    if (commentsMap[nodeId][channelId] == null || commentsMap[nodeId][channelId] == undefined)
      commentsMap[nodeId][channelId] = {};
    if (commentsMap[nodeId][channelId][postId] == null || commentsMap[nodeId][channelId][postId]==undefined)
      commentsMap[nodeId][channelId][postId] = {};

    if (updatedAt > createdAt && status == FeedsData.PostCommentStatus.available)
      status = FeedsData.PostCommentStatus.edited;

    commentsMap[nodeId][channelId][postId][commentId] = {
      nodeId     : nodeId,
      channel_id : channelId,
      post_id    : postId,
      id         : commentId,
      comment_id : referCommentId,
      user_name  : userName,
      content    : content,
      likes      : likes,
      created_at : createdAt*1000,
      updated_at : updatedAt,
      status     : status,
      user_did   : userDid
    }
  }

  generateNotification(nodeId: string, channelId: number, postId: number, commentId:number,
                    userName: string, behavior:Behavior, behaviorText: string){
    if (!this.checkChannelIsMine(nodeId, channelId))
      return ;

    if (userName == this.getSignInData().name)
      return ;

    let notification:Notification = {
      id: this.generateUUID(),
      userName: userName,
      behavior: behavior,
      behaviorText: behaviorText,
      details: {
        nodeId: nodeId,
        channelId:channelId,
        postId:postId,
        commentId: commentId
      },
      time:this.getCurrentTimeNum(),
      readStatus:1
    }
    notificationList.push(notification);
    this.storeService.set(PersistenceKey.notificationList, notificationList);
    eventBus.publish(PublishType.UpdateNotification);

  }

  handleNewLikesNotification(nodeId: string, params: any){
    let comment_id: number = params.comment_id;
    let channel_id: number = params.channel_id;
    let post_id: number = params.post_id;
    let totalCount: number = params.total_count;
    let user_name: string = params.user_name;

    if (comment_id == 0){
      let postId = this.getPostId(nodeId,channel_id,post_id);
      this.postMap[postId].likes = totalCount;
      this.storeService.set(PersistenceKey.postMap,this.postMap);
      if (likeMap[postId] != null && likeMap[postId] != undefined){
        likeMap[postId] = {
          nodeId    : nodeId,
          channelId :channel_id,
          postId    :post_id,
          commentId :0
        };
        this.storeService.set(PersistenceKey.likeMap, likeMap);
        eventBus.publish(PublishType.updateLikeList, this.getLikeList());
      }
      eventBus.publish(PublishType.postDataUpdate);
    }else {
      commentsMap[nodeId][channel_id][post_id][comment_id].likes = totalCount;

      this.storeService.set(PersistenceKey.commentsMap, commentsMap);
      eventBus.publish(PublishType.commentDataUpdate);
    }

    let behaviorText: string = "";
    let behavior: Behavior;
    if (comment_id == 0){
      behavior = Behavior.likedPost;
      behaviorText = this.translate.instant("NotificationPage.likedPost");
    }else{
      behavior = Behavior.likedComment;
      behaviorText = this.translate.instant("NotificationPage.likedComment");
    }

    this.generateNotification(nodeId,channel_id,post_id,comment_id,user_name,behavior,behaviorText);
  }

  handleNewSubscriptionNotification(nodeId: string, params: any){
    let channel_id = params.channel_id;
    let user_name = params.user_name;
    let user_did = params.user_did;

    this.generateNotification(nodeId, channel_id, 0,0, user_name,Behavior.follow, this.translate.instant("NotificationPage.followedFeed"))
  }

  handleNewFeedInfoUpdateNotification(nodeId: string, params: any){
    let channelId = params.id||0;
    let name = params.name||"";
    let desc = params.introduction||"";
    let avatarBin = params.avatar||""
    let last_update = params.last_update||"";
    let subscribers = params.subscribers||0 ;
    let avatar = this.serializeDataService.decodeData(avatarBin)||"";

    let nodeChannelId = this.getChannelId(nodeId, channelId) || "";

    if (channelsMap[nodeChannelId] == undefined){
      channelsMap[nodeChannelId] = {
        nodeId:nodeId,
        id: channelId,
        name: name,
        introduction: desc,
        owner_name: "",
        owner_did: "",
        subscribers : 0,
        last_update : last_update,
        last_post: "",
        avatar: "",
        isSubscribed: true
      }
    }

    if (name != "")
      channelsMap[nodeChannelId].name = name;
    if (desc != "")
      channelsMap[nodeChannelId].introduction = desc;
    if (avatarBin != "")
      channelsMap[nodeChannelId].avatar = avatar;
    if (last_update != "")
      channelsMap[nodeChannelId].last_update = last_update;
    if (subscribers != 0)
      channelsMap[nodeChannelId].subscribers = subscribers;

    this.storeService.set(PersistenceKey.channelsMap,channelsMap);
    eventBus.publish(PublishType.editFeedInfoFinish, nodeChannelId);
  }

  handleNewPostUpdate(nodeId: string, params: any){
    let channelId: number = params.channel_id;
    let postId: number = params.id;
    let status: FeedsData.PostCommentStatus = params.status||FeedsData.PostCommentStatus.available;
    let contentBin: any =  params.content;
    let comments: number = params.comments||0;
    let likes: number = params.likes||0;
    let createdAt: number = params.created_at||0;
    let updatedAt: number = params.updated_at||createdAt;

    if (updatedAt > createdAt && status == FeedsData.PostCommentStatus.available)
      status = FeedsData.PostCommentStatus.edited

    let contentStr = this.serializeDataService.decodeData(contentBin);
    let content = this.parseContent(nodeId,channelId,postId,0,contentStr);

    let mPostId = this.getPostId(nodeId, channelId, postId);

    this.postMap[mPostId] = {
      nodeId     : nodeId,
      channel_id : channelId,
      id         : postId,
      content    : content,
      comments   : comments,
      likes      : likes,
      created_at : createdAt*1000,
      updated_at  : updatedAt,
      post_status : status
    }

    if (likeMap[mPostId] != undefined){
      likeMap[mPostId] = {
        nodeId    : nodeId,
        channelId : channelId,
        postId    : postId,
        commentId : 0
      };
      this.storeService.set(PersistenceKey.likeMap,likeMap);
    }

    this.storeService.set(PersistenceKey.postMap, this.postMap);
    eventBus.publish(PublishType.editPostFinish);
    eventBus.publish(PublishType.editPostSuccess);
  }

  handleNewCommentUpdate(nodeId: string, params: any){
    let channelId = params.channel_id;
    let postId = params.post_id;
    let commentId = params.id;
    let status = params.status || FeedsData.PostCommentStatus.available;
    let commentById = params.comment_id || 0;
    let userName = params.user_name;
    let contentBin = params.content;
    let likes = params.likes;
    let createdAt = params.created_at;
    let updatedAt = params.updated_at||createdAt;
    let userDid = params.user_did||"";

    if (updatedAt > createdAt && status == FeedsData.PostCommentStatus.available)
      status = FeedsData.PostCommentStatus.edited

    let content = this.serializeDataService.decodeData(contentBin);

    commentsMap[nodeId][channelId][postId][commentId] = {
      nodeId      : nodeId,
      channel_id  : channelId,
      post_id     : postId,
      id          : commentId,
      comment_id  : commentById | 0,
      user_name   : userName,
      content     : content,
      likes       : likes,
      created_at  : createdAt*1000,
      updated_at  : updatedAt,
      status      : status,
      user_did    : userDid
    }

    this.storeService.set(PersistenceKey.commentsMap, commentsMap);
    eventBus.publish(PublishType.editCommentFinish);
  }

  handleNotification(nodeId: string, method: string, params: any){
    switch(method){
      case FeedsData.MethodType.newPostNotification:
        this.handleNewPostNotification(nodeId, params);
        break;
      case FeedsData.MethodType.newCommentNotification:
        this.handleNewCommentNotification(nodeId,params);
        break;
      case FeedsData.MethodType.newLikesNotification:
        this.handleNewLikesNotification(nodeId,params);
        break;
      case FeedsData.MethodType.newSubscriptionNotification:
        this.handleNewSubscriptionNotification(nodeId, params);
        break;
      case FeedsData.MethodType.feedInfoUpdateNotification:
        this.handleNewFeedInfoUpdateNotification(nodeId,params);
        break;
      case FeedsData.MethodType.postUpdateNotification:
        this.handleNewPostUpdate(nodeId,params);
        break;
      case FeedsData.MethodType.commentUpdateNotification:
        this.handleNewCommentUpdate(nodeId,params);
        break;
    }
  }

  ////handle response
  handleCreateChannelResult(nodeId:string, result: any , request: any, error: any){
    let channelId = result.id;
    let channelName = request.name;
    let channelIntro = request.introduction;
    let owner_name = this.getSignInData().name;
    let owner_did = this.getSignInData().did;
    let avatarBin = request.avatar;

    if (error != null && error != undefined && error.code == -1){
      this.handleError(nodeId, this.translate.instant("CreatenewfeedPage.alreadyExist"));
      return;
    }

    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    let avatar = this.serializeDataService.decodeData(avatarBin);

    let channel:Channels = {
      nodeId: nodeId,
      id: channelId,
      name: channelName,
      introduction: channelIntro,
      owner_name: owner_name,
      owner_did: owner_did,
      subscribers : 0,
      last_update : this.getCurrentTimeNum(),
      last_post: "",
      avatar: avatar,
      isSubscribed:false
    }

    let nodeChannelId = this.getChannelId(nodeId, channelId);

    if (myChannelsMap == null || myChannelsMap == undefined)
      myChannelsMap = {};

    myChannelsMap[nodeChannelId] = {
      nodeId: nodeId,
      channelId: channelId
    };
    this.storeService.set(PersistenceKey.myChannelsMap,myChannelsMap);

    if (channelsMap == null || channelsMap == undefined)
      channelsMap = {};
    channelsMap[nodeChannelId] = channel;
    // this.storeService.set(PersistenceKey.channelsMap, channelsMap);
    this.saveChannelMap();

    eventBus.publish(PublishType.createTopicSuccess);
    eventBus.publish(PublishType.channelsDataUpdate);

    this.subscribeChannel(nodeId,channelId);
  }

  handlePublishPostResult(nodeId: string, result: any, request: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    this.processPublishPostSuccess(nodeId, request.channel_id, result.id, request.content);
  }

  processPublishPostSuccess(nodeId: string, channelId: number, postId: number, contentBin: any){
    let contentStr = this.serializeDataService.decodeData(contentBin);
    let content = this.parseContent(nodeId,channelId,postId,0,contentStr);

    let post:Post = {
      nodeId      : nodeId,
      channel_id  : channelId,
      id          : postId,
      content     : content,
      comments    : 0,
      likes       : 0,
      created_at  : this.getCurrentTimeNum(),
      updated_at  : this.getCurrentTimeNum(),
      post_status : FeedsData.PostCommentStatus.available
    }

    let mPostId = this.getPostId(nodeId, channelId, postId);

    this.postMap[mPostId]=post;

    this.storeService.set(PersistenceKey.postMap, this.postMap);

    eventBus.publish(PublishType.postEventSuccess);
    eventBus.publish(PublishType.postDataUpdate);
    eventBus.publish(PublishType.publishPostSuccess, postId);
    eventBus.publish(PublishType.publishPostFinish);
  }

  handleDeclarePostResult(nodeId: string, result: any, request: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    this.cachePost(nodeId, request.channel_id, result.id, request.content);
  }

  cachePost(nodeId: string, channelId: number, postId: number, contentBin: any){
    let contentStr = this.serializeDataService.decodeData(contentBin);
    let content = this.parseContent(nodeId,channelId,postId,0,contentStr);

    let post:Post = {
      nodeId      : nodeId,
      channel_id  : channelId,
      id          : postId,
      content     : content,
      comments    : 0,
      likes       : 0,
      created_at  : this.getCurrentTimeNum(),
      updated_at  : this.getCurrentTimeNum(),
      post_status : FeedsData.PostCommentStatus.available
    }

    let cacheKey = this.getCachePostKey(nodeId,channelId,postId,0);
    cachedPost[cacheKey] = post;
    // this.storeService.set(cacheKey, post);
    eventBus.publish(PublishType.declarePostSuccess, postId);
  }

  handleNotifyPostResult(nodeId: string, result: any, request: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    let channelId = request.channel_id;
    let postId = request.post_id;

    let cacheKey = this.getCachePostKey(nodeId, channelId, postId, 0);
    let post = cachedPost[cacheKey];
    if (post == null || post == undefined){
      return ;
    }

    let mPostId = this.getPostId(nodeId, channelId, postId);
    this.postMap[mPostId]=post;

    this.storeService.set(PersistenceKey.postMap, this.postMap);
    eventBus.publish(PublishType.notifyPostSuccess);

    this.storeService.remove(cacheKey);
  }

  handlePostCommentResult(nodeId:string, result: any, request: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    eventBus.publish("rpcRequest:success");
    // let id = result.id;
    // let channel_id = request.channel_id;
    // let post_id = request.post_id;
    // let comment_id = request.comment_id;
    // let content = request.content;


    // let comment: Comment = {
    //   channel_id : channel_id,
    //   post_id    : post_id,
    //   id         : id,
    //   user_name  : "me",
    //   comment_id : comment_id,
    //   content    : content,
    //   likes      : 0,
    //   created_at : this.getCurrentTimeNum()
    // }

    // if (commentsMap == null || commentsMap == undefined)
    //   commentsMap = {}
    // if (commentsMap[channel_id] == null || commentsMap[channel_id] == undefined)
    //   commentsMap[channel_id] = {}
    // if (commentsMap[channel_id][post_id] == null || commentsMap[channel_id][post_id] == undefined)
    //   commentsMap[channel_id][post_id] = {}

    // commentsMap[channel_id][post_id][id] = comment;

    // let mPostId = this.getPostId(nodeId, channel_id, post_id);
    // postMap[mPostId].comments = postMap[mPostId].comments+1;

    // this.storeService.set(PersistenceKey.postMap,postMap);
    // eventBus.publish(PublishType.postDataUpdate);

    // this.storeService.set(PersistenceKey.commentsMap, commentsMap);
    // eventBus.publish(PublishType.commentDataUpdate);

    // eventBus.publish(PublishType.updataComment,nodeId,channel_id,post_id,postMap[mPostId].comments);
  }

  handlePostLikeResult(nodeId:string, request: any, error: any){
    let channel_id: number = request.channel_id;
    let post_id: number = request.post_id;
    let comment_id: number = request.comment_id;

    let mPostId = this.getPostId(nodeId, channel_id, post_id);

    if (error != null && error != undefined && error.code == -4){
      if (comment_id == 0){
        likeMap[mPostId] = {
          nodeId    : nodeId,
          channelId : channel_id,
          postId    : post_id,
          commentId : 0
        };
        this.storeService.set(PersistenceKey.likeMap, likeMap);
        eventBus.publish(PublishType.postDataUpdate);

      }else{
        let commentKey = this.getLikeCommentId(nodeId, channel_id, post_id, comment_id);
        likeCommentMap[commentKey] = {
          nodeId     : nodeId,
          channel_id : channel_id,
          post_id    : post_id,
          id         : comment_id,
        }
        this.storeService.set(PersistenceKey.likeCommentMap, likeCommentMap);
        eventBus.publish(PublishType.commentDataUpdate)

      }
      return ;
    }

    if (error != null && error != undefined && error.code != undefined){
      this.doPostLikeError(nodeId, channel_id, post_id, comment_id);
      this.handleError(nodeId, error);
      return;
    }

    if (comment_id == 0){
      this.storeService.set(PersistenceKey.postMap,this.postMap);
      this.storeService.set(PersistenceKey.likeMap, likeMap);
    }else {
      this.storeService.set(PersistenceKey.commentsMap, commentsMap);
      this.storeService.set(PersistenceKey.likeCommentMap, likeCommentMap);
    }

  }

  handlePostUnLikeResult(nodeId:string, request: any, error: any){
    let channel_id: number = request.channel_id;
    let post_id: number = request.post_id;
    let comment_id: number = request.comment_id;

    let mPostId = this.getPostId(nodeId, channel_id, post_id);
    if (error != null && error != undefined && error.code == -4){
      if(comment_id == 0){
        // likeMap[mPostId] = undefined;
        delete likeMap[mPostId];
        this.storeService.set(PersistenceKey.likeMap, likeMap);

        eventBus.publish(PublishType.postDataUpdate);
      }else{
        let commentKey = this.getLikeCommentId(nodeId, channel_id, post_id, comment_id);
        likeCommentMap[commentKey] = undefined;
        this.storeService.set(PersistenceKey.likeCommentMap,likeCommentMap);
        eventBus.publish(PublishType.commentDataUpdate);
      }

      return ;
    }

    if (error != null && error != undefined && error.code != undefined){
      this.doPostUnLikeError(nodeId,channel_id, post_id, comment_id);
      this.handleError(nodeId, error);
      return;
    }

    if (comment_id == 0){
      this.storeService.set(PersistenceKey.postMap,this.postMap);
      this.storeService.set(PersistenceKey.likeMap, likeMap);
    }else {
      this.storeService.set(PersistenceKey.commentsMap, commentsMap);
      this.storeService.set(PersistenceKey.likeCommentMap,likeCommentMap);
    }
  }

  handleGetMyChannelsResult(nodeId: string, responseResult: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    let result = responseResult.channels;
    for (let index = 0; index < result.length; index++) {
      let id: number = result[index].id;
      let name: string = result[index].name;
      let introduction: string = result[index].introduction;
      let subscribers: number = result[index].subscribers;
      let avatarBin: any = result[index].avatar;

      let avatar = this.serializeDataService.decodeData(avatarBin);

      let nodeChannelId = this.getChannelId(nodeId, id) ;

      if (myChannelsMap == null || myChannelsMap == undefined)
        myChannelsMap = {};

      myChannelsMap[nodeChannelId] = {
        nodeId: nodeId,
        channelId: id
      }

      if (channelsMap == null || channelsMap == undefined)
        channelsMap = {};

      if (channelsMap[nodeChannelId] == undefined){
        channelsMap[nodeChannelId] = {
          nodeId: nodeId,
          id: id,
          name: name,
          introduction: introduction,
          owner_name: this.getSignInData().name,
          owner_did: this.getSignInData().did,
          subscribers : subscribers,
          last_update : this.getCurrentTimeNum(),
          last_post:"",
          avatar: avatar,
          isSubscribed:false
        }
      }
    }

    this.storeService.set(PersistenceKey.myChannelsMap, myChannelsMap);
    eventBus.publish(PublishType.myChannelsDataUpdate);
  }

  handleGetMyChannelsMetaDataResult(nodeId: string, result: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    for (let index = 0; index < result.length; index++) {

      let id: number = result[index].id;
      let subscribers: number = result[index];

      let nodeChannelId = this.getChannelId(nodeId, id);

      channelsMap[nodeChannelId].subscribers = subscribers;
    }
    this.storeService.set(PersistenceKey.myChannelsMap, myChannelsMap);
    eventBus.publish(PublishType.myChannelsDataUpdate);
  }

  handleGetChannelsResult(nodeId: string, responseResult: any , request: any, error: any){
    let result = responseResult.channels;

    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    for (let index = 0; index < result.length; index++) {
      let id = result[index].id;

      let nodeChannelId = this.getChannelId(nodeId, id);

      if (channelsMap == null || channelsMap == undefined)
        channelsMap = {};


      let avatarBin = result[index].avatar;
      let avatar = this.serializeDataService.decodeData(avatarBin);
      let update = result[index].last_update;
      if (channelsMap[nodeChannelId] == undefined){
        channelsMap[nodeChannelId] = {
          nodeId      : nodeId,
          id          : id,
          name        : result[index].name,
          introduction: result[index].introduction,
          owner_name  : result[index].owner_name,
          owner_did   : result[index].owner_did,
          subscribers : result[index].subscribers,
          last_update : update*1000,
          last_post   : "",
          avatar      : avatar,
          isSubscribed:false
        }
      }else{
        channelsMap[nodeChannelId].name = result[index].name;
        channelsMap[nodeChannelId].avatar = avatar;

        channelsMap[nodeChannelId].introduction = result[index].introduction;
        channelsMap[nodeChannelId].owner_name = result[index].owner_name;
        channelsMap[nodeChannelId].owner_did = result[index].owner_did;
        channelsMap[nodeChannelId].subscribers = result[index].subscribers;
        channelsMap[nodeChannelId].last_update = result[index].last_update*1000;
      }

      this.updateLastFeedUpdate(nodeId, update);
    }
    // this.storeService.set(PersistenceKey.channelsMap, channelsMap);
    this.saveChannelMap();
    this.refreshLocalChannels();
  }

  handleGetChannelDetailResult(nodeId: string, result: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    let id = result.id;
    let name = result.name ;
    let introduction = result.introduction;
    let owner_name = result.owner_name;
    let owner_did = result.owner_did;
    let subscribers = result.subscribers;
    let last_update = result.last_update;

    let avatarBin = result.avatar;
    let avatar = this.serializeDataService.decodeData(avatarBin);

    let nodeChannelId = this.getChannelId(nodeId, id);
    if(channelsMap == null || channelsMap == undefined)
      channelsMap = {}
    channelsMap[nodeChannelId].avatar = avatar;
    channelsMap[nodeChannelId].introduction = introduction;
    channelsMap[nodeChannelId].last_update = last_update;
    channelsMap[nodeChannelId].name = name;
    channelsMap[nodeChannelId].owner_name = owner_name;
    channelsMap[nodeChannelId].owner_did = owner_did;
    channelsMap[nodeChannelId].subscribers = subscribers;

    this.saveChannelMap();
    // this.storeService.set(PersistenceKey.channelsMap, channelsMap);
  }

  handleGetSubscribedChannelsResult(nodeId: string, responseResult: any, request: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    if (responseResult == "") {
      return ;
    }

    let result = responseResult.channels;
    for (let index = 0; index < result.length; index++) {
      let channelId = result[index].id;
      let name = result[index].name;
      let introduction = result[index].introduction;
      let owner_name = result[index].owner_name;
      let owner_did = result[index].owner_did;
      let subscribers = result[index].subscribers;
      let last_update = result[index].last_update;
      let avatarBin = result[index].avatar;

      let avatar = this.serializeDataService.decodeData(avatarBin);

      if (subscribedChannelsMap == null|| subscribedChannelsMap == undefined)
        subscribedChannelsMap = {};

      let nodeChannelId = this.getChannelId(nodeId, channelId);
      if (subscribedChannelsMap[nodeChannelId] == undefined){
        subscribedChannelsMap[nodeChannelId] = {
          nodeId: nodeId,
          id: channelId,
          name: name,
          introduction: introduction,
          owner_name: owner_name,
          owner_did: owner_did,
          subscribers : subscribers,
          last_update : last_update*1000,
          last_post:"",
          avatar: avatar,
          isSubscribed:true
        }
        // channelsMap
      }else {
        subscribedChannelsMap[nodeChannelId].nodeId = nodeId;
        subscribedChannelsMap[nodeChannelId].id = channelId;
        subscribedChannelsMap[nodeChannelId].name = name;
        subscribedChannelsMap[nodeChannelId].introduction = introduction;
        subscribedChannelsMap[nodeChannelId].owner_name = owner_name;
        subscribedChannelsMap[nodeChannelId].owner_did = owner_did;
        subscribedChannelsMap[nodeChannelId].subscribers = subscribers;
        subscribedChannelsMap[nodeChannelId].last_update = last_update*1000;
        subscribedChannelsMap[nodeChannelId].avatar = avatar;
      }

      if (channelsMap[nodeChannelId] == undefined){
        channelsMap[nodeChannelId] = {
          nodeId: nodeId,
          id: channelId,
          name: name,
          introduction: introduction,
          owner_name: owner_name,
          owner_did: owner_did,
          subscribers : subscribers,
          last_update : last_update*1000,
          last_post:"",
          avatar: avatar,
          isSubscribed:true
        }
      }else{
        channelsMap[nodeChannelId].isSubscribed = true;
      }
      this.updatePostWithTime(nodeId, channelId, 0);
    }

    this.storeService.set(PersistenceKey.subscribedChannelsMap,subscribedChannelsMap);

    let list: Channels[] = [];
    let keys: string[] = Object.keys(subscribedChannelsMap);
    for (const index in keys) {
      if (subscribedChannelsMap[keys[index]] == undefined)
        continue;
        list.push(subscribedChannelsMap[keys[index]]);
    }
    list.sort((a, b) => Number(b.last_update) - Number(a.last_update));

    if (request.upper_bound == null){
      this.refreshLocalSubscribedChannels();
    }else{
      this.loadMoreLocalSubscribedChannels();
    }
  }

  handleGetPostsResult(nodeId: string, responseResult: any, request: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    let result = responseResult.posts;
    let requestAction: number = request.memo.action || RequestAction.defaultAction;

    for (let index = 0; index < result.length; index++) {
      let channel_id = result[index].channel_id;
      let id         = result[index].id;
      let contentBin    = result[index].content;
      let comments   = result[index].comments;
      let likes      = result[index].likes;
      let createAt = result[index].created_at||0;
      let contentStr = this.serializeDataService.decodeData(contentBin);
      let content = this.parseContent(nodeId,channel_id,id,0,contentStr);

      let updatedAt = result[index].updated_at||createAt;
      let status = result[index].status||FeedsData.PostCommentStatus.available;

      if (updatedAt > createAt && status == FeedsData.PostCommentStatus.available)
        status = FeedsData.PostCommentStatus.edited


      let mPostId = this.getPostId(nodeId, channel_id, id);

      if(this.postMap[mPostId] == undefined){
        let nodeChannelId = this.getChannelId(nodeId, channel_id);
        if (!this.checkChannelIsMine(nodeId, channel_id))
          unreadMap[nodeChannelId] = unreadMap[nodeChannelId]+1;
      }

      this.postMap[mPostId] = {
        nodeId     : nodeId,
        channel_id : channel_id,
        id         : id,
        content    : content,
        comments   : comments,
        likes      : likes,
        created_at : createAt*1000,
        updated_at  : updatedAt,
        post_status : status
      }

      if (likeMap[mPostId] != undefined){
        likeMap[mPostId] = {
          nodeId    : nodeId,
          channelId : channel_id,
          postId    : id,
          commentId : 0
        };
        this.storeService.set(PersistenceKey.likeMap,likeMap);
      }

      if (requestAction == RequestAction.defaultAction){
        let key = this.getChannelId(nodeId, channel_id);
        this.updateLastPostUpdate(key,nodeId, channel_id, updatedAt);
      }
    }

    if (requestAction == RequestAction.refreshPostDetail){
      this.storeService.set(PersistenceKey.postMap, this.postMap);
      eventBus.publish(PublishType.refreshPostDetail);
      return ;
    }

    if (requestAction == RequestAction.defaultAction){
      this.storeService.set(PersistenceKey.postMap, this.postMap);
      eventBus.publish(PublishType.postDataUpdate);
      return ;
    }
  }

  async handleGetCommentsResult(nodeId: string, responseResult: any, requestParams: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    let result = responseResult.comments;
    for (let index = 0; index < result.length; index++) {
      let channelId       = result[index].channel_id;
      let postId          = result[index].post_id;
      let commentId       = result[index].id;
      let referCommentId  = result[index].comment_id;
      let contentBin      = result[index].content;
      let likes           = result[index].likes;
      let createdAt       = result[index].created_at;
      let userName        = result[index].user_name;
      let updatedAt       = result[index].updated_at;
      let status          = result[index].status;
      let userDid         = result[index].user_did;

      await this.processNewComment(nodeId,channelId,postId,commentId,referCommentId,
        userName,likes,createdAt,updatedAt,status,userDid,contentBin);

      if(this.checkChannelIsMine(nodeId,channelId)){
        let lastCommentUpdateKey = this.getPostId(nodeId, 0, 0);
        this.updateLastCommentUpdate(lastCommentUpdateKey, nodeId, channelId, postId, updatedAt);
      }
    }
    let reqParams = requestParams.requestParams;
    reqParams.channel_id;

    eventBus. getCommentFinish
    eventBus.publish(PublishType.getCommentFinish,nodeId,reqParams.channel_id,reqParams.post_id);
  }

  handleGetStatisticsResult(nodeId: string, result: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    let userDID = result.did || "";
    let connectingClients = result.connecting_clients || 0;
    let totalClients = result.total_clients || 0;

    let serverStatistics: ServerStatistics = {
      did               : userDID,
      connecting_clients: connectingClients,
      total_clients     : totalClients
    }

    if (serverStatisticsMap == null || serverStatisticsMap == undefined)
      serverStatisticsMap = {};

    serverStatisticsMap[nodeId] = serverStatistics;

    this.storeService.set(PersistenceKey.serverStatisticsMap, serverStatisticsMap);
    eventBus.publish(PublishType.serverStatisticsChanged,serverStatisticsMap);
  }

  handleSubscribeChannelResult(nodeId: string, request: any, error: any){
    let nodeChannelId = this.getChannelId(nodeId, request.id);
    if (error != null && error != undefined && error.code == -4){

      if (channelsMap == null || channelsMap == undefined ||
          channelsMap[nodeChannelId] == null || channelsMap[nodeChannelId] == undefined)
          return ;

      channelsMap[nodeChannelId].isSubscribed = true;
      // this.storeService.set(PersistenceKey.channelsMap,channelsMap);
      this.saveChannelMap();
      eventBus.publish(PublishType.subscribeFinish, nodeId,request.id, channelsMap[nodeChannelId].name);

      return;
    }

    if (error != null && error != undefined && error.code != undefined){
      this.doSubscribeChannelError(nodeId, request.id);
      this.handleError(nodeId, error);
      return;
    }

    // channelsMap[nodeChannelId].isSubscribed = true;

    this.saveChannelMap();
    // this.storeService.set(PersistenceKey.channelsMap,channelsMap);
    // eventBus.publish(PublishType.subscribeFinish, nodeId,request.id, channelsMap[nodeChannelId].name);

    this.refreshSubscribedChannels();

    this.updatePostWithTime(nodeId,request.id, 0);

    this.native.toast(this.formatInfoService.formatFollowSuccessMsg(this.getFeedNameById(nodeId, request.id)));
  }

  handleUnsubscribeChannelResult(nodeId:string, request: any, error: any){
    let nodeChannelId = this.getChannelId(nodeId, request.id);
    if (error != null && error != undefined && error.code == -4){

      channelsMap[nodeChannelId].isSubscribed = false;
      // this.storeService.set(PersistenceKey.channelsMap,channelsMap);
      this.saveChannelMap();

      subscribedChannelsMap[nodeChannelId] = undefined;
      this.storeService.set(PersistenceKey.subscribedChannelsMap,subscribedChannelsMap);

      eventBus.publish(PublishType.unsubscribeFinish, nodeId,request.id, channelsMap[nodeChannelId].name);
      return;
    }

    if (error != null && error != undefined && error.code != undefined){
      this.doUnsubscribeChannelError(nodeId, request.id);
      this.handleError(nodeId, error);
      return;
    }

    subscribedChannelsMap[nodeChannelId] = undefined;

    // this.storeService.set(PersistenceKey.channelsMap,channelsMap);
    this.saveChannelMap();
    this.storeService.set(PersistenceKey.subscribedChannelsMap,subscribedChannelsMap);

    this.refreshLocalSubscribedChannels();

    this.deletePostFromChannel(nodeId, request.id);

    this.native.toast(this.formatInfoService.formatUnFollowSuccessMsg(this.getFeedNameById(nodeId, request.id)));
    eventBus.publish("feeds:unfollowFeedsFinish");
  }

  handleEditFeedInfo(nodeId: string, request: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    let channelId = request.id||0;
    let name = request.name||"";
    let desc = request.introduction||"";
    let avatarBin = request.avatar||""

    let avatar = this.serializeDataService.decodeData(avatarBin)||"";

    let nodeChannelId = this.getChannelId(nodeId, channelId)|| "";

    if (name != "")
      channelsMap[nodeChannelId].name = name;
    if (desc != "")
      channelsMap[nodeChannelId].introduction = desc;
    if (avatarBin != "")
      channelsMap[nodeChannelId].avatar = avatar;

    this.storeService.set(PersistenceKey.channelsMap,channelsMap);
    eventBus.publish(PublishType.editFeedInfoFinish, nodeChannelId);
  }

  handleQueryChannelCreationPermissionResult(nodeId: string, result: any){
    if (creationPermissionMap == null || creationPermissionMap == undefined)
      creationPermissionMap = {};
    creationPermissionMap[nodeId]=result.authorized;
  }

  handleEnableNotificationResult(nodeId: string, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }
  }

  doSubscribeChannelFinish(nodeId: string, channelId: number){
    let nodeChannelId = this.getChannelId(nodeId, channelId);

    channelsMap[nodeChannelId].isSubscribed = true;

    let subscribeNum = channelsMap[nodeChannelId].subscribers;
    channelsMap[nodeChannelId].subscribers = subscribeNum + 1;

    eventBus.publish(PublishType.subscribeFinish, nodeId, channelId, channelsMap[nodeChannelId].name);
  }

  doSubscribeChannelError(nodeId: string, channelId: number){
    let nodeChannelId = this.getChannelId(nodeId, channelId);
    channelsMap[nodeChannelId].isSubscribed = false;

    let subscribeNum = channelsMap[nodeChannelId].subscribers;
    if (subscribeNum > 0 )
      channelsMap[nodeChannelId].subscribers = subscribeNum - 1;

    eventBus.publish(PublishType.subscribeFinish, nodeId,channelId, channelsMap[nodeChannelId].name);
  }

  doUnsubscribeChannelFinish(nodeId: string, channelId: number){
    let nodeChannelId = this.getChannelId(nodeId, channelId);
    channelsMap[nodeChannelId].isSubscribed = false;
    let subscribeNum = channelsMap[nodeChannelId].subscribers;
    if (subscribeNum > 0 )
      channelsMap[nodeChannelId].subscribers = subscribeNum - 1;

    eventBus.publish(PublishType.unsubscribeFinish, nodeId, channelId, channelsMap[nodeChannelId].name);
  }

  doUnsubscribeChannelError(nodeId: string, channelId: number){
    let nodeChannelId = this.getChannelId(nodeId, channelId);
    channelsMap[nodeChannelId].isSubscribed = true;
    let subscribeNum = channelsMap[nodeChannelId].subscribers;
    channelsMap[nodeChannelId].subscribers = subscribeNum + 1;
    eventBus.publish(PublishType.unsubscribeFinish, nodeId, channelId, channelsMap[nodeChannelId].name);
  }

  doPostLikeFinish(nodeId: string, channel_id: number, post_id: number, comment_id: number){
    let mPostId = this.getPostId(nodeId, channel_id, post_id);
    if (comment_id == 0){
      likeMap[mPostId] = {
        nodeId    : nodeId,
        channelId : channel_id,
        postId    : post_id,
        commentId : 0
      };

      let likeNum = this.postMap[mPostId].likes;
      this.postMap[mPostId].likes = likeNum + 1;


      eventBus.publish(PublishType.updateLikeList, this.getLikeList());
      eventBus.publish(PublishType.postDataUpdate);

    }else {
      let commentKey = this.getLikeCommentId(nodeId, channel_id, post_id, comment_id);
      likeCommentMap[commentKey] = {
        nodeId     : nodeId,
        channel_id : channel_id,
        post_id    : post_id,
        id         : comment_id,
      }

      let likeNum = commentsMap[nodeId][channel_id][post_id][comment_id].likes;
      commentsMap[nodeId][channel_id][post_id][comment_id].likes = likeNum + 1;

      eventBus.publish(PublishType.commentDataUpdate)
    }
  }

  doPostLikeError(nodeId: string, channel_id: number, post_id: number, comment_id: number){
    let mPostId = this.getPostId(nodeId, channel_id, post_id);
    if (comment_id == 0){
      likeMap[mPostId] = undefined;

      let likeNum = this.postMap[mPostId].likes;
      if (likeNum > 0)
        this.postMap[mPostId].likes = likeNum - 1;


      eventBus.publish(PublishType.updateLikeList, this.getLikeList());
      eventBus.publish(PublishType.postDataUpdate);
    }else {
      let commentKey = this.getLikeCommentId(nodeId, channel_id, post_id, comment_id);
      likeCommentMap[commentKey] = undefined;

      let likeNum = commentsMap[nodeId][channel_id][post_id][comment_id].likes;
      if (likeNum>0)
        commentsMap[nodeId][channel_id][post_id][comment_id].likes = likeNum - 1;

      eventBus.publish(PublishType.commentDataUpdate)
    }
  }

  doPostUnLikeFinish(nodeId: string, channel_id: number, post_id: number, comment_id: number){
    let mPostId = this.getPostId(nodeId, channel_id, post_id);

    if (comment_id == 0){
      let likeNum = this.postMap[mPostId].likes;
      if (likeNum > 0)
        this.postMap[mPostId].likes = likeNum - 1;

      likeMap[mPostId] = undefined;

      eventBus.publish(PublishType.updateLikeList, this.getLikeList());
      eventBus.publish(PublishType.postDataUpdate);

    }else {
      let likeNum = commentsMap[nodeId][channel_id][post_id][comment_id].likes;
      if (likeNum>0)
        commentsMap[nodeId][channel_id][post_id][comment_id].likes = likeNum - 1;

      let commentKey = this.getLikeCommentId(nodeId, channel_id, post_id, comment_id);
      likeCommentMap[commentKey] = undefined;

      eventBus.publish(PublishType.commentDataUpdate)

    }
  }

  doPostUnLikeError(nodeId: string, channel_id: number, post_id: number, comment_id: number){
    let mPostId = this.getPostId(nodeId, channel_id, post_id);

    if (comment_id == 0){
      this.postMap[mPostId].likes = this.postMap[mPostId].likes+1;
      likeMap[mPostId] = {
        nodeId    : nodeId,
        channelId : channel_id,
        postId    : post_id,
        commentId : 0
      };
      eventBus.publish(PublishType.updateLikeList, this.getLikeList());
      eventBus.publish(PublishType.postDataUpdate);

    }else {
      commentsMap[nodeId][channel_id][post_id][comment_id].likes = commentsMap[nodeId][channel_id][post_id][comment_id].likes + 1;

      let commentKey = this.getLikeCommentId(nodeId, channel_id, post_id, comment_id);
      likeCommentMap[commentKey] = {
        nodeId     : nodeId,
        channel_id : channel_id,
        post_id    : post_id,
        id         : comment_id,
      }

      eventBus.publish(PublishType.commentDataUpdate)

    }
  }

  ////
  loadMoreChannelsTest(list: Channels[]){
    let num = list.length;
    for (let index = 0; index < 10; index++) {
      if (num <108){
        list.push({
          nodeId:"",
          id: num+index,
          name: String(num+index),
          introduction: "string",
          owner_name: "string",
          owner_did: "string",
          subscribers : 0,
          last_update : num+index,
          last_post:"",
          avatar:null,
          isSubscribed:false
        })
      }
    }
    // list.push()
  }

  saveServer(name: string, owner: string, introduction: string,
    did: string, carrierAddress: string , feedsUrl: string){
    this.carrierService.getIdFromAddress(carrierAddress, (nodeId)=>{
      let server = {
        name              : name,
        owner             : owner,
        introduction      : introduction,
        did               : did,
        carrierAddress    : carrierAddress,
        nodeId            : nodeId,
        feedsUrl          : feedsUrl,
        elaAddress        : "",
        version           : ""
        // status            : ConnState.disconnected
      }

      this.resolveServer(server, null);
    });
  }

  insertFakeData(){

    this.storeService.remove(PersistenceKey.myChannelsMap);
  }

  getChannelFromId(nodeId: string, id: number): Channels{
    if (channelsMap == null || channelsMap == undefined)
      return undefined;

    let nodeChannelId = this.getChannelId(nodeId, id);
    return channelsMap[nodeChannelId];
  }

  getPostFromId(nodeId: string, channelId: number, postId: number):Post{
    if (this.postMap == null || this.postMap == undefined || this.postMap == {})
      return undefined;

    let mPostId = this.getPostId(nodeId, channelId, postId);
    return this.postMap[mPostId];
  }

  getCommentFromId(nodeId: string, channelId: number, postId: number, commentId: number):Comment{
    if (commentsMap == null || commentsMap == undefined ||
        commentsMap[nodeId] == null || commentsMap[nodeId] == undefined ||
        commentsMap[nodeId][channelId] == null || commentsMap[nodeId][channelId] == undefined ||
        commentsMap[nodeId][channelId][postId] == null || commentsMap[nodeId][channelId][postId] == undefined ||
        commentsMap[nodeId][channelId][postId][commentId] == null || commentsMap[nodeId][channelId][postId][commentId] == undefined)
        return undefined;

    return commentsMap[nodeId][channelId][postId][commentId];
  }

  queryServerDID(nodeId:string): string{
    if (serverMap == null ||
      serverMap == undefined ||
      serverMap[nodeId] == undefined)
      return "";

    return serverMap[nodeId].did;
  }

  getCommentList(nodeId: string, channelId: number, postId: number): Comment[]{
    if (commentsMap == null || commentsMap == undefined ||
       commentsMap[nodeId] == null || commentsMap == undefined ||
       commentsMap[nodeId][channelId] == null || commentsMap[nodeId][channelId] == undefined ||
       commentsMap[nodeId][channelId][postId] == null || commentsMap[nodeId][channelId][postId] == undefined){
         return [];
    }


    let list: Comment[] =[];
    let keys: string[] = Object.keys(commentsMap[nodeId][channelId][postId]);
    for (const index in keys) {
      let comment: Comment = commentsMap[nodeId][channelId][postId][keys[index]];
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

  getCommentListFrom(nodeId: string, channelId: number, postId: number){

  }

  getSubscribedChannelNumber(): number{
    let keys: string[] = Object.keys(subscribedChannelsMap);
    let num: number = 0;
    for (const index in keys) {
      if (subscribedChannelsMap[keys[index]] == null || subscribedChannelsMap[keys[index]] == undefined)
        continue;
      num++;
    }

    return num;
  }

  getOwnChannelNumber(): number{
    let keys: string[] = Object.keys(myChannelsMap);
    let num: number = 0;
    for (const index in keys) {
      if (myChannelsMap[keys[index]] == null || myChannelsMap[keys[index]] == undefined)
        continue;
      num++;
    }

    return num;
  }

  getPostList(): Post[]{
    let list: Post[] = [];
    this.postMap = this.postMap || {};
    let keys: string[] = Object.keys(this.postMap) || [];
    // localPostList = [];
    for (let index in keys) {
      if (this.postMap[keys[index]] == null || this.postMap[keys[index]] == undefined)
        continue;

      let nodeChannelId = this.getChannelId(this.postMap[keys[index]].nodeId, this.postMap[keys[index]].channel_id);
      if (subscribedChannelsMap[nodeChannelId] != null || subscribedChannelsMap[nodeChannelId] != undefined)
        list.push(this.postMap[keys[index]]);
    }

    list.sort((a, b) => Number(b.created_at) - Number(a.created_at));
    return list;
  }

  getChannelId(nodeId: string, channelId: number){
    return this.getKey(nodeId, channelId, 0, 0);
  }

  getPostId(nodeId: string, channelId: number, postId: number): string{
    return this.getKey(nodeId, channelId, postId, 0);
  }

  getCommentId(nodeId: string, channelId: number, postId: number, commentId: number): string{
    return this.getKey(nodeId, channelId, postId, commentId);
  }

  getLikeCommentId(nodeId: string, channelId: number, postId: number, commentId: number): string{
    return this.getKey(nodeId, channelId, postId, commentId);
  }

  getPostListFromChannel(nodeId: string, channelId: number){
    let list: Post[] = [];
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

  getLikeList(): Post[]{
    let list: Post[] = [];

    let keys: string[] = [];
    if (likeMap != null && likeMap != undefined)
      keys = Object.keys(likeMap);

    for (const index in keys) {
      let like = likeMap[keys[index]];

      if (like == null || like == undefined)
        continue;

      let post = this.getPostFromId(like.nodeId,like.channelId,like.postId);
      if (post == undefined)
        continue;

      list.push(post);
    }

    list.sort((a, b) => Number(b.created_at) - Number(a.created_at));
    return list;
  }

  updatePostWithTime(nodeId: string, channelId:number, lastPostTime: number){
    this.getPost(nodeId,channelId,Communication.field.last_update,0,lastPostTime,0,"");
  }

  updateFeedsWithTime(nodeId: string, lastUpdateTime: number){
    this.getChannels(nodeId,Communication.field.last_update, 0, lastUpdateTime,0);
  }

  updateCommentsWithTime(nodeId: string, channelId: number, postId: number, lastUpdateTime: number){
    this.getComments(nodeId, channelId, postId , Communication.field.last_update, 0, lastUpdateTime, 0, false);
  }

  updatePost(nodeId: string, channelId:number){
    let nodeChannelId = this.getChannelId(nodeId, channelId);
    let mlastPostUpdateMap = lastPostUpdateMap || "";
    let postUpdate = mlastPostUpdateMap[nodeChannelId]||"";
    let lastPostTime = postUpdate["time"] || 0;
    this.updatePostWithTime(nodeId, channelId, lastPostTime);
  }

  updateFeed(nodeId: string, refreshAll: boolean){
    let lastFeedTime: number = 0;
    if (!refreshAll){
      let mLastFeedUpdateMap = this.lastFeedUpdateMap || "";
      let update = mLastFeedUpdateMap[nodeId] || "";
      lastFeedTime = update["time"] || 0;
    }
    this.updateFeedsWithTime(nodeId,lastFeedTime);
  }

  updateComment(nodeId: string, channelId: number, postId: number){
    let ncpId = this.getPostId(nodeId,channelId,postId);
    let mLastCommentUpdateMap = this.lastCommentUpdateMap || "";
    let commentUpdateTime = mLastCommentUpdateMap[ncpId] || "";
    let lastCommentTime = commentUpdateTime["time"] || 0;
    this.updateCommentsWithTime(nodeId, channelId, postId, lastCommentTime);
  }

  getSubscribedChannelsFromNodeId(nodeId: string): Channels[]{
    let keys: string[] = Object.keys(subscribedChannelsMap);
    let list: Channels[] = [];
    for (const index in keys) {
      if (subscribedChannelsMap[keys[index]] == null || subscribedChannelsMap[keys[index]] == undefined)
        continue;
      if (subscribedChannelsMap[keys[index]].nodeId == nodeId)
        list.push(subscribedChannelsMap[keys[index]])
    }

    return list;
  }

  getSubscribedMap(){
    if (subscribedChannelsMap == null || subscribedChannelsMap == undefined)
      subscribedChannelsMap = {};
    return subscribedChannelsMap;
  }

  getChannelsMap(){
    if (channelsMap == null || channelsMap == undefined)
      channelsMap = {};
    return channelsMap;
  }

  deletePostFromChannel(nodeId: string ,channelId: number){
    // let keys: string[] = Object.keys(postMap);
    // for (const index in keys) {
    //   if (postMap[keys[index]] == null || postMap[keys[index]] == undefined)
    //     continue;
    //   if (postMap[keys[index]].nodeId == nodeId && postMap[keys[index]].channel_id == channelId)
    //     postMap[keys[index]] = undefined;
    // }
    // this.storeService.set(PersistenceKey.postMap,postMap);
    // eventBus.publish(PublishType.postDataUpdate);

    // let nodeChannelId = nodeId+channelId;
    // if (lastPostUpdateMap[nodeChannelId] != null && lastPostUpdateMap[nodeChannelId] != undefined){
    //   lastPostUpdateMap[nodeChannelId].time = null
    //   this.storeService.set(PersistenceKey.lastPostUpdateMap,lastPostUpdateMap);
    // }

    eventBus.publish(PublishType.postDataUpdate);
  }

  indexText(text: string, limit: number, indexLength: number): string{
    if (text == undefined)
      return "";
    if (text.length < limit)
      return text;

    let half = indexLength/2 ;
    return text.slice(0,half)+"..."+text.slice(text.length-half+1, text.length);
  }

  parsePostContentText(content: any): string{
    let contentObj = this.native.parseJSON(content) || "";

    if (contentObj.text != undefined)
      return contentObj.text

    if (typeof contentObj != 'string')
      return ""

    return contentObj;
  }

  parsePostContentImg(content: any): string{
    let contentObj = this.native.parseJSON(content) || "";

    if (contentObj.img != undefined)
      return contentObj.img

    if (typeof contentObj != 'string')
      return ""

    return contentObj;
  }

  publishDid(payload: string, onSuccess?: (ret: any)=>void, onError?: (err:any)=>void) {
    let params = {
        didrequest: JSON.parse(payload)
    }
    let requestStr = JSON.stringify(params);
    let request =  JSON.parse(requestStr);
    appManager.sendIntent("https://wallet.elastos.net/didtransaction", request, {}, onSuccess, onError);
  }

  setSigninTimeout(nodeId: string){
    this.isLogging[nodeId] = true;
    clearTimeout(this.signinChallengeTimeout);

    this.signinChallengeTimeout = setTimeout(()=>{
      this.clearSigninTimeout(nodeId);
    },30000);
  }

  clearSigninTimeout(nodeId: string){
    this.isLogging[nodeId] = false;
    clearTimeout(this.signinChallengeTimeout);
  }

  setDeclareOwnerTimeout(){
    this.isDeclearing = true;
    clearTimeout(this.declareOwnerTimeout);

    this.declareOwnerTimeout = setTimeout(()=>{
      this.clearDeclareOwnerTimeout();
    },30000);
  }

  clearDeclareOwnerTimeout(){
    this.isDeclearing = false;
    clearTimeout(this.declareOwnerTimeout);
    this.cleanDeclareOwner();
  }

  signinChallengeRequest(nodeId: string , requiredCredential: boolean){
    if(this.isLogging[nodeId] == undefined)
      this.isLogging[nodeId] = false;
    if (this.isLogging[nodeId])
      return ;
    this.setSigninTimeout(nodeId);

    this.native.toast(this.formatInfoService.formatSigninMsg(this.getServerNameByNodeId(nodeId)));
    if (this.getServerVersionCodeByNodeId(nodeId) < newAuthVersion){
      this.connectionService.signinChallengeRequest(this.getServerNameByNodeId(nodeId), nodeId, requiredCredential, this.getSignInData().did);
      return;
    }

    this.standardSignIn(nodeId);
  }

  signinConfirmRequest(nodeId: string, nonce: string, realm: string, requiredCredential: boolean){
    didSessionManager.authenticate(nonce, realm).then((presentation)=>{
      this.connectionService.signinConfirmRequest(this.getServerNameByNodeId(nodeId), nodeId, nonce, realm, requiredCredential,presentation,this.getLocalCredential());
    }).catch((err)=>{
      this.logUtils.loge("authenticate error:"+JSON.stringify(err),TAG);
    });
  }

  handleSigninChallenge(nodeId:string, result: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.clearSigninTimeout(nodeId);
      this.handleError(nodeId, error);
      return;
    }

    let requiredCredential = result.credential_required;
    let jws = result.jws;

    let credential = JSON.parse(result.credential);
    this.doParseJWS(nodeId, jws, credential, requiredCredential,()=>{},()=>{});
  }

  handleSigninConfirm(nodeId:string, result: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.clearSigninTimeout(nodeId);
      this.handleError(nodeId, error);
      return;
    }

    if (accessTokenMap == null || accessTokenMap == undefined)
      accessTokenMap = {};

    accessTokenMap[nodeId] = {
      token: result.access_token ,
      isExpire: false
    };

    this.storeService.set(PersistenceKey.accessTokenMap, accessTokenMap);

    this.prepare(nodeId);
    this.restoreData(nodeId);

    eventBus.publish("feeds:login_finish", nodeId);
    this.native.toast(this.formatInfoService.formatSigninSuccessMsg(this.getServerNameByNodeId(nodeId)));
    this.clearSigninTimeout(nodeId);
  }

  startDeclareOwner(nodeId: string, carrierAddress: string, nonce: string){
    this.isDeclareFinish = false;
    this.declareOwnerInterval = setInterval(() => {
      if (this.isDeclareFinish){
        clearInterval(this.declareOwnerInterval);
      }

      if(!this.connectionService.checkServerConnection(nodeId))
       return;

      this.declareOwnerRequest(nodeId, carrierAddress, nonce);
    }, 5000);
  }

  cleanDeclareOwner(){
    this.isDeclareFinish = true;
    clearInterval(this.declareOwnerInterval);
  }

  declareOwnerRequest(nodeId: string, carrierAddress: string, nonce: string){
    if (this.isDeclearing)
      return;
    this.setDeclareOwnerTimeout();
    // isBindServer = true;
    this.connectionService.declareOwnerRequest(this.getServerNameByNodeId(nodeId), nodeId, nonce, this.getSignInData().did);
    cacheBindingAddress = carrierAddress;
  }


  importDidRequest(nodeId: string, mnemonic: string, passphrase: string, index: number){
    this.connectionService.importDidRequest(this.getServerNameByNodeId(nodeId), nodeId, mnemonic, passphrase, index);
  }

  createDidRequest(nodeId: string){
    this.connectionService.createDidRequest(this.getServerNameByNodeId(nodeId), nodeId);
  }

  issueCredentialRequest(nodeId: string, credential: string){
    this.connectionService.issueCredentialRequest(this.getServerNameByNodeId(nodeId), nodeId, credential);
  }

  doParseJWS(nodeId: string, jws: string, credential: any, requiredCredential: boolean, onSuccess:()=>void, onError: () => void){
    this.parseJWS(false,jws,
      (res)=>{
        serverMap[nodeId].name = credential.credentialSubject.name;
        serverMap[nodeId].introduction = credential.credentialSubject.description;
        serverMap[nodeId].elaAddress = credential.credentialSubject.elaAddress;
        this.storeService.set(PersistenceKey.serverMap, serverMap);

        let payloadStr = JSON.stringify(res.payload);
        let payload = JSON.parse(payloadStr);
        let nonce = payload.nonce;
        let realm = payload.realm;
        this.signinConfirmRequest(nodeId, nonce, realm , requiredCredential);
        onSuccess();
      },
      (err)=>{
        this.logUtils.loge("parseJWS error:"+JSON.stringify(err),TAG);
        onError();
      }
      );
  }
  //eyJ0eXAiOiJKV1QiLCJjdHkiOiJqc29uIiwibGlicmFyeSI6IkVsYXN0b3MgRElEIiwidmVyc2lvbiI6IjEuMCIsImFsZyI6Im5vbmUifQ.eyJzdWIiOiJKd3RUZXN0IiwianRpIjoiMCIsImF1ZCI6IlRlc3QgY2FzZXMiLCJpYXQiOjE1OTA4NTEwMzQsImV4cCI6MTU5ODc5OTgzNCwibmJmIjoxNTg4MjU5MDM0LCJmb28iOiJiYXIiLCJpc3MiOiJkaWQ6ZWxhc3RvczppV0ZBVVloVGEzNWMxZlBlM2lDSnZpaFpIeDZxdXVtbnltIn0.
  parseJWS(verifySignature: boolean, jwtToken: string , onSuccess: (result: DIDPlugin.ParseJWTResult)=>void, onError: (err: string)=>void){
    didManager.parseJWT(verifySignature, jwtToken).then((result)=>{
      if (result){
        onSuccess(result);
      }else{
        this.logUtils.loge("parseJWT error: result = "+JSON.stringify(result),TAG);
      }

    }).catch((err)=>{
      onError(err);
      this.logUtils.loge("parseJWT error: "+JSON.stringify(err),TAG);
    });
  }

  handleDeclareOwnerResponse(nodeId: string, result: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      // this.isDeclareFinish = true;
      this.clearDeclareOwnerTimeout();
      this.handleError(nodeId, error);
      return;
    }

    let phase = result.phase;
    let did = "";
    let payload = "";

    if (phase == "did_imported"){
      did = result.did;
      payload = result.transaction_payload;

      this.resolveServerDid(did, nodeId, payload,()=>{},()=>{});
    }
    // this.isDeclareFinish = true;
    this.clearDeclareOwnerTimeout();
    eventBus.publish("feeds:owner_declared", nodeId, phase, did, payload);
  }

  // {
  //   "jsonrpc": "2.0",
  //   "id": 1,
  //   "result": {
  //     "did": "did:elastos:imWLKpc7re166G9oASY5tg2dXD4g9PkTV2",
  //     "transaction_payload": "{\"header\":{\"specification\":\"elastos/did/1.0\",\"operation\":\"create\"},\"payload\":\"eyJpZCI6ImRpZDplbGFzdG9zOmltV0xLcGM3cmUxNjZHOW9BU1k1dGcyZFhENGc5UGtUVjIiLCJwdWJsaWNLZXkiOlt7ImlkIjoiI3ByaW1hcnkiLCJwdWJsaWNLZXlCYXNlNTgiOiJmbVR1WUg5M3FRdkFxMjdreHJpd2h4NERQQjdnelFWWm5SaVIxRHpyb0NaZCJ9XSwiYXV0aGVudGljYXRpb24iOlsiI3ByaW1hcnkiXSwiZXhwaXJlcyI6IjIwMjUtMDYtMDhUMDE6MDI6MDRaIiwicHJvb2YiOnsiY3JlYXRlZCI6IjIwMjAtMDYtMDhUMDk6MDI6MDRaIiwic2lnbmF0dXJlVmFsdWUiOiI2bnNWNW52VThjZGs2RmhjQTZzb09aQ1lLa0dSV0hWWDR2cjRIQkZQU1pJUkNteFQ2SDN6ekF5ZG56VkNIRW5WekZrNERhbEk2d2w5anNVWFlGSjFLdyJ9fQ\",\"proof\":{\"verificationMethod\":\"#primary\",\"signature\":\"cAW_4csdqbKjoavJ8lNeDm9gKVPceDFiUfZW-rXvvqkcIoBkuhkfPkVP-AR07OXJh6ow3_8fEyDfOQJ-2ssOmw\"}}"
  //   }
  // }
  handleImportDIDResponse(nodeId: string, result: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    let did = result.did;
    let transaction_payload = result.transaction_payload;

    this.resolveServerDid(did, nodeId, transaction_payload,()=>{
      eventBus.publish("feeds:did_imported", nodeId, did, transaction_payload);
    },()=>{

    });

  }

  handleImportDID(feedUrl: string, defaultServer: Server, onSuccess: (server: Server)=>void, onError: (err: any)=>void){
    this.resolveDidDocument(feedUrl, defaultServer, onSuccess, onError);
  }

  handleIssueCredentialResponse(nodeId: string, result: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    // if (bindingServerCache !=null && bindingServerCache!= undefined){
    //   let did = bindingServerCache.did||"";
    //   this.httpService.ajaxGet(ApiUrl.get+"?did="+did,false).then((result)=>{
    //     if(result["code"] === 200){
    //       if (result["data"] != undefined){
    //         let name = bindingServerCache.name;
    //         let description = bindingServerCache.introduction;
    //         let feedUrl = bindingServerCache.feedsUrl;
    //         this.updatePublic(did, name, description, feedUrl);
    //       }
    //     }
    //   });
    // }

    this.finishBinding(nodeId);
  }

  handleUpdateCredentialResponse(nodeId: string, result: any, requestParams: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    if (bindingServerCache !=null && bindingServerCache!= undefined){
      let did = bindingServerCache.did||"";
      this.httpService.ajaxGet(ApiUrl.get+"?did="+did,false).then((result)=>{
        if(result["code"] === 200){
          if (result["data"] != undefined){
            let name = bindingServerCache.name;
            let description = bindingServerCache.introduction;
            let feedUrl = bindingServerCache.feedsUrl;
            this.updatePublic(did, name, description, feedUrl);
          }
        }
      });
    }

    eventBus.publish("feeds:updateCredentialFinish");
    this.signinChallengeRequest(nodeId, true);
  }


  handleSetBinaryResponse(nodeId, result, requestParams, error){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    eventBus.publish("feeds:setBinaryFinish", nodeId);
  }

  handleGetBinaryResponse(nodeId, result, requestParams, error){
    if (error != null && error != undefined && error.code != undefined){
      this.translateBinaryError(nodeId, error.code);
      this.handleError(nodeId, error);
      return;
    }
    let key = result.key;
    let contentBin = result.content;

    let value = this.serializeDataService.decodeData(contentBin);
    this.storeService.set(key, value).then(()=>{
        eventBus.publish("feeds:getBinaryFinish", nodeId, key, value);
    });
  }

  handleStandardSignInResponse(nodeId, result, requestParams, error){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    let challenge = result.jwt_challenge;
    this.standardAuth.generateAuthPresentationJWT(challenge).then((standAuthResult)=>{
      this.logUtils.logd("generateAuthPresentationJWT presentation is "+standAuthResult.jwtToken,TAG);
      if (serverMap != null && serverMap != undefined){
        serverMap[nodeId].name = standAuthResult.serverName;
        serverMap[nodeId].introduction = standAuthResult.serverDescription;
        serverMap[nodeId].elaAddress = standAuthResult.elaAddress;
        this.storeService.set(PersistenceKey.serverMap, serverMap);
      }
      this.standardDidAuth(nodeId, standAuthResult.jwtToken);
    });
  }

  handleStandardDidAuthResponse(nodeId, result, requestParams, error){
    this.handleSigninConfirm(nodeId,result,error);
  }

  async handleGetMultiComments(nodeId: string, responseResult: any, requestParams: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }
    let result = responseResult.comments;
    for (let index = 0; index < result.length; index++) {
      let channelId       = result[index].channel_id;
      let postId          = result[index].post_id;
      let commentId       = result[index].comment_id;
      let referCommentId  = result[index].refer_comment_id;
      let contentBin      = result[index].content;
      let likes           = result[index].likes;
      let createdAt       = result[index].created_at;
      let userName        = result[index].user_name;
      let updatedAt       = result[index].updated_at;
      let status          = result[index].status;
      let userDid         = result[index].user_did;

      await this.processNewComment(nodeId,channelId,postId,commentId,referCommentId,
        userName,likes,createdAt,updatedAt,status,userDid,contentBin);

      if(this.checkChannelIsMine(nodeId,channelId)){
        let lastCommentUpdateKey = this.getPostId(nodeId, 0, 0);
        this.updateLastCommentUpdate(lastCommentUpdateKey, nodeId, channelId, postId, updatedAt);
      }
    }
  }

  doIssueCredential(nodeId: string, did: string, serverName: string, serverDesc: string,elaAddress:string, onSuccess:()=> void, onError:()=>void){
    this.issueCredential(nodeId,did, serverName,serverDesc,elaAddress,
      (credential)=>{
        this.issueCredentialRequest(nodeId, credential);
      },
      ()=>{}
      );
  }

  doUpdateCredential(nodeId: string, did: string, serverName: string, serverDesc: string,elaAddress:string, onSuccess:()=> void, onError:()=>void){
    this.issueCredential(nodeId,did, serverName,serverDesc,elaAddress,
      (credential)=>{
        this.updateCredential(nodeId, credential);
      },
      ()=>{}
      );
  }

  issueCredential(nodeId: string, did: string, serverName: string, serverDesc: string,elaAddress:string, onSuccess:(credential: string)=> void, onError:()=>void) {
    if (did == "" || nodeId == ""){
      onError();
      return;
    }

    if (bindingServerCache == null || bindingServerCache == undefined)
      this.resolveServerDid(did, nodeId,"",()=>{},()=>{});
    /**
     * Ask the DID app to generate a VerifiableCredential with some data, and use current DID
     * as the signing issuer for this credential, so that others can permanently verifiy who
     * issued the credential.
     * This credential can then be delivered to a third party who can import it (credimport) to
     * his DID profile.
     *
     * For this demo, the subject DID is ourself, so we will be able to import the credential we issued
     * to our own DID profile (which is a useless use case, as usually DIDs are issued for others).
     */
    appManager.sendIntent("https://did.elastos.net/credissue", {
      identifier: "credential", // unique identifier for this credential
      types: ["BasicProfileCredential"], // Additional credential types (strings) such as BasicProfileCredential.
      subjectdid: did, // DID targeted by the created credential. Only that did will be able to import the credential.
      properties: {
          // customData: "test data.",
          name: serverName,
          description: serverDesc,
          elaAddress: elaAddress
          // moreComplexData: {
          //   info: "A sub-info"
          // }
      },

      expirationdate: new Date(2024, 10, 10).toISOString() // Credential will expire on 2024-11-10 - Note the month's 0-index...
    }, {}, (response) => {
      if (response.result == null){
        onError();
        return;
      }
      if (response.result.credential) {
        bindingServerCache.name = serverName;
        bindingServerCache.introduction = serverDesc;
        onSuccess(response.result.credential);
      }
      else {
        onError();
        this.logUtils.loge("Failed to issue a credential - empty credential returned" ,TAG);
        return;
      }
    }, (err)=>{
      onError();
      this.logUtils.loge("Failed to issue a credential: "+JSON.stringify(err), TAG);
      return ;
    })
  }

  restoreBindingServerCache(did: string, nodeId: string, onSuccess: ()=>void, onError: ()=>void){
    let feedUrl = "feeds://"+did+"/"+cacheBindingAddress;
    let defaultServer = {
      name              : "No name provided",
      owner             : this.getSignInData().name,
      introduction      : "No intro provided",
      did               : did,
      carrierAddress    : cacheBindingAddress,
      nodeId            : nodeId,
      feedsUrl          : feedUrl,
      elaAddress        : "",
      version           : ""
    }
    this.handleImportDID(feedUrl, defaultServer, (server)=>{
        bindingServerCache = {
          name              : server.name,
          owner             : server.owner,
          introduction      : server.introduction,
          did               : server.did,
          carrierAddress    : server.carrierAddress,
          nodeId            : server.nodeId,
          feedsUrl          : server.feedsUrl,
          elaAddress        : "",
        }
        onSuccess();
    },(err)=>{
      bindingServerCache = defaultServer;
      onError();
    });
  }

  resolveServerDid(did: string, nodeId: string, payload: string, onSuccess: ()=>void, onError: (error: string)=>void){
    let feedUrl = "feeds://"+did+"/"+cacheBindingAddress;
    let defaultServer = {
      name              : "No name provided",
      owner             : this.getSignInData().name,
      introduction      : "No intro provided",
      did               : did,
      carrierAddress    : cacheBindingAddress,
      nodeId            : nodeId,
      feedsUrl          : feedUrl,
      elaAddress        : "",
      version           : ""
    }
    this.handleImportDID(feedUrl, defaultServer, (server)=>{
        bindingServerCache = {
          name              : server.name,
          owner             : server.owner,
          introduction      : server.introduction,
          did               : server.did,
          carrierAddress    : server.carrierAddress,
          nodeId            : server.nodeId,
          feedsUrl          : server.feedsUrl,
          elaAddress        : "",
        }
        onSuccess();
        eventBus.publish("feeds:resolveDidSucess", nodeId, did);
    },(err)=>{
      bindingServerCache = defaultServer;
      onError(err);
      eventBus.publish("feeds:resolveDidError", nodeId, did, payload);
    });
  }

  finishBinding(nodeId: string){
    bindingServer = bindingServerCache;
    this.storeService.set(PersistenceKey.bindingServer,bindingServer);
    this.addServer(bindingServer.carrierAddress,
                  'Feeds/0.1',
                  bindingServer.name,
                  bindingServer.owner,
                  bindingServer.introduction,
                  bindingServer.did,
                  bindingServer.feedsUrl,()=>{
                  },(error)=>{

                  });
    eventBus.publish("feeds:issue_credential");
    eventBus.publish("feeds:bindServerFinish",bindingServer);
    this.signinChallengeRequest(nodeId, true);
  }

  checkExp(mAccessToken: FeedsData.AccessToken): boolean{
    let accessToken = mAccessToken || undefined;
    if(accessToken == undefined){
      return true;
    }

    let isExpire = accessToken.isExpire;
    if (isExpire){
      return true;
    }

    return false;
  }

  prepare(friendId: string){
    this.getStatistics(friendId);
    this.enableNotification(friendId);

    this.updateFeed(friendId, true);
    let list = this.getSubscribedChannelsFromNodeId(friendId);
    for (let index = 0; index < list.length; index++) {
      let channelId = list[index].id;
      this.updatePost(friendId,channelId);

      if (this.getServerVersionCodeByNodeId(friendId) < newCommentVersion){
        let postList = this.getPostListFromChannel(friendId,channelId);
        for (let postIndex = 0; postIndex < postList.length; postIndex++) {
          let post: Post = postList[postIndex];
          let postId: number = post.id;
          this.updateComment(friendId, channelId, postId);
        }
      }
    }

    if (this.getServerVersionCodeByNodeId(friendId) >= newCommentVersion){
      // let bindingServer = this.getBindingserver() || null;
      // if (bindingServer !=null && bindingServer.nodeId == friendId){
      let lastCommentUpdateKey = this.getPostId(friendId,0,0);
      let mLastCommentUpdateMap = this.lastCommentUpdateMap || "";
      let commentUpdateTime = mLastCommentUpdateMap[lastCommentUpdateKey] || "";
      let lastCommentTime = commentUpdateTime["time"] || 0;
      this.getMultiComments(friendId, 0, 0, Communication.field.last_update, 0 , lastCommentTime,0);
      // }
    }
  }

  saveCredential(credential: string){
    localCredential = credential;

    this.storeService.set(PersistenceKey.credential, localCredential);
  }

  getLocalCredential(){
    return localCredential;
  }

  removeAllData(){
    this.storeService.remove(PersistenceKey.signInData);
    this.storeService.remove(PersistenceKey.signInRawData);
    this.storeService.remove(PersistenceKey.subscribedChannelsMap);
    this.storeService.remove(PersistenceKey.channelsMap);
    this.storeService.remove(PersistenceKey.myChannelsMap);
    this.storeService.remove(PersistenceKey.unreadMap);
    this.storeService.remove(PersistenceKey.postMap);
    this.storeService.remove(PersistenceKey.lastPostUpdateMap);
    this.storeService.remove(PersistenceKey.commentsMap);
    this.storeService.remove(PersistenceKey.serverStatisticsMap);
    this.storeService.remove(PersistenceKey.serversStatus);
    this.storeService.remove(PersistenceKey.subscribeStatusMap);
    this.storeService.remove(PersistenceKey.likeMap);
    this.storeService.remove(PersistenceKey.accessTokenMap);

    this.storeService.remove(PersistenceKey.credential);
    this.storeService.remove(PersistenceKey.bindingServer);
    this.storeService.remove(PersistenceKey.serverMap);

    this.storeService.remove(PersistenceKey.notificationList);
    this.storeService.remove(PersistenceKey.likeCommentMap);
  }

  getBindingServer(): Server{
    return bindingServer;
  }

  addServer(carrierAddress: string,
    friendRequest: string,
    name: string, owner: string, introduction: string,
    did: string, feedsUrl: string,
    onSuccess:()=>void, onError?:(err: string)=>void){
    // isBindServer = false;
    this.checkIsAlreadyFriends(carrierAddress,(isFriend)=>{
      if (isFriend){
        this.native.toast_trans("AddServerPage.ServerAlreadyAdded");
        onSuccess();
      }else{
        this.carrierService.isValidAddress(carrierAddress, (isValid) => {
          if (!isValid){
            this.native.toast_trans("common.addressinvalid");
            onError("Address invalid");
            return;
          }

          this.carrierService.addFriend(carrierAddress, friendRequest,
            () => {
                this.saveServer(name, owner, introduction, did, carrierAddress, feedsUrl);
            }, (err) => {
                this.alertError("Add server error: " + err);
            });
          },
          (error: string) => {
            this.alertError("Address error: " + error);
          });
      }
    })

  }

  alertError(error: string){
    alert(error);
  }

  getLikeFromId(key: string): Likes{
    if (likeMap == null || likeMap == undefined)
      likeMap = {};

    return likeMap[key];
  }

  getLikedCommentFromId(nodeChannelPostCommentId: string): LikedComment{
    if (likeCommentMap == null || likeCommentMap == undefined)
      likeCommentMap = {};
    return likeCommentMap[nodeChannelPostCommentId];
  }

  checkMyLike(nodeId: string, channelId: number, postId: number): boolean{
    let key = this.getKey(nodeId, channelId, postId,0);
    if(this.getLikeFromId(key) == undefined)
      return false;
    return true;
  }

  checkLikedComment(nodeId: string, channelId: number, postId: number, commentId: number): boolean{
    let key = this.getKey(nodeId, channelId, postId, commentId);
    if(this.getLikedCommentFromId(key) == undefined)
      return false;
    return true;
  }

  parseChannelAvatar(avatar: string): string{
    if (avatar == null || avatar == undefined)
      return "";
    if (avatar.startsWith("img://")){
      let newAvatar = avatar.replace("img://","");
      return newAvatar;
    }
    return avatar;
  }

  async deleteFeedSource(nodeId: string): Promise<any>{
    return this.removeFeedSource(nodeId).then(()=>{
      this.removeNotification();
      this.removeBindingServer();
    });
  }

  async removeFeedSource(nodeId: string): Promise<any>{
    let channelList = this.getChannelsListFromNodeId(nodeId)||[];
    for (let channelIndex = 0; channelIndex < channelList.length; channelIndex++) {
      const channel = channelList[channelIndex];
      let channelId = channel.id;
      let postList = this.getPostListFromChannel(nodeId, channelId);
      for (let postIndex = 0; postIndex < postList.length; postIndex++) {
        const post = postList[postIndex];
        let postId = post.id;
        await this.removeLikeById(nodeId, channelId, postId)
        await this.removePostById(nodeId, channelId, postId);
        await this.removeCommentById(nodeId, channelId, postId);
        await this.removeLastCommentUpdate(nodeId,channelId,postId);
      }
      await this.removeChannelById(nodeId, channelId);
      await this.removeSubscribedChannelById(nodeId, channelId);
      await this.removeUnreadStatueById(nodeId, channelId);
      await this.removeMyChannelById(nodeId, channelId);
      await this.removeLastPostUpdate(nodeId,channelId);
    }

    await this.removeLastFeedUpdate(nodeId);
    await this.removeServerStatisticById(nodeId);
    await this.removeServerStatusById(nodeId);
    await this.removeServerById(nodeId);
    await this.removeAccessTokenById(nodeId).then(
      ()=>{
        this.removeServerFriendsById(nodeId, ()=>{
          eventBus.publish(PublishType.removeFeedSourceFinish);
          eventBus.publish(PublishType.refreshPage);
        },(error)=>{
          eventBus.publish(PublishType.removeFeedSourceFinish);
          eventBus.publish(PublishType.refreshPage);
        });
      }
    );

    return new Promise((resolve, reject) =>{
      resolve(null);
    });
  }

  removeLastPostUpdate(nodeId:string, channelId: number): Promise<any>{
    let nodeChannelId = this.getChannelId(nodeId, channelId);
    lastPostUpdateMap[nodeChannelId] = undefined;
    delete lastPostUpdateMap[nodeChannelId];
    return this.storeService.set(PersistenceKey.lastPostUpdateMap, lastPostUpdateMap);
  }

  removeLastCommentUpdate(nodeId: string, channelId: number, postId: number): Promise<any>{
    let ncpId = this.getPostId(nodeId, channelId, postId);
    this.lastCommentUpdateMap[ncpId] = undefined;
    delete this.lastCommentUpdateMap[ncpId];
    return this.storeService.set(PersistenceKey.lastCommentUpdateMap,this.lastCommentUpdateMap);
  }

  removeLastFeedUpdate(nodeId: string): Promise<any>{
    this.lastFeedUpdateMap[nodeId] = undefined;
    delete this.lastFeedUpdateMap[nodeId];
    return this.storeService.set(PersistenceKey.lastFeedUpdateMap,this.lastFeedUpdateMap);
  }

  removeLikeById(nodeId: string, channelId: number, postId: number):Promise<any>{
    let key = this.getKey(nodeId, channelId, postId, 0);
    likeMap[key] = undefined;
    delete likeMap[key];
    return this.storeService.set(PersistenceKey.likeMap, likeMap);
  }

  removeCommentById(nodeId: string, channelId: number, postId: number):Promise<any>{
    if (commentsMap == null ||  commentsMap == undefined)
      commentsMap = {}

    if (commentsMap[nodeId] == null || commentsMap[nodeId] == undefined)
      commentsMap[nodeId] = {}

    if (commentsMap[nodeId][channelId] == null || commentsMap[nodeId][channelId] == undefined)
      commentsMap[nodeId][channelId] = {}

    commentsMap[nodeId][channelId][postId] = undefined;
    delete commentsMap[nodeId][channelId][postId];
    return this.storeService.set(PersistenceKey.commentsMap, commentsMap);
  }

  removePostById(nodeId: string, channelId: number, postId: number):Promise<any>{
    let key = this.getKey(nodeId, channelId, postId, 0);
    delete this.postMap[key];
    return this.storeService.set(PersistenceKey.postMap, this.postMap);
  }

  removeChannelById(nodeId: string, channelId: number):Promise<any>{
    let nodeChannelId = this.getChannelId(nodeId, channelId);
    channelsMap[nodeChannelId] = undefined;
    delete channelsMap[nodeChannelId];
    return this.storeService.set(PersistenceKey.channelsMap,channelsMap);
  }

  removeMyChannelById(nodeId: string, channelId: number):Promise<any>{
    let nodeChannelId = this.getChannelId(nodeId, channelId);
    myChannelsMap[nodeChannelId] = undefined;
    delete myChannelsMap[nodeChannelId];
    return this.storeService.set(PersistenceKey.myChannelsMap, myChannelsMap);
  }

  removeSubscribedChannelById(nodeId: string, channelId: number):Promise<any>{
    let nodeChannelId = this.getChannelId(nodeId, channelId);
    subscribedChannelsMap[nodeChannelId] = undefined;
    delete subscribedChannelsMap[nodeChannelId];
    return this.storeService.set(PersistenceKey.subscribedChannelsMap, subscribedChannelsMap);
  }

  removeUnreadStatueById(nodeId: string, channelId: number):Promise<any>{
    let nodeChannelId = this.getChannelId(nodeId, channelId);
    unreadMap[nodeChannelId] = 0;
    delete unreadMap[nodeChannelId];
    return this.storeService.set(PersistenceKey.unreadMap, unreadMap);
  }

  removeServerStatisticById(nodeId: string):Promise<any>{
    serverStatisticsMap[nodeId] = undefined;
    delete serverStatisticsMap[nodeId];
    return this.storeService.set(PersistenceKey.serverStatisticsMap, serverStatisticsMap);
  }

  removeServerStatusById(nodeId: string):Promise<any>{
    serversStatus[nodeId] = undefined;
    delete serversStatus[nodeId];
    return this.storeService.set(PersistenceKey.serversStatus, serversStatus);
  }

  removeServerById(nodeId: string):Promise<any>{
    serverMap[nodeId] = undefined;
    delete serverMap[nodeId];
    return this.storeService.set(PersistenceKey.serverMap, serverMap);
  }

  removeServerFriendsById(nodeId: string, onSuccess: ()=>void, onError:(error)=>void){
    this.carrierService.isFriends(nodeId,(isFriend)=>{
      if (isFriend){
        this.carrierService.removeFriend(nodeId, ()=>{
          onSuccess();
        }, (error)=>{
          onError(error);
        });
      }else{
        onSuccess();
      }
    });
  }

  removeAllServerFriends(){
    let servers = serverMap || "";
    if (servers == "")
      return;

    let keys: string[] = Object.keys(serverMap) || [];
    for (let index = 0; index < keys.length; index++) {
      let key = keys[index];
      let server = serverMap[key];

      if (server == undefined)
        continue;

      this.carrierService.removeFriend(server.nodeId,()=>{
      },(err)=>{
        this.logUtils.loge("Remove Friend error: "+JSON.stringify(err), TAG);
      });
    }
  }

  removeBindServer(){

  }

  removeAccessTokenById(nodeId: string):Promise<any>{
    accessTokenMap[nodeId] = undefined;
    return this.storeService.set(PersistenceKey.accessTokenMap, accessTokenMap);
  }

  removeAllAccessToken(): Promise<any>{
    return this.storeService.remove(PersistenceKey.accessTokenMap);
  }

  removeNotification():Promise<any>{
    notificationList.splice(0, notificationList.length);
    return this.storeService.set(PersistenceKey.notificationList, notificationList);
  }

  removeBindingServer(){
    bindingServer = undefined;
    this.storeService.remove(PersistenceKey.bindingServer);
  }

  getNotificationList(): Notification[]{
    if(notificationList == null || notificationList == undefined || notificationList.length == 0)
      return [];
    let list:Notification[] = notificationList.sort((a, b) => Number(b.time) - Number(a.time));
    return list;
  }

  setNotificationReadStatus(notification: Notification, readStatus: number){
    if (notification == undefined)
      return ;

    notification.readStatus = readStatus;
    this.storeService.set(PersistenceKey.notificationList, notificationList);
  }

  deleteNotification(notification: Notification):Promise<any>{
    return new Promise((resolve, reject) =>{
      let index = notificationList.indexOf(notification);
      notificationList.splice(index, 1);
      this.storeService.set(PersistenceKey.notificationList, notificationList);
      eventBus.publish(PublishType.UpdateNotification);
      resolve(null);
    });
  }

  restoreData(nodeId: string){
    this.getSubscribedChannels(nodeId, Communication.field.last_update, 0, 0, 0);

    if(bindingServer !=null && bindingServer != undefined && nodeId == bindingServer.nodeId)
      this.getMyChannels(nodeId,Communication.field.last_update,0,0,0);
  }

  parseBindServerUrl(content: string): BindURLData{
    if (content.startsWith("feeds_raw://")){
      let tmpString = content.replace("feeds_raw://","");
      let tmp: string[] = tmpString.split("/")

      if (tmp.length == 3){
        return {
          did: tmp[0],
          carrierAddress: tmp[1],
          nonce: tmp[2]
        }
      }else if (tmp.length == 2){
        return {
          did: "",
          carrierAddress: tmp[0],
          nonce: tmp[1]
        }
      }
    }else if(content.startsWith("feeds://")){
      let tmpString = content.replace("feeds://","");
      let tmp: string[] = tmpString.split("/")
      return {
        did: tmp[0],
        carrierAddress: tmp[1],
        nonce: "0"
      }
    }
  }

  checkChannelIsMine(nodeId: string, channelId: number): boolean{
    let channel = this.getChannelFromId(nodeId, channelId);
    if (channel.owner_did == this.getSignInData().did)
      return true;

    return false;
  }

  checkCommentIsMine(nodeId: string, channelId: number, postId: number, commentId: number):boolean{
    let comment = commentsMap[nodeId][channelId][postId][commentId];
    if(comment == undefined)
      return false;

    let did = comment.user_did || "";
    if (did == this.getSignInData().did)
      return true;

    return false;
  }

  checkIsAlreadyFriends(carrierAddress: string, onSuccess: (isFriends: boolean) =>void){
    this.carrierService.getIdFromAddress(carrierAddress,
      (userId)=>{
        if (serverMap == null || serverMap == undefined)
          serverMap = {};

        if(serverMap[userId] != undefined){
          onSuccess(true);
          return ;
        }

        onSuccess(false);
        return ;
      });
  }

  pay(receiver: string, amount: number, memo: string, onSuccess: (res:any)=>void, onError: (err: any)=>void){
    let param = {
      receiver: receiver,
      amount: amount,
      memo: memo
    }

    appManager.sendIntent("https://wallet.elastos.net/pay", param, {},
      (response: any) => {
        onSuccess(response);
      },
      (err)=>{
        onError(err);
      }
    );
  }

  reSavePostMap(){
    this.updateAllContentData();

    this.updatePostKey();
    this.updateSubscribedChannelsKey();
    this.updateChannelsKey();
    this.updateMyChannelsKey();
    this.updateLikeCommentKey();
    this.updatePostUpdateKey();
    this.updateLastCommentUpdateKey();
  }



  saveChannelMap(){
    if (!this.isSavingChannel){
      this.isSavingChannel = true;
      this.storeService.set(PersistenceKey.channelsMap, channelsMap).then(()=>{
        this.isSavingChannel = false;;
      });
    }
  }

  processGeneralError(nodeId: string, errorCode: number){
    let errorMessage = this.translate.instant("Common.unknownError");
    switch(errorCode){
      case -1:
        errorMessage = this.translate.instant("ErrorInfo.alreadyExists");
        break;
      case -2:
        errorMessage = this.translate.instant("ErrorInfo.notExists");
        break;
      case -3:
        errorMessage = this.translate.instant("StartbindingPage.linkServerError");
        break;
      case -4:
        errorMessage = this.translate.instant("ErrorInfo.wrongState");
        break;
      case -5:
        // errorMessage = this.translate.instant("ErrorInfo.tokenExpired");
        accessTokenMap[nodeId].isExpire = true;
        this.storeService.set(PersistenceKey.accessTokenMap,accessTokenMap);
        this.signinChallengeRequest(nodeId,true);
        return ;
      case -6:
        errorMessage = this.translate.instant("ErrorInfo.internalError");
        break;
      case -7:
        errorMessage = this.translate.instant("ErrorInfo.invalidParam");
        break;
      case -8:
        errorMessage = this.translate.instant("ErrorInfo.invalidChallengeResponse");
        break;
      case -9:
        errorMessage = this.translate.instant("ErrorInfo.invalidVerifiableCredential");
        break;
      case -10:
        // errorMessage = this.translate.instant("ErrorInfo.unsupportedRequests");
        this.native.toastWarn(
          this.translate.instant("common.theFeedSource")+
          " #"+this.getServerNameByNodeId(nodeId) +
          this.translate.instant("ErrorInfo.needUpdateServerVersion"));
        return;

      default:
        errorMessage = this.translateBinaryError(nodeId, errorCode);
        return;
    }
    this.native.toastWarn(this.formatInfoService.formatErrorMsg(this.getServerNameByNodeId(nodeId),errorMessage));
  }



  refreshPostById(nodeId: string, channelId: number, postId: number){
    let memo = {
      action: RequestAction.refreshPostDetail
    }
    this.getPost(nodeId, channelId,Communication.field.id,Number(postId),Number(postId),0 ,memo);
  }

  setChannelInfo(obj:any){
     this.channelInfo = obj;
  }

  getChannelInfo(){
    return this.channelInfo || {};
  }

  setCurTab(curtab:string){
    this.curtab = curtab;
 }

  getCurTab(){
    return this.curtab;
  }

  updateVersionData(){
    let updateCode = localStorage.getItem('org.elastos.dapp.feeds.update') || "0";
    if (Number(updateCode) < 8){
      this.updatePostKey();
      this.updateSubscribedChannelsKey();
      this.updateChannelsKey();
      this.updateMyChannelsKey();
      this.updateLikeCommentKey();
      this.updateLikeKey();
      this.updatePostUpdateKey();
      this.updateLastCommentUpdateKey();
      this.updateAllContentData();
      localStorage.setItem("org.elastos.dapp.feeds.update","8");
    }
  }

  setCurrentLang(currentLang:string){
    this.currentLang = currentLang;
  }

  getCurrentLang(){
    return this.currentLang;
  }

  close(){
    appManager.close();
  }

  promptpublishdid(){
    appManager.sendIntent("https://did.elastos.net/promptpublishdid", {}, {}, (response: any) => {
    },
    (err)=>{
      this.native.toastdanger('common.promptPublishDidError');
    });
  }

  checkDIDDocument(did: string): Promise<boolean>{
    return new Promise((resolve, reject) =>{
      this.checkDIDOnSideChain(did, (isOnSideChain)=>{
        resolve(isOnSideChain);
      },(err)=>{
        this.native.toastdanger('common.resolveDidDocumentError');
        reject(err);
      })
    });
  }

  checkDIDOnSideChain(did: string, onSuccess: (isOnSideChain: boolean)=>void, onError?: (err: any)=>void){
    didManager.resolveDidDocument(did, false,(didDocument)=>{
      if (didDocument == null){
        onSuccess(false);
      }else{
        onSuccess(true);
      }
    },(err)=>{
      onError(err);
    });
  }

  destroyCarrier(){
    this.carrierService.destroyCarrier();
  }

  resetConnectionStatus(){
    this.connectionService.resetConnectionStatus();
    this.resetServerConnectionStatus();
    this.connectionStatus = FeedsData.ConnState.disconnected;
    this.lastConnectionStatus = FeedsData.ConnState.disconnected;
  }

  resetServerConnectionStatus(){
    let serverConnectionMap = serversStatus||{};
    let keys: string[] = Object.keys(serverConnectionMap) || [];
    for (let index = 0; index < keys.length; index++) {
      if (serversStatus[keys[index]] == undefined)
        continue;
      serversStatus[keys[index]].status = ConnState.disconnected;
    }
  }

  rmDIDPrefix(did: string): string{
    let result = did ;
    let isStartWith = did.startsWith("did:elastos:");
    if (isStartWith)
      result = did.substring(12, did.length);

    return result;
  }

  updatePublic(did: string, name: string, description: string, url: string){
    let obj = {
      "did":did,
      "name":name,
      "description":description,
      "url":url
    };
    this.httpService.ajaxPost(ApiUrl.update,obj).then((result)=>{
      if(result["code"]=== 200){
      }
    });
  }

  setBinary(nodeId: string, key: string, value: any, mediaType: string){
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    let requestData = this.sessionService.buildSetBinaryRequest(accessToken, key);
    this.storeService.set(key, value);
    this.transportData(nodeId, key, requestData, mediaType, value);
  }

  getBinary(nodeId: string, key: string, mediaType: string){
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    let requestData = this.sessionService.buildGetBinaryRequest(accessToken, key);
    this.transportData(nodeId, key, requestData, mediaType);
  }

  transportData(nodeId: string, key: string, request: any, mediaType: string, value: any = ""){
    let requestData = this.serializeDataService.encodeData(request);

    if (value != ""){
      let valueData = this.serializeDataService.encodeData(value);
      this.sessionService.addHeader(nodeId, requestData.length, valueData.length, request, mediaType, request.method, key);
      this.sessionService.streamAddData(nodeId, requestData);
      this.transportValueData(nodeId, valueData);
    }else{
      this.sessionService.addHeader(nodeId, requestData.length, 0, request, mediaType,  request.method, key);
      this.sessionService.streamAddData(nodeId, requestData);
    }
  }


  transportValueData(nodeId: string, valueData: Uint8Array){
    let step = 2048 ;
    let currentSlice = 0;
    let sumSlice = 0;

    sumSlice = valueData.length / step;

    let transDataInter = setInterval(()=>{
      if (currentSlice >= sumSlice){
        this.sessionService.streamAddData(nodeId, valueData.subarray(currentSlice*step, valueData.length));
        clearInterval(transDataInter);
        return;
      }

      let sentData = valueData.subarray(currentSlice*step, (currentSlice+1)*step);
      this.sessionService.streamAddData(nodeId, sentData);
      currentSlice++;

    },1);


    // for (let index = 0; index < sumSlice; index++) {
    //   let sentData = valueData.subarray(currentSlice*step, (currentSlice+1)*step);
    //   this.sessionService.streamAddData(nodeId, sentData).then();
    //   setTimeout
    //   currentSlice++;
    // }
  }

  createOfflineError(){
    let response = {
        code: FeedsData.SessionError.OFFLINE,
        message: "serverOffline"
    }
    return response;
  }

  restoreSession(nodeId: string): boolean{
    if(this.getServerStatusFromId(nodeId) == 1){
      eventBus.publish("stream:error",nodeId,this.createOfflineError());
      // eventBus.publish("sessionRequest:error", nodeId,this.createCreateOfflineError());
      // this.native.toast(this.formatInfoService.formatOfflineMsg(this.getServerNameByNodeId(nodeId)));
      return false;
    }


    let state = this.sessionService.getSessionState(nodeId);

    switch(state){
      case 0:
      case 1:
      case 2:
      case 3:
        return false;
      case 4:
        return true;
      case 5:
      case 6:
      case 7:
      case -1:
        this.sessionService.createSession(nodeId,(session, stream)=>{
        });
        return false;
    }
  }

  closeSession(nodeId: string){
    this.sessionService.sessionClose(nodeId);
  }

  getTextKey(nodeId: string, channelId: number, postId: number, commentId: number, index: number){
    this.getKey(nodeId, channelId, postId, commentId)+"-text-"+index;
  }

  getImageKey(nodeId: string, channelId: number, postId: number, commentId: number, index: number){
    return this.getKey(nodeId, channelId, postId, commentId)+"-img-"+index;
  }

  getImageThumbnailKey(nodeId: string, channelId: number, postId: number, commentId: number, index: number){
    return this.getKey(nodeId, channelId, postId, commentId)+"-img-thumbnail-"+index;
  }

  getVideoKey(nodeId: string, channelId: number, postId: number, commentId: number, index: number){
    return this.getKey(nodeId, channelId, postId, commentId)+"-video-"+index;
  }

  getVideoThumbKey(nodeId: string, channelId: number, postId: number, commentId: number, index: number){
    return this.getKey(nodeId, channelId, postId, commentId)+"-video-thumbnail-"+index;
  }

  getCachePostKey(nodeId: string, channelId: number, postId: number, commentId: number){
    return this.getKey(nodeId, channelId, postId, commentId)+"-cached";
  }
  getKey(nodeId: string, channelId: number, postId: number, commentId: number): string{
    return nodeId + "-" + channelId + "-"+ postId + "-" + commentId;
  }

  sendData(nodeId: string, channelId: number, postId: number,
    commentId: number, index: number,
    videoData: any, imgData: any){
    if (this.restoreSession(nodeId)){
      if (videoData != ""){
        let key = this.getVideoKey(nodeId,channelId,postId,commentId,index);
        this.setBinary(nodeId,key,videoData,"video");
      }else if(imgData != ""){
        let key = this.getImageKey(nodeId,channelId,postId,commentId,index);
        this.setBinary(nodeId,key,imgData,"img");
      }
    }
  }

  sendDataFromMsg(nodeId: string, channelId: number, postId: number,
    commentId: number, index: number,
    videoData: any, imgData: any){
      if (videoData != ""){
        let key = this.getVideoKey(nodeId,channelId,postId,commentId,index);
        this.setBinaryFromMsg(nodeId,key,videoData);
      }else if(imgData != ""){
        let key = this.getImageKey(nodeId,channelId,postId,commentId,index);
        this.setBinaryFromMsg(nodeId,key,imgData);
      }
  }

  setBinaryFromMsg(nodeId: string, key: string, content: any){
    if(!this.hasAccessToken(nodeId))
      return;

    this.storeService.set(key, content);
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.setBinary(this.getServerNameByNodeId(nodeId),nodeId,key,content,accessToken);
  }

  getBinaryFromMsg(nodeId: string, key: string){
    if(!this.hasAccessToken(nodeId))
      return;
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.getBinary(this.getServerNameByNodeId(nodeId),nodeId,key,accessToken);
  }


  compress(imgData: string): Promise<any>{
    return new Promise((resolve, reject) =>{
      if (imgData.length< 50*1000){
        resolve(imgData);
        return ;
      }
      let image = new Image()     //新建一个img标签（不嵌入DOM节点，仅做canvas操作)
      image.src = imgData    //让该标签加载base64格式的原图
      image.onload = function() {    //图片加载完毕后再通过canvas压缩图片，否则图片还没加载完就压缩，结果图片是全黑的
          let canvas = document.createElement('canvas'), //创建一个canvas元素
          context = canvas.getContext('2d'),    //context相当于画笔，里面有各种可以进行绘图的API
          imageWidth = image.width / 4,    //压缩后图片的宽度，这里设置为缩小一半
          imageHeight = image.height / 4,    //压缩后图片的高度，这里设置为缩小一半
          data = ''    //存储压缩后的图片
          canvas.width = imageWidth    //设置绘图的宽度
          canvas.height = imageHeight    //设置绘图的高度

          //使用drawImage重新设置img标签中的图片大小，实现压缩。drawImage方法的参数可以自行查阅W3C
          context.drawImage(image, 0, 0, imageWidth, imageHeight)

          //使用toDataURL将canvas上的图片转换为base64格式
          data = canvas.toDataURL('image/jpeg')

          resolve(data);
      }
    });
  }

  createContent(text: string, imageThumb: FeedsData.ImgThumb[], videoThumb: FeedsData.VideoThumb): string{
    // {"videoThumbnail":"","imageThumbnail":[{"index":0,"imgThumb":""}]}
    // {"text":"123"}
    // {"text":"123","imageThumbnail":[{"index":0,"imgThumb":"data:image/jpeg;base64,/9j/4}]}
    // {"text":"123","videoThumbnail":"data:image/png;base64,iVB=="}
    let content = {};
    content["version"]="1.0";
    // content["type"]="";

    if (text != ""){
      content["text"] = text ;
      // content["type"] = content["type"]+"text/";
    }

    if(imageThumb!=null && imageThumb.length > 0){
      content["imageThumbnail"] = imageThumb;
      // content["type"] = content["type"]+"img/";
      // content["imgTotalNum"] = imageThumb.length;
    }

    if(videoThumb!=null && videoThumb!=undefined && JSON.stringify(videoThumb) != "{}"){
      content["videoThumbnail"] = videoThumb;
      // content["type"] = content["type"]+"video/";
    }

    let contentStr = JSON.stringify(content);
    return contentStr;
  }

  parseContent(nodeId: string, channelId: number, postId: number, commentId: number, content: any): FeedsData.Content{
    let contentObj = this.native.parseJSON(content) || "";
    if (contentObj.version != undefined && contentObj.version === "1.0"){
      return this.parseContentV1(nodeId, channelId, postId, commentId, contentObj);
    }else{
      return this.parseContentV0(nodeId, channelId, postId, commentId, contentObj);
    }
  }

  parseContentV1(nodeId: string, channelId: number, postId: number, commentId: number, contentObj: any): FeedsData.Content{
    // {"version":"1.0","text":"testText","imageThumbnail":[{"index":0,"imgThumb":"this.imgUrl"}],"videoThumbnail":"this.posterImg"}
    let mVersion = contentObj.version || "";
    let mText = contentObj.text || "";
    let videoThumb = contentObj.videoThumbnail || ""
    let mMediaType = FeedsData.MediaType.noMeida;

    let videoThumbKeyObj:FeedsData.VideoThumbKey = undefined;
    if (videoThumb != ""){
      let mDuration = videoThumb.duration;
      let size = videoThumb.videoSize || 0;
      let mVideoThumbKey = this.getVideoThumbKey(nodeId, channelId, postId, commentId, 0);
      this.storeService.set(mVideoThumbKey, videoThumb.videoThumb);
      mMediaType = FeedsData.MediaType.containsVideo;

      videoThumbKeyObj = {
        videoThumbKey : mVideoThumbKey,
        duration      : mDuration,
        videoSize     : size
      }
    }

    let imageThumbs = contentObj.imageThumbnail||"";
    let imgThumbKeys: FeedsData.ImageThumbKey[] = [];
    if (imageThumbs != ""){
      for (let index = 0; index < imageThumbs.length; index++) {
        let imageThumb:FeedsData.ImgThumb = imageThumbs[index];
        let thumbIndex = imageThumb.index;
        let image = imageThumb.imgThumb;
        let size = imageThumb.imgSize;
        let key = this.getImageThumbnailKey(nodeId,channelId,postId,commentId,thumbIndex);
        this.storeService.set(key, image);

        imgThumbKeys[index] = {
          index       : thumbIndex,
          imgThumbKey : key,
          imgSize     : size
        }
      }
      mMediaType = FeedsData.MediaType.containsImg;
    }

    let content: FeedsData.Content = {
      version         :   mVersion,
      text            :   mText,
      mediaType       :   mMediaType,
      videoThumbKey   :   videoThumbKeyObj,
      imgThumbKeys    :   imgThumbKeys
    }
    return content;
  }

  parseContentV0(nodeId: string, channelId: number, postId: number, commentId: number, contentObj: any): FeedsData.Content{
    // {"text":"test","img":""}
    let text = this.parsePostContentText(contentObj) || "";
    let img = this.parsePostContentImg(contentObj) || "";
    let imgThumbKeys: FeedsData.ImageThumbKey[] = [];
    let mMediaType = FeedsData.MediaType.noMeida;
    if (img != ""){
      let key = this.getImageThumbnailKey(nodeId,channelId,postId,commentId,0);
      let size = img.length || 0;
      this.storeService.set(key,img);

      imgThumbKeys[0] = {
        index       : 0,
        imgThumbKey : key,
        imgSize     : size
      }
      mMediaType = FeedsData.MediaType.containsImg;
    }

    let content: FeedsData.Content = {
      version         :   "0",
      text            :   text,
      mediaType       :   mMediaType,
      videoThumbKey   :   undefined,
      imgThumbKeys    :   imgThumbKeys
    }

    return content;
  }

  getContentFromId(nodeId: string, channelId: number, postId: number, commentId: number): FeedsData.Content{
    if (commentId == 0){
      let post = this.getPostFromId(nodeId, channelId, postId);
      if (post == undefined){
        return undefined;
      }
      return post.content;
    }else{
      // TODO
      return undefined;
    }
  }

  getImgThumbsKeyFromId(nodeId: string, channelId: number, postId: number, commentId: number):FeedsData.ImageThumbKey[]{
    let content = this.getContentFromId(nodeId,channelId,postId,commentId);
    if (content == undefined || content.imgThumbKeys == undefined)
      return undefined;

    return content.imgThumbKeys;
  }

  getImgThumbKeyFromId(nodeId: string, channelId: number, postId: number, commentId: number, index: number):FeedsData.ImageThumbKey{
    let imgThumbKeys = this.getImgThumbsKeyFromId(nodeId,channelId,postId,commentId);
    if (imgThumbKeys.length == 0 || imgThumbKeys[index] == undefined)
      return undefined;

    return imgThumbKeys[index];
  }

  getImgThumbKeyStrFromId(nodeId: string, channelId: number, postId: number, commentId: number, index: number): string{
    let mImgThumbKey:any = this.getImgThumbKeyFromId(nodeId,channelId,postId,commentId, index) || "";

    if(mImgThumbKey===""){
      return "";
    }

    return mImgThumbKey.imgThumbKey;
  }

  getVideoThumbKeyFromId(nodeId: string, channelId: number, postId: number, commentId: number):FeedsData.VideoThumbKey{
    let content = this.getContentFromId(nodeId, channelId, postId, commentId);
    if (content == undefined)
      return undefined;

    return content.videoThumbKey;
  }

  getVideoThumbStrFromId(nodeId: string, channelId: number, postId: number, commentId: number):string{
    let mVideoThumbKey = this.getVideoThumbKeyFromId(nodeId,channelId,postId,commentId);
    if (mVideoThumbKey == undefined)
      return undefined;

    return mVideoThumbKey.videoThumbKey;
  }

  getVideoDurationFromId(nodeId: string, channelId: number, postId: number, commentId: number):number{
    let mVideoThumbKey = this.getVideoThumbKeyFromId(nodeId,channelId,postId,commentId);
    if (mVideoThumbKey == undefined)
      return undefined;

    return mVideoThumbKey.duration;
  }

  getContentVersion(nodeId: string, channelId: number, postId: number, commentId: number): string{
    let content = this.getContentFromId(nodeId,channelId,postId,commentId);

    if (content == undefined || content.imgThumbKeys == undefined)
      return undefined;

    return content.version;
  }

  getContentDataSize(nodeId: string, channelId: number, postId: number, commentId: number, index: number, mediaType: FeedsData.MediaType): number{
    switch (mediaType){
      case FeedsData.MediaType.noMeida:
        return 0;
      case FeedsData.MediaType.containsImg:
        let imgThumbKey: FeedsData.ImageThumbKey = this.getImgThumbKeyFromId(nodeId, channelId, postId, commentId, index);
        if (imgThumbKey == undefined)
          return 0;
        else
          return imgThumbKey.imgSize;
      case FeedsData.MediaType.containsVideo:
        let videoThumbKey: FeedsData.VideoThumbKey = this.getVideoThumbKeyFromId(nodeId,channelId,postId,commentId);
        if (videoThumbKey == undefined)
          return 0;
        else
          return videoThumbKey.videoSize;
    }
  }

  updateAllContentData(){
    let keys: string[] = Object.keys(this.postMap) || [];
    for (let index = 0; index < keys.length; index++) {
      let key = keys[index];
      if(this.postMap[key] == undefined)
        continue;

      this.updateContentData(key);
    }
    this.storeService.set(PersistenceKey.postMap, this.postMap);
  }

  updateContentData(key: string){ //undefine =>v0
    let post = this.postMap[key];
    let content = post.content;
    if (content == undefined){
      return ;
    }
    let contentObj = this.native.parseJSON(content);
    if (content.version != undefined){
      return;
    }

    let mText = this.parsePostContentText(content) || "";
    let mImgThumbKeys: FeedsData.ImageThumbKey[] = [];
    let mMediaType: FeedsData.MediaType = FeedsData.MediaType.noMeida;

    let nodeId = post.nodeId;
    let channelId = post.channel_id;
    let postId = post.id;

    let mNCPId = nodeId+channelId+postId;
    let imgKey = "postContentImg" + mNCPId ;
    this.storeService.get(imgKey).then((image)=>{
      let mImage = image || ""
      let size = mImage.length;
      if (mImage != ""){
        mImgThumbKeys[0] = {
          index       : 0,
          imgThumbKey : imgKey,
          imgSize     : size
        }
        mMediaType = FeedsData.MediaType.containsImg;
      }

      let finalContent:FeedsData.Content = {
        version         :   "0",
        text            :   mText,
        mediaType       :   mMediaType,
        videoThumbKey   :   undefined,
        imgThumbKeys    :   mImgThumbKeys
      }

      post.content = finalContent;

      this.postMap[key] = post;
    });
  }

  updatePostKey(){
    let keys: string[] = Object.keys(this.postMap) || [];
    for (let index = 0; index < keys.length; index++) {

      let key = keys[index];
      if(this.postMap[key] == undefined){
        delete this.postMap[key];
        continue;
      }

      let post = this.postMap[key];

      let nodeId = post.nodeId;
      let channelId = post.channel_id;
      let postId = post.id;

      let newKey = this.getKey(nodeId,channelId,postId,0);

      if (key == newKey){
        continue ;
      }

      this.postMap[newKey] = post;
      delete this.postMap[key];
    }

    this.storeService.set(PersistenceKey.postMap, this.postMap);
  }

  setData(key: string, value: any):Promise<any>{
    return this.storeService.set(key, value);
  }

  getData(key: string):Promise<any>{
    return this.storeService.get(key);
  }

  setDeveloperMode(status:boolean){
    return this.developerMode = status;
  }

  getDeveloperMode(){
    return this.developerMode;
  }

  setHideDeletedPosts(status:boolean){
    return this.hideDeletedPosts = status;
  }

  getHideDeletedPosts(){
  return this.hideDeletedPosts;
  }

  setHideDeletedComments(status:boolean){
   return this.hideDeletedComments = status;
  }

 getHideDeletedComments(){
  return this.hideDeletedComments;
  }

 setHideOfflineFeeds(status:boolean){
  return this.hideOfflineFeeds = status;
 }

 getHideOfflineFeeds(){
  return this.hideOfflineFeeds;
 }

  removeMediaData(nodeId: string, channelId: number, postId: number, commentId: number){
    let imgThumbs = this.getImgThumbsKeyFromId(nodeId,channelId,postId,commentId);
    if (imgThumbs != null && imgThumbs != undefined){
      for (let index = 0; index < imgThumbs.length; index++) {
        this.storeService.remove(imgThumbs[index].imgThumbKey);
        let imgKey = this.getImageKey(nodeId,channelId,postId,commentId,imgThumbs[index].index);
        this.storeService.remove(imgKey);
      }
    }

    let videoThumb = this.getVideoThumbKeyFromId(nodeId, channelId, postId, commentId);
    if (videoThumb != null && videoThumb != undefined){
      this.storeService.remove(videoThumb.videoThumbKey);
      let videoKey = this.getVideoKey(nodeId,channelId,postId,commentId,0);
      this.storeService.remove(videoKey);
    }
  }

  updateSubscribedChannelsKey(){
    let keys: string[] = Object.keys(subscribedChannelsMap) || [];

    for (let index = 0; index < keys.length; index++) {
      let key = keys[index];
      if(subscribedChannelsMap[key] == undefined){
        delete subscribedChannelsMap[key];
        continue;
      }

      let channel = subscribedChannelsMap[key];
      let nodeId = channel.nodeId;
      let channelId = channel.id;

      let newKey = this.getChannelId(nodeId, channelId);


      if(key == newKey)
        continue;

      subscribedChannelsMap[newKey] = channel;
      delete subscribedChannelsMap[key];
    }
    this.storeService.set(PersistenceKey.subscribedChannelsMap, subscribedChannelsMap);
  }

  updateChannelsKey(){
    let keys: string[] = Object.keys(channelsMap) || [];

    for (let index = 0; index < keys.length; index++) {
      let key = keys[index];
      if(channelsMap[key] == undefined){
        delete channelsMap[key];
        continue;
      }

      if(unreadMap[key] == undefined){
        delete unreadMap[key];
      }

      let channel = channelsMap[key];
      let nodeId = channel.nodeId;
      let channelId = channel.id;

      let newKey = this.getChannelId(nodeId, channelId);


      if(key == newKey)
        continue;

      let unreadNumber = unreadMap[key];
      unreadMap[newKey] = unreadNumber;
      delete unreadMap[key];

      channelsMap[newKey] = channel;
      delete channelsMap[key];
    }

    this.storeService.set(PersistenceKey.channelsMap, channelsMap);
    this.storeService.set(PersistenceKey.unreadMap, unreadMap);
  }

  updateMyChannelsKey(){
    let keys: string[] = Object.keys(myChannelsMap) || [];

    for (let index = 0; index < keys.length; index++) {
      let key = keys[index];
      if(myChannelsMap[key] == undefined){
        delete myChannelsMap[key];
        continue;
      }

      let channel = myChannelsMap[key];
      let nodeId = channel.nodeId;
      let channelId = channel.channelId;

      let newKey = this.getChannelId(nodeId, channelId);


      if(key == newKey)
        continue;

      myChannelsMap[newKey] = channel;
      delete myChannelsMap[key];
    }
    this.storeService.set(PersistenceKey.myChannelsMap, myChannelsMap);
  }

  updateLikeCommentKey(){
    let keys: string[] = Object.keys(likeCommentMap) || [];

    for (let index = 0; index < keys.length; index++) {
      let key = keys[index];
      if(likeCommentMap[key] == undefined){
        delete likeCommentMap[key];
        continue;
      }

      let likedComment = likeCommentMap[key];
      let nodeId = likedComment.nodeId;
      let channelId = likedComment.channel_id;
      let postId = likedComment.post_id;
      let commentId = likedComment.id;

      let newKey = this.getCommentId(nodeId, channelId, postId, commentId);

      if(key == newKey)
        continue;

      likeCommentMap[newKey] = likedComment;
      delete likeCommentMap[key];
    }
    this.storeService.set(PersistenceKey.likeCommentMap, likeCommentMap);
  }

  updateLikeKey(){
    let keys: string[] = Object.keys(likeMap) || [];

    for (let index = 0; index < keys.length; index++) {
      let key = keys[index];
      if(likeMap[key] == undefined){
        delete likeMap[key];
        continue;
      }

      let like:any = likeMap[key];
      let nodeId = like.nodeId;
      let channelId = like.channel_id;
      let postId = like.id;
      let commentId = 0;

      let newKey = this.getCommentId(nodeId, channelId, postId, commentId);

      if(key == newKey)
        continue;

        likeMap[newKey] = {
          nodeId    : nodeId,
          channelId : channelId,
          postId    : postId,
          commentId : 0
        };
      delete likeMap[key];
    }
    this.storeService.set(PersistenceKey.likeMap, likeMap);
  }

  updatePostUpdateKey(){
    let keys: string[] = Object.keys(lastPostUpdateMap) || [];

    for (let index = 0; index < keys.length; index++) {
      let key = keys[index];
      if(lastPostUpdateMap[key] == undefined){
        delete lastPostUpdateMap[key];
        continue;
      }

      let lastPostUpdate = lastPostUpdateMap[key];
      let nodeId = lastPostUpdate.nodeId;
      let channelId = lastPostUpdate.channelId;

      let newKey = this.getChannelId(nodeId, channelId);

      if(key == newKey)
        continue;

      lastPostUpdateMap[newKey] = lastPostUpdate;
      delete lastPostUpdateMap[key];
    }

    this.storeService.set(PersistenceKey.lastPostUpdateMap, lastPostUpdateMap);
  }

  updateLastCommentUpdateKey(){
    let keys: string[] = Object.keys(this.lastCommentUpdateMap) || [];

    for (let index = 0; index < keys.length; index++) {
      let key = keys[index];
      if(this.lastCommentUpdateMap[key] == undefined){
        delete this.lastCommentUpdateMap[key];
        continue;
      }

      let lastCommentUpdate = this.lastCommentUpdateMap[key];
      let nodeId = lastCommentUpdate.nodeId;
      let channelId = lastCommentUpdate.channelId;
      let postId = lastCommentUpdate.postId;

      let newKey = this.getPostId(nodeId, channelId, postId);

      if(key == newKey)
        continue;

      this.lastCommentUpdateMap[newKey] = lastCommentUpdate;
      delete this.lastCommentUpdateMap[key];
    }

    this.storeService.set(PersistenceKey.lastCommentUpdateMap, this.lastCommentUpdateMap);
  }

  updateLastPostUpdate(key: string, nodeId: string, channelId: number, updatedAt: number){
    if (lastPostUpdateMap[key] == undefined){
      lastPostUpdateMap[key] = {
        nodeId: nodeId,
        channelId: channelId,
        time:updatedAt + 1
      }
    }else{
      let oldTime = lastPostUpdateMap[key].time || 0;
      if (oldTime > updatedAt){
        return ;
      }

      lastPostUpdateMap[key].time = updatedAt + 1;
    }

    this.storeService.set(PersistenceKey.lastPostUpdateMap, lastPostUpdateMap);
  }

  updateLastFeedUpdate(nodeId: string, updatedAt: number){
    if (this.lastFeedUpdateMap[nodeId] == undefined){
      this.lastFeedUpdateMap[nodeId] = {
        nodeId: nodeId,
        time: updatedAt + 1
      }
    } else{
      let oldTime = this.lastFeedUpdateMap[nodeId].time || 0;
      if (oldTime > updatedAt){
        return ;
      }
      this.lastFeedUpdateMap[nodeId].time = updatedAt + 1;
    }

    this.storeService.set(PersistenceKey.lastFeedUpdateMap, this.lastFeedUpdateMap);
  }

  updateLastCommentUpdate(key: string, nodeId: string, channelId: number, postId: number, updatedAt: number){
    if (this.lastCommentUpdateMap[key] == undefined){
      this.lastCommentUpdateMap[key] = {
        nodeId: nodeId,
        channelId: channelId,
        postId: postId,
        time: updatedAt + 1
      }
    }else{
      let oldTime = this.lastCommentUpdateMap[key].time || 0;
      if (oldTime > updatedAt){
        return ;
      }
      this.lastCommentUpdateMap[key].time = updatedAt + 1;
    }
    this.storeService.set(PersistenceKey.lastCommentUpdateMap, this.lastCommentUpdateMap);
  }

  handleSessionError(nodeId: string, error: any){
    // eventBus.publish("sessionResponse:error",nodeId, error);
    this.translateBinaryError(nodeId,error.code);
    this.closeSession(nodeId);
    this.logUtils.logd("Session error :: nodeId : "+nodeId+" errorCode: "+error.code+" errorMessage:"+error.message, TAG);
  }

  createVideoContent(postText: string, videoThumb: any, durition: number, videoSize: number): string{
    let videoThumbs: FeedsData.VideoThumb = {
      videoThumb  :   videoThumb,
      duration    :   durition,
      videoSize   :   videoSize
    };
    return this.createContent(postText, null, videoThumbs);
  }

  createOneImgContent(postText: string, imageThumb: any, imageSize: number): string{
    let imgThumbs: FeedsData.ImgThumb[] = [];
    let imgThumb: FeedsData.ImgThumb = {
      index   : 0,
      imgThumb: imageThumb,
      imgSize : imageSize
    }
    imgThumbs.push(imgThumb);

    return this.createContent(postText,imgThumbs,null);
  }

  processGetBinary(nodeId: string, channelId: number, postId: number, commentId: number,
    index: number, mediaType: FeedsData.MediaType, key: string, onSuccess: (transDataChannel: FeedsData.TransDataChannel)=> void, onError:(err: string) => void){
    if(this.getServerStatusFromId(nodeId) == 1){
      // this.native.toast(this.formatInfoService.formatOfflineMsg(this.getServerNameByNodeId(nodeId)));
      onError(nodeId + "offline");
      return;
    }

    let size = this.getContentDataSize(nodeId, channelId, postId, commentId, index, mediaType);
    if (size > this.throwMsgTransDataLimit){
      this.restoreSession(nodeId);
      onSuccess(FeedsData.TransDataChannel.SESSION);
      return;
    }

    this.getBinaryFromMsg(nodeId, key);
    onSuccess(FeedsData.TransDataChannel.MESSAGE);
    return;
  }

  translateBinaryError(nodeId: string, errorCode: number){
    let errorMsg = this.translate.instant("ErrorInfo.UnknownError");
    switch(errorCode){
      case FeedsData.SessionError.UnknownError:
        errorMsg = this.translate.instant("ErrorInfo.UnknownError");
        break;
      case FeedsData.SessionError.UnimplementedError:
        errorMsg = this.translate.instant("ErrorInfo.UnimplementedError");
        break;
      case FeedsData.SessionError.NotFoundError:
        errorMsg = this.translate.instant("ErrorInfo.NotFoundError");
        break;
      case FeedsData.SessionError.InvalidArgument:
        errorMsg = this.translate.instant("ErrorInfo.InvalidArgument");
        break;
      case FeedsData.SessionError.PointerReleasedError:
        errorMsg = this.translate.instant("ErrorInfo.PointerReleasedError");
        break;
      case FeedsData.SessionError.DevUUIDError:
        errorMsg = this.translate.instant("ErrorInfo.DevUUIDError");
        break;
      case FeedsData.SessionError.FileNotExistsError:
        errorMsg = this.translate.instant("ErrorInfo.FileNotExistsError");
        break;
      case FeedsData.SessionError.CreateDirectoryError:
        errorMsg = this.translate.instant("ErrorInfo.CreateDirectoryError");
        break;
      case FeedsData.SessionError.SizeOverflowError:
        errorMsg = this.translate.instant("ErrorInfo.SizeOverflowError");
        break;
      case FeedsData.SessionError.StdSystemError:
        errorMsg = this.translate.instant("ErrorInfo.StdSystemError");
        break;
      case FeedsData.SessionError.OutOfMemoryError:
        errorMsg = this.translate.instant("ErrorInfo.OutOfMemoryError");
        break;
      case FeedsData.SessionError.DidNotReady:
        errorMsg = this.translate.instant("ErrorInfo.DidNotReady");
        break;
      case FeedsData.SessionError.InvalidAccessToken:
        errorMsg = this.translate.instant("ErrorInfo.InvalidAccessToken");
        break;
      case FeedsData.SessionError.NotAuthorizedError:
        errorMsg = this.translate.instant("ErrorInfo.NotAuthorizedError");
        break;
      case FeedsData.SessionError.CarrierSessionInitFailed:
        errorMsg = this.translate.instant("ErrorInfo.CarrierSessionInitFailed");
        break;
      case FeedsData.SessionError.CarrierSessionConnectFailed:
        errorMsg = this.translate.instant("ErrorInfo.CarrierSessionConnectFailed");
        break;
      case FeedsData.SessionError.CarrierSessionCreateFailed:
        errorMsg = this.translate.instant("ErrorInfo.CarrierSessionCreateFailed");
        break;
      case FeedsData.SessionError.CarrierSessionAddStreamFailed:
        errorMsg = this.translate.instant("ErrorInfo.CarrierSessionAddStreamFailed");
        break;
      case FeedsData.SessionError.CarrierSessionTimeoutError:
        errorMsg = this.translate.instant("ErrorInfo.CarrierSessionTimeoutError");
        break;
      case FeedsData.SessionError.CarrierSessionReplyFailed:
        errorMsg = this.translate.instant("ErrorInfo.CarrierSessionReplyFailed");
        break;
      case FeedsData.SessionError.CarrierSessionStartFailed:
        errorMsg = this.translate.instant("ErrorInfo.CarrierSessionStartFailed");
        break;
      case FeedsData.SessionError.CarrierSessionBadStatus:
        errorMsg = this.translate.instant("ErrorInfo.CarrierSessionBadStatus");
        break;
      case FeedsData.SessionError.CarrierSessionDataNotEnough:
        errorMsg = this.translate.instant("ErrorInfo.CarrierSessionDataNotEnough");
        break;
      case FeedsData.SessionError.CarrierSessionUnsuppertedVersion:
        errorMsg = this.translate.instant("ErrorInfo.CarrierSessionUnsuppertedVersion");
        break;
      case FeedsData.SessionError.CarrierSessionReleasedError:
        errorMsg = this.translate.instant("ErrorInfo.CarrierSessionReleasedError");
        break;
      case FeedsData.SessionError.CarrierSessionSendFailed:
        errorMsg = this.translate.instant("ErrorInfo.CarrierSessionSendFailed");
        break;
      case FeedsData.SessionError.CarrierSessionErrorExists:
        errorMsg = this.translate.instant("ErrorInfo.CarrierSessionErrorExists");
        break;
      case FeedsData.SessionError.MassDataUnknownReqFailed:
        errorMsg = this.translate.instant("ErrorInfo.MassDataUnknownReqFailed");
        break;
      case FeedsData.SessionError.MassDataUnmarshalReqFailed:
        errorMsg = this.translate.instant("ErrorInfo.MassDataUnmarshalReqFailed");
        break;
      case FeedsData.SessionError.MassDataMarshalRespFailed:
        errorMsg = this.translate.instant("ErrorInfo.MassDataMarshalRespFailed");
        break;
      case FeedsData.SessionError.MassDataUnsupportedVersion:
        errorMsg = this.translate.instant("ErrorInfo.MassDataUnsupportedVersion");
        break;
      case FeedsData.SessionError.MassDataUnsupportedAlgo:
        errorMsg = this.translate.instant("ErrorInfo.MassDataUnsupportedAlgo");
        break;
      case FeedsData.SessionError.STREAM_STATE_DEACTIVATED:
        errorMsg = this.translate.instant("ErrorInfo.STREAM_STATE_DEACTIVATED");
        break;
      case FeedsData.SessionError.STREAM_STATE_CLOSED:
        errorMsg = this.translate.instant("ErrorInfo.STREAM_STATE_CLOSED");
        break;
      case FeedsData.SessionError.STREAM_STATE_ERROR:
        errorMsg = this.translate.instant("ErrorInfo.STREAM_STATE_ERROR");
        break;
      case FeedsData.SessionError.WRITE_DATA_ERROR:
        errorMsg = this.translate.instant("ErrorInfo.WRITE_DATA_ERROR");
        break;
      case FeedsData.SessionError.SESSION_CREATE_TIMEOUT:
        errorMsg = this.translate.instant("ErrorInfo.SESSION_CREATE_TIMEOUT");
        break;
      case FeedsData.SessionError.SESSION_NEW_SESSION_ERROR:
        errorMsg = this.translate.instant("ErrorInfo.SESSION_NEW_SESSION_ERROR");
        break;
      case FeedsData.SessionError.SESSION_ADD_STREAM_ERROR:
        errorMsg = this.translate.instant("ErrorInfo.SESSION_ADD_STREAM_ERROR");
        break;
      case FeedsData.SessionError.SESSION_REQUEST_ERROR:
        errorMsg = this.translate.instant("ErrorInfo.SESSION_REQUEST_ERROR");
        break;
      case FeedsData.SessionError.SESSION_START_ERROR:
        errorMsg = this.translate.instant("ErrorInfo.SESSION_START_ERROR");
        break;
    }
    this.native.toastWarn(this.formatInfoService.formatErrorMsg(this.getServerNameByNodeId(nodeId),errorMsg));
  }

  checkBindingServerVersion(quit:any): boolean{
    this.logUtils.logw("Binded server is "+JSON.stringify(bindingServer));
    if (bindingServer == null || bindingServer == undefined)
      return;

    if (this.serverVersions == null || this.serverVersions == undefined || this.serverVersions[bindingServer.nodeId] == undefined)
      return;

    let serverVersion = this.getServerVersionByNodeId(bindingServer.nodeId);
    let currentVC = this.getServerVersionCodeByNodeId(bindingServer.nodeId)
    // let currentVC = this.serverVersions[bindingServer.nodeId].versionCode;
    if (serverVersion == "" || currentVC < versionCode){
      this.popupProvider.ionicAlert(
        this,
        "",
        "common.mustUpdate",
        quit,
        'tskth.svg'
      ).then((popover)=>{
        this.alertPopover = popover;
      });
      return false;
    }
    return true;
  }

  hideAlertPopover(){
    if (this.alertPopover!=null && this.alertPopover!= undefined){
      this.alertPopover.dismiss();
    }
  }

  getServerVersionByNodeId(nodeId: string){
    if (this.serverVersions == null ||
      this.serverVersions == undefined ||
      this.serverVersions[nodeId] == undefined){
        return "";
    }
    let version = this.serverVersions[nodeId].versionName||"";
    return version;
  }

  getServerVersionCodeByNodeId(nodeId: string): number{
    if (this.serverVersions == null ||
      this.serverVersions == undefined||
      this.serverVersions[nodeId] == undefined)
        return -1;
    let serverVersionCode = this.serverVersions[nodeId].versionCode||-1;
    return serverVersionCode;
  }

  standardSignIn(nodeId: string){
    this.standardAuth.getInstanceDIDDoc().then((didDocument)=>{
      this.logUtils.logd("getInstanceDIDDoc didDocument is "+didDocument,TAG);
      this.connectionService.standardSignIn(this.getServerNameByNodeId(nodeId),nodeId, didDocument);
    })
  }

  standardDidAuth(nodeId: string, verifiablePresentation: string){
    this.connectionService.standardDidAuth(this.getServerNameByNodeId(nodeId),nodeId,verifiablePresentation, this.getSignInData().name);
  }

  getMultiComments(nodeId: string, channelId: number, postId: number, by: Communication.field,
                  upperBound: number, lowerBound: number,maxCounts:number){
    if(!this.hasAccessToken(nodeId))
      return;
    let accessToken: FeedsData.AccessToken = accessTokenMap[nodeId]||undefined;
    this.connectionService.getMultiComments(this.getServerNameByNodeId(nodeId), nodeId, channelId, postId, by, upperBound, lowerBound, maxCounts, accessToken);
  }
}