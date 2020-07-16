import { Component } from '@angular/core';
import { Platform, ModalController, Events } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { CarrierService } from './services/CarrierService';
import { FeedService } from './services/FeedService';
import { Router } from '@angular/router';
import { SplashscreenPage } from './pages/splashscreen/splashscreen.page';
import { MenuController } from '@ionic/angular';
import { AppService } from './services/AppService';
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService} from 'src/app/services/NativeService';
let appManager: any;

@Component({
  selector: 'my-app',
  templateUrl: 'app.html',
  styleUrls: [ 'app.scss' ]
})

export class MyApp {
  private didString = "Undefine";
  private name = "Undefine";
  private avatar = "";
  constructor(
    private events: Events,
    private menu: MenuController,
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private feedService: FeedService,
    private router: Router,
    private modalCtrl: ModalController,
    private appService: AppService,
    private carrierService:CarrierService,
    public theme:ThemeService,
    public native:NativeService) {
      this.initializeApp();
      this.initProfileData();
      this.events.subscribe("feeds:signinSuccess",()=>{
        this.initProfileData();
      })
  }

  initializeApp() {
    this.platform.ready().then(() => {
        this.statusBar.styleDefault();
        this.splashScreen.hide();
        this.appService.initTranslateConfig();
        let isFirst = localStorage.getItem('org.elastos.dapp.feeds.first') || "";
        if(isFirst!=""){
          this.appService.init();
          this.appService.addright();
          this.appService.initializeApp();
        }else{
          localStorage.setItem('org.elastos.dapp.feeds.first',"11");
          this.splash();
        }    
    });
  }

  closeApp() {
    appManager.close();
  }


  profiledetail(){
    this.native.go('/menu/profiledetail');
  }

  goToFeedSource(){
    this.native.go('/menu/servers');
  }

  setting(){
    this.native.go('/menu/setting');
  }

  goToDev(){
    this.native.go('menu/develop');
  }

  about(){
    this.native.go('/menu/about');
  }

  async splash() {
    const splash = await this.modalCtrl.create({component: SplashscreenPage});
    return await splash.present();
  }

  initProfileData(){
    let signData = this.feedService.getSignInData();
    if (signData == null || signData == undefined)
      return ;

    this.didString = signData.did;
    this.name = signData.name;
  }
}
