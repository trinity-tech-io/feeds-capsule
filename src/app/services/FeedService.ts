import { Injectable } from "@angular/core";
import { Platform } from '@ionic/angular';
import { CarrierService } from 'src/app/services/CarrierService';
import { Events } from '@ionic/angular';
import { JsonRPCService } from 'src/app/services/JsonRPCService';
import { TransportService } from 'src/app/services/TransportService';
import { StorageService } from 'src/app/services/StorageService';


@Injectable()
export class Friend{
  constructor(
      public userId: string,
      // public address: string,
      public email: string,
      public region: string,
      public name: string,
      public status: ConnState) {}
}

enum ConnState {
  connected = 0,
  disconnected = 1
};

enum MethodType {
  subscribe = "0",
  unsubscribe = "1",
  exploreTopics = "2",
  listSubscribed = "3",
  fetchUnreceived = "4",

  createTopic = "11",
  postEvent = "12",
  listOwnedTopics = "13",
}

enum PersistenceKey{
  firstInit = "firstInit",

  // {nodeId:{Friend}}
  serversMap = "serversMap",
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

  avatar = "avatar"
}

// let serverUserIdList:any = [];
let connectionStatus = ConnState.disconnected;
// let serverList: Friend[] = [];
// let serverList: string[] = [];
//{"nodeId":{Friend}}
let serversMap: object = {};
let favoriteFeedsMap: object = {};
let allFeedsMap: object = {} ;

// let exploreFeedList: FeedDescs[] = [];

// let eventList: string[] = [];
let eventsMap: {} = {};

// let myFeedList: string[] = [];
// let myFeedMap: {} = {};
let myFeedsMap: object = {};

let myEventMap: {} = {};
// let eventsMap:{topic: string, eventList: FeedEvents[]};
let fetchList: FavoriteFeed[] = [];
let firstInit: boolean;
let needFetch: boolean = true;
let firstListMyFeed: boolean = true;

let eventBus = null;
let currentFetchFeeds: FavoriteFeed;
// let fetchTopic: string = "";
// let lastFetchTopic: string = "";
let unSubscribeTopic: string = "";
let subscribeTopic: string = "";
let currentFeedEventKey: string = "";
let currentCreateTopicNID = "";

let postEventTmp: FeedEvents;

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
    public archive: boolean) {}
}

export class FeedEvents{
  constructor(
    public nodeId: string,
    public topic: string,
    public timestamp: string,
    public message: string,
    public seqno: number){
  }
}

export class FeedIntro{
  constructor(public description: string){
  }
}

@Injectable()
export class FeedService {
  public constructor(
    private platform: Platform,
    private events: Events,
    private jsonRPCService: JsonRPCService,
    private transportService: TransportService,
    private carrierService: CarrierService,
    private storeService: StorageService) {
      eventBus = events;
      this.init();
  }

  init(){
      if (this.platform.platforms().indexOf("cordova") < 0) {
      serversMap = virtualServersMap;
      favoriteFeedsMap = virtualFFMap;
      allFeedsMap = virtualAFMap ;
      eventsMap = virtualEvents

      myFeedsMap = virtrulMyFeeds;

      myEventMap = virtualMyEventMap;

      return;
    }

    this.initData();

    this.initCallback();
  }

