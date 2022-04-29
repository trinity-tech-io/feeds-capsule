import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Events } from 'src/app/services/events.service';
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
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';

import * as _ from 'lodash';
import { Logger } from 'src/app/services/logger';
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { CommonPageService } from 'src/app/services/common.page.service';
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
  public channelAvatar: string = './assets/icon/reserve.svg';
  public channelAvatarUri: string = '';
  public channelName: string = '';
  public updatedTime: number = 0;
  public channelOwner: string = '';
  public channelDesc: string = '';
  public channelSubscribes: number = 0;
  public postList: any = [];

  public channelId: string = "0";

  public followStatus: boolean = false;

  public startIndex: number = 0;
  public pageNumber: number = 5;
  public totalData: any = [];

  public styleObj: any = { width: '' };

  public hideComment = true;

  // For comment component
  public postId = null;

  private clientHeight: number = 0;
  private clientWidth: number = 0;
  private isInitLikeNum: any = {};
  private isInitLikeStatus: any = {};
  private isInitComment: any = {};
  public isLoadimage: any = {};
  public isLoadVideoiamge: any = {};
  public videoIamges: any = {};

  public cacheGetBinaryRequestKey: string = '';
  public cachedMediaType = '';

  public maxTextSize = 240;

  public fullScreenmodal: any = '';

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

  private destDid = '';
  private tippingAddress: string = "";

  private likeMap: any = {};
  private likeNumMap: any = {};
  private commentNumMap: any = {};
  private isLoadingLikeMap: any = {};
  private confirmdialog = null;
  constructor(
    private platform: Platform,
    private popoverController: PopoverController,
    private zone: NgZone,
    private events: Events,
    private native: NativeService,
    private acRoute: ActivatedRoute,
    public theme: ThemeService,
    private translate: TranslateService,
    private menuService: MenuService,
    public appService: AppService,
    public modalController: ModalController,
    public popupProvider: PopupProvider,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper,
    private postHelperService: PostHelperService,
    private feedsServiceApi: FeedsServiceApi,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController

  ) { }

  async subscribe() {
    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    await this.native.showLoading('common.waitMoment');
    try {
      await this.hiveVaultController.subscribeChannel(this.destDid, this.channelId);
      await this.hiveVaultController.syncPostFromChannel(this.destDid, this.channelId);
      await this.hiveVaultController.syncCommentFromChannel(this.destDid, this.channelId);
      await this.hiveVaultController.syncLikeDataFromChannel(this.destDid, this.channelId);
      this.initRefresh();
      this.followStatus = true;
      this.native.hideLoading();
    } catch (error) {
      this.followStatus = false;
      this.native.hideLoading();
    }
  }

  tip() {
    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (this.tippingAddress == "") {
      this.native.toast('common.noElaAddress');
      return;
    }

    this.pauseAllVideo();
    this.viewHelper.showPayPrompt(this.destDid, this.channelId, this.tippingAddress);
  }

  async unsubscribe() {

    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.menuService.showUnsubscribeMenuWithoutName(
      this.destDid,
      this.channelId,
    );
  }

  ngOnInit() {
    this.acRoute.params.subscribe(data => {
      this.destDid = data.destDid;
      this.channelId = data.channelId;
    });
  }

  async init() {
    await this.initChannelData();
    this.initRefresh();
    //this.initStatus(this.postList);
  }

  async sortChannelList() {
    let postListByChannel =
      await this.dataHelper.getPostListV3FromChannel(this.destDid, this.channelId);
    this.hideDeletedPosts = this.dataHelper.getHideDeletedPosts();
    if (!this.hideDeletedPosts) {
      postListByChannel = _.filter(postListByChannel, (item: any) => {
        return item.status != 1;
      });
    }
    return postListByChannel;
  }

  async initRefresh() {
    this.totalData = await this.sortChannelList();
    this.startIndex = 0;
    if (this.totalData.length - this.pageNumber > 0) {
      this.postList = this.totalData.slice(0, this.pageNumber);
      this.startIndex++;

      this.isLoadimage = {};
      this.isLoadVideoiamge = {};
      this.isInitLikeNum = {};
      this.isInitLikeStatus = {};
      this.isInitComment = {};
      this.refreshImage();
    } else {
      this.postList = this.totalData;
      this.isLoadimage = {};
      this.isLoadVideoiamge = {};
      this.isInitLikeNum = {};
      this.isInitLikeStatus = {};
      this.isInitComment = {};
      this.refreshImage();
    }
  }

  async refreshChannelList() {
    if (this.startIndex === 0) {
      this.initRefresh();
      return;
    }
    this.totalData = await this.sortChannelList();

    if (this.totalData.length === this.postList.length) {
      this.postList = this.totalData;
    } else if (this.totalData.length - this.pageNumber * this.startIndex > 0) {
      this.postList = this.totalData.slice(
        0,
        this.startIndex * this.pageNumber,
      );
    } else {
      this.postList = this.totalData;
    }
    this.isLoadimage = {};
    this.isLoadVideoiamge = {};
    this.isInitLikeNum = {};
    this.isInitLikeStatus = {};
    this.isInitComment = {};
    this.refreshImage();
  }

  async initChannelData() {
    let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(this.destDid, this.channelId) || null;
    await this.checkFollowStatus(this.destDid, this.channelId);
    if (channel == null || channel == undefined) return;
    this.channelName = channel.name;
    this.updatedTime = channel.updatedAt || 0;
    this.channelOwner = "";
    this.channelDesc = channel.intro;
    //this.channelSubscribes = channel.subscribers;
    this.tippingAddress = channel.tipping_address || '';
    let channelAvatarUri = channel.avatar || '';
    this.channelAvatarUri = channelAvatarUri;
    this.handleChannelAvatar(channelAvatarUri);
  }

  handleChannelAvatar(channelAvatarUri: string) {
    let fileName: string = channelAvatarUri.split("@")[0];
    this.hiveVaultController.getV3Data(this.destDid, channelAvatarUri, fileName, "0")
      .then((result) => {
        this.channelAvatar = result;
      }).catch((err) => {
      })
  }

  async ionViewWillEnter() {

    this.isMine = await this.checkChannelIsMine();
    if (this.platform.is('ios')) {
      this.isAndroid = false;
    }

    this.hideDeletedPosts = this.dataHelper.getHideDeletedPosts();
    this.clientHeight = screen.availHeight;
    this.clientWidth = screen.availWidth;
    this.styleObj.width = screen.width - 105 + 'px';
    this.initTitle();
    this.init();

    this.events.subscribe(
      FeedsEvent.PublishType.unsubscribeFinish,
      () => {
        this.zone.run(() => {
          this.native.setRootRouter(['/tabs/home']);
        });
      },
    );

    this.events.subscribe(FeedsEvent.PublishType.getCommentFinish, (comment: FeedsData.CommentV3) => {
      Logger.log(TAG, "======= Receive getCommentFinish ========");
      let postId = comment.postId;
      this.commentNumMap[postId] = this.commentNumMap[postId] + 1;
      let refcommentId = comment.refcommentId;
      let cachedCommentList = this.dataHelper.getcachedCommentList(postId, refcommentId) || [];
      cachedCommentList.push(comment);
    });

    this.events.subscribe(FeedsEvent.PublishType.deletePostFinish, (deletePostEventData: any) => {
      this.zone.run(async () => {
        await this.native.showLoading('common.waitMoment');
        try {
          let post: FeedsData.PostV3 = await this.dataHelper.getPostV3ById(deletePostEventData.destDid, deletePostEventData.postId);
          this.hiveVaultController.deletePost(post).then(async (result: any) => {
            await this.refreshChannelList();
            this.native.hideLoading();
          }).catch((err: any) => {
            this.native.hideLoading();
          })
        } catch (error) {
          this.native.hideLoading();
        }
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.openRightMenu, () => {
      this.isImgPercentageLoading[this.imgDownStatusKey] = false;
      this.isImgLoading[this.imgDownStatusKey] = false;
      this.imgDownStatus[this.imgDownStatusKey] = '';

      this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
      this.isVideoLoading[this.videoDownStatusKey] = false;
      this.videoDownStatus[this.videoDownStatusKey] = '';

      this.pauseAllVideo();
      this.hideFullScreen();
    });

    this.events.subscribe(FeedsEvent.PublishType.channelRightMenu, () => {
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

    this.events.unsubscribe(FeedsEvent.PublishType.unsubscribeFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.deletePostFinish);

    this.events.unsubscribe(FeedsEvent.PublishType.openRightMenu);
    this.events.unsubscribe(FeedsEvent.PublishType.channelRightMenu);
    this.removeImages();
    this.removeAllVideo();
    this.isLoadimage = {};
    this.isLoadVideoiamge = {};
    this.isInitLikeNum = {};
    this.isInitLikeStatus = {};
    this.isInitComment = {};
    this.native.hideLoading();
    this.hideFullScreen();
    this.native.handleTabsEvents();
  }

  ionViewDidEnter() { }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('ChannelsPage.feeds'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    if (!this.theme.darkMode) {
      this.titleBarService.setTitleBarMoreMemu(this.titleBar, "channelRightMenu", "assets/icon/dot.ico");
    } else {
      this.titleBarService.setTitleBarMoreMemu(this.titleBar, "channelRightMenu", "assets/icon/dark/dot.ico");
    }
  }

  like(destDid: string, channelId: string, postId: string) {

    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    CommonPageService.likePost(
      destDid,
      channelId,
      postId,
      this.isLoadingLikeMap,
      this.likeMap,
      this.likeNumMap,
      this.hiveVaultController,
      this.dataHelper);
  }

  getContentText(content: string): string {
    return this.feedsServiceApi.parsePostContentText(content);
  }

  getContentShortText(post: any): string {
    let content = post.content.content;
    let text = this.feedsServiceApi.parsePostContentText(content) || '';
    return text.substring(0, 180) + '...';
  }

  getContentImg(content: any): string {
    return this.feedsServiceApi.parsePostContentImg(content);
  }

  getPostContentTextSize(content: string) {
    let text = this.feedsServiceApi.parsePostContentText(content);
    let size = UtilService.getSize(text);
    return size;
  }

  getChannelOwnerName(destDid: string, channelId: string) {//todo

  }

  navToPostDetail(
    destDid: string,
    channelId: string,
    postId: string,
    event?: any,
  ) {
    // let post = this.feedService.getPostFromId(destDid, channelId, postId);
    // if (!this.feedService.checkPostIsAvalible(post)) return;

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
    this.pauseVideo(destDid + '-' + channelId + '-' + postId);
    this.native
      .getNavCtrl()
      .navigateForward(['/postdetail', destDid, channelId, postId]);
  }

  async checkFollowStatus(destDid: string, channelId: string) {

    let subscribedChannel: FeedsData.SubscribedChannelV3[] = await this.dataHelper.getSubscribedChannelV3List(FeedsData.SubscribedChannelType.ALL_CHANNEL);
    if (subscribedChannel.length === 0) {
      this.followStatus = false;
      return;
    }

    let channelIndex = _.find(subscribedChannel, (item: FeedsData.SubscribedChannelV3) => {
      return item.destDid === destDid && item.channelId === channelId;
    }) || '';
    if (channelIndex === '') {
      this.followStatus = false;
      return;
    }
    this.followStatus = true;
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

  async menuMore(post: FeedsData.PostV3) {
    // if (!this.feedService.checkPostIsAvalible(post)) return;

    this.pauseAllVideo();
    let isMine = await this.checkChannelIsMine();
    if (isMine === 1 && post.status != 1) {
      this.menuService.showPostDetailMenu(
        post.destDid,
        post.channelId,
        this.channelName,
        post.postId,
      );
    } else {
      this.menuService.showShareMenu(
        post.destDid,
        post.channelId,
        this.channelName,
        post.postId,
      );
    }
  }

  async doRefresh(event: any) {
    try {
      this.images = {};
      this.startIndex = 0;
      //TODO
      this.dataHelper.cleanCachedComment();
      this.dataHelper.cleanCacheLikeNum();
      this.dataHelper.cleanCachedLikeStatus();
      await this.hiveVaultController.syncPostFromChannel(this.destDid, this.channelId);
      await this.hiveVaultController.syncCommentFromChannel(this.destDid, this.channelId);
      await this.hiveVaultController.syncLikeDataFromChannel(this.destDid, this.channelId);
      this.init();
      event.target.complete();
    } catch (error) {
      event.target.complete();
    }
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
          //this.initStatus(arr);
          this.postList = this.postList.concat(arr);
          this.refreshImage();

        });
        event.target.complete();
      } else {

        if (this.totalData.length === this.postList.length) {
          event.target.complete();
          clearTimeout(sId);
          return;
        }

        arr = this.totalData.slice(
          this.startIndex * this.pageNumber,
          this.totalData.length,
        );
        this.zone.run(() => {
          this.postList = this.postList.concat(arr);
        });
        this.refreshImage();
        event.target.complete();
        clearTimeout(sId);
      }
    }, 500);
  }

  async checkChannelIsMine() {

    let ownerDid: string = (await this.dataHelper.getSigninData()).did;
    if (this.destDid != ownerDid) {
      return 0;
    }
    return 1;
  }

  scrollToTop(int) {
    let sid = setTimeout(() => {
      this.content.scrollToTop(1);
      clearTimeout(sid);
    }, int);
  }

  showComment(destDid: string, channelId: string, postId: string) {

    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    // if (this.checkServerStatus(destDid) != 0) {
    //   this.native.toastWarn('common.connectionError1');
    //   return;
    // }

    // let post = this.feedService.getPostFromId(destDid, channelId, postId);
    // if (!this.feedService.checkPostIsAvalible(post)) return;

    this.pauseVideo(destDid + '-' + channelId + '-' + postId);
    this.postId = postId;
    this.hideComment = false;
  }

  hideComponent(event: any) {
    this.postId = null;
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
        let destDid = arr[0];
        let channelId = arr[1];
        let postId = arr[2];
        let mediaType = arr[3];
        let id = destDid + '-' + channelId + '-' + postId;
        //post like status
        CommonPageService.handlePostLikeStatusData(
          id, srcId, postgridindex, postgridList[postgridindex],
          this.clientHeight, this.isInitLikeStatus, this.hiveVaultController,
          this.likeMap, this.isLoadingLikeMap)
        //处理post like number
        CommonPageService.handlePostLikeNumData(
          id, srcId, postgridindex, postgridList[postgridindex],
          this.clientHeight, this.hiveVaultController,
          this.likeNumMap, this.isInitLikeNum);
        //处理post comment
        CommonPageService.handlePostCommentData(
          id, srcId, postgridindex, postgridList[postgridindex],
          this.clientHeight, this.hiveVaultController,
          this.isInitComment, this.commentNumMap);
        //postImg
        if (mediaType === '1') {
          this.handlePostImg(id, srcId, postgridindex);
        }
        if (mediaType === '2') {
          //video
          this.hanldVideo(id, srcId, postgridindex);
        }
      }
    }
  }

  async handlePostImg(id: string, srcId: string, rowindex: number) {
    // 13 存在 12不存在
    let isload = this.isLoadimage[id] || '';
    let rpostImage = document.getElementById(id + 'channelrow');
    let postImage: any = document.getElementById(id + 'postimgchannel') || '';
    try {
      if (
        id != '' &&
        postImage.getBoundingClientRect().top >= -100 &&
        postImage.getBoundingClientRect().bottom <= this.clientHeight
      ) {
        if (isload === '') {
          this.isLoadimage[id] = '11';

          let arr = srcId.split('-');

          let destDid: string = arr[0];
          let postId: string = arr[2];

          let post = await this.dataHelper.getPostV3ById(destDid, postId);
          let mediaDatas = post.content.mediaData;
          const elements = mediaDatas[0];
          //缩略图
          let thumbnailKey = elements.thumbnailPath || '';
          //原图
          let imageKey = elements.originMediaPath || '';
          let type = elements.type || '';
          if (thumbnailKey === '' || imageKey === '') {
            this.isLoadimage[id] = '13';
            rpostImage.style.display = 'none';
            return;
          }
          //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
          let fileOriginName: string = imageKey.split("@")[0];
          let fileThumbnaiName: string = thumbnailKey.split("@")[0];

          //原图
          this.hiveVaultController.
            getV3Data(destDid, imageKey, fileOriginName, type, "false")
            .then(imagedata => {
              let realImage = imagedata || '';
              if (realImage != '') {
                this.isLoadimage[id] = '13';
                postImage.setAttribute('src', realImage);
              } else {
                this.hiveVaultController.
                  getV3Data(destDid, thumbnailKey, fileThumbnaiName, type).
                  then((thumbImagedata) => {
                    let thumbImage = thumbImagedata || '';
                    if (thumbImage != '') {
                      this.isLoadimage[id] = '13';
                      postImage.setAttribute('src', thumbImagedata);
                    } else {
                      this.isLoadimage[id] = '12';
                      rpostImage.style.display = 'none';
                    }
                  }).catch(() => {
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

  async hanldVideo(id: string, srcId: string, rowindex: number) {
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
        video.getBoundingClientRect().bottom <= this.clientHeight
      ) {
        if (isloadVideoImg === '') {
          this.isLoadVideoiamge[id] = '11';
          let arr = srcId.split('-');
          let destDid = arr[0];
          let postId: any = arr[2];


          let post = await this.dataHelper.getPostV3ById(destDid, postId);
          let mediaDatas = post.content.mediaData;
          const elements = mediaDatas[0];

          //缩略图
          let videoThumbnailKey = elements.thumbnailPath;
          //原图
          //let imageKey = elements.originMediaPath;
          let type = elements.type;
          //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
          let fileName: string = videoThumbnailKey.split("@")[0];
          this.hiveVaultController
            .getV3Data(destDid, videoThumbnailKey, fileName, type)
            .then(imagedata => {
              let image = imagedata || '';
              if (image != '') {
                this.isLoadVideoiamge[id] = '13';
                video.setAttribute('poster', image);
                this.setFullScreen(id);
                this.setOverPlay(id, srcId, post);
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
    } catch (error) { }
  }

  refreshImage() {
    let sid = setTimeout(() => {
      this.setVisibleareaImage();
      clearTimeout(sid);
    }, 0);
  }

  showBigImage(destDid: string, channelId: string, postId: string) {
    this.pauseAllVideo();
    this.zone.run(async () => {
      let imagesId = destDid + '-' + channelId + '-' + postId + 'postimgchannel';
      let imagesObj = document.getElementById(imagesId);
      let imagesWidth = imagesObj.clientWidth;
      let imagesHeight = imagesObj.clientHeight;
      this.imgloadingStyleObj['position'] = 'absolute';
      this.imgloadingStyleObj['left'] =
        (imagesWidth - this.roundWidth) / 2 + 'px';
      this.imgloadingStyleObj['top'] =
        (imagesHeight - this.roundWidth) / 2 + 'px';
      this.imgCurKey = destDid + '-' + channelId + '-' + postId;
      this.isImgLoading[this.imgCurKey] = true;

      let post = await this.dataHelper.getPostV3ById(destDid, postId);
      let mediaDatas = post.content.mediaData;
      const elements = mediaDatas[0];
      //原图
      let imageKey = elements.originMediaPath;
      let type = elements.type;
      //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
      let fileOriginName: string = imageKey.split("@")[0];
      //原图
      this.hiveVaultController
        .getV3Data(destDid, imageKey, fileOriginName, type, "false")
        .then(async realImg => {
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
            this.isImgLoading[this.imgCurKey] = false;
            if (this.isExitDown()) {
              this.openAlert();
              return;
            }

            this.imgDownStatusKey = destDid + '-' + channelId + '-' + postId;
            this.imgDownStatus[this.imgDownStatusKey] = '1';
            this.isImgPercentageLoading[this.imgCurKey] = true;
            this.hiveVaultController
              .getV3Data(destDid, imageKey, fileOriginName, type)
              .then(async realImg => {
                let img = realImg || '';
                this.imgDownStatus[this.imgDownStatusKey] = '';
                this.isImgPercentageLoading[this.imgCurKey] = false;
                if (img != '') {
                  this.viewHelper.openViewer(
                    this.titleBar,
                    realImg,
                    'common.image',
                    'ChannelsPage.feeds',
                    this.appService,
                    true
                  );
                }
              }).catch(() => {
                this.isImgLoading[this.imgCurKey] = false;
                this.imgDownStatus[this.imgDownStatusKey] = '';
                this.isImgPercentageLoading[this.imgCurKey] = false;
              });
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
            videoElement.setAttribute('poster',"./assets/images/loading.png"); // empty source
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
          imgElement.setAttribute('src','assets/images/loading.png')
        }
      }
    }
  }

  setOverPlay(id: string, srcId: string, post: FeedsData.PostV3) {
    let vgoverlayplay: any =
      document.getElementById(id + 'vgoverlayplaychannel') || '';
    let source: any = document.getElementById(id + 'sourcechannel') || '';

    if (vgoverlayplay != '') {
      vgoverlayplay.onclick = () => {
        this.zone.run(() => {
          let sourceSrc = source.getAttribute('src') || '';
          if (sourceSrc === '') {
            this.getVideo(id, srcId, post);
          }
        });
      };
    }
  }

  getVideo(id: string, srcId: string, post: FeedsData.PostV3) {
    let arr = srcId.split('-');
    let destDid = arr[0];
    let channelId: any = arr[1];
    let postId: any = arr[2];

    let videoId = destDid + '-' + channelId + '-' + postId + 'vgplayerchannel';
    let videoObj = document.getElementById(videoId);
    let videoWidth = videoObj.clientWidth;
    let videoHeight = videoObj.clientHeight;
    this.videoloadingStyleObj['z-index'] = 999;
    this.videoloadingStyleObj['position'] = 'absolute';
    this.videoloadingStyleObj['left'] =
      (videoWidth - this.roundWidth) / 2 + 'px';
    this.videoloadingStyleObj['top'] =
      (videoHeight - this.roundWidth) / 2 + 'px';
    this.videoCurKey = destDid + '-' + channelId + '-' + postId;
    this.isVideoLoading[this.videoCurKey] = true;

    let mediaDatas = post.content.mediaData;
    const elements = mediaDatas[0];
    let originKey = elements.originMediaPath;
    let type = elements.type;
    //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
    let fileName: string = originKey.split("@")[0];
    this.hiveVaultController
      .getV3Data(destDid, originKey, fileName, type, "false")
      .then((videoResult: string) => {
        this.zone.run(() => {
          let videodata = videoResult || '';
          if (videodata == '') {

            // if (!this.feedService.checkPostIsAvalible(post)) {
            //   this.isVideoLoading[this.videoCurKey] = false;
            //   this.pauseVideo(id);
            //   return;
            // }

            // if (this.checkServerStatus(destDid) != 0) {
            //   this.isVideoLoading[this.videoCurKey] = false;
            //   this.pauseVideo(id);
            //   this.native.toastWarn('common.connectionError1');
            //   return;
            // }

            if (this.isExitDown()) {
              this.isVideoLoading[this.videoCurKey] = false;
              this.pauseVideo(id);
              this.openAlert();
              return;
            }

            this.videoDownStatusKey = destDid + '-' + channelId + '-' + postId;
            this.videoDownStatus[this.videoDownStatusKey] = '1';
            this.isVideoLoading[this.videoDownStatusKey] = true;
            this.isVideoPercentageLoading[this.videoDownStatusKey] = false;

            this.hiveVaultController
              .getV3Data(this.destDid, originKey, fileName, type)
              .then((downVideoResult: string) => {
                let downVideodata = downVideoResult || '';
                if (downVideodata != '') {
                  this.videoDownStatus[this.videoDownStatusKey] = '';
                  this.isVideoLoading[this.videoCurKey] = false;
                  this.zone.run(() => {
                    this.loadVideo(id, downVideodata);
                  })
                }
              }).catch((err) => {
                this.videoDownStatus[this.videoDownStatusKey] = '';
                this.isVideoLoading[this.videoDownStatusKey] = false;
                this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
                this.pauseVideo(id);
              });
            return;
          }
          this.isVideoLoading[this.videoCurKey] = false;
          this.loadVideo(id, videodata);
        });
      }).catch((err) => {
        this.videoDownStatus[this.videoDownStatusKey] = '';
        this.isVideoLoading[this.videoCurKey] = false;
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
      let destDid = arrKey[0];
      let channelId = arrKey[1];
      let postId = arrKey[2];
      let id = destDid + "-" + channelId + "-" + postId;
      let postImage = document.getElementById(id + 'postimgchannel') || null;
      if (postImage != null) {
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
      let destDid = arr[0];
      let channelId: any = arr[1];
      let postId: any = arr[2];
      let id = destDid + '-' + channelId + '-' + postId;
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

  async clickAvatar() {
    if (this.channelAvatar.indexOf('data:image') > -1 ||
      this.channelAvatar.startsWith('https:')) {
      this.dataHelper.setSelsectIndex(0);
      this.dataHelper.setProfileIamge(this.channelAvatar);
    } else if (this.channelAvatar.indexOf('assets/images') > -1) {
      let index = this.channelAvatar.substring(
        this.channelAvatar.length - 5,
        this.channelAvatar.length - 4,
      );
      this.dataHelper.setSelsectIndex(index);
      this.dataHelper.setProfileIamge(this.channelAvatar);
    }
    let ownerDid: string = (await this.dataHelper.getSigninData()).did;
    this.dataHelper.setChannelInfo({
      destDid: this.destDid,
      channelId: this.channelId,
      name: this.channelName,
      des: this.channelDesc,
      followStatus: this.followStatus,
      channelSubscribes: this.channelSubscribes,
      updatedTime: this.updatedTime,
      channelOwner: this.channelOwner,
      ownerDid: ownerDid,
      tippingAddress: this.tippingAddress
    });
    this.native.navigateForward(['/feedinfo'], '');
  }

  pressContent(postContent: string) {
    if (this.platform.is('ios')) {
      this.isPress = true;
    }
    let text = this.feedsServiceApi.parsePostContentText(postContent);
    this.native
      .copyClipboard(text)
      .then(() => {
        this.native.toast_trans('common.textcopied');
      })
      .catch(() => { });
  }

  clickDashang(destDid: string, channelId: string, postId: string) {

    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (this.tippingAddress == "") {
      this.native.toast('common.noElaAddress');
      return;
    }
    this.pauseVideo(destDid + '-' + channelId + '-' + postId);
    this.viewHelper.showPayPrompt(destDid, channelId, this.tippingAddress);
  }

  retry(destDid: string, channelId: string, postId: string) {
  }

}
