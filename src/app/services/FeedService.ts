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
  serverList = "serverList",
  faverFeedList = "faverFeedList",
  feedDescList = "feedDescList",
  eventsMap = "eventsMap",
  exploreFeedList = "exploreFeedList"
}

// let serverUserIdList:any = [];
let connectionStatus;
let serverList: Friend[] = [];
// let serverMap:{ nodeId: string , server: Friend}
let faverFeedList: FavoriteFeed[];
// let faverMap:{ topic: string , faverFeed: FavoriteFeed }

let exploreFeedList: FeedDescs[];
let eventsMap:{topic: string, eventList: FeedEvents[]};
let firstInit: boolean;

let eventBus = null;


@Injectable()
export class FavoriteFeed {
  constructor(
      public name: string,
      public desc: string,
      public unread: number,
      public lastReceived: string = '') {}
}

export class MyFeed {
  constructor(
    public avatar: string,
    public name: string,
    public desc: string,
    public lastUpdated: string) {}
}

export class FeedDescs{
  constructor(
    public nodeId: string,
    public avatar: string,
    public title: string,
    public desc: string,
    public followState: string
    ){
  }
}

export class FeedEvents{
  constructor(
    public timestamp: string,
    public message: string){
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
    if (this.platform.is('desktop')) {
      serverList = virtrulServers;
      faverFeedList = virtrulFavorFeeds;
      exploreFeedList = virtrulFeedDescs;

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
    serverList = this.storeService.get(PersistenceKey.serverList);
    if (serverList = null) {
      serverList = [];
    }
    faverFeedList = this.storeService.get(PersistenceKey.faverFeedList);
    if (faverFeedList = null) {
      faverFeedList = [];
    }
    exploreFeedList = this.storeService.get(PersistenceKey.feedDescList);
    if (exploreFeedList == null) {
      exploreFeedList = [];
    }

    eventsMap = this.storeService.get(PersistenceKey.eventsMap);
    // if (eventsMap == null){
    //   eventsMap = {};
    // }
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
          serverList = this.parseFriends(ret);
          this.doListSubscribedTopics(serverList);
          this.storeService.set(PersistenceKey.serverList,serverList);
        },
        null);

    
  }

  getConnectionStatus() {
    return connectionStatus;
  }

  getServerList(): Friend[]{
    return serverList;
  }

  getFavorFeeds() {
    return faverFeedList;
  }

  public getAllFeeds() {
    return exploreFeedList;
  }

  public getFeedDescr(_name: string) {
    if (this.platform.is("desktop")) {
      return virtrulFeedIntro;
    }
    //TODO
    return virtrulFeedIntro;
  }

  public getFeedEvents(topic: string) {

    // eventMap.topic
    if (this.platform.is("desktop")) {
      return virtrulFeedEvents;
    }

    return eventsMap.topic;
    //TODO
    // return virtrulFeedEvents;
  }

  public getMyFeeds() {
    if (this.platform.is("desktop")) {
      return virtrulMyFeeds;
    }
    //TODO
    return virtrulMyFeeds;
  }

  updateServerList(userId: string, connectStatus: ConnState): Friend{
    if(serverList == null){
      return ;
    }

    for (let i = 0; i < serverList.length; i++) {
      const server = serverList[i];
      if(server.userId == userId){
        server.status = connectStatus;
        return server;
      }
    }
  }

  sendMessage(nodeId: string, method: string, params: any, id: string){
    let message = this.jsonRPCService.assembleJson(method, params, id);
    this.transportService.transportMsg(
      nodeId, 
      JSON.stringify(message), 
      ()=>{
        alert("success")
      }, 
      (error)=>alert("error="+error));
  }
  
  //{"jsonrpc":"2.0","method":"create_topic","params":{"topic":"news","desc":"daily"},"id":null}
  createTopic(nodeId: string, topic: string, desc: string){
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

    this.sendMessage(nodeId, "subscribe", params, MethodType.subscribe);
  }

  doSubscribe(){
    
    // this.subscribe();
  }

  //{"jsonrpc":"2.0","method":"unsubscribe","params":{"topic":"movie"},"id":null}
  unSubscribe(nodeId: string, topic: string){
      let params = {};
      params["topic"] = topic;

      this.sendMessage(nodeId, "unsubscribe", params, MethodType.unsubscribe);
  }

  //{"jsonrpc":"2.0","method":"explore_topics","id":null}
  exploreTopics(nodeId: string){
      this.sendMessage(nodeId, "explore_topics", null, MethodType.exploreTopics);
  }

  doExploreTopics(){
    if (serverList == null){
      return ;
    }

    for (let index = 0; index < serverList.length; index++) {
      this.exploreTopics(serverList[index].userId);
    }
  }

  //{"jsonrpc":"2.0","method":"list_subscribed_topics","id":null}
  listSubscribed(nodeId: string){
    this.sendMessage(nodeId, "list_subscribed_topics", null, MethodType.listSubscribed);
  }

  //{"jsonrpc":"2.0","method":"fetch_unreceived","params":{"topic":"movie","since":1021438976},"id":null}
  fetchUnreceived(nodeId: string, topic: string, since: Date){
      let params = {};
      params["topic"] = topic;
      params["since"] = Math.round(since.valueOf()/1000);
      this.sendMessage(nodeId, "fetch_unreceived", null, MethodType.fetchUnreceived);
  }

  parseFriends(data:any): Friend[]{
    let serverFriendList: Friend[] = [];
    let servers = data.friends;
        if (typeof servers == "string") {
          servers = JSON.parse(servers);
        }
        for (let id in servers) {
            let friend = new Friend(servers[id].userInfo.userId,
                                    servers[id].userInfo.name,
                                    servers[id].connection);
            serverFriendList.push(friend);
        }
    return serverFriendList;
  }

  doListSubscribedTopics(serverList: Friend[]){
    for (let index = 0; index < serverList.length; index++) {
      const server = serverList[index];
      if (server.status == ConnState.connected) {
        this.listSubscribed(server.userId);
      }
    }
  }

  doListSubscribedTopic(server: Friend){
    if (server.status == null || server.status == undefined){
      return ;
    }

    if (server.status == ConnState.connected) {
      this.listSubscribed(server.userId);
    }
  }

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
      let server = this.updateServerList(ret.friendId,ret.status);
      this.doListSubscribedTopic(server);
    });
  }

  friendAddCallback(){
    this.events.subscribe('carrier:friendAdded', msg => {
      let server: any;
      if (this.platform.is("desktop")) {
          server = new Friend('100', 'New Contact', ConnState.disconnected);
      } else {
          server = new Friend(
              msg.friendInfo.userInfo.userId,
              msg.friendInfo.userInfo.name,
              msg.friendInfo.status);
      }

      serverList.push(server);
      this.storeService.set(PersistenceKey.serverList,serverList);
      eventBus.publish('feeds:updateServerList', serverList, Date.now());
    });
  }
  
  connectionChangedCallback(){
    this.events.subscribe('carrier:connectionChanged', status => {
      connectionStatus = status;
      eventBus.publish('feeds:connectionChanged', status, Date.now());
    });
  }

  friendMessageCallback(){
    this.events.subscribe('carrier:friendMessage', event => {
      let from = event.from;
      let response = this.jsonRPCService.parseJson(event.message);
      console.log("friendMessageCallback");
      console.log("from=>"+from);
      console.log("ret=>"+response);
      
      //TODO
      if (response.method == "new_event"){
          this.handleNewEventResult(response.params);
          return;
      }

      switch (response.id) {
        case MethodType.subscribe:
          console.log("subscribe response");
          this.handleSubscriptResult(response.result);
          break;
        case MethodType.unsubscribe:
          console.log("unsubscribe response");
          this.handleUnsubscribeResult(response.result);
          break;
        case MethodType.exploreTopics:
          console.log("exploreTopics response");
          this.handleExploreTopicResult(from, response.result);
          break;
        case MethodType.listSubscribed:
          console.log("listSubscribed response");
          this.handleListSubscribedResult(response.result);
          break;
        case MethodType.fetchUnreceived:
          console.log("fetchUnreceived response");
          this.handleFetchUnreceivedResult(response.result);
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
          this.handleListOwnTopicResult(response.result);
          break;
        default:
          console.log("response id is "+response.id);
          break;
      }
    });
  }

  /*
  {
    "jsonrpc": "2.0",
    "result": NULL,
    "id": "id(JSON-RPC conformed type)"
  }
  */
  handleCreateTopicResult(result: any){
    console.log("handleCreateTopicResult=>");
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
  handleListOwnTopicResult(result: any){
    console.log("handleListOwnTopicResult=>");
  }

  /*
  {
    "jsonrpc": "2.0",
    "result": NULL,
    "id": "id(JSON-RPC conformed type)"
  }
  */
  handleSubscriptResult(result: any){
    console.log("handleSubscriptResult=>");
    //local process or send listSubscribed request to server
    this.doListSubscribedTopics(serverList);
  }

  /*
  {
    "jsonrpc": "2.0",
    "result": NULL,
    "id": "id(JSON-RPC conformed type)"
  } 
  */
  handleUnsubscribeResult(result: any){
    console.log("handleUnsubscribeResult=>");
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
    console.log("handleExploreTopicResult=>");

    if (result == "") {
      console.log("result null");
      return ;
    }

    for (let index = 0; index < result.length; index++) {

      
      const element = result[index];

      let topic = result[index].name;
      let desc = result[index].desc;
      let feed = new FeedDescs(nodeId,"paper",topic,desc,"follow");

      this.updateExploreFeedList(feed, exploreFeedList);
    }
  }

  updateExploreFeedList(feed: FeedDescs , feedList: FeedDescs[]){
    let isContain = false;
    for (let index = 0; index < feedList.length; index++) {
      if (feedList[index].title == feed.title) {
        isContain = true;
        return;
      }
    }

    if (!isContain) {
      if(this.checkFollowState(feed.title,faverFeedList)){
        feed.followState = "following";
      }else{
        feed.followState = "follow";
      }
      feedList.push(feed);
      this.storeService.set(PersistenceKey.exploreFeedList, feedList);
    }
  }

  // checkFollowState(exploreList:FeedDescs[] , faverFeedList:FavoriteFeed[]){
  //   for (let i = 0; i < exploreList.length; i++) {
  //     for (let j = 0; j < faverFeedList.length; j++) {
  //       const favor = faverFeedList[j];
  //       if (exploreList[i].title = favor.name){
  //         exploreList[i].followState = "following";
  //       }
  //     }
  //   }
  // }

  checkFollowState(topic: string, faverFeedList:FavoriteFeed[]): boolean{
    let isFollowing = false;
    if (faverFeedList == null){
      return isFollowing;
    }

    for (let index = 0; index < faverFeedList.length; index++) {
      if (topic = faverFeedList[index].name){
        isFollowing = true;
        // feed.followState = "following";
      }
    }

    // if(!isFollowing){
    //   feed.followState = "follow";
    // }

    return isFollowing;
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
  handleListSubscribedResult(result: any){
    console.log("handleListSubscribedResult=>");
    if (result == "") {
      console.log("result null");
      return ;
    }

    let topic = result.name;
    let desc = result.desc;
    console.log("handleListSubscribedResult=>"+topic +";"+desc);

    // TODO
    // checkList
    // let faverFeed = new FavoriteFeed(topic, desc, 0, new Date().getTime().toString());
    // faverFeedList.push(faverFeed);
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
  handleFetchUnreceivedResult(result: any){

    console.log("handleFetchUnreceivedResult=>");
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
  handleNewEventResult(result: any){
    console.log("handleNewEventResult=>");
    // let topic = result.topic;
    // let event = result.event;
    // let seqno = result.seqno;
    // let ts = result.ts;

    let event = new FeedEvents(result.ts,result.event);
    eventsMap.eventList[eventsMap.topic].push(event);
    
    this.storeService.set(PersistenceKey.eventsMap,eventsMap);
  }

  // doListSubscribedTopics(serverList: Friend[]){
  //   for (let index = 0; index < serverList.length; index++) {
  //     const server = serverList[index];
  //     if (server.status == ConnState.connected) {
  //       this.listSubscribed(server.userId);
  //     }
  //   }
  // }
}

//// Virtual data
let virtrulServers:Friend[] = [
  new Friend('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', '',   ConnState.connected),
  new Friend('3x4xVSJmtvty1tM8vzcz2pzW2WG7TmNavbnz9ka1EtZy', 'Tom', ConnState.disconnected),
  new Friend('3x4xVSJmtvty1tM8vzcz2pzW2WG7TmNavbnz9ka1EtZy', 'Jerry', ConnState.connected)
];


let virtrulFavorFeeds:FavoriteFeed[] = [
  new FavoriteFeed('Carrier News', '', 24),
  new FavoriteFeed('Hive News',  '', 35),
  new FavoriteFeed('Football',  '', 4),
  new FavoriteFeed('Trinity News',  '', 0, '12:00 Dec.12'),
  new FavoriteFeed('Hollywood Movies', '',  24),
  new FavoriteFeed('Cofee',  '', 35),
  new FavoriteFeed('MacBook',  '', 4),
  new FavoriteFeed('Rust development', '',  0, '12:00 Desc.12'),
  new FavoriteFeed('Golang',  '', 8)
];

let virtrulMyFeeds:MyFeed[] = [
  new MyFeed('paper', 'Carrier News', '', '12:10 Dec. 12, 2019'),
  new MyFeed('paper', 'Hive News', '', '12:10 Dec.12, 2019'),
  new MyFeed('paper', 'Trinity News', '', '12:10 Dec.12, 2019'),
  new MyFeed('paper', 'DID News', '', '12:10 Dec.12, 2019'),
  new MyFeed('paper', 'DID SideChain News', '', '12:10 Dec.12, 2019'),
  new MyFeed('paper', 'Football News', '', '12:10 Dec.12, 2019'),
];

let virtrulFeedDescs:FeedDescs[] = [
  new FeedDescs("virtualnodeid","page","Carrier News","","following"),
  new FeedDescs("virtualnodeid","page","Hive News","","following"),
  new FeedDescs("virtualnodeid","page","Trinity News","","following"),
  new FeedDescs("virtualnodeid","page","DID News","","follow"),
  new FeedDescs("virtualnodeid","page","DMA News","","following"),
  new FeedDescs("virtualnodeid","page","Football News","","follow"),
];
let virtrulFeedEvents = [
  new FeedEvents('12:00, December 10, 2019',
    `Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
    The key difference between the applications available here and what you will find in any other app store is
    Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
    the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`),
  new FeedEvents('15:00, December 10, 2019',
    `Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
    The key difference between the applications available here and what you will find in any other app store is
    Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
    the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`),
  new FeedEvents('15:00, December 12, 2019',
    `Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
    The key difference between the applications available here and what you will find in any other app store is
    Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
    the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`),
  new FeedEvents('15:00, December 14, 2019',
    `Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
    The key difference between the applications available here and what you will find in any other app store is
    Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
    the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`),
];

let virtrulFeedIntro = new FeedIntro(
  `bb Keep close to Nature's heart... and break clear away, once in awhile,
  and climb a mountain or spend a week in the woods. Wash your spirit clean.`);