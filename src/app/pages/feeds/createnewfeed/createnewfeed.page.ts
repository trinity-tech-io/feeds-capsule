import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { NavController, PopoverController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from '@ngx-translate/core';
import { TipdialogComponent } from '../../../components/tipdialog/tipdialog.component';
import { ApiUrl } from '../../../services/ApiUrl';
import { StorageService } from '../../../services/StorageService';
import { UtilService } from '../../../services/utilService';
import { HttpService } from '../../../services/HttpService';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { PopupProvider } from 'src/app/services/popup';

@Component({
  selector: 'app-createnewfeed',
  templateUrl: './createnewfeed.page.html',
  styleUrls: ['./createnewfeed.page.scss'],
})
export class CreatenewfeedPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public namelen = 0;
  public len = 0;
  public connectionStatus = 1;
  public channelAvatar = '';
  public avatar = '';
  public selectedServer: any = null;
  public selectedChannelSource: string = 'Select channel source';
  public curFeedPublicStatus: boolean = true;
  public developerMode: boolean = false;
  public isHelp: boolean = false;
  public arrowBoxStyle: any = { top: '0px' };
  public curLang: string = '';
  constructor(
    private popover: PopoverController,
    private navCtrl: NavController,
    private feedService: FeedService,
    private popoverController: PopoverController,
    private zone: NgZone,
    private events: Events,
    private native: NativeService,
    public theme: ThemeService,
    private translate: TranslateService,
    private storageService: StorageService,
    private httpService: HttpService,
    private titleBarService: TitleBarService,
    private popup: PopupProvider,
  ) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.initTitle();
    this.curLang = this.feedService.getCurrentLang();
    this.developerMode = this.feedService.getDeveloperMode();
    this.selectedServer = this.feedService.getBindingServer();
    this.selectedChannelSource = this.selectedServer.did;
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.channelAvatar = this.feedService.getProfileIamge();
    this.avatar = this.feedService.parseChannelAvatar(this.channelAvatar);

    this.events.subscribe(FeedsEvent.PublishType.rpcRequestError, () => {
      this.zone.run(() => {
        this.native.hideLoading();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.rpcResponseError, () => {
      this.zone.run(() => {
        this.native.hideLoading();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.tipdialogCancel, () => {
      this.popover.dismiss();
    });

    this.events.subscribe(
      FeedsEvent.PublishType.tipdialogConfirm,
      (tipdialogData: FeedsEvent.TipDialogData) => {
        let name = tipdialogData.name;
        let desc = tipdialogData.desc;
        this.popover.dismiss();
        this.native
          .showLoading('common.waitMoment', isDismiss => {
            if (isDismiss) {
              this.showTimeOutErrorAlert();
            }
          })
          .then(() => {
            this.feedService.createTopic(
              this.selectedServer.nodeId,
              name,
              desc,
              this.channelAvatar,
            );
          })
          .catch(() => {
            this.native.hideLoading();
          });
      },
    );

    this.events.subscribe(FeedsEvent.PublishType.connectionChanged, status => {
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe(
      FeedsEvent.PublishType.createTopicSuccess,
      (createTopicSuccessData: FeedsEvent.CreateTopicSuccessData) => {
        this.zone.run(() => {
          let nodeId = createTopicSuccessData.nodeId;
          let channelId = createTopicSuccessData.channelId;
          this.publicFeeds(nodeId, channelId);
          this.native.hideLoading();
          this.navCtrl.pop().then(() => {
            // this.native.toast(
            //   this.translate.instant('CreatenewfeedPage.createfeedsuccess'),
            // );
          });
        });
      },
    );

    this.feedService.checkBindingServerVersion(() => {
      this.zone.run(() => {
        this.navCtrl.pop().then(() => {
          this.feedService.hideAlertPopover();
        });
      });
    });
  }

  showTimeOutErrorAlert() {
    this.popup.ionicAlert1(
      'common.error',
      'common.transMsgTimeout',
      'common.ok',
    );
  }

  ionViewDidEnter() {}

  ionViewWillLeave() {
    this.events.unsubscribe(FeedsEvent.PublishType.tipdialogCancel);
    this.events.unsubscribe(FeedsEvent.PublishType.tipdialogConfirm);
    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.createTopicSuccess);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestError);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcResponseError);
    this.events.publish(FeedsEvent.PublishType.addRpcRequestError);
    this.events.publish(FeedsEvent.PublishType.addRpcResponseError);
    this.events.publish(FeedsEvent.PublishType.addConnectionChanged);
    this.events.publish(FeedsEvent.PublishType.addProflieEvent);
    this.native.hideLoading();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('CreatenewfeedPage.createNewFeed'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  createChannel(name: HTMLInputElement, desc: HTMLInputElement) {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    let feedList = this.feedService.getMyChannelList() || [];

    if (feedList.length >= 5) {
      this.native.toastWarn('CreatenewfeedPage.feedMaxNumber');
      return;
    }

    this.feedService.checkDIDOnSideChain(
      this.selectedServer.did,
      isOnSideChain => {
        this.zone.run(() => {
          if (!isOnSideChain) {
            this.native.toastWarn('common.waitOnChain');
            return;
          }
          this.processCreateChannel(name, desc);
        });
      },
    );
  }

  processCreateChannel(name: HTMLInputElement, desc: HTMLInputElement) {
    let nameValue = name.value || '';
    nameValue = this.native.iGetInnerText(nameValue);
    if (nameValue == '') {
      this.native.toast_trans('CreatenewfeedPage.tipMsg1');
      return;
    }

    if (name.value.length > 32) {
      this.native.toast_trans('CreatenewfeedPage.tipMsgLength1');
      return;
    }

    let descValue = desc.value || '';
    descValue = this.native.iGetInnerText(descValue);
    if (descValue == '') {
      this.native.toast_trans('CreatenewfeedPage.tipMsg2');
      return;
    }

    if (desc.value.length > 128) {
      this.native.toast_trans('CreatenewfeedPage.tipMsgLength');
      return;
    }

    this.channelAvatar = this.feedService.getProfileIamge() || '';

    if (this.channelAvatar == '') {
      this.native.toast_trans('CreatenewfeedPage.tipMsg');
      return;
    }

    this.avatar = this.feedService.parseChannelAvatar(this.channelAvatar);

    if (this.selectedServer == null) {
      this.native.toast_trans('CreatenewfeedPage.tipMsg3');
      return;
    }

    let checkRes = this.feedService.checkValueValid(name.value);
    if (checkRes) {
      this.native.toast_trans('CreatenewfeedPage.nameContainInvalidChars');
      return;
    }

    this.createDialog(name.value, desc.value);
  }

  profileimage() {
    this.native.navigateForward(['/profileimage'], '');
  }

  onChangeText(des) {
    this.len = des.value.length;
  }

  onChangeName(name) {
    this.namelen = name.value.length;
  }

  async createDialog(name: string, des: string) {
    let popover = await this.popoverController.create({
      mode: 'ios',
      cssClass: 'genericPopup',
      component: TipdialogComponent,
      componentProps: {
        did: this.selectedServer.did,
        name: name,
        des: des,
        feedPublicStatus: this.curFeedPublicStatus,
        developerMode: this.developerMode,
      },
    });
    popover.onWillDismiss().then(() => {
      popover = null;
    });

    return await popover.present();
  }

  clickPublicFeeds() {
    this.zone.run(() => {
      this.curFeedPublicStatus = !this.curFeedPublicStatus;
    });
  }

  publicFeeds(nodeId: string, feedId: number) {
    if (!this.curFeedPublicStatus) {
      return;
    }

    let server = this.feedService.getServerbyNodeId(nodeId) || null;
    if (server === null) {
      return;
    }
    let feed = this.feedService.getChannelFromId(nodeId, feedId);
    let feedsUrl = server.feedsUrl + '/' + feed['id'];
    let channelAvatar = this.feedService.parseChannelAvatar(feed['avatar']);
    let feedsUrlHash = UtilService.SHA256(feedsUrl);
    let obj = {
      did: server['did'],
      name: feed['name'],
      description: feed['introduction'],
      url: feedsUrl,
      feedsUrlHash: feedsUrlHash,
      feedsAvatar: channelAvatar,
      followers: feed['subscribers'],
      ownerName: feed['owner_name'],
      nodeId: nodeId,
      ownerDid: feed['owner_did'],
    };
    this.httpService.ajaxPost(ApiUrl.register, obj).then(result => {
      if (result['code'] === 200) {
        let feedPublicStatus = this.feedService.getFeedPublicStatus() || {};
        feedPublicStatus[feedsUrlHash] = '1';
        this.feedService.setFeedPublicStatus(feedPublicStatus);
        this.storageService.set(
          'feeds.feedPublicStatus',
          JSON.stringify(feedPublicStatus),
        );
      }
    });
  }

  help(event: any) {
    let e = event || window.event; //兼容IE8
    let target = e.target || e.srcElement; //判断目标事件
    let boundingClientRect = target.getBoundingClientRect();
    this.arrowBoxStyle['top'] = boundingClientRect.top - 16.5 + 'px';
    this.isHelp = !this.isHelp;
  }

  copyChannelSource() {
    this.native
      .copyClipboard(this.selectedChannelSource)
      .then(() => {
        this.native.toast_trans('common.textcopied');
      })
      .catch(() => {});
  }
}
