import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { PopoverController} from '@ionic/angular';
import { ThemeService } from 'src/app/services/theme.service';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from 'src/app/services/NativeService';
import { HttpService } from 'src/app/services/HttpService';
import { ApiUrl } from 'src/app/services/ApiUrl';
import { UtilService } from 'src/app/services/utilService';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import * as _ from 'lodash';

@Component({
  selector: 'app-eidtchannel',
  templateUrl: './eidtchannel.page.html',
  styleUrls: ['./eidtchannel.page.scss'],
})
export class EidtchannelPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
public connectionStatus = 1;
public nodeId:string ="";
public channelId:number = 0;
public name:string ="";
public des:string="";
public channelAvatar = "";
public avatar = "";
public oldChannelInfo:any = {};
public oldChannelAvatar:string = "";
public isPublic:string ="";
constructor(
  private feedService: FeedService,
  public activatedRoute:ActivatedRoute,
  public theme:ThemeService,
  private translate:TranslateService,
  private events: Events,
  private native: NativeService,
  private zone:NgZone,
  private httpService:HttpService,
  private popoverController:PopoverController,
  private titleBarService: TitleBarService
) {
  }

ngOnInit() {
    let item = this.feedService.getChannelInfo();
    this.oldChannelInfo = item;
    let channelInfo  = _.cloneDeep(item);
    this.nodeId = channelInfo["nodeId"] || "";
    this.channelId = channelInfo["channelId"] || "";
    this.name = channelInfo["name"] || "";
    this.des = channelInfo["des"] || "";
    this.oldChannelAvatar = this.feedService.getProfileIamge();
}

ionViewWillEnter() {
  this.initTitle();
  this.getPublicStatus();
  this.connectionStatus = this.feedService.getConnectionStatus();
  this.channelAvatar = this.feedService.getProfileIamge();
  this.avatar = this.feedService.parseChannelAvatar(this.channelAvatar);

  this.events.subscribe(FeedsEvent.PublishType.connectionChanged,(status)=>{
    this.zone.run(() => {
      this.connectionStatus = status;
    });
  });

  this.events.subscribe(FeedsEvent.PublishType.updateTitle,()=>{
    this.initTitle();
  });

  this.events.subscribe(FeedsEvent.PublishType.editFeedInfoFinish,()=>{
    this.zone.run(() => {
      this.updatePublicData();
      this.native.hideLoading();
      this.native.pop();
    });
  });

  this.events.subscribe(FeedsEvent.PublishType.rpcRequestError,()=>{
    this.native.hideLoading();
  });
}

initTitle(){
  this.titleBarService.setTitle(this.titleBar, this.translate.instant('EidtchannelPage.title'));
  this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  this.titleBarService.setTitleBarMoreMemu(this.titleBar);
}

ionViewDidEnter(){
}

ionViewWillLeave(){
  let value =  this.popoverController.getTop()["__zone_symbol__value"] || "";
  if(value!=""){
    this.popoverController.dismiss();
  }
  this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
  this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
  this.events.unsubscribe(FeedsEvent.PublishType.editFeedInfoFinish);
  this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestError);
  this.events.publish(FeedsEvent.PublishType.notification);
  this.events.publish(FeedsEvent.PublishType.addProflieEvent);
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
    this.native.showLoading("common.waitMoment",(isDismiss)=>{
    }).then(()=>{
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

updatePublicData(){
  if(this.isPublic === ""){
    return;
  }
  let serverInfo = this.feedService.getServerbyNodeId(this.nodeId);
  let feedsUrl = serverInfo["feedsUrl"]+"/"+this.channelId;
  let feedsUrlHash = UtilService.SHA256(feedsUrl);
    let obj = {
      "feedsUrlHash":feedsUrlHash,
      "name":this.name,
      "description":this.des,
      "feedsAvatar":this.avatar,
      "followers":this.oldChannelInfo["subscribers"]
    };
    this.httpService.ajaxPost(ApiUrl.update,obj,false).then((result)=>{
      if(result["code"]=== 200){
        //this.native.toast("test update");
      }
    });
  }

  getPublicStatus(){
    let serverInfo = this.feedService.getServerbyNodeId(this.nodeId);
    let feedsUrl = serverInfo["feedsUrl"]+"/"+this.channelId;
    let feedsUrlHash = UtilService.SHA256(feedsUrl);
    this.httpService.ajaxGet(ApiUrl.get+"?feedsUrlHash="+feedsUrlHash,false).then(
      (result)=>{
      if(result["code"] === 200){
        let resultData = result["data"] || "";
        if(resultData!=""){
          this.isPublic = "1"
        }else{
          this.isPublic = ""
        }
    }
    })
  }

}

