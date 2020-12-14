import { Component, OnInit, NgZone } from '@angular/core';
import { Events } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-about',
  templateUrl: './about.html',
  styleUrls: ['./about.scss'],
})

export class AboutPage implements OnInit {
  public connectionStatus = 1;
  public version = "v1.4.0.527a923";
  public currentLanguage = "";

  constructor(
    private zone: NgZone,
    private native: NativeService,
    private translate: TranslateService,
    private events: Events,
    private feedService: FeedService,
    public theme: ThemeService
  ) {}

    ngOnInit() {
    }

    ionViewWillEnter() {
      this.initTitle();
      this.native.setTitleBarBackKeyShown(true);

      this.connectionStatus = this.feedService.getConnectionStatus();
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
    }

    initTitle(){
      this.currentLanguage = this.feedService.getCurrentLang();
      titleBarManager.setTitle(this.translate.instant("AboutPage.about"));
    }


  gotoWebsite() {
    this.native.openUrl("http://www.trinity-tech.io");
  }

  showDisclaimer(){
    this.native.openUrl("https://www.trinity-tech.io/disclaimer.html");
  }

  showHelp(){
     if(this.currentLanguage === 'zh'){
      this.native.openUrl("https://github.com/elastos-trinity/feeds-manual-docs/blob/master/Feeds_Manual_zh.md");
     }else{
      this.native.openUrl("https://github.com/elastos-trinity/feeds-manual-docs/blob/master/Feeds_Manual_en.md");
     }
  }

  gotoTelegram(){
    this.native.openUrl("https://t.me/feedscapsule");
  }

  copyEmailAddress(){
    this.native.copyClipboard("feeds@trinity-tech.io").then(()=>{
      this.native.toast_trans("common.copysucceeded");
  }).catch(()=>{

  });;
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:updateTitle");
  }
}
