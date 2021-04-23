import { Component, ViewChild } from '@angular/core';
import { Platform, ModalController, PopoverController, MenuController} from '@ionic/angular';
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
import { LogUtils } from 'src/app/services/LogUtils';
import { Events} from 'src/app/services/events.service';

enum LogLevel {
  NONE,
  ERROR,
  WARN,
  INFO,
  DEBUG,
}
@Component({
  selector: 'my-app',
  templateUrl: 'app.html',
  styleUrls: [ 'app.scss' ]
})

export class MyApp {
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
    public popupProvider:PopupProvider,
    private popoverController:PopoverController,
    private logUtils: LogUtils,
    private menuController:MenuController
  ) {
      this.initializeApp();
      this.initProfileData();
      this.events.subscribe(FeedsEvent.PublishType.signinSuccess,()=>{
        this.initProfileData();
      })
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.initSetting();
      this.initFeedPublicStatus();
      this.initCurrentFeed();
      this.initDiscoverfeeds();
      this.native.networkInfoInit();
      this.native.addNetworkListener(()=>{
        this.events.publish(FeedsEvent.PublishType.networkStatusChanged, 1);
      },()=>{
        this.events.publish(FeedsEvent.PublishType.networkStatusChanged, 0);
      });
        this.initDisclaimer();
    });
  }

  initDiscoverfeeds(){
    this.feedService.getData("feed:discoverfeeds").then((discoverfeeds)=>{
      if(discoverfeeds === null){
        this.feedService.setDiscoverfeeds([]);
        return;
      }
      this.feedService.setDiscoverfeeds(JSON.parse(discoverfeeds));
    }).catch((err)=>{

    });
  }

  initCurrentFeed(){
    this.feedService.getData("feeds.currentFeed").then((currentFeed)=>{
      if(currentFeed === null){
        this.feedService.setCurrentFeed(null);
        return;
      }
      this.feedService.setCurrentFeed(JSON.parse(currentFeed));
    }).catch((err)=>{

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
      if(status === null){
        this.feedService.setDeveloperMode(false);
        this.logUtils.setLogLevel(LogLevel.WARN);
        return;
      }
      if(status){
        this.logUtils.setLogLevel(LogLevel.DEBUG);
      }else{
        this.logUtils.setLogLevel(LogLevel.WARN);
      }
      this.feedService.setDeveloperMode(status);

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

    // let isFirst = localStorage.getItem('org.elastos.dapp.feeds.first') || "";
    // if(isFirst === ""){
      localStorage.setItem('org.elastos.dapp.feeds.first',"11");
      // this.splash();
      // return;
    // }
    this.appService.initializeApp();
  }

  async splash() {
    const splash = await this.modalCtrl.create({component: SplashscreenPage});
    return await splash.present();
  }

  goToFeedSource(){
    this.handleJump();
  }

  // goToDev(){
  //   this.native.navigateForward('menu/develop',"");
  // }

  about(){
     this.native.navigateForward('/menu/about',"");
  }

  checkIsShowDonation(){
    let isShowButton = true;
    if (this.platform.is('ios'))
      isShowButton = false;

    return isShowButton;
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
    this.feedService.signOut().then(()=>{
      this.events.publish(FeedsEvent.PublishType.clearHomeEvent);
      this.native.setRootRouter('signin');
      this.native.toast("app.des");
    }).catch((err)=>{
      //TODO
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
      this.wName = signInData.nickname || signInData.name || "";
      this.avatar = signInData.avatar || null;
      this.name = UtilService.moreNanme(this.wName,15);
    },(error)=>{
    });
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

    return 'data:'+contentType+';base64,'+this.avatar.data;
  }

  settings(){
    this.native.navigateForward('settings',"");
  }

  handleJump(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }
    let bindingServer = this.feedService.getBindingServer() || null;
    if(bindingServer === null){
        this.native.navigateForward(['/bindservice/scanqrcode'],"");
    }else{
        this.native.navigateForward(['/menu/servers/server-info'],"");
    }
  }

  ionViewWillLeave(){
    let value =  this.popoverController.getTop()["__zone_symbol__value"] || "";
    if(value!=""){
      this.popoverController.dismiss();
      this.popover = null;
    }
  }

  profiledetail(){
    this.menuController.close();
    this.native.navigateForward('/menu/profiledetail',"");
  }

}