  initData(){
    firstInit = this.storeService.get(PersistenceKey.firstInit);
    firstInit = true; // for test
    if (firstInit == null) {
      firstInit = true;
    }

    serversMap = this.storeService.get(PersistenceKey.serversMap);
    if (serversMap == null || serversMap == undefined){
      serversMap = {};
    }

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

    allFeedsMap = this.storeService.get(PersistenceKey.allFeedsMap);
    if (allFeedsMap == null || allFeedsMap == undefined) {
      allFeedsMap = {};
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
  }

  initCallback(){
    this.carrierReadyCallback();
    this.friendAddCallback();
    this.friendConnectionCallback();
    this.friendMessageCallback();
    this.connectionChangedCallback();
  }

  prepare(){
    this.carrierService.getFriends(
        (ret) => {
          this.parseFriends(ret);
        },
        null);
  }

  getConnectionStatus() {
    return connectionStatus;
  }

  getServerList(): Friend[]{
    let list: Friend[] = [];
    let keys: string[] = Object.keys(serversMap);
    for (const index in keys) {
      if (serversMap[keys[index]] == undefined) 
        continue;
      if (serversMap[keys[index]].status == undefined) 
        serversMap[keys[index]].status = ConnState.disconnected;
      list.push(serversMap[keys[index]]);
    }
    return list;
  }

  getFavoriteFeeds(): FavoriteFeed[]{
    let list: FavoriteFeed[] = [];
    let keys: string[] = Object.keys(favoriteFeedsMap);
    for (const index in keys) {
      if (favoriteFeedsMap[keys[index]] == undefined)
        continue;
      list.push(favoriteFeedsMap[keys[index]]);
    }
    return list;
  }

  public getAllFeeds(): AllFeed[] {
    let list: AllFeed[] = [];
    let keys: string[] = Object.keys(allFeedsMap);
    for (const index in keys) {
      if (allFeedsMap[keys[index]] == undefined)
        continue;
      list.push(allFeedsMap[keys[index]]);
    }
    return list;
  }

  public getFeedDescr(feedKey: string): string {
    return allFeedsMap[feedKey].desc;
  }

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
    Object.assign(list, eventsMap[feedEventKey]);
    
    return list.reverse();
  }

  public getMyFeeds() {
    let list: MyFeed[] = [];
    let keys: string[] = Object.keys(myFeedsMap);
    for (const index in keys) {
      if (myFeedsMap[keys[index]] == undefined) 
        continue;
      list.push(myFeedsMap[keys[index]]);
    }
    return list;
  }

  public updateMyFeedArchiveStatus(nodeId: string, topic: string, isArchive: boolean){
    myFeedsMap[nodeId+topic].archive = isArchive;
    this.updateMyFeedsMap();

    eventBus.publish("feeds:ownFeedListChanged",this.getMyFeeds());
  }
  
  public getMyFeedEvents(nodeId: string, topic: string) {
    if (myEventMap == null || 
        myEventMap == undefined || 
        myEventMap[nodeId+topic] == null || 
        myEventMap[nodeId+topic] == undefined){
      return [];
    }
    return myEventMap[nodeId+topic];
  }

  public getArcstatus(nodeId: string, topic: string){
    if (myFeedsMap == undefined || myFeedsMap[nodeId+topic] == undefined){
      return false ;
    }
    return myFeedsMap[nodeId+topic].archive;
  }


  // updateServerList(serverList: string[], serverMap:any, server:Friend){
  //   if(serverList == null || serverList == undefined){
  //     return ;
  //   }
    
  //   let index = serverList.indexOf(server.userId);

  //   if (index == -1){
  //     serverList.push(server.userId);
  //     serverMap[server.userId] = server;
  //     return ;
  //   }

  //   serverMap[server.userId] = server;


  //   // for (let i = 0; i < serverList.length; i++) {
  //   //   let serverKey = serverList[]
  //   //   const server = serverList[i];
  //   //   if(server.userId == userId){
  //   //     server.status = connectStatus;
  //   //     return server;
  //   //   }
  //   // }
  // }

  sendMessage(nodeId: string, method: string, params: any, id: string){
    if(!this.checkServerConnection(nodeId)){
      return;
    }

    let message = this.jsonRPCService.assembleJson(method, params, id);
    this.transportService.transportMsg(
      nodeId, 
      JSON.stringify(message), 
      ()=>{
        // alert("success")
      }, 
      (error)=>alert("error="+error));
  }
  
