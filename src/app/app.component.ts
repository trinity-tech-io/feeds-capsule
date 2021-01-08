import { Component} from '@angular/core';
import { Platform, ModalController, Events} from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { FeedService, Avatar } from './services/FeedService';
import { AppService } from './services/AppService';
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService} from 'src/app/services/NativeService';
import { SplashscreenPage } from './pages/splashscreen/splashscreen.page';
import { UtilService } from 'src/app/services/utilService';
import { StorageService } from './services/StorageService';
import { PopupProvider } from 'src/app/services/popup';
@Component({
  selector: 'my-app',
  templateUrl: 'app.html',
  styleUrls: [ 'app.scss' ]
})

export class MyApp {
  public didString = null;
  public name: string = "";
  public avatar: Avatar = null;
  public wName: string = "";
  public popover:any = null;
  public sService:any =null;
  constructor(
    private modalCtrl: ModalController,
    private events: Events,
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private feedService: FeedService,
    private appService: AppService,
    public theme:ThemeService,
    public native:NativeService,
    public storageService:StorageService,
    public popupProvider:PopupProvider
  ) {
      this.sService =storageService;
      this.initializeApp();
      this.initProfileData();
      this.events.subscribe("feeds:signinSuccess",()=>{
        this.initProfileData();
      })
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.initSetting();
      this.initFeedPublicStatus();
      this.native.networkInfoInit();
      this.native.addNetworkListener(()=>{
        this.events.publish('feeds:networkStatusChanged', 1);
      },()=>{
        this.events.publish('feeds:networkStatusChanged', 0);
      });
        this.initDisclaimer();
    });
  }

  initFeedPublicStatus(){
    this.feedService.getData("feeds.feedPublicStatus").then((feedPublicStatus)=>{
      if(feedPublicStatus === null){
        this.feedService.setFeedPublicStatus({});
        return;
      }
      this.feedService.setFeedPublicStatus(JSON.parse(feedPublicStatus));
    }).catch((err)=>{

    });
  }

  initSetting(){

    this.feedService.getData("feeds.developerMode").then((status)=>{
      let dstatus = status;
      this.feedService.setDeveloperMode(dstatus);
    }).catch((err)=>{

    });


    this.feedService.getData("feeds.hideDeletedPosts").then((status)=>{
      if(status === null){
        this.feedService.setHideDeletedPosts(false);
        return;
      }
      this.feedService.setHideDeletedPosts(status);
    }).catch((err)=>{

    });

    this.feedService.getData("feeds.hideDeletedComments").then((status)=>{
      if(status === null){
        this.feedService.setHideDeletedComments(false);
        return;
      }
      this.feedService.setHideDeletedComments(status);
    }).catch((err)=>{

    });

    // this.feedService.getData("feeds.hideOfflineFeeds").then((status)=>{
    //   if(status === null){
    //     this.feedService.setHideOfflineFeeds(true);
    //     return;
    //   }
    //   this.feedService.setHideOfflineFeeds(status);
    // }).catch((err)=>{

    // });
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

  cancel(that:any){
    if(this.popover!=null){
       this.popover.dismiss();
    }
  }



  confirm(that:any){
    if(this.popover!=null){
       this.popover.dismiss();
    }

    that.clearData();

  }

  clearData(){
    this.storageService.remove("signInData").then(()=>{
      this.events.publish("feeds:clearHomeEvent");
      this.feedService.resetConnectionStatus();
      this.feedService.destroyCarrier();
      this.appService.hideright();
      this.native.setRootRouter('signin');
      this.native.toast("app.des");
    }).catch((err)=>{
    })
  }

  signout(){
    this.popover = this.popupProvider.ionicConfirm(
      this,
      // "ConfirmdialogComponent.signoutTitle",
      "",
      "ConfirmdialogComponent.signoutMessage",
      this.cancel,
      this.confirm,
      'tskth.svg'
    );
  }

  initProfileData(){
    this.feedService.initSignInDataAsync((signInData)=>{
      if (signInData == null || signInData == undefined)
        return ;
      this.didString = signInData.did || "";
      this.wName = signInData.nickname || signInData.name || "";
      this.avatar = signInData.avatar || null;
      this.name = UtilService.moreNanme(this.wName,15);
    },(error)=>{
    });
  }

  pressName(){
    let mName = this.wName||"";
    if(mName != "" && mName.length>15){
      this.native.createTip(mName);
    }
  }

  handleImages(){
    if(this.avatar === null){
       return 'assets/images/default-contact.svg';
    }
    let contentType = this.avatar['contentType'] || this.avatar['content-type']|| "";
    let cdata = this.avatar['data'] || "";
    if(contentType === "" || cdata === ""){
      return 'assets/images/default-contact.svg';
    }

    return 'data:'+this.avatar.contentType+';base64,'+this.avatar.data;
  }

  settings(){
    this.native.navigateForward('settings',"");
  }
}
