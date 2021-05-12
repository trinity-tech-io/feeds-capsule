import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from "@ngx-translate/core";
import { NativeService } from 'src/app/services/NativeService';
import { AppService } from './../../services/AppService';
import { SplashscreenPage } from './../../pages/splashscreen/splashscreen.page';
import { ThemeService } from 'src/app/services/theme.service';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

@Component({
  selector: 'app-disclaimer',
  templateUrl: './disclaimer.page.html',
  styleUrls: ['./disclaimer.page.scss'],
})
export class DisclaimerPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public styleObj:any={"margin-top":""};

  constructor(
    private modalCtrl: ModalController,
    private appService: AppService,
    private events: Events,
    private native: NativeService,
    private translate: TranslateService,
    public theme: ThemeService,
    private titleBarService: TitleBarService
  ){
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, false);

    // appManager.setVisible('show');
    this.styleObj["height"] = (screen.height - 245) +"px";

    this.events.subscribe(FeedsEvent.PublishType.updateTitle,()=>{
      this.initTitle();
    });
  }

  ionViewDidEnter(){
  }

  private initTitle(){
    this.titleBarService.setTitle(this.titleBar, this.translate.instant("DisclaimerPage.title"));
  }

  ionViewWillLeave(){
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
  }

  // deny the disclaimer
  deny(){
    navigator['app'].exitApp();
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