  //{"jsonrpc":"2.0","method":"create_topic","params":{"topic":"news","desc":"daily"},"id":null}
  createTopic(nodeId: string, topic: string, desc: string){
      currentCreateTopicNID = nodeId;
      let params = {};
      params["topic"] = topic;
      params["desc"] = desc;

      this.sendMessage(nodeId, "create_topic", params, MethodType.createTopic);
  }

  //{"jsonrpc":"2.0","method":"post_event","params":{"topic":"news","event":"newsevent"},"id":null}
  postEvent(nodeId: string, topic: string, event: string){
      let params = {};
      params["topic"] = topic;
      params["event"] = event;

      let lastSeqno = 0;
      if (myEventMap[nodeId+topic] != null || myEventMap[nodeId+topic] != undefined){
        lastSeqno = myEventMap[nodeId+topic].seqno;
      }
        
      postEventTmp = new FeedEvents(nodeId,topic,this.getCurrentTime(),event,lastSeqno++);
      this.sendMessage(nodeId, "post_event", params, MethodType.postEvent);
  }

  //{"jsonrpc":"2.0","method":"list_owned_topics","id":null}
  listOwnedTopics(nodeId: string){
    this.sendMessage(nodeId, "list_owned_topics", null, MethodType.listOwnedTopics);
  }

  //{"jsonrpc":"2.0","method":"subscribe","params":{"topic":"movie"},"id":null}
  subscribe(nodeId: string, topic: string){
    let params = {};
    params["topic"] = topic;
    subscribeTopic = topic ;
    this.sendMessage(nodeId, "subscribe", params, MethodType.subscribe);
  }

  doSubscribe(){
    
    // this.subscribe();
  }

  //{"jsonrpc":"2.0","method":"unsubscribe","params":{"topic":"movie"},"id":null}
  unSubscribe(nodeId: string, topic: string){
      let params = {};
      params["topic"] = topic;
      unSubscribeTopic = topic;
      this.sendMessage(nodeId, "unsubscribe", params, MethodType.unsubscribe);
  }

  //{"jsonrpc":"2.0","method":"explore_topics","id":null}
  exploreTopics(nodeId: string){
      this.sendMessage(nodeId, "explore_topics", null, MethodType.exploreTopics);
  }

  //{"jsonrpc":"2.0","method":"list_subscribed_topics","id":null}
  listSubscribed(nodeId: string){
    this.sendMessage(nodeId, "list_subscribed_topics", null, MethodType.listSubscribed);
  }

  //{"jsonrpc":"2.0","method":"fetch_unreceived","params":{"topic":"movie","since":1021438976},"id":null}
  fetchUnreceived(nodeId: string, topic: string, since: number){
      // fetchTopic = topic;
      let params = {};
      params["topic"] = topic;
      params["since"] = since;
      this.sendMessage(nodeId, "fetch_unreceived", params, MethodType.fetchUnreceived);
  }

  // parseFriends(data:any): Friend[]{
  //   let serverFriendList: Friend[] = [];
  //   let servers = data.friends;
  //       if (typeof servers == "string") {
  //         servers = JSON.parse(servers);
  //       }
  //       for (let id in servers) {
  //           let friend = new Friend(servers[id].userInfo.userId,
  //                                   servers[id].userInfo.name,
  //                                   servers[id].connection);
  //           serverFriendList.push(friend);
  //       }
  //   return serverFriendList;
  // }



  carrierReadyCallback(){
    this.events.subscribe('carrier:ready', () => {
      if (firstInit) {
        this.prepare();
        // this.storeService.set(PersistenceKey.firstInit,false);
      }
    });
  }

  friendConnectionCallback(){
    this.events.subscribe('carrier:friendConnection', ret => {
      let friendId = ret.friendId;
      let friendStatus = ret.status;

      let server = this.findServer(friendId);
      server.status = friendStatus;
      this.pushServer(server);
      this.updateServerMap();

      if (friendStatus == ConnState.connected){
        this.listSubscribed(friendId);
        // TODO If the server supports checks own published server
        this.listOwnedTopics(friendId);
      }

      eventBus.publish('feeds:updateServerList',this.getServerList());
      
    });
  }

