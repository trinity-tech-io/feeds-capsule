import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { CarrierService } from './services/CarrierService';
import { Router} from '@angular/router';

let appManager: any;

@Component({
  selector: 'my-app',
  templateUrl: 'app.html',
  styleUrls: [ 'app.scss' ]
})

export class MyApp {
  // rootPage:any = TabsPage;

  constructor(
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
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
      iconName: 'apps',
      pageName: 'Favorite Feeds'
    },
    {
      linkName: '/menu/myfeeds',
      iconName: 'apps',
      pageName: 'My Feeds'
    },
    {
      linkName: '/menu/servers',
      iconName: 'contacts',
      pageName: 'Backend Servers'
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
        this.carrierService.init();
        // this.appService.init();

        this.router.navigate(['/favorite']);
    });
}

  closeApp() {
    appManager.close();
  }
}
