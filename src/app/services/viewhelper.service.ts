import { Injectable } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ModalController } from '@ionic/angular';
import { ViewerModalComponent } from 'ngx-ionic-image-viewer';
import { PreviewqrcodeComponent } from './../components/previewqrcode/previewqrcode.component';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from './../components/titlebar/titlebar.component';
import { MorenameComponent } from './../components/morename/morename.component';
import { PaypromptComponent } from './../components/payprompt/payprompt.component';
import { NftdialogComponent } from './../components/nftdialog/nftdialog.component';
import { GuidedialogComponent } from './../components/guidedialog/guidedialog.component';
import { Logger } from './logger';

const TAG: string = 'ViewHelper';
@Injectable()
export class ViewHelper {
  public loading: any = null;
  constructor(
    public modalController: ModalController,
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private popoverController: PopoverController,
  ) {}

  async openViewer(
    titleBar: TitleBarComponent,
    imgPath: string,
    newNameKey: string,
    oldNameKey: string,
    appService?: any,
    isOwer?: boolean,
  ) {
    this.titleBarService.setTitle(titleBar, this.translate.instant(newNameKey));
    this.titleBarService.setTitleBarBackKeyShown(titleBar, false);
    this.titleBarService.hideRight(titleBar);
    const modal = await this.modalController.create({
      component: ViewerModalComponent,
      componentProps: {
        src: imgPath,
        slideOptions: {
          centeredSlides: true,
          passiveListeners: true,
          zoom: { enabled: true },
        },
      },
      cssClass: 'ion-img-viewer',
      keyboardClose: true,
      showBackdrop: true,
    });

    modal.onWillDismiss().then(() => {
      document.removeEventListener('click', event => this.hide(modal), false);
      this.titleBarService.setTitle(
        titleBar,
        this.translate.instant(oldNameKey),
      );

      if (
        oldNameKey != 'FeedsPage.tabTitle2' &&
        oldNameKey != 'FeedsPage.tabTitle1'
      ) {
        this.titleBarService.setTitleBarBackKeyShown(titleBar, true);
      }
      if (isOwer) {
        this.titleBarService.setTitleBarEditChannel(titleBar);
      }
      this.titleBarService.addRight(titleBar);
    });

    return await modal.present().then(() => {
      const el: any = document.querySelector('ion-modal') || '';
      el.addEventListener('click', event => this.hide(modal), true);
    });
  }

  hide(modal: any) {
    modal.dismiss();
  }

  async showPreviewQrcode(
    titleBar: TitleBarComponent,
    qrCodeString: string,
    newNameKey: string,
    oldNameKey: string,
    page: string,
    appService: any,
    isOwner?: boolean,
  ) {
    this.titleBarService.setTitle(titleBar, this.translate.instant(newNameKey));
    this.titleBarService.setTitleBarBackKeyShown(titleBar, false);

    this.titleBarService.hideRight(titleBar);
    const modal = await this.modalController.create({
      component: PreviewqrcodeComponent,
      backdropDismiss: true,
      componentProps: {
        qrCodeString: qrCodeString,
      },
    });
    modal.onWillDismiss().then(() => {
      this.titleBarService.setTitle(
        titleBar,
        this.translate.instant(oldNameKey),
      );
      this.titleBarService.setTitleBarBackKeyShown(titleBar, true);
      if (page === 'serverinfo') {
        this.titleBarService.setTitleBarEditServer(titleBar);
      }
      if (page === 'feedinfo') {
        if (isOwner) {
          this.titleBarService.setTitleBarEditChannel(titleBar);
        }
      }
      this.titleBarService.addRight(titleBar);
    });
    return await modal.present();
  }

  async createTip(name: string) {
    let popover = await this.popoverController.create({
      mode: 'ios',
      component: MorenameComponent,
      cssClass: 'genericPopup',
      componentProps: {
        name: name,
      },
    });
    popover.onWillDismiss().then(() => {
      popover = null;
    });
    return await popover.present();
  }

  async showPayPrompt(nodeId: string, channelId: number, elaAddress: string) {
    let popover = await this.popoverController.create({
      mode: 'ios',
      cssClass: 'genericPopup',
      component: PaypromptComponent,
      backdropDismiss: false,
      componentProps: {
        title: this.translate.instant('ChannelsPage.tip'),
        elaAddress: elaAddress,
        defalutMemo: '',
        nodeId: nodeId,
        channelId: channelId,
      },
    });
    popover.onWillDismiss().then(() => {
      popover = null;
    });
    return await popover.present();
  }

  async showNftPrompt(assItem: any, title: any, type: any) {
    let popover = await this.popoverController.create({
      mode: 'ios',
      cssClass: 'PaypromptComponent',
      component: NftdialogComponent,
      componentProps: {
        title: this.translate.instant(title),
        assItem: assItem,
        menuType: type,
        },
    });
    popover.onWillDismiss().then(() => {
      Logger.log(TAG, 'Promote dismiss');
      popover = null;
    });
    return await popover.present();
  }

  async showGuideDialog(){
    let popover = await this.popoverController.create({
      mode: 'ios',
      cssClass: 'PaypromptComponent',
      component: GuidedialogComponent,
      componentProps: {

      },
    });
    popover.onWillDismiss().then(() => {
      Logger.log(TAG, 'Promote dismiss');
      popover = null;
    });
    return await popover.present();
  }
}