  friendAddCallback(){
    this.events.subscribe('carrier:friendAdded', msg => {
      let server: any;
      if (this.platform.platforms().indexOf("cordova") < 0){
          server = new Friend('100', 
                              // 'New Address', 
                              'NewEmail@email.com', 
                              'beijing', 
                              'New Contact', 
                              ConnState.disconnected);
      } else {
          server = new Friend(
              msg.friendInfo.userInfo.userId,
              // msg.friendInfo.userInfo.address,
              msg.friendInfo.userInfo.email,
              msg.friendInfo.userInfo.region,
              msg.friendInfo.userInfo.name,
              msg.friendInfo.status);
      }

      this.pushServer(server);
      this.updateServerMap();

      eventBus.publish('feeds:updateServerList', this.getServerList(), Date.now());
    });
  }
  
  connectionChangedCallback(){
    this.events.subscribe('carrier:connectionChanged', status => {
      connectionStatus = status;
      eventBus.publish('feeds:connectionChanged', status, Date.now());
    });
  }

  handleResult(nodeId: string ,message: string){
    let from = nodeId;
    let response = this.jsonRPCService.parseJson(message);
    
    if (this.jsonRPCService.checkError(message)) {
      alert(response.error.code+";"+response.error.message);
      return;
    }
    
    //TODO
    if (response.method == "new_event"){
        this.handleNewEventResult(from, response.params);
        return;
    }

    switch (response.id) {
      case MethodType.subscribe:
        console.log("subscribe response");
        this.handleSubscriptResult(from, response.result);
        break;
      case MethodType.unsubscribe:
        console.log("unsubscribe response");
        this.handleUnsubscribeResult(from, response.result);
        break;
      case MethodType.exploreTopics:
        console.log("exploreTopics response");
        this.handleExploreTopicResult(from, response.result);
        break;
      case MethodType.listSubscribed:
        console.log("listSubscribed response");
        this.handleListSubscribedResult(from, response.result);
        break;
      case MethodType.fetchUnreceived:
        console.log("fetchUnreceived response");
        this.handleFetchUnreceivedResult(from, response.result);
        break;
      case MethodType.createTopic:
        console.log("createTopic response");
        this.handleCreateTopicResult(response.result);
        break;
      case MethodType.postEvent:
        console.log("postEvent response");
        this.handlePostEventResult(response.result);
        break;
      case MethodType.listOwnedTopics:
        console.log("listOwnedTopics response");
        this.handleListOwnTopicResult(from, response.result);
        break;
      default:
        console.log("response id is "+response.id);
        break;
    }
  }

  friendMessageCallback(){
    this.events.subscribe('carrier:friendMessage', event => {
      this.handleResult(event.from, event.message);
    });
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
    // alert("create topic success");
    console.log("handleCreateTopicResult=>");

    eventBus.publish("feeds:createTopicSuccess");
    this.listOwnedTopics(currentCreateTopicNID);
    // myFeedMap.
  }

