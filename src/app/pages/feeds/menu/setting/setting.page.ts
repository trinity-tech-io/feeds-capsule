import { Component, OnInit, NgZone } from '@angular/core';
import {Events} from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';
import { TranslateService } from "@ngx-translate/core";
import { NavController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-setting',
  templateUrl: './setting.page.html',
  styleUrls: ['./setting.page.scss'],
})
export class SettingPage implements OnInit {
  public buttonDisable:boolean = false;
  constructor(
    private navCtrl: NavController,
    private router: Router,
    private zone: NgZone,
    private feedService :FeedService,
    private native: NativeService,
    public alertController: AlertController,
    private translate:TranslateService,
    private events: Events){ }

  ngOnInit() {
 
  }

  ionViewWillEnter() {
    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });
 
  }

  ionViewDidEnter(){
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("SettingPage.setting"));
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:updateTitle");
  }
   
}
