import { Injectable} from '@angular/core';
import { Router} from '@angular/router';
import { ThemeService } from "./../services/theme.service";
import { NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NativeService } from '../services/NativeService';
import { FeedService, SignInData } from '../services/FeedService';
import { CarrierService } from '../services/CarrierService';
import { MenuController,PopoverController } from '@ionic/angular';
import { MenuService } from 'src/app/services/MenuService';
import { PopupProvider } from 'src/app/services/popup';
import { IntentService } from 'src/app/services/IntentService';
import { LanguageService } from 'src/app/services/language.service';
// import { TitleBarService } from 'src/app/services/TitleBarService';
// import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

let managerService: any;

@Injectable({
    providedIn: 'root'
})
export class AppService {
    // @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
    // @ViewChild(IonRouterOutlet,{static:true}) ionRouterOutlet: IonRouterOutlet;
    public popover:any = null;
    constructor(
      private router: Router,
      public theme: ThemeService,
      private zone: NgZone,
      private translate: TranslateService,
      private native: NativeService,
      private feedService: FeedService,
      private carrierService: CarrierService,
      private menu: MenuController,
      public popupProvider:PopupProvider,
      private popoverController: PopoverController,
      private menuService: MenuService,
      private intentService: IntentService,
      private languageService:LanguageService
      // private titleBarService: TitleBarService
    ) {
    }

    init() {
      // this.intentService.addIntentListener((msg: IntentPlugin.ReceivedIntent) => {
      //   this.onMessageReceived(msg);
      // });

      // titleBarManager.addOnItemClickedListener((menuIcon)=>{
      //   this.native.hideLoading();
      //   if (menuIcon.key == "back") {
      //       this.handleBack();
      //   } else if (menuIcon.key == "more"){
            // this.events.publish(FeedsEvent.PublishType.openRightMenu);
            // this.menuService.hideActionSheet();
            // let value =  this.popoverController.getTop()["__zone_symbol__value"] || "";
            // if(value!=""){
            //   this.popoverController.dismiss();
            // }
            // this.menu.open("menu");
      //   } else if (menuIcon.key === 'editChannel') {
      //     this.event.publish(FeedsEvent.PublishType.editChannel);
      //   } else if (menuIcon.key === 'editServer') {
      //     this.event.publish(FeedsEvent.PublishType.editServer);
      //   }else if(menuIcon.key === 'editImages'){
      //     this.events.publish(FeedsEvent.PublishType.editImages);
      //   }
      // });
    }

    onReceiveIntent = (ret: IntentPlugin.ReceivedIntent) => {
      //console.log("Intent received", ret, JSON.stringify(ret));

      switch (ret.action) {
        case "addsource":
          //console.log('addsource intent', ret);
          this.zone.run(async () => {
            this.native.getNavCtrl().navigateForward(
              ['/menu/servers/server-info', ret.params.source, "0", false]
            );

         /*    this.events.publish("intent:addsource", ret.params.source);
            this.native.navigateForward(['menu/servers/add-server'], ""); */

           /*  let props: NavigationExtras = {
              queryParams: {
                source: ret.params.source
              }
            }

            this.router.navigate(['menu/servers/add-server'], props);
          */
          });
          break;
      }
    }

    handleBack(){
      let isFirstBindFeedService = localStorage.getItem('org.elastos.dapp.feeds.isFirstBindFeedService') || "";
      let bindingServer = this.feedService.getBindingServer() || null;
      if(
        (this.router.url.indexOf('/bindservice/scanqrcode') > -1 && isFirstBindFeedService==="" && bindingServer===null )||
        (this.router.url.indexOf('/bindservice/learnpublisheraccount') > -1 && isFirstBindFeedService==="" && bindingServer===null) ||
        (this.router.url.indexOf('/bindservice/startbinding') > -1 && isFirstBindFeedService==="" && bindingServer===null )||
        this.router.url.indexOf('/bindservice/importdid') > -1 ||
        this.router.url.indexOf('/bindservice/publishdid') > -1 ||
        this.router.url.indexOf('/bindservice/issuecredential') > -1
      ){
        this.createDialog();
      } else if (this.router.url === '/menu/servers') {
         this.initTab();
      } else {
        this.native.pop();
      }
    }



    onMessageReceived(msg: IntentPlugin.ReceivedIntent) {
      console.log("Received intent ",msg);
      var params: any = msg.params;
      if (typeof (params) == "string") {
        try {
            params = JSON.parse(params);
        } catch (e) {
            //console.log('Params are not JSON format: ', params);
        }
      }

      if (msg.action === "currentLocaleChanged") {
        this.zone.run(()=>{
            this.setCurLang(params.data);
        });
      }

      //TO be check
      if(msg.action === 'preferenceChanged' && params.data.key === "ui.darkmode") {
        this.zone.run(() => {
          this.theme.setTheme(params.data.value);
        });
      }
    }

    initTranslateConfig() {
      this.languageService.initTranslateConfig();
    }

    setCurLang(currentLang: string) {
      this.languageService.setCurLang(currentLang);
    }

    initializeApp() {
      this.feedService.initSignInDataAsync((signInData) => {
        this.feedService.loadData().then(()=>{
          this.feedService.updateVersionData();
          this.initData(signInData);
        })
      });
    }

    initData(signInData: SignInData, ){
      if (signInData == null ||
        signInData == undefined ||
        this.feedService.getCurrentTimeNum() > signInData.expiresTS ){
        this.native.setRootRouter(['/signin']);
        return ;
      }

      this.intentService.addIntentListener((intent: IntentPlugin.ReceivedIntent) =>{
        console.log("Receive intent ",intent)
        this.onMessageReceived(intent);
        this.onReceiveIntent(intent);
      });

      this.carrierService.init(signInData.did);
      this.native.setRootRouter(['/tabs/home']);
      this.feedService.updateSignInDataExpTime(signInData);
    }

    async createDialog(){

      if(this.popover != null){
           return;
      }
      this.popover = this.popupProvider.ionicConfirm(
        this,
        "SearchPage.confirmTitle",
        "common.des2",
        this.cancel,
        this.confirm,
        "./assets/images/tskth.svg"
      );
    }


    cancel(that:any){
      if(this.popover!=null){
         this.popover.dismiss();
         that.popover = null;
      }
    }

    confirm(that:any){
      if(this.popover!=null){
        this.popover.dismiss();
        that.popover = null;
      }
      let isFirstBindFeedService = localStorage.getItem('org.elastos.dapp.feeds.isFirstBindFeedService') || "";
      if(isFirstBindFeedService === ""){
          localStorage.setItem('org.elastos.dapp.feeds.isFirstBindFeedService',"1");
      }
      that.native.setRootRouter(['/tabs/home']);
    }

    initTab(){
      let currentTab = this.feedService.getCurTab();
        switch(currentTab){
          case "home":
            this.native.setRootRouter(['/tabs/home']);
            break;
        case "profile":
          this.native.setRootRouter(['/tabs/profile']);
            break;
        case "notification":
          this.native.setRootRouter(['/tabs/notification']);
            break;
        case "search":
          this.native.setRootRouter(['/tabs/search']);
            break;
        }
    }
}
