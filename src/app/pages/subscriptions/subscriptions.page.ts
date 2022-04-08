import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { Events } from 'src/app/services/events.service';
import { FeedService, SignInData } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { IntentService } from 'src/app/services/IntentService';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { UtilService } from 'src/app/services/utilService';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import _ from 'lodash';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.page.html',
  styleUrls: ['./subscriptions.page.scss'],
})
export class SubscriptionsPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public followingList: any = [];
  public nodeStatus: any = {};
  public isShowUnfollow: boolean = false;
  public isShowQrcode: boolean = false;
  public isShowTitle: boolean = false;
  public isShowInfo: boolean = false;
  public isPreferences: boolean = false;
  public shareDestDid: string = '';
  public shareChannelId: string = '';
  public curItem: any = {};
  public qrCodeString: string = null;
  public channelName: string = null;
  public hideSharMenuComponent: boolean = false;
  private followingIsLoadimage: any = {};
  private clientHeight: number = 0;
  constructor(
    private titleBarService: TitleBarService,
    private translate: TranslateService,
    private events: Events,
    private feedService: FeedService,
    private zone: NgZone,
    private native: NativeService,
    private intentService: IntentService,
    private feedsServiceApi: FeedsServiceApi,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController
  ) { }

  ngOnInit() { }

  ionViewWillEnter() {
    this.clientHeight = screen.availHeight;
    this.initTitle();
    this.addEvents();
    this.initFollowing();
  }

  addEvents() {
    this.events.subscribe(
      FeedsEvent.PublishType.friendConnectionChanged,
      (friendConnectionChangedData: FeedsEvent.FriendConnectionChangedData) => {
        this.zone.run(() => {
          let nodeId = friendConnectionChangedData.nodeId;
          let connectionStatus = friendConnectionChangedData.connectionStatus;
          this.nodeStatus[nodeId] = connectionStatus;
        });
      },
    );

    this.events.subscribe(FeedsEvent.PublishType.unfollowFeedsFinish, () => {
      this.zone.run(() => {
        this.initFollowing();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.refreshPage, () => {
      this.zone.run(() => {
        this.initFollowing();
      });
    });

    this.events.subscribe(
      FeedsEvent.PublishType.refreshSubscribedChannels,
      () => {
        this.zone.run(async () => {
          this.followingList = await this.initFollowing()
          this.initnodeStatus(this.followingList);
        });
      },
    );
  }

  removeEvents() {
    this.events.unsubscribe(FeedsEvent.PublishType.friendConnectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.unfollowFeedsFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.refreshPage);
    this.events.unsubscribe(FeedsEvent.PublishType.friendConnectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.refreshSubscribedChannels);
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('ProfilePage.following'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewWillLeave() {
    this.followingIsLoadimage = {};
    this.hideSharMenuComponent = false;
    this.removeEvents();
    this.events.publish(FeedsEvent.PublishType.addProflieEvent);
  }

  showMenuMore(item: any) {
    this.curItem = item;
    this.isShowTitle = true;
    this.isShowInfo = true;
    this.isShowQrcode = true;
    this.isPreferences = false;
    this.isShowUnfollow = true;
    this.channelName = item.channelName;
    this.qrCodeString = this.getQrCodeString(item);
    this.hideSharMenuComponent = true;
  }

  toPage(eventParm: any) {
    let destDid = eventParm['destDid'];
    let channelId = eventParm['channelId'];
    let postId = eventParm['postId'] || '';
    let page = eventParm['page'];

    if (postId != '') {
      this.native
        .getNavCtrl()
        .navigateForward([page, destDid, channelId, postId]);
    } else {
      this.native.getNavCtrl().navigateForward([page, destDid, channelId]);
    }
  }


  async initFollowing() {
    let subscribedChannel = await this.dataHelper.getSubscribedChannelV3List(FeedsData.SubscribedChannelType.OTHER_CHANNEL);
    this.followingList = await this.getFollowedChannelList(subscribedChannel);
    this.refreshFollowingVisibleareaImage();
    // this.initnodeStatus(this.followingList);
    // this.feedService.updateSubscribedFeed();
  }

  async getFollowedChannelList(subscribedChannel: FeedsData.SubscribedChannelV3[]) {
    let list = [];
    for (let item of subscribedChannel) {
      let destDid = item.destDid;
      let channelId = item.channelId;
      let channel: any = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
      if (channel != null) {
        list.push(channel);
      }
    }
    return list;
  }
  initnodeStatus(list: any) {
    list = list || [];
    for (let index = 0; index < list.length; index++) {
      let nodeId = list[index]['nodeId'];
      let status = this.checkServerStatus(nodeId);
      this.nodeStatus[nodeId] = status;
    }
  }

  checkServerStatus(nodeId: string) {
    return this.feedService.getServerStatusFromId(nodeId);
  }

  doRefresh(event: any) {
    let sId = setTimeout(() => {
      //TODO
      this.hiveVaultController.syncAllChannelInfo();
      this.initFollowing();
      event.target.complete();
      clearTimeout(sId);
    }, 500);
  }

  getQrCodeString(channel: any) {
    let destDid = channel['destDid'];
    this.shareDestDid = destDid;
    let channelId = channel['channelId'] || '';
    this.shareChannelId = channelId;
    let name = channel['channelName'] || '';
    let signInData: SignInData = this.feedService.getSignInData() || null;
    let ownerDid = signInData.did || "";
    return "feeds://v3/" + ownerDid + "/" + channelId + '/' + encodeURIComponent(name);
  }

  async hideShareMenu(objParm: any) {
    let buttonType = objParm['buttonType'];
    let destDid = objParm['destDid'];
    let channelId = objParm['channelId'];
    switch (buttonType) {
      case 'unfollow':
        let connect = this.dataHelper.getNetworkStatus();
        if (connect === FeedsData.ConnState.disconnected) {
        this.native.toastWarn('common.connectionError');
        return;
        }
        // if (this.checkServerStatus(destDid) != 0) {
        //   this.native.toastWarn('common.connectionError1');
        //   return;
        // }
        await this.native.showLoading("common.waitMoment");
        try {
          this.hiveVaultController.unSubscribeChannel(
            destDid, channelId
          ).then(async (result) => {
            let channel: FeedsData.SubscribedChannelV3 = {
              destDid: destDid,
              channelId: channelId
            };
            await this.dataHelper.removeSubscribedChannelV3(channel);
            await this.hiveVaultController.getHomePostContent();
            this.events.publish(FeedsEvent.PublishType.unfollowFeedsFinish, channel);
            this.native.hideLoading();
          }).catch(() => {
            this.native.hideLoading();
          });
        } catch (err) {
          this.native.hideLoading();
        }

        this.qrCodeString = null;
        this.hideSharMenuComponent = false;
        break;
      case 'share':
        let content = this.getQrCodeString(this.curItem);
        this.hideSharMenuComponent = false;
        //share channel
        await this.native.showLoading("common.generateSharingLink");
        try {
          let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
          let signInData: SignInData = this.feedService.getSignInData() || null;
          let ownerDid = signInData.did || "";
          const sharedLink = await this.intentService.createShareLink(destDid, channelId, "0", ownerDid, channel);
          this.intentService.share(this.intentService.createShareChannelTitle(destDid, channelId, channel), sharedLink);
        } catch (error) {
        }
        this.native.hideLoading();
        break;
      case 'info':
        this.clickAvatar(destDid, channelId);
        break;
      case 'preferences':
        let connectStatus = this.dataHelper.getNetworkStatus();
        if (connectStatus === FeedsData.ConnState.disconnected) {
        this.native.toastWarn('common.connectionError');
        return;
        }

        this.native.navigateForward(['feedspreferences'], {
          queryParams: {
            nodeId: this.shareDestDid,
            feedId: this.shareChannelId,
          },
        });
        this.hideSharMenuComponent = false;
        break;
      case 'cancel':
        this.qrCodeString = null;
        this.hideSharMenuComponent = false;
        break;
    }
    let sharemenu: HTMLElement = document.querySelector("app-sharemenu") || null;
    if (sharemenu != null) {
      sharemenu.remove();
    }
  }

  async clickAvatar(destDid: string, channelId: string) {
    let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId);
    let followStatus = this.checkFollowStatus(destDid, channelId);
    let channelName = channel.name;
    let channelDesc = channel.intro;
    let channelSubscribes = 0;
    let feedAvatar = this.feedService.parseChannelAvatar(channel.avatar);
    if (feedAvatar.indexOf('data:image') > -1 ||
      feedAvatar.startsWith("https:")) {
      this.feedService.setSelsectIndex(0);
      this.feedService.setProfileIamge(feedAvatar);
    } else if (feedAvatar.indexOf('assets/images') > -1) {
      let index = feedAvatar.substring(
        feedAvatar.length - 5,
        feedAvatar.length - 4,
      );
      this.feedService.setSelsectIndex(index);
      this.feedService.setProfileIamge(feedAvatar);
    }
    let signInData: FeedsData.SignInData = this.feedService.getSignInData() || null;
    let ownerDid: string = signInData.did || "";
    this.feedService.setChannelInfo({
      destDid: destDid,
      channelId: channelId,
      name: channelName,
      des: channelDesc,
      followStatus: followStatus,
      channelSubscribes: channelSubscribes,
      updatedTime: channel.updatedAt,
      channelOwner: channel.destDid,
      ownerDid: ownerDid,
      tippingAddress: channel.tipping_address
    });
    this.native.navigateForward(['/feedinfo'], '');
  }

  async checkFollowStatus(destDid: string, channelId: string) {
    let subscribedChannel: FeedsData.SubscribedChannelV3[] = await this.dataHelper.getSubscribedChannelV3List(FeedsData.SubscribedChannelType.ALL_CHANNEL);
    if (subscribedChannel.length === 0) {
      return false;
    }

    let channelIndex = _.find(subscribedChannel, (item: FeedsData.SubscribedChannelV3) => {
      return item.destDid === destDid && item.channelId === channelId;
    }) || '';
    if (channelIndex === '') {
      return false;
    }
    return true;
  }

  ionScroll() {
    this.native.throttle(this.setFollowingVisibleareaImage(), 200, this, true);
  }

  setFollowingVisibleareaImage() {
    let ionRowFollowing = document.getElementsByClassName("ionRowFollowing") || null;
    let len = ionRowFollowing.length;
    for (let itemIndex = 0; itemIndex < len; itemIndex++) {
      let item = ionRowFollowing[itemIndex];
      let id = item.getAttribute("id") || "";
      if (id === "") {
        continue;
      }

      let avatarImage = document.getElementById(id + "-followingAvatar");
      let srcStr = avatarImage.getAttribute("src") || "";
      let isload = this.followingIsLoadimage[id] || '';
      try {
        if (
          id != '' &&
          avatarImage.getBoundingClientRect().top >= -100 &&
          avatarImage.getBoundingClientRect().top <= this.clientHeight
        ) {
          if (isload === "") {
            let arr = id.split("-");
            this.followingIsLoadimage[id] = '11';
            let destDid = arr[0];
            let channelId = arr[1];
            const key = UtilService.getKey(destDid, channelId);
            let channel: FeedsData.ChannelV3 = this.dataHelper.channelsMapV3[key] || null;
            let avatarUri = "";
            if (channel != null) {
              avatarUri = channel.avatar;
            }
            let fileName: string = avatarUri.split("@")[0];
            this.hiveVaultController.getV3Data(destDid, avatarUri, fileName, "0").then((data) => {
              this.zone.run(() => {
                this.followingIsLoadimage[id] = '13';
                let srcData = data || "";
                if (srcData != "") {
                  avatarImage.setAttribute("src", data);
                }
              });
            }).catch((err) => {
              if (this.followingIsLoadimage[id] === '13') {
                this.followingIsLoadimage[id] = '';
                avatarImage.setAttribute('src', './assets/icon/reserve.svg');
              }
            });
          }
        } else {
          srcStr = avatarImage.getAttribute('src') || './assets/icon/reserve.svg';
          if (
            avatarImage.getBoundingClientRect().top < -100 &&
            this.followingIsLoadimage[id] === '13' &&
            srcStr != './assets/icon/reserve.svg'
          ) {
            this.followingIsLoadimage[id] = '';
            avatarImage.setAttribute('src', './assets/icon/reserve.svg');
          }
        }
      } catch (error) {
        if (this.followingIsLoadimage[id] === '13') {
          this.followingIsLoadimage[id] = '';
          avatarImage.setAttribute('src', './assets/icon/reserve.svg');
        }
      }

    }
  }

  refreshFollowingVisibleareaImage() {
    let sid = setTimeout(() => {
      this.followingIsLoadimage = {};
      this.setFollowingVisibleareaImage();
      clearTimeout(sid);
    }, 100);

  }

}
