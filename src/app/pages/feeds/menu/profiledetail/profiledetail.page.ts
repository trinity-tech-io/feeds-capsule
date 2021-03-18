import { Component, OnInit, NgZone } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { Events } from '@ionic/angular';
import { FeedService, Avatar } from '../../../../services/FeedService';
import { NativeService } from '../../../../services/NativeService';
import { ThemeService } from '../../../../services/theme.service';
import { CarrierService } from '../../../../services/CarrierService';
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
  public developerMode:boolean =  false;
  public connectionStatus = 1;
  public avatar: Avatar = null;
  public name = "";
  public description = "";
  public did = "";
  public gender = "";
  public telephone = "";
  public email = "";
  public location = "";


  public profileDetails: ProfileDetail[] = [];

  constructor(
    private zone: NgZone,
    private native: NativeService,
    private feedService:FeedService,
    private translate:TranslateService,
    public  theme:ThemeService,
    private events: Events,
    private carrierService:CarrierService
  ) {

    }

  ngOnInit() {
    this.connectionStatus = this.feedService.getConnectionStatus();
  }

  collectData() {
    this.profileDetails = [];
    this.profileDetails.push({
      type:'ProfiledetailPage.name',
      details:this.name
    })

    this.profileDetails.push({
      type:'ProfiledetailPage.did',
      details:this.did
    })

    if(this.developerMode){
      let carrierUserId = this.carrierService.getNodeId();
      this.profileDetails.push({
        type:"NodeId",
        details:carrierUserId
      })
    }

    if(this.telephone!="还未设置"&&this.telephone!="Not set yet"&&this.telephone!=""){
      this.profileDetails.push({
        type:'ProfiledetailPage.telephone',
        details:this.telephone
      })
    }

    if(this.email!="还未设置"&&this.email!="Not set yet"&&this.email!=""){
      this.profileDetails.push({
        type:'ProfiledetailPage.email',
        details: this.email
      })
    }

    if(this.location!="还未设置"&&this.location!="Not set yet"&&this.location!=""){
      this.profileDetails.push({
        type:'ProfiledetailPage.location',
        details: this.location
      })
    }

  }

  ionViewWillEnter() {
    this.developerMode = this.feedService.getDeveloperMode();
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);

    let signInData = this.feedService.getSignInData() || {};
    this.name = signInData["nickname"] || signInData["name"] || "";
    this.avatar = signInData["avatar"] || null;
    this.description = signInData["description"] || "";
    // this.did = signInData["did"] || "";
    this.did = this.feedService.rmDIDPrefix(signInData["did"] || "");
    this.telephone = signInData["telephone"] || "";
    this.email = signInData["email"] || "";
    this.location = signInData["location"] || "";

    this.collectData();

    this.events.subscribe(FeedsEvent.PublishType.connectionChanged,(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });
    this.events.subscribe(FeedsEvent.PublishType.updateTitle,()=>{
      this.initTitle();
    });
  }

  ionViewDidEnter(){
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant('ProfiledetailPage.profileDetails'));
  }

  ionViewWillUnload(){
  }

  ionViewWillLeave(){
    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
  }

  handleImages(){
    if(this.avatar === null){
       return 'assets/images/default-contact.svg';
    }
    let contentType = this.avatar['contentType'] || this.avatar['content-type'] || "";
    let cdata = this.avatar['data'] || "";
    if(contentType === "" || cdata === ""){
      return 'assets/images/default-contact.svg';
    }

    return 'data:'+contentType+';base64,'+this.avatar.data;
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


}
