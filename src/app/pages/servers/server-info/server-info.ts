import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { PopoverController,Platform} from '@ionic/angular';
import { NativeService } from '../../../services/NativeService';
import { FeedService } from '../../../services/FeedService';
import { ThemeService } from '../../../services/theme.service';
import { HttpService } from '../../../services/HttpService';
import { ActionSheetController } from '@ionic/angular';
import { TranslateService } from "@ngx-translate/core";
import { ApiUrl } from '../../../services/ApiUrl';
import { MenuService } from '../../../services/MenuService';
import { UtilService } from '../../../services/utilService';
import { StorageService } from '../../../services/StorageService';
import { PopupProvider } from '../../../services/popup';
import { AppService } from '../../../services/AppService';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

import * as _ from 'lodash';

class Attribute {
  constructor(
    public iconName: string,
    public attrName: string,
    public attrValue: string
  ) {}
}

@Component({
  selector: 'page-server-info',
  templateUrl: 'server-info.html',
  styleUrls: ['server-info.scss'],
})

export class ServerInfoPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public developerMode:boolean =  false;
  public connectionStatus = 1;
  public buttonDisabled: boolean = true;

  public isOwner: string = "false";
  public serverStatus:number = 1;
  public clientNumber:number = 0;
  public nodeId:string = "";

  public isBindServer: boolean = false;
  public didString: string = "";
  public name: string = "";
  public owner: string = "";
  public introduction: string = null;
  public feedsUrl: string = null;

  public elaAddress: string = "";

  public serverDetails: any[] = [];

  public isShowQrcode: boolean = true;
  public actionSheet:any = null;
  public  ownerChannelList:any = [];
  public channel:any =null;
  //public clickbutton:string ="";
  public feedPublicStatus:any = {};
  public popover:any = "";
  public bindingServer:any = null;
  public curChannel:any = null;
  public isPress:boolean = false;
  constructor(
    private actionSheetController:ActionSheetController,
    private events: Events,
    private zone: NgZone,
    private native: NativeService,
    private feedService: FeedService,
    public theme: ThemeService,
    private translate: TranslateService,
    public httpService: HttpService,
    private menuService: MenuService,
    private storageService:StorageService,
    private popoverController:PopoverController,
    public popupProvider:PopupProvider,
    private appService:AppService,
    private platform:Platform,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper
  ) {}

  ngOnInit() {

  }

  initData(){
    this.developerMode = this.feedService.getDeveloperMode();
      let server: any;
      this.bindingServer = this.feedService.getBindingServer() || null;
      if (this.bindingServer !== null) {
        this.nodeId = this.bindingServer.nodeId;
        server = this.feedService.getServerbyNodeId(this.nodeId) || null;
        if (server == null || server == undefined)
          server = this.bindingServer;

        this.isBindServer = true;
        this.isShowQrcode = false;

        this.feedService.checkDIDOnSideChain(server.did,(isOnSideChain)=>{
          this.zone.run(() => {
            this.isShowQrcode = isOnSideChain;
            if (!this.isShowQrcode ){
              this.native.toastWarn('common.waitOnChain');
            }
          });
        });
      }
      this.serverStatus = this.feedService.getServerStatusFromId(this.nodeId);
      this.clientNumber = this.feedService.getServerStatisticsNumber(this.nodeId);

      if (server === null) {
        return ;
      }

      this.didString = server.did;
      this.name = server.name ||  this.translate.instant('DIDdata.NotprovidedfromDIDDocument');
      this.owner = server.owner;
      this.introduction = server.introduction;
      this.feedsUrl = server.feedsUrl || "";
      this.elaAddress = server.elaAddress || "";
      this.collectServerData(server);
  }

  ionViewWillEnter() {
    this.initTitle();
    this.initData();
    this.initMyFeeds();
    //this.initPublicStatus();
    this.feedPublicStatus = this.feedService.getFeedPublicStatus();

    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.events.subscribe(FeedsEvent.PublishType.connectionChanged, (status) => {
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.serverConnectionChanged, () => {
      this.zone.run(() => {
            this.serverStatus = this.feedService.getServerStatusFromId(this.nodeId);
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      if(this.menuService.postDetail!=null){
        this.menuService.hideActionSheet();
      }
      this.initTitle();
    });

    this.events.subscribe(FeedsEvent.PublishType.editServer, () => {
      if(!this.isShowQrcode){
        this.native.toastWarn('common.waitOnChain');
        return;
      }
      this.clickEdit();
    });

    this.events.subscribe(FeedsEvent.PublishType.removeFeedSourceFinish, () => {
      this.native.hideLoading();
    });

  }

  ionViewDidEnter(){
  }

  ionViewWillLeave(){
    this.titleBarService.setIcon(this.titleBar, FeedsData.TitleBarIconSlot.INNER_RIGHT, null, null);
    let value =  this.popoverController.getTop()["__zone_symbol__value"] || "";
    if(value!=""){
      this.popoverController.dismiss();
      this.popover = "";
    }

    this.native.hideLoading();
    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.serverConnectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.login_finish);
    this.events.unsubscribe(FeedsEvent.PublishType.removeFeedSourceFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
    this.events.unsubscribe(FeedsEvent.PublishType.editServer);
    this.curChannel = null;
    if(this.actionSheet!=null)
      this.actionSheet.dismiss();
  }

  initTitle(){
    this.titleBarService.setTitle(this.titleBar, this.translate.instant('ServerInfoPage.title'));

    if (this.checkIsMine() == 0) {
      //TODO
      this.titleBarService.setIcon(this.titleBar, FeedsData.TitleBarIconSlot.INNER_RIGHT, "editServer", "assets/icon/edit.svg");
      // titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_RIGHT, {
      //   key: "editServer",
      //   iconPath: TitleBarPlugin.BuiltInIcon.EDIT
      // });
    } else {
      this.titleBarService.setIcon(this.titleBar, FeedsData.TitleBarIconSlot.INNER_RIGHT, null, null);
    }
  }

  navigateBackPage() {
    this.native.pop();
  }

  collectServerData(server) {
    this.serverDetails = [];

    this.serverDetails.push({
      type:'ServerInfoPage.name',
      details: server.name ||  this.translate.instant('DIDdata.NotprovidedfromDIDDocument')
    });

    //if (this.isOwner == 'true'){
      this.serverDetails.push({
        type:'ServerInfoPage.owner',
        details: server.owner || ""
      });
    //}

    if (this.developerMode){
      this.serverDetails.push({
        type:"NodeId",
        details: server.nodeId || ""
      });
    }

    this.serverDetails.push({
      type:'ServerInfoPage.introduction',
      details: server.introduction || ""
    });

    if(this.developerMode){
      let version = this.feedService.getServerVersionByNodeId(server.nodeId)
      if (version != ""){
        this.serverDetails.push({
          type:'ServerInfoPage.version',
          details: version || "<1.3.0(Outdated)",
        });
      }
    }
    // if (server.elaAddress != "") {
    this.serverDetails.push({
      type:'IssuecredentialPage.elaaddress',
      details: server.elaAddress || this.translate.instant('DIDdata.Notprovided')
    });
    // }
    if(this.developerMode){
      this.serverDetails.push({
        type:'ServerInfoPage.did',
        details: this.feedService.rmDIDPrefix(server.did)
      });
    }


    this.serverDetails.push({
      type:'ServerInfoPage.feedsSourceQRCode',
      details: server.feedsUrl || "",
      qrcode: true
    });
  }

  menuMore(feedsUrl:string) {
    if(this.platform.is('ios')){
      this.isPress = true;
    }
    this.native.getShare(feedsUrl);
  }

  /* getShareableUrl(qrcode: string) {
    let url = "https://scheme.elastos.org/addsource?source="+encodeURIComponent(qrcode);
  } */

  async deleteFeedSource(){
    if(this.connectionStatus != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.actionSheet = await this.actionSheetController.create({
      cssClass:'editPost',
      buttons: [{
        text: this.translate.instant("ServerInfoPage.DeletethisFeedSource"),
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.native.showLoading('common.waitMoment');
          this.feedService.deleteFeedSource(this.nodeId).then(() => {
            this.native.toast("ServerInfoPage.removeserver");
            this.native.hideLoading();
            this.feedService.setCurrentFeed(null);
            this.storageService.remove("feeds.currentFeed");
            this.native.hideLoading();
            this.navigateBackPage();
            this.events.publish(FeedsEvent.PublishType.updateTab);
          });
        }
      }, {
        text: this.translate.instant("ServerInfoPage.cancel"),
        role: 'cancel',
        icon: 'close-circle',
        handler: () => {
        }
      }]
    });

    this.actionSheet.onWillDismiss().then(()=>{
      if(this.actionSheet !=null){
        this.actionSheet  = null;
      }
  });

    await this.actionSheet.present();
  }

  clickEdit(){
    if(this.feedService.getConnectionStatus() !== 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    if(this.feedService.getServerStatusFromId(this.nodeId) !== 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.native.navigateForward(
      ["editserverinfo"],
      {queryParams:{
        "name": this.name,
        "introduction": this.introduction,
        "elaAddress": this.elaAddress,
        "nodeId": this.nodeId,
        "did": this.didString,
      }}
    )
  }

  checkIsMine(){
    let bindingServer = this.feedService.getBindingServer() || null;
    if (bindingServer === null) {
      return 1;
    }
    // let bindServerDid = bindingServer.did || '';
    // if (this.didString === bindServerDid)
      return 0;
  }

  clickPublicFeeds(channel:any){
    if(this.feedService.getConnectionStatus() !== 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    if(!this.isShowQrcode){
      this.native.toastWarn('common.waitOnChain');
      return;
    }

    if(this.handlePublic(channel["id"])!=""){
       this.unPublicFeeds(channel);
      return;
    }

    this.curChannel = channel;
    if(this.developerMode){
      this.developerModeConfirm();
      return;
    }
    this.publicFeeds(channel,"");
  }

  publicFeeds(channel:any,developerMode:string){
    let feedsUrl = this.feedsUrl+"/"+channel["id"];
    let channelAvatar = this.feedService.parseChannelAvatar(channel["avatar"]);
    let feedsUrlHash = UtilService.SHA256(feedsUrl);
    let obj = {
      "did":this.bindingServer['did'],
      "name":channel["name"],
      "description":channel["introduction"],
      "url":feedsUrl,
      "feedsUrlHash":feedsUrlHash,
      "feedsAvatar":channelAvatar,
      "followers":channel["subscribers"],
      "ownerName":channel["owner_name"],
      "nodeId":this.nodeId,
      "ownerDid":channel["owner_did"]
    };

    if(developerMode!=""){
      obj["purpose"] = "1";
    }

    this.httpService.ajaxPost(ApiUrl.register,obj).then((result)=>{
      if(result["code"] === 200){
          this.feedPublicStatus[feedsUrlHash] = "1";
          this.feedService.setFeedPublicStatus(this.feedPublicStatus);
          this.storageService.set("feeds.feedPublicStatus",JSON.stringify(this.feedPublicStatus));
      }
    });
  }


  unPublicFeeds(channel:any){
    if(this.feedService.getConnectionStatus() !== 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    if(!this.isShowQrcode){
      this.native.toastWarn('common.waitOnChain');
      return;
    }

    if(this.handlePublic(channel["id"])===""){
      this.clickPublicFeeds(channel);
      return;
    }

    let feedsUrl = this.feedsUrl+"/"+channel["id"];
    let feedsUrlHash = UtilService.SHA256(feedsUrl);
    this.httpService.ajaxGet(ApiUrl.remove+"?feedsUrlHash="+feedsUrlHash).then((result)=>{
      if(result["code"] === 200){
          this.feedPublicStatus =_.omit(this.feedPublicStatus,[feedsUrlHash]);
          this.feedService.setFeedPublicStatus(this.feedPublicStatus);
          this.storageService.set("feeds.feedPublicStatus",JSON.stringify(this.feedPublicStatus));
      }
    });
  }

  updatePublic(){
    let obj = {
      "did":this.didString,
      "name":this.name,
      "description":this.introduction,
      "url":this.feedsUrl
    };
    this.httpService.ajaxPost(ApiUrl.update,obj).then((result)=>{
      if(result["code"]=== 200){
        //this.native.toast("test update");
      }
    });
  }

  initMyFeeds(){
    //this.ownerChannelList = this.feedService.getMyChannelList();
    this.ownerChannelList = this.feedService.getChannelsListFromNodeId(this.nodeId) || [];
  }

  parseChannelAvatar(avatar: string): string{
    return this.feedService.parseChannelAvatar(avatar);
  }

  moreName(name:string){
    return UtilService.moreNanme(name);
 }

 pressName(channelName:string){
  let name =channelName || "";
  if(name != "" && name.length>15){
    this.viewHelper.createTip(name);
  }
 }

 checkServerStatus(nodeId: string){
  return this.feedService.getServerStatusFromId(nodeId);
 }

 navTo(nodeId:string, channelId:number){
  this.native.navigateForward(['/channels', nodeId, channelId],"");
 }

 copytext(text:any){
  let textdata = text || "";
  if(textdata!=""){
    this.native.copyClipboard(text).then(()=>{
      this.native.toast_trans("common.copysucceeded");
  }).catch(()=>{

  });;
  }
}

handlePublic(channelId:string){
    let feedsUrl = this.feedsUrl+"/"+channelId;
    let feedsUrlHash = UtilService.SHA256(feedsUrl);
    let publicStatus = this.feedPublicStatus[feedsUrlHash] || "";
    return publicStatus;
}

initPublicStatus(){
  let len = this.ownerChannelList.length;
  if(len === 0){
    return;
  }
  let index = 0;
  let sid=setInterval(()=>{
      if(index === (len-1)){
        let item = this.ownerChannelList[index];
        let channelid = item["id"];
        this.getPublicStatus(channelid);
        clearInterval(sid);
      }else{
        let item = this.ownerChannelList[index];
        let channelid = item["id"];
        this.getPublicStatus(channelid);
        index++;
      }
  },100);

}
getPublicStatus(channelId:string){
  let feedsUrl = this.feedsUrl+"/"+channelId;
  let feedsUrlHash = UtilService.SHA256(feedsUrl);
  let publicStatus = this.feedPublicStatus[feedsUrlHash] || "";
  if(publicStatus === ""){
    this.httpService.ajaxGet(ApiUrl.get+"?feedsUrlHash="+feedsUrlHash,false).then(
      (result)=>{
      if(result["code"] === 200){
         let resultData = result["data"] || "";
         if(resultData!=""){
          this.feedPublicStatus[feedsUrlHash] = "1";
          this.feedService.setFeedPublicStatus(this.feedPublicStatus);
          this.storageService.set("feeds.feedPublicStatus",JSON.stringify(this.feedPublicStatus));
         }
      }
    })
  }
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
  that.publicFeeds(that.curChannel,"");
}

confirm(that:any){
  if(this.popover!=null){
    this.popover.dismiss();
  }
  that.publicFeeds(that.curChannel,"1");
}

showPreviewQrcode(feedsUrl:string){
  if(this.isPress){
    this.isPress =false;
   return;
  }

  this.titleBarService.setIcon(this.titleBar, FeedsData.TitleBarIconSlot.INNER_RIGHT, null, null);
  this.viewHelper.showPreviewQrcode(this.titleBar, feedsUrl,"common.qRcodePreview","ServerInfoPage.title","serverinfo",this.appService);
}

}
