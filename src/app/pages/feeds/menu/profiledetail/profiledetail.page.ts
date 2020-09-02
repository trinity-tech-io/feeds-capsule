import { Component, OnInit, NgZone } from '@angular/core';
import { Events } from '@ionic/angular';
import { FeedService, Avatar } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from "@ngx-translate/core";
import { ThrowStmt } from '@angular/compiler';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

type ProfileDetail = {
  type: string,
  details: string
}

@Component({
  selector: 'app-profiledetail',
  templateUrl: './profiledetail.page.html',
  styleUrls: ['./profiledetail.page.scss'],
})
export class ProfiledetailPage implements OnInit {

  public connectionStatus = 1;
  public avatar: Avatar = null;
  public name = "";
  public description = "";
  public did = "";
  public gender = "";
  public telephone = "";
  public email = "";
  public location = "";
  public ownChannelSourceDid = "";

  public profileDetails: ProfileDetail[] = [];

  constructor(
    private zone: NgZone,
    private native: NativeService,
    private feedService:FeedService,
    public  theme:ThemeService,
    private translate:TranslateService,
    private events: Events
  ) {
      let signInData = feedService.getSignInData();
      this.name = signInData.name || "";
      this.avatar = signInData.avatar || null;
      this.description = signInData.description || "";
      this.did = signInData.did || "";
      this.telephone = signInData.telephone || "";
      this.email = signInData.email || "";
      this.location = signInData.location || "";

      this.collectData(feedService.getSignInData());

      let bindingServer = this.feedService.getBindingServer();
      if (bindingServer != null && bindingServer != undefined)
        this.ownChannelSourceDid = bindingServer.did;
    }

  ngOnInit() {
    this.connectionStatus = this.feedService.getConnectionStatus();
  }

  collectData(data) {
    this.profileDetails = [];
    this.profileDetails.push({
      type: this.translate.instant('ProfiledetailPage.name'),
      details: data.name
    })
    this.profileDetails.push({
      type: this.translate.instant('ProfiledetailPage.did'),
      details: data.did
    })
    this.profileDetails.push({
      type: this.translate.instant('ProfiledetailPage.gender'),
      details: data.gender
    })
    this.profileDetails.push({
      type: this.translate.instant('ProfiledetailPage.telephone'),
      details: data.telephone
    })
    this.profileDetails.push({
      type: this.translate.instant('ProfiledetailPage.email'),
      details: data.email
    })
    this.profileDetails.push({
      type: this.translate.instant('ProfiledetailPage.location'),
      details: data.location
    })
  }

  ionViewWillEnter() {
    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });
  
  }

  ionViewDidEnter(){
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant('ProfiledetailPage.profileDetails'));
  }

  ionViewWillUnload(){
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:updateTitle");
  }

  handleImages(){
    if(this.avatar === null){
       return 'assets/images/default-contact.svg';
    }
    let contentType = this.avatar['contentType'] || "";
    let cdata = this.avatar['data'] || "";
    if(contentType === "" || cdata === ""){
      return 'assets/images/default-contact.svg';
    }
    
    return 'data:'+this.avatar.contentType+';base64,'+this.avatar.data
  }
  

}
