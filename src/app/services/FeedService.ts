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
  eventList = "eventList",
  exploreFeedList = "exploreFeedList"
}

// let serverUserIdList:any = [];
let connectionStatus;
let serverList: Friend[] = [];
// let serverMap:{ nodeId: string , server: Friend}
let faverFeedList: FavoriteFeed[] = [];
let faverMap:{} = {};

let exploreFeedList: FeedDescs[] = [];

let eventList:FeedEvents[] = [];

// let eventsMap:{topic: string, eventList: FeedEvents[]};
let firstInit: boolean;

let eventBus = null;
let fetchTopic:string ;

@Injectable()
export class FavoriteFeed {
  constructor(
    public nodeId: string,
    public name: string,
    public desc: string,
    public unread: number,
    public lastSeqno: number,
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
    public topic: string,
    public desc: string,
    public followState: string
    ){
  }
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
    if (serverList == null) {
      serverList = [];
    }
    faverFeedList = this.storeService.get(PersistenceKey.faverFeedList);
    if (faverFeedList == null) {
      faverFeedList = [];
    }
    exploreFeedList = this.storeService.get(PersistenceKey.feedDescList);
    if (exploreFeedList == null) {
      exploreFeedList = [];
    }

    eventList = this.storeService.get(PersistenceKey.eventList);
    if (eventList == null){
      eventList = [];
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

  public getFeedEvents(nodeId: string, topic: string , since: number) {
    this.fetchUnreceived(nodeId, topic, since);
    // eventMap.topic
    if (this.platform.is("desktop")) {
      return virtrulFeedEvents;
    }

    return this.searchEventList(nodeId, topic);
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
    if(!this.checkServerConnection(nodeId)){
      alert("friend offline");
      return;
    }

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
  fetchUnreceived(nodeId: string, topic: string, since: number){
      console.log( JSON.stringify(faverFeedList) );

      fetchTopic = topic;
      let params = {};
      params["topic"] = topic;
      params["since"] = since;
      this.sendMessage(nodeId, "fetch_unreceived", params, MethodType.fetchUnreceived);
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

  findServer(nodeId: string):Friend{
    if(serverList == null || serverList == undefined){
      return null;
    }

    for (let index = 0; index < serverList.length; index++) {
      if (serverList[index].userId == nodeId){
        return serverList[index];
      }
    }

    return null;
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
      console.log("response=>"+event.message);
      console.log("from=>"+from);
      console.log("ret=>"+response);
      
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
  handleSubscriptResult(nodeId: string, result: any){
    console.log("handleSubscriptResult=>");
    //local process or send listSubscribed request to server
    // TODO
    let server = this.findServer(nodeId);

    if (server == null || server == undefined){
      return ;
    }

    this.doListSubscribedTopic(server);
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

    // TODO
    // faverFeedList.splice()
    let server = this.findServer(nodeId);

    if (server == null || server == undefined){
      return ;
    }

    this.doListSubscribedTopic(server);
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


      console.log("before=>"+JSON.stringify(feed));
      this.updateExploreFeedList(feed, exploreFeedList);

      console.log(JSON.stringify(exploreFeedList));
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
    console.log("handleListSubscribedResult=>");
    if (result == "") {
      console.log("result null");
      return ;
    }

    for (let index = 0; index < result.length; index++) {
      let topic = result[index].name;
      let desc = result[index].desc;
      console.log("handleListSubscribedResult=>"+topic +";"+desc);

      

      let faverFeed = new FavoriteFeed(nodeId, topic, desc, 0, 0, new Date().getTime().toString());
      faverMap[topic]=faverFeed;
      console.log( Object.keys(faverMap) );
      
      // faverFeedList.push(faverFeed);
      this.updateFavoriteFeedList(faverFeed, faverFeedList);
    }
    
    for(let key  in faverMap){
      console.log(key + '---' + faverMap[key])
    }

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
  handleFetchUnreceivedResult(from: string, result: any){

    
    if (result == null || result == undefined){
      return ;
    }

    // let faverFeed = 
    for (let index = 0; index < result.length; index++) {
      result[index].seqno;
      result[index].event;
      result[index].ts;

// new FeedEvents(from, fetchTopic, result[index].ts, result[index].event, result[index].seqno);
      this.updateEventList(new FeedEvents(from, fetchTopic, result[index].ts, result[index].event, result[index].seqno),eventList)
    }

    // this.updateFavoriteFeedList();
      // params["since"] = Math.round(since.valueOf()/1000);
      // params["since"] = Math.round(since.valueOf()/1000);
    console.log("handleFetchUnreceivedResult=>");
  }

  updateEventList(feedEvent: FeedEvents, list: FeedEvents[]){
    for (let index = 0; index < list.length; index++) {
      if (list[index].nodeId == feedEvent.nodeId && 
          list[index].topic == feedEvent.topic &&
          list[index].seqno == feedEvent.seqno) {
            return ;
          }
    }
    list.push(feedEvent);
    this.storeService.set(PersistenceKey.eventList,list);
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
    console.log("handleNewEventResult=>");
    // let topic = result.topic;
    // let event = result.event;
    // let seqno = result.seqno;
    // let ts = result.ts;

    let event = new FeedEvents(nodeId, result.topic, result.ts, result.event, result.seqno);
    eventList.push(event);
    this.storeService.set(PersistenceKey.eventList,eventList);
  }

  // doListSubscribedTopics(serverList: Friend[]){
  //   for (let index = 0; index < serverList.length; index++) {
  //     const server = serverList[index];
  //     if (server.status == ConnState.connected) {
  //       this.listSubscribed(server.userId);
  //     }
  //   }
  // }

  updateFavoriteFeedList(feed:FavoriteFeed , feedList:FavoriteFeed[]){
    if (feedList == null){
      console.log("faverFeedList = null");
    }else{
      console.log("faverFeedList = "+JSON.stringify(feedList));
    }
    let isContain = false;
    for (let index = 0; index < feedList.length; index++) {
      const element = feedList[index];
      if (feedList[index].name == feed.name) {
        isContain = true;
        return;
      }
    }

    if (!isContain) {
      feedList.push(feed);
      this.storeService.set(PersistenceKey.faverFeedList,feedList);
    }
  }

  updateExploreFeedList(feed: FeedDescs , feedList: FeedDescs[]){
    let isContain = false;
    for (let index = 0; index < feedList.length; index++) {
      console.log("feed =>"+JSON.stringify(feed));
      console.log("faverFeedList =>"+JSON.stringify(faverFeedList));
      if (feedList[index].topic == feed.topic) {
        isContain = true;

        if(this.checkFollowState(feed.topic,faverFeedList)){
          feedList[index].followState = "following";
        }else{
          feedList[index].followState = "follow";
        }
        return;
      }
    }

    if (!isContain) {
      if(this.checkFollowState(feed.topic,faverFeedList)){
        feed.followState = "following";
      }else{
        feed.followState = "follow";
      }
      feedList.push(feed);
      this.storeService.set(PersistenceKey.exploreFeedList, feedList);
    }
  }

  checkFollowState(topic: string, faverFeedList:FavoriteFeed[]): boolean{
    let isFollowing = false;
    if (faverFeedList == null){
      return isFollowing;
    }

    for (let index = 0; index < faverFeedList.length; index++) {
      if (topic == faverFeedList[index].name){
        isFollowing = true;
        // feed.followState = "following";
      }
    }

    // if(!isFollowing){
    //   feed.followState = "follow";
    // }

    return isFollowing;
  }

  checkServerConnection(nodeId: string): boolean{
    for (let index = 0; index < serverList.length; index++) {
      if (serverList[index].userId == nodeId && serverList[index].status == ConnState.connected){
        return true;
      }
    }
    return false;
  }

  searchEventList(nodeId: string, topic: string){
    let events = [];

    for (let index = 0; index < eventList.length; index++) {
      if(eventList[index].nodeId == nodeId && eventList[index].topic == topic){
        events.push(eventList[index]);
      }
    }

    return events;
  }

}

//// Virtual data
let virtrulServers:Friend[] = [
  new Friend('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', '',   ConnState.connected),
  new Friend('3x4xVSJmtvty1tM8vzcz2pzW2WG7TmNavbnz9ka1EtZy', 'Tom', ConnState.disconnected),
  new Friend('3x4xVSJmtvty1tM8vzcz2pzW2WG7TmNavbnz9ka1EtZy', 'Jerry', ConnState.connected)
];


let virtrulFavorFeeds:FavoriteFeed[] = [
  new FavoriteFeed('virtualnodeid', 'Carrier News', '', 24, 0),
  new FavoriteFeed('virtualnodeid', 'Hive News',  '', 35, 0),
  new FavoriteFeed('virtualnodeid', 'Football',  '', 4, 0),
  new FavoriteFeed('virtualnodeid', 'Trinity News',  '', 0, 0, '12:00 Dec.12'),
  new FavoriteFeed('virtualnodeid', 'Hollywood Movies', '',  24, 0),
  new FavoriteFeed('virtualnodeid', 'Cofee',  '', 35, 0),
  new FavoriteFeed('virtualnodeid', 'MacBook',  '', 4, 0),
  new FavoriteFeed('virtualnodeid', 'Rust development', '',  0, 0, '12:00 Desc.12'),
  new FavoriteFeed('virtualnodeid', 'Golang',  '', 8, 0)
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
  new FeedEvents('virtualnodeid',
    'Carrier News',
    '12:00, December 10, 2019',
    `Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
    The key difference between the applications available here and what you will find in any other app store is
    Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
    the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`,
    1),
  new FeedEvents('virtualnodeid',
    'Carrier News',
    '15:00, December 10, 2019',
    `Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
    The key difference between the applications available here and what you will find in any other app store is
    Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
    the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`,
    1),
  new FeedEvents('virtualnodeid',
    'Carrier News',
    '15:00, December 12, 2019',
    `Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
    The key difference between the applications available here and what you will find in any other app store is
    Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
    the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`,
    1),
  new FeedEvents('virtualnodeid',
    'Carrier News',
    '15:00, December 14, 2019',
    `Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
    The key difference between the applications available here and what you will find in any other app store is
    Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
    the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`,
    1),
];

let virtrulFeedIntro = new FeedIntro(
  `bb Keep close to Nature's heart... and break clear away, once in awhile,
  and climb a mountain or spend a week in the woods. Wash your spirit clean.`);