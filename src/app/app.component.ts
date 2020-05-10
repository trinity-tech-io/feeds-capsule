import { Component } from '@angular/core';
import { Platform, ModalController } from '@ionic/angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
// import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { CarrierService } from './services/CarrierService';
import { FeedService } from './services/FeedService';
import { Router } from '@angular/router';
import { SplashscreenPage } from './pages/splashscreen/splashscreen.page';

let appManager: any;

@Component({
  selector: 'my-app',
  templateUrl: 'app.html',
  styleUrls: [ 'app.scss' ]
})

export class MyApp {
  constructor(
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
  }

  // routerLinks = [
  //   {
  //     linkName: '/menu/myprofile',
  //     iconName: 'person',
  //     pageName: 'My Profile'
  //   },
  //   {
  //     linkName: '/favorite',
  //     iconName: 'star',
  //     pageName: 'Favorite channels'
  //   },
  //   {
  //     linkName: '/menu/myfeeds',
  //     iconName: 'create',
  //     pageName: 'My channels'
  //   },
  //   {
  //     linkName: '/menu/servers',
  //     iconName: 'contacts',
  //     pageName: 'Channel sources'
  //   },
  //   {
  //     linkName: '/menu/about',
  //     iconName: 'information-circle',
  //     pageName: 'About'
  //   }
  // ];

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
        this.router.navigate(['/tabs']);
        this.feedService.updateSignInDataExpTime(signInData);
    });
}

  closeApp() {
    appManager.close();
  }


  async splash() {
    const splash = await this.modalCtrl.create({component: SplashscreenPage});
    return await splash.present();
  }
}
