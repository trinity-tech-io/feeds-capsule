import { Component, OnInit,ViewChild,NgZone} from '@angular/core';
import { FeedService } from '../../../services/FeedService';
import { Events,PopoverController,IonRefresher,IonInfiniteScroll, IonSearchbar} from '@ionic/angular';
import { NativeService } from '../../../services/NativeService';
import { ThemeService } from '../../../services/theme.service';
import { UtilService } from '../../../services/utilService';
import { PopupProvider } from '../../../services/popup';
import { CameraService } from '../../../services/CameraService';
import { HttpService } from '../../../services/HttpService';
import { ApiUrl } from '../../../services/ApiUrl';
import * as _ from 'lodash';
declare let appManager: AppManagerPlugin.AppManager;
@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})


export class SearchPage implements OnInit {

  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;
  @ViewChild(IonRefresher,{static:true}) ionRefresher:IonRefresher;
  @ViewChild('searchbar', {static: false}) searchbar:IonSearchbar;

  public connectionStatus = 1;
  public nodeStatus: any = {};
  public popover:any = "";
  public curAddingItem = {};
  public addingChanneList = [];
  public searchAddingChanneList = [];
  public hideUnFollowFeeds:boolean = false;
  public isSearch:string ="";
  public searchfeedsList = [];
  public discoverSquareList = [];
  public pageNum:number = 1;
  public pageSize:number = 5;
  public totalNum:number = 0;
  public isLoading:boolean =true;
  public developerMode:boolean =  false;
  public searchSquareList = [];
  public followedList = [];
  public httpAllData = [];
  public unfollowedFeed = [];
  public searchUnfollowedFeed = [];
  public scanServiceStyle ={"right":""};
  // {
  //   "nodeId": "8Dsp9jkTg8TEfCkwMoXimwjLeaRidMczLZYNWbKGj1SF",
  //   "did": "did:elastos:ibfZa4jQ1QgDRP9rpfbUbZWpXgbd9z7oKF",
  //   "carrierAddress": "GsfYTr2bTBSppVxMYwj2e8gPpx4CRAZVd2NjehUmRAWYeuiLWmaH",
  //   "feedId": 4,
  //   "feedName": "feeds_testing 4",
  //   "feedUrl": "feeds://did:elastos:ibfZa4jQ1QgDRP9rpfbUbZWpXgbd9z7oKF/GsfYTr2bTBSppVxMYwj2e8gPpx4CRAZVd2NjehUmRAWYeuiLWmaH/4",
  //   "serverUrl": "feeds://did:elastos:ibfZa4jQ1QgDRP9rpfbUbZWpXgbd9z7oKF/GsfYTr2bTBSppVxMYwj2e8gPpx4CRAZVd2NjehUmRAWYeuiLWmaH",
  //   "status": 7,
  //   "friendState": 2,
  //   "avatar":"./assets/images/profile-1.svg",
  //   "follower": 5
  // }
  constructor(
    private feedService: FeedService,
    private events: Events,
    private zone: NgZone,
    private native: NativeService,
    public theme:ThemeService,
    private popoverController: PopoverController,
    private popupProvider:PopupProvider,
    private camera: CameraService,
    private httpService:HttpService

  ) {
  }

  ngOnInit() {
    this.scanServiceStyle["right"] = screen.width*7.5/100+5+"px";
    this.pageNum =1;
    this.initData("",true);
  }

