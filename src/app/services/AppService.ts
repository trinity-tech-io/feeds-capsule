import { Injectable} from '@angular/core';
import { Router, NavigationExtras} from '@angular/router';
import { ThemeService } from "./../services/theme.service";
import { NgZone} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events } from '@ionic/angular';
import { NativeService } from '../services/NativeService';
import { FeedService, SignInData } from '../services/FeedService';
import { CarrierService } from '../services/CarrierService';
import { BackhomeComponent} from '../components/backhome/backhome.component';
import { MenuController,PopoverController } from '@ionic/angular';
import { MenuService } from 'src/app/services/MenuService';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

let managerService: any;

@Injectable({
    providedIn: 'root'
})
export class AppService {

    // @ViewChild(IonRouterOutlet,{static:true}) ionRouterOutlet: IonRouterOutlet;

    constructor(
      private router: Router,
      public theme: ThemeService,
      private zone: NgZone,
      private translate: TranslateService,
      private event: Events,
      private native: NativeService,
      private feedService: FeedService,
      private carrierService: CarrierService,
      private menu: MenuController,
      private popoverController: PopoverController,
      private menuService: MenuService,
      private events: Events
    ) {
    }

    init() {
      appManager.setListener((msg) => {
        this.onMessageReceived(msg);
      });

      titleBarManager.addOnItemClickedListener((menuIcon)=>{
        this.native.hideLoading();
        if (menuIcon.key == "back") {
            this.handleBack();
        } else if (menuIcon.key == "more"){
            this.menuService.hideActionSheet();
            let value =  this.popoverController.getTop()["__zone_symbol__value"] || "";
            if(value!=""){
              this.popoverController.dismiss();
            }
            this.menu.open("menu");
        } else if (menuIcon.key === 'editChannel') {
          this.event.publish("feeds:editChannel");
        } else if (menuIcon.key === 'editServer') {
          this.event.publish("feeds:editServer");
        }
      });
    }

    onReceiveIntent = (ret) => {
      console.log("Intent received", ret, JSON.stringify(ret));

      switch (ret.action) {
        case "addsource":
          console.log('addsource intent', ret);
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
      if(
        this.router.url.indexOf('/bindservice/importdid/') >-1 ||
        this.router.url.indexOf('/bindservice/publishdid/') >-1 ||
        this.router.url.indexOf('/bindservice/issuecredential/') >-1 ||
        this.router.url.indexOf('/bindservice/importdid/') >-1
      ) {
        this.createDialog();
      } else if (this.router.url === '/menu/servers') {
         this.initTab();
      } else {
        this.native.pop();
      }
    }

    addright(){
      titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.OUTER_RIGHT, {
        key: "more",
        iconPath: "assets/icon/more_menu.ico"
      });
    }

    hideright(){
      titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.OUTER_RIGHT,null);
    }

    onMessageReceived(msg: AppManagerPlugin.ReceivedMessage) {
        var params: any = msg.message;
        if (typeof (params) == "string") {
          try {
              params = JSON.parse(params);
          } catch (e) {
              console.log('Params are not JSON format: ', params);
          }
        }
        switch (msg.type) {
          case AppManagerPlugin.MessageType.IN_REFRESH:
            if (params.action === "currentLocaleChanged") {
                this.zone.run(()=>{
                   this.setCurLang(params.data);
                });
            }
            if(params.action === 'preferenceChanged' && params.data.key === "ui.darkmode") {
              this.zone.run(() => {
                this.theme.setTheme(params.data.value);
              });
            }
            break;
        }
      }

    initTranslateConfig() {
      // 参数类型为数组，数组元素为本地语言json配置文件名
      this.translate.addLangs(["zh", "en", "fr"]);
      // 设置默认语言
      appManager.getLocale((defaultLang: string, currentLang: string, systemLang: string)=>{
        this.setCurLang(currentLang);
      });
    }

    setCurLang(currentLang: string) {
      if (currentLang != 'zh' && currentLang != 'fr') {
        currentLang = "en";
      }
      this.feedService.setCurrentLang(currentLang);
      this.translate.setDefaultLang(currentLang);
      this.translate.use(currentLang);
      this.event.publish("feeds:updateTitle");
    }

    initializeApp() {
      let isLoadPost = false;
      let isLoadChannel = false;
      let isNeedResave = localStorage.getItem('org.elastos.dapp.feeds.resavepost') || "";
      this.feedService.updateVersionData();
      this.feedService.initSignInDataAsync((signInData) => {
        this.feedService.loadPostData().then(() => {
          if(isNeedResave === ""){
            localStorage.setItem('org.elastos.dapp.feeds.resavepost',"11");
            this.feedService.reSavePostMap();
          }
          isLoadPost = true;
          if(isLoadPost && isLoadChannel)
            this.initData(signInData);
        });

        this.feedService.loadChannelData().then(()=>{
          isLoadChannel = true;
          if(isLoadPost && isLoadChannel)
            this.initData(signInData);
        });
      });
    }

    initData(signInData: SignInData){
      if (signInData == null || 
        signInData == undefined ||
        this.feedService.getCurrentTimeNum() > signInData.expiresTS ){
        this.native.setRootRouter(['/signin']);
        return ;
      }

      appManager.setIntentListener((intent: AppManagerPlugin.ReceivedIntent) => {
        console.log('Incoming intent', intent);
        this.onReceiveIntent(intent);
      });
      this.addright();
      this.carrierService.init();
      this.native.setRootRouter(['/tabs/home']);
      this.feedService.updateSignInDataExpTime(signInData);
    }

    async createDialog(){
      let popover = await this.popoverController.create({
        mode: 'ios',
        cssClass: 'genericPopup',
        component: BackhomeComponent,
      });
      popover.onWillDismiss().then(() => {
          popover = null;
      });
      
      return await popover.present();
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
