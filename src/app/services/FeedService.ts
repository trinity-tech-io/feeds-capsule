import { Injectable } from "@angular/core";
import { Platform } from '@ionic/angular';
import { CarrierService } from 'src/app/services/CarrierService';
import { Events } from '@ionic/angular';
import { JsonRPCService } from 'src/app/services/JsonRPCService';
import { StorageService } from 'src/app/services/StorageService';
import { NativeService } from 'src/app/services/NativeService';
import { SerializeDataService } from 'src/app/services/SerializeDataService';
import { JWTMessageService } from 'src/app/services/JWTMessageService';

declare let didManager: DIDPlugin.DIDManager;
declare let appManager: AppManagerPlugin.AppManager;
declare let pluginDidDocument: DIDPlugin.DIDDocument;
declare let pluginDid: DIDPlugin.DID;
declare let didSessionManager: DIDSessionManagerPlugin.DIDSessionManager;

let subscribedChannelsMap:{[nodeChannelId: string]: Channels};
let channelsMap:{[nodeChannelId: string]: Channels} ;
let myChannelsMap:{[nodeChannelId: string]: Channels};
let unreadMap:{[channelId: number]: number};
// let postMap:{[channelId: number]: ChannelPost};
let postMap:{[nodechannelpostId: string]: Post}; //now postId = nodeId+channelId+postId
let serverStatisticsMap:{[nodeId: string]: ServerStatistics};
let commentsMap:{[channelId: number]: ChannelPostComment};
let serversStatus:{[nodeId: string]: ServerStatus};
let creationPermissionMap:{[nodeId: string]: boolean};
let likeMap:{[nodechannelpostId:string]:Post};
let lastPostUpdateMap:{[nodeChannelId:string]: PostUpdateTime};
let friendConnectionMap: {[nodeId:string]: ConnState};
// let accessTokenMap: {[nodeId: string]: string};

let localSubscribedList:Channels[] = new Array<Channels>();
let localMyChannelList:Channels[] = new Array<Channels>();
let localChannelsList:Channels[] = new Array<Channels>();
let localPostList:Post[] = new Array<Post>();
// let bindingServerMap:{[nodeId: string]:Server};
let bindingServer: Server;
let bindingServerCache: Server;

let serverMap: {[nodeId: string]: Server};

let accessTokenMap:{[nodeId:string]:AccessToken};
let signInServerList = [];

let cacheBindingAddress: string = "";
let cacheBindingDid: string = "";
let localCredential: string = "";

type AccessToken = {
  token: string ;
  exp: number ;
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
  time:number;
}

type ServerStatus = {
  nodeId: string,
  did: string,
  status: ConnState
}

type ChannelPostComment = {
  [postId:number]: PostComment
}
type PostComment = {
  [commentId: number]: Comment
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
    channel_id : number,
    post_id    : number,
    id         : number,
    comment_id : number | null,
    user_name  : string,
    content    : any,
    likes      : number,
    created_at : number
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
}

// let cacheServer: Server;


export class DidData{
  constructor(
    public did: string,
    public carrierAddress: string,
    public serviceId: string,
  ){}
}

export class SignInData{
  constructor(
      public did: string,
      public name: string,
      public email: string,
      public telephone: string,
      public location: string,
      public description: string,
      public expiresTS: number) {}
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
  favoriteFeedListChanged = "feeds:favoriteFeedListChanged",
  unsubscribeFinish = "feeds:unsubscribeFinish",
  eventListChanged = "feeds:eventListChanged",
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

  updataPostLike = "feeds:updataPostLike",
  updataComment = "feeds:updataComment",

  updataCommentLike = "feeds:updataCommentLike",

  updateLikeList = "feeds:updateLikeList",

  signInServerListChanged = "feeds:signInServerListChanged",

  friendConnectionChanged = "feeds:friendConnectionChanged",
  publishPostSuccess = "feeds:publishPostSuccess",

  bindServerFinish = "feeds:bindServerFinish"
}

enum PersistenceKey{
  firstInit = "firstInit",

  // {nodeId:{Friend}}
  // serversMap = "serversMap",
  // {nodeId+topic: {FavoriteFeed}}
  favoriteFeedsMap = "favoriteFeedsMap",
  // {nodeId+topic: {AllFeed}}
  allFeedsMap = "allFeedsMap",

  // eventList = "eventList",
  eventsMap = "eventsMap",

  myFeedsMap = "myFeedsMap",
  // myFeedList = "virtrulMyFeeds",
  // myFeedMap = "myFeedMap",

  // {nodeId+topic:[{event},{event}]}
  myEventMap = "myEventMap",

  avatar = "avatar",

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

  serverMap = "serverMap"
}

let expDay = 10;
let connectionStatus = ConnState.disconnected;
let favoriteFeedsMap: object = {};
// let allFeedsMap: object = {} ;
let eventsMap: {} = {};
let myFeedsMap: object = {};
let myEventMap: {} = {};

let fetchList: FavoriteFeed[] = [];
let firstInit: boolean;
let needFetch: boolean = true;
let firstListMyFeed: boolean = true;

let eventBus = null;
let currentFetchFeeds: FavoriteFeed;
// let fetchTopic: string = "";
// let lastFetchTopic: string = "";

let currentFeedEventKey: string = "";
let currentCreateTopicNID = "";

let postEventTmp: FeedEvents;
let localSignInData: SignInData;

// let requestId: number = 0;

