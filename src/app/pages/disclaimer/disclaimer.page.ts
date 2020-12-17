import { Component, OnInit } from '@angular/core';
import { Events,ModalController, } from '@ionic/angular';
import { TranslateService } from "@ngx-translate/core";
import { NativeService } from 'src/app/services/NativeService';
import { AppService } from './../../services/AppService';
import { SplashscreenPage } from './../../pages/splashscreen/splashscreen.page';
import { ThemeService } from 'src/app/services/theme.service';

declare let titleBarManager: TitleBarPlugin.TitleBarManager;
declare let appManager: AppManagerPlugin.AppManager;

@Component({
  selector: 'app-disclaimer',
  templateUrl: './disclaimer.page.html',
  styleUrls: ['./disclaimer.page.scss'],
})
export class DisclaimerPage implements OnInit {
  public styleObj:any={"margin-top":""};

  constructor(
    private modalCtrl: ModalController,
    private appService: AppService,
    private events: Events,
    private native: NativeService,
    private translate: TranslateService,
    public theme: ThemeService
  ){
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
    this.native.setTitleBarBackKeyShown(false);
    appManager.setVisible('show');
    this.styleObj["height"] = (screen.height - 160) +"px";

    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });
  }

  ionViewDidEnter(){
  }

  private initTitle(){
    titleBarManager.setTitle(this.translate.instant("DisclaimerPage.title"));
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:updateTitle");
  }

  // deny the disclaimer
  deny(){
    appManager.close();
  }

  // accept the disclaimer
  accept(){
    localStorage.setItem('org.elastos.dapp.feeds.disclaimer',"11");
    this.init();
  }

  init(){
    let isFirst = localStorage.getItem('org.elastos.dapp.feeds.first') || "";
    if (isFirst !== "") {
      this.appService.initializeApp();
    } else {
      localStorage.setItem('org.elastos.dapp.feeds.first',"11");
      this.splash();
    }
  }

  private async splash() {
    const splash = await this.modalCtrl.create({ component: SplashscreenPage });
    return await splash.present();
  }
}
