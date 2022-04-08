import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalController, Platform } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { MenuService } from 'src/app/services/MenuService';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from '@ngx-translate/core';
import { UtilService } from 'src/app/services/utilService';
import { IonInfiniteScroll, PopoverController } from '@ionic/angular';
import { AppService } from 'src/app/services/AppService';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';

import _ from 'lodash';
import { Logger } from 'src/app/services/logger';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { DataHelper } from 'src/app/services/DataHelper';

let TAG: string = 'Feeds-commentlist';

@Component({
  selector: 'app-commentlist',
  templateUrl: './commentlist.page.html',
  styleUrls: ['./commentlist.page.scss'],
})
export class CommentlistPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonInfiniteScroll, { static: true })
  infiniteScroll: IonInfiniteScroll;

  public destDid: string = '';
  public channelId: string = "";
  public postId: string = "";
  public startIndex: number = 0;
  public pageNumber: number = 5;
  public totalData: any = [];

  public styleObj: any = { width: '' };
  public dstyleObj: any = { width: '' };

  public hideComment = true;

  public isOwnComment = {};

  public userNameList: any = {};

  public isPress: boolean = false;
  public isAndroid: boolean = true;
  public commentId: string = "";
  public replayCommentList = [];
  public hideDeletedComments: boolean = false;
  public isFullContent = {};
  public maxTextSize = 240;
  public popover: any = null;
  public channelAvatar: string = '';
  public channelName: string = '';
  public commentsNum: number = 0;
  public captainComment: any = {};
  public avatar: string = '';
  public updatedAt: number = 0;
  public channelOwner: string = '';
  public curComment: any = {};
  public refcommentId: string = "0";
  public captainCommentList = [];
  public likedCommentMap: any = {};
  public likedCommentNum: any = {};
  constructor(
    private platform: Platform,
    private popoverController: PopoverController,
    private acRoute: ActivatedRoute,
    private events: Events,
    private zone: NgZone,
    private native: NativeService,
    private feedService: FeedService,
    public theme: ThemeService,
    private translate: TranslateService,
    public menuService: MenuService,
    public appService: AppService,
    public modalController: ModalController,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper,
    private feedsServiceApi: FeedsServiceApi,
    private hiveVaultController: HiveVaultController,
    private dataHelper: DataHelper
  ) { }

  initData(isInit: boolean) {
    if (isInit) {
      this.initRefresh();
    } else {
      this.refreshCommentList();
    }
  }

  initRefresh() {
    this.startIndex = 0;
    this.totalData = this.sortCommentList();
    if (this.totalData.length - this.pageNumber > 0) {
      this.replayCommentList = this.totalData.slice(0, this.pageNumber);

      this.startIndex++;
      this.infiniteScroll.disabled = false;
    } else {
      this.replayCommentList = this.totalData;
      this.infiniteScroll.disabled = true;
    }
    this.initOwnCommentObj();
  }

  initOwnCommentObj() {
    _.each(this.replayCommentList, replayItem => {
      let key = replayItem['commentId'];
      this.userNameList[key] = replayItem['createrDid'];
      this.checkCommentIsMine(replayItem);
    });
  }

  refreshCommentList() {
    this.totalData = this.sortCommentList();
    if (
      this.startIndex != 0 &&
      this.totalData.length - this.pageNumber * this.startIndex > 0
    ) {
      this.replayCommentList = this.totalData.slice(
        0,
        this.startIndex * this.pageNumber,
      );
      this.infiniteScroll.disabled = false;
    } else {
      this.replayCommentList = this.totalData;
      this.infiniteScroll.disabled = true;
    }
    this.initOwnCommentObj();
  }

  sortCommentList() {
    let replayCommentList = [];
    replayCommentList = _.filter(this.captainCommentList, (item: FeedsData.CommentV3) => {
      return item.refcommentId === this.commentId;
    });
    this.commentsNum = replayCommentList.length;
    this.hideDeletedComments = this.feedService.getHideDeletedComments();
    if (!this.hideDeletedComments) {
      replayCommentList = _.filter(replayCommentList, (item: any) => {
        return item.status != 1;
      });
    }

    return replayCommentList;
  }

  ngOnInit() {
    this.acRoute.queryParams.subscribe(async data => {
      this.destDid = data.destDid;
      this.channelId = data.channelId;
      this.postId = data.postId;
      this.commentId = data.commentId;
      let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(this.destDid, this.channelId) || null;
      if (channel != null) {
        this.channelOwner = UtilService.resolveAddress(channel.destDid);
      }
      this.userNameList[this.commentId] = data.destDid || '';
    });
  }

  async ionViewWillEnter() {
    if (this.platform.is('ios')) {
      this.isAndroid = false;
    }
    this.hideDeletedComments = this.feedService.getHideDeletedComments();
    this.initTitle();
    this.styleObj.width = screen.width - 55 + 'px';
    this.dstyleObj.width = screen.width - 105 + 'px';
    await this.getCaptainComment();
    this.initData(true);
    //this.feedService.refreshPostById(this.destDid, this.channelId, this.postId);

    this.events.subscribe(FeedsEvent.PublishType.commentDataUpdate, () => {
      this.zone.run(() => {
        Logger.log(TAG, 'Received commentDataUpdate event');
        this.startIndex = 0;
        this.initData(true);
      });
    });

    this.events.subscribe(
      FeedsEvent.PublishType.getCommentFinish,
      (getCommentData: FeedsData.CommentV3) => {
        this.zone.run(async () => {
          await this.getCaptainComment();
          this.startIndex = 0;
          this.initData(true);

        });
      },
    );

    this.events.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      Logger.log(TAG, 'Received updateTitle event');
      if (this.menuService.postDetail != null) {
        this.menuService.hideActionSheet();
        this.menuMore();
      }

      if (this.menuService.replyDetail != null) {
        this.menuService.hideReplyActionSheet();
        this.openEditTool(this.curComment);
      }
      this.initTitle();
    });

    this.events.subscribe(FeedsEvent.PublishType.editCommentFinish, () => {
      Logger.log(TAG, 'Received editCommentFinish event');
      this.initData(false);
    });

    this.events.subscribe(FeedsEvent.PublishType.deleteCommentFinish, async (comment) => {
      Logger.log(TAG, 'Received deleteCommentFinish event');
      await this.native.showLoading('common.waitMoment');
      try {
        this.hiveVaultController
          .deleteComment(comment)
          .then(async (result: any) => {
            await this.getCaptainComment();
            this.initData(false);
            this.native.hideLoading();
          }).catch(() => {
            this.native.hideLoading();
          })
      } catch (error) {
        this.native.hideLoading();
      }

    });

    this.events.subscribe(FeedsEvent.PublishType.rpcRequestError, () => {
      this.zone.run(() => {
        Logger.log(TAG, 'Received rpcRequest error event');
        this.native.hideLoading();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.rpcResponseError, () => {
      this.zone.run(() => {
        Logger.log(TAG, 'Received rpcResponse error event');
        this.native.hideLoading();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.rpcRequestSuccess, () => {
      this.zone.run(() => {
        Logger.log(TAG, 'Received rpcRequest success event');
        this.startIndex = 0;
        this.initRefresh();
        this.native.hideLoading();
        this.hideComment = true;
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.openRightMenu, () => {
      Logger.log(TAG, 'Received openRightMenu event');
    });
  }

  ionViewWillLeave() {
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = null;
    }

    this.events.unsubscribe(FeedsEvent.PublishType.editCommentFinish);

    this.events.unsubscribe(FeedsEvent.PublishType.commentDataUpdate);
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);

    this.events.unsubscribe(FeedsEvent.PublishType.deleteCommentFinish);

    this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestError);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcResponseError);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestSuccess);
    this.events.publish(FeedsEvent.PublishType.updateTab);
    this.events.publish(FeedsEvent.PublishType.addProflieEvent);
    this.events.unsubscribe(FeedsEvent.PublishType.getCommentFinish);
  }

  ionViewDidLeave() {
    this.menuService.hideActionSheet();
    this.hideComment = true;
    this.isOwnComment = {};
  }

  ionViewDidEnter() { }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('CommentlistPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  getContentText(): string {
    return this.captainComment.content;
  }

  getContentImg(content: any): string {
    return this.feedsServiceApi.parsePostContentImg(content);
  }

  indexText(text: string, limit: number, indexLength: number): string {
    return this.feedService.indexText(text, limit, indexLength);
  }

  showComment(comment: FeedsData.CommentV3) {
    this.channelName = comment.createrDid;
    this.channelAvatar = '';
    this.refcommentId = comment.commentId;

    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.hideComment = false;
  }

  checkMyLike() {
    return this.feedService.checkMyLike(
      this.destDid,
      this.channelId,
      this.postId,
    );
  }

  checkLikedComment(commentId: number) {
    return this.feedService.checkLikedComment(
      this.destDid,
      this.channelId,
      this.postId,
      commentId,
    );
  }

  likeComment(comment: FeedsData.CommentV3) {

    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    let destDid = comment.destDid;
    let channelId = comment.channelId;
    let postId = comment.postId;
    let commentId = comment.commentId;

    let isLike = this.likedCommentMap[commentId] || '';
    if (isLike === '') {
      try {
        this.likedCommentMap[commentId] = "like";
        this.likedCommentNum[commentId] = this.likedCommentNum[commentId] + 1;
        this.hiveVaultController.like(destDid, channelId, postId, commentId);
      } catch (err) {
        this.likedCommentMap[commentId] = "";
        this.likedCommentNum[commentId] = this.likedCommentNum[commentId] - 1;
      }
    } else {
      try {
        this.likedCommentMap[commentId] = "";
        this.likedCommentNum[commentId] = this.likedCommentNum[commentId] - 1;
        this.hiveVaultController.removeLike(destDid, channelId, postId, commentId);
      } catch (error) {
        this.likedCommentMap[postId] = "like";
        this.likedCommentNum[commentId] = this.likedCommentNum[commentId] + 1;
      }
    }
  }

  handleUpdateDate(updatedTime: number) {
    let updateDate = new Date(updatedTime);
    return UtilService.dateFormat(updateDate, 'yyyy-MM-dd HH:mm:ss');
  }

  doRefresh(event: any) {
    let sId = setTimeout(() => {
      this.getCaptainComment();
      this.initData(true);
      event.target.complete();
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
          this.replayCommentList = this.replayCommentList.concat(arr);
        });
        this.initOwnCommentObj();
        event.target.complete();
      } else {
        arr = this.totalData.slice(
          this.startIndex * this.pageNumber,
          this.totalData.length,
        );
        this.zone.run(() => {
          this.replayCommentList = this.replayCommentList.concat(arr);
        });
        this.infiniteScroll.disabled = true;
        this.initOwnCommentObj();
        event.target.complete();
        clearTimeout(sId);
      }
    }, 500);
  }

  userName(userName: string) {
    let name = userName || '';

    if (name != '') {
      this.viewHelper.createTip(name);
    }
  }

  async openEditTool(comment: any) {
    this.curComment = comment;
    this.menuService.showReplyDetailMenu(comment);
  }

  handleCommentStatus() {
    let status = '(edit)';
    return status;
  }

  checkCommentIsMine(comment: FeedsData.CommentV3) {
    let commentId = comment.commentId;
    let createrDid = comment.createrDid;
    let isOwnComment = false;
    let signInData: FeedsData.SignInData = this.feedService.getSignInData() || null;
    if (signInData === null) {
      isOwnComment = false;
    }
    let ownerDid: string = signInData.did;
    if (createrDid != ownerDid) {
      isOwnComment = false;
    } else {
      isOwnComment = true;
    }
    this.isOwnComment[commentId] = isOwnComment;
  }

  hideComponent(event) {
    this.hideComment = true;
  }

  getPostContentTextSize(content: string) {
    let size = UtilService.getSize(content);
    return size;
  }

  handleCommentContent(text: string) {
    return text.substring(0, 180);
  }

  showFullContent(commentId: string) {
    this.isFullContent[commentId] = true;
  }

  hideFullContent(commentId: string) {
    this.isFullContent[commentId] = false;
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

  clickUrl(event: any) {
    event = event || '';
    if (event != '') {
      let e = event || window.event; //兼容IE8
      let target = e.target || e.srcElement; //判断目标事件
      if (target.tagName.toLowerCase() == 'span') {
        if (this.isPress) {
          this.isPress = false;
          return;
        }
        let url = target.textContent || target.innerText;
        this.native.clickUrl(url, event);
      }
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

  checkServerStatus(nodeId: string) {
    return this.feedService.getServerStatusFromId(nodeId);
  }

  async getCaptainComment() {
    let captainCommentList = [];
    try {
      captainCommentList =
        await this.hiveVaultController.getCommentsByPost(
          this.destDid,
          this.channelId,
          this.postId,
        ) || [];
    } catch (error) {
      captainCommentList = [];
    }
    this.captainCommentList = _.cloneDeep(captainCommentList);
    this.captainComment = _.find(captainCommentList, (item: FeedsData.CommentV3) => {
      return item.commentId == this.commentId;
    });

    let commentId = this.captainComment.commentId;
    this.userNameList[commentId] = this.captainComment.createrDid;
    this.updatedAt = this.captainComment['updatedAt'];
    this.checkCommentIsMine(this.captainComment);
    this.initLikeData(this.destDid, this.channelId, this.postId, commentId);
  }

  menuMore() {
    this.menuService.showCommentDetailMenu(this.captainComment);
  }

  handleText(text: string) {
    return UtilService.resolveAddress(text);
  }

  initLikeData(destDid: string, channelId: string, postId: string, commentId: string) {
    try {
      this.hiveVaultController.getLikeById(
        destDid, channelId, postId, commentId).then((likeList) => {
          let list = likeList || [];

          //计算comment like的数量
          this.likedCommentNum[commentId] = list.length;

          //检测comment like状态
          let index = _.find(list, (item) => {
            return item.channelId === channelId && item.postId === postId && item.commentId === commentId;
          }) || "";
          if (index === "") {
            this.likedCommentMap[commentId] = "";
          } else {
            this.likedCommentMap[commentId] = "like";
          }

        }).catch((err) => {
          this.likedCommentMap[commentId] = "";
          this.likedCommentNum[commentId] = 0;
        });
    } catch (err) {
      //this.likesNum = 0;
      this.likedCommentMap[commentId] = "";
      this.likedCommentNum[commentId] = 0;
    }
  }
}
