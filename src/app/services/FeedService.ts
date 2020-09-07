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

declare let didManager: DIDPlugin.DIDManager;
declare let appManager: AppManagerPlugin.AppManager;
declare let didSessionManager: DIDSessionManagerPlugin.DIDSessionManager;

let subscribedChannelsMap:{[nodeChannelId: string]: Channels};
let channelsMap:{[nodeChannelId: string]: Channels} ;
let myChannelsMap:{[nodeChannelId: string]: MyChannel};
let unreadMap:{[nodeChannelId: string]: number};
let postKeyMap: {[nodeChannelPostId: string]: PostKey};
let serverStatisticsMap:{[nodeId: string]: ServerStatistics};
let commentsMap:{[nodeId: string]: NodeChannelPostComment};
let serversStatus:{[nodeId: string]: ServerStatus};
let creationPermissionMap:{[nodeId: string]: boolean};
let likeMap:{[nodechannelpostId:string]:Post};
let likeCommentMap:{[nodechannelpostCommentId: string]: LikedComment};
let lastPostUpdateMap:{[nodeChannelId:string]: PostUpdateTime};
let friendConnectionMap: {[nodeId:string]: ConnState};

let localSubscribedList:Channels[] = new Array<Channels>();
let localMyChannelList:Channels[] = new Array<Channels>();
let localChannelsList:Channels[] = new Array<Channels>();
let localPostList:Post[] = new Array<Post>();
let bindingServer: Server;
let bindingServerCache: Server;

let serverMap: {[nodeId: string]: Server};

let accessTokenMap:{[nodeId:string]:AccessToken};
let signInServerList = [];

let notificationList:Notification[] = [];

let cacheBindingAddress: string = "";
let localCredential: string = undefined;
let isBindServer: boolean = false ;

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

type AccessToken = {
  token: string ;
  exp: number ;
  isExpire: boolean;
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
    nodeId     : string,
    channel_id : number,
    post_id    : number,
    id         : number,
    comment_id : number | null,
    user_name  : string,
    content    : any,
    likes      : number,
    created_at : number
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
    nodeId     : string,
    channel_id : number,
    id         : number,
    content    : any,
    comments   : number,
    likes      : number,
    created_at : number
}

type PostKey = {
  created_at: number;
}

type ServerStatistics = {
  did               : string,
  connecting_clients: number
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

// let cacheServer: Server;


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

enum ConnState {
  connected = 0,
  disconnected = 1
};

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

  updataComment = "feeds:updataComment",

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

  editFeedInfoFinish = "feeds:editFeedInfoFinish"
}

enum PersistenceKey{
  ///////////////////////////////
  signInData = "signInData",
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
}

let expDay = 10;

let eventBus = null;

let currentFeedEventKey: string = "";
// let currentCreateTopicNID = "";

