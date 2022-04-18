import { Injectable } from '@angular/core';
import {
  ToastController,
  LoadingController,
  NavController,
} from '@ionic/angular';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { Router } from '@angular/router';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { TranslateService } from '@ngx-translate/core';
import { ModalController } from '@ionic/angular';
import { VideofullscreenComponent } from './../components/videofullscreen/videofullscreen.component';
import { Network } from '@ionic-native/network/ngx';
import { Logger } from './logger';
import { Events } from './events.service';

const TAG: string = 'NativeService';
@Injectable()
export class NativeService {
  public loading: any = null;
  constructor(
    public modalController: ModalController,
    private toastCtrl: ToastController,
    private clipboard: Clipboard,
    private inappBrowser: InAppBrowser,
    private loadingCtrl: LoadingController,
    private navCtrl: NavController,
    private router: Router,
    private translate: TranslateService,
    private network: Network,
    private events: Events,
  ) {}

  public toast(
    message: string = 'Operation completed',
    duration: number = 3000,
  ): void {
    message = this.translate.instant(message);
    this.toastCtrl
      .create({
        mode: 'ios',
        color: 'success',
        message,
        duration: 3000,
        position: 'top',
      })
      .then(toast => toast.present());
  }

  public toastWarn(
    message: string = 'Operation completed',
    duration: number = 3000,
  ): void {
    message = this.translate.instant(message);
    this.toastCtrl
      .create({
        mode: 'ios',
        color: 'warning',
        message,
        duration: 3000,
        position: 'top',
      })
      .then(toast => toast.present());
  }

  public toastdanger(
    message: string = 'Operation completed',
    duration: number = 3000,
  ): void {
    message = this.translate.instant(message);
    this.toastCtrl
      .create({
        mode: 'ios',
        color: 'danger',
        message,
        duration: 3000,
        position: 'top',
      })
      .then(toast => toast.present());
  }

  public toast_trans(_message: string = '', duration: number = 3000): void {
    _message = this.translate.instant(_message);
    this.toastCtrl
      .create({
        mode: 'ios',
        color: 'success',
        message: _message,
        duration: duration,
        position: 'top',
      })
      .then(toast => toast.present());
  }

  public copyClipboard(text) {
    return this.clipboard.copy(text);
  }

  public go(page: any, options: any = {}) {
    this.navCtrl.navigateForward(page, { queryParams: options });
  }

  public pop() {
    this.navCtrl.pop();
  }

  public setRootRouter(router) {
    this.navCtrl.navigateRoot(router);
  }

  public async showLoading(
    content: string = '',
    dismissCallback?: (isDissmiss: boolean) => void,
    durationTime: number = 180000,
  ) {
    content = this.translate.instant(content);
    let isTimeout = false;
    let sid = setTimeout(() => {
      isTimeout = true;
      clearTimeout(sid);
    }, durationTime);

    this.loading = await this.loadingCtrl.create({
      cssClass: 'loading-class',
      message: content,
      duration: durationTime,
    });

    this.loading.onWillDismiss().then(() => {
      this.loading = null;
      let temp = dismissCallback || '';
      if (temp != '') dismissCallback(isTimeout);
    });

    return await this.loading.present();
  }

  public updateLoadingMsg(msg: string) {
    if (this.loading != null && this.loading != undefined)
      this.loading.message = msg;
  }

  public hideLoading(): void {
    if (this.loading != null) {
        this.loading.dismiss();
    }
  }

  public getTimestamp() {
    return new Date().getTime().toString();
  }

  public openUrl(url: string) {
    const target = '_system';
    const options = 'location=no';
    this.inappBrowser.create(url, target, options);
  }

  getNavCtrl() {
    return this.navCtrl;
  }

  navigateForward(router: any, options: any): Promise<boolean> {
    let option = options || '';
    if (option !== '') {
      return this.navCtrl.navigateForward(router, options);
    } else {
      return this.navCtrl.navigateForward(router);
    }
  }

