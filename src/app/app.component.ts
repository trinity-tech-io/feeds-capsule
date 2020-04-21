import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { CarrierService } from './services/CarrierService';
import { FeedService } from './services/FeedService';
import { Router } from '@angular/router';

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
    private splashScreen: SplashScreen,
    private feedService: FeedService,
    private router: Router,
    private carrierService:CarrierService) {

    this.initializeApp();
  }

  routerLinks = [
    {
      linkName: '/menu/myprofile',
      iconName: 'person',
      pageName: 'My Profile'
    },
    {
      linkName: '/favorite',
      iconName: 'star',
      pageName: 'Favorite channels'
    },
    {
      linkName: '/menu/myfeeds',
      iconName: 'create',
      pageName: 'My channels'
    },
    {
      linkName: '/menu/servers',
      iconName: 'contacts',
      pageName: 'Channel sources'
    },
    {
      linkName: '/menu/about',
      iconName: 'information-circle',
      pageName: 'About'
    }
  ];

  initializeApp() {
    this.platform.ready().then(() => {
        this.statusBar.styleDefault();
        this.splashScreen.hide();

        let signInData = this.feedService.getSignInData();
        if ( signInData == null || 
             signInData == undefined ||
             this.feedService.getCurrentTimeNum() > signInData.expiresTS ){
          this.router.navigate(['/home']);
          return ;
        }

        this.carrierService.init();
        this.router.navigate(['/favorite']);
        this.feedService.updateSignInDataExpTime(signInData);
    });
}

  closeApp() {
    appManager.close();
  }
}
