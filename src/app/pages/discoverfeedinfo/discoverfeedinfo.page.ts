import { Component, OnInit, NgZone } from '@angular/core';
import { Events,PopoverController} from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from '../../services/NativeService';
import { FeedService } from '../../services/FeedService';
import { ThemeService } from '../../services/theme.service';
import { HttpService } from '../../services/HttpService';
import { MenuService } from '../../services/MenuService';
import { TranslateService } from "@ngx-translate/core";
import { PopupProvider } from '../../services/popup';
import * as _ from 'lodash';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-discoverfeedinfo',
  templateUrl: './discoverfeedinfo.page.html',
  styleUrls: ['./discoverfeedinfo.page.scss'],
})

// let obj = {
//   "did":this.serverInfo['did'],
//   "name":this.name,
//   "description":this.des,
//   "url":this.feedsUrl,
//   "feedsUrlHash":feedsUrlHash,
//   "feedsAvatar":this.channelAvatar,
//   "followers":followers,
//   "ownerName":this.serverInfo["owner"]
// };

export class DiscoverfeedinfoPage implements OnInit {

  public  connectionStatus = 1;
  public feedInfo:any = {};
  public popover:any = "";
  public isSubscribed:boolean = false;
  public qrcodeString:string = null;
  public feedsUrl:string = null;
  constructor(
    private events: Events,
    private zone: NgZone,
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private feedService: FeedService,
    public theme:ThemeService,
    private translate:TranslateService,
    public httpService:HttpService,
    private popoverController: PopoverController,
    public popupProvider:PopupProvider,
    private menuService: MenuService) {}

  ngOnInit() {

    this.acRoute.queryParams.subscribe((data) => {
      this.feedInfo = _.cloneDeep(data)["params"];
    });

  }

  ionViewWillEnter() {
    this.feedsUrl = this.feedInfo['url'] || "";
    this.qrcodeString = this.feedsUrl+"#"+this.feedInfo["name"] || null;
    this.isSubscribed = this.getChannelStatus(this.feedInfo);
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);

    this.connectionStatus = this.feedService.getConnectionStatus();
    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe("feeds:updateServerList",()=>{
      this.zone.run(() => {
      //this.native.navigateForward('discoverfeeds',"");
      //this.getNodeId();
      });
    });

    this.events.subscribe('feeds:login_finish',  () => {
      this.zone.run(() => {

      });
    });

    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });

    this.events.subscribe("feeds:unsubscribeFinish",()=>{
      this.zone.run(() => {
          this.isSubscribed = false;
      });
    });

    this.events.subscribe("feeds:subscribeFinish",()=>{
      this.zone.run(() => {
         this.isSubscribed = true;
      });
    });

  }

  ionViewDidEnter(){
  }

  ionViewWillLeave(){
    let value =  this.popoverController.getTop()["__zone_symbol__value"] || "";
    if(value!=""){
      this.popoverController.dismiss();
      this.popover = "";
    }
    this.native.hideLoading();
    this.events.unsubscribe("feeds:updateServerList");
    this.events.unsubscribe("feeds:serverConnectionChanged");
    this.events.unsubscribe("feeds:updateTitle");
    this.events.unsubscribe("feeds:unsubscribeFinish");
    this.events.unsubscribe("feeds:subscribeFinish");
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant('DiscoverfeedinfoPage.title'));
  }

  checkDid(type:string){
    let signInData = this.feedService.getSignInData() || {};
    let did = signInData["did"];
    this.feedService.checkDIDDocument(did).then((isOnSideChain)=>{
      if (!isOnSideChain){
        //show one button dialog
        //if click this button
        //call feedService.promptpublishdid() function
        this.openAlert();
        return;
      }

      if(this.feedService.getConnectionStatus() != 0){
        this.native.toastWarn('common.connectionError');
        return;
      }

      if(type === "subscribe"){
        this.subscribe();
        return;
      }

      if(type === "unsubscribe"){
        this.unsubscribe();
        return;
      }

    });
  }

  openAlert(){
    this.popover = this.popupProvider.ionicAlert(
      this,
      // "ConfirmdialogComponent.signoutTitle",
      "",
      "common.didnotrelease",
      this.confirm,
      'tskth.svg'
    );
  }

  confirm(that:any){
      if(this.popover!=null){
         this.popover.dismiss();
         that.feedService.promptpublishdid();
      }
  }

  subscribe(){
    let  nodeId = this.feedInfo["nodeId"]
    console.log("===nodeId==="+nodeId);
    let feedUrl = this.feedInfo["url"];
    let channelId = feedUrl.split("/")[4];
    console.log("=== channelId==="+channelId);
    let feedName = this.feedInfo["name"];
    console.log("===feedName==="+feedName);
  }

  async unsubscribe(){
    let  nodeId = this.feedInfo["nodeId"]
    console.log("===nodeId==="+nodeId);
    let feedUrl = this.feedInfo["url"];
    let channelId = feedUrl.split("/")[4];
    console.log("=== channelId==="+channelId);
    let feedName = this.feedInfo["name"];
    console.log("===feedName==="+feedName);
    this.menuService.showUnsubscribeMenu(nodeId,channelId,feedName);
  }

  getChannelStatus(item:any){
    let nodeId = item["nodeId"];
    let feedUrl = item["url"];
    let channelId = feedUrl.split("/")[4];
    let channelList = this.feedService.getChannelsList() || [];
    let channel:any = _.find(channelList,(item:any)=>{
      return (item["nodeId"]==nodeId&&item["id"]==channelId)
    });
    channel = channel || "";
    if(channel === ""){
        return false;
    }

    return channel.isSubscribed;

  }

}
