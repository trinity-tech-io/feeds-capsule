import { Component } from '@angular/core';
import { Platform, ModalController, Events} from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { FeedService } from './services/FeedService';
import { AppService } from './services/AppService';
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService} from 'src/app/services/NativeService';
import { SplashscreenPage } from './pages/splashscreen/splashscreen.page';
import { UtilService } from 'src/app/services/utilService';


@Component({
  selector: 'my-app',
  templateUrl: 'app.html',
  styleUrls: [ 'app.scss' ]
})

export class MyApp {
  public didString = null;
  public name:string = "";
  public avatar:string = "";
  public wName:string = "";
  constructor(
    private modalCtrl: ModalController,
    private events: Events,
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private feedService: FeedService,
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
        this.initDisclaimer();
    });
  }

  initDisclaimer(){
  
    //localStorage.setItem('org.elastos.dapp.feeds.disclaimer',"");
    //localStorage.setItem('org.elastos.dapp.feeds.first',""); 

    this.statusBar.styleDefault();
    this.splashScreen.hide();
    this.appService.initTranslateConfig();
    this.appService.init();

    let isDisclaimer = localStorage.getItem('org.elastos.dapp.feeds.disclaimer') || "";
    if(isDisclaimer === ""){
       this.native.setRootRouter('disclaimer');
       return;
    }

    let isFirst = localStorage.getItem('org.elastos.dapp.feeds.first') || "";
    if(isFirst === ""){
      localStorage.setItem('org.elastos.dapp.feeds.first',"11");
      this.splash();
      return;
    }

    this.appService.addright();
    this.appService.initializeApp();
  }

  async splash() {
    const splash = await this.modalCtrl.create({component: SplashscreenPage});
    return await splash.present();
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

  donation(){
    this.native.navigateForward('/menu/donation',"");
  }

  initProfileData(){
    this.feedService.initSignInDataAsync((signInData)=>{
      if (signInData == null || signInData == undefined)
        return ;

      this.didString = signInData.did || "";
      this.wName = signInData.name || "";
      this.name = UtilService.moreNanme(signInData.name);
    },(error)=>{
    });
  }

  pressName(){
    let mName = this.name||"";
    if(mName != "" && mName.length>15){
      this.native.createTip(mName);
    }
  }
}