  initSubscribe(){
    this.events.subscribe(FeedsEvent.PublishType.connectionChanged,(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.friendConnectionChanged, (nodeId, status)=>{
      this.zone.run(()=>{
        this.nodeStatus[nodeId] = status;
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.subscribeFinish, (nodeId, channelId)=> {
      // this.native.toast(name + " subscribed");
      this.zone.run(() => {
        this.unfollowedFeed = this.getUnfollowedFeed() || [];
        this.searchUnfollowedFeed = _.cloneDeep(this.unfollowedFeed);
        let status = this.checkServerStatus(nodeId);
        this.nodeStatus[nodeId] = status;
        this.addingChanneList = this.feedService.getToBeAddedFeedsList() || [];
        this.searchAddingChanneList = _.cloneDeep(this.addingChanneList);
        this.handleSearch();
      });
    });

    // this.events.subscribe(FeedsEvent.PublishType.refreshChannels, list =>{
    //   this.zone.run(() => {
    //     this.handleSearch();
    //   });
    // });

    // this.events.subscribe(FeedsEvent.PublishType.channelsDataUpdate, () =>{
    //   this.zone.run(() => {
    //     this.handleSearch();
    //   });
    // });

    this.events.subscribe(FeedsEvent.PublishType.hideUnFollowFeeds ,()=>{
         this.hideUnFollowFeeds = this.feedService.getHideUnFollowFeeds();
    });

    // this.events.subscribe(FeedsEvent.PublishType.refreshSubscribedChannels,()=>{
    //   this.zone.run(() => {
    //     this.handleSearch();
    //   });
    // });

    this.events.subscribe(FeedsEvent.PublishType.addFeedStatusChanged,()=>{
      this.zone.run(() => {
        this.addingChanneList = this.feedService.getToBeAddedFeedsList() || [];
        this.searchAddingChanneList = _.cloneDeep(this.addingChanneList);
        this.handleSearch();
      });
    });
  }

  removeSubscribe(){
    let value =  this.popoverController.getTop()["__zone_symbol__value"] || "";
    if(value!=""){
      this.popoverController.dismiss();
      this.popover = "";
    }
    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.friendConnectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.subscribeFinish);
    //this.events.unsubscribe(FeedsEvent.PublishType.refreshChannels);
    //this.events.unsubscribe(FeedsEvent.PublishType.channelsDataUpdate);
    //this.events.unsubscribe(FeedsEvent.PublishType.refreshSubscribedChannels);
    this.events.unsubscribe(FeedsEvent.PublishType.addFeedStatusChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.hideUnFollowFeeds);
  }

  ionViewWillEnter() {
    this.events.subscribe(FeedsEvent.PublishType.search, ()=>{
         this.init();
    });
    this.init();
  }

  init(){
    this.developerMode = this.feedService.getDeveloperMode();
    this.hideUnFollowFeeds = this.feedService.getHideUnFollowFeeds();
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.unfollowedFeed = this.getUnfollowedFeed();
    this.discoverSquareList = this.filterdiscoverSquareList(this.discoverSquareList);
    this.initSubscribe();
    this.handleSearch();
  }

  ionViewWillLeave(){
    this.events.unsubscribe(FeedsEvent.PublishType.search);
    this.removeSubscribe();
    this.curAddingItem="";
  }

  subscribe(nodeId: string, id: number){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    if(this.checkServerStatus(nodeId) != 0){
      this.native.toastWarn('common.connectionError1');
      return;
    }

    this.feedService.subscribeChannel(nodeId, id);
  }

  getItems(events:any){
    this.isSearch = events.target.value || "";
    if(this.checkFeedUrl(this.isSearch)){
      this.addFeedUrl(this.isSearch);
      return;
    }
    if(events.target.value == ""){
      this.ionRefresher.disabled = false;
      this.infiniteScroll.disabled = false;
      this.addingChanneList = this.feedService.getToBeAddedFeedsList() || [];
      this.unfollowedFeed = this.getUnfollowedFeed() || [];
      this.discoverSquareList = _.cloneDeep(this.searchSquareList);
      this.searchAddingChanneList = _.cloneDeep(this.addingChanneList);
      return;
    }
    this.ionRefresher.disabled = true;
    this.infiniteScroll.disabled = true;
    this.handleSearch();
  }

  handleSearch(){
    if(this.isSearch===""){
        return;
    }
    this.addingChanneList = this.searchAddingChanneList.filter(
      channel=>channel.feedName.toLowerCase().indexOf(this.isSearch.toLowerCase()) > -1
    );

    this.searchUnfollowedFeed = this.searchUnfollowedFeed.filter(
      feed=>feed.name.toLowerCase().indexOf(this.isSearch.toLowerCase()) > -1
    );

    this.discoverSquareList = this.searchSquareList.filter(
      feed=>feed.name.toLowerCase().indexOf(this.isSearch.toLowerCase()) > -1
    );


  }

  doRefresh(event) {
    let sid = setTimeout(() => {
      this.feedService.updateSubscribedFeed();
      this.pageNum = 1;
      this.initData(event,false);
      event.target.complete();
      clearTimeout(sid);
    }, 2000);
  }

  navTo(nodeId:string, channelId:number){
    this.native.navigateForward(['/channels', nodeId, channelId],"");
  }

  parseChannelAvatar(avatar: string): string{
    return this.feedService.parseChannelAvatar(avatar);
  }

  addfeedssource(){
    if(this.feedService.getConnectionStatus() !== 0){
      this.native.toastWarn('common.connectionError');
      return;
    }
    this.removeSubscribe();
    this.native.navigateForward(['/menu/servers/add-server'],"");
  }

  checkServerStatus(nodeId: string){
    return this.feedService.getServerStatusFromId(nodeId);
  }

 moreName(name:string){
  return UtilService.moreNanme(name)
 }

 pressName(channelName:string){
  let name =channelName || "";
  if(name != "" && name.length>15){
    this.native.createTip(name);
  }
 }

  discover(){
    if(this.feedService.getConnectionStatus() !== 0){
      this.native.toastWarn('common.connectionError');
      return;
    }
    this.removeSubscribe();
    this.native.go("discoverfeed");
  }

  handleStatus(item:any){
    let status = item["status"] || 0;
    let keyString ="SearchPage.status";
    return keyString+status;
  }

  handeleStatus(addingchannel:any){
    this.curAddingItem = addingchannel;
    this.popover = this.popupProvider.ionicConfirm(
      this,
      // "ConfirmdialogComponent.signoutTitle",
      "",
      "SearchPage.des1",
      this.cancel,
      this.confirm1,
      'tskth.svg',
    );
  }

  confirm1(that:any){
    if(this.popover!=null){
      this.popover.dismiss();
      let nodeId = that.curAddingItem["nodeId"];
      let feedId = that.curAddingItem["feedId"];
      //that.feedService.promptpublishdid();

      that.feedService.removeTobeAddedFeeds(nodeId,feedId).then(()=>{
        that.zone.run(() => {
          that.addingChanneList = that.feedService.getToBeAddedFeedsList() || [];
          that.searchAddingChanneList = _.cloneDeep(that.addingChanneList);
          let feedlist =_.filter(that.httpAllData,(feed)=>{
            let  feedNodeId = feed["nodeId"]
            let feedUrl = feed["url"];
            let feedId = feedUrl.split("/")[4];
                return feedNodeId==nodeId&&feedId==feedId;
          });
          if(feedlist.length>0){
            let feed = feedlist[0];
            that.discoverSquareList.push(feed);
          }
          that.searchSquareList = _.cloneDeep(that.discoverSquareList);
        });
      });
    }
  }

  cancel(that:any){
    if(this.popover!=null){
      this.popover.dismiss();
      let nodeId = that.curAddingItem["nodeId"];
      let feedId = that.curAddingItem["feedId"];
      that.feedService.continueAddFeeds(nodeId, feedId);
      //that.feedService.promptpublishdid();
    }
  }

  scanService(){

    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.handleJump("scanService")
  }

  scanImage(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }
    if(this.isSearch!=''){
          return;
    }
    this.handleJump("scanImage");

  }

  handleJump(clickType:string){
    if(clickType === "scanService"){
      appManager.sendIntent("https://scanner.elastos.net/scanqrcode", {}, {}, (res) => {
        let result: string = res.result.scannedContent;
        this.checkValid(result);
      }, (err: any) => {
          console.error(err);
      });
         return;
    }
  }

checkValid(result: string){
    if (result.length < 54 ||
        !result.startsWith('feeds://')||
        !result.indexOf("did:elastos:")){
          this.native.toastWarn("AddServerPage.tipMsg");
          return ;
      }

    let splitStr = result.split("/")
      if (splitStr.length!=5||
        splitStr[4] == ""){
          this.native.toastWarn("AddServerPage.tipMsg");
          return ;
    }

    this.feedService.addFeed(result,"",0,"").then((isSuccess)=>{
        if (isSuccess){
          this.native.pop();
          return;
        }
      });
  }

  loadData(events:any){
    this.pageNum =this.pageNum+1;
     this.httpService.ajaxGet(ApiUrl.listPage+"?pageNum="+this.pageNum+"&pageSize="+this.pageSize,false).then((result)=>{
      if(result["code"] === 200){
         this.totalNum = result["data"]["total"];
         let arr = result["data"]["result"] || [];
         let discoverSquareList = this.discoverSquareList.concat(arr);
         this.httpAllData = _.cloneDeep(discoverSquareList);
         this.discoverSquareList = this.filterdiscoverSquareList(discoverSquareList);
      }
      if(this.pageNum*this.pageSize>=this.totalNum){
        this.infiniteScroll.disabled =true;
      }else{
        this.infiniteScroll.disabled =false;
        if(this.discoverSquareList.length<=13){
           this.loadData(null);
        }
      }
      this.infiniteScroll.complete();
    }).catch((err)=>{
      this.infiniteScroll.complete();
    });
   }

   initData(events:any,isLoading:boolean=true){
    this.isLoading =true;
    this.httpService.ajaxGet(ApiUrl.listPage+"?pageNum="+this.pageNum+"&pageSize="+this.pageSize,isLoading).then((result)=>{
      if(events!=""){
        events.target.complete();
      }
      if(result["code"] === 200){
        this.isLoading =false;
         this.totalNum = result["data"]["total"];
         let discoverSquareList = result["data"]["result"] || [];
         this.httpAllData = _.cloneDeep(discoverSquareList);
         this.discoverSquareList = this.filterdiscoverSquareList(discoverSquareList);
         this.searchSquareList =_.cloneDeep(this.discoverSquareList);
         this.infiniteScroll.disabled =false;
         if(this.discoverSquareList.length<=13){
             this.loadData(null);
         }

      }
    }).catch((err)=>{
      this.isLoading =false;
      this.infiniteScroll.disabled =false;
      if(events!=""){
        events.target.complete();
      }
    });
  }

  clickItem(feed:any){
    this.native.go("discoverfeedinfo",{
      params:feed
     });
  }

  handleShow(feed:any){

    let  feedNodeId = feed["nodeId"]
    let feedUrl = feed["url"];
    let feedId = feedUrl.split("/")[4];
    let followFeed = _.filter(this.followedList,(item:any)=>{
        return (feedNodeId==item["nodeId"]&&feedId==item["id"]);
    });

    if(followFeed.length>0){
        return false;
    }

    let addingFeed = _.filter(this.addingChanneList,(item:any)=>{
      return (feedNodeId==item["nodeId"]&&feedId==item["feedId"]);
    });

    if(addingFeed.length>0){
      return false;
    }

    let purpose = feed["purpose"] || "";
    if(purpose == "" || this.developerMode){
        return true;
     }

    return true;
  }

  filterdiscoverSquareList(discoverSquare:any){
   this.developerMode = this.feedService.getDeveloperMode();
   this.initnodeStatus();
   this.followedList = this.feedService.getChannelsList() || [];
   this.addingChanneList = this.feedService.getToBeAddedFeedsList() || [];
   this.searchAddingChanneList = _.cloneDeep(this.addingChanneList);
   let discoverSquareList = [];
    discoverSquareList =  _.filter(discoverSquare,(feed:any)=>{
      return this.handleShow(feed);
    });
    this.searchSquareList =_.cloneDeep(this.discoverSquareList);
    return discoverSquareList;
  }

  getUnfollowedFeed(){
   let feedList = this.feedService.getChannelsList() || [];
   let unfollowedFeed =  _.filter(feedList,(feed)=>{
              return !feed["isSubscribed"];
   });
   this.searchUnfollowedFeed = _.cloneDeep(this.unfollowedFeed);
   return unfollowedFeed;
  }

  initnodeStatus(){
    _.each(this.unfollowedFeed,(feed)=>{
      let nodeId = feed['nodeId'];
      let status = this.checkServerStatus(nodeId);
      this.nodeStatus[nodeId] = status;
    });
  }

  discoverSubscribe(feedInfo:any){

    let feedUrl = feedInfo["url"];
    let avatar =  feedInfo["feedsAvatar"];
    let followers = feedInfo["followers"];
    let feedName = feedInfo["name"];

    this.feedService.addFeed(feedUrl, avatar, followers, feedName).then((isSuccess)=>{
      if(isSuccess){
        this.zone.run(()=>{
          this.isSearch = "";
          this.init();
        });
      }
    }).catch((err)=>{

    });
  }

  checkFeedUrl(feedUrl: string): boolean{
    if (feedUrl == null || feedUrl == undefined || feedUrl == ""){
        return false;
    }
    if (feedUrl.length < 54 ||
      !feedUrl.startsWith('feeds://')||
      !feedUrl.indexOf("did:elastos:")){
        return false;
    }

    let splitStr = feedUrl.split("/")
    if (splitStr.length!=5||
      splitStr[4] == ""){
        return false;
    }
    return true;
  }

  addFeedUrl(result: string){
    this.feedService.addFeed(result,"",0,"").then((isSuccess)=>{
      if (isSuccess){
          this.zone.run(()=>{
            this.searchbar.value = "";
            this.isSearch ="";
            this.init();
          })
      }
    });
  }

}