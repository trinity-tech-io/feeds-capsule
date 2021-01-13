import { Component, OnInit,NgZone} from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { Events} from '@ionic/angular';
import { ThemeService } from '../../services/theme.service';
import { FeedService } from '../../services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from '../../services/NativeService';
import { HttpService } from '../../services/HttpService';
import { ApiUrl } from '../../services/ApiUrl';
import { UtilService } from 'src/app/services/utilService';
import { StorageService } from '../../services/StorageService';
import * as _ from 'lodash';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-feedinfo',
  templateUrl: './feedinfo.page.html',
  styleUrls: ['./feedinfo.page.scss'],
})
// {
// 	"name": "testv1.3.0",
// 	"owner": "test",
// 	"introduction": "v1.3.0",
// 	"did": "did:elastos:iqJwsnRBe6WRQEaMTJwSaqMbvb952X8VBS",
// 	"carrierAddress": "T1yjRds4iCmEC2WLZVsajoEXdr2xge8RwEiSWfU4ASun6LB514zC",
// 	"nodeId": "CqYSEtXU21KsQQMx9D8y3Rpoe6559NE384Qj6j95V1pJ",
// 	"feedsUrl": "feeds://did:elastos:iqJwsnRBe6WRQEaMTJwSaqMbvb952X8VBS/T1yjRds4iCmEC2WLZVsajoEXdr2xge8RwEiSWfU4ASun6LB514zC",
// 	"elaAddress": "",
// 	"version": ""
// }
export class FeedinfoPage implements OnInit {
  public connectionStatus = 1;
  public nodeId:string ="";
  public channelId:number = 0;
  public name:string ="";
  public des:string="";
  public channelAvatar = "";
  public avatar = "";
  public oldChannelInfo:any = {};
  public oldChannelAvatar:string = "";
  public serverInfo:any = {};
  public feedsUrl: string = null;
  public isOwer:number = 2;
  public isPublic:string = "";
  public qrcodeString:string = null;
  public feedPublicStatus:any = {};
  public nodeStatus:any = {};
  constructor(
    private feedService: FeedService,
    public activatedRoute:ActivatedRoute,
    public theme:ThemeService,
    private translate:TranslateService,
    private events: Events,
    private native: NativeService,
    private zone:NgZone,
    private httpService: HttpService,
    public storageService:StorageService,
  ) {
    }

  ngOnInit() {
      let item = this.feedService.getChannelInfo();
      this.oldChannelInfo = item;
      let channelInfo  = _.cloneDeep(item);
      this.nodeId = channelInfo["nodeId"] || "";
      this.serverInfo = this.feedService.getServerbyNodeId(this.nodeId);
      let feedsUrl = this.serverInfo['feedsUrl'] || null;
      let did = this.serverInfo['did'] || "";
      this.isOwer = this.checkIsMine(did);
      this.channelId = channelInfo["channelId"] || "";
      this.feedsUrl = feedsUrl+"/"+this.channelId;
      this.name = channelInfo["name"] || "";
      this.feedPublicStatus = this.feedService.getFeedPublicStatus();
      let feedsUrlHash =UtilService.SHA256(this.feedsUrl);
      this.isPublic = this.feedPublicStatus[feedsUrlHash] || "";
      this.qrcodeString = this.feedsUrl+"#"+this.name;
      this.des = channelInfo["des"] || "";
      this.oldChannelAvatar = this.feedService.getProfileIamge();
  }

