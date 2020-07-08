import { Component } from '@angular/core';
import { Platform, ModalController, Events } from '@ionic/angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { CarrierService } from './services/CarrierService';
import { FeedService } from './services/FeedService';
import { Router } from '@angular/router';
import { SplashscreenPage } from './pages/splashscreen/splashscreen.page';
import { MenuController } from '@ionic/angular';
import { AppService } from './services/AppService';
import { ThemeService } from 'src/app/services/theme.service';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;


let appManager: any;

@Component({
  selector: 'my-app',
  templateUrl: 'app.html',
  styleUrls: [ 'app.scss' ]
})

export class MyApp {
  private didString = "Undefine";
  private name = "Undefine";
  constructor(
    private events: Events,
    private menu: MenuController,
    private platform: Platform,
    private statusBar: StatusBar,
    private feedService: FeedService,
    private router: Router,
    private modalCtrl: ModalController,
    private appService: AppService,
    private carrierService:CarrierService,
    public theme:ThemeService) {
      this.initializeApp();
      this.initProfileData();

      titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.OUTER_RIGHT, {
        key: "more",
        iconPath: "assets/icon/more_menu.ico"
      });

      titleBarManager.addOnItemClickedListener((menuIcon)=>{
        if (menuIcon.key == "more") {
            this.menu.open("menu");
        }
      });

      this.events.subscribe("feeds:signinSuccess",()=>{
        this.initProfileData();
      })
  }

  initializeApp() {
    this.splash();
    this.platform.ready().then(() => {
        this.statusBar.styleDefault();
        // this.splashScreen.hide();     
        this.appService.init();
        let signInData = this.feedService.getSignInData();
        if ( signInData == null || 
             signInData == undefined ||
             this.feedService.getCurrentTimeNum() > signInData.expiresTS ){
             this.router.navigate(['/signin']);
          return ;
        }

        this.carrierService.init();
        // this.router.navigate(['/favorite']);
        this.router.navigate(['/tabs/home']);
        this.feedService.updateSignInDataExpTime(signInData);
    });
  }

  closeApp() {
    appManager.close();
  }


  profiledetail(){
    this.router.navigate(['/menu/profiledetail']);
    
  }

  goToFeedSource(){
    this.router.navigate(['/menu/servers']);
  }

  setting(){
    this.router.navigate(['/menu/setting']);
  }

  goToDev(){
    this.router.navigate(['menu/develop']);
  }

  about(){
    this.router.navigate(['/menu/about']);
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
