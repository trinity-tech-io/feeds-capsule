import { Injectable } from '@angular/core';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import {
  TitleBarIconSlot,
  TitleBarIcon,
  TitleBarForegroundMode,
} from 'src/app/components/titlebar/titlebar.types';
import { NativeService } from 'src/app/services/NativeService';
import { MenuController, PopoverController } from '@ionic/angular';
import { Events } from 'src/app/services/events.service';
import { Router } from '@angular/router';
import { FeedService } from '../services/FeedService';
import { PopupProvider } from '../services/popup';

let TAG: string = 'TitleBarService';

@Injectable()
export class TitleBarService {
  public popover: any = null;
  constructor(
    private native: NativeService,
    private popoverController: PopoverController,
    private menu: MenuController,
    private router: Router,
    private event: Events,
    private feedService: FeedService,
    public popupProvider: PopupProvider,
  ) {}
  setTitleBarMoreMemu(titleBar: TitleBarComponent,type?:string,imgPath?:string) {
    let clickType = type || "more";
    let rightImgName = imgPath || "assets/icon/more_menu.ico";
    this.setIcon(
      titleBar,
      FeedsData.TitleBarIconSlot.OUTER_RIGHT,
      clickType,
      rightImgName,
    );
    this.registerMoreMenu(titleBar);
  }

  setTitleBarBackKeyShown(titleBar: TitleBarComponent, show: boolean) {
    if (show) {
      this.setIcon(
        titleBar,
        FeedsData.TitleBarIconSlot.OUTER_LEFT,
        'back',
        'assets/icon/back.svg',
      );
      this.registerBackKey(titleBar);
      return;
    }
    this.setIcon(titleBar, FeedsData.TitleBarIconSlot.OUTER_LEFT, null, null);
  }

  setTitleBarEditChannel(titleBar: TitleBarComponent) {
    this.setIcon(
      titleBar,
      FeedsData.TitleBarIconSlot.INNER_RIGHT,
      'editChannel',
      'assets/icon/edit.svg',
    );
    this.registEditChannel(titleBar);
  }

  setTitleBarEditServer(titleBar: TitleBarComponent) {
    this.setIcon(
      titleBar,
      FeedsData.TitleBarIconSlot.INNER_RIGHT,
      'editServer',
      'assets/icon/edit.svg',
    );
    this.registEditServer(titleBar);
  }

  setTitleBarEditImage(titleBar: TitleBarComponent) {
    this.setIcon(
      titleBar,
      FeedsData.TitleBarIconSlot.INNER_RIGHT,
      'editImages',
      'assets/images/ok.svg',
    );
    this.regitstEditImages(titleBar);
  }

  setTitle(titleBar: TitleBarComponent, title: string) {
    titleBar.setTitle(title);
  }

  setTitleBarBlankButton(titleBar: TitleBarComponent) {
    this.setIcon(
      titleBar,
      FeedsData.TitleBarIconSlot.OUTER_LEFT,
      'blank',
      'assets/icon/blank.svg',
    );
  }

  setIcon(
    titleBar: TitleBarComponent,
    iconSlot: FeedsData.TitleBarIconSlot,
    key: string,
    iconPath: string,
  ) {
    let titleBarIconSlot: TitleBarIconSlot = iconSlot.valueOf();
    let titleBarIcon: TitleBarIcon = null;
    if (key != null && iconPath != null) {
      titleBarIcon = {
        key: key,
        iconPath: iconPath,
      };
    }
    titleBar.setIcon(titleBarIconSlot, titleBarIcon);
  }

  registerBackKey(titleBar: TitleBarComponent) {
    titleBar.addOnItemClickedListener(icon => {
      if (icon.key == 'back') {
        this.handleBack();
      }
      //this.native.getNavCtrl().pop();
    });
  }