  ionViewWillEnter() {
    this.initTitle();
    this.initnodeStatus(this.nodeId);
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.channelAvatar = this.feedService.getProfileIamge();
    this.avatar = this.feedService.parseChannelAvatar(this.channelAvatar);
    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });

    this.events.subscribe("feeds:editFeedInfoFinish",()=>{
      this.zone.run(() => {
        this.native.hideLoading();
        this.native.pop();
      });
    });

    this.events.subscribe("rpcRequest:error",()=>{
      this.native.hideLoading();
    });

    this.events.subscribe("feeds:editChannel",()=>{
      this.clickEdit()
    });

    this.events.subscribe("feeds:friendConnectionChanged", (nodeId, status)=>{
      this.zone.run(()=>{
        this.nodeStatus[nodeId] = status;
      });
    });
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant('FeedinfoPage.title'));
    if (this.feedService.checkChannelIsMine(this.nodeId, this.channelId)) {
      titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_RIGHT, {
        key: "editChannel",
        iconPath: TitleBarPlugin.BuiltInIcon.EDIT
      });
    } else {
      titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_RIGHT, null);
    }
  }

  ionViewDidEnter(){
  }

  ionViewWillLeave(){
    titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_RIGHT, null);
    this.events.unsubscribe("feeds:editChannel");
    this.events.unsubscribe("feeds:updateTitle");
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:editFeedInfoFinish");
    this.events.unsubscribe("rpcRequest:error");
    this.events.unsubscribe("feeds:friendConnectionChanged");
  }

  profileimage(){
    this.feedService.setChannelInfo(
      {
        "nodeId":this.nodeId,
        "channelId":this.channelId,
        "name":this.name,
        "des":this.des,
      });
  this.native.navigateForward(['/profileimage'],"");
  }

  cancel(){
   this.native.pop();
  }

  confirm(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    if(this.feedService.getServerStatusFromId(this.nodeId) != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    if(this.checkparms()){
      this.native.showLoading("common.waitMoment").then(()=>{
        this.feedService.editFeedInfo(this.nodeId,Number(this.channelId),this.name, this.des,this.avatar);
      })
    }
  }

  checkparms(){
    let nameValue = this.name || "";
    nameValue = this.native.iGetInnerText(nameValue);
   if(nameValue === ""){
     this.native.toast_trans('CreatenewfeedPage.inputName');
     return false;
   }

   if (this.name.length > 32){
    this.native.toast_trans("CreatenewfeedPage.tipMsgLength1");
    return ;
  }

  let descValue = this.des || "";
  descValue = this.native.iGetInnerText(descValue);

   if(descValue === ""){
    this.native.toast_trans('CreatenewfeedPage.inputFeedDesc');
    return false;
  }

  if (this.des.length > 128){
    this.native.toast_trans("CreatenewfeedPage.tipMsgLength");
    return ;
  }

  if(this.channelAvatar === ""){
    this.native.toast_trans('CreatenewfeedPage.des');
    return false;
  }

  if(this.oldChannelInfo["name"] === this.name &&
  this.oldChannelInfo["des"] === this.des &&
  this.oldChannelAvatar === this.channelAvatar ){
   this.native.toast_trans('common.nochanges');
   return false;
  }

  return true;
  }


  checkIsMine(didString:string){
    let bindingServer = this.feedService.getBindingServer();
    if (bindingServer === null || bindingServer === undefined) {
      return 1;
    }

    let bindServerDid = bindingServer.did || '';
    if (didString === bindServerDid)
      return 0;

    return 1;
  }

  clickPublic(){
    if(this.isPublic === ""){
      this.publicFeeds();
   }else{
      this.unPublicFeeds();
   }
  }

  publicFeeds(){
    let channel = this.feedService.getChannelFromId(this.nodeId, this.channelId);
    let followers = channel.subscribers;
    let feedsUrlHash = UtilService.SHA256(this.feedsUrl);
    let obj = {
      "did":this.serverInfo['did'],
      "name":this.name,
      "description":this.des,
      "url":this.feedsUrl,
      "feedsUrlHash":feedsUrlHash,
      "feedsAvatar":this.channelAvatar,
      "followers":followers,
      "ownerName":this.serverInfo["owner"],
      "nodeId":this.nodeId
    };

    this.httpService.ajaxPost(ApiUrl.register,obj).then((result)=>{
      if(result["code"] === 200){
          this.isPublic = "1";
          this.feedPublicStatus[feedsUrlHash] = "1";
          this.feedService.setFeedPublicStatus(this.feedPublicStatus);
          this.storageService.set("feeds.feedPublicStatus",JSON.stringify(this.feedPublicStatus));
          this.native.toast_trans("ServerInfoPage.publicTip");
      }
    });
  }

  unPublicFeeds(){
    let feedsUrlHash = UtilService.SHA256(this.feedsUrl);
    this.httpService.ajaxGet(ApiUrl.remove+"?feedsUrlHash="+feedsUrlHash).then((result)=>{
      if(result["code"] === 200){
          this.isPublic = "";
          this.feedPublicStatus =_.omit(this.feedPublicStatus,[feedsUrlHash]);
          this.feedService.setFeedPublicStatus(this.feedPublicStatus);
          this.storageService.set("feeds.feedPublicStatus",JSON.stringify(this.feedPublicStatus));
          this.native.toast_trans("ServerInfoPage.unpublicTip");
      }
    });
  }

  clickEdit(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    if(this.feedService.getServerStatusFromId(this.nodeId) != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.native.go("/eidtchannel");
  }

  initnodeStatus(nodeId:string) {
    let status = this.checkServerStatus(nodeId);
    this.nodeStatus[nodeId] = status;
  }

  checkServerStatus(nodeId: string){
    return this.feedService.getServerStatusFromId(nodeId);
  }
}
