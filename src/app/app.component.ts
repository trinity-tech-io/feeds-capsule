import { Component } from '@angular/core';
import { Platform, ModalController, Events } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { FeedService } from './services/FeedService';
import { SplashscreenPage } from './pages/splashscreen/splashscreen.page';
import { AppService } from './services/AppService';
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService} from 'src/app/services/NativeService';
import { UtilService } from 'src/app/services/utilService';

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
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private feedService: FeedService,
    private modalCtrl: ModalController,
    private appService: AppService,
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
        this.native.networkInfoInit()
        this.native.addNetworkListener(()=>{
          this.events.publish('feeds:networkStatusChanged', 1);
        },()=>{
          this.events.publish('feeds:networkStatusChanged', 0);
        });
        this.statusBar.styleDefault();
        this.splashScreen.hide();
        //localStorage.setItem('org.elastos.dapp.feeds.first',"");
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
    this.native.navigateForward('/menu/profiledetail',"");
  }

  goToFeedSource(){
    this.native.navigateForward('/menu/servers',"");
  }

  // goToDev(){
  //   this.native.navigateForward('menu/develop',"");
  // }

  about(){
     this.native.navigateForward('/menu/about',"");
  }

  async splash() {
    const splash = await this.modalCtrl.create({component: SplashscreenPage});
    return await splash.present();
  }

  initProfileData(){
    this.feedService.initSignInDataAsync((signInData)=>{
      if (signInData == null || signInData == undefined)
        return ;

      this.didString = signInData.did;
      this.name = UtilService.moreNanme(signInData.name);
    },(error)=>{
    });
  }
}
