
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from "./../services/theme.service";
import { NgZone} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events } from '@ionic/angular';
import { NativeService } from '../services/NativeService';
import { FeedService } from '../services/FeedService';
import { CarrierService } from '../services/CarrierService';
import { MenuController} from '@ionic/angular';
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
                private menu: MenuController,) {
    }

    scanAddress() {
        appManager.sendIntent("scanqrcode", {}, {}, (res) => {
            this.router.navigate(['/menu/servers/server-info', res.result.scannedContent, "", false]);
            // this.router.navigate(['/menu/servers/add-server',res.result.scannedContent]);
        }, (err: any) => {
            console.error(err);
        });
    }

    init() {
        appManager.setListener((msg) => {
          this.onMessageReceived(msg);
        });
        titleBarManager.addOnItemClickedListener((menuIcon)=>{
          if (menuIcon.key == "back") {
               this.native.pop();
          }else if(menuIcon.key == "more"){
               this.menu.open("menu");
          }
        });
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
        let signInData = this.feedService.getSignInData();
        if ( signInData == null || 
             signInData == undefined ||
             this.feedService.getCurrentTimeNum() > signInData.expiresTS ){
             this.native.setRootRouter('/signin');
          return ;
        }
      
        this.carrierService.init();
        this.native.setRootRouter('/tabs/home');
        this.feedService.updateSignInDataExpTime(signInData);
      
      }
  
}
