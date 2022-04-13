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
import { ThemeService } from 'src/app/services/theme.service';
import { Logger } from './logger';
import { NfttransferdialogComponent } from './../components/nfttransferdialog/nfttransferdialog.component';
import { NftdisclaimerComponent } from './..//components/nftdisclaimer/nftdisclaimer.component';


const TAG: string = 'ViewHelper';
@Injectable()
export class ViewHelper {
  public loading: any = null;
  constructor(
    public modalController: ModalController,
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private popoverController: PopoverController,
    private theme: ThemeService
  ) { }

  async openViewer(
    titleBar: TitleBarComponent,
    imgPath: string,
    newNameKey: string,
    oldNameKey: string,
    appService?: any,
    isOwer?: boolean,
    isNft?: string,
  ) {
    const isExitMode = await this.modalController.getTop();
    if (isExitMode) {
      return;
    }
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
      document.removeEventListener('click', event => this.testClick(modal, event), false);
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
      isOwer = isOwer || false;
      if (isOwer) {
        if (!this.theme.darkMode) {
          this.titleBarService.setTitleBarMoreMemu(titleBar, "channelRightMenu", "assets/icon/dot.ico");
        } else {
          this.titleBarService.setTitleBarMoreMemu(titleBar, "channelRightMenu", "assets/icon/dark/dot.ico");
        }
      } else {
        this.titleBarService.addRight(titleBar);
      }
    });

    return await modal.present().then(() => {

      const el: any = document.querySelector('ion-modal') || '';
      const viewerModal: any = el.querySelector("ion-viewer-modal");
      //add nft log
      isNft = isNft || "";
      if (isNft != "") {
        let sheet1 = document.createElement('img');
        sheet1.setAttribute('src', "/assets/images/bidfeedslogo.svg");
        sheet1.setAttribute('style', 'display:block;width:90px;height:90px;top:calc(50% - 45px);left: calc(50% - 45px);z-index:10000;position:fixed;');
        viewerModal.appendChild(sheet1);
      }

      //removeChild
      let sheet = document.createElement('img');
      if (this.theme.darkMode) {
        sheet.setAttribute('src', "assets/images/darkmode/bigguanbi.svg");
      } else {
        sheet.setAttribute('src', "assets/images/bigguanbi.svg");
      }
      sheet.setAttribute('style', 'display:block;width:32px;height:32px;left:10px;top:10px;z-index:10000;position:fixed;');
      sheet.addEventListener('click', event => this.testClick(modal, event), false);
      viewerModal.appendChild(sheet);
      el.addEventListener('click', event => this.hide(modal, event), false);
    });
  }

  testClick(modal: any, e: any) {
    modal.dismiss();
    e.stopPropagation();

  }
  hide(modal: any, e: any) {
    modal.dismiss();
    e.stopPropagation();
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
      if (page === "discoverfeedinfo") {
        return;
      }
      this.titleBarService.setTitleBarBackKeyShown(titleBar, true);
      if (page === 'feedinfo') {
        if (isOwner) {
          if (!this.theme.darkMode) {
            this.titleBarService.setTitleBarMoreMemu(titleBar, "channelRightMenu", "assets/icon/dot.ico");
          } else {
            this.titleBarService.setTitleBarMoreMemu(titleBar, "channelRightMenu", "assets/icon/dark/dot.ico");
          }
        }
        return;
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

  async showPayPrompt(nodeId: string, channelId: string, elaAddress: string, amount?: any, memo?: any) {
    let amountData = amount || "";
    let memoData = memo || "";
    let popover = await this.popoverController.create({
      mode: 'ios',
      cssClass: 'genericPopup',
      component: PaypromptComponent,
      backdropDismiss: false,
      componentProps: {
        title: this.translate.instant('ChannelsPage.tip'),
        elaAddress: elaAddress,
        defalutMemo: memoData,
        nodeId: nodeId,
        channelId: channelId,
        amount: amountData
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
      cssClass: 'genericPopup',
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

  async showTransferPrompt(assItem: any, title: any) {
    let popover = await this.popoverController.create({
      mode: 'ios',
      cssClass: 'genericPopup',
      component: NfttransferdialogComponent,
      componentProps: {
        title: this.translate.instant(title),
        assItem: assItem
      },
    });
    popover.onWillDismiss().then(() => {
      Logger.log(TAG, 'Promote dismiss');
      popover = null;
    });
    return await popover.present();
  }

  async showNftdisclaimerPrompt() {
    let popover = await this.popoverController.create({
      mode: 'ios',
      cssClass: 'genericPopup',
      component: NftdisclaimerComponent
    });
    popover.onWillDismiss().then(() => {
      Logger.log(TAG, 'Promote dismiss');
      popover = null;
    });
    return await popover.present();
  }
}
