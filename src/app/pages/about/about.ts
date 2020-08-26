import { Component, OnInit, NgZone } from '@angular/core';
import { Events } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { FeedService } from 'src/app/services/FeedService';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-about',
  templateUrl: './about.html',
  styleUrls: ['./about.scss'],
})

export class AboutPage implements OnInit {
  public connectionStatus = 1;
  public version = "v1.1";

  constructor(
    private zone: NgZone,
    private native: NativeService,
    private translate:TranslateService,
    private events: Events,
    private feedService:FeedService
    ) {}

    ngOnInit() {
    }

    ionViewWillEnter() {
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
      this.initTitle();
      this.native.setTitleBarBackKeyShown(true);
    }
  
    initTitle(){
      titleBarManager.setTitle(this.translate.instant("AboutPage.about"));
    }
  

  goWebsite() {
    this.native.openUrl("http://www.trinity-tech.io");
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:updateTitle");
  }

}
