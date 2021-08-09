import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Events } from 'src/app/services/events.service';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { UtilService } from 'src/app/services/utilService';
import { MenuService } from 'src/app/services/MenuService';
import { TranslateService } from '@ngx-translate/core';
import {
  PopoverController,
  IonInfiniteScroll,
  IonContent,
} from '@ionic/angular';
import { AppService } from 'src/app/services/AppService';
import { PopupProvider } from 'src/app/services/popup';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

import { LogUtils } from 'src/app/services/LogUtils';
import * as _ from 'lodash';
let TAG: string = 'Feeds-feeds';
@Component({
  selector: 'app-channels',
  templateUrl: './channels.page.html',
  styleUrls: ['./channels.page.scss'],
})
export class ChannelsPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonContent, { static: true }) content: IonContent;
  @ViewChild(IonInfiniteScroll, { static: true })
  infiniteScroll: IonInfiniteScroll;

  public images = {};
  public isShowPrompt: boolean = false;
  public popover: any;
  public nodeStatus: any = {};
  public connectionStatus: number = 1;
  public channelAvatar: string = '';
  public channelName: string = '';
  public updatedTime: number = 0;
  public channelOwner: string = '';
  public channelDesc: string = '';
  public channelSubscribes: number = 0;
  public postList: any = [];

  public nodeId: string = '';
  public channelId: number = 0;

  public followStatus: boolean = false;

  public startIndex: number = 0;
  public pageNumber: number = 5;
  public totalData: any = [];

  public styleObj: any = { width: '' };

  public hideComment = true;

  // For comment component
  public postId = null;

  public clientHeight: number = 0;
  public isLoadimage: any = {};
  public isLoadVideoiamge: any = {};
  public videoIamges: any = {};

  public cacheGetBinaryRequestKey: string = '';
  public cachedMediaType = '';

  public onlineStatus = null;

  public maxTextSize = 240;

  public fullScreenmodal: any = '';

  public curNodeId: string = '';

  public hideDeletedPosts: boolean = false;

  public isPress: boolean = false;

  /**
   * imgPercentageLoading
   */
  public isImgPercentageLoading: any = {};
  public imgPercent: number = 0;
  public imgRotateNum: any = {};
  /**
   * imgloading
   */
  public isImgLoading: any = {};
  public imgloadingStyleObj: any = {};
  public imgDownStatus: any = {};
  public imgDownStatusKey: string = '';
  public imgCurKey: string = '';

  /**
   * videoPercentageLoading
   */
  public isVideoPercentageLoading: any = {};
  public videoPercent: number = 0;
  public videoRotateNum: any = {};
  /**
   * videoloading
   */
  public isVideoLoading: any = {};
  public videoloadingStyleObj: any = {};
  public videoDownStatus: any = {};
  public videoDownStatusKey: string = '';
  public videoCurKey: string = '';

  public roundWidth: number = 40;
  public isAndroid: boolean = true;

  public isMine: number = null;

  public nftAssetList: any = [];

  constructor(
    private platform: Platform,
    private popoverController: PopoverController,
    private zone: NgZone,
    private events: Events,
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private feedService: FeedService,
    public theme: ThemeService,
    private translate: TranslateService,
    private menuService: MenuService,
    public appService: AppService,
    public modalController: ModalController,
    private logUtils: LogUtils,
    public popupProvider: PopupProvider,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper,
  ) {}

  subscribe() {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (this.checkServerStatus(this.nodeId) != 0) {
      this.native.toastWarn('common.connectionError1');
      return;
    }

    this.feedService.subscribeChannel(this.nodeId, Number(this.channelId));
  }

  tip() {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    let server = this.feedService.getServerbyNodeId(this.nodeId) || {};
    let elaAddress = server['elaAddress'] || null;
    if (elaAddress == null) {
      this.native.toast('common.noElaAddress');
      return;
    }

    this.pauseAllVideo();
    this.viewHelper.showPayPrompt(this.nodeId, this.channelId, elaAddress);
  }

  async unsubscribe() {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (this.checkServerStatus(this.nodeId) != 0) {
      this.native.toastWarn('common.connectionError1');
      return;
    }

    this.menuService.showUnsubscribeMenuWithoutName(
      this.nodeId,
      Number(this.channelId),
    );
  }

  ngOnInit() {
    this.acRoute.params.subscribe(data => {
      this.nodeId = data.nodeId;
      this.channelId = data.channelId;
    });
  }

  init() {
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.initnodeStatus(this.nodeId);
    this.initChannelData();
    this.initRefresh();
    this.initStatus(this.postList);
  }

  initStatus(arr: any) {
    for (let index = 0; index < arr.length; index++) {
      let nodeId = arr[index]['nodeId'];
      this.initnodeStatus(nodeId);
    }
  }

  sortChannelList() {
    let channelList =
      this.feedService.getPostListFromChannel(this.nodeId, this.channelId) ||
      [];
    this.hideDeletedPosts = this.feedService.getHideDeletedPosts();
    if (!this.hideDeletedPosts) {
      channelList = _.filter(channelList, (item: any) => {
        return item.post_status != 1;
      });
    }
    return channelList;
  }

  initRefresh() {
    this.totalData = this.sortChannelList();
    this.startIndex = 0;
    if (this.totalData.length - this.pageNumber > 0) {
      this.postList = this.totalData.slice(0, this.pageNumber);
      this.infiniteScroll.disabled = false;
      this.startIndex++;

      this.isLoadimage = {};
      this.isLoadVideoiamge = {};
      this.refreshImage();
    } else {
      this.postList = this.totalData;
      this.infiniteScroll.disabled = true;
      this.isLoadimage = {};
      this.isLoadVideoiamge = {};
      this.refreshImage();
    }
  }

  refreshChannelList() {
    if (this.startIndex === 0) {
      this.initRefresh();
      return;
    }
    this.totalData = this.sortChannelList();
    if (this.totalData.length - this.pageNumber * this.startIndex > 0) {
      this.postList = this.totalData.slice(
        0,
        this.startIndex * this.pageNumber,
      );
      this.infiniteScroll.disabled = false;
    } else {
      this.postList = this.totalData;
      this.infiniteScroll.disabled = true;
    }
    this.isLoadimage = {};
    this.isLoadVideoiamge = {};
    this.refreshImage();
  }

  initChannelData() {
    let channel = this.feedService.getChannelFromId(
      this.nodeId,
      this.channelId,
    );
    this.checkFollowStatus(this.nodeId, this.channelId);
    if (channel == null || channel == undefined) return;

    this.channelName = channel.name;
    this.updatedTime = channel.last_update || 0;
    this.channelOwner = this.feedService.indexText(channel.owner_name, 25, 25);
    this.channelDesc = channel.introduction;
    this.channelSubscribes = channel.subscribers;
    this.channelAvatar = this.feedService.parseChannelAvatar(channel.avatar);
  }
  ionViewWillEnter() {
    this.isMine = this.checkChannelIsMine();
    if (this.platform.is('ios')) {
      this.isAndroid = false;
    }

    this.hideDeletedPosts = this.feedService.getHideDeletedPosts();
    this.clientHeight = screen.availHeight;
    this.styleObj.width = screen.width - 105 + 'px';
    this.initTitle();
    this.init();

    this.events.subscribe(FeedsEvent.PublishType.connectionChanged, status => {
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe(
      FeedsEvent.PublishType.subscribeFinish,
      (subscribeFinishData: FeedsEvent.SubscribeFinishData) => {
        this.zone.run(() => {
          let nodeId = subscribeFinishData.nodeId;
          let channelId = subscribeFinishData.channelId;
          this.checkFollowStatus(this.nodeId, this.channelId);
        });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.unsubscribeFinish,
      (unsubscribeData: FeedsEvent.unsubscribeData) => {
        this.zone.run(() => {
          this.checkFollowStatus(this.nodeId, this.channelId);
          this.native.setRootRouter(['/tabs/home']);
        });
      },
    );

    this.events.subscribe(FeedsEvent.PublishType.editPostFinish, () => {
      this.zone.run(() => {
        this.refreshChannelList();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.deletePostFinish, () => {
      this.native.hideLoading();
      this.zone.run(() => {
        this.refreshChannelList();
      });
    });

    this.events.subscribe(
      FeedsEvent.PublishType.streamGetBinaryResponse,
      () => {
        this.zone.run(() => {});
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.getBinaryFinish,
      (getBinaryData: FeedsEvent.GetBinaryData) => {
        this.zone.run(() => {
          let key = getBinaryData.key;
          let value = getBinaryData.value;
          this.processGetBinaryResult(key, value);
        });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.streamGetBinarySuccess,
      (getBinaryData: FeedsEvent.GetBinaryData) => {
        this.zone.run(() => {
          let nodeId = getBinaryData.nodeId;
          let key = getBinaryData.key;
          let value = getBinaryData.value;
          this.processGetBinaryResult(key, value);
          this.feedService.closeSession(nodeId);
        });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.streamProgress,
      (streamProgressData: FeedsEvent.StreamProgressData) => {
        this.zone.run(() => {
          let progress = streamProgressData.progress;
          if (
            this.cachedMediaType === 'video' &&
            this.videoDownStatus[this.videoDownStatusKey] === '1'
          ) {
            this.videoPercent = progress;
            if (progress < 100) {
              this.videoRotateNum['transform'] =
                'rotate(' + (18 / 5) * progress + 'deg)';
            } else {
              if (progress === 100) {
                this.videoRotateNum['transform'] =
                  'rotate(' + (18 / 5) * progress + 'deg)';
              }
            }
            return;
          }

          if (
            this.cachedMediaType === 'img' &&
            this.imgDownStatus[this.imgDownStatusKey] === '1'
          ) {
            this.imgPercent = progress;
            if (progress < 100) {
              this.imgRotateNum['transform'] =
                'rotate(' + (18 / 5) * progress + 'deg)';
            } else {
              if (progress === 100) {
                this.imgRotateNum['transform'] =
                  'rotate(' + (18 / 5) * progress + 'deg)';
              }
            }
          }
        });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.streamError,
      (streamErrorData: FeedsEvent.StreamErrorData) => {
        this.zone.run(() => {
          let nodeId = streamErrorData.nodeId;
          let error = streamErrorData.error;
          this.isImgPercentageLoading[this.imgDownStatusKey] = false;
          this.isImgLoading[this.imgDownStatusKey] = false;
          this.imgDownStatus[this.imgDownStatusKey] = '';

          this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
          this.isVideoLoading[this.videoDownStatusKey] = false;
          this.videoDownStatus[this.videoDownStatusKey] = '';

          this.feedService.handleSessionError(nodeId, error);
          this.pauseAllVideo();
          this.curNodeId = '';
        });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.streamOnStateChangedCallback,
      (streamStateChangedData: FeedsEvent.StreamStateChangedData) => {
        this.zone.run(() => {
          let nodeId = streamStateChangedData.nodeId;
          let state = streamStateChangedData.streamState;
          if (this.cacheGetBinaryRequestKey == '') return;

          if (state === FeedsData.StreamState.CONNECTED) {
            this.feedService.getBinary(
              nodeId,
              this.cacheGetBinaryRequestKey,
              this.cachedMediaType,
            );
          }
        });
      },
    );

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

    this.events.subscribe(FeedsEvent.PublishType.rpcRequestSuccess, () => {
      this.zone.run(() => {
        this.refreshChannelList();
        this.isLoadimage = {};
        this.isLoadVideoiamge = {};
        this.refreshImage();
        this.initnodeStatus(this.postList);
        this.hideComponent(null);
        this.native.hideLoading();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.openRightMenu, () => {
      this.isImgPercentageLoading[this.imgDownStatusKey] = false;
      this.isImgLoading[this.imgDownStatusKey] = false;
      this.imgDownStatus[this.imgDownStatusKey] = '';

      this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
      this.isVideoLoading[this.videoDownStatusKey] = false;
      this.videoDownStatus[this.videoDownStatusKey] = '';

      this.feedService.closeSession(this.curNodeId);
      this.curNodeId = '';
      this.pauseAllVideo();
      this.hideFullScreen();
    });

    this.events.subscribe(FeedsEvent.PublishType.streamClosed, nodeId => {
      this.isImgPercentageLoading[this.imgDownStatusKey] = false;
      this.isImgLoading[this.imgDownStatusKey] = false;
      this.imgDownStatus[this.imgDownStatusKey] = '';

      this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
      this.isVideoLoading[this.videoDownStatusKey] = false;
      this.videoDownStatus[this.videoDownStatusKey] = '';

      let mNodeId = nodeId || '';
      if (mNodeId != '') {
        this.feedService.closeSession(mNodeId);
      }
      this.pauseAllVideo();
      this.curNodeId = '';
    });

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
  }

  ionViewWillLeave() {
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = null;
    }

    this.isImgPercentageLoading[this.imgDownStatusKey] = false;
    this.isImgLoading[this.imgDownStatusKey] = false;
    this.imgDownStatus[this.imgDownStatusKey] = '';
    this.imgPercent = 0;
    this.imgRotateNum['transform'] = 'rotate(0deg)';

    this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
    this.isVideoLoading[this.videoDownStatusKey] = false;
    this.videoDownStatus[this.videoDownStatusKey] = '';
    this.videoPercent = 0;
    this.videoRotateNum['transform'] = 'rotate(0deg)';

    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.subscribeFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.unsubscribeFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.editPostFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.deletePostFinish);

    this.events.unsubscribe(FeedsEvent.PublishType.getBinaryFinish);

    this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestError);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcResponseError);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestSuccess);

    this.events.unsubscribe(FeedsEvent.PublishType.streamGetBinaryResponse);
    this.events.unsubscribe(FeedsEvent.PublishType.streamGetBinarySuccess);
    this.events.unsubscribe(FeedsEvent.PublishType.streamError);
    this.events.unsubscribe(
      FeedsEvent.PublishType.streamOnStateChangedCallback,
    );
    this.events.unsubscribe(FeedsEvent.PublishType.openRightMenu);
    this.events.unsubscribe(FeedsEvent.PublishType.streamProgress);
    this.events.unsubscribe(FeedsEvent.PublishType.streamClosed);
    this.events.unsubscribe(FeedsEvent.PublishType.friendConnectionChanged);
    this.removeImages();
    this.removeAllVideo();
    this.isLoadimage = {};
    this.isLoadVideoiamge = {};
    if (this.curNodeId != '') {
      this.feedService.closeSession(this.curNodeId);
    }
    this.curNodeId = '';
    this.events.publish(FeedsEvent.PublishType.updateTab);
    this.events.publish(FeedsEvent.PublishType.addBinaryEvevnt);
    this.events.publish(FeedsEvent.PublishType.addProflieEvent);
    this.events.publish(FeedsEvent.PublishType.notification);
    this.native.hideLoading();
    this.hideFullScreen();
  }

  ionViewDidEnter() {}

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('ChannelsPage.feeds'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  like(nodeId: string, channelId: number, postId: number) {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (this.checkServerStatus(nodeId) != 0) {
      this.native.toastWarn('common.connectionError1');
      return;
    }

    let post = this.feedService.getPostFromId(nodeId, channelId, postId);
    if (!this.feedService.checkPostIsAvalible(post)) return;

    if (this.checkMyLike(nodeId, channelId, postId)) {
      this.feedService.postUnlike(nodeId, Number(channelId), Number(postId), 0);
      return;
    }

    this.feedService.postLike(nodeId, Number(channelId), Number(postId), 0);
  }

  getChannel(nodeId: string, channelId: number): any {
    let channel = this.feedService.getChannelFromId(nodeId, channelId) || '';
    if (channel === '') {
      return '';
    } else {
      return UtilService.moreNanme(channel['name']);
    }
  }

  getContentText(content: string): string {
    return this.feedService.parsePostContentText(content);
  }

  getContentShortText(post: any): string {
    let content = post.content;
    let text = this.feedService.parsePostContentText(content) || '';
    return text.substring(0, 180) + '...';
  }

  getContentImg(content: any): string {
    return this.feedService.parsePostContentImg(content);
  }

  getPostContentTextSize(content: string) {
    let text = this.feedService.parsePostContentText(content);
    let size = UtilService.getSize(text);
    return size;
  }

  getChannelOwnerName(nodeId, channelId) {
    let channel = this.feedService.getChannelFromId(nodeId, channelId) || '';
    if (channel === '') {
      return '';
    } else {
      return UtilService.moreNanme(channel['owner_name'], 40);
    }
  }

  navToPostDetail(
    nodeId: string,
    channelId: number,
    postId: number,
    event?: any,
  ) {
    let post = this.feedService.getPostFromId(nodeId, channelId, postId);
    if (!this.feedService.checkPostIsAvalible(post)) return;

    if (this.isPress) {
      this.isPress = false;
      return;
    }
    event = event || '';
    if (event != '') {
      let e = event || window.event; //兼容IE8
      let target = e.target || e.srcElement; //判断目标事件
      if (target.tagName.toLowerCase() == 'span') {
        let url = target.textContent || target.innerText;
        this.native.clickUrl(url, event);
        return;
      }
    }
    this.pauseVideo(nodeId + '-' + channelId + '-' + postId);
    this.native
      .getNavCtrl()
      .navigateForward(['/postdetail', nodeId, channelId, postId]);
  }

  checkMyLike(nodeId: string, channelId: number, postId: number) {
    return this.feedService.checkMyLike(nodeId, channelId, postId);
  }

  checkFollowStatus(nodeId: string, channelId: number) {
    let channelsMap = this.feedService.getChannelsMap();
    let nodeChannelId = this.feedService.getChannelId(nodeId, channelId);
    if (
      channelsMap[nodeChannelId] == undefined ||
      !channelsMap[nodeChannelId].isSubscribed
    ) {
      this.followStatus = false;
    } else {
      this.followStatus = true;
    }
  }
  handleDisplayTime(createTime: number) {
    let obj = UtilService.handleDisplayTime(createTime);
    if (obj.type === 's') {
      return this.translate.instant('common.just');
    }
    if (obj.type === 'm') {
      if (obj.content === 1) {
        return obj.content + this.translate.instant('HomePage.oneminuteAgo');
      }
      return obj.content + this.translate.instant('HomePage.minutesAgo');
    }
    if (obj.type === 'h') {
      if (obj.content === 1) {
        return obj.content + this.translate.instant('HomePage.onehourAgo');
      }
      return obj.content + this.translate.instant('HomePage.hoursAgo');
    }
    if (obj.type === 'day') {
      if (obj.content === 1) {
        return this.translate.instant('common.yesterday');
      }
      return obj.content + this.translate.instant('HomePage.daysAgo');
    }
    return obj.content;
  }

  menuMore(post: FeedsData.Post) {
    if (!this.feedService.checkPostIsAvalible(post)) return;

    this.pauseAllVideo();
    let isMine = this.checkChannelIsMine();
    if (isMine === 0 && post.post_status != 1) {
      this.menuService.showPostDetailMenu(
        post.nodeId,
        Number(post.channel_id),
        this.channelName,
        post.id,
      );
    } else {
      this.menuService.showShareMenu(
        post.nodeId,
        Number(post.channel_id),
        this.channelName,
        post.id,
      );
    }
  }

  checkServerStatus(nodeId: string) {
    return this.feedService.getServerStatusFromId(nodeId);
  }

  initnodeStatus(nodeId: string) {
    let status = this.checkServerStatus(nodeId);
    this.nodeStatus[nodeId] = status;
  }

  doRefresh(event: any) {
    let sId = setTimeout(() => {
      this.images = {};
      this.startIndex = 0;
      this.init();
      this.initStatus(this.postList);
      event.target.complete();
      this.refreshImage();
      clearTimeout(sId);
    }, 500);
  }

  loadData(event: any) {
    let sId = setTimeout(() => {
      let arr = [];
      if (this.totalData.length - this.pageNumber * this.startIndex > 0) {
        arr = this.totalData.slice(
          this.startIndex * this.pageNumber,
          (this.startIndex + 1) * this.pageNumber,
        );
        this.startIndex++;
        this.zone.run(() => {
          this.initStatus(arr);
          this.postList = this.postList.concat(arr);
          this.refreshImage();
        });
        event.target.complete();
      } else {
        arr = this.totalData.slice(
          this.startIndex * this.pageNumber,
          this.totalData.length,
        );
        this.zone.run(() => {
          this.initStatus(arr);
          this.postList = this.postList.concat(arr);
        });
        this.infiniteScroll.disabled = true;
        this.refreshImage();
        event.target.complete();
        clearTimeout(sId);
      }
    }, 500);
  }

  checkChannelIsMine() {
    if (this.feedService.checkChannelIsMine(this.nodeId, this.channelId))
      return 0;

    return 1;
  }

  scrollToTop(int) {
    let sid = setTimeout(() => {
      this.content.scrollToTop(1);
      clearTimeout(sid);
    }, int);
  }

  showComment(nodeId: string, channelId: number, postId: number) {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (this.checkServerStatus(nodeId) != 0) {
      this.native.toastWarn('common.connectionError1');
      return;
    }

    let post = this.feedService.getPostFromId(nodeId, channelId, postId);
    if (!this.feedService.checkPostIsAvalible(post)) return;

    this.pauseVideo(nodeId + '-' + channelId + '-' + postId);
    this.postId = postId;
    this.onlineStatus = this.nodeStatus[nodeId];
    this.hideComment = false;
  }

  hideComponent(event: any) {
    this.postId = null;
    this.onlineStatus = null;
    this.hideComment = true;
  }

  ionScroll() {
    this.native.throttle(this.setVisibleareaImage(), 200, this, true);
  }

  setVisibleareaImage() {
    let postgridList = document.getElementsByClassName('channelgird');
    let postgridNum = document.getElementsByClassName('channelgird').length;
    for (let postgridindex = 0; postgridindex < postgridNum; postgridindex++) {
      let srcId = postgridList[postgridindex].getAttribute('id') || '';
      if (srcId != '') {
        let arr = srcId.split('-');
        let nodeId = arr[0];
        let channelId = arr[1];
        let postId = arr[2];
        let mediaType = arr[3];
        let id = nodeId + '-' + channelId + '-' + postId;
        //postImg
        if (mediaType === '1') {
          this.handlePsotImg(id, srcId, postgridindex);
        }
        if (mediaType === '2') {
          //video
          this.hanldVideo(id, srcId, postgridindex);
        }
      }
    }
  }

  handlePsotImg(id: string, srcId: string, rowindex: number) {
    // 13 存在 12不存在
    let isload = this.isLoadimage[id] || '';
    let rpostImage = document.getElementById(id + 'channelrow');
    let postImage: any = document.getElementById(id + 'postimgchannel') || '';
    try {
      if (
        id != '' &&
        postImage.getBoundingClientRect().top >= -100 &&
        postImage.getBoundingClientRect().top <= this.clientHeight
      ) {
        if (isload === '') {
          this.isLoadimage[id] = '11';
          let arr = srcId.split('-');
          let nodeId = arr[0];
          let channelId: any = arr[1];
          let postId: any = arr[2];
          let key = this.feedService.getImgThumbKeyStrFromId(
            nodeId,
            channelId,
            postId,
            0,
            0,
          );
          this.feedService
            .getData(key)
            .then(imagedata => {
              let image = imagedata || '';
              if (image != '') {
                this.isLoadimage[id] = '13';
                this.zone.run(() => {
                  postImage.setAttribute('src', image);
                });

              } else {
                this.zone.run(() => {
                  this.isLoadimage[id] = '12';
                  rpostImage.style.display = 'none';
                });
              }
            })
            .catch(reason => {
              rpostImage.style.display = 'none';
              this.logUtils.loge(
                "Excute 'handlePsotImg' in feeds page is error , get image data error, error msg is " +
                  JSON.stringify(reason),
                TAG,
              );
            });
        }
      } else {
        let postImageSrc = postImage.getAttribute('src') || '';
        if (
          postImage.getBoundingClientRect().top < -100 &&
          this.isLoadimage[id] === '13' &&
          postImageSrc != ''
        ) {
          this.isLoadimage[id] = '';
          postImage.setAttribute('src', 'assets/images/loading.png');
        }
      }
    } catch (error) {
      this.logUtils.loge(
        "Excute 'handlePsotImg' in feeds page is error , get image data error, error msg is " +
          JSON.stringify(error),
        TAG,
      );
    }
  }

  hanldVideo(id: string, srcId: string, rowindex: number) {
    let isloadVideoImg = this.isLoadVideoiamge[id] || '';
    let vgplayer = document.getElementById(id + 'vgplayerchannel');
    let video: any = document.getElementById(id + 'videochannel');
    let source: any = document.getElementById(id + 'sourcechannel');
    let downStatus = this.videoDownStatus[id] || '';
    if (id != '' && source != '' && downStatus === '') {
      this.pauseVideo(id);
    }
    try {
      if (
        id != '' &&
        video.getBoundingClientRect().top >= -100 &&
        video.getBoundingClientRect().top <= this.clientHeight
      ) {
        if (isloadVideoImg === '') {
          this.isLoadVideoiamge[id] = '11';
          let arr = srcId.split('-');
          let nodeId = arr[0];
          let channelId: any = arr[1];
          let postId: any = arr[2];
          let key = this.feedService.getVideoThumbStrFromId(
            nodeId,
            channelId,
            postId,
            0,
          );
          this.feedService
            .getData(key)
            .then(imagedata => {
              let image = imagedata || '';
              if (image != '') {
                this.isLoadVideoiamge[id] = '13';
                video.setAttribute('poster', image);
                this.setFullScreen(id);
                this.setOverPlay(id, srcId);
              } else {
                this.isLoadVideoiamge[id] = '12';
                video.style.display = 'none';
                vgplayer.style.display = 'none';
              }
            })
            .catch(reason => {
              vgplayer.style.display = 'none';
              this.logUtils.loge(
                "Excute 'hanldVideo' in feeds page is error , get video data error, error msg is" +
                  JSON.stringify(reason),
                TAG,
              );
            });
        }
      } else {
        let postSrc = video.getAttribute('poster') || '';
        if (
          video.getBoundingClientRect().top < -100 &&
          this.isLoadVideoiamge[id] === '13' &&
          postSrc != 'assets/images/loading.png'
        ) {
          video.setAttribute('poster', 'assets/images/loading.png');
          let sourcesrc = source.getAttribute('src') || '';
          if (sourcesrc != '') {
            source.removeAttribute('src');
          }
          this.isLoadVideoiamge[id] = '';
        }
      }
    } catch (error) {}
  }

  refreshImage() {
    let sid = setTimeout(() => {
      this.setVisibleareaImage();
      clearTimeout(sid);
    }, 0);
  }

  showBigImage(nodeId: string, channelId: number, postId: number) {
    this.pauseAllVideo();
    this.zone.run(() => {
      let imagesId = nodeId + '-' + channelId + '-' + postId + 'postimgchannel';
      let imagesObj = document.getElementById(imagesId);
      let imagesWidth = imagesObj.clientWidth;
      let imagesHeight = imagesObj.clientHeight;
      this.imgloadingStyleObj['position'] = 'absolute';
      this.imgloadingStyleObj['left'] =
        (imagesWidth - this.roundWidth) / 2 + 'px';
      this.imgloadingStyleObj['top'] =
        (imagesHeight - this.roundWidth) / 2 + 'px';
      this.imgCurKey = nodeId + '-' + channelId + '-' + postId;
      this.isImgLoading[this.imgCurKey] = true;

      let contentVersion = this.feedService.getContentVersion(
        nodeId,
        channelId,
        postId,
        0,
      );
      let thumbkey = this.feedService.getImgThumbKeyStrFromId(
        nodeId,
        channelId,
        postId,
        0,
        0,
      );
      let key = this.feedService.getImageKey(nodeId, channelId, postId, 0, 0);
      if (contentVersion == '0') {
        key = thumbkey;
      }
      this.feedService.getData(key).then(realImg => {
        let img = realImg || '';
        if (img != '') {
          this.isImgLoading[this.imgCurKey] = false;
          this.viewHelper.openViewer(
            this.titleBar,
            realImg,
            'common.image',
            'ChannelsPage.feeds',
            this.appService,
          );
        } else {
          if (this.checkServerStatus(nodeId) != 0) {
            this.isImgLoading[this.imgCurKey] = false;
            this.native.toastWarn('common.connectionError1');
            return;
          }

          if (this.isExitDown()) {
            this.isImgLoading[this.imgCurKey] = false;
            this.openAlert();
            return;
          }
          this.imgDownStatusKey = nodeId + '-' + channelId + '-' + postId;
          this.cachedMediaType = 'img';
          this.feedService.processGetBinary(
            nodeId,
            channelId,
            postId,
            0,
            0,
            FeedsData.MediaType.containsImg,
            key,
            transDataChannel => {
              this.cacheGetBinaryRequestKey = key;
              if (transDataChannel == FeedsData.TransDataChannel.SESSION) {
                this.imgDownStatus[this.imgDownStatusKey] = '1';
                this.isImgLoading[this.imgDownStatusKey] = false;
                this.isImgPercentageLoading[this.imgDownStatusKey] = true;
                return;
              }

              if (transDataChannel == FeedsData.TransDataChannel.MESSAGE) {
                this.imgDownStatus[this.imgDownStatusKey] = '0';
                this.curNodeId = '';
                return;
              }
            },
            err => {
              this.isImgLoading[this.imgDownStatusKey] = false;
              this.isImgPercentageLoading[this.imgDownStatusKey] = false;
              this.imgDownStatus[this.imgDownStatusKey] = '';
              this.curNodeId = '';
            },
          );
        }
      });
    });
  }

  pauseVideo(id: string) {
    let videoElement: any = document.getElementById(id + 'videochannel') || '';
    let source: any = document.getElementById(id + 'sourcechannel') || '';
    if (source != '') {
      if (!videoElement.paused) {
        //判断是否处于暂停状态
        videoElement.pause();
      }
    }
  }

  pauseAllVideo() {
    let videoids = this.isLoadVideoiamge;
    for (let id in videoids) {
      let value = videoids[id] || '';
      if (value === '13') {
        let downStatus = this.videoDownStatus[id] || '';
        if (downStatus === '') {
          this.pauseVideo(id);
        }
      }
    }
  }

  removeAllVideo() {
    let videoids = this.isLoadVideoiamge;
    for (let id in videoids) {
      let value = videoids[id] || '';
      if (value === '13') {
        let videoElement: any =
          document.getElementById(id + 'videochannel') || '';
        if (videoElement != '') {
          //videoElement.setAttribute('poster',"assets/images/loading.png"); // empty source
        }
        let source: any = document.getElementById(id + 'sourcechannel') || '';
        let sourcesrc = source.getAttribute('src') || '';
        if (source != '' && sourcesrc != '') {
          source.removeAttribute('src'); // empty source
        }
      }
    }
  }

  setFullScreen(id: string) {
    let vgfullscreen = document.getElementById(id + 'vgfullscreenchannel');
    vgfullscreen.onclick = () => {
      this.pauseVideo(id);
      let postImg: string = document
        .getElementById(id + 'videochannel')
        .getAttribute('poster');
      let videoSrc: string = document
        .getElementById(id + 'sourcechannel')
        .getAttribute('src');
      this.fullScreenmodal = this.native.setVideoFullScreen(postImg, videoSrc);
    };
  }

  hideFullScreen() {
    if (this.fullScreenmodal != '') {
      this.modalController.dismiss();
      this.fullScreenmodal = '';
    }
  }

  removeImages() {
    let iamgseids = this.isLoadimage;
    for (let id in iamgseids) {
      let value = iamgseids[id] || '';
      if (value === '13') {
        let imgElement: any =
          document.getElementById(id + 'postimgchannel') || '';
        if (imgElement != '') {
          imgElement.removeAttribute('src'); // empty source
        }
      }
    }
  }

  setOverPlay(id: string, srcId: string) {
    let vgoverlayplay: any =
      document.getElementById(id + 'vgoverlayplaychannel') || '';
    let source: any = document.getElementById(id + 'sourcechannel') || '';

    if (vgoverlayplay != '') {
      vgoverlayplay.onclick = () => {
        this.zone.run(() => {
          let sourceSrc = source.getAttribute('src') || '';
          if (sourceSrc === '') {
            this.getVideo(id, srcId);
          }
        });
      };
    }
  }

  getVideo(id: string, srcId: string) {
    let arr = srcId.split('-');
    let nodeId = arr[0];
    let channelId: any = arr[1];
    let postId: any = arr[2];

    let videoId = nodeId + '-' + channelId + '-' + postId + 'vgplayerchannel';
    let videoObj = document.getElementById(videoId);
    let videoWidth = videoObj.clientWidth;
    let videoHeight = videoObj.clientHeight;
    this.videoloadingStyleObj['z-index'] = 999;
    this.videoloadingStyleObj['position'] = 'absolute';
    this.videoloadingStyleObj['left'] =
      (videoWidth - this.roundWidth) / 2 + 'px';
    this.videoloadingStyleObj['top'] =
      (videoHeight - this.roundWidth) / 2 + 'px';
    this.videoCurKey = nodeId + '-' + channelId + '-' + postId;
    this.isVideoLoading[this.videoCurKey] = true;

    let key = this.feedService.getVideoKey(nodeId, channelId, postId, 0, 0);
    this.feedService.getData(key).then((videoResult: string) => {
      this.zone.run(() => {
        let videodata = videoResult || '';
        if (videodata == '') {

          let post = _.find(this.postList, post => {
            return (
              post.nodeId === nodeId &&
              post.channel_id == channelId &&
              post.id == postId
            );
          });
          if (!this.feedService.checkPostIsAvalible(post)) {
            this.isVideoLoading[this.videoCurKey] = false;
            this.pauseVideo(id);
            return;
          }

          if (this.checkServerStatus(nodeId) != 0) {
            this.isVideoLoading[this.videoCurKey] = false;
            this.pauseVideo(id);
            this.native.toastWarn('common.connectionError1');
            return;
          }

          if (this.isExitDown()) {
            this.isVideoLoading[this.videoCurKey] = false;
            this.pauseVideo(id);
            this.openAlert();
            return;
          }

          this.videoDownStatusKey = nodeId + '-' + channelId + '-' + postId;
          this.cachedMediaType = 'video';
          this.feedService.processGetBinary(
            nodeId,
            channelId,
            postId,
            0,
            0,
            FeedsData.MediaType.containsVideo,
            key,
            transDataChannel => {
              this.cacheGetBinaryRequestKey = key;
              if (transDataChannel == FeedsData.TransDataChannel.SESSION) {
                this.videoDownStatus[this.videoDownStatusKey] = '1';
                this.isVideoLoading[this.videoDownStatusKey] = false;
                this.isVideoPercentageLoading[this.videoDownStatusKey] = true;
                this.curNodeId = nodeId;
                return;
              }

              if (transDataChannel == FeedsData.TransDataChannel.MESSAGE) {
                this.videoDownStatus[this.videoDownStatusKey] = '0';
                this.curNodeId = '';
                return;
              }
            },
            err => {
              this.videoDownStatus[this.videoDownStatusKey] = '';
              this.isVideoLoading[this.videoDownStatusKey] = false;
              this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
              this.pauseVideo(id);
            },
          );
          return;
        }
        this.isVideoLoading[this.videoCurKey] = false;
        this.loadVideo(id, videodata);
      });
    });
  }

  loadVideo(id: string, videodata: string) {
    let source: any = document.getElementById(id + 'sourcechannel') || '';
    if (source === '') {
      return;
    }
    source.setAttribute('src', videodata);
    let vgoverlayplay: any = document.getElementById(
      id + 'vgoverlayplaychannel',
    );
    let video: any = document.getElementById(id + 'videochannel');
    let vgcontrol: any = document.getElementById(id + 'vgcontrolschannel');
    video.addEventListener('ended', () => {
      vgoverlayplay.style.display = 'block';
      vgcontrol.style.display = 'none';
    });

    video.addEventListener('pause', () => {
      vgoverlayplay.style.display = 'block';
      vgcontrol.style.display = 'none';
    });

    video.addEventListener('play', () => {
      vgcontrol.style.display = 'block';
    });

    video.addEventListener('canplay', () => {
      video.play();
    });

    video.load();
  }

  handleTotal(post: any) {
    let videoThumbKey = post.content['videoThumbKey'] || '';
    let duration = 29;
    if (videoThumbKey != '') {
      duration = videoThumbKey['duration'] || 0;
    }
    return UtilService.timeFilter(duration);
  }

  processGetBinaryResult(key: string, value: string) {
    this.native.hideLoading();
    if (key.indexOf('img') > -1) {
      this.imgDownStatus[this.imgDownStatusKey] = '';
      this.isImgLoading[this.imgDownStatusKey] = false;
      this.isImgPercentageLoading[this.imgDownStatusKey] = false;
      this.imgPercent = 0;
      this.imgRotateNum['transform'] = 'rotate(0deg)';
      this.cacheGetBinaryRequestKey = '';
      this.viewHelper.openViewer(
        this.titleBar,
        value,
        'common.image',
        'ChannelsPage.feeds',
        this.appService,
      );
    } else if (key.indexOf('video') > -1) {
      this.videoDownStatus[this.videoDownStatusKey] = '';
      this.isVideoLoading[this.videoDownStatusKey] = false;
      this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
      this.videoPercent = 0;
      this.videoRotateNum['transform'] = 'rotate(0deg)';
      let arr = this.cacheGetBinaryRequestKey.split('-');
      let nodeId = arr[0];
      let channelId: any = arr[1];
      let postId: any = arr[2];
      let id = nodeId + '-' + channelId + '-' + postId;
      this.cacheGetBinaryRequestKey = '';
      this.loadVideo(id, value);
    }
  }

  isExitDown() {
    if (
      JSON.stringify(this.videoDownStatus) == '{}' &&
      JSON.stringify(this.imgDownStatus) == '{}'
    ) {
      return false;
    }

    for (let key in this.imgDownStatus) {
      if (this.imgDownStatus[key] != '') {
        return true;
      }
    }

    for (let key in this.videoDownStatus) {
      if (this.videoDownStatus[key] != '') {
        return true;
      }
    }

    return false;
  }

  openAlert() {
    this.popover = this.popupProvider.ionicAlert(
      this,
      '',
      'common.downDes',
      this.cancel,
      'tskth.svg',
    );
  }

  cancel(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  clickAvatar() {
    if (this.channelAvatar.indexOf('data:image') > -1) {
      this.feedService.setSelsectIndex(0);
      this.feedService.setProfileIamge(this.channelAvatar);
    } else if (this.channelAvatar.indexOf('assets/images') > -1) {
      let index = this.channelAvatar.substring(
        this.channelAvatar.length - 5,
        this.channelAvatar.length - 4,
      );
      this.feedService.setSelsectIndex(index);
      this.feedService.setProfileIamge(this.channelAvatar);
    }

    this.feedService.setChannelInfo({
      nodeId: this.nodeId,
      channelId: this.channelId,
      name: this.channelName,
      des: this.channelDesc,
      followStatus: this.followStatus,
      channelSubscribes: this.channelSubscribes,
      updatedTime: this.updatedTime,
    });
    this.native.navigateForward(['/feedinfo'], '');
  }

  pressContent(postContent: string) {
    if (this.platform.is('ios')) {
      this.isPress = true;
    }
    let text = this.feedService.parsePostContentText(postContent);
    this.native
      .copyClipboard(text)
      .then(() => {
        this.native.toast_trans('common.textcopied');
      })
      .catch(() => {});
  }

  clickDashang(nodeId: string, channelId: number, postId: number) {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    let server = this.feedService.getServerbyNodeId(nodeId) || {};
    let elaAddress = server['elaAddress'] || null;
    if (elaAddress == null) {
      this.native.toast('common.noElaAddress');
      return;
    }
    this.pauseVideo(nodeId + '-' + channelId + '-' + postId);
    this.viewHelper.showPayPrompt(nodeId, channelId, elaAddress);
  }

  retry(nodeId: string, feedId: number, postId: number) {
    this.feedService.republishOnePost(nodeId, feedId, postId);
  }
}
