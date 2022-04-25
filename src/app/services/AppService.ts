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
import { UtilService } from './utilService';
import { Events } from 'src/app/services/events.service';
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
    private events: Events
  ) { }

  init() {
  }

  handleBack() {

    if (this.router.url === "/tabs/search" || this.router.url === "/tabs/profile") {
      navigator['app'].exitApp();
    } else if (this.router.url === "/tabs/home" ||
      this.router.url === "/tabs/notification" ||
      this.router.url === "/signin" ||
      this.router.url === "/disclaimer") {
      navigator['app'].exitApp();
    } else {
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
      UtilService.getCurrentTimeNum() > signInData.expiresTS
    ) {
      this.native.setRootRouter(['/signin']);
      return;
    }

    this.dataHelper.loadData("feeds.initHive").then((result)=>{
          let isInitHive =  result || null;
          if(isInitHive === null){
              //此处切换成galleriahive 页面
              this.events.publish(FeedsEvent.PublishType.signinSuccess);
              this.native.setRootRouter('galleriahive');
              return;
          }else{
            this.dataHelper.loadData("feeds.syncHiveData").then((syncHiveData: any)=>{
                  if(syncHiveData === null){
                     this.events.publish(FeedsEvent.PublishType.initHiveData);
                     let syncHiveData = {status: 0, describe: "GalleriahivePage.preparingData"}
                     this.dataHelper.setSyncHiveData(syncHiveData);
                     this.native.setRootRouter(['/tabs/home']);
                     this.feedService.updateSignInDataExpTime(signInData);
                  }else{
                     if(syncHiveData.status === 6) {
                      this.dataHelper.setSyncHiveData(syncHiveData);
                      this.native.setRootRouter(['/tabs/home']);
                      this.feedService.updateSignInDataExpTime(signInData);
                     }else {
                      let syncHiveData = {status: 0, describe: "GalleriahivePage.preparingData"}
                      this.dataHelper.setSyncHiveData(syncHiveData);
                      this.events.publish(FeedsEvent.PublishType.initHiveData);
                      this.native.setRootRouter(['/tabs/home']);
                      this.feedService.updateSignInDataExpTime(signInData);
                     }
                  }
            })

          }
    });
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
