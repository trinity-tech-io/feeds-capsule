import { Component, OnInit } from '@angular/core';
import { Events } from '@ionic/angular';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  public developerMode:boolean =  false;
  constructor(
    private feedService:FeedService,
    private events: Events,
    private native: NativeService,
    private translate:TranslateService,
    public theme:ThemeService) { 

  }

  ngOnInit() {
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("app.settings"));
  }

  ionViewWillEnter() {
    this.developerMode = this.feedService.getDeveloperMode();
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
    
    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });
  }

  ionViewDidEnter(){
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:updateTitle");
  }

  toggleDeveloperMode(){
    this.developerMode = !this.developerMode;
    this.feedService.setDeveloperMode(this.developerMode);
    this.feedService.setData("feeds.developerMode",this.developerMode);
  }

}