  /*
  {
    "jsonrpc": "2.0",
    "result": NULL,
    "id": "id(JSON-RPC conformed type)"
  } 
  */
  handlePostEventResult(result: any){
    console.log("handlePostEventResult=>");
    if (myEventMap[postEventTmp.nodeId+postEventTmp.topic] == null || myEventMap[postEventTmp.nodeId+postEventTmp.topic] == undefined){
      myEventMap[postEventTmp.nodeId+postEventTmp.topic] = [];
    }
    
    myEventMap[postEventTmp.nodeId+postEventTmp.topic].push(postEventTmp);
    this.updateMyEventMap();

    myFeedsMap[postEventTmp.nodeId+postEventTmp.topic].lastUpdated = postEventTmp.timestamp;
    this.updateMyFeedsMap();
    
    eventBus.publish("feeds:postEventSuccess");
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
    console.log("handleListOwnTopicResult=>");
    let changed = false ;
    for (let index = 0; index < result.length; index++) {
      let topic = result[index].name;
      let desc = result[index].desc;
      let feedKey = nodeId+topic;
      if (myFeedsMap[feedKey] == undefined){
        myFeedsMap[feedKey] = new MyFeed('paper',nodeId,topic,desc,this.getCurrentTime(),false);
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
      eventBus.publish("feeds:ownFeedListChanged",this.getMyFeeds());
    }
  }

  /*
  {
    "jsonrpc": "2.0",
    "result": NULL,
    "id": "id(JSON-RPC conformed type)"
  }
  */
  handleSubscriptResult(nodeId: string, result: any){
    let feedKey = nodeId+subscribeTopic ;
    // favoriteFeedsMap[feedKey] = new FavoriteFeed(nodeId, subscribeTopic, "", 0, 0, this.getCurrentTime(),false);

    // if(fetchList == undefined){
    //   fetchList = [];
    // }
    // fetchList.push(favoriteFeedsMap[feedKey]);
    
    allFeedsMap[feedKey].subscribeState = "Subscribed";

    // this.updateFFMap();
    // this.updateAllFeeds();

    // this.fetchFeedEvents(nodeId, subscribeTopic, 0);
    needFetch = true;
    this.listSubscribed(nodeId);
    // eventBus.publish('feeds:favoriteFeedListChanged',this.getFavoriteFeeds());
    eventBus.publish('feeds:allFeedsListChanged',this.getAllFeeds());
    eventBus.publish('feeds:subscribeFinish',subscribeTopic);
  }

  /*
  {
    "jsonrpc": "2.0",
    "result": NULL,
    "id": "id(JSON-RPC conformed type)"
  } 
  */
  handleUnsubscribeResult(nodeId: string,result: any){
    console.log("handleUnsubscribeResult=>");
    let feedKey = nodeId+unSubscribeTopic;
    // TODO
    favoriteFeedsMap[feedKey] = undefined;
    eventsMap[feedKey] = undefined;
    
    eventBus.publish('feeds:favoriteFeedListChanged',this.getFavoriteFeeds());

    allFeedsMap[feedKey].subscribeState = "Subscribe";
    this.updateServerMap();
    eventBus.publish('feeds:allFeedsListChanged',this.getAllFeeds());
    
    // let server = this.findServer(nodeId);

    // if (server == null || server == undefined){
    //   return ;
    // }


    // this.doListSubscribedTopic(server);

    eventBus.publish('feeds:unsubscribeFinish', unSubscribeTopic);
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
    let changed = false ;
    console.log("handleExploreTopicResult=>");

    if (result == "") {
      console.log("result null");
      return ;
    }

    console.log(JSON.stringify(allFeedsMap));
    for (let index = 0; index < result.length; index++) {
      let topic = result[index].name;
      let desc = result[index].desc;
      let feedKey = nodeId+topic;

      if (allFeedsMap[feedKey] == undefined){
        allFeedsMap[feedKey] = new AllFeed(nodeId,"paper",topic,desc,this.checkSubscribeState(feedKey));
        changed = true;
      } else {
        let state = this.checkSubscribeState(feedKey);
        if (state != allFeedsMap[feedKey].subscribeState){
          allFeedsMap[feedKey].subscribeState = state;
          changed = true;
        }
      }
    }

    if (changed){
      this.updateAllFeeds();
      eventBus.publish('feeds:allFeedsListChanged',this.getAllFeeds());
    }
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
    console.log("handleListSubscribedResult=>");
    if (result == "") {
      console.log("result null");
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
      eventBus.publish('feeds:favoriteFeedListChanged',this.getFavoriteFeeds());
    }

    if (needFetch) {
      this.fetchNext();
      needFetch = false;
    }
    
  }

  fetchNext(){
    console.log("fetchList==>"+JSON.stringify(fetchList));
    if (fetchList.length>0){
      currentFetchFeeds = fetchList[0];
      // fetchTopic = fetchList[0].name;

      console.log("currentFetchFeeds ==>"+JSON.stringify(currentFetchFeeds));
      this.fetchFeedEvents(fetchList[0].nodeId,fetchList[0].name);
    }
  }

  // chooseFetchFF(){

  //   let keys: string[] = Object.keys(serversMap);
  //   for (const index in keys) {
  //     if (serversMap[keys[index]] == undefined) 
  //       continue;
  //     if (serversMap[keys[index]].status == undefined) 
  //       serversMap[keys[index]].status = ConnState.disconnected;
  //     list.push(serversMap[keys[index]]);
  //   }


  //   let keys: string[] = Object.keys(favoriteFeedsMap);
  //   for (const index in keys) {
  //     if (favoriteFeedsMap[keys[index]] == undefined)
  //       continue;
  //     if (favoriteFeedsMap[keys[index].status) {
        
  //     }
  //     list.push(favoriteFeedsMap[keys[index]]);
  //   }
  // }

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
    console.log("handleFetchUnreceivedResult=>");

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
      
      eventsMap[feedKey].push((new FeedEvents(from, currentFetchFeeds.name, String(ts*1000), event, seqno)));
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
      eventBus.publish('feeds:favoriteFeedListChanged',this.getFavoriteFeeds());
    }

