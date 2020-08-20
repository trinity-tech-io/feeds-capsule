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
  this.activatedRoute.queryParams.subscribe((data) => {
    let item = _.cloneDeep(data);
    this.nodeId = item ["nodeId"] || "";
    this.channelId = item ["channelId"] || "";
    this.name = item["name"] || "";
    this.des = item["des"] || "";
  });
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
this.native.navigateForward(['/profileimage'],"");
}

cancel(){
 this.native.pop();
}

confirm(){
 if(this.checkparms()){
   alert("sucess");
 }
}

checkparms(){
 if(this.name === ""){
   this.native.toast_trans('CreatenewfeedPage.inputName');
   return false;
 }

 if(this.des === ""){
  this.native.toast_trans('CreatenewfeedPage.inputFeedDesc');
  return false;
}

if(this.channelAvatar === ""){
  this.native.toast_trans('CreatenewfeedPage.des');
  return false;
} 

return true;
}

}