let postEventTmp: FeedEvents;
let localSignInData: SignInData = undefined;

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
  public currentLang:string ="";
  public curtab:string ="home";
  public channelInfo:any ={};
  public postMap: any;
  public testMode = true;
  private nonce = "";
  private realm = "";
  private serviceNonce = "";
  private serviceRealm = "";
  private profileIamge = "assets/images/profile-1.svg";
  private selsectIndex = 1;
  private carrierStatus:ConnState = ConnState.disconnected;
  private networkStatus:ConnState = ConnState.disconnected;
  private connectionStatus = ConnState.disconnected ;
  private lastConnectionStatus = ConnState.connected ;
  private isLogging: {[nodeId: string]: boolean} = {}; 
  private signinChallengeTimeout: NodeJS.Timer;
  private autoSigninInterval;
  private isSavingChannel:boolean = false;
  private isDeclearing = false;
  private declareOwnerTimeout: NodeJS.Timer;
  private declareOwnerInterval: NodeJS.Timer;
  private isDeclareFinish: boolean = false;
  private lastFeedUpdateMap:{[nodeId:string]: FeedUpdateTime};
  private lastCommentUpdateMap:{[nodeChannelPostId: string]: CommentUpdateTime};
  public constructor(
    private serializeDataService: SerializeDataService,
    private jwtMessageService: JWTMessageService,
    private platform: Platform,
    private events: Events,
    private jsonRPCService: JsonRPCService,
    private carrierService: CarrierService,
    private native: NativeService,
    private translate: TranslateService,
    private storeService: StorageService
  ) {
    eventBus = events;
    this.init();
  }

  init(){
    this.initData();
    this.initCallback();
  }

  getNetworkStatus(): ConnState{
    return this.networkStatus;
  }

  getCarrierStatus(): ConnState{
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

  loadPostData(){
    return new Promise((resolve, reject) =>{
      let postMap = this.postMap || "";
      if( postMap == ""){
        this.storeService.get(PersistenceKey.postMap).then((mPostMap)=>{
          this.postMap = mPostMap || {};
            resolve();
        });
      }else{
           resolve();
      }
    });
  }

  loadChannelData(){
    return new Promise((resolve, reject) =>{
      let channels = channelsMap || "";
      if( channels == ""){
        this.storeService.get(PersistenceKey.channelsMap).then((mChannelMap)=>{
          channelsMap = mChannelMap || {};
            resolve();
        });
      }else{
           resolve();
      }
    });
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
    if (this.getConnectionStatus() == ConnState.disconnected ||
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
        connecting_clients: 0
      }

    let list = this.getServerList();
    for (let index = 0; index < list.length; index++) {
      if (serverStatisticsMap[list[index].nodeId] == null ||
        serverStatisticsMap[list[index].nodeId] == undefined)
        serverStatisticsMap[list[index].nodeId] ={
          did               : "string",
          connecting_clients: 0
        }
    }

    return serverStatisticsMap;
  }

  getServerStatisticsNumber(nodeId: string): number{
    if (serverStatisticsMap[nodeId] == null || serverStatisticsMap[nodeId] == undefined)
      return 0;

    return serverStatisticsMap[nodeId].connecting_clients;
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
    let keys: string[] = Object.keys(channelsMap);
    for (const index in keys) {
      if (channelsMap[keys[index]] == undefined)
        continue;
      list.push(channelsMap[keys[index]]);
    }
    list.sort((a, b) => Number(b.last_update) - Number(a.last_update));

    return list;
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

  sendRPCMessage(nodeId: string, method: string, params: any, memo: any, isShowOfflineToast: boolean = true){
    if(!this.checkServerConnection(nodeId)){
      this.events.publish("rpcRequest:error");
      if (isShowOfflineToast)
        this.native.toast(this.translate.instant("AddServerPage.serverMsg1") + nodeId + this.translate.instant("AddServerPage.serverMsg2"));
      return;
    }
    this.jsonRPCService.request(
      method,
      nodeId,
      params,
      memo,
      ()=>{

      },
      (error)=>{
         this.events.publish("rpcRequest:error");
         this.native.toast(JSON.stringify(error));
      });
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
      //console.log("connectionChanged===> friendId =>"+friendId +"; friendStatus =>"+friendStatus);
      let lastConnectStatus = this.getFriendConnection(friendId);
      
      if (friendConnectionMap == null || friendConnectionMap == undefined)
        friendConnectionMap = {};

      friendConnectionMap[friendId] = friendStatus;
      if(serversStatus == null ||serversStatus == undefined)
        serversStatus = {}

      serversStatus[friendId] = {
        nodeId: friendId,
        did: "string",
        status: friendStatus
      }
      let mServerMap = serverMap || {};
      let server = mServerMap[friendId]||"";
      if (server != "" )
        this.doFriendConnection(friendId, friendStatus);  
    });
  }

  doFriendConnection(friendId: string, friendStatus:any){
    if (friendStatus == ConnState.connected){
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
        connecting_clients: 0
      }
    }

    if (serverMap == null || serverMap == undefined)
      serverMap = {}

    if (serverMap[server.nodeId] != undefined){
      this.native.toast("AddServerPage.Serveralreadyadded");
    }else{
      this.native.toast("AddServerPage.Addserversuccess");
    }

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
    if (networkStatus == ConnState.connected && carrierStatus == ConnState.connected){
      this.connectionStatus = ConnState.connected;
    }else if(networkStatus == ConnState.disconnected || carrierStatus == ConnState.disconnected){
      this.connectionStatus = ConnState.disconnected;
    }

    if (this.lastConnectionStatus != this.connectionStatus){
      this.lastConnectionStatus = this.connectionStatus;
      eventBus.publish(PublishType.connectionChanged, this.connectionStatus, Date.now());
    }
  }

  handleError(nodeId: string,error: any){
    eventBus.publish("rpcResponse:error");
    if(typeof error == "string")
      this.native.toastWarn(error);  
    else
      this.processGeneralError(nodeId,error.code);
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
        this.handleGetCommentsResult(nodeId, result, error);
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
            elaAddress        : ""
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


//  signData(data: string, storePass: string): Promise<string> {
//     return new Promise(async (resolve, reject)=>{
//         this.pluginDidDocument.sign(storePass, data,
//             (ret) => {
//                 resolve(ret)
//             }, (err) => {
//                 // reject(DIDHelper.reworkedPluginException(err));
//             },
//         );
//     });
// }

  createPresentation(nonce, realm, onSuccess: (presentation: any)=>void, onError?: (err:any)=>void){
    appManager.sendIntent("credaccess", {}, {}, (response: any) => {
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

  checkServerConnection(nodeId: string): boolean{
    if(friendConnectionMap == null ||
      friendConnectionMap == undefined ||
      friendConnectionMap[nodeId] == undefined||
      friendConnectionMap[nodeId] == ConnState.disconnected)
      return false ;

    return true ;
  }

  getServerbyNodeId(nodeId: string): Server{
    if (serverMap == undefined) {
      return undefined;
    }
    return serverMap[nodeId];
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
    description: string
  ){
    localSignInData = new SignInData(
      did,
      name,
      avatar,
      email,
      telephone,
      location,
      description,
      this.getCurrentTimeNum()+this.getDaysTS(expDay)
    );
    this.storeService.set(PersistenceKey.signInData, localSignInData);
  }

  saveSignInData2(signInData: SignInData) {
    localSignInData = signInData;
    this.storeService.set(PersistenceKey.signInData, signInData);
  }

  cleanSignInData(){
    this.storeService.remove(PersistenceKey.signInData);
  }

  getSignInData(): SignInData {
    return localSignInData;
  }

  initSignInDataAsync(onSuccess:(signInData: SignInData) => void,onError?:(errorData: any) => void){
    if (localSignInData!= null || localSignInData != undefined){
      onSuccess(localSignInData);
      return ;
    }

    this.storeService.get(PersistenceKey.signInData).then((signinData)=>{
      localSignInData = signinData;
      onSuccess(localSignInData);
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
        this.updateFeed(nodeId);
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

    let avatarBin = this.serializeDataService.encodeData(avatar);

    let request: Communication.create_channel_request = {
      version: "1.0",
      method : "create_channel",
      id     : -1,
      params : {
          access_token    : accessTokenMap[nodeId].token,
          name        : name,
          introduction: introduction,
          avatar      : avatarBin
      }
    }
    this.sendRPCMessage(nodeId, request.method, request.params, "");
  }

  publishPost(nodeId: string, channel_id: number, content: any){
    if(!this.hasAccessToken(nodeId))
      return;

    let contentBin = this.serializeDataService.encodeData(content);

    let request: Communication.publish_post_request = {
      version: "1.0",
      method : "publish_post",
      id     : -1,
      params : {
          access_token    : accessTokenMap[nodeId].token,
          channel_id: Number(channel_id),
          content: contentBin,
      }
    }
    this.sendRPCMessage(nodeId, request.method, request.params, "");
  }

  postComment(nodeId: string, channel_id: number, post_id: number,
              comment_id , content: any){
    if(!this.hasAccessToken(nodeId))
      return;

    let contentBin = this.serializeDataService.encodeData(content);

    let request: Communication.post_comment_request = {
      version: "1.0",
      method : "post_comment",
      id     : -1,
      params : {
          access_token    : accessTokenMap[nodeId].token,
          channel_id: channel_id,
          post_id   : post_id,
          comment_id: comment_id,
          content   : contentBin,
      }
    }
    this.sendRPCMessage(nodeId, request.method, request.params, "");
  }

  postLike(nodeId: string, channel_id: number, post_id: number, comment_id: number){
    if(!this.hasAccessToken(nodeId))
      return;

    let request: Communication.post_like_request = {
      version: "1.0",
      method : "post_like",
      id     : -1,
      params : {
          access_token    : accessTokenMap[nodeId].token,
          channel_id: channel_id,
          post_id   : post_id,
          comment_id: comment_id,
      } ,

    }
    this.sendRPCMessage(nodeId, request.method, request.params, "");

    if(!this.checkServerConnection(nodeId)){
      return;
    }
    this.doPostLikeFinish(nodeId, channel_id, post_id, comment_id);
  }

  postUnlike(nodeId:string, channel_id: number, post_id: number, comment_id: number){
    if(!this.hasAccessToken(nodeId))
      return;

    let request: Communication.post_unlike_request = {
      version: "1.0",
      method : "post_unlike",
      id     : -1,
      params : {
          access_token    : accessTokenMap[nodeId].token,
          channel_id: channel_id,
          post_id   : post_id,
          comment_id: comment_id,
      }
    }
    this.sendRPCMessage(nodeId, request.method, request.params, "");

    if(!this.checkServerConnection(nodeId)){
      return;
    }
    this.doPostUnLikeFinish(nodeId, channel_id, post_id, comment_id);
  }

  getMyChannels(nodeId: string, field: Communication.field, upper_bound: number,
                lower_bound: number, max_counts: number){
    if(!this.hasAccessToken(nodeId))
      return;

    let request: Communication.get_my_channels_request = {
      version: "1.0",
      method : "get_my_channels",
      id     : -1,
      params : {
          access_token    : accessTokenMap[nodeId].token,
          by         : field,
          upper_bound: upper_bound,
          lower_bound: lower_bound,
          max_count : max_counts,
      }
    }
    this.sendRPCMessage(nodeId, request.method, request.params,"", false);
  }

  getMyChannelsMetaData(nodeId: string, field: Communication.field, upper_bound: number,
                        lower_bound: number, max_counts: number){
    if(!this.hasAccessToken(nodeId))
      return;

    let request: Communication.get_my_channels_metadata_request = {
      version: "1.0",
      method : "get_my_channels_metadata",
      id     : -1,
      params : {
          access_token    : accessTokenMap[nodeId].token,
          by         : field,
          upper_bound: upper_bound,
          lower_bound: lower_bound,
          max_count : max_counts,
      }
    }
    this.sendRPCMessage(nodeId, request.method, request.params,"" ,false);
  }

  getChannels(nodeId: string, field: Communication.field, upper_bound: number,
              lower_bound: number, max_counts: number){
    if(!this.hasAccessToken(nodeId))
      return;

    let request: Communication.get_channels_request = {
      version: "1.0",
      method : "get_channels",
      id     : -1,
      params : {
          access_token    : accessTokenMap[nodeId].token,
          by         : field,
          upper_bound: upper_bound,
          lower_bound: lower_bound,
          max_count : max_counts,
      }
    }
    this.sendRPCMessage(nodeId, request.method, request.params, "",false);
  }

  getChannelDetail(nodeId: string, id: number){
    if(!this.hasAccessToken(nodeId))
      return;

    let request: Communication.get_channel_detail_request = {
      version: "1.0",
      method : "get_channel_detail",
      id     : -1,
      params : {
          access_token    : accessTokenMap[nodeId].token,
          id: id,
      },
    }
    this.sendRPCMessage(nodeId, request.method, request.params, "", false);
  }

  getSubscribedChannels(nodeId: string, field: Communication.field, upper_bound: number,
                        lower_bound: number, max_counts: number){
    if(!this.hasAccessToken(nodeId))
      return;

    let request: Communication.get_subscribed_channels_request = {
      version: "1.0",
      method : "get_subscribed_channels",
      id     : -1,
      params : {
          access_token   : accessTokenMap[nodeId].token,
          by         : field,
          upper_bound: upper_bound,
          lower_bound: lower_bound,
          max_count : max_counts,
      },
    }
    this.sendRPCMessage(nodeId, request.method, request.params, "", false);
  }

  getPost(nodeId: string, channel_id: number, by: Communication.field,
          upper_bound: number, lower_bound: number , max_counts: number, memo: any){
    if(!this.hasAccessToken(nodeId))
      return;

    let request: Communication.get_posts_request = {
      version: "1.0",
      method : "get_posts",
      id     : -1,
      params : {
          access_token    : accessTokenMap[nodeId].token,
          channel_id : Number(channel_id),
          by         : by,
          upper_bound: upper_bound,
          lower_bound: lower_bound,
          max_count : max_counts,
      },
    }
    this.sendRPCMessage(nodeId, request.method, request.params, memo, false);
  }

  getComments(nodeId: string, channel_id: number, post_id: number,
              by:Communication.field, upper_bound: number, lower_bound: number, max_counts:number, isShowOfflineToast: boolean){
    if(!this.hasAccessToken(nodeId))
      return;

    let request:Communication.get_comments_request = {
      version: "1.0",
      method : "get_comments",
      id     : -1,
      params : {
          access_token    : accessTokenMap[nodeId].token,
          channel_id : channel_id,
          post_id    : post_id,
          by         : by,
          upper_bound: upper_bound,
          lower_bound: lower_bound ,
          max_count : max_counts,
      },
    }
    this.sendRPCMessage(nodeId, request.method, request.params, "", isShowOfflineToast);
  }

  getStatistics(nodeId: string){
    if(!this.hasAccessToken(nodeId))
      return;

    let request:Communication.get_statistics_request = {
      version: "1.0",
      method : "get_statistics",
      id     : -1,
      params : {
        access_token    : accessTokenMap[nodeId].token
      },
    }
    this.sendRPCMessage(nodeId, request.method, request.params, "", false);
  }

  subscribeChannel(nodeId: string, id: number){
    if(!this.hasAccessToken(nodeId))
      return;

    let request: Communication.subscribe_channel_request = {
      version: "1.0",
      method : "subscribe_channel",
      id     : -1,
      params : {
          access_token    : accessTokenMap[nodeId].token,
          id: id,
      },
    }
    this.sendRPCMessage(nodeId, request.method, request.params,"");

    if(!this.checkServerConnection(nodeId)){
      return;
    }

    this.doSubscribeChannelFinish(nodeId, id);
  }

  unsubscribeChannel(nodeId: string, id: number){
    if(!this.hasAccessToken(nodeId))
      return;

    let request: Communication.unsubscribe_channel_request = {
      version: "1.0",
      method : "unsubscribe_channel",
      id     : -1,
      params : {
          access_token    : accessTokenMap[nodeId].token,
          id: id
      },
    }
    this.sendRPCMessage(nodeId, request.method, request.params,"");

    if(!this.checkServerConnection(nodeId)){
      return;
    }

    this.doUnsubscribeChannelFinish(nodeId, id);
  }

  editFeedInfo(nodeId: string, channelId: number, name: string , desc: string, avatar: any){
    if(!this.hasAccessToken(nodeId))
    return;

    let avatarBin = this.serializeDataService.encodeData(avatar);

    let request: Communication.update_feedinfo_request = {
      version: "1.0",
      method : "update_feedinfo",
      id     : -1,
      params : {
          access_token: accessTokenMap[nodeId].token,
          id          : channelId, //channelId
          name        : name,
          introduction: desc,
          avatar      : avatarBin
      } 
    }
    this.sendRPCMessage(nodeId, request.method, request.params,"");
  }
  

  enableNotification(nodeId: string){
    if(!this.hasAccessToken(nodeId))
      return;

    let request: Communication.enable_notification_request = {
      version: "1.0",
      method : "enable_notification",
      id     : -1,
      params : {
        access_token   : accessTokenMap[nodeId].token
      },
    }
    this.sendRPCMessage(nodeId, request.method, request.params,"");
  }

  ////handle push
  handleNewPostNotification(nodeId: string, params: any){
    let channel_id: number = params.channel_id;
    let id: number = params.id;
    let contentBin:any = params.content;
    let created_at: number = params.created_at;

    let content = this.serializeDataService.decodeData(contentBin);
    let contentText = this.parsePostContentText(content);
    let contentImage = this.parsePostContentImg(content);

    let postId = this.getPostId(nodeId, channel_id, id);
    this.postMap[postId] = {
      nodeId     : nodeId,
      channel_id : channel_id,
      id         : id,
      content    : contentText,
      comments   : 0,
      likes      : 0,
      created_at : created_at*1000
    }

    this.storeService.savePostContentImg(postId, contentImage);

    let nodeChannelId = nodeId+channel_id;
    if (lastPostUpdateMap[nodeChannelId] == undefined){
      lastPostUpdateMap[nodeChannelId] = {
        nodeId:nodeId,
        channelId:channel_id,
        time:created_at*1000
      }
    }else{
      lastPostUpdateMap[nodeChannelId].time = created_at;
    }
    
    this.storeService.set(PersistenceKey.lastPostUpdateMap,lastPostUpdateMap);

    this.storeService.set(PersistenceKey.postMap, this.postMap);

    if (!this.checkChannelIsMine(nodeId, channel_id))
      unreadMap[nodeChannelId] = unreadMap[nodeChannelId]+1;

    this.storeService.set(PersistenceKey.unreadMap,unreadMap);

    eventBus.publish(PublishType.postDataUpdate);
  }

  handleNewCommentNotification(nodeId: string, params: any){
    let channel_id: number= params.channel_id;
    let post_id: number = params.post_id;
    let id: number = params.id;
    let comment_id: number = params.comment_id;
    let contentBin: any = params.content;
    let user_name: any = params.user_name;
    let create_at: number = params.created_at;

    let content = this.serializeDataService.decodeData(contentBin);

    if (commentsMap == null || commentsMap == undefined)
      commentsMap = {};
    if (commentsMap[nodeId] == null || commentsMap[nodeId] == undefined)
      commentsMap[nodeId] = {};
    if (commentsMap[nodeId][channel_id] == null || commentsMap[nodeId][channel_id] == undefined)
      commentsMap[nodeId][channel_id] = {};
    if (commentsMap[nodeId][channel_id][post_id] == null || commentsMap[nodeId][channel_id][post_id]==undefined)
      commentsMap[nodeId][channel_id][post_id] = {};

    commentsMap[nodeId][channel_id][post_id][id] = {
      nodeId     : nodeId,
      channel_id : channel_id,
      post_id    : post_id,
      id         : id,
      comment_id : comment_id,
      user_name  : user_name,
      content    : content,
      likes      : 0,
      created_at : create_at*1000
    }

    let ncpId = nodeId + channel_id +"-"+post_id;
    if (this.lastCommentUpdateMap[ncpId] == undefined){
      this.lastCommentUpdateMap[ncpId] = {
        nodeId: nodeId,
        channelId: channel_id,
        postId: post_id,
        time: create_at*1000
      }
    }else{
      this.lastCommentUpdateMap[ncpId].time = create_at;
    }
    this.storeService.set(PersistenceKey.lastCommentUpdateMap, this.lastCommentUpdateMap);
    

    let postId = this.getPostId(nodeId, channel_id, post_id);
    this.postMap[postId].comments = this.postMap[postId].comments+1;
    if (likeMap[postId] != null && likeMap[postId] != undefined){
      likeMap[postId] = this.postMap[postId];
      this.storeService.set(PersistenceKey.likeMap, likeMap);
      eventBus.publish(PublishType.updateLikeList, this.getLikeList());
    }

    this.storeService.set(PersistenceKey.postMap,this.postMap);
    eventBus.publish(PublishType.postDataUpdate);

    this.storeService.set(PersistenceKey.commentsMap, commentsMap);
    eventBus.publish(PublishType.commentDataUpdate);

    eventBus.publish(PublishType.updataComment,nodeId,channel_id,post_id,this.postMap[postId].comments);

    this.generateNotification(nodeId, channel_id, post_id,id,user_name,Behavior.comment,this.translate.instant("NotificationPage.commentPost"))  
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
        likeMap[postId] = this.postMap[postId];
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

    let nodeChannelId = nodeId + channelId || "";

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

  handleNotification(nodeId: string, method: string, params: any){
    switch(method){
      case FeedsData.MethodType.newPost:
        this.handleNewPostNotification(nodeId, params);
        break;
      case FeedsData.MethodType.newComment:
        this.handleNewCommentNotification(nodeId,params);
        break;
      case FeedsData.MethodType.newLikes:
        this.handleNewLikesNotification(nodeId,params);
        break;
      case FeedsData.MethodType.newSubscription:
        this.handleNewSubscriptionNotification(nodeId, params);
        break;
      case FeedsData.MethodType.feedInfoUpdate:
        this.handleNewFeedInfoUpdateNotification(nodeId,params);
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

    let nodeChannelId = nodeId+channelId;

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
    
    let postId = result.id;
    let channelId = request.channel_id;
    let contentBin = request.content;

    let content = this.serializeDataService.decodeData(contentBin);
    let contentText = this.parsePostContentText(content);
    let contentImage = this.parsePostContentImg(content);

    let post:Post = {
      nodeId    : nodeId,
      channel_id: channelId,
      id: postId,
      content: contentText,
      comments: 0,
      likes: 0,
      created_at: this.getCurrentTimeNum()
    }

    let mPostId = this.getPostId(nodeId, channelId, postId);
   
    this.storeService.savePostContentImg(mPostId, contentImage);

    this.postMap[mPostId]=post;

    this.storeService.set(PersistenceKey.postMap, this.postMap);
    
    eventBus.publish(PublishType.postEventSuccess);
    eventBus.publish(PublishType.postDataUpdate);
    eventBus.publish(PublishType.publishPostSuccess);
    eventBus.publish(PublishType.publishPostFinish);
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
        likeMap[mPostId] = this.postMap[mPostId];
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
        likeMap[mPostId] = undefined;
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

      let nodeChannelId = nodeId + id ;

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

      let nodeChannelId = nodeId+id;

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

      let nodeChannelId = nodeId+id;

      if (channelsMap == null || channelsMap == undefined)
        channelsMap = {};


      let avatarBin = result[index].avatar;
      let avatar = this.serializeDataService.decodeData(avatarBin);

      if (channelsMap[nodeChannelId] == undefined){
        channelsMap[nodeChannelId] = {
          nodeId      : nodeId,
          id          : id,
          name        : result[index].name,
          introduction: result[index].introduction,
          owner_name  : result[index].owner_name,
          owner_did   : result[index].owner_did,
          subscribers : result[index].subscribers,
          last_update : result[index].last_update*1000,
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

      if (this.lastFeedUpdateMap[nodeId] == undefined ){
        this.lastFeedUpdateMap[nodeId] = {
          nodeId: nodeId,
          time: channelsMap[nodeChannelId].last_update
        }
      } else{
        this.lastFeedUpdateMap[nodeId].time = result[index].last_update;
      }
    }
    this.storeService.set(PersistenceKey.lastFeedUpdateMap, this.lastFeedUpdateMap);
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

    let nodeChannelId = nodeId + id ;
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

      let nodeChannelId = nodeId+channelId;
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
      let created_at = result[index].created_at;
      let content = this.serializeDataService.decodeData(contentBin);
      let contentText = this.parsePostContentText(content);
      let contentImage = this.parsePostContentImg(content);

      let mPostId = this.getPostId(nodeId, channel_id, id);

      if(this.postMap[mPostId] == undefined){
        let nodeChannelId = nodeId + channel_id;
        if (!this.checkChannelIsMine(nodeId, channel_id))
          unreadMap[nodeChannelId] = unreadMap[nodeChannelId]+1;
      }

      this.postMap[mPostId] = {
        nodeId     : nodeId,
        channel_id : channel_id,
        id         : id,
        content    : contentText,
        comments   : comments,
        likes      : likes,
        created_at : created_at*1000
      }

      this.storeService.savePostContentImg(mPostId,contentImage);

      if (requestAction == RequestAction.defaultAction){
        let nodeChannelId = nodeId+channel_id

        if (lastPostUpdateMap[nodeChannelId] == undefined){
          lastPostUpdateMap[nodeChannelId] = {
            nodeId: nodeId,
            channelId: channel_id,
            time:created_at*1000
          }
        }else{
          lastPostUpdateMap[nodeChannelId].time = created_at;
        }
        
      }
    }


    if (requestAction == RequestAction.refreshPostDetail){
      this.storeService.set(PersistenceKey.postMap, this.postMap);
      eventBus.publish(PublishType.refreshPostDetail);
      return ;
    }

    if (requestAction == RequestAction.defaultAction){
      this.storeService.set(PersistenceKey.lastPostUpdateMap, lastPostUpdateMap);
      this.storeService.set(PersistenceKey.postMap, this.postMap);
      eventBus.publish(PublishType.postDataUpdate);
      return ;
    }


  }

  handleGetCommentsResult(nodeId: string, responseResult: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    let result = responseResult.comments;
    for (let index = 0; index < result.length; index++) {
      let channel_id = result[index].channel_id;
      let post_id = result[index].post_id;
      let id         = result[index].id;
      let comment_id = result[index].comment_id;
      let contentBin    = result[index].content;
      let likes = result[index].likes;
      let created_at = result[index].created_at;
      let user_name = result[index].user_name;

      let content = this.serializeDataService.decodeData(contentBin);

      let comment:Comment = {
        nodeId     : nodeId,
        channel_id : channel_id,
        post_id    : post_id,
        id         : id,
        comment_id : comment_id,
        user_name  : user_name,
        content    : content,
        likes      : likes,
        created_at : created_at*1000
      }

      if (commentsMap == null || commentsMap == undefined)
        commentsMap = {};
      if (commentsMap[nodeId] == null || commentsMap[nodeId] == undefined)
        commentsMap[nodeId] = {};
      if (commentsMap[nodeId][channel_id] == null || commentsMap[nodeId][channel_id] == undefined)
        commentsMap[nodeId][channel_id] = {}
      if (commentsMap[nodeId][channel_id][post_id] == null || commentsMap[nodeId][channel_id][post_id] == undefined)
        commentsMap[nodeId][channel_id][post_id] = {}

      commentsMap[nodeId][channel_id][post_id][id] = comment;



      let ncpId = nodeId + channel_id +"-"+post_id;
      if (this.lastCommentUpdateMap[ncpId] == undefined){
        this.lastCommentUpdateMap[ncpId] = {
          nodeId: nodeId,
          channelId: channel_id,
          postId: post_id,
          time: created_at*1000
        }
      }else{
        this.lastCommentUpdateMap[ncpId].time = created_at;
      }
    }

    this.storeService.set(PersistenceKey.lastCommentUpdateMap, this.lastCommentUpdateMap);
    this.storeService.set(PersistenceKey.commentsMap, commentsMap);

    eventBus.publish(PublishType.commentDataUpdate);
  }

  handleGetStatisticsResult(nodeId: string, result: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.handleError(nodeId, error);
      return;
    }

    let serverStatistics: ServerStatistics = {
      did               : result.did,
      connecting_clients: result.connecting_clients
    }

    if (serverStatisticsMap == null || serverStatisticsMap == undefined)
      serverStatisticsMap = {};

    serverStatisticsMap[nodeId] = serverStatistics;

    this.storeService.set(PersistenceKey.serverStatisticsMap, serverStatisticsMap);
    eventBus.publish(PublishType.serverStatisticsChanged,serverStatisticsMap);
  }

  handleSubscribeChannelResult(nodeId: string, request: any, error: any){
    let nodeChannelId = nodeId+request.id;
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

    this.native.toast("common.followSuccess");
  }

  handleUnsubscribeChannelResult(nodeId:string, request: any, error: any){
    let nodeChannelId = nodeId+request.id;
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


    this.native.toast("common.unFollowSuccess");
  }

  handleEditFeedInfo(nodeId: string, request: any, error: any){
    if (error != null && error != undefined && error.code != undefined){
      this.doUnsubscribeChannelError(nodeId, request.id);
      this.handleError(nodeId, error);
      return;
    }

    let channelId = request.id||0;
    let name = request.name||"";
    let desc = request.introduction||"";
    let avatarBin = request.avatar||""

    let avatar = this.serializeDataService.decodeData(avatarBin)||"";

    let nodeChannelId = nodeId + channelId || "";

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
    let nodeChannelId = nodeId+channelId;

    channelsMap[nodeChannelId].isSubscribed = true;

    let subscribeNum = channelsMap[nodeChannelId].subscribers;
    channelsMap[nodeChannelId].subscribers = subscribeNum + 1;

    eventBus.publish(PublishType.subscribeFinish, nodeId, channelId, channelsMap[nodeChannelId].name);
  }

  doSubscribeChannelError(nodeId: string, channelId: number){
    let nodeChannelId = nodeId+channelId;
    channelsMap[nodeChannelId].isSubscribed = false;

    let subscribeNum = channelsMap[nodeChannelId].subscribers;
    if (subscribeNum > 0 )
      channelsMap[nodeChannelId].subscribers = subscribeNum - 1;

    eventBus.publish(PublishType.subscribeFinish, nodeId,channelId, channelsMap[nodeChannelId].name);
  }

  doUnsubscribeChannelFinish(nodeId: string, channelId: number){
    let nodeChannelId = nodeId+channelId;
    channelsMap[nodeChannelId].isSubscribed = false;
    let subscribeNum = channelsMap[nodeChannelId].subscribers;
    if (subscribeNum > 0 )
      channelsMap[nodeChannelId].subscribers = subscribeNum - 1;

    eventBus.publish(PublishType.unsubscribeFinish, nodeId, channelId, channelsMap[nodeChannelId].name);
  }

  doUnsubscribeChannelError(nodeId: string, channelId: number){
    let nodeChannelId = nodeId+channelId;
    channelsMap[nodeChannelId].isSubscribed = true;
    let subscribeNum = channelsMap[nodeChannelId].subscribers;
    channelsMap[nodeChannelId].subscribers = subscribeNum + 1;
    eventBus.publish(PublishType.unsubscribeFinish, nodeId, channelId, channelsMap[nodeChannelId].name);
  }

  doPostLikeFinish(nodeId: string, channel_id: number, post_id: number, comment_id: number){
    let mPostId = this.getPostId(nodeId, channel_id, post_id);
    if (comment_id == 0){
      likeMap[mPostId] = this.postMap[mPostId];

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
      likeMap[mPostId] = this.postMap[mPostId];

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
        elaAddress        : ""
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

    let nodeChannelId = nodeId+id;
    return channelsMap[nodeChannelId];
  }

  getPostFromId(nodeId: string, channelId: number, postId: number):Post{
    if (this.postMap == null || this.postMap == undefined || this.postMap == JSON.stringify({}))
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
    localPostList = [];
    for (let index in keys) {
      if (this.postMap[keys[index]] == null || this.postMap[keys[index]] == undefined)
        continue;

      let nodeChannelId = this.postMap[keys[index]].nodeId + this.postMap[keys[index]].channel_id;
      if (subscribedChannelsMap[nodeChannelId] != null || subscribedChannelsMap[nodeChannelId] != undefined)
        list.push(this.postMap[keys[index]]);
    }

    list.sort((a, b) => Number(b.created_at) - Number(a.created_at));
    return list;
  }

  getPostId(nodeId: string, channelId: number, postId: number): string{
    return nodeId+channelId+postId;
  }

  getLikeCommentId(nodeId: string, channelId: number, postId: number, commentId: number): string{
    return nodeId + channelId + postId + commentId;
  }

  getPostListFromChannel(nodeId: string, channelId: number){
    let list: Post[] = [];
    let keys: string[] = Object.keys(this.postMap);
    localPostList = [];
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
      let post = likeMap[keys[index]];
      
      if (post == null || post == undefined)
        continue;
      if (this.getChannelFromId(post.nodeId, post.channel_id) == undefined)
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
    let nodeChannelId = nodeId + channelId;
    let mlastPostUpdateMap = lastPostUpdateMap || "";
    let postUpdate = mlastPostUpdateMap[nodeChannelId]||"";
    let lastPostTime = postUpdate["time"] || 0;
    this.updatePostWithTime(nodeId, channelId, lastPostTime);
  }

  updateFeed(nodeId: string){
    let mLastFeedUpdateMap = this.lastFeedUpdateMap || "";
    let update = mLastFeedUpdateMap[nodeId] || "";
    let lastFeedTime = update["time"] || 0;
    this.updateFeedsWithTime(nodeId,lastFeedTime);
  }

  updateComment(nodeId: string, channelId: number, postId: number){
    let ncpId = nodeId + channelId + "-" + postId;
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

  parsePostContentText(content: string): string{
    let contentObj = this.native.parseJSON(content) || "";
    
    if (contentObj.text != undefined)
      return contentObj.text 

    if (typeof contentObj != 'string')
      return ""

    return contentObj;
  }

  parsePostContentImg(content: any): string{
    if (content == undefined){
      return "";
    }

    if (content.indexOf("img") != -1){
      try {
        let contentObj = JSON.parse(content);
        return contentObj.img;
      } catch(e) {
        console.log("error ==> "+e);
        return "";
      }

    }

    return "";
  }

  publishDid(payload: string, onSuccess?: (ret: any)=>void, onError?: (err:any)=>void) {
    let params = {
        didrequest: JSON.parse(payload)
    }
    let requestStr = JSON.stringify(params);
    let request =  JSON.parse(requestStr);
    appManager.sendIntent("didtransaction", request, {}, onSuccess, onError);
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

    this.native.toast("common.loggingIn");
    let request: Communication.signin_request_challenge_request = {
      version: "1.0",
      method : "signin_request_challenge",
      id     : -1,
      params : {
          iss: this.getSignInData().did,
          credential_required: requiredCredential,
      }
    }
    this.sendRPCMessage(nodeId, request.method, request.params,"");
    // this.isLogging[nodeId] = false;
  }

  signinConfirmRequest(nodeId: string, nonce: string, realm: string, requiredCredential: boolean){
    didSessionManager.authenticate(nonce, realm).then((presentation)=>{
      let request;
      if (requiredCredential){
        request = {
          ver: "1.0",
          method : "signin_confirm_challenge",
          id     : -1,
          params : {
              jws: presentation,
              credential:this.getLocalCredential()
          }
        }
      }else {
        request = {
          ver: "1.0",
          method : "signin_confirm_challenge",
          id     : -1,
          params : {
              jws: presentation,
          }
        }
      }
      this.sendRPCMessage(nodeId, request.method, request.params,"");
    }).catch((err)=>{
      // console.log("err = "+err);
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
      exp: result.exp*1000,
      isExpire: false
    };

    this.storeService.set(PersistenceKey.accessTokenMap, accessTokenMap);

    this.prepare(nodeId);
    this.restoreData(nodeId);

    eventBus.publish("feeds:login_finish", nodeId);
    this.native.toast("AddServerPage.Signinsuccess");
    this.clearSigninTimeout(nodeId);
  }

  startDeclareOwner(nodeId: string, carrierAddress: string, nonce: string){
    this.isDeclareFinish = false;
    this.declareOwnerInterval = setInterval(() => {
      if (this.isDeclareFinish){
        clearInterval(this.declareOwnerInterval);
      }

      if(!this.checkServerConnection(nodeId))
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
    
    isBindServer = true;
    let request: Communication.declare_owner_request = {
      version: "1.0",
      method : "declare_owner",
      id     : -1,
      params : {
          nonce: nonce,
          owner_did: this.getSignInData().did
      }
    }

    cacheBindingAddress = carrierAddress;
    this.sendRPCMessage(nodeId, request.method, request.params,"", false);
  }


  importDidRequest(nodeId: string, mnemonic: string, passphrase: string, index: number){
    let request: Communication.import_did_request = {
      version: "1.0",
      method  : "import_did",
      id      : -1,
      params  : {
        mnemonic: mnemonic,
        passphrase: passphrase,
        index: index
      }
    }

    this.sendRPCMessage(nodeId, request.method, request.params,"");
  }

  createDidRequest(nodeId: string){
    let request: Communication.create_did_request = {
      version: "1.0",
      method  : "import_did",
      id      : -1,
    }

    this.sendRPCMessage(nodeId, request.method, null, "");
  }

  issueCredentialRequest(nodeId: string, credential: any){
    let request: Communication.issue_credential_request = {
      version: "1.0",
      method : "issue_credential",
      id     : -1,
      params : {
          credential: credential,
      }
    }

    this.sendRPCMessage(nodeId, request.method, request.params,"");
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
        // console.log("err =>"+err);
        console.log("error=>"+err);

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
        // console.log("error")
      }

    }).catch((err)=>{
      onError(err);
      // console.log("err = "+err);
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
    this.finishBinding(nodeId);
  }


  issueCredential(nodeId: string, did: string, serverName: string, serverDesc: string,elaAddress:string, onSuccess:()=> void, onError:()=>void) {
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
    appManager.sendIntent("credissue", {
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
        this.issueCredentialRequest(nodeId, response.result.credential);
        onSuccess();
      }
      else {
        onError();
        console.log("Failed to issue a credential - empty credential returned");
        return;
        // this.didDemoService.toast("Failed to issue a credential - empty credential returned");
      }
    }, (err)=>{
      onError();
      console.log("Failed to issue a credential: "+JSON.stringify(err));
      return ;
      // this.didDemoService.toast("Failed to issue a credential: "+JSON.stringify(err));
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
      elaAddress        : ""
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
          elaAddress        : ""
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
      elaAddress        : ""
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
          elaAddress        : ""
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

  getFriendConnection(nodeId: string){
    if(friendConnectionMap == null ||
      friendConnectionMap == undefined ||
      friendConnectionMap[nodeId] == undefined)
      return ConnState.disconnected;
    return friendConnectionMap[nodeId];
  }

  checkExp(mAccessToken: AccessToken): boolean{
    let accessToken = mAccessToken || undefined;
    if(accessToken == undefined){
      return true;
    }

    let exp = accessToken.exp || 0;
    if (exp < this.getCurrentTimeNum()){
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
    // this.queryChannelCreationPermission(friendId);

    this.updateFeed(friendId);
    let list = this.getSubscribedChannelsFromNodeId(friendId);
    for (let index = 0; index < list.length; index++) {
      let channelId = list[index].id;
      this.updatePost(friendId,channelId);

      let postList = this.getPostListFromChannel(friendId,channelId);
      for (let postIndex = 0; postIndex < postList.length; postIndex++) {
        // const element = array[postIndex];
        let post: Post = postList[postIndex];
        let postId: number = post.id;
        this.updateComment(friendId, channelId, postId);
      }
    }

    
    // this.getAllChannelDetails(friendId);
    // this.getChannels(friendId, Communication.field.last_update, 0, 0, 0);
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

  addServer(carrierAddress: string,friendRequest: string,
    name: string, owner: string, introduction: string,
    did: string, feedsUrl: string,
    onSuccess:()=>void, onError?:(err: string)=>void){
    isBindServer = false;
    this.checkIsAlreadyFriends(carrierAddress,(isFriend)=>{
      if (isFriend){
        this.native.toast_trans("AddServerPage.Serveralreadyadded");
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
                this.saveServer(name, owner, introduction,
                                    did, carrierAddress, feedsUrl);
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

  getLikeFromId(nodechannelpostId: string): Post{
    if (likeMap == null || likeMap == undefined)
      likeMap = {};

    return likeMap[nodechannelpostId];
  }

  getLikedCommentFromId(nodeChannelPostCommentId: string): LikedComment{
    if (likeCommentMap == null || likeCommentMap == undefined)
      likeCommentMap = {};
    return likeCommentMap[nodeChannelPostCommentId];
  }

  checkMyLike(nodeId: string, channelId: number, postId: number): boolean{
    if(this.getLikeFromId(nodeId+channelId+postId) == undefined)
      return false;
    return true;
  }

  checkLikedComment(nodeId: string, channelId: number, postId: number, commentId: number): boolean{
    if(this.getLikedCommentFromId(nodeId+channelId+postId+commentId) == undefined)
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
      resolve();
    });
  }

  removeLastPostUpdate(nodeId:string, channelId: number): Promise<any>{
    let nodeChannelId = nodeId + channelId ;
    lastPostUpdateMap[nodeChannelId] = undefined;

    return this.storeService.set(PersistenceKey.lastPostUpdateMap, lastPostUpdateMap);
  }

  removeLastCommentUpdate(nodeId: string, channelId: number, postId: number): Promise<any>{
    let ncpId = nodeId + channelId + "-"+postId;
    this.lastCommentUpdateMap[ncpId] = undefined;
    return this.storeService.set(PersistenceKey.lastCommentUpdateMap,this.lastCommentUpdateMap);
  }

  removeLastFeedUpdate(nodeId: string): Promise<any>{
    this.lastFeedUpdateMap[nodeId] = undefined;
    return this.storeService.set(PersistenceKey.lastFeedUpdateMap,this.lastFeedUpdateMap);
  }

  removeLikeById(nodeId: string, channelId: number, postId: number):Promise<any>{
    let nodechannelpostId = nodeId + channelId + postId;
    likeMap[nodechannelpostId] = undefined;

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

    return this.storeService.set(PersistenceKey.commentsMap, commentsMap);
  }
  removePostById(nodeId: string, channelId: number, postId: number):Promise<any>{
    let nodechannelpostId = nodeId + channelId + postId;
    this.postMap[nodechannelpostId] = undefined;

    return this.storeService.set(PersistenceKey.postMap, this.postMap);
  }

  removeChannelById(nodeId: string, channelId: number):Promise<any>{
    let nodeChannelId = nodeId + channelId;
    channelsMap[nodeChannelId] = undefined;
    return this.storeService.set(PersistenceKey.channelsMap,channelsMap);
  }

  removeMyChannelById(nodeId: string, channelId: number):Promise<any>{
    let nodeChannelId = nodeId + channelId;
    myChannelsMap[nodeChannelId] = undefined;
    return this.storeService.set(PersistenceKey.myChannelsMap, myChannelsMap);
  }

  removeSubscribedChannelById(nodeId: string, channelId: number):Promise<any>{
    let nodeChannelId = nodeId + channelId;
    subscribedChannelsMap[nodeChannelId] = undefined;
    return this.storeService.set(PersistenceKey.subscribedChannelsMap, subscribedChannelsMap);
  }

  removeUnreadStatueById(nodeId: string, channelId: number):Promise<any>{
    let nodeChannelId = nodeId + channelId ;
    unreadMap[nodeChannelId] = 0;
    return this.storeService.set(PersistenceKey.unreadMap, unreadMap);
  }

  removeServerStatisticById(nodeId: string):Promise<any>{
    serverStatisticsMap[nodeId] = undefined;
    return this.storeService.set(PersistenceKey.serverStatisticsMap, serverStatisticsMap);
  }

  removeServerStatusById(nodeId: string):Promise<any>{
    serversStatus[nodeId] = undefined;
    return this.storeService.set(PersistenceKey.serversStatus, serversStatus);
  }

  removeServerById(nodeId: string):Promise<any>{
    serverMap[nodeId] = undefined;
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

  removeBindServer(){

  }

  removeAccessTokenById(nodeId: string):Promise<any>{
    accessTokenMap[nodeId] = undefined;
    return this.storeService.set(PersistenceKey.accessTokenMap, accessTokenMap);
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
    let index = notificationList.indexOf(notification);
    notificationList[index].readStatus = readStatus;
    this.storeService.set(PersistenceKey.notificationList, notificationList);
  }

  deleteNotification(notification: Notification){
    let index = notificationList.indexOf(notification);
    notificationList.splice(index, 1);
    this.storeService.set(PersistenceKey.notificationList, notificationList);
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

  checkChannelIsMine(nodeId: string ,channelId: number): boolean{
    let channel = this.getChannelFromId(nodeId, channelId);
    if (channel.owner_did == this.getSignInData().did)
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

  loadPostContentImg(nodeChannelPostId: string):Promise<any>{
    return this.storeService.loadPostContentImg(nodeChannelPostId);
  }

  pay(receiver: string, amount: number, memo: string, onSuccess: (res:any)=>void, onError: (err: any)=>void){
    let param = {
      receiver: receiver, 
      amount: amount, 
      memo: memo
    }

    appManager.sendIntent("pay", param, {}, 
      (response: any) => {
        onSuccess(response);
      },
      (err)=>{
        onError(err);
      }
    );
  }

  reSavePostMap(){
    let keys: string[] = Object.keys(this.postMap) || [];
    for (let index = 0; index < keys.length; index++) {
      let key = keys[index];
      if(this.postMap[key] == undefined)
        continue;
      let content = this.postMap[key].content;
      let img = this.parsePostContentImg(content);
      if (img != "")
        this.storeService.savePostContentImg(key, img);
      this.postMap[key].content = this.parsePostContentText(content);
    }
    this.storeService.set(PersistenceKey.postMap, this.postMap);
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
        errorMessage = this.translate.instant("ErrorInfo.unsupportedRequests");
        break;  
    }
    this.native.toastWarn(errorMessage);
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
    if (Number(updateCode) < 4){
      this.storeService.remove(PersistenceKey.lastCommentUpdateMap);
      this.storeService.remove(PersistenceKey.lastPostUpdateMap);
      this.storeService.remove(PersistenceKey.lastFeedUpdateMap);
      localStorage.setItem("org.elastos.dapp.feeds.update","4");
    }
  }

  setCurrentLang(currentLang:string){
      this.currentLang = currentLang;
  }

  getCurrentLang(){
   return this.currentLang;
}
}