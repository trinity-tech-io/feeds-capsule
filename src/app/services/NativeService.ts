import { Injectable } from '@angular/core';
import { ToastController, LoadingController, NavController } from '@ionic/angular';
import { Clipboard } from '@ionic-native/clipboard/ngx';
// import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

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
        private router: Router) {
            this.init();
    }

    init(){
        titleBarManager.addOnItemClickedListener((menuIcon)=>{
            if (menuIcon.key == "back") {
                this.navCtrl.back();
            }
          });
    }
    public info(message) {
        // Logger.info(message);
    }

    public toast(message: string = 'Operation completed', duration: number = 2000): void {
        this.toastCtrl.create({
            message,
            duration: 2000,
            position: 'bottom'
        }).then(toast => toast.present());
    }

    /*
    public toast_trans(message: string = '', duration: number = 2000): void {
        message = this.translate.instant(message);
        this.toastCtrl.create({
            message,
            duration: 2000,
            position: 'middle'
        }).then(toast => toast.present());
    }
    */

    public copyClipboard(text) {
        return this.clipboard.copy(text);
    }

    public go(page: any, options: any = {}) {
        this.router.navigate([page], { queryParams: options });
    }

    public pop() {
        this.navCtrl.pop();
    }

    public setRootRouter(router) {
        this.navCtrl.navigateRoot(router);
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
}
