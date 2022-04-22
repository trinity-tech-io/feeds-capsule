import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from '../../services/NativeService';
import { FeedService } from '../../services/FeedService';
import { ThemeService } from '../../services/theme.service';
import { HttpService } from '../../services/HttpService';
import { MenuService } from '../../services/MenuService';
import { TranslateService } from '@ngx-translate/core';
import { PopupProvider } from '../../services/popup';
import { AppService } from '../../services/AppService';
import { Events } from 'src/app/services/events.service';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { IPFSService } from 'src/app/services/ipfs.service';
import _ from 'lodash';
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';

@Component({
  selector: 'app-discoverfeedinfo',
  templateUrl: './discoverfeedinfo.page.html',
  styleUrls: ['./discoverfeedinfo.page.scss'],
})

// let obj = {
//   "did":this.serverInfo['did'],
//   "name":this.name,
//   "description":this.des,
//   "url":this.feedsUrl,
//   "feedsUrlHash":feedsUrlHash,
//   "feedsAvatar":this.channelAvatar,
//   "followers":followers,
//   "ownerName":this.serverInfo["owner"]
// };
export class DiscoverfeedinfoPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public developerMode: boolean = false;
  public feedInfo: any = {};
  public popover: any = '';
  public qrcodeString: string = null;
  public feedsUrl: string = null;
  public status: string = '';
  public channelSubscribes: number = 0;
  public followStatus: boolean = false;
  constructor(
    private events: Events,
    private zone: NgZone,
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private feedService: FeedService,
    public theme: ThemeService,
    private translate: TranslateService,
    public httpService: HttpService,
    private popoverController: PopoverController,
    public popupProvider: PopupProvider,
    private menuService: MenuService,
    private appService: AppService,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper,
    private ipfsService: IPFSService,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController
  ) { }

  ngOnInit() {
    this.acRoute.queryParams.subscribe(data => {
      this.feedInfo = _.cloneDeep(data)['params'];
      let avatar = this.handleAvatar(this.feedInfo['feedsAvatar']);
      document.getElementById("discoverFeedsAvatar").setAttribute("src", avatar);
      this.feedsUrl = this.feedInfo['url'] || '';
      this.qrcodeString =
        this.feedsUrl + '#' + encodeURIComponent(this.feedInfo['name']) || null;
    });
  }

  ionViewWillEnter() {
    this.developerMode = this.feedService.getDeveloperMode();
    this.channelSubscribes = this.feedInfo['followers'];
    this.status = this.getChannelStatus(this.feedInfo);
    this.initTitle();

    this.events.subscribe(FeedsEvent.PublishType.channelInfoRightMenu, () => {
      this.clickAvatar();
    });

    this.events.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      this.initTitle();
    });

    this.events.subscribe(
      FeedsEvent.PublishType.unsubscribeFinish,
      (unsubscribeData: FeedsEvent.unsubscribeData) => {
        this.zone.run(() => {
          let nodeId = unsubscribeData.nodeId;
          let channelId = unsubscribeData.channelId;
          let feedNodeId = this.feedInfo['nodeId'];
          let feedUrl = this.feedInfo['url'];
          let feedId = feedUrl.split('/')[4];
          if (feedNodeId === nodeId && feedId == channelId) {
            this.status = '1';
          }
        });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.subscribeFinish,
      (subscribeFinishData: FeedsEvent.SubscribeFinishData) => {
        this.zone.run(() => {
          let nodeId = subscribeFinishData.nodeId;
          let channelId = subscribeFinishData.channelId;
          let feedNodeId = this.feedInfo['nodeId'];
          let feedUrl = this.feedInfo['url'];
          let feedId = feedUrl.split('/')[4];
          if (feedNodeId === nodeId && feedId == channelId) {
            this.status = '2';
          }
        });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.addFeedStatusChanged,
      (addFeedStatusChangedData: FeedsEvent.AddFeedStatusChangedData) => {
        this.zone.run(() => {
          this.handleStatus();
        });
      },
    );
  }

  ionViewWillLeave() {
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = '';
    }
    this.native.hideLoading();
    this.events.unsubscribe(FeedsEvent.PublishType.addFeedStatusChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
    this.events.unsubscribe(FeedsEvent.PublishType.unsubscribeFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.subscribeFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.channelInfoRightMenu);
    this.native.handleTabsEvents();

  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('ChannelsPage.feeds'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    if (!this.theme.darkMode) {
      this.titleBarService.setTitleBarMoreMemu(this.titleBar, "channelInfoRightMenu", "assets/icon/dot.ico");
    } else {
      this.titleBarService.setTitleBarMoreMemu(this.titleBar, "channelInfoRightMenu", "assets/icon/dark/dot.ico");
    }
  }

  async subscribe() {
    let feedUrl = this.feedInfo['url'];
    let avatar = this.feedInfo['feedsAvatar'];
    let followers = this.feedInfo['followers'];
    let feedName = this.feedInfo['name'];
    let desc = this.feedInfo['description'];
    let ownerName = this.feedInfo['ownerName'];
    let channelId = feedUrl.split('/')[4];
    await this.subscribeV3(channelId, feedName);
    // this.feedService
    //   .addFeed(feedUrl, avatar, followers, feedName, ownerName, desc)
    //   .then(isSuccess => {
    //     if (isSuccess) {
    //       //this.native.pop();
    //       //return;
    //       this.status = '0';
    //     }
    //   })
    //   .catch(err => {
    //     this.status = '1';
    //   });
  }

  async subscribeV3(channelId: string, channelName: string) {

    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    let userDid = (await this.dataHelper.getSigninData()).did
    await this.native.showLoading('common.waitMoment');
    try {
      await this.hiveVaultController.subscribeChannel(userDid, channelId);
      await this.hiveVaultController.getPostListByChannel(userDid, channelId);
      this.status = '2';
      this.native.hideLoading();
    } catch (error) {
      this.followStatus = false;
      this.native.hideLoading();
    }
  }

  async unsubscribe() {
    let nodeId = this.feedInfo['nodeId'];
    let feedUrl = this.feedInfo['url'];
    let channelId = feedUrl.split('/')[4];
    let feedName = this.feedInfo['name'];
    this.menuService.showUnsubscribeMenu(nodeId, channelId, feedName);
  }

  getChannelStatus(item: any) {
    let nodeId = item['nodeId'];
    let feedUrl = item['url'];
    let channelId = feedUrl.split('/')[4];
    if (this.feedService.checkIsTobeAddedFeeds(nodeId, channelId)) {
      return '0';
    }

    let feeds = this.feedService.getChannelFromId(nodeId, channelId) || null;
    if (feeds == null || !feeds.isSubscribed) {
      return '1';
    }
    if (feeds.isSubscribed) return '2';
  }

  handleStatus() {
    let nodeId = this.feedInfo['nodeId'];
    let feedUrl = this.feedInfo['url'];
    let feedId = feedUrl.split('/')[4];

    if (this.feedService.checkIsTobeAddedFeeds(nodeId, feedId)) {
      let feeds =
        this.feedService.getToBeAddedFeedsInfoByNodeFeedId(nodeId, feedId) ||
        {};
      let status = feeds['status'] || 0;
      let keyString = 'SearchPage.status';
      return keyString + status;
    }
  }

  showPreviewQrcode(feedsUrl: string) {
    this.viewHelper.showPreviewQrcode(
      this.titleBar,
      feedsUrl,
      'common.qRcodePreview',
      'DiscoverfeedinfoPage.title',
      'discoverfeedinfo',
      this.appService,
    );
  }

  copyText(text: any) {
    this.native
      .copyClipboard(text)
      .then(() => {
        this.native.toast_trans('common.textcopied');
      })
      .catch(() => { });
  }

  clickAvatar() {
    let channelAvatar = this.feedInfo['feedsAvatar'];
    if (channelAvatar.indexOf('data:image') > -1 ||
      channelAvatar.indexOf('feeds:imgage:') > -1 ||
      channelAvatar.indexOf('feeds:image:') > -1 ||
      channelAvatar.indexOf('pasar:image:') > -1
    ) {
      this.dataHelper.setSelsectIndex(0);
      this.dataHelper.setProfileIamge(channelAvatar);
    } else if (channelAvatar.indexOf('assets/images') > -1) {
      let index = channelAvatar.substring(
        channelAvatar.length - 5,
        channelAvatar.length - 4,
      );
      this.dataHelper.setSelsectIndex(index);
      this.dataHelper.setProfileIamge(channelAvatar);
    }
    let destDid = this.feedInfo['nodeId'];
    let feedUrl = this.feedInfo['url'];
    let channelId = feedUrl.split('/')[4];
    this.dataHelper.setChannelInfo({
      ownerDid: this.feedInfo['ownerDid'],
      did: this.feedInfo['did'],
      destDid: destDid,
      channelId: channelId,
      name: this.feedInfo['name'],
      des: this.feedInfo['description'],
      followStatus: false,
      channelSubscribes: this.channelSubscribes,
      updatedTime: 0,
      channelOwner: this.feedInfo["ownerName"],
      feedUrl: this.feedInfo["url"],
      type: "discover"
    });
    this.native.navigateForward(['/feedinfo'], "");
  }

  handleAvatar(avatar: any) {
    let imgUri = "";
    if (avatar.indexOf('feeds:imgage:') > -1) {
      imgUri = avatar.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    } else if (avatar.indexOf('feeds:image:') > -1) {
      imgUri = avatar.replace('feeds:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    } else if (avatar.indexOf('pasar:image:') > -1) {
      imgUri = avatar.replace('pasar:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }
    else {
      imgUri = avatar;
    }
    return imgUri;
  }
}
