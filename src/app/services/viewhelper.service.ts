import { Injectable } from '@angular/core';
import { PopoverController} from '@ionic/angular';
// import { Clipboard } from '@ionic-native/clipboard/ngx';
// import { Router } from '@angular/router';
// import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { TranslateService} from '@ngx-translate/core';
import { ModalController } from '@ionic/angular';
import { ViewerModalComponent } from 'ngx-ionic-image-viewer';
// import { MorenameComponent} from './../components/morename/morename.component';
// import { VideofullscreenComponent } from './../components/videofullscreen/videofullscreen.component';
import { PreviewqrcodeComponent }  from './../components/previewqrcode/previewqrcode.component';
// import { PaypromptComponent } from './../components/payprompt/payprompt.component';
// import { IntentService } from 'src/app/services/IntentService';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent }  from './../components/titlebar/titlebar.component';
import { MorenameComponent} from './../components/morename/morename.component';

@Injectable()
export class ViewHelper {
    public loading:any = null;
    constructor(
        // private popoverController:PopoverController,
        public modalController: ModalController,
        // private toastCtrl: ToastController,
        // private clipboard: Clipboard,
        // private inappBrowser: InAppBrowser,
        // private loadingCtrl: LoadingController,
        // private navCtrl: NavController,
        // private router: Router,
        private translate: TranslateService,
        // private intentService: IntentService,
        private titleBarService: TitleBarService,
        private popoverController:PopoverController,
        ) {
    }

    async openViewer(titleBar: TitleBarComponent, imgPath:string,newNameKey:string,oldNameKey:string,appService?:any,isOwer?:boolean) {
        this.titleBarService.setTitle(titleBar, this.translate.instant(newNameKey));
        this.titleBarService.setTitleBarBackKeyShown(titleBar, false);
        appService.hideright();
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
            this.titleBarService.setTitle(titleBar, this.translate.instant(oldNameKey));

            if(oldNameKey!='FeedsPage.tabTitle2'&&oldNameKey!='FeedsPage.tabTitle1'){
                this.titleBarService.setTitleBarBackKeyShown(titleBar, true);
            }
            if(isOwer){
                this.titleBarService.setIcon(titleBar, FeedsData.TitleBarIconSlot.INNER_RIGHT, "editChannel", "");
                // titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_RIGHT, {
                //     key: "editChannel",
                //     iconPath: TitleBarPlugin.BuiltInIcon.EDIT
                // });
            }
            appService.addright();
        })

        return await modal.present().then(()=>{
            const el:any = document.querySelector('ion-modal') || "";
            el.addEventListener('click', (event) => this.hide(modal), true);
        });
    }

    hide(modal:any){
        modal.dismiss();
    }

    async showPreviewQrcode(titleBar: TitleBarComponent, qrCodeString:string,newNameKey:string,oldNameKey:string,page:string,appService:any,isOwner?:boolean) {
        this.titleBarService.setTitle(titleBar, this.translate.instant(newNameKey));
        this.titleBarService.setTitleBarBackKeyShown(titleBar, false);

        appService.hideright();
        const modal = await this.modalController.create({
        component:PreviewqrcodeComponent,
        backdropDismiss:true,
        componentProps: {
            'qrCodeString':qrCodeString
        }
        });
        modal.onWillDismiss().then(()=>{
            this.titleBarService.setTitle(titleBar, this.translate.instant(oldNameKey));
            this.titleBarService.setTitleBarBackKeyShown(titleBar, true);
            if(page === "serverinfo"){
                //TODO
                this.titleBarService.setIcon(titleBar, FeedsData.TitleBarIconSlot.INNER_RIGHT, "editServer", "");
                // titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_RIGHT, {
                //     key: "editServer",
                //     iconPath: TitleBarPlugin.BuiltInIcon.EDIT
                // });
            }
            if(page === "feedinfo"){
                if(isOwner){
                    //TODO
                    this.titleBarService.setIcon(titleBar, FeedsData.TitleBarIconSlot.INNER_RIGHT, "editChannel", "");
                    // titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_RIGHT, {
                    //     key: "editChannel",
                    //     iconPath: TitleBarPlugin.BuiltInIcon.EDIT
                    // });
                }
            }
            appService.addright();
        });
        return await modal.present();
    }

    async createTip(name:string){
        let popover = await this.popoverController.create({
          mode:'ios',
          component:MorenameComponent,
          cssClass: 'genericPopup',
          componentProps: {
            "name":name
          }
        });
        popover.onWillDismiss().then(() => {
            popover = null;
        });
        return await popover.present();
    }

}