@Injectable()
export class FavoriteFeed {
  constructor(
    public nodeId: string,
    public name: string,
    public desc: string,
    public unread: number,
    public lastSeqno: number,
    public lastReceived: string = '',
    public lastEvent: string = '',
    public fetched:boolean) {}
}

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
  // public currentTab = "home";
  public testMode = true;
  private nonce = "";
  private realm = "";
  private serviceNonce = "";
  private serviceRealm = "";
  public constructor(
    private serializeDataService: SerializeDataService,
    private jwtMessageService: JWTMessageService,
    private platform: Platform,
    private events: Events,
    private jsonRPCService: JsonRPCService,
    private carrierService: CarrierService,
    private native: NativeService,
    private storeService: StorageService) {
      eventBus = events;
      this.init();
  }

  init(){
      if (this.platform.platforms().indexOf("cordova") < 0) {
      serverMap = virtualServersMap;
      favoriteFeedsMap = virtualFFMap;
      
      // allFeedsMap = virtualAFMap ;
      eventsMap = virtualEvents

      myFeedsMap = virtrulMyFeeds;

      myEventMap = virtualMyEventMap;

      postMap = {};
      lastPostUpdateMap = {};
      return;
    }

    
    this.initData();

    this.initCallback();
  }

  initTestData(){
      // this.removeAllData();

      //TODO resolve Document
      // bindingServer = {
      //   name              : "name",
      //   owner             : "owner",
      //   introduction      : "intro",
      //   did               : "did:elastos:ijwMzR44CjUjWEHcXSZSW3EPoBJGbKRThH",
      //   carrierAddress    : "FjT35Tj9zZK6nQGhE2BVNJja9oa5hqMtiSvQBpxj9u19qsMcd3Ww",
      //   nodeId            : "7hkVY8sAzA8QFritz7eknjPKeQbcPRrLYRdeMzgt37BB",
      //   feedsUrl          : "feeds://did:elastos:ijwMzR44CjUjWEHcXSZSW3EPoBJGbKRThH/FjT35Tj9zZK6nQGhE2BVNJja9oa5hqMtiSvQBpxj9u19qsMcd3Ww"
      // }
      // this.storeService.set(PersistenceKey.bindingServer,bindingServer);
  }
  initData(){
    

    firstInit = this.storeService.get(PersistenceKey.firstInit);
    firstInit = true; // for test
    if (firstInit == null) {
      firstInit = true;
    }
    
    postMap = this.storeService.get(PersistenceKey.postMap);
    if(postMap == null || postMap == undefined)
      postMap = {}
    postMap[1] = {
      nodeId     : "string",
      channel_id : 1,
      id         : 1,
      content    : {"text":"aaaa"},
      comments   : 0,
      likes      : 0,
      created_at : this.getCurrentTimeNum()
    }

    lastPostUpdateMap = this.storeService.get(PersistenceKey.lastPostUpdateMap);
    if(lastPostUpdateMap == null || lastPostUpdateMap == undefined)
      lastPostUpdateMap = {}

    myChannelsMap = this.storeService.get(PersistenceKey.myChannelsMap);
    if ( myChannelsMap == null || myChannelsMap ==undefined ){
      myChannelsMap ={};
    }

    serversStatus = this.storeService.get(PersistenceKey.serversStatus);
    if (serversStatus == null || serversStatus == undefined){
      serversStatus = {};
    }
    let keys: string[] = Object.keys(serversStatus);
    for (const index in keys) {
      if (serversStatus[keys[index]] == undefined)
        continue;
        serversStatus[keys[index]].status = ConnState.disconnected;
    }

    serverStatisticsMap = this.storeService.get(PersistenceKey.serverStatisticsMap);
    if (serverStatisticsMap == null || serverStatisticsMap == undefined){
      serverStatisticsMap = {};
    }

    serverMap = this.storeService.get(PersistenceKey.serverMap);
    if(serverMap == null || serverMap == undefined)
      serverMap = {};

    subscribedChannelsMap = this.storeService.get(PersistenceKey.subscribedChannelsMap);
    if (subscribedChannelsMap == null || subscribedChannelsMap == undefined)
      subscribedChannelsMap = {};

    commentsMap = this.storeService.get(PersistenceKey.commentsMap);
    if(commentsMap == null || commentsMap == undefined)
      commentsMap = {};

    favoriteFeedsMap = this.storeService.get(PersistenceKey.favoriteFeedsMap);
    if (favoriteFeedsMap == null || favoriteFeedsMap == undefined) {
      favoriteFeedsMap = {};
    } else {
      let keys: string[] = Object.keys(favoriteFeedsMap);
      for (const index in keys) {
        if (favoriteFeedsMap[keys[index]] == undefined)
          continue;
        favoriteFeedsMap[keys[index]].fetched = false;
      }
    }

    unreadMap = this.storeService.get(PersistenceKey.unreadMap);
    if(unreadMap == null || unreadMap == undefined){
      unreadMap = {};
    }

    channelsMap = this.storeService.get(PersistenceKey.channelsMap);
    if (channelsMap == null || channelsMap == undefined) {
      channelsMap = {};
    }
    
    eventsMap = this.storeService.get(PersistenceKey.eventsMap);
    if (eventsMap == null || eventsMap == undefined){
      eventsMap = {};
    }

    myFeedsMap = this.storeService.get(PersistenceKey.myFeedsMap);
    if (myFeedsMap == null || myFeedsMap == undefined){
      myFeedsMap = {};
    }

    myEventMap = this.storeService.get(PersistenceKey.myEventMap);
    if (myEventMap == null || myEventMap == undefined){
      myEventMap = {};
    }

    likeMap = this.storeService.get(PersistenceKey.likeMap);
    if (likeMap == null || likeMap == undefined){
      likeMap = {};
    }

    accessTokenMap = this.storeService.get(PersistenceKey.accessTokenMap);
    if (accessTokenMap == null || accessTokenMap == undefined){
      accessTokenMap = {};
    }

    // bindingServerMap = this.storeService.get(PersistenceKey.bindingServerMap);
    // if (bindingServerMap == null || bindingServerMap == undefined)
    //   bindingServerMap ={};

    bindingServer = this.storeService.get(PersistenceKey.bindingServer);

    // this.initTestData();

  }

  initCallback(){
    this.carrierReadyCallback();
    this.friendAddCallback();
    this.friendConnectionCallback();
    this.friendMessageCallback();
    this.connectionChangedCallback();
  }

  getConnectionStatus() {
    return connectionStatus;
  }

  getServerList(): Server[]{
    let list: Server[] = [];
    let nodeIdArray: string[] = Object.keys(serverMap);
    for (const index in nodeIdArray) {
      if (serverMap[nodeIdArray[index]] == undefined) 
        continue;

      list.push(serverMap[nodeIdArray[index]]);
    }
    return list;
  }

  // getCreationServerMap(){
  //   let keys: string[] = Object.keys(serversMap);
  //   for (const index in keys) {
  //     if (serversMap[keys[index]] == undefined) 
  //       continue;

  //     this.queryChannelCreationPermission(serversMap[keys[index]].nodeId);
  //   }
  // }

  getCreationServerList(): Server[]{
    let list: Server[] = [];
    if(bindingServer != null && bindingServer != undefined)
      list.push(bindingServer);
    return list;
    // let keys: string[] = Object.keys(bindingServerMap);
    // for (const index in keys) {
    //   if (bindingServerMap[keys[index]] == undefined) 
    //     continue;
    //   list.push(bindingServerMap[keys[index]]);
    // }
    // return list;
  }

  getBindingserver():Server {
    return bindingServer;
  }

  getServersStatus():  {[nodeId: string]: ServerStatus} {
    if (serversStatus == null){
      serversStatus = this.storeService.get(PersistenceKey.serversStatus);
      if (serversStatus == undefined){
        serversStatus = {};
      }
    }
    return serversStatus;
  }

  getServerStatisticsMap():{[nodeId: string]: ServerStatistics}{
    if (serverStatisticsMap == null){
      serverStatisticsMap = this.storeService.get(PersistenceKey.serverStatisticsMap);
      if (serverStatisticsMap == undefined){
        serverStatisticsMap = {};
      }
    }
    return serverStatisticsMap;
  }


  getFavoriteFeeds(): FavoriteFeed[]{
    let list: FavoriteFeed[] = [];
    let keys: string[] = Object.keys(favoriteFeedsMap);
    for (const index in keys) {
      if (favoriteFeedsMap[keys[index]] == undefined)
        continue;
      list.push(favoriteFeedsMap[keys[index]]);
    }
    list.sort((a, b) => Number(b.lastReceived) - Number(a.lastReceived));

    return list;
  }

  getMyChannelList(){
    let list: Channels[] = [];
    let keys: string[] = Object.keys(myChannelsMap);
    for (const index in keys) {
      if (myChannelsMap[keys[index]] == undefined)
        continue;
      list.push(myChannelsMap[keys[index]]);
    }
    list.sort((a, b) => Number(b.last_update) - Number(a.last_update));

    return list;
  }

  getUnreadNumber(channelId: number){
    if (unreadMap == null || unreadMap == undefined)
      unreadMap = {};
    if (unreadMap[channelId]==null || unreadMap[channelId] == undefined)
      return 0;
    return unreadMap[channelId];
  }

  readChannel(nodeId:string, channelId: number){
    if (unreadMap == null || unreadMap == undefined)
      unreadMap = {};
    unreadMap[channelId] = 0;
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

  // public getAllFeeds(): AllFeed[] {
  //   let list: AllFeed[] = [];
  //   let keys: string[] = Object.keys(channelsMap);
  //   for (const index in keys) {
  //     if (channelsMap[keys[index]] == undefined)
  //       continue;
  //     list.push(channelsMap[keys[index]]);
  //   }
  //   return list;
  // }


  fetchFeedEvents(nodeId: string, topic: string , seqno: number = -1){
    if (seqno!=-1){
      this.fetchUnreceived(nodeId,topic,seqno+1);
      return;
    }

    let feedKey = nodeId+topic ;
    if (favoriteFeedsMap[feedKey] == undefined){
      return ;
    }

    this.fetchUnreceived(nodeId,topic,favoriteFeedsMap[feedKey].lastSeqno+1);
  }

  getFeedEvents(feedEventKey: string) {
    currentFeedEventKey = feedEventKey;
    let list: FeedEvents[] = [];
    if (eventsMap[feedEventKey] == undefined){
      eventsMap[feedEventKey] = [];
    }
    // Object.assign(list, eventsMap[feedEventKey]);
    eventsMap[feedEventKey].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    return eventsMap[feedEventKey];
  }

  public getMyFeeds() {
    let list: MyFeed[] = [];
    let keys: string[] = Object.keys(myFeedsMap);
    for (const index in keys) {
      if (myFeedsMap[keys[index]] == undefined) 
        continue;
      list.push(myFeedsMap[keys[index]]);
    }
    list.sort((a, b) => Number(b.lastUpdated) - Number(a.lastUpdated));
    return list;
  }

  public updateMyFeedArchiveStatus(nodeId: string, topic: string, isArchive: boolean){
    myFeedsMap[nodeId+topic].archive = isArchive;
    this.updateMyFeedsMap();

    eventBus.publish(PublishType.ownFeedListChanged,this.getMyFeeds());
  }
  
  public getMyFeedEvents(nodeId: string, topic: string) {
    if (myEventMap == null || 
        myEventMap == undefined || 
        myEventMap[nodeId+topic] == null || 
        myEventMap[nodeId+topic] == undefined){
      return [];
    }

    let list: FeedEvents[] = [];

    myEventMap[nodeId+topic].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    return myEventMap[nodeId+topic];
  }

  public getArcstatus(nodeId: string, topic: string){
    if (myFeedsMap == undefined || myFeedsMap[nodeId+topic] == undefined){
      return false ;
    }
    return myFeedsMap[nodeId+topic].archive;
  }

  sendJWTMessage(nodeId: string, properties: any){
    this.jwtMessageService.request(nodeId,properties,()=>{},()=>{});
  }

  sendRPCMessage(nodeId: string, method: string, params: any){
    if(!this.checkServerConnection(nodeId)){
      this.native.toast("server :\n"+nodeId +"\noffline!");
      return;
    }
    this.jsonRPCService.request(
      method,
      nodeId, 
      params, 
      ()=>{
      }, 
      (error)=>{
        // this.native.toast(error);
      });
  }
  
  //{"jsonrpc":"2.0","method":"create_topic","params":{"topic":"news","desc":"daily"},"id":null}
  createTopic(nodeId: string, channel: string, desc: string, avatar: any){
      // currentCreateTopicNID = nodeId;
      // let params = {};
      // params["topic"] = topic;
      // params["desc"] = desc;

      // this.sendMessage(nodeId, FeedsData.MethodType.createTopic, params);
      this.createChannel(nodeId, channel, desc, avatar);
  }

  //{"jsonrpc":"2.0","method":"post_event","params":{"topic":"news","event":"newsevent"},"id":null}
  postEvent(nodeId: string, topic: string, event: string, imageUrl: string){
      let params = {};
      params["topic"] = topic;
      params["event"] = event;

      let lastSeqno = 0;
      if (myEventMap[nodeId+topic] != null || myEventMap[nodeId+topic] != undefined){
        lastSeqno = myEventMap[nodeId+topic].seqno;
      }
        
      postEventTmp = new FeedEvents(nodeId,topic,this.getCurrentTime(),event,lastSeqno++, imageUrl);
      this.sendRPCMessage(nodeId, FeedsData.MethodType.postEvent, params);
  }

  //{"jsonrpc":"2.0","method":"list_owned_topics","id":null}
  listOwnedTopics(nodeId: string){
    this.sendRPCMessage(nodeId, FeedsData.MethodType.listOwnedTopics, null);
  }

  //{"jsonrpc":"2.0","method":"subscribe","params":{"topic":"movie"},"id":null}
  subscribe(nodeId: string, topic: string){
    let params = {};
    params["topic"] = topic;
    this.sendRPCMessage(nodeId, FeedsData.MethodType.subscribe, params);
  }

  doSubscribe(){
    
    // this.subscribe();
  }

  //{"jsonrpc":"2.0","method":"unsubscribe","params":{"topic":"movie"},"id":null}
  unSubscribe(nodeId: string, topic: string){
      let params = {};
      params["topic"] = topic;
      this.sendRPCMessage(nodeId, FeedsData.MethodType.unsubscribe, params);
  }

  //{"jsonrpc":"2.0","method":"explore_topics","id":null}
  exploreTopics(nodeId: string){
      this.sendRPCMessage(nodeId, FeedsData.MethodType.exploreTopics, null);
  }

  //{"jsonrpc":"2.0","method":"list_subscribed_topics","id":null}
  listSubscribed(nodeId: string){
    this.sendRPCMessage(nodeId, FeedsData.MethodType.listSubscribed, null);
  }

  //{"jsonrpc":"2.0","method":"fetch_unreceived","params":{"topic":"movie","since":1021438976},"id":null}
  fetchUnreceived(nodeId: string, topic: string, since: number){
      // fetchTopic = topic;
      let params = {};
      params["topic"] = topic;
      params["since"] = since;
      this.sendRPCMessage(nodeId, FeedsData.MethodType.fetchUnreceived, params);
  }

  carrierReadyCallback(){
    this.events.subscribe('carrier:ready', () => {
      // if (firstInit) {
      //   this.prepare();
        // this.storeService.set(PersistenceKey.firstInit,false);
      // }
    });
  }

  friendConnectionCallback(){
    this.events.subscribe('carrier:friendConnection', ret => {
      eventBus.publish("feeds:friendConnection",ret);

      if (friendConnectionMap == null || friendConnectionMap == undefined)
        friendConnectionMap = {};
  
      let friendId = ret.friendId;
      let friendStatus = ret.status;

      friendConnectionMap[friendId] = friendStatus;

      if(serversStatus == null ||serversStatus == undefined)
        serversStatus = {}

      if(serversStatus[friendId]!=undefined)
        serversStatus[friendId].status = friendStatus;
      
      if (friendStatus == ConnState.connected){
        // if (accessTokenMap == null || accessTokenMap == undefined)
        //   accessTokenMap = {};
        // if(accessTokenMap[friendId] == undefined || !this.checkExp(accessTokenMap[friendId])){
        //   this.signinChallengeRequest(friendId,false);
        //   return;
        // }

        this.prepare(friendId);

        // this.checkSignInStatus(friendId);
      }
      eventBus.publish(PublishType.friendConnectionChanged, friendId, friendStatus);

      this.storeService.set(PersistenceKey.serversStatus,serversStatus);
      eventBus.publish(PublishType.serverConnectionChanged,serversStatus);
    });
  }

  friendAddCallback(){
    this.events.subscribe('carrier:friendAdded', msg => {
      let status: ConnState = msg.friendInfo.status;
      let nodeId = msg.friendInfo.userInfo.userId;
      if (bindingServer !=null && bindingServer == undefined)
        if (bindingServer.nodeId == nodeId)
          return ;

      this.resolveServer(this.getServerbyNodeId(nodeId),status);
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
      this.native.toast("Server already added!");
    }else{
      this.native.toast("Add server success!");
    }

    serverMap[server.nodeId] = server ;


    this.storeService.set(PersistenceKey.serversStatus,serversStatus);

    this.storeService.set(PersistenceKey.serverMap, serverMap);

    this.storeService.set(PersistenceKey.serverStatisticsMap,serverStatisticsMap);

    eventBus.publish(PublishType.updateServerList, this.getServerList(), Date.now());
  }
  
  connectionChangedCallback(){
    this.events.subscribe('carrier:connectionChanged', status => {
      connectionStatus = status;
      eventBus.publish(PublishType.connectionChanged, status, Date.now());
    });
  }

  handleResult(method:string, nodeId: string ,result: any , request: any){
    let from = nodeId;

    switch (method) {
      case FeedsData.MethodType.subscribe:
        this.handleSubscriptResult(from);
        break;
      case FeedsData.MethodType.unsubscribe:
        this.handleUnsubscribeResult(from);
        break;
      case FeedsData.MethodType.exploreTopics:
        this.handleExploreTopicResult(from, result);
        break;
      case FeedsData.MethodType.listSubscribed:
        this.handleListSubscribedResult(from, result);
        break;
      case FeedsData.MethodType.fetchUnreceived:
        this.handleFetchUnreceivedResult(from, result);
        break;
      case FeedsData.MethodType.createTopic:
        this.handleCreateTopicResult(result);
        break;
      case FeedsData.MethodType.postEvent:
        this.handlePostEventResult(result);
        break;
      case FeedsData.MethodType.listOwnedTopics:
        this.handleListOwnTopicResult(from, result);
        break;

      case FeedsData.MethodType.create_channel:
        this.handleCreateChannelResult(nodeId, result, request);
        break;
      case FeedsData.MethodType.publish_post:
        this.handlePublishPostResult(nodeId, result, request);
        break;
      case FeedsData.MethodType.post_comment:
        this.handlePostCommentResult(nodeId, result, request);
        break;
      case FeedsData.MethodType.post_like:
        this.handlePostLikeResult(nodeId, request);
        break;
      case FeedsData.MethodType.post_unlike:
        this.handlePostUnLikeResult(nodeId, request);
        break;
      case FeedsData.MethodType.get_my_channels:
        this.handleGetMyChannelsResult(nodeId, result);
        break;
      case FeedsData.MethodType.get_my_channels_metadata:
        this.handleGetMyChannelsMetaDataResult(nodeId, result);
        break;
      case FeedsData.MethodType.get_channels:
        this.handleGetChannelsResult(nodeId, result, request);
        break;
      case FeedsData.MethodType.get_channel_detail:
        this.handleGetChannelDetailResult(result);
        break;
      case FeedsData.MethodType.get_subscribed_channels:
        this.handleGetSubscribedChannelsResult(nodeId, result, request);
        break;
      case FeedsData.MethodType.get_posts:
        this.handleGetPostsResult(nodeId, result, request);
        break;
      case FeedsData.MethodType.get_comments:
        this.handleGetCommentsResult(result);
        break;
      case FeedsData.MethodType.get_statistics:
        this.handleGetStatisticsResult(nodeId, result);
        break;
      case FeedsData.MethodType.subscribe_channel:
        this.handleSubscribeChannelResult(nodeId, request);
        break;
      case FeedsData.MethodType.unsubscribe_channel:
        this.handleUnsubscribeChannelResult(nodeId, request);
        break;
      case FeedsData.MethodType.add_node_publisher:
        this.handleAddNodePublisherResult();
        break;
      case FeedsData.MethodType.remove_node_publisher:
        this.handleRemoveNodePublisherResult();
        break;
      // case FeedsData.MethodType.query_channel_creation_permission:
      //   this.handleQueryChannelCreationPermissionResult(nodeId, result);
      //   break;
      case FeedsData.MethodType.enable_notification:
        this.handleEnableNotificationResult();
        break;

      case "declare_owner":
        this.handleDeclareOwnerResponse(nodeId,result);
        break;
      case "import_did":
        this.handleImportDIDResponse(nodeId, result);
        break;
      case "issue_credential":
        this.handleIssueCredentialResponse(nodeId, result);
        break;


      case "signin_request_challenge":
        this.handleSigninChallenge(nodeId, result);
        break;

      case "signin_confirm_challenge":
        this.handleSigninConfirm(nodeId, result);
        break;
      default:
        // alert("Maybe error");
        break;
    }
  }

  // public type: number,
  // public nodeId: string,
  // public method: string,
  // public request: object,
  // public result: object,
  // public error: object,
  // public params: object,
  
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
          this.handleResult(result.method, result.nodeId, result.result, result.request);
          break;
      }
    });

    // this.events.subscribe('jwt:receiveJWTMessage', (result) => {
    //   let method = result.payload.method;
    //   switch(method){
    //     case FeedsData.MethodType.negotiateLogin:
    //       this.loginResponse(result.nodeId, result.payload);

    //       break;
    //     case FeedsData.MethodType.confirmLogin:
    //       this.confirmLoginResponse(result.nodeId, result.payload);

    //       break;
    //   }
    // });
    
  }

  /*
  {
    "jsonrpc": "2.0",
    "result": NULL,
    "id": "id(JSON-RPC conformed type)"
  }

  {"jsonrpc":"2.0",
  "error":{"code":-32602,"message":"Operation Not Authorized"},"id":"11"}
  */
  handleCreateTopicResult(result: any){
    eventBus.publish(PublishType.createTopicSuccess);
    this.listOwnedTopics(currentCreateTopicNID);
  }

  /*
  {
    "jsonrpc": "2.0",
    "result": NULL,
    "id": "id(JSON-RPC conformed type)"
  } 
  */
  handlePostEventResult(result: any){
    if (myEventMap[postEventTmp.nodeId+postEventTmp.topic] == null || myEventMap[postEventTmp.nodeId+postEventTmp.topic] == undefined){
      myEventMap[postEventTmp.nodeId+postEventTmp.topic] = [];
    }
    
    myEventMap[postEventTmp.nodeId+postEventTmp.topic].push(postEventTmp);
    this.updateMyEventMap();

    myFeedsMap[postEventTmp.nodeId+postEventTmp.topic].lastUpdated = postEventTmp.timestamp;
    myFeedsMap[postEventTmp.nodeId+postEventTmp.topic].imageUrl = postEventTmp.imageUrl;
    myFeedsMap[postEventTmp.nodeId+postEventTmp.topic].lastEvent = postEventTmp.message;
    this.updateMyFeedsMap();
    
    eventBus.publish(PublishType.postEventSuccess);
  }

  /*
  {
    "jsonrpc": "2.0",
    "result": [{
      "name": "topic名称(string)", 
      "desc": "topic描述(string)"
    }],
    "id": "id(JSON-RPC conformed type)"
  } 
  */
  handleListOwnTopicResult(nodeId: string, result: any){
    let changed = false ;
    for (let index = 0; index < result.length; index++) {
      let topic = result[index].name;
      let desc = result[index].desc;
      let feedKey = nodeId+topic;
      if (myFeedsMap[feedKey] == undefined){
        myFeedsMap[feedKey] = new MyFeed('paper',nodeId,topic,desc,this.getCurrentTime(),"","",false);
        changed = true;
        continue;
      } 
      
      if (myFeedsMap[feedKey].desc != desc){
        myFeedsMap[feedKey].desc = desc;
        changed = true;
      }
    }

    if (changed){
      this.updateMyFeedsMap();
      eventBus.publish(PublishType.ownFeedListChanged,this.getMyFeeds());
    }
  }

  /*
  {
    "jsonrpc": "2.0",
    "result": NULL,
    "id": "id(JSON-RPC conformed type)"
  }
  */
  handleSubscriptResult(nodeId: string){
  }

  /*
  {
    "jsonrpc": "2.0",
    "result": NULL,
    "id": "id(JSON-RPC conformed type)"
  } 
  */
  handleUnsubscribeResult(nodeId: string){
  }

  /*
  {
    "jsonrpc": "2.0",
    "result": [{
      "name": "topic名称(string)", 
      "desc": "topic描述(string)"
    }],
    "id": "id(JSON-RPC conformed type)"
  } 
  */
  handleExploreTopicResult(nodeId: string, result: any){
  }

  
  /*
  {
    "jsonrpc": "2.0",
    "result": [{
      "name": "topic名称(string)", 
      "desc": "topic描述(string)"
    }],
    "id": "id(JSON-RPC conformed type)"
  } 
  */
  handleListSubscribedResult(nodeId: string, result: any){
    let changed = false ;
    if (result == "") {
      return ;
    }

    for (let index = 0; index < result.length; index++) {
      let topic = result[index].name;
      let desc = result[index].desc;

      let favoriteFeedKey = nodeId+topic;
      if (favoriteFeedsMap[favoriteFeedKey] == undefined){
        favoriteFeedsMap[favoriteFeedKey] = new FavoriteFeed(nodeId, topic, desc, 0, 0, this.getCurrentTime(),"",false);
        changed = true;
      }else if(favoriteFeedsMap[favoriteFeedKey].name != topic ||
        favoriteFeedsMap[favoriteFeedKey].desc != desc){
        favoriteFeedsMap[favoriteFeedKey].name = topic;
        favoriteFeedsMap[favoriteFeedKey].desc = desc  
        changed = true;
      }

      // if (needFetch){
      //   this.fetchFeedEvents(nodeId, topic);
      // }
      if (fetchList.indexOf(favoriteFeedsMap[favoriteFeedKey]) == -1 && 
          !favoriteFeedsMap[favoriteFeedKey].fetched){
        fetchList.push(favoriteFeedsMap[favoriteFeedKey]);
      }
    }

    if (changed){
      this.updateFFMap();
      eventBus.publish(PublishType.favoriteFeedListChanged,this.getFavoriteFeeds());
    }

    if (needFetch) {
      this.fetchNext();
      needFetch = false;
    }
    
  }

  fetchNext(){
    if (fetchList.length>0){
      currentFetchFeeds = fetchList[0];
      // fetchTopic = fetchList[0].name;

      this.fetchFeedEvents(fetchList[0].nodeId,fetchList[0].name);
    }
  }

  updatefavoriteUnreadState(nodeId: string, topic: string , unread: number){
    favoriteFeedsMap[nodeId+topic].unread = unread;
    this.updateFFMap();
  }

  updatefavoriteFeed(favoriteFeedKey:string, feed:FavoriteFeed){
    favoriteFeedsMap[favoriteFeedKey] = feed;
    this.updateFFMap();
  }

  /*
  {
    "jsonrpc": "2.0",
    "result": [{
      "seqno": "序列号（以升序返回）(number)", 
      "event": "事件内容(string)",
      "ts": "事件发布时的时间戳（UNIX Epoch格式）(number)"
    }],
    "id": "id(JSON-RPC conformed type)"
  } 
  */
  handleFetchUnreceivedResult(from: string, result: any){
    let changed: boolean = false ;
    let currentEventChanged: boolean = false;
    if (result == null || result == undefined){
      return ;
    }
    // let feedKey = from+fetchTopic;
    let feedKey = currentFetchFeeds.nodeId + currentFetchFeeds.name ;
    let unread = 0;
    
    if (eventsMap[feedKey] == undefined){
      eventsMap[feedKey] = [];
    }

    for (let index = 0; index < result.length; index++) {
      let seqno = result[index].seqno;
      let event = result[index].event;
      let ts:number = result[index].ts;
      if (favoriteFeedsMap[feedKey].unread != undefined){
        unread = favoriteFeedsMap[feedKey].unread;
      }
      favoriteFeedsMap[feedKey].lastSeqno = seqno;
      favoriteFeedsMap[feedKey].unread  = unread+1;
      favoriteFeedsMap[feedKey].lastReceived = ts*1000;
      favoriteFeedsMap[feedKey].lastEvent = event;
      
      eventsMap[feedKey].push((new FeedEvents(from, currentFetchFeeds.name, String(ts*1000), event, seqno, "")));
      changed = true ;
    }

    favoriteFeedsMap[feedKey].fetched = true ;

    fetchList = fetchList.filter(item=>item != currentFetchFeeds);
    if (currentFeedEventKey == feedKey){
      currentEventChanged = true;
    }

    if (changed) {
      this.updateEventMap();
      this.updateFFMap();
      eventBus.publish(PublishType.favoriteFeedListChanged,this.getFavoriteFeeds());
    }

    if (currentEventChanged)
      eventBus.publish(PublishType.eventListChanged,this.getFeedEvents(currentFeedEventKey));

    this.fetchNext();
  }

  /*
  {
    "jsonrpc": "2.0",
    "method": "new_event",
    "params": {
      "topic": "topic名称(string)",
      "event": "事件内容(string)",
      "seqno": "序列号(number)",
      "ts": "时间戳(number)"
    }
  }
  */
  handleNewEventResult(nodeId: string, result: any){
    let topic = result.topic;
    let event = result.event;
    let seqno = result.seqno;
    let ts = result.ts*1000;

    // // let event = new FeedEvents(nodeId, result.topic, result.ts, result.event, result.seqno);
    // eventList.push(event);
    // this.storeService.set(PersistenceKey.eventList,eventList);
    let currentEventChanged = false;

    let feedKey = nodeId+topic;

    let unread = favoriteFeedsMap[feedKey].unread;
    favoriteFeedsMap[feedKey].lastSeqno = seqno;
    favoriteFeedsMap[feedKey].unread  = unread+1;
    favoriteFeedsMap[feedKey].lastReceived = ts;
    favoriteFeedsMap[feedKey].lastEvent = event;

    if (eventsMap[feedKey] == undefined){
      eventsMap[feedKey] = [];
    }

    eventsMap[feedKey].push(new FeedEvents(nodeId, topic, String(ts), event, seqno, ""));

    if (currentFeedEventKey == feedKey){
      currentEventChanged = true;
    }

    // this.storeService.set(PersistenceKey.eventsMap,eventsMap);
    this.updateEventMap();

    this.updateFFMap();
    eventBus.publish(PublishType.favoriteFeedListChanged,this.getFavoriteFeeds());

    if(currentEventChanged){
      eventBus.publish(PublishType.eventListChanged,this.getFeedEvents(currentFeedEventKey));
    }
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
            feedsUrl          : feedsUrl
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
            name              : "Not provided from DIDDocument",
            owner             : didDocument.getSubject().getDIDString(),
            introduction      : "Not provided from DIDDocument",
            did               : didDocument.getSubject().getDIDString(),
            carrierAddress    : carrierAddress,
            nodeId            : "",
            feedsUrl          : feedsUrl
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

  // confirmLoginResponse(nodeId: string, payload: any){
  //   accessTokenMap[nodeId] = payload.access_token;
  //   this.storeService.set(PersistenceKey.accessTokenMap, accessTokenMap);


  //   var index = signInServerList.indexOf(nodeId);
  //   if(index > -1) {
  //     signInServerList.splice(index,1);
  //   }
  //   eventBus.publish(PublishType.signInServerListChanged,signInServerList);
  // }

  generateNonce() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, function(c) {
      var r = (d + Math.random()*16)%16 | 0;
      d = Math.floor(d/16);
      return (c=='x'? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
  };

  // checkSignInStatus(nodeId: string){
  //   let keys: string[] = Object.keys(accessTokenMap);
  //   if (keys.indexOf(nodeId) == -1){
  //     this.checkSignInServerList(nodeId);
  //   }
  //     this.loginRequest(nodeId);
  // }

  checkSignInServerList(nodeId: string){
    if (signInServerList.indexOf(nodeId) == -1){
      signInServerList.push(nodeId);
      eventBus.publish(PublishType.signInServerListChanged,signInServerList);
    }
  }

  checkSignInServerStatus(nodeId: string): boolean{
    if (accessTokenMap == null || 
      accessTokenMap == undefined ||
      accessTokenMap[nodeId] == undefined)
      return false ;
    
    return true;
  }
  
  // generateUUID() {
  //   var d = new Date().getTime();
  //   var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  //     var r = (d + Math.random()*16)%16 | 0;
  //     d = Math.floor(d/16);
  //     return (c=='x'? r : (r&0x3|0x8)).toString(16);
  //   });
  //   return uuid;
  // };
  
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

  doListSubscribedTopic(server: Server){
    if (server == undefined)
      return ;
    if (serversStatus[server.nodeId].status == ConnState.connected) 
      this.listSubscribed(server.nodeId);
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

  updateFFMap(){
    this.storeService.set(PersistenceKey.favoriteFeedsMap,favoriteFeedsMap);
  }

  updateEventMap(){
    this.storeService.set(PersistenceKey.eventsMap, eventsMap);
  }

  updateMyFeedsMap(){
    this.storeService.set(PersistenceKey.myFeedsMap, myFeedsMap);
  }
  updateMyEventMap(){
    this.storeService.set(PersistenceKey.myEventMap, myEventMap);
  }

  saveAvator(imaUrl: string){
    this.storeService.set(PersistenceKey.avatar, imaUrl);
  }

  getAvator(): string{
    return this.storeService.get(PersistenceKey.avatar);
  }

  saveSignInRAWData(jsonStr: string){
    this.storeService.set(PersistenceKey.signInRawData, jsonStr);
  }

  saveSignInData(did: string, name: string, email: string, telephone: string, location: string, description: string){
    localSignInData = new SignInData(did,name,email,telephone,location, description, this.getCurrentTimeNum()+this.getDaysTS(expDay));
    this.storeService.set(PersistenceKey.signInData, localSignInData);
  }

  saveSignInData2(signInData: SignInData){
    localSignInData = signInData;
    this.storeService.set(PersistenceKey.signInData, signInData);
  }

  cleanSignInData(){
    this.storeService.remove(PersistenceKey.signInData);
  }

  getSignInData(): SignInData{
    if (localSignInData == null ||
      localSignInData == undefined){
        localSignInData = this.storeService.get(PersistenceKey.signInData);
      }
    return localSignInData;
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
      if (serversStatus[list[index].nodeId].status == ConnState.disconnected)
        continue;
      else {
        isLocalRefresh = false;
        this.getChannels(list[index].nodeId, Communication.field.last_update, 0, 0, 10);
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
      list.push(myChannelsMap[keys[index]]);
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
        list.push(myChannelsMap[keys[index]]);
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

  // refreshPost(nodeId: string, channelId: number){
  //   this.getPost(nodeId,channelId,Communication.field.last_update,null,null,10);

  //   if (serversStatus[nodeId].status == ConnState.disconnected)
  //     this.refreshLocalPost(nodeId, channelId);
  // }

  // refreshLocalPost(nodeId:string, channelId: number):Post[]{
  //   if (postMap == null || postMap == undefined
  //     || postMap[channelId] == null ||postMap[channelId] == undefined){
  //     eventBus.publish(PublishType.refreshPost,[]);
  //     return [];
  //   }

  //   let list: Post[] = [];
  //   let keys: string[] = Object.keys(postMap[channelId]);
  //   localPostList = [];
  //   for (const index in keys) {
  //     if (postMap[channelId][keys[index]] == null || postMap[channelId][keys[index]] == undefined)
  //       continue;
  //       list.push(postMap[channelId][keys[index]]);
  //   }
    
  //   list.sort((a, b) => Number(b.created_at) - Number(a.created_at));

  //   localPostList.slice(0,localPostList.length);
  //   let end: number;
  //   if (list.length>10){
  //     end = 10;
  //   }else{
  //     end = list.length;
  //   }
  //   for (let index = 0; index < end; index++)
  //     localPostList.push(list[index]);

  //   if (myChannelsMap == null || myChannelsMap == undefined)
  //     myChannelsMap = {};
  //   if (myChannelsMap[channelId] != null && 
  //       myChannelsMap[channelId] != undefined &&
  //       myChannelsMap[channelId].last_post != localPostList[0].content){
  //     myChannelsMap[channelId].last_post = localPostList[0].content;
  //     this.storeService.set(PersistenceKey.myChannelsMap,myChannelsMap);
  //   }
    
      

  //   if (subscribedChannelsMap == null || subscribedChannelsMap == undefined)
  //     subscribedChannelsMap = {};
  //   if (subscribedChannelsMap[channelId]!= null && 
  //       subscribedChannelsMap[channelId] != undefined &&
  //       subscribedChannelsMap[channelId].last_post != localPostList[0].content){
  //     subscribedChannelsMap[channelId].last_post = localPostList[0].content;
  //     this.storeService.set(PersistenceKey.subscribedChannelsMap, subscribedChannelsMap);
  //   }

  //   eventBus.publish(PublishType.refreshPost,localPostList);
  //   return localPostList;
  // }

  // loadMorePost(nodeId:string, channelId:number){
  //   this.getPost(nodeId,channelId,Communication.field.last_update,localPostList[localPostList.length-1].created_at,null,10);

  //   if (serversStatus[nodeId].status == ConnState.disconnected)
  //     this.loadMoreLocalPost(nodeId, channelId);
  // }

  // loadMoreLocalPost(nodeId:string, channelId: number){
  //   if (postMap == null || postMap == undefined){
  //     eventBus.publish(PublishType.loadMorePost,[]);
  //     return;
  //   }

  //   let list: Post[] = [];
  //   let keys: string[] = Object.keys(postMap[channelId]);
  //   for (const index in keys) {
  //     if (postMap[channelId][keys[index]] == null || postMap[channelId][keys[index]] == undefined)
  //       continue;
  //       list.push(postMap[channelId][keys[index]]);
  //   }
    
  //   list.sort((a, b) => Number(b.created_at) - Number(a.created_at));

  //   let start = localPostList.length;
  //   let end: number;
  //   if (list.length>start+10){
  //     end = start+10;
  //   }else{
  //     end = list.length;
  //   }
  //   for (let index = start; index < end; index++)
  //     localPostList.push(list[index]);

  //   eventBus.publish(PublishType.loadMorePost,localPostList);
  // }

  //// new request
  createChannel(nodeId: string, name: string, introduction: string, avatar: any){
    if(accessTokenMap == null ||
      accessTokenMap == undefined||
      accessTokenMap[nodeId] == undefined){
        //TODO error
        return;
      }
      

    let avatarBin = this.serializeDataService.encodeData(avatar);

    let request: Communication.create_channel_request = {
      version: "1.0",
      method : "create_channel",
      params : {
          access_token    : accessTokenMap[nodeId].token,
          name        : name,
          introduction: introduction,
          avatar      : avatarBin
      } ,
      id     : -1
    }
    this.sendRPCMessage(nodeId, request.method, request.params);
  }

  publishPost(nodeId: string, channel_id: number, content: any){
    if(accessTokenMap == null ||
      accessTokenMap == undefined||
      accessTokenMap[nodeId] == undefined)
      //TODO error
      return;

    
    let contentBin = this.serializeDataService.encodeData(content);
      
    let request: Communication.publish_post_request = {
      version: "1.0",
      method : "publish_post",
      params : {
          access_token    : accessTokenMap[nodeId].token,
          channel_id: Number(channel_id),
          content: contentBin,
      } ,
      id     : -1
    }
    this.sendRPCMessage(nodeId, request.method, request.params);
  }

  postComment(nodeId: string, channel_id: number, post_id: number, 
              comment_id , content: any){
    if(accessTokenMap == null ||
      accessTokenMap == undefined||
      accessTokenMap[nodeId] == undefined)
      //TODO error
      return;

    let contentBin = this.serializeDataService.encodeData(content);

    let request: Communication.post_comment_request = {
      version: "1.0",
      method : "post_comment",
      params : {
          access_token    : accessTokenMap[nodeId].token,
          channel_id: channel_id,
          post_id   : post_id,
          comment_id: comment_id,
          content   : contentBin,
      } ,
      id     : -1
    }
    this.sendRPCMessage(nodeId, request.method, request.params);
  }

  postLike(nodeId: string, channel_id: number, post_id: number, comment_id: number){
    if(accessTokenMap == null ||
      accessTokenMap == undefined||
      accessTokenMap[nodeId] == undefined)
      //TODO error
      return;

    let request: Communication.post_like_request = {
      version: "1.0",
      method : "post_like",
      params : {
          access_token    : accessTokenMap[nodeId].token,
          channel_id: channel_id,
          post_id   : post_id,
          comment_id: comment_id,
      } ,
      id     : -1
    }
    this.sendRPCMessage(nodeId, request.method, request.params);
  }

  postUnlike(nodeId:string, channel_id: number, post_id: number, comment_id: number){
    
    // let mPostId = this.getPostId(nodeId,channel_id,post_id);
    // postMap[mPostId].likes = postMap[mPostId].likes-1;
    // this.storeService.set(PersistenceKey.postMap,postMap);

    // likeMap[mPostId] = undefined;
    // this.storeService.set(PersistenceKey.likeMap, likeMap);

    // eventBus.publish(PublishType.updateLikeList, this.getLikeList());
    // eventBus.publish(PublishType.updataPostLike, nodeId, channel_id, post_id , postMap[mPostId].likes);
    if(accessTokenMap == null ||
      accessTokenMap == undefined||
      accessTokenMap[nodeId] == undefined)
      //TODO error
      return;
    
    let request: Communication.post_unlike_request = {
      version: "1.0",
      method : "post_unlike",
      params : {
          access_token    : accessTokenMap[nodeId].token,
          channel_id: channel_id,
          post_id   : post_id,
          comment_id: comment_id,
      } ,
      id     : -1
    }
    this.sendRPCMessage(nodeId, request.method, request.params);
  }

  getMyChannels(nodeId: string, field: Communication.field, upper_bound: number,
                lower_bound: number, max_counts: number){
    if(accessTokenMap == null ||
      accessTokenMap == undefined||
      accessTokenMap[nodeId] == undefined)
      //TODO error
      return;

    let request: Communication.get_my_channels_request = {
      version: "1.0",
      method : "get_my_channels",
      params : {
          access_token    : accessTokenMap[nodeId].token,
          by         : field,
          upper_bound: upper_bound,
          lower_bound: lower_bound,
          max_count : max_counts,
      },
      id     : -1
    }
    this.sendRPCMessage(nodeId, request.method, request.params);
  }

  getMyChannelsMetaData(nodeId: string, field: Communication.field, upper_bound: number, 
                        lower_bound: number, max_counts: number){
    if(accessTokenMap == null ||
      accessTokenMap == undefined||
      accessTokenMap[nodeId] == undefined)
      //TODO error
      return;

    let request: Communication.get_my_channels_metadata_request = {
      version: "1.0",
      method : "get_my_channels_metadata",
      params : {
          access_token    : accessTokenMap[nodeId].token,
          by         : field,
          upper_bound: upper_bound,
          lower_bound: lower_bound,
          max_count : max_counts,
      },
      id     : -1
    }
    this.sendRPCMessage(nodeId, request.method, request.params);
  }

  getChannels(nodeId: string, field: Communication.field, upper_bound: number, 
              lower_bound: number, max_counts: number){
    if(accessTokenMap == null ||
      accessTokenMap == undefined||
      accessTokenMap[nodeId] == undefined)
      //TODO error
      return;

    let request: Communication.get_channels_request = {
      version: "1.0",
      method : "get_channels",
      params : {
          access_token    : accessTokenMap[nodeId].token,
          by         : field,
          upper_bound: upper_bound,
          lower_bound: lower_bound,
          max_count : max_counts,
      },
      id     : -1
    }
    this.sendRPCMessage(nodeId, request.method, request.params);
  }

  getChannelDetail(nodeId: string, id: number){
    if(accessTokenMap == null ||
      accessTokenMap == undefined||
      accessTokenMap[nodeId] == undefined)
      //TODO error
      return;

    let request: Communication.get_channel_detail_request = {
      version: "1.0",
      method : "get_channel_detail",
      params : {
          access_token    : accessTokenMap[nodeId].token,
          id: id,
      },
      id     : -1
    }
    this.sendRPCMessage(nodeId, request.method, request.params);
  }

  getSubscribedChannels(nodeId: string, field: Communication.field, upper_bound: number, 
                        lower_bound: number, max_counts: number){
    if(accessTokenMap == null ||
      accessTokenMap == undefined||
      accessTokenMap[nodeId] == undefined)
      //TODO error
      return;

    let request: Communication.get_subscribed_channels_request = {
      version: "1.0",
      method : "get_subscribed_channels",
      params : {
          access_token   : accessTokenMap[nodeId].token,
          by         : field,
          upper_bound: upper_bound,
          lower_bound: lower_bound,
          max_count : max_counts,

      },
      id     : -1
    }
    this.sendRPCMessage(nodeId, request.method, request.params);
  }

  getPost(nodeId: string, channel_id: number, by: Communication.field, 
          upper_bound: number, lower_bound: number , max_counts: number){
    if(accessTokenMap == null ||
      accessTokenMap == undefined||
      accessTokenMap[nodeId] == undefined)
      //TODO error
      return;

    let request: Communication.get_posts_request = {
      version: "1.0",
      method : "get_posts",
      params : {
          access_token    : accessTokenMap[nodeId].token,
          channel_id : Number(channel_id),
          by         : by,
          upper_bound: upper_bound,
          lower_bound: lower_bound,
          max_count : max_counts,
      },
      id     : -1
    }
    this.sendRPCMessage(nodeId, request.method, request.params);
  }

  getComments(nodeId: string, channel_id: number, post_id: number,
              by:Communication.field, upper_bound: number, lower_bound: number, max_counts:number){
    if(accessTokenMap == null ||
      accessTokenMap == undefined||
      accessTokenMap[nodeId] == undefined)
      //TODO error
      return;

    let request:Communication.get_comments_request = {
      version: "1.0",
      method : "get_comments",
      params : {
          access_token    : accessTokenMap[nodeId].token,
          channel_id : channel_id,
          post_id    : post_id,
          by         : by,
          upper_bound: upper_bound, 
          lower_bound: lower_bound ,
          max_count : max_counts,
      },
      id     : -1
    }
    this.sendRPCMessage(nodeId, request.method, request.params);
  }

  getStatistics(nodeId: string){
    if(accessTokenMap == null ||
      accessTokenMap == undefined||
      accessTokenMap[nodeId] == undefined)
      //TODO error
      return;

    let request:Communication.get_statistics_request = {
      version: "1.0",
      method : "get_statistics",
      params : {
        access_token    : accessTokenMap[nodeId].token
      },
      id     : -1
    }
    this.sendRPCMessage(nodeId, request.method, request.params);
  }

  subscribeChannel(nodeId: string, id: number){
    if(accessTokenMap == null ||
      accessTokenMap == undefined||
      accessTokenMap[nodeId] == undefined)
      //TODO error
      return;

    let request: Communication.subscribe_channel_request = {
      version: "1.0",
      method : "subscribe_channel",
      params : {
          access_token    : accessTokenMap[nodeId].token,
          id: id,
      },
      id     : -1
    }
    this.sendRPCMessage(nodeId, request.method, request.params);
  }

  unsubscribeChannel(nodeId: string, id: number){
    if(accessTokenMap == null ||
      accessTokenMap == undefined||
      accessTokenMap[nodeId] == undefined)
      //TODO error
      return;

    let request: Communication.unsubscribe_channel_request = {
      version: "1.0",
      method : "unsubscribe_channel",
      params : {
          access_token    : accessTokenMap[nodeId].token,
          id: id
      },
      id     : -1
    }
    this.sendRPCMessage(nodeId, request.method, request.params);
  }
  
  addNodePublisher(nodeId: string, did: string){
    if(accessTokenMap == null ||
      accessTokenMap == undefined||
      accessTokenMap[nodeId] == undefined)
      //TODO error
      return;

    let request: Communication.add_node_publisher_request = {
      version: "1.0",
      method : "add_node_publisher",
      params : {
          did: did,
          access_token    : accessTokenMap[nodeId].token
      },
      id     : -1
    }
    this.sendRPCMessage(nodeId, request.method, request.params);
  }

  removeNodePublisher(nodeId: string, did: string){
    if(accessTokenMap == null ||
      accessTokenMap == undefined||
      accessTokenMap[nodeId] == undefined)
      //TODO error
      return;

    let request: Communication.remove_node_publisher_request = {
      version: "1.0",
      method : "remove_node_publisher",
      params : {
          did: did,
          access_token    : accessTokenMap[nodeId].token
      },
      id     : -1
    }
    this.sendRPCMessage(nodeId, request.method, request.params);
  }

  // queryChannelCreationPermission(nodeId: string){
  //   let request: Communication.query_channel_creation_permission_request = {
  //     ver: "1.0",
  //     method : "query_channel_creation_permission",
  //     params : {
  //       access_token   : accessTokenMap[nodeId].token
  //     },
  //     id     : -1
  //   }
  //   this.sendRPCMessage(nodeId, request.method, request.params);
  // }

  enableNotification(nodeId: string){
    if(accessTokenMap == null ||
      accessTokenMap == undefined||
      accessTokenMap[nodeId] == undefined)
      //TODO error
      return;

    let request: Communication.enable_notification_request = {
      version: "1.0",
      method : "enable_notification",
      params : {
        access_token   : accessTokenMap[nodeId].token
      },
      id     : -1
    }
    this.sendRPCMessage(nodeId, request.method, request.params);
  }

  ////handle push
  handleNewPostNotification(nodeId: string, params: any){
    let channel_id: number = params.channel_id;
    let id: number = params.id;
    let contentBin:any = params.content;
    let created_at: number = params.created_at;

    let content = this.serializeDataService.decodeData(contentBin);

    if (postMap == null || postMap == undefined)
      postMap = {};

    // let content
    let postId = this.getPostId(nodeId, channel_id, id);
    postMap[postId] = {
      nodeId     : nodeId,
      channel_id : channel_id,
      id         : id,
      content    : content,
      comments   : 0,
      likes      : 0,
      created_at : created_at*1000
    }

    let nodeChannelId = nodeId+channel_id;
    lastPostUpdateMap[nodeChannelId] = {
      nodeId:nodeId,
      channelId:channel_id,
      time:created_at*1000
    }
    
    this.storeService.set(PersistenceKey.lastPostUpdateMap,lastPostUpdateMap);

    this.storeService.set(PersistenceKey.postMap, postMap);
    
    unreadMap[channel_id] = unreadMap[channel_id]+1;
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

    let content = this.serializeDataService.decodeData(contentBin);

    if (commentsMap == null || commentsMap == undefined)
      commentsMap = {};
    if (commentsMap[channel_id] == null || commentsMap[channel_id] == undefined)
      commentsMap[channel_id] = {};
    if (commentsMap[channel_id][post_id] == null || commentsMap[channel_id][post_id]==undefined)
      commentsMap[channel_id][post_id] = {};

    commentsMap[channel_id][post_id][id] = {
      channel_id : channel_id,
      post_id    : post_id,
      id         : id,
      comment_id : comment_id,
      user_name  : user_name,
      content    : content,
      likes      : 0,
      created_at : this.getCurrentTimeNum()
    }

    let postId = this.getPostId(nodeId, channel_id, post_id);
    postMap[postId].comments = postMap[postId].comments+1;
    if (likeMap[postId] != null && likeMap[postId] != undefined){
      likeMap[postId] = postMap[postId];
      this.storeService.set(PersistenceKey.likeMap, likeMap);
      eventBus.publish(PublishType.updateLikeList, this.getLikeList());
    }

    this.storeService.set(PersistenceKey.postMap,postMap);
    eventBus.publish(PublishType.postDataUpdate);

    this.storeService.set(PersistenceKey.commentsMap, commentsMap);
    eventBus.publish(PublishType.commentDataUpdate);

    eventBus.publish(PublishType.updataComment,nodeId,channel_id,post_id,postMap[postId].comments);
  }

  handleNewLikesNotification(nodeId: string, params: any){
    let comment_id: number = params.comment_id;
    let channel_id: number = params.channel_id;
    let post_id: number = params.post_id;
    let count: number = params.count;

    if (comment_id == 0){
      let postId = this.getPostId(nodeId,channel_id,post_id);
      postMap[postId].likes = postMap[postId].likes+ count;
      this.storeService.set(PersistenceKey.postMap,postMap);
      if (likeMap[postId] != null && likeMap[postId] != undefined){
        likeMap[postId] = postMap[postId];
        this.storeService.set(PersistenceKey.likeMap, likeMap);
        eventBus.publish(PublishType.updateLikeList, this.getLikeList());
      }
      eventBus.publish(PublishType.postDataUpdate);
    }else {
      commentsMap[channel_id][post_id][comment_id].likes = commentsMap[channel_id][post_id][comment_id].likes + count;

      this.storeService.set(PersistenceKey.commentsMap, commentsMap);
      eventBus.publish(PublishType.commentDataUpdate);
    }
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
    }
  }

  ////handle response
  handleCreateChannelResult(nodeId:string, result: any , request: any){
    let channelId = result.id;
    let channelName = request.name;
    let channelIntro = request.introduction;
    let owner_name = this.getSignInData().name;
    let owner_did = this.getSignInData().did;
    let avatarBin = request.avatar;

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
    myChannelsMap[nodeChannelId] = channel;
    this.storeService.set(PersistenceKey.myChannelsMap,myChannelsMap);

    if (channelsMap == null || channelsMap == undefined)
      channelsMap = {};
    channelsMap[nodeChannelId] = channel;
    this.storeService.set(PersistenceKey.channelsMap, channelsMap);

    eventBus.publish(PublishType.createTopicSuccess);
    eventBus.publish(PublishType.channelsDataUpdate);
  }

  handlePublishPostResult(nodeId: string, result: any, request: any){
    let postId = result.id;
    let channelId = request.channel_id;
    let contentBin = request.content;

    let content = this.serializeDataService.decodeData(contentBin);

    let post:Post = {
      nodeId    : nodeId,
      channel_id: channelId,
      id: postId,
      content: content,
      comments: 0,
      likes: 0,
      created_at: this.getCurrentTimeNum()
    }
    let nodeChannelId = nodeId + channelId ;
    if(myChannelsMap != null && 
      myChannelsMap != undefined &&
      myChannelsMap[nodeChannelId] != null &&
      myChannelsMap[nodeChannelId] != undefined)
      myChannelsMap[nodeChannelId].last_post = content;

    let mPostId = this.getPostId(nodeId, channelId, postId);
    if (postMap == null || postMap == undefined)
      postMap = {};
    
    postMap[mPostId]=post;

    this.storeService.set(PersistenceKey.postMap, postMap);
    eventBus.publish(PublishType.postEventSuccess);
    eventBus.publish(PublishType.postDataUpdate);
    eventBus.publish(PublishType.publishPostSuccess);
  }

  handlePostCommentResult(nodeId:string, result: any, request: any){
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

  handlePostLikeResult(nodeId:string, request: any){
    let channel_id: number = request.channel_id;
    let post_id: number = request.post_id;
    let comment_id: number = request.comment_id;

    let mPostId = this.getPostId(nodeId, channel_id, post_id);
    if (comment_id == 0){
      postMap[mPostId].likes = postMap[mPostId].likes+1;
      this.storeService.set(PersistenceKey.postMap,postMap);

      likeMap[mPostId] = postMap[mPostId];
      this.storeService.set(PersistenceKey.likeMap, likeMap);

      eventBus.publish(PublishType.updateLikeList, this.getLikeList());
      eventBus.publish(PublishType.updataPostLike, nodeId, channel_id, post_id , postMap[mPostId].likes);
    }else {
      commentsMap[channel_id][post_id][comment_id].likes = commentsMap[channel_id][post_id][comment_id].likes + 1

      this.storeService.set(PersistenceKey.commentsMap, commentsMap);
      eventBus.publish(PublishType.commentDataUpdate)

    }
  }

  handlePostUnLikeResult(nodeId:string, request: any){
    let channel_id: number = request.channel_id;
    let post_id: number = request.post_id;
    let comment_id: number = request.comment_id;

    let mPostId = this.getPostId(nodeId, channel_id, post_id);

    if (comment_id == 0){
      postMap[mPostId].likes = postMap[mPostId].likes-1;
      this.storeService.set(PersistenceKey.postMap,postMap);

      likeMap[mPostId] = undefined;
      this.storeService.set(PersistenceKey.likeMap, likeMap);

      eventBus.publish(PublishType.updateLikeList, this.getLikeList());
      eventBus.publish(PublishType.updataPostLike, nodeId, channel_id, post_id , postMap[mPostId].likes);
    }else {
      commentsMap[channel_id][post_id][comment_id].likes = commentsMap[channel_id][post_id][comment_id].likes + 1

      this.storeService.set(PersistenceKey.commentsMap, commentsMap);
      eventBus.publish(PublishType.commentDataUpdate)

    }
  }

  handleGetMyChannelsResult(nodeId: string, result :any){
    for (let index = 0; index < result.length; index++) {
      let id: number = result[index].id;
      let name: string = result[index].name;
      let introduction: string = result[index].introduction;
      let subscribers: number = result[index].subscribers;
      let avatarBin: any = result[index].avatar;

      let avatar = this.serializeDataService.decodeData(avatarBin);

      let nodeChannelId = nodeId + id ;

      if (myChannelsMap == null || myChannelsMap == undefined)
        myChannelsMap = {}

      if (myChannelsMap[nodeChannelId] == undefined){
        myChannelsMap[nodeChannelId] = {
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

  handleGetMyChannelsMetaDataResult(nodeId, result: any){
    for (let index = 0; index < result.length; index++) {
      let id: number = result[index].id;
      let subscribers: number = result[index];

      let nodeChannelId = nodeId+id;
      myChannelsMap[nodeChannelId].subscribers = subscribers;
    }
    this.storeService.set(PersistenceKey.myChannelsMap, myChannelsMap);
    eventBus.publish(PublishType.myChannelsDataUpdate);
  }

  handleGetChannelsResult(nodeId: string, result: any , request: any){
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
          last_update : result[index].last_update,
          last_post   : "",
          avatar      : avatar,
          isSubscribed:false
        }
      }else{
        channelsMap[nodeChannelId].name = result[index].name;

        channelsMap[nodeChannelId].introduction = result[index].introduction;
        channelsMap[nodeChannelId].owner_name = result[index].owner_name;
        channelsMap[nodeChannelId].owner_did = result[index].owner_did;
        channelsMap[nodeChannelId].subscribers = result[index].subscribers;
        channelsMap[nodeChannelId].last_update = result[index].last_update;
      }
    }
    this.storeService.set(PersistenceKey.channelsMap, channelsMap);
    this.refreshLocalChannels();
  }

  handleGetChannelDetailResult(result: any){
  }

  handleGetSubscribedChannelsResult(nodeId: string, result: any, request: any){
    if (result == "") {
      return ;
    }

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

  handleGetPostsResult(nodeId: string, result: any, request:any){
    for (let index = 0; index < result.length; index++) {
      let channel_id = result[index].channel_id;
      let id         = result[index].id;
      let contentBin    = result[index].content;
      let comments   = result[index].comments;
      let likes      = result[index].likes;
      let created_at = result[index].created_at;

      let content = this.serializeDataService.decodeData(contentBin);

      if (postMap == null || postMap == undefined)
        postMap = {}

      let mPostId = this.getPostId(nodeId, channel_id, id);
      postMap[mPostId] = {
        nodeId     : nodeId,
        channel_id : channel_id,
        id         : id,
        content    : content,
        comments   : comments,
        likes      : likes,
        created_at : created_at*1000
      }

      let nodeChannelId = nodeId+channel_id
      lastPostUpdateMap[nodeChannelId] = {
        nodeId: nodeId,
        channelId: channel_id,
        time:created_at*1000
      }
    }

    this.storeService.set(PersistenceKey.lastPostUpdateMap, lastPostUpdateMap);
    this.storeService.set(PersistenceKey.postMap, postMap);

    eventBus.publish(PublishType.postDataUpdate);
    // eventBus.publish(PublishType.updatePost,this.getPostList());

    // if (request.upper_bound == null){
    //   this.refreshLocalPost(nodeId, request.channel_id);
    // } else{
    //   this.loadMoreLocalPost(nodeId, request.channel_id);
    // }
  }

  handleGetCommentsResult(result: any){
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
        channel_id : channel_id,
        post_id    : post_id,
        id         : id,
        comment_id : comment_id,
        user_name  : user_name,
        content    : content,
        likes      : likes,
        created_at : created_at
      }

      if (commentsMap == null || commentsMap == undefined)
        commentsMap = {};
      if (commentsMap[channel_id] == null || commentsMap[channel_id] == undefined)
        commentsMap[channel_id] = {}
      if (commentsMap[channel_id][post_id] == null || commentsMap[channel_id][post_id] == undefined)
        commentsMap[channel_id][post_id] = {}
  
      commentsMap[channel_id][post_id][id] = comment;
    }
    this.storeService.set(PersistenceKey.commentsMap, commentsMap);
  }

  handleGetStatisticsResult(nodeId: string, result: any){
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

  handleSubscribeChannelResult(nodeId: string, request: any){
    let nodeChannelId = nodeId+request.id;

    channelsMap[nodeChannelId].isSubscribed = true;
    this.storeService.set(PersistenceKey.channelsMap,channelsMap);
    eventBus.publish(PublishType.subscribeFinish, nodeId,request.id, channelsMap[nodeChannelId].name);

    this.refreshSubscribedChannels();

    let lastPostTime = 0;
    if (lastPostUpdateMap[nodeChannelId] != null && lastPostUpdateMap[nodeChannelId] != undefined)
      lastPostTime = lastPostUpdateMap[nodeChannelId].time;
    this.updatePost(nodeId,request.id,lastPostTime);
  }

  handleUnsubscribeChannelResult(nodeId:string, request: any){
    let nodeChannelId = nodeId+request.id;

    channelsMap[nodeChannelId].isSubscribed = false;
    this.storeService.set(PersistenceKey.channelsMap,channelsMap);

    subscribedChannelsMap[nodeChannelId] = undefined;
    this.storeService.set(PersistenceKey.subscribedChannelsMap,subscribedChannelsMap);


    this.refreshLocalSubscribedChannels();

    this.deletePostFromChannel(nodeId, request.id);
    
    eventBus.publish(PublishType.unsubscribeFinish, nodeId,request.id, channelsMap[nodeChannelId].name);
  }

  handleAddNodePublisherResult(){

  }

  handleRemoveNodePublisherResult(){

  }

  handleQueryChannelCreationPermissionResult(nodeId: string, result: any){
    if (creationPermissionMap == null || creationPermissionMap == undefined)
      creationPermissionMap = {};
    creationPermissionMap[nodeId]=result.authorized;
  }

  handleEnableNotificationResult(){
    //success
  }


  ////
  refreshChannelsTest(){
    return this.getFavoriteFeeds();
  }
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
        feedsUrl          : feedsUrl
        // status            : ConnState.disconnected
      }

      this.resolveServer(server, null);
    });
  }

  insertFakeData(){

    this.storeService.remove(PersistenceKey.myChannelsMap);
  }

  getChannelFromId(nodeId: string, id: number): Channels{
    let nodeChannelId = nodeId+id;
    if (channelsMap == null || channelsMap == undefined)
      return undefined;
    return channelsMap[nodeChannelId];
  }

  getPostFromId(nodeId: string, channelId: number, postId: number):Post{
    let mPostId = this.getPostId(nodeId, channelId, postId);
    return postMap[mPostId];
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
       commentsMap[channelId] == null || commentsMap[channelId] == undefined){
         return [];
    }

    let list: Comment[] =[];
    let keys: string[] = Object.keys(commentsMap[channelId][postId]);
    for (const index in keys) {
      if (commentsMap[channelId][postId][keys[index]] == undefined) 
        continue;
      list.push(commentsMap[channelId][postId][keys[index]]);
    }

    list.sort((a, b) => Number(b.created_at) - Number(a.created_at));

    return list;
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
    let keys: string[] = Object.keys(postMap);
    localPostList = [];
    for (const index in keys) {
      if (postMap[keys[index]] == null || postMap[keys[index]] == undefined)
        continue;

      let nodeChannelId = postMap[keys[index]].nodeId + postMap[keys[index]].channel_id;
      if (subscribedChannelsMap[nodeChannelId] != null || subscribedChannelsMap[nodeChannelId] != undefined)
        list.push(postMap[keys[index]]);
    }
    
    list.sort((a, b) => Number(b.created_at) - Number(a.created_at));
    return list;
  }

  getPostId(nodeId: string, channelId: number, postId: number): string{
    return nodeId+channelId+postId;
  }

  getPostListFromChannel(nodeId: string, channelId: number){
    let list: Post[] = [];
    let keys: string[] = Object.keys(postMap);
    localPostList = [];
    for (const index in keys) {
      if (postMap[keys[index]] == null || postMap[keys[index]] == undefined)
        continue;

      if (postMap[keys[index]].nodeId == nodeId && postMap[keys[index]].channel_id == channelId)
        list.push(postMap[keys[index]]);
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
      if (likeMap[keys[index]] == null || likeMap[keys[index]] == undefined)
        continue;
        list.push(likeMap[keys[index]]);
    }
    
    list.sort((a, b) => Number(b.created_at) - Number(a.created_at));
    return list;
  }

  updatePost(nodeId: string, channelId:number, lastPostUpdateTime){
    this.getPost(nodeId,channelId,Communication.field.last_update,0,lastPostUpdateTime,0);
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
    if (text.length < limit)
      return text;
    
    let half = indexLength/2 ;
    return text.slice(0,half)+"..."+text.slice(text.length-half+1, text.length);
  }

  parsePostContentText(content: string): string{
    if (content == undefined){
      return "";
    }
    
    if (content.indexOf("text") != -1){
      let contentObj = JSON.parse(content);
      return contentObj.text;
    }
    
    return content;
  }

  parsePostContentImg(content: any): string{
    if (content == undefined){
      return "";
    }

    if (content.indexOf("img") != -1){
      let contentObj = JSON.parse(content);
      return contentObj.img;
    }

    return "";
  }

  publishDid(payload: string, onSuccess?: (ret: any)=>void, onError?: (err:any)=>void) {
    let params = {
        didrequest: payload
    }

    appManager.sendIntent("didtransaction", params, {}, onSuccess, onError);
  }




  signinChallengeRequest(nodeId: string , requiredCredential: boolean){
    let request: Communication.signin_request_challenge_request = {
      version: "1.0",
      method : "signin_request_challenge",
      id     : -1,
      params : {
          iss: this.getSignInData().did,
          credential_required: requiredCredential,
      }
    }

    this.sendRPCMessage(nodeId, request.method, request.params);
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
      


      this.sendRPCMessage(nodeId, request.method, request.params);
    }).catch((err)=>{
      // console.log("err = "+err);
    });
  }

  handleSigninChallenge(nodeId:string, result: any){
    let requiredCredential = result.credential_required;
    let jws = result.jws;
    let credential = result.credential;

    // {"signatureIsValid":true,"payload":{"iss":"did:elastos:ikZJ3Z7JqmZ8HHoThcqyVQfd2zHhseTWnt","sub":"didauth","realm":"GDY3wCVgegMrVAn7mLctQHyxPPwVAv7ShJ77yuanQZqM","nonce":"8pNVf8sPUYG1RPbrSV8dk1daMZBcRvq6S"}}
    this.parseJWS(true,jws,
      (res)=>{

        let payloadStr = JSON.stringify(res.payload);
        let payload = JSON.parse(payloadStr);
        let nonce = payload.nonce;
        let realm = payload.realm;

        this.signinConfirmRequest(nodeId, nonce, realm , requiredCredential);
      },
      (err)=>{
        // console.log("err =>"+err);
      }
      );
  }

  handleSigninConfirm(nodeId:string, result: any){
    if (accessTokenMap == null || accessTokenMap == undefined)
      accessTokenMap = {};

    accessTokenMap[nodeId] = {
      token: result.access_token ,
      exp: result.exp
    };

    this.storeService.set(PersistenceKey.accessTokenMap, accessTokenMap);

    this.prepare(nodeId);

    eventBus.publish("feeds:login_finish", nodeId);
    this.native.toast("Sign in success!");
  }

  declareOwnerRequest(nodeId: string, carrierAddress: string){
    let request: Communication.declare_owner_request = {
      version: "1.0",
      method : "declare_owner",
      id     : -1,
      params : {
          nonce: this.generateNonce(),
          owner_did: this.getSignInData().did
      }
    }

    cacheBindingAddress = carrierAddress;
    this.sendRPCMessage(nodeId, request.method, request.params);
  }


  importDidRequest(nodeId: string, params){
    let request: Communication.import_did_request = {
      version: "1.0",
      method  : "import_did",
      id      : -1,
      params  : {
        mnemonic: "string",
        passphrase: "string",
        index: 1
      }
    }

    this.sendRPCMessage(nodeId, request.method, request.params);
  }

  createDidRequest(nodeId: string){
    let request: Communication.create_did_request = {
      version: "1.0",
      method  : "import_did",
      id      : -1,
    }

    this.sendRPCMessage(nodeId, request.method, null);
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
    this.sendRPCMessage(nodeId, request.method, request.params);
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

  handleDeclareOwnerResponse(nodeId: string, result: any){
    let phase = result.phase;
    let did = "";
    let payload = "";

    if (phase == "did_imported"){
      did = result.did;
      payload = result.transaction_payload;

      let feedUrl = "feeds://"+did;
      let defaultServer = {
        name              : "No name provided",
        owner             : this.getSignInData().name,
        introduction      : "No intro provided",
        did               : did,
        carrierAddress    : cacheBindingAddress,
        nodeId            : nodeId,
        feedsUrl          : feedUrl
      }
      this.handleImportDID(feedUrl, defaultServer, (server)=>{
          bindingServerCache = {
            name              : server.name,
            owner             : server.owner,
            introduction      : server.introduction,
            did               : server.did,
            carrierAddress    : server.carrierAddress,
            nodeId            : server.nodeId,
            feedsUrl          : feedUrl
          }
          eventBus.publish("feeds:resolveDidSucess", nodeId, did);
      },(err)=>{
        bindingServerCache = defaultServer;
        eventBus.publish("feeds:resolveDidError", nodeId, did, payload);
      });
    }

    // console.log("phase==>"+phase);
    // switch(phase){
    //   case "owner_declared":
    //     this.createDidRequest(nodeId);
    //     break;
    //   case "did_imported":
    //     // {
    //     //   "jsonrpc": "2.0",
    //     //   "id": 0,
    //     //   "result": {
    //     //     "phase": "did_imported",
    //     //     "did": "did:elastos:imWLKpc7re166G9oASY5tg2dXD4g9PkTV2",
    //     //     "transaction_payload": "{\"header\":{\"specification\":\"elastos/did/1.0\",\"operation\":\"create\"},\"payload\":\"eyJpZCI6ImRpZDplbGFzdG9zOmltV0xLcGM3cmUxNjZHOW9BU1k1dGcyZFhENGc5UGtUVjIiLCJwdWJsaWNLZXkiOlt7ImlkIjoiI3ByaW1hcnkiLCJwdWJsaWNLZXlCYXNlNTgiOiJmbVR1WUg5M3FRdkFxMjdreHJpd2h4NERQQjdnelFWWm5SaVIxRHpyb0NaZCJ9XSwiYXV0aGVudGljYXRpb24iOlsiI3ByaW1hcnkiXSwiZXhwaXJlcyI6IjIwMjUtMDYtMDhUMDE6MDI6MDRaIiwicHJvb2YiOnsiY3JlYXRlZCI6IjIwMjAtMDYtMDhUMDk6MDI6MDRaIiwic2lnbmF0dXJlVmFsdWUiOiI2bnNWNW52VThjZGs2RmhjQTZzb09aQ1lLa0dSV0hWWDR2cjRIQkZQU1pJUkNteFQ2SDN6ekF5ZG56VkNIRW5WekZrNERhbEk2d2w5anNVWFlGSjFLdyJ9fQ\",\"proof\":{\"verificationMethod\":\"#primary\",\"signature\":\"MFogBVri42dj7nY8SCEZsP0CLlVDzUI5cHNFu4JYhZyWpxnCQFnJzhze8jWxErcp3vA-2IIqRwxoeIacg4bq4g\"}}"
    //     //   }
    //     // }
    //     let did = result.did;
    //     let transaction_payload = result.transaction_payload;
    //     //调用wallet 上链did
    //     console.log("handleImportDIDResponse");
    //     this.createIdTransactionCallback(transaction_payload);
    //     //上链后
    //     this.issueCredential(nodeId, did);
    //     break;
    //   case "credential_issued":
    //     break;
    // }

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
  handleImportDIDResponse(nodeId: string, result: any){
    let did = result.did;
    let transaction_payload = result.transaction_payload;

    //TODO resolve Document
    // bindingServer = {
    //   name              : "name",
    //   owner             : "owner",
    //   introduction      : "intro",
    //   did               : did,
    //   carrierAddress    : cacheBindingAddress,
    //   nodeId            : nodeId,
    //   feedsUrl          : "feeds://"+did+"/"+cacheBindingAddress
    // }

    let feedUrl = "feeds://"+did;
    let defaultServer = {
      name              : "No name provided",
      owner             : this.getSignInData().name,
      introduction      : "No intro provided",
      did               : did,
      carrierAddress    : cacheBindingAddress,
      nodeId            : nodeId,
      feedsUrl          : feedUrl
    }
    this.handleImportDID(feedUrl, defaultServer, (server)=>{
        bindingServerCache = {
          name              : server.name,
          owner             : server.owner,
          introduction      : server.introduction,
          did               : server.did,
          carrierAddress    : server.carrierAddress,
          nodeId            : server.nodeId,
          feedsUrl          : feedUrl
        }
        eventBus.publish("feeds:resolveDidSucess", nodeId, did);
    },(err)=>{
      bindingServerCache = defaultServer;
      eventBus.publish("feeds:resolveDidError", nodeId, did, transaction_payload);
    });

    eventBus.publish("feeds:did_imported", nodeId, did, transaction_payload);
  }

  handleImportDID(feedUrl: string, defaultServer: Server, onSuccess: (server: Server)=>void, onError: (err: any)=>void){
    this.resolveDidDocument(feedUrl, defaultServer, onSuccess, onError);
  }

  // doResolveDidDocument(did: string, address: string, nodeId: string, onSuccess: (server: Server)=>void, onError?: (err: any)=>void){
  //   let feedsUrl = "feeds://"+did+"/"+address;
  //   let defaultServer = {
  //     name              : "No name provided",
  //     owner             : "No owner provided",
  //     introduction      : "No intro provided",
  //     did               : did,
  //     carrierAddress    : address,
  //     nodeId            : nodeId,
  //     feedsUrl          : "feeds://"+did+"/"+address
  //   }

  //   this.resolveDidDocument("feeds://"+did, defaultServer, onSuccess, onError);
  // }

  handleIssueCredentialResponse(nodeId: string, result: any){
    // if (bindingServerMap == null && bindingServerMap == undefined)
    //   bindingServerMap = {}

    // bindingServerMap[nodeId] = bindingServer;

    // this.storeService.set(PersistenceKey.bindingServerMap,bindingServerMap);

    
    let feedUrl = "feeds://"+bindingServerCache.did;
    let defaultServer = {
      name              : "No name provided",
      owner             : this.getSignInData().name,
      introduction      : "No intro provided",
      did               : bindingServerCache.did,
      carrierAddress    : cacheBindingAddress,
      nodeId            : nodeId,
      feedsUrl          : feedUrl
    }
    this.handleImportDID(feedUrl, defaultServer, (server)=>{
        bindingServer = {
          name              : server.name,
          owner             : server.owner,
          introduction      : server.introduction,
          did               : server.did,
          carrierAddress    : server.carrierAddress,
          nodeId            : server.nodeId,
          feedsUrl          : feedUrl
        }
        this.storeService.set(PersistenceKey.bindingServer,bindingServer);
        this.resolveServer(bindingServer, ConnState.connected);
        eventBus.publish("feeds:issue_credential");
        eventBus.publish("feeds:bindServerFinish",bindingServer);
    },(errserver)=>{
      bindingServer = defaultServer;
      this.storeService.set(PersistenceKey.bindingServer,bindingServer);
      this.resolveServer(bindingServer, ConnState.connected);
      eventBus.publish("feeds:issue_credential");
      eventBus.publish("feeds:bindServerFinish",bindingServer);
    });




    // this.resolveServer(bindingServer,ConnState.connected);
  }

  
  issueCredential(nodeId: string, did: string) {
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
          name:this.getSignInData().name,
          // moreComplexData: {
          //   info: "A sub-info"
          // }
      },
      
      expirationdate: new Date(2024, 10, 10).toISOString() // Credential will expire on 2024-11-10 - Note the month's 0-index...
    }, {}, (response) => {

      if (response.result.credential) {
        //TODO
        // this.zone.run(() => {
        //   this.navCtrl.navigateForward("credissued", {
        //     queryParams: {
        //       credential: response.result.credential
        //     }
        //   });
        // })
        this.issueCredentialRequest(nodeId, response.result.credential);
      }
      else {
        console.log("Failed to issue a credential - empty credential returned");
        // this.didDemoService.toast("Failed to issue a credential - empty credential returned");
      }
    }, (err)=>{
      console.log("Failed to issue a credential: "+JSON.stringify(err));
      // this.didDemoService.toast("Failed to issue a credential: "+JSON.stringify(err));
    })
  }

  getFriendConnection(nodeId: string){
    if(friendConnectionMap == null || 
      friendConnectionMap == undefined ||
      friendConnectionMap[nodeId] == undefined)
      return ConnState.disconnected;
    return friendConnectionMap[nodeId];
  }

  checkExp(accessToken: AccessToken): boolean{
    if(accessTokenMap == null || accessTokenMap ==undefined)
      return false;
    if (accessToken.exp < this.getCurrentTimeNum())
      return false;
    return true;
  }

  prepare(friendId: string){

    this.getStatistics(friendId);
    this.enableNotification(friendId);
    // this.queryChannelCreationPermission(friendId);

    let list = this.getSubscribedChannelsFromNodeId(friendId);
    for (let index = 0; index < list.length; index++) {
      let channelId = list[index].id;
      let nodeChannelId = friendId+channelId;
      let lastPostTime = 0;
      if (lastPostUpdateMap[nodeChannelId] != null && lastPostUpdateMap[nodeChannelId] != undefined)
        lastPostTime = lastPostUpdateMap[nodeChannelId].time;

      this.updatePost(friendId,channelId,lastPostTime);
    }
  }


  saveCredential(credential: string){
    localCredential = credential;

    this.storeService.set(PersistenceKey.credential, localCredential);
  }

  getLocalCredential(){
    if (localCredential == ""){
      localCredential = this.storeService.get(PersistenceKey.credential);
    }

    return localCredential;
  }

  removeAllData(){

    this.storeService.remove(PersistenceKey.firstInit);
    this.storeService.remove(PersistenceKey.favoriteFeedsMap);
    this.storeService.remove(PersistenceKey.allFeedsMap);
    this.storeService.remove(PersistenceKey.eventsMap);
    this.storeService.remove(PersistenceKey.myFeedsMap);
    this.storeService.remove(PersistenceKey.myEventMap);
    this.storeService.remove(PersistenceKey.avatar);
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
  }

  getBindingServer(): Server{
    return bindingServer;
  }

  addServer(carrierAddress: string,friendRequest: string,
    name: string, owner: string, introduction: string, 
    did: string, feedsUrl: string,
    onSuccess:()=>void, onError?:(err: string)=>void){
    this.carrierService.isValidAddress(carrierAddress, (isValid) => {
      if (!isValid){
        this.alertError("Address invalid");
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

  alertError(error: string){
    alert(error);
  }

  getLikeFromId(nodechannelpostId: string): Post{
    if (likeMap == null || likeMap == undefined)
      likeMap = {};
    
    return likeMap[nodechannelpostId];
  }

  checkMyLike(nodeId: string, channelId: number, postId: number): boolean{
    if(this.getLikeFromId(nodeId+channelId+postId) == undefined)
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
}


//// Virtual data
let virtualServersMap: any = {
  "did1":
    {
      name              : "name1",
      owner             : "owner1",
      introduction      : "introduction1",
      did               : "did1",
      carrierAddress    : "carrierAddress1",
      userId            : "J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo",
      status            : ConnState.connected
    },
  "did2":
    {
      name              : "name2",
      owner             : "owner2",
      introduction      : "introduction2",
      did               : "did2",
      carrierAddress    : "carrierAddress2",
      userId            : "3x4xVSJmtvty1tM8vzcz2pzW2WG7TmNavbnz9ka1EtZy",
      status            : ConnState.disconnected
    },
}

let virtrulFeedEvents = [
  new FeedEvents('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo',
    'Carrier News',
    '1584956175537',
    `1.Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
    The key difference between the applications available here and what you will find in any other app store is
    Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
    the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`,
    1,
    ""),
  new FeedEvents('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo',
    'Carrier News',
    '1584956175537',
    `2.Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
    The key difference between the applications available here and what you will find in any other app store is
    Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
    the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`,
    1,
    ""),
  new FeedEvents('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo',
    'Carrier News',
    '1584956175537',
    `3.Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
    The key difference between the applications available here and what you will find in any other app store is
    Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
    the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`,
    1,
    ""),
  new FeedEvents('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo',
    'Carrier News',
    '1584956175537',
    `4.Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
    The key difference between the applications available here and what you will find in any other app store is
    Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
    the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`,
    1,
    ""),
];

let virtualFFMap:any = {
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoCarrier News':
    new FavoriteFeed('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'Carrier News', '', 24, 0, '', virtrulFeedEvents[0].message,true),
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoHive News':
    new FavoriteFeed('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'Hive News',  '', 35, 0 , '',virtrulFeedEvents[0].message, true),
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoFootball':
    new FavoriteFeed('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'Football',  '', 4, 0, '',virtrulFeedEvents[0].message, true),
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoTrinity News':
    new FavoriteFeed('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'Trinity News',  '', 0, 0, '1584956175537',virtrulFeedEvents[0].message, true),
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoHollywood Movies':
    new FavoriteFeed('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'Hollywood Movies', '',  24, 0, '',virtrulFeedEvents[0].message, true),
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoCofee':
    new FavoriteFeed('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'Cofee',  '', 35, 0, '', virtrulFeedEvents[0].message,true),
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoMacBook':
    new FavoriteFeed('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'MacBook',  '', 4, 0, '', virtrulFeedEvents[0].message,true),
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoRust development':
    new FavoriteFeed('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'Rust development', '',  0, 0, '1584956175537', virtrulFeedEvents[0].message,true),
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoGolang':
  new FavoriteFeed('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'Golang',  '', 8, 0, '', virtrulFeedEvents[0].message, true)
}

let virtualMyEvents = 
  [
    {
      timestamp: '1584956175537',
      message:
        `1.Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
        The key difference between the applications available here and what you will find in any other app store is
        Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
        the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`
    },
    {
      timestamp: '1584956175537',
      message:
        `2.Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
        The key difference between the applications available here and what you will find in any other app store is
        Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
        the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`
    },
    {
      timestamp: '1584956175537',
      message:
        `3.Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
        The key difference between the applications available here and what you will find in any other app store is
        Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
        the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`
    },
    {
      timestamp: '1584956175537',
      message:
        `4.Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
        The key difference between the applications available here and what you will find in any other app store is
        Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
        the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`
    }
  ];

let virtrulMyFeeds = {
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoCarrier News':
    new MyFeed('paper', 'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'Carrier News', '', '1584956175537',"",virtualMyEvents[0].message, false),
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoHive News':
    new MyFeed('paper', 'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'Hive News', '', '1584956175537',"",virtualMyEvents[0].message,false),
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoTrinity News':
    new MyFeed('paper', 'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'Trinity News', '', '1584956175537',"",virtualMyEvents[0].message,false),
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoDID News':
    new MyFeed('paper', 'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'DID News', '', '1584956175537',"",virtualMyEvents[0].message,false),
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoDID SideChain News':
    new MyFeed('paper', 'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'DID SideChain News', '', '1584956175537',"",virtualMyEvents[0].message,false),
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoFootball News':
    new MyFeed('paper', 'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'Football News', '', '1584956175537',"",virtualMyEvents[0].message,false)
}

let virtualAFMap: any = {
  "J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoCarrier News":
    new AllFeed("J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo","page","Carrier News","Carrier News description","Subscribed"),
  "J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoHive News":
    new AllFeed("J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo","page","Hive News","Carrier News description","Subscribed"),
  "J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoTrinity News":
    new AllFeed("J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo","page","Trinity News","Carrier News description","Subscribed"),
  "J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoDID News":
    new AllFeed("J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo","page","DID News","Carrier News description","Subscribe"),
  "J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoDMA News":
    new AllFeed("J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo","page","DMA News","Carrier News description","Subscribed"),
  "J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoFootball News":
    new AllFeed("J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo","page","Football News","Carrier News description","Subscribe")
}



let virtualEvents = {
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoCarrier News':virtrulFeedEvents,
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoHive News':virtrulFeedEvents,
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoFootball':virtrulFeedEvents,
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoTrinity News':virtrulFeedEvents,
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoHollywood Movies':virtrulFeedEvents,
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoCofee':virtrulFeedEvents,
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoMacBook':virtrulFeedEvents,
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoRust development':virtrulFeedEvents,
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoGolang':virtrulFeedEvents
}



let virtualMyEventMap = {
  "J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoCarrier News":virtualMyEvents,
  "J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoHive News":virtualMyEvents,
  "J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoTrinity News":virtualMyEvents,
  "J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoDID News":virtualMyEvents,
  "J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoDID SideChain News":virtualMyEvents,
  "J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoFootball News":virtualMyEvents
}
