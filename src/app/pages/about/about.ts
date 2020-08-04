import { Component, OnInit, NgZone } from '@angular/core';
import {Events} from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-about',
  templateUrl: './about.html',
  styleUrls: ['./about.scss'],
})

export class AboutPage implements OnInit {
  public version = "0.15.0";

  constructor(
    private zone: NgZone,
    public native: NativeService,
    private translate:TranslateService,
    private events: Events
    ) {}

    ngOnInit() {
     
    }

    ionViewWillEnter() {
      this.events.subscribe("feeds:updateTitle",()=>{
        this.initTitle();
      });
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
    this.events.unsubscribe("feeds:updateTitle");
  }

}
