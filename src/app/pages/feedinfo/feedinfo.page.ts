import { Component, OnInit,NgZone } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { Events} from '@ionic/angular';
import { ThemeService } from 'src/app/services/theme.service';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from 'src/app/services/NativeService';
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
  constructor(
    private feedService: FeedService,
    public activatedRoute:ActivatedRoute,
    public theme:ThemeService,
    private translate:TranslateService,
    private events: Events,
    private native: NativeService,
    private zone:NgZone
  ) {
    }

  ngOnInit() {

      let item = this.feedService.getChannelInfo();
      this.oldChannelInfo = item;
      let channelInfo  = _.cloneDeep(item);
      this.nodeId = channelInfo["nodeId"] || "";
      this.serverInfo = this.feedService.getServerbyNodeId(this.nodeId);
      this.feedsUrl = this.serverInfo['feedsUrl'] || null;
      let did = this.serverInfo['did'] || "";
      this.isOwer = this.checkIsMine(did);
      this.channelId = channelInfo["channelId"] || "";
      this.name = channelInfo["name"] || "";
      this.des = channelInfo["des"] || "";
      this.oldChannelAvatar = this.feedService.getProfileIamge();
  }

  ionViewWillEnter() {
    this.initTitle();

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
}
