import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NgZone, ViewChild } from '@angular/core';
import { NativeService } from '../services/NativeService';
import { FeedService, SignInData } from '../services/FeedService';
import { CarrierService } from '../services/CarrierService';
import { PopupProvider } from 'src/app/services/popup';
import { LanguageService } from 'src/app/services/language.service';
import { Logger } from './logger';
import { DataHelper } from 'src/app/services/DataHelper';
import { IPFSService } from 'src/app/services/ipfs.service';
const TAG: string = 'AppService';
@Injectable({
  providedIn: 'root',
})
export class AppService {
  public popover: any = null;
  constructor(
    private router: Router,
    private zone: NgZone,
    private native: NativeService,
    private feedService: FeedService,
    private carrierService: CarrierService,
    public popupProvider: PopupProvider,
    private languageService: LanguageService, // private titleBarService: TitleBarService
    private dataHelper: DataHelper,
    private ipfsService: IPFSService
  ) {}

  init() {
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
    } else if (this.router.url === "/tabs/home" ||
               this.router.url === "/tabs/profile" ||
               this.router.url === "/tabs/notification" ||
               this.router.url === "/tabs/search" ||
               this.router.url === "/signin" ||
               this.router.url === "/disclaimer" ) {
               navigator['app'].exitApp();
    } else{
      this.native.pop();
    }
  }



  initTranslateConfig() {
    this.languageService.initTranslateConfig();
  }



  initializeApp() {
    this.feedService.initSignInDataAsync(signInData => {
      this.feedService.loadData().then(() => {
        this.feedService.updateVersionData();
        this.initData(signInData);
        // this.feedService.syncOpenOrder();
      });
    });
  }

  initData(signInData: SignInData) {
    if (
      signInData == null ||
      signInData == undefined ||
      this.feedService.getCurrentTimeNum() > signInData.expiresTS
    ) {
      this.native.setRootRouter(['/signin']);
      return;
    }

    this.carrierService.init(signInData.did);
    this.native.setRootRouter(['/tabs/home']);
    this.feedService.updateSignInDataExpTime(signInData);
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

  initTab() {
    let currentTab = this.feedService.getCurTab();
    switch (currentTab) {
      case 'home':
        this.native.setRootRouter(['/tabs/home']);
        break;
      case 'profile':
        this.native.setRootRouter(['/tabs/profile']);
        break;
      case 'notification':
        this.native.setRootRouter(['/tabs/notification']);
        break;
      case 'search':
        this.native.setRootRouter(['/tabs/search']);
        break;
    }
  }
}
