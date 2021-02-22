import { Component, OnInit, NgZone} from '@angular/core';
import { FeedService } from 'src/app/services/FeedService';
import { Events,PopoverController } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { MenuService } from 'src/app/services/MenuService';
import { UtilService } from 'src/app/services/utilService';
import { PopupProvider } from 'src/app/services/popup';
@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})


export class SearchPage implements OnInit {

  public connectionStatus = 1;
  public nodeStatus: any = {};
  public feedsList= [];
  public popover:any = "";
  public curAddingItem = {};
  public addingChanneList = [];
  public hideUnFollowFeeds:boolean = false;
  public isSearch:string ="";
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
    private menuService: MenuService,
    private popoverController: PopoverController,
    public popupProvider:PopupProvider
  ) {
  }

  ngOnInit() {
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
        // this.channelList  = this.feedService.getChannelsList();
        // this.initnodeStatus();
        this.addingChanneList = this.feedService.getToBeAddedFeedsList();
        this.initChannelData();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.unsubscribeFinish, (nodeId, channelId, name) => {
      // this.native.toast(name + " unsubscribed");
      this.zone.run(() => {
        // this.channelList  = this.feedService.getChannelsList();
        // this.initnodeStatus();
        this.initChannelData();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.refreshChannels, list =>{
      this.zone.run(() => {
        // this.channelList = this.feedService.getChannelsList();
        // this.initnodeStatus();
        this.initChannelData();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.channelsDataUpdate, () =>{
      this.zone.run(() => {
        //this.channelList  = this.feedService.getChannelsList();
        this.initChannelData();
        //this.initnodeStatus();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.hideUnFollowFeeds ,()=>{
      this.initChannelData();
    });

    this.events.subscribe(FeedsEvent.PublishType.refreshSubscribedChannels,()=>{
      this.zone.run(() => {
        this.initChannelData();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.addFeedStatusChanged,()=>{
      this.zone.run(() => {
        this.addingChanneList = this.feedService.getToBeAddedFeedsList();
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
    this.events.unsubscribe(FeedsEvent.PublishType.unsubscribeFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.refreshChannels);
    this.events.unsubscribe(FeedsEvent.PublishType.channelsDataUpdate);
    this.events.unsubscribe(FeedsEvent.PublishType.refreshSubscribedChannels);
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
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.addingChanneList = this.feedService.getToBeAddedFeedsList() || [];
    this.initChannelData();
    this.initSubscribe();
  }

  initChannelData(){
    this.feedsList = [];
    let channelData = this.feedService.getChannelsList();
    this.hideUnFollowFeeds = this.feedService.getHideUnFollowFeeds();
    if(!this.hideUnFollowFeeds){
      for(let index=0;index<channelData.length;index++){
        let item = channelData[index];
        let nodeId = item['nodeId'];
        let status = this.checkServerStatus(nodeId);
        this.nodeStatus[nodeId] = status;
        let isSubscribed = item["isSubscribed"];
        if(isSubscribed){
           this.feedsList.push(channelData[index]);
        }
      }
      return;
    }
    this.feedsList = channelData;
    this.initnodeStatus();
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

    this.feedService.subscribeChannel(nodeId, id);
  }

  async unsubscribe(nodeId: string, name: string, id: number){
    this.menuService.showUnsubscribeMenu(nodeId, id, name);
  }

  getItems(events){
    this.isSearch = events.target.value || "";
    if(events.target.value == ""){
      this.initChannelData();
      this.addingChanneList = this.feedService.getToBeAddedFeedsList() || [];
      return;
    }

    this.addingChanneList = this.addingChanneList.filter(
      channel=>channel.feedName.toLowerCase().indexOf(events.target.value.toLowerCase()) > -1
    );

    this.feedsList = this.feedsList.filter(
      channel=>channel.name.toLowerCase().indexOf(events.target.value.toLowerCase()) > -1
    );


  }

  doRefresh(event) {
    let sid = setTimeout(() => {
      // this.feedService.refreshChannels();
      this.feedService.updateSubscribedFeed();
      //this.channelList = this.feedService.getChannelsList();
      this.initChannelData();
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

  initnodeStatus(){
    for(let index =0 ;index<this.feedsList.length;index++){
           let nodeId = this.feedsList[index]['nodeId'];
           let status = this.checkServerStatus(nodeId);
           this.nodeStatus[nodeId] = status;
    }
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
          that.addingChanneList = that.feedService.getToBeAddedFeedsList();
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

}