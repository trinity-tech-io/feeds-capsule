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
import { PostHelperService } from 'src/app/services/post_helper.service';

import * as _ from 'lodash';
import { Logger } from 'src/app/services/logger';
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
    public popupProvider: PopupProvider,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper,
    private postHelperService: PostHelperService
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
    this.channelOwner = channel.owner_name;
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

    this.events.subscribe(FeedsEvent.PublishType.channelRightMenu,()=>{
         this.clickAvatar();
    });
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
    this.events.unsubscribe(FeedsEvent.PublishType.channelRightMenu);
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
    this.events.publish(FeedsEvent.PublishType.search);
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
    if(!this.theme.darkMode){
      this.titleBarService.setTitleBarMoreMemu(this.titleBar,"channelRightMenu","assets/icon/dot.ico");
    }else{
      this.titleBarService.setTitleBarMoreMemu(this.titleBar,"channelRightMenu","assets/icon/dark/dot.ico");
    }
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
      if (this.totalData.length - this.pageNumber * this.startIndex > this.pageNumber) {
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
          let imageKey = this.feedService.getImageKey(nodeId, channelId, postId, 0, 0);
          let thumbkey = this.feedService.getImgThumbKeyStrFromId(
            nodeId,
            channelId,
            postId,
            0,
            0,
          );
          let contentVersion = this.feedService.getContentVersion(
            nodeId,
            channelId,
            postId,
            0,
          );

          if (contentVersion == '0') {
            imageKey = thumbkey;
          }

          const content: FeedsData.Content = this.feedService.getContentFromId(nodeId, channelId, postId, 0);
          if (content.version == '2.0') {
            postImage.setAttribute('src', './assets/icon/reserve.svg');
            const mediaDatas = content.mediaDatas;
            if (mediaDatas && mediaDatas.length > 0) {
              const elements = mediaDatas[0];
              this.postHelperService.getPostData(elements.thumbnailCid, elements.type)
                .then((value) => {
                  let thumbImage = value || "";
                  postImage.setAttribute('src', thumbImage);

                  // if (thumbImage != '') {
                  //   this.isLoadimage[id] = '13';

                  //   if (nftOrdeId != '' && priceDes != '') {
                  //     let imagesWidth = postImage.clientWidth;
                  //     let homebidfeedslogo = document.getElementById(
                  //       id + 'homebidfeedslogo'
                  //     );
                  //     homebidfeedslogo.style.left = (imagesWidth - 90) / 2 + 'px';
                  //     homebidfeedslogo.style.display = 'block';

                  //     let homebuy = document.getElementById(id + 'homebuy');
                  //     let homeNftPrice = document.getElementById(
                  //       id + 'homeNftPrice'
                  //     );
                  //     let homeNftQuantity = document.getElementById(
                  //       id + 'homeNftQuantity'
                  //     );
                  //     let homeMaxNftQuantity = document.getElementById(
                  //       id + 'homeMaxNftQuantity'
                  //     );
                  //     homeNftPrice.innerText = priceDes;
                  //     homeNftQuantity.innerText = nftQuantity;
                  //     homeMaxNftQuantity.innerText = nftQuantity;
                  //     homebuy.style.display = 'block';
                  //   }
                  //   rpostimg.style.display = 'block';
                  // } else {
                  //   this.isLoadimage[id] = '12';
                  //   rpostimg.style.display = 'none';
                  // }
                })
                .catch(() => {
                  //TODO
                });
            }
            return;
          }

          this.feedService
            .getData(imageKey)
            .then(imagedata => {
              let realImage = imagedata || '';
              if (realImage != '') {
                this.isLoadimage[id] = '13';
                postImage.setAttribute('src', realImage);
              } else {
                this.feedService.getData(thumbkey).then((thumbImagedata) =>{
                  let thumbImage = thumbImagedata || '';
                  if(thumbImage!= ''){
                    this.isLoadimage[id] = '13';
                    postImage.setAttribute('src', thumbImagedata);
                  }else{
                    this.isLoadimage[id] = '12';
                    rpostImage.style.display = 'none';
                  }
                }).catch(()=>{
                  rpostImage.style.display = 'none';
                })
              }
            })
            .catch(reason => {
              rpostImage.style.display = 'none';
              Logger.error(TAG,
                "Excute 'handlePsotImg' in feeds page is error , get image data error, error msg is ",
                reason
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
      Logger.error(TAG,
        "Excute 'handlePsotImg' in feeds page is error , get image data error, error msg is ",
        error
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

          const content: FeedsData.Content = this.feedService.getContentFromId(nodeId, channelId, postId, 0);
          if (content.version == '2.0') {
            video.setAttribute('poster', './assets/icon/reserve.svg');
            const mediaDatas = content.mediaDatas;
            if (mediaDatas && mediaDatas.length > 0) {
              const elements = mediaDatas[0];
              this.postHelperService.getPostData(elements.thumbnailCid, elements.type)
                .then((value) => {
                  let thumbImage = value || "";
                  this.isLoadVideoiamge[id] = '13';
                  video.setAttribute('poster', thumbImage);

                  //video.
                  this.setFullScreen(id);
                  this.setOverPlay(id, srcId);
                  // if (thumbImage != '') {
                  //   this.isLoadimage[id] = '13';

                  //   if (nftOrdeId != '' && priceDes != '') {
                  //     let imagesWidth = postImage.clientWidth;
                  //     let homebidfeedslogo = document.getElementById(
                  //       id + 'homebidfeedslogo'
                  //     );
                  //     homebidfeedslogo.style.left = (imagesWidth - 90) / 2 + 'px';
                  //     homebidfeedslogo.style.display = 'block';

                  //     let homebuy = document.getElementById(id + 'homebuy');
                  //     let homeNftPrice = document.getElementById(
                  //       id + 'homeNftPrice'
                  //     );
                  //     let homeNftQuantity = document.getElementById(
                  //       id + 'homeNftQuantity'
                  //     );
                  //     let homeMaxNftQuantity = document.getElementById(
                  //       id + 'homeMaxNftQuantity'
                  //     );
                  //     homeNftPrice.innerText = priceDes;
                  //     homeNftQuantity.innerText = nftQuantity;
                  //     homeMaxNftQuantity.innerText = nftQuantity;
                  //     homebuy.style.display = 'block';
                  //   }
                  //   rpostimg.style.display = 'block';
                  // } else {
                  //   this.isLoadimage[id] = '12';
                  //   rpostimg.style.display = 'none';
                  // }
                })
                .catch(() => {
                  //TODO
                });
            }
            return;
          }


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
              Logger.error(TAG,
                "Excute 'hanldVideo' in feeds page is error , get video data error, error msg is",
                reason
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

      const content: FeedsData.Content = this.feedService.getContentFromId(nodeId, channelId, postId, 0);
      if (content.version == '2.0') {
        const mediaDatas = content.mediaDatas;
        if (mediaDatas && mediaDatas.length > 0) {
          const elements = mediaDatas[0];
          this.postHelperService.getPostData(elements.originMediaCid, elements.type)
            .then((value) => {
              this.imgCurKey = nodeId + '-' + channelId + '-' + postId;
              this.isImgLoading[this.imgCurKey] = false;
              this.imgDownStatusKey = nodeId + '-' + channelId + '-' + postId;
              this.viewHelper.openViewer(
                this.titleBar,
                value,
                'common.image',
                'ChannelsPage.feeds',
                this.appService,
              );
            })
            .catch(() => {
              //TODO
            });
        }
        return;
      }

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
            true
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

    const content: FeedsData.Content = this.feedService.getContentFromId(nodeId, channelId, postId, 0);
    if (content.version == '2.0') {
      // video.setAttribute('src', './assets/icon/reserve.svg');
      const mediaDatas = content.mediaDatas;
      if (mediaDatas && mediaDatas.length > 0) {
        const elements = mediaDatas[0];

        // this.loadVideo(id, 'http://ipfs.trinity-feeds.app/ipfs/' + elements.originMediaCid);
        this.postHelperService.getPostData(elements.originMediaCid, elements.type)
          .then((value) => {
            this.isVideoLoading[this.videoCurKey] = false;
            this.loadVideo(id, value);
          })
          .catch(() => {
            //TODO
          });
      }
      return;
    }

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
      let arrKey = key.split('-');
      let nodeId = arrKey[0];
      let channelId = arrKey[1];
      let postId = arrKey[2];
      let id = nodeId+"-"+channelId+"-"+postId;
      let postImage = document.getElementById(id + 'postimgchannel') || null;
      if(postImage!=null){
        postImage.setAttribute('src', value);
      }
      this.viewHelper.openViewer(
        this.titleBar,
        value,
        'common.image',
        'ChannelsPage.feeds',
        this.appService,
        true
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
    if (this.channelAvatar.indexOf('data:image') > -1 ||
       this.channelAvatar.startsWith('https:')) {
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
      channelOwner:this.channelOwner
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
