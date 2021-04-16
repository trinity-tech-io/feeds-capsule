import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { Events } from 'src/app/services/events.service';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

@Component({
  selector: 'page-about',
  templateUrl: './about.html',
  styleUrls: ['./about.scss'],
})

export class AboutPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public connectionStatus = 1;
  public version = "v1.5.5";
  public currentLanguage = "";

  constructor(
    private zone: NgZone,
    private native: NativeService,
    private translate: TranslateService,
    private events: Events,
    private feedService: FeedService,
    public theme: ThemeService,
    private titleBarService: TitleBarService
  ) {}

    ngOnInit() {
    }

    ionViewWillEnter() {
      this.initTitle();
      this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);

      this.connectionStatus = this.feedService.getConnectionStatus();
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
      this.currentLanguage = this.feedService.getCurrentLang();
      this.titleBarService.setTitle(this.titleBar, this.translate.instant("AboutPage.about"));
    }


  gotoWebsite() {
    this.native.openUrl("https://trinity-feeds.app");
  }

  showDisclaimer(){
    this.native.openUrl(" https://trinity-feeds.app/disclaimer");
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
    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
  }
}