    if (currentEventChanged)
      eventBus.publish('feeds:eventListChanged',this.getFeedEvents(currentFeedEventKey));

    this.fetchNext();
  }

  // updateEventList(feedEvent: FeedEvents, list: FeedEvents[]){
  //   for (let index = 0; index < list.length; index++) {
  //     if (list[index].nodeId == feedEvent.nodeId && 
  //         list[index].topic == feedEvent.topic &&
  //         list[index].seqno == feedEvent.seqno) {
  //           return ;
  //         }
  //   }
  //   list.push(feedEvent);
  //   this.storeService.set(PersistenceKey.eventList,list);
  // }

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
    console.log("handleNewEventResult=>");
    let topic = result.topic;
    let event = result.event;
    let seqno = result.seqno;
    let ts = result.ts;

    // // let event = new FeedEvents(nodeId, result.topic, result.ts, result.event, result.seqno);
    // eventList.push(event);
    // this.storeService.set(PersistenceKey.eventList,eventList);
    let currentEventChanged = false;

    let feedKey = nodeId+topic;

    let unread = favoriteFeedsMap[feedKey].unread;
    favoriteFeedsMap[feedKey].lastSeqno = seqno;
    favoriteFeedsMap[feedKey].unread  = unread+1;
    favoriteFeedsMap[feedKey].lastReceived = ts*1000;
    favoriteFeedsMap[feedKey].lastEvent = event;

    console.log("ts=>"+favoriteFeedsMap[feedKey].lastReceived);

    if (eventsMap[feedKey] == undefined){
      eventsMap[feedKey] = [];
    }

    eventsMap[feedKey].push(new FeedEvents(nodeId, topic, ts, event, seqno));

    if (currentFeedEventKey == feedKey){
      currentEventChanged = true;
    }

    // this.storeService.set(PersistenceKey.eventsMap,eventsMap);
    this.updateEventMap();

    this.updateFFMap();
    eventBus.publish('feeds:favoriteFeedListChanged',this.getFavoriteFeeds());

    if(currentEventChanged){
      eventBus.publish('feeds:eventListChanged',this.getFeedEvents(currentFeedEventKey));
    }
  }

  getCurrentTime(): string{
    return new Date().getTime().toString();
  }

  // doListSubscribedTopics(serverList: Friend[]){
  //   for (let index = 0; index < serverList.length; index++) {
  //     const server = serverList[index];
  //     if (server.status == ConnState.connected) {
  //       this.listSubscribed(server.userId);
  //     }
  //   }
  // }

  // updateFavoriteFeedList(feed:FavoriteFeed , feedList:FavoriteFeed[]){
  //   if (feedList == null){
  //     console.log("faverFeedList = null");
  //   }else{
  //     console.log("faverFeedList = "+JSON.stringify(feedList));
  //   }
  //   let isContain = false;
  //   for (let index = 0; index < feedList.length; index++) {
  //     const element = feedList[index];
  //     if (feedList[index].name == feed.name) {
  //       isContain = true;
  //       return;
  //     }
  //   }

  //   if (!isContain) {
  //     feedList.push(feed);
  //     this.storeService.set(PersistenceKey.faverFeedList,feedList);
  //   }
  // }

  // updateExploreFeedList(feed: FeedDescs , feedList: FeedDescs[]){
  //   let isContain = false;
  //   for (let index = 0; index < feedList.length; index++) {
  //     console.log("feed =>"+JSON.stringify(feed));
  //     console.log("faverFeedList =>"+JSON.stringify(faverFeedList));
  //     if (feedList[index].topic == feed.topic) {
  //       isContain = true;

  //       if(this.checkFollowState(feed.topic,faverFeedList)){
  //         feedList[index].followState = "following";
  //       }else{
  //         feedList[index].followState = "follow";
  //       }
  //       return;
  //     }
  //   }

  //   if (!isContain) {
  //     if(this.checkFollowState(feed.topic,faverFeedList)){
  //       feed.followState = "following";
  //     }else{
  //       feed.followState = "follow";
  //     }
  //     feedList.push(feed);
  //     this.storeService.set(PersistenceKey.exploreFeedList, feedList);
  //   }
  // }

  // checkFollowState(topic: string, faverFeedList:FavoriteFeed[]): boolean{
  //   let isFollowing = false;
  //   if (faverFeedList == null){
  //     return isFollowing;
  //   }

  //   for (let index = 0; index < faverFeedList.length; index++) {
  //     if (topic == faverFeedList[index].name){
  //       isFollowing = true;
  //       // feed.followState = "following";
  //     }
  //   }

  //   // if(!isFollowing){
  //   //   feed.followState = "follow";
  //   // }

  //   return isFollowing;
  // }
  parseFriends(data:any){
    let servers = data.friends;
    if (typeof servers == "string") {
      servers = JSON.parse(servers);
    }

    
    for (let id in servers) {
      console.log("servers[id].connection ==>"+servers[id].connection);
      let server = new Friend(servers[id].userInfo.userId,
                              servers[id].userInfo.email,
                              servers[id].userInfo.region,
                              servers[id].userInfo.name,
                              servers[id].connection);
      this.pushServer(server);
    }
    this.updateServerMap();
    eventBus.publish('feeds:updateServerList',this.getServerList());
  }

  // doListSubscribedTopics(){
  //   for (const key in Object.keys(serversMap))
  //     this.doListSubscribedTopic(serversMap[key]);
  // }

  doListSubscribedTopic(server: Friend){
    if (server == undefined)
      return ;
    if (server.status == ConnState.connected) 
      this.listSubscribed(server.userId);
  }

  doListOwnedTopics(){
    for (const server in this.checkOwnPublisherServer()) {
      if (server == undefined) continue;
      this.listOwnedTopics(server);
    }
  }

  doExploreTopics(){
    let keys: string[] = Object.keys(serversMap);
    for (const index in keys) {
      if (serversMap[keys[index]] == undefined) continue;
      this.exploreTopics(serversMap[keys[index]].userId);
    }
  }

  checkOwnPublisherServer(){
    // TODO if feed server modify
    let list: Friend[] = [];
    let keys: string[] = Object.keys(serversMap);
    for (const index in keys) {
      list.push(serversMap[keys[index]])
    }
    return list;
  }


  checkSubscribeState(feedKey: string): string{
    if (favoriteFeedsMap == undefined || favoriteFeedsMap[feedKey] == undefined){
      return "Subscribe";
    }

    return "Subscribed";
  }

  checkServerConnection(nodeId: string): boolean{
    if (serversMap[nodeId].status == ConnState.connected){
      return true;
    }
    return false;
  }

  findServer(nodeId: string): Friend{
    if (serversMap == undefined) {
      return undefined;
    }
    return serversMap[nodeId];
  }

  pushServer(server: Friend){
    serversMap[server.userId] = server ;
  }
  
  findFeedfromAF(feedKey: string): AllFeed{
    return allFeedsMap[feedKey];
  }

  pushAllFeeds(feedKey: string, feed: AllFeed){
    allFeedsMap[feedKey] = feed;
  }
  updateServerMap(){
    this.storeService.set(PersistenceKey.serversMap, serversMap);
  }

  updateFFMap(){
    this.storeService.set(PersistenceKey.favoriteFeedsMap,favoriteFeedsMap);
  }

  updateAllFeeds(){
    this.storeService.set(PersistenceKey.allFeedsMap, allFeedsMap);
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
}

