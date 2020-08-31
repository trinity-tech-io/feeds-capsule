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
  selector: 'app-eidtchannel',
  templateUrl: './eidtchannel.page.html',
  styleUrls: ['./eidtchannel.page.scss'],
})
export class EidtchannelPage implements OnInit {
public connectionStatus = 1;
public nodeId:string ="";
public channelId:number = 0;
public name:string ="";
public des:string="";
public channelAvatar = "";
public avatar = "";
public oldChannelInfo:any = {};
public oldChannelAvatar:string ="";
constructor(
  private feedService: FeedService,
  public activatedRoute:ActivatedRoute,
  public theme:ThemeService,
  private translate:TranslateService,
  private events: Events,
  private native: NativeService,
  private zone:NgZone) {

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
}

initTitle(){
  titleBarManager.setTitle(this.translate.instant('EidtchannelPage.title'));
}

ionViewDidEnter(){
   this.initTitle();
}

ionViewWillLeave(){
  this.events.unsubscribe("feeds:updateTitle");
  this.events.unsubscribe("feeds:connectionChanged");
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
    this.feedService.editFeedInfo(this.nodeId,Number(this.channelId),this.name, this.des,this.avatar);
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

}