  getRouter() {
    return this.router;
  }

  iGetInnerText(testStr: string) {
    var resultStr = testStr.replace(/\s+/g, ''); //去掉空格
    if (resultStr != '') {
      resultStr = testStr.replace(/[\r\n]/g, ''); //去掉回车换行
    }
    return resultStr;
  }

  networkInfoInit() {
  }

  addNetworkListener(offline: () => void, online: () => void) {
    // watch network for a disconnection
    let disconnectSubscription = this.network.onDisconnect().subscribe(() => {
      Logger.log(TAG, 'network was disconnected :-(');
      offline();
    });

    // stop disconnect watch
    // disconnectSubscription.unsubscribe();

    // watch network for a connection
    let connectSubscription = this.network.onConnect().subscribe(() => {
      Logger.log(TAG, 'network connected!');
      online();
    });

    if(this.network.type === 'none') {
        offline();
    }else{
        online();
    }

    // stop connect watch
    // connectSubscription.unsubscribe();
  }

  checkConnection() {
    var states = {};
    states[Connection.UNKNOWN] = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI] = 'WiFi connection';
    states[Connection.CELL_2G] = 'Cell 2G connection';
    states[Connection.CELL_3G] = 'Cell 3G connection';
    states[Connection.CELL_4G] = 'Cell 4G connection';
    states[Connection.CELL] = 'Cell generic connection';
    states[Connection.NONE] = 'No network connection';
  }

  hide(modal: any) {
    modal.dismiss();
  }

  parseJSON(str: string): any {
    if (typeof str == 'string') {
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
    } else {
      return str;
    }
  }

  /**
   * 防抖节流
   * @param {*} action 回调
   * @param {*} delay 等待的时间
   * @param {*} context this指针
   * @param {Boolean} iselapsed 是否等待上一次
   * @returns {Function}
   */

  public throttle(
    action: any,
    delay: number,
    context: any,
    iselapsed: boolean,
  ): Function {
    let timeout = null;
    let lastRun = 0;
    return function() {
      if (timeout) {
        if (iselapsed) {
          return;
        } else {
          clearTimeout(timeout);
          timeout = null;
        }
      }
      let elapsed = Date.now() - lastRun;
      let args = arguments;
      if (iselapsed && elapsed >= delay) {
        runCallback();
      } else {
        timeout = setTimeout(runCallback, delay);
      }
      /**
       * 执行回调
       */
      function runCallback() {
        lastRun = Date.now();
        timeout = false;
        action.apply(context, args);
      }
    };
  }

  async setVideoFullScreen(postImg: string, videoSrc: string) {
    const modal = await this.modalController.create({
      component: VideofullscreenComponent,
      componentProps: {
        postImg: postImg,
        videoSrc: videoSrc,
      },
    });
    await modal.present();
    return modal;
  }

  public clickUrl(url: string, event: any) {
    this.openUrl(url);
    event.stopPropagation();
  }

  changeLoadingDesc(message: string) {
    message = this.translate.instant(message);
    if (this.loading)
      this.loading.message = message;
  }

  handleTabsEvents(isUpdateHomePage?: string) {
    isUpdateHomePage = isUpdateHomePage || '';
    let isUpdate = false;
    if(isUpdateHomePage != '') {
      isUpdate = true;
    }
    let url: string = this.router.url;
    switch(url) {
      case "/tabs/home":
      case "/home":
      this.events.publish(FeedsEvent.PublishType.homeCommonEvents);
      this.events.publish(FeedsEvent.PublishType.updateTab,isUpdate);
        break;
      case "/tabs/profile":
      case "/profile":
        this.events.publish(FeedsEvent.PublishType.addProflieEvent);
        break;
      case "/tabs/notification":
      case "/notification":
        this.events.publish(FeedsEvent.PublishType.notification);
        break;
      case "/tabs/search":
      case "/search":
        this.events.publish(FeedsEvent.PublishType.search);
          break;
    }
  }
}
