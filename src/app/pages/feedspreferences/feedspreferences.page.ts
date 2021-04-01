import { Component, OnInit } from '@angular/core';
import { Events,PopoverController} from '@ionic/angular';
import { ActivatedRoute, Params } from '@angular/router';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from '../../services/theme.service';
import { FeedService } from '../../services/FeedService';
import { NativeService } from '../../services/NativeService';
import { HttpService } from '../../services/HttpService';
import { ApiUrl } from '../../services/ApiUrl';
import { StorageService } from '../../services/StorageService';
import { UtilService } from '../../services/utilService';
import { PopupProvider } from '../../services/popup';
import * as _ from 'lodash';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
@Component({
  selector: 'app-feedspreferences',
  templateUrl: './feedspreferences.page.html',
  styleUrls: ['./feedspreferences.page.scss'],
})
export class FeedspreferencesPage implements OnInit {
  public hideDeletedPosts:boolean = true;
  public nodeId:string = "";
  public feedId:number = 0;
  public feedPublicStatus = {};
  public curFeedPublicStatus = "";
  public popover:any = null;
  public developerMode:boolean =  false;
  public isShowQrcode: boolean = true;

  constructor(
    private translate:TranslateService,
    private events: Events,
    public theme:ThemeService,
    public activeRoute: ActivatedRoute,
    private feedService: FeedService,
    private native: NativeService,
    public httpService: HttpService,
    private storageService:StorageService,
    public popupProvider:PopupProvider,
    private popoverController:PopoverController
  ) { }

  ngOnInit() {

    this.activeRoute.queryParams.subscribe((params: Params) => {
      console.log(JSON.stringify(params));
      this.nodeId = params.nodeId;
      this.feedId = params.feedId;
    });
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant('FeedspreferencesPage.title'));
  }

  ionViewWillEnter(){
    let server = this.feedService.getServerbyNodeId(this.nodeId) || null;
    if(server!=null){
      this.feedService.checkDIDOnSideChain(server.did,(isOnSideChain)=>{
          this.isShowQrcode = isOnSideChain;
      });
    }
    this.getPublicStatus();
    this.developerMode = this.feedService.getDeveloperMode();
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
    this.addEvent();
  }

  ionViewWillLeave(){
    let value =  this.popoverController.getTop()["__zone_symbol__value"] || "";
    if(value!=""){
      this.popoverController.dismiss();
      this.popover = null;
    }
    this.clearEvent();
    this.events.publish(FeedsEvent.PublishType.addProflieEvent);
  }

  clearEvent(){
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
  }

  addEvent(){
    this.events.subscribe(FeedsEvent.PublishType.updateTitle,()=>{
      this.initTitle();
    });
  }

  clickPublicFeeds(){
    if(this.feedService.getConnectionStatus() !== 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    if(!this.isShowQrcode){
      this.native.toastWarn('common.waitOnChain');
      return;
    }

    if(this.curFeedPublicStatus!=""){
       this.unPublicFeeds();
      return;
    }

    if(this.developerMode){
      this.developerModeConfirm();
      return;
    }

    this.publicFeeds("");
  }

  unPublicFeeds(){

    if(this.feedService.getConnectionStatus() !== 0){
      this.native.toastWarn('common.connectionError');
      return;
    }


    if(this.curFeedPublicStatus===""){
      this.clickPublicFeeds();
      return;
    }

    let server = this.feedService.getServerbyNodeId(this.nodeId) || null;
    if(server===null){
       return;
    }
    let feed = this.feedService.getChannelFromId(this.nodeId,this.feedId);
    let feedsUrl = server.feedsUrl+"/"+feed["id"];
    let feedsUrlHash = UtilService.SHA256(feedsUrl);
    this.httpService.ajaxGet(ApiUrl.remove+"?feedsUrlHash="+feedsUrlHash).then((result)=>{
      if(result["code"] === 200){
          this.curFeedPublicStatus = "";
          this.feedPublicStatus =_.omit(this.feedPublicStatus,[feedsUrlHash]);
          this.feedService.setFeedPublicStatus(this.feedPublicStatus);
          this.storageService.set("feeds.feedPublicStatus",JSON.stringify(this.feedPublicStatus));
      }
    });
  }

  publicFeeds(developerMode:string){
    let server = this.feedService.getServerbyNodeId(this.nodeId) || null;
    if(server===null){
       return;
    }
    let feed = this.feedService.getChannelFromId(this.nodeId,this.feedId);
    let feedsUrl = server.feedsUrl+"/"+feed["id"];
    let channelAvatar = this.feedService.parseChannelAvatar(feed["avatar"]);
    let feedsUrlHash = UtilService.SHA256(feedsUrl);
    let obj = {
      "did":server['did'],
      "name":feed["name"],
      "description":feed["introduction"],
      "url":feedsUrl,
      "feedsUrlHash":feedsUrlHash,
      "feedsAvatar":channelAvatar,
      "followers":feed["subscribers"],
      "ownerName":feed["owner_name"],
      "nodeId":this.nodeId,
      "ownerDid":feed["owner_did"]
    };

    if(developerMode!=""){
      obj["purpose"] = "1";
    }

    this.httpService.ajaxPost(ApiUrl.register,obj).then((result)=>{
      if(result["code"] === 200){
          this.curFeedPublicStatus = "1";
          this.feedPublicStatus[feedsUrlHash] = "1";
          this.feedService.setFeedPublicStatus(this.feedPublicStatus);
          this.storageService.set("feeds.feedPublicStatus",JSON.stringify(this.feedPublicStatus));
      }
    });
  }


developerModeConfirm(){
  this.popover = this.popupProvider.ionicConfirm(
    this,
    // "ConfirmdialogComponent.signoutTitle",
    "",
    "ServerInfoPage.des1",
    this.cancel,
    this.confirm,
    'tskth.svg',
    "ServerInfoPage.des2",
    "ServerInfoPage.des3",
  );
}

cancel(that:any){
  if(this.popover!=null){
    this.popover.dismiss();
  }
  that.publicFeeds("");
}

confirm(that:any){
  if(this.popover!=null){
    this.popover.dismiss();
  }
  that.publicFeeds("1");
}

getPublicStatus(){
  let server = this.feedService.getServerbyNodeId(this.nodeId) || null;
  if(server===null){
     return;
  }
  let feedsUrl = server.feedsUrl+"/"+this.feedId;
  let feedsUrlHash = UtilService.SHA256(feedsUrl);
  let publicStatus = this.feedPublicStatus[feedsUrlHash] || "";
  if(publicStatus === ""){
    this.httpService.ajaxGet(ApiUrl.get+"?feedsUrlHash="+feedsUrlHash,false).then(
      (result)=>{
      if(result["code"] === 200){
         let resultData = result["data"] || "";
         if(resultData!=""){
          this.curFeedPublicStatus = "1";
          this.feedPublicStatus[feedsUrlHash] = "1";
          this.feedService.setFeedPublicStatus(this.feedPublicStatus);
          this.storageService.set("feeds.feedPublicStatus",JSON.stringify(this.feedPublicStatus));
         }else{
          this.curFeedPublicStatus = "";
         }
      }
    })
  }else{
     this.curFeedPublicStatus = "1";
  }
}
}
