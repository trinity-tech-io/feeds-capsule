import { Component } from '@angular/core';
import { Platform, ModalController } from '@ionic/angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
// import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { CarrierService } from './services/CarrierService';
import { FeedService } from './services/FeedService';
import { Router } from '@angular/router';
import { SplashscreenPage } from './pages/splashscreen/splashscreen.page';
import { MenuController } from '@ionic/angular';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;


let appManager: any;

@Component({
  selector: 'my-app',
  templateUrl: 'app.html',
  styleUrls: [ 'app.scss' ]
})

export class MyApp {
  private feedsUrl = "server.feedsUrl";

  constructor(
    private menu: MenuController,
    private platform: Platform,
    private statusBar: StatusBar,
    // private splashScreen: SplashScreen,
    private feedService: FeedService,
    private router: Router,
    private modalCtrl: ModalController,
    private carrierService:CarrierService) {
      // this.splash();
      // this.router.navigate(['/tabs']);
    this.initializeApp();

    titleBarManager.setBackgroundColor("#FFFFFF");
    titleBarManager.setForegroundMode(TitleBarPlugin.TitleBarForegroundMode.DARK);

    titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.OUTER_RIGHT, {
      key: "more",
      iconPath: "assets/icon/more_menu.ico"
    });

    titleBarManager.addOnItemClickedListener((menuIcon)=>{
      if (menuIcon.key == "more") {
          this.menu.open("menu");
      }
    });
  }

  initializeApp() {
    this.splash();
    this.platform.ready().then(() => {
        this.statusBar.styleDefault();
        // this.splashScreen.hide();
        
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

  async splash() {
    const splash = await this.modalCtrl.create({component: SplashscreenPage});
    return await splash.present();
  }
}
