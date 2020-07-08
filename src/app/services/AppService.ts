
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from "./../services/theme.service";
import { NgZone} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events } from '@ionic/angular';
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
                private event: Events) {
    }

    scanAddress() {
        appManager.sendIntent("scanqrcode", {}, {}, (res) => {
            this.router.navigate(['/menu/servers/server-info', res.result.scannedContent,""]);
            // this.router.navigate(['/menu/servers/add-server',res.result.scannedContent]);
        }, (err: any) => {
            console.error(err);
        });
    }

    init() {
        this.initTranslateConfig();
        appManager.setListener((msg) => {
          this.onMessageReceived(msg);
        });

        titleBarManager.setForegroundMode(TitleBarPlugin.TitleBarForegroundMode.LIGHT);
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
  
}
