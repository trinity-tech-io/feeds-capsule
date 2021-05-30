import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { FeedService, Avatar } from 'src/app/services/FeedService';
import { CarrierService } from 'src/app/services/CarrierService';
import { LoadingController } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from 'src/app/services/theme.service';
import { AppService } from '../../services/AppService';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

import { connectivity, DID } from "@elastosfoundation/elastos-connectivity-sdk-cordova";
import { localization } from "@elastosfoundation/elastos-connectivity-sdk-cordova";
import { LanguageService } from 'src/app/services/language.service';


@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
})
export class SigninPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public signedIn: boolean = false;
  public did: string = "";
  public userName: string = "";
  public emailAddress: string = "";
  constructor(
    private events: Events,
    private native: NativeService,
    private zone: NgZone,
    private feedService: FeedService,
    public loadingController: LoadingController,
    private carrierService:CarrierService,
    private translate:TranslateService,
    private event:Events,
    public theme:ThemeService,
    public appService:AppService,
    private titleBarService: TitleBarService,
    private languageService: LanguageService) { 
    }

  ngOnInit() {

  }

  init(){
    
  }

  initTile(){
    this.titleBarService.setTitle(this.titleBar, this.translate.instant("SigninPage.signIn"));
    this.titleBarService.setTitleBarBlankButton(this.titleBar);
  }

  ionViewWillEnter() {
    localization.setLanguage(this.languageService.getCurLang());
    this.initTile();
    // appManager.setVisible("show");

    this.event.subscribe(FeedsEvent.PublishType.updateTitle,()=>{
      this.initTile();
    });
  }

  ionViewDidEnter(){
  }

  ionViewWillLeave(){
    this.event.unsubscribe(FeedsEvent.PublishType.updateTitle);
  }

  learnMore(slide) {
    slide.slideNext();
  }

  signIn(){
    
    connectivity.setActiveConnector(null).then(()=>{
      // this.testGetCredentials();
      this.doSignin();
    });
  }

  doSignin(){
    this.zone.run(()=>{
      this.native.showLoading('common.waitMoment',(isDismiss)=>{
      },2000);
    });
    this.feedService.signIn().then((isSuccess)=>{
      if (isSuccess){
        this.native.hideLoading();
        this.native.setRootRouter('/tabs/home');
        return;
      }
    });
  }

  public async testGetCredentials() {
    let didAccess = new DID.DIDAccess();
    try {
        let presentation = await didAccess.getCredentials({claims: {
          name: true,
          avatar: {
            required: false,
            reason: "For test"
          },
          email: {
            required: false,
            reason: "For test"
          },
          gender: {
            required: false,
            reason: "For test"
          },
          telephone: {
            required: false,
            reason: "For test"
          },
          nation: {
            required: false,
            reason: "For test"
          },
          nickname:{
            required: false,
            reason: "For test"
          },
          description:{
            required: false,
            reason: "For test"
          },
          interests:{
            required: false,
            reason: "For test"
          }
        }}
        );

      if (presentation) {
        console.log("Got credentials:", presentation);
        alert(JSON.stringify(presentation));
      }
      else {
        alert("Empty presentation returned, something wrong happened, or operation was cancelled");
      }
    } catch (error) {
      alert("error "+JSON.stringify(error));
    }
    
  }


  
}
