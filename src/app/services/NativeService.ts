import { Injectable } from '@angular/core';
import { ToastController, LoadingController, NavController} from '@ionic/angular';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { Router } from '@angular/router';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { TranslateService} from '@ngx-translate/core';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;


@Injectable()
export class NativeService {
    private loadingIsOpen = false;

    constructor(
        private toastCtrl: ToastController,
        private clipboard: Clipboard,
        private inappBrowser: InAppBrowser,
        private loadingCtrl: LoadingController,
        private navCtrl: NavController,
        private router: Router,
        private translate: TranslateService) {
    }

    public toast(message: string = 'Operation completed', duration: number = 2000): void {
        this.toastCtrl.create({
            mode: 'ios',
            color: 'success',
            message,
            duration: 2000,
            position: 'top'
        }).then(toast => toast.present());
    }

    public toast_trans(_message: string = '', duration: number = 2000): void {
        _message = this.translate.instant(_message);
        this.toastCtrl.create({
            mode: 'ios',
            color: 'success',
            message: _message,
            duration: duration,
            position: 'top'
        }).then(toast => toast.present());
    }

  
    public copyClipboard(text) {
        return this.clipboard.copy(text);
    }

    public go(page: any, options: any = {}) {
        this.navCtrl.navigateForward(page,{ queryParams: options });
    }

    public pop() {
        this.navCtrl.pop();
    }


    public setRootRouter(router) {
        this.router.navigate(router);
    }

    public clone(myObj) {
        if (typeof (myObj) !== 'object' || myObj == null) {
            return myObj;
        }

        let myNewObj;

        if (myObj instanceof (Array)) {
            myNewObj = new Array();
        } else {
            myNewObj = new Object();
        }

        // tslint:disable-next-line: forin
        for (const i in myObj) {
            myNewObj[i] = this.clone(myObj[i]);
        }

        return myNewObj;
    }

    public async showLoading(content: string = '') {
        if (!this.loadingIsOpen) {
            this.loadingIsOpen = true;
            const loading = await this.loadingCtrl.create({
                message: content,
                duration: 10000//30s
            });
            return await loading.present();
        }
    };

    public hideLoading(): void {
        if (this.loadingIsOpen) {
            this.loadingCtrl.dismiss();
            this.loadingIsOpen = false;
        }
    };

    public getTimestamp() {
        return new Date().getTime().toString();
    }

    public openUrl(url: string) {
        const target = "_system";
        const options = "location=no";
        this.inappBrowser.create(url, target, options);
    }

    setTitleBarBackKeyShown(show: boolean) {
        if (show) {
            titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_LEFT, {
                key: "back",
                iconPath: TitleBarPlugin.BuiltInIcon.BACK
            });
        }
        else {
            titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_LEFT, null);
        }
      }

      getNavCtrl(){
          return this.navCtrl;
      }

      navigateForward(router:any, options:any):Promise<boolean>{ 
          let option =options || ""; 
          if(option!=""){
           return this.navCtrl.navigateForward(router,options);
          }else{
            return this.navCtrl.navigateForward(router);
          }
          
      }

      getRouter(){
          return this.router;
      }

      iGetInnerText(testStr:string) {
        var resultStr = testStr.replace(/\s+/g,""); //去掉空格
        if(resultStr!=''){
            resultStr = testStr.replace(/[\r\n]/g, ""); //去掉回车换行
        }
        return resultStr;
    }
}
