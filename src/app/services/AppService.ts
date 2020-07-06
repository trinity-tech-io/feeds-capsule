
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from "./../services/theme.service";
import { NgZone } from '@angular/core';
declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
@Injectable({
    providedIn: 'root'
})
export class AppService {
    constructor(private router: Router,
                public theme:ThemeService,
                private zone: NgZone) {
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
                  //this.setCurLang(params.data);
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
  
}
