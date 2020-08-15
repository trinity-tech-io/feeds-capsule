
import { Injectable, ViewChild } from '@angular/core';
import { Router} from '@angular/router';
//import { IonRouterOutlet } from '@ionic/angular';
import { ThemeService } from "./../services/theme.service";
import { NgZone} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events } from '@ionic/angular';
import { NativeService } from '../services/NativeService';
import { FeedService } from '../services/FeedService';
import { CarrierService } from '../services/CarrierService';
import { MenuController} from '@ionic/angular';
import { PopupProvider } from '../services/popup';
declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Injectable({
    providedIn: 'root'
})
export class AppService {
    constructor(private router: Router,
                public theme:ThemeService,
                private zone: NgZone,
                private translate:TranslateService,
                private event: Events,
                private native:NativeService,
                private feedService: FeedService,
                private carrierService:CarrierService,
                private menu: MenuController,
                private popupProvider:PopupProvider) {
    }

    init() {
        appManager.setListener((msg) => {
          this.onMessageReceived(msg);
        });
        titleBarManager.addOnItemClickedListener((menuIcon)=>{
          if (menuIcon.key == "back") {
              this.handleBack();
          }else if(menuIcon.key == "more"){
            if(this.router.url.indexOf("/signin")>-1){
              this.native.toast_trans("common.pleasesigninfirst");
            }else{
            this.menu.open("menu");
            }
          }
        });
    }

    handleBack(){
      if(this.router.url.indexOf('/bindservice/importdid/')>-1 ||
         this.router.url.indexOf('/bindservice/publishdid/')>-1 ||
         this.router.url.indexOf('/bindservice/issuecredential/')>-1 ||
         this.router.url.indexOf('/bindservice/importdid/')>-1){
        this.popupProvider.ionicConfirm("common.prompt","common.des2").then(()=>{
          this.native.setRootRouter(['/tabs/home']);
        });
    }else{
      this.native.pop();
    }
    }

    addright(){
      titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.OUTER_RIGHT, {
        key: "more",
        iconPath: "assets/icon/more_menu.ico"
      });
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
        console.log("Setting current lang to "+currentLang);
        this.translate.setDefaultLang(currentLang);
        this.translate.use(currentLang);
        this.event.publish("feeds:updateTitle");
      }

      initializeApp() {
        this.feedService.initSignInDataAsync((signInData)=>{
          this.feedService.loadPostData().then(()=>{
            let isNeedResave = localStorage.getItem('org.elastos.dapp.feeds.resavepost') || "";
            if(isNeedResave === ""){
              localStorage.setItem('org.elastos.dapp.feeds.resavepost',"11");
              this.feedService.reSavePostMap();
            }

            if (signInData == null || 
              signInData == undefined ||
              this.feedService.getCurrentTimeNum() > signInData.expiresTS ){
              this.native.setRootRouter(['/signin']);
              return ;
            }
          
            this.carrierService.init();
            this.native.setRootRouter(['/tabs/home']);
            this.feedService.updateSignInDataExpTime(signInData);
          });
        });

      
      }
  
}
