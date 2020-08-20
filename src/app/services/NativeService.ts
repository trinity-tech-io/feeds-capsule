import { Injectable } from '@angular/core';
import { ToastController, LoadingController, NavController} from '@ionic/angular';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { Router } from '@angular/router';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { TranslateService} from '@ngx-translate/core';
import { ModalController } from '@ionic/angular';
import { ViewerModalComponent } from 'ngx-ionic-image-viewer';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Injectable()
export class NativeService {
    private loadingIsOpen = false;

    constructor(
        public modalController: ModalController,
        private toastCtrl: ToastController,
        private clipboard: Clipboard,
        private inappBrowser: InAppBrowser,
        private loadingCtrl: LoadingController,
        private navCtrl: NavController,
        private router: Router,
        private translate: TranslateService) {
    }

    public toast(message: string = 'Operation completed', duration: number = 2000): void {
        message = this.translate.instant(message);
        this.toastCtrl.create({
            mode: 'ios',
            color: 'success',
            message,
            duration: 2000,
            position: 'top'
        }).then(toast => toast.present());
    }

    public toastWarn(message: string = 'Operation completed', duration: number = 2000): void {
        message = this.translate.instant(message);
        this.toastCtrl.create({
            mode: 'ios',
            color: 'warning',
            message,
            duration: 2000,
            position: 'top'
        }).then(toast => toast.present());
    }

    public toastdanger(message: string = 'Operation completed', duration: number = 2000): void {
        message = this.translate.instant(message);
        this.toastCtrl.create({
            mode: 'ios',
            color: 'danger',
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

    public async showLoading(content: string = '', durationTime: number = 30000) {
        if (!this.loadingIsOpen) {
            this.loadingIsOpen = true;
            const loading = await this.loadingCtrl.create({
                message: content,
                duration: durationTime
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

    networkInfoInit() {
        navigator.connection.Initialize();
    }

    addNetworkListener(offline:()=>void, online:()=>void){
        document.addEventListener("offline", ()=>{
            offline();
        }, false);
        document.addEventListener("online", ()=>{
            online();
        }, false);
    }

    async openViewer(imgPath:string) {

        this.setTitleBarBackKeyShown(false);
        const modal = await this.modalController.create({
          component: ViewerModalComponent,
          componentProps: {
            src: imgPath,
            slideOptions:{ centeredSlides: true, passiveListeners:true, zoom: { enabled: true } }
          },
          cssClass: 'ion-img-viewer',
          keyboardClose:true,
          showBackdrop:true,
        });


        modal.onWillDismiss().then(()=>{
             document.removeEventListener('click',(event)=> this.hide(modal),false);
            this.setTitleBarBackKeyShown(true);
        })
    
        return await modal.present().then(()=>{
                const el = document.querySelector('ion-modal');
                el.addEventListener('click', (event) => this.hide(modal), true);
          
        });
      }

      hide(modal:any){
        modal.dismiss();
      }

      parseJSON(str:string): any{
        if (typeof(str)== 'string') {
            try {
                var obj = JSON.parse(str);
                if (typeof obj == 'object') {
                    return obj;
                } else {
                    return str;
                }
            } catch (e) {
                return str;
            }
        }else{
            return str;
        }
    }
}