  registerMoreMenu(titleBar: TitleBarComponent) {
    titleBar.addOnItemClickedListener(icon => {
      if (icon.key == 'more') {
        this.event.publish(FeedsEvent.PublishType.openRightMenu);
        this.event.publish(FeedsEvent.PublishType.openRightMenuForSWM);
        this.menu.open('menu');
        return;
      }
      if(icon.key === "channelRightMenu"){
        this.event.publish(FeedsEvent.PublishType.channelRightMenu);
        return;
      }

      if(icon.key === "channelInfoRightMenu"){
        this.event.publish(FeedsEvent.PublishType.channelInfoRightMenu);
        return;
      }

    });
  }

  setBackgroundColor(titleBar: TitleBarComponent, hexColor: string) {
    titleBar.setBackgroundColor(hexColor);
  }

  setForegroundMode(
    titleBar: TitleBarComponent,
    mode: FeedsData.TitleBarForegroundMode,
  ) {
    let foregroundMode: TitleBarForegroundMode = mode.valueOf();
    titleBar.setForegroundMode(foregroundMode);
  }

  addRight(titleBar: TitleBarComponent) {
    this.setIcon(
      titleBar,
      FeedsData.TitleBarIconSlot.OUTER_RIGHT,
      'more',
      'assets/icon/more_menu.ico',
    );
  }

  hideRight(titleBar: TitleBarComponent) {
    this.setIcon(titleBar, FeedsData.TitleBarIconSlot.OUTER_RIGHT, null, null);
  }

  registEditChannel(titleBar: TitleBarComponent) {
    titleBar.addOnItemClickedListener(icon => {
      if (icon.key == 'editChannel')
        this.event.publish(FeedsEvent.PublishType.editChannel);
    });
  }

  registEditServer(titleBar: TitleBarComponent) {
    titleBar.addOnItemClickedListener(icon => {
      if (icon.key == 'editServer')
        this.event.publish(FeedsEvent.PublishType.editServer);
    });
  }

  regitstEditImages(titleBar: TitleBarComponent) {
    titleBar.addOnItemClickedListener(icon => {
      if (icon.key == 'editImages')
        this.event.publish(FeedsEvent.PublishType.editImages);
    });
  }

  handleBack() {
    let isFirstBindFeedService =
      localStorage.getItem('org.elastos.dapp.feeds.isFirstBindFeedService') ||
      '';
    let bindingServer = this.feedService.getBindingServer() || null;
    if (
      (this.router.url.indexOf('/bindservice/scanqrcode') > -1 &&
        isFirstBindFeedService === '' &&
        bindingServer === null) ||
      (this.router.url.indexOf('/bindservice/learnpublisheraccount') > -1 &&
        isFirstBindFeedService === '' &&
        bindingServer === null) ||
      (this.router.url.indexOf('/bindservice/startbinding') > -1 &&
        isFirstBindFeedService === '' &&
        bindingServer === null) ||
      this.router.url.indexOf('/bindservice/importdid') > -1 ||
      this.router.url.indexOf('/bindservice/publishdid') > -1 ||
      this.router.url.indexOf('/bindservice/issuecredential') > -1
    ) {
      this.createDialog();
    } else {
      this.native.pop();
    }
  }

  async createDialog() {
    if (this.popover != null) {
      return;
    }
    this.popover = this.popupProvider.ionicConfirm(
      this,
      'SearchPage.confirmTitle',
      'common.des2',
      this.cancel,
      this.confirm,
      './assets/images/tskth.svg',
    );
  }

  cancel(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      that.popover = null;
    }
  }

  confirm(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      that.popover = null;
    }
    let isFirstBindFeedService =
      localStorage.getItem('org.elastos.dapp.feeds.isFirstBindFeedService') ||
      '';
    if (isFirstBindFeedService === '') {
      localStorage.setItem(
        'org.elastos.dapp.feeds.isFirstBindFeedService',
        '1',
      );
    }
    that.native.setRootRouter(['/tabs/home']);
  }
}