//// Virtual data
let virtualServersMap: any = {
  "J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo":new Friend('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo',
                                                            // 'edTfdBfDVXMvQfXMhEvKrbvxaDxGGURyRfxDVMhbdHZFgAcwmGtS',
                                                            'jerry@email.com',
                                                            'beijing', 
                                                            '',
                                                            ConnState.connected),
  "3x4xVSJmtvty1tM8vzcz2pzW2WG7TmNavbnz9ka1EtZy":new Friend('3x4xVSJmtvty1tM8vzcz2pzW2WG7TmNavbnz9ka1EtZy', 
                                                            // 'TvvfqqvetoPcrb6rkD5W3gNBxcWYQpqhqddqATVbbaMNcCCp4Hib',
                                                            'tom@email.com',
                                                            'shanghai',
                                                            'Tom', 
                                                            ConnState.disconnected)
}
let virtrulFeedEvents = [
  new FeedEvents('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo',
    'Carrier News',
    '1584956175537',
    `1.Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
    The key difference between the applications available here and what you will find in any other app store is
    Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
    the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`,
    1),
  new FeedEvents('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo',
    'Carrier News',
    '1584956175537',
    `2.Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
    The key difference between the applications available here and what you will find in any other app store is
    Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
    the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`,
    1),
  new FeedEvents('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo',
    'Carrier News',
    '1584956175537',
    `3.Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
    The key difference between the applications available here and what you will find in any other app store is
    Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
    the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`,
    1),
  new FeedEvents('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo',
    'Carrier News',
    '1584956175537',
    `4.Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
    The key difference between the applications available here and what you will find in any other app store is
    Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
    the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`,
    1),
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

let virtrulMyFeeds = {
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoCarrier News':
    new MyFeed('paper', 'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'Carrier News', '', '1584956175537', false),
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoHive News':
    new MyFeed('paper', 'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'Hive News', '', '1584956175537',false),
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoTrinity News':
    new MyFeed('paper', 'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'Trinity News', '', '1584956175537',false),
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoDID News':
    new MyFeed('paper', 'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'DID News', '', '1584956175537',false),
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoDID SideChain News':
    new MyFeed('paper', 'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'DID SideChain News', '', '1584956175537',false),
  'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoFootball News':
    new MyFeed('paper', 'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', 'Football News', '', '1584956175537',false)
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

let virtualMyEventMap = {
  "J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoCarrier News":virtualMyEvents,
  "J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoHive News":virtualMyEvents,
  "J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoTrinity News":virtualMyEvents,
  "J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoDID News":virtualMyEvents,
  "J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoDID SideChain News":virtualMyEvents,
  "J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2MoFootball News":virtualMyEvents
}