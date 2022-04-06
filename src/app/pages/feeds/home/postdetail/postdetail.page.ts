import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalController, Platform } from '@ionic/angular';
import { Events } from 'src/app/services/events.service';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { MenuService } from 'src/app/services/MenuService';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from '@ngx-translate/core';
import { UtilService } from 'src/app/services/utilService';
import { IonInfiniteScroll, PopoverController } from '@ionic/angular';
import { AppService } from 'src/app/services/AppService';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import * as _ from 'lodash';
import { Logger } from 'src/app/services/logger';
import { PostHelperService } from 'src/app/services/post_helper.service';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { result } from 'lodash';

let TAG: string = 'Feeds-postview';
@Component({
  selector: 'app-postdetail',
  templateUrl: './postdetail.page.html',
  styleUrls: ['./postdetail.page.scss'],
})
export class PostdetailPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonInfiniteScroll, { static: true })
  infiniteScroll: IonInfiniteScroll;
  public postImage: string = 'assets/images/loading.png';
  public connectionStatus: number = 1;
  public nodeStatus: any = {};
  public avatar: string = '';

  public channelAvatar: string = './assets/icon/reserve.svg';
  public channelName: string = '';
  public commentAvatar: string = '';
  public commentName: string = '';
  public channelWName: string = '';
  public channelOwner: string = '';
  public channelWOwner: string = '';
  public postContent: FeedsData.postContentV3 = null;
  public updatedTime: number = 0;
  public likesNum: number = 0;
  public commentsNum: number = 0;

  public captainCommentList: any = [];

  public destDid: string = '';
  public channelId: string = "0";
  public postId: string = "";
  public startIndex: number = 0;
  public pageNumber: number = 5;
  public totalData: any = [];

  public popover: any;

  public postStatus: number = 0;
  public styleObj: any = { width: '' };
  public dstyleObj: any = { width: '' };

  public hideComment = true;

  public videoPoster: string = '';
  public posterImg: string = '';
  public videoObj: string = '';
  public videoisShow: boolean = false;

  public cacheGetBinaryRequestKey = '';
  public cachedMediaType = '';

  public mediaType: FeedsData.MediaType;

  public fullScreenmodal: any = '';

  public hideDeletedComments: boolean = false;

  public maxTextSize = 240;

  public isFullContent = {};

  public isOwnComment = {};

  public userNameList: any = {};

  public isPress: boolean = false;
  public roundWidth: number = 40;
  /**
   * imgPercentageLoading
   */
  public isImgPercentageLoading: boolean = false;
  public imgPercent: number = 0;
  public imgRotateNum: any = {};
  /**
   * imgloading
   */
  public isImgLoading: boolean = false;
  public imgloadingStyleObj: any = {};
  public imgDownStatus: string = '';

  /**
   * videoPercentageLoading
   */
  public isVideoPercentageLoading: boolean = false;
  public videoPercent: number = 0;
  public videoRotateNum: any = {};
  /**
   * videoloading
   */
  public isVideoLoading: boolean = false;
  public videoloadingStyleObj: any = {};
  public videoDownStatus: string = '';

  public isAndroid: boolean = true;

  public refcommentId: string = '0';

  public commentId: string = '';

  public curComment: any = {};
  private maxCount: number = 0;
  private post: FeedsData.PostV3 = null;
  private channelAvatarUri: string = null;
  public isLike: boolean = false;
  public likedCommentMap: any = {};
  public likedCommentNum: any = {};
  public commentNum:any = {};
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
    private postHelperService: PostHelperService,
    private feedsServiceApi: FeedsServiceApi,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController

  ) { }


  async initData(isInit: boolean) {
    let channel :FeedsData.ChannelV3 =
      await this.feedService.getChannelFromIdV3(this.destDid, this.channelId) || null;
    this.channelOwner = channel.destDid || ''
    this.channelWName = channel['name'] || '';
    this.channelName = UtilService.moreNanme(channel['name']);
    let channelAvatarUri = channel['avatar'] || '';
    this.channelAvatarUri
    if(channelAvatarUri != ''){
      this.channelAvatarUri = channelAvatarUri;
       this.handleChannelAvatar(channelAvatarUri);
    }
    this.initPostContent();
    this.initnodeStatus();
    if (isInit) {
      this.initRefresh();
    } else {
      this.refreshCommentList();
    }
  }

  handleChannelAvatar(channelAvatarUri: string){
    let fileName:string = "channel-avatar-"+channelAvatarUri.split("@")[0];
    this.hiveVaultController.getV3Data(this.destDid,channelAvatarUri,fileName,"0")
    .then((result)=>{
       this.channelAvatar = result;
    }).catch((err)=>{
    })
  }

 async initRefresh() {
    this.startIndex = 0;
    this.totalData = await this.sortCommentList();
    if (this.totalData.length - this.pageNumber > 0) {
      this.captainCommentList = this.totalData.slice(0, this.pageNumber);

      this.startIndex++;
      this.infiniteScroll.disabled = false;
    } else {
      this.captainCommentList = this.totalData;
      this.infiniteScroll.disabled = true;
    }
    this.initOwnCommentObj();
    //this.totalData = this.sortCommentList();
  }

  initOwnCommentObj() {
    let captainCommentList = _.cloneDeep(this.captainCommentList);

    _.each(captainCommentList, (item: FeedsData.CommentV3) => {
      let key = item.commentId;
      this.userNameList[key] = item.destDid;
      this.checkCommentIsMine(item);
      // let commentId = item.commentId;
      // let replayCommentList =
      //   this.feedService.getReplayCommentList(
      //     this.destDid,
      //     this.channelId,
      //     this.postId,
      //     commentId,
      //   ) || [];
      // item['replayCommentSum'] = replayCommentList.length;
    });

    this.captainCommentList = _.cloneDeep(captainCommentList);
  }

 async refreshCommentList() {
    this.totalData = await this.sortCommentList();
    if (
      this.startIndex != 0 &&
      this.totalData.length - this.pageNumber * this.startIndex > 0
    ) {
      this.captainCommentList = this.totalData.slice(
        0,
        this.startIndex * this.pageNumber,
      );
      this.infiniteScroll.disabled = false;
    } else {
      this.captainCommentList = this.totalData;
      this.infiniteScroll.disabled = true;
    }
    this.initOwnCommentObj();
  }

 async sortCommentList() {
  let captainCommentList = [];
    try {
      captainCommentList =
      await this.hiveVaultController.getCommentsByPost(
         this.destDid,
         this.channelId,
         this.postId,
       ) || [];
    } catch (error) {

    }

    captainCommentList =  _.filter(captainCommentList,(item: FeedsData.CommentV3)=>{
            return item.refcommentId === '0';
    });

    this.hideDeletedComments = this.feedService.getHideDeletedComments();
    if (!this.hideDeletedComments) {
      captainCommentList = _.filter(captainCommentList, (item: any) => {
        return item.status != 1;
      });
    }

    this.maxCount = captainCommentList.length;
    return captainCommentList;
  }

  ngOnInit() {
    this.acRoute.params.subscribe(data => {
      this.destDid = data.destDid;
      this.channelId = data.channelId;
      this.postId = data.postId;
    });
  }

  async initPostContent() {
    let post: any = await this.dataHelper.getPostV3ById(this.destDid, this.postId);
    this.post = post;
    this.postStatus = post.status || 0;
    this.mediaType = post.content.mediaType;
    this.postContent = post.content.content;
    this.updatedTime = post.updatedAt;

    if (this.mediaType === FeedsData.MediaType.containsImg) {
      this.getImage(post);
    }
    if (this.mediaType === FeedsData.MediaType.containsVideo) {
      this.getVideoPoster(post);
    }

    this.getPostLikeNum(post);
    this.getPostComments(post);
  }

  ionViewWillEnter() {
    if (this.platform.is('ios')) {
      this.isAndroid = false;
    }

    this.hideDeletedComments = this.feedService.getHideDeletedComments();
    this.initTitle();
    this.styleObj.width = screen.width - 55 + 'px';
    this.dstyleObj.width = screen.width - 105 + 'px';
    this.initData(true);
    this.connectionStatus = this.feedService.getConnectionStatus();
    // this.feedService.refreshPostById(this.destDid, this.channelId, this.postId);

    this.events.subscribe(FeedsEvent.PublishType.connectionChanged, status => {
      this.zone.run(() => {
        Logger.log(TAG, 'Received connectionChanged event, Connection change to ', status);
        this.connectionStatus = status;
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.getCommentFinish, () => {
      this.zone.run(() => {
        Logger.log(TAG, 'Received commentDataUpdate event');
        this.startIndex = 0;
        this.initData(true);
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.refreshPostDetail, () => {
      this.zone.run(async () => {
        Logger.log(TAG, 'Received refreshPostDetail event');
        let post: any = this.feedService.getChannelFromIdV3(
          this.destDid,
          this.postId,
        ) || null;
        this.postContent = post.content.content;
        this.updatedTime = post.updatedAt;
        this.getPostLikeNum(post);
        this.getPostComments(post);
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.editPostFinish, () => {
      Logger.log(TAG, 'Received editPostFinish event');
      this.initData(true);
    });

    this.events.subscribe(FeedsEvent.PublishType.deletePostFinish, (post: any) => {
      Logger.log(TAG, 'Received deletePostFinish event');
      this.zone.run(async () => {
        await this.native.showLoading('common.waitMoment');
        try {
            this.hiveVaultController.deletePost(post.postId,post.channelId).then(async (result: any)=>{
            await this.hiveVaultController.getHomePostContent();
            await this.initData(true);
            this.native.hideLoading();
            this.events.publish(FeedsEvent.PublishType.updateTab);
          }).catch((err:any)=>{
            this.native.hideLoading();
          })
        } catch (error) {
          this.native.hideLoading();
        }
      });
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
        .deleteComment(comment.destDid,comment.channelId,comment.postId,comment.commentId)
        .then(async (result:any)=>{
          this.startIndex = 0;
          await this.initData(false);
          this.native.hideLoading();
        }).catch(()=>{
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
      this.isImgLoading = false;
      this.isImgPercentageLoading = false;
      this.imgDownStatus = '';
      this.isVideoPercentageLoading = false;
      this.isVideoLoading = false;
      this.videoDownStatus = '';
      this.feedService.closeSession(this.destDid);
      this.native.hideLoading();
      this.pauseVideo();
      this.hideFullScreen();
    });

  }

  ionViewWillLeave() {
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = null;
    }

    this.events.unsubscribe(FeedsEvent.PublishType.editCommentFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.editPostFinish);

    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.getCommentFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.refreshPostDetail);

    this.events.unsubscribe(FeedsEvent.PublishType.deletePostFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.deleteCommentFinish);


    this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestError);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcResponseError);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestSuccess);

    this.events.unsubscribe(FeedsEvent.PublishType.openRightMenu);
    this.events.unsubscribe(FeedsEvent.PublishType.getCommentFinish);
    this.events.publish(FeedsEvent.PublishType.updateTab);
    this.events.publish(FeedsEvent.PublishType.addProflieEvent);
    this.events.publish(FeedsEvent.PublishType.notification);
    this.events.publish(FeedsEvent.PublishType.homeCommonEvents);

  }

  ionViewDidLeave() {
    this.menuService.hideActionSheet();
    if (this.popover != null) {
      this.popover.dismiss();
    }

    this.imgDownStatus = '';
    this.isImgPercentageLoading = false;
    this.isImgLoading = false;
    this.isVideoPercentageLoading = false;
    this.isVideoLoading = false;
    this.videoDownStatus = '';
    this.hideComment = true;
    // this.postImage = '';
    this.isFullContent = {};
    this.isOwnComment = {};
    this.feedService.closeSession(this.destDid);
    this.clearVideo();
    this.hideFullScreen();
  }

  ionViewDidEnter() { }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('PostdetailPage.postview'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  getContentText(content: string): string {
    return this.feedsServiceApi.parsePostContentText(content);
  }

  getContentImg(content: any): string {
    return this.feedsServiceApi.parsePostContentImg(content);
  }

  indexText(text: string): string {
    text = text.replace('did:elastos:','');
    return UtilService.resolveAddress(text);
  }

  showComment(comment: FeedsData.CommentV3) {
    if (comment === null) {
      this.refcommentId = '0';
      this.commentName = this.channelName;
      this.commentAvatar = this.channelAvatarUri;
    } else {
      this.refcommentId = comment.commentId;
      this.commentName = comment.createrDid;
      this.commentAvatar = '';
    }
    // if (this.checkServerStatus(this.destDid) != 0) {
    //   this.native.toastWarn('common.connectionError1');
    //   return;
    // }

    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.pauseVideo();
    this.hideComment = false;
  }

  checkMyLike() {
    return this.feedService.checkMyLike(
      this.destDid,
      this.channelId,
      this.postId,
    );
  }

  checkLikedComment(commentId: string) {
    // return this.feedService.checkLikedComment(
    //   this.destDid,
    //   this.channelId,
    //   this.postId,
    //   commentId,
    // );

    return false;
  }

 like() {
    if(this.isLike){
      try {
        this.isLike = false;
        this.likesNum = this.likesNum - 1;
        this.hiveVaultController.removeLike(this.destDid,this.channelId,this.postId,'0');
      } catch (error) {
        this.isLike = true;
        this.likesNum = this.likesNum + 1;

      }
      return;
    }

    try{
      this.isLike = true;
      this.likesNum = this.likesNum + 1;
      this.hiveVaultController.like(this.destDid,this.channelId,this.postId,'0');
      }catch(err){
       this.isLike = false;
       this.likesNum = this.likesNum - 1;
      }

  }

  likeComment(comment: FeedsData.CommentV3) {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }
    let destDid = comment.destDid;
    let channelId = comment.channelId;
    let postId = comment.postId;
    let commentId = comment.commentId;

    let  isLike  = this.likedCommentMap[commentId] || '';
    if(isLike === ''){
      try{
        this.likedCommentMap[commentId] = "like";
        this.likedCommentNum[commentId] = this.likedCommentNum[commentId] +1;
        this.hiveVaultController.like(destDid,channelId,postId,commentId);
        }catch(err){
          this.likedCommentMap[postId] = "";
          this.likedCommentNum[commentId] = this.likedCommentNum[commentId] - 1;
        }
    }else{
      try {
        this.likedCommentMap[postId] = "";
        this.likedCommentNum[commentId] = this.likedCommentNum[commentId] - 1;
        this.hiveVaultController.removeLike(destDid,channelId,postId,'0');
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

  menuMore() {
    let isMine = this.checkChannelIsMine();
    this.pauseVideo();
    if (isMine === 1 && this.postStatus != 1) {
      this.menuService.showPostDetailMenu(
        this.destDid,
        this.channelId,
        this.channelName,
        this.postId,
      );
    } else {
      this.menuService.showShareMenu(
        this.destDid,
        this.channelId,
        this.channelName,
        this.postId,
      );
    }
  }

  showBigImage(destDid: string, channelId: string, postId: string) {
    this.zone.run(async () => {

      if (this.imgDownStatus != '') {
        return;
      }
      let imagesId = UtilService.gethtmlId(
        'postdetail',
        'img',
        destDid,
        channelId,
        postId,
      );
      let imagesObj = document.getElementById(imagesId);
      let imagesWidth = imagesObj.clientWidth;
      let imagesHeight = imagesObj.clientHeight;
      this.imgloadingStyleObj['position'] = 'absolute';
      this.imgloadingStyleObj['left'] =
        (imagesWidth - this.roundWidth) / 2 + 'px';
      this.imgloadingStyleObj['top'] =
        (imagesHeight - this.roundWidth) / 2 + 8 + 'px';
      this.isImgLoading = true;

      let post = await this.dataHelper.getPostV3ById(destDid, postId);
      let mediaDatas = post.content.mediaData;
      const elements = mediaDatas[0];
      //原图
      let imageKey = elements.originMediaPath;
      let type = elements.type;
      //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
      let fileOriginName: string = "origin-" + imageKey.split("@")[0];
      //原图
      try {
      this.hiveVaultController
        .getV3Data(destDid, imageKey, fileOriginName, type, "false")
        .then(realImg => {
        let img = realImg || '';
        this.isImgLoading =false;
        if (img != '') {
          this.viewHelper.openViewer(
            this.titleBar,
            realImg,
            'common.image',
            'PostdetailPage.postview',
            this.appService,
          );
        } else {
          this.imgDownStatus = '1'; //session down
          this.isImgLoading = false;
          this.isImgPercentageLoading = true;

          this.hiveVaultController
          .getV3Data(destDid, imageKey, fileOriginName, type)
          .then(async realImg => {
            let img = realImg || '';
            this.imgDownStatus = '';
            this.isImgPercentageLoading = false;
            if (img != '') {
              this.viewHelper.openViewer(
                this.titleBar,
                realImg,
                'common.image',
                'PostdetailPage.postview',
                this.appService,
              );
            }
          }).catch(() => {
            this.imgDownStatus = '';
            this.isImgLoading = false;
          });

        }
      }).catch(()=>{
        this.imgDownStatus = '';
        this.isImgLoading = false;
      });
    } catch (error) {
      this.imgDownStatus = '';
      this.isImgLoading = false;
    }
    });
  }

  checkServerStatus(destDid: string) {
    return this.feedService.getServerStatusFromId(destDid);
  }

  initnodeStatus() {
    let status = this.checkServerStatus(this.destDid);
    this.nodeStatus[this.destDid] = status;
  }

  getImage(post: FeedsData.PostV3) {
    this.postImage = './assets/icon/reserve.svg';//set Reserve Image
    let mediaDatas = post.content.mediaData;
    const elements = mediaDatas[0];
    let thumbnailKey = elements.thumbnailPath;
    let type = elements.type;
    //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
    let fileName: string = "thumbnail-" + thumbnailKey.split("@")[0];
    this.hiveVaultController.getV3Data(this.destDid, thumbnailKey, fileName, type)
      .then((cacheResult) => {
        let thumbImage = cacheResult || "";
        if (thumbImage != "") {
          this.postImage = thumbImage;
        }
      }).catch(() => {
      })
  }

  doRefresh(event: any) {
    let sId = setTimeout(() => {
      //this.postImage = "";
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
          this.captainCommentList = this.captainCommentList.concat(arr);
        });
        this.initnodeStatus();
        this.initOwnCommentObj();
        event.target.complete();
      } else {
        arr = this.totalData.slice(
          this.startIndex * this.pageNumber,
          this.totalData.length,
        );
        this.zone.run(() => {
          this.captainCommentList = this.captainCommentList.concat(arr);
        });
        this.infiniteScroll.disabled = true;
        this.initnodeStatus();
        this.initOwnCommentObj();
        event.target.complete();
        clearTimeout(sId);
      }
    }, 500);
  }

  pressName() {
    if (this.channelWName != '' && this.channelWName.length > 15) {
      this.viewHelper.createTip(this.channelWName);
    }
  }

  pressOwnerName() {
    if (this.channelWOwner != '' && this.channelWOwner.length > 40) {
      this.viewHelper.createTip(this.channelWOwner);
    }
  }

  userName(userName: string) {
    let name = userName || '';

    if (name != '') {
      this.viewHelper.createTip(name);
    }
  }

  async openEditTool(comment: any) {
    this.curComment = comment;
    this.menuService.showCommentDetailMenu(comment);
  }

  handleCommentStatus() {
    let status = '(edit)';
    return status;
  }

  checkChannelIsMine() {

    let signInData: FeedsData.SignInData = this.feedService.getSignInData() || null;
    if (signInData === null) {
      return 0;
    }
    let ownerDid: string = signInData.did;
    if (this.destDid != ownerDid) {
      return 0;
    }
    return 1;
  }

  navTo(destDid: string, channelId: string) {
    this.native.navigateForward(['/channels', destDid, channelId], '');
  }

  checkCommentIsMine(comment: FeedsData.CommentV3) {
    let commentId = comment.commentId;
    let destDid  = comment.createrDid;
    let signInData :FeedsData.SignInData = this.feedService.getSignInData() || null;
    if(signInData === null){
      this.isOwnComment[commentId] = false;
      return false;
    }
    let ownerDid: string = signInData.did;
    if( destDid != ownerDid){
      this.isOwnComment[commentId] = false;
      return false;

    }
    this.isOwnComment[commentId] = true;
  }

  hideComponent(event) {
    this.hideComment = true;
  }

  getVideoPoster(post: FeedsData.PostV3) {
    this.videoisShow = true;
    this.postImage = './assets/icon/reserve.svg';//set Reserve Image
    let mediaDatas = post.content.mediaData;
    const elements = mediaDatas[0];
    let thumbnailKey = elements.thumbnailPath;
    let type = elements.type;
    //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
    let fileName: string = "poster-" + thumbnailKey.split("@")[0];
    this.hiveVaultController
      .getV3Data(this.destDid, thumbnailKey, fileName, type)
      .then(imagedata => {
        let image = imagedata || '';
        if (image != '') {
          this.zone.run(() => {
            this.posterImg = imagedata;
            let id = this.destDid + this.channelId + this.postId;
            let sid = setTimeout(() => {
              let video: any =
                document.getElementById(id + 'postdetailvideo') || '';
              video.setAttribute('poster', this.posterImg);
              this.setFullScreen();
              this.setOverPlay();
              clearTimeout(sid);
            }, 0);
          });
        } else {
          this.videoisShow = false;
        }
      })
      .catch(err => { });
  }

  getVideo() {
    let videoId = UtilService.gethtmlId(
      'postdetail',
      'video',
      this.destDid,
      this.channelId,
      this.postId,
    );
    let videoObj = document.getElementById(videoId);
    let videoWidth = videoObj.clientWidth;
    let videoHeight = videoObj.clientHeight;
    this.videoloadingStyleObj['z-index'] = 999;
    this.videoloadingStyleObj['position'] = 'absolute';
    this.videoloadingStyleObj['left'] =
      (videoWidth - this.roundWidth) / 2 + 'px';
    this.videoloadingStyleObj['top'] =
      (videoHeight - this.roundWidth) / 2 + 'px';
    this.isVideoLoading = true;

    let mediaDatas = this.post.content.mediaData;
    const elements = mediaDatas[0];
    let originKey = elements.originMediaPath;
    let type = elements.type;
    //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
    let fileName: string = "origin-" + originKey.split("@")[0];

    this.hiveVaultController
      .getV3Data(this.destDid, originKey, fileName, type, "false")
      .then((videodata: string) => {
        this.zone.run(() => {
          let videoData = videodata || '';
          if (videoData === '') {
            this.videoDownStatus = '1';
            this.isVideoLoading = true;
            this.isVideoPercentageLoading = false;
            this.hiveVaultController.getV3Data(this.destDid, originKey, fileName, type)
              .then((downVideodata) => {
                let downVideoData = downVideodata || '';
                this.videoObj = downVideoData;
                this.loadVideo(downVideoData);
              }).catch((err) => {
                this.videoDownStatus = '';
                this.isVideoPercentageLoading = false;
                this.isVideoLoading = false;
              });
            return;
          }
          this.videoObj = videoData;
          this.loadVideo(videoData);
        });
      }).catch((err) => {
        this.videoDownStatus = '';
        this.isVideoPercentageLoading = false;
        this.isVideoLoading = false;
      });
  }

  loadVideo(videodata: any) {
    this.isVideoLoading = false;
    this.isVideoPercentageLoading = false;
    this.videoDownStatus = '';
    let id = this.destDid + this.channelId + this.postId;
    let source: any = document.getElementById(id + 'postdetailsource') || '';
    source.setAttribute('src', videodata);
    let video: any = document.getElementById(id + 'postdetailvideo') || '';
    let vgoverlayplay: any = document.getElementById(
      id + 'vgoverlayplaypostdetail',
    );
    let vgcontrol: any = document.getElementById(id + 'vgcontrolspostdetail');
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

  pauseVideo() {
    if (this.postStatus != 1 && this.mediaType === 2) {
      let id = this.destDid + this.channelId + this.postId;
      let video: any = document.getElementById(id + 'postdetailvideo') || '';
      if (!video.paused) {
        //判断是否处于暂停状态
        video.pause(); //停止播放
      }
    }
  }

  clearVideo() {
    if (this.postStatus != 1 && this.mediaType === 2) {
      this.posterImg = '';
      this.videoObj = '';
      let id = this.destDid + this.channelId + this.postId;
      let video: any = document.getElementById(id + 'postdetailvideo') || '';
      if (video != '') {
      }

      let source: any = document.getElementById(id + 'postdetailsource') || '';
      if (source != '') {
        source.removeAttribute('src'); // empty source
      }
      if (video != '') {
      }
    }
  }

  setFullScreen() {
    let id = this.destDid + this.channelId + this.postId;
    let vgfullscreen: any =
      document.getElementById(id + 'vgfullscreenpostdetail') || '';
    if (vgfullscreen != '') {
      vgfullscreen.onclick = () => {
        this.pauseVideo();
        let postImg: string = document
          .getElementById(id + 'postdetailvideo')
          .getAttribute('poster');
        let videoSrc: string = document
          .getElementById(id + 'postdetailsource')
          .getAttribute('src');
        this.fullScreenmodal = this.native.setVideoFullScreen(
          postImg,
          videoSrc,
        );
      };
    }
  }

  hideFullScreen() {
    if (this.fullScreenmodal != '') {
      this.modalController.dismiss();
      this.fullScreenmodal = '';
    }
  }

  setOverPlay() {
    let id = this.destDid + this.channelId + this.postId;
    let vgoverlayplay: any =
      document.getElementById(id + 'vgoverlayplaypostdetail') || '';
    if (vgoverlayplay != '') {
      vgoverlayplay.onclick = () => {
        this.zone.run(() => {
          // if (this.checkServerStatus(this.destDid) != 0) {
          //   this.pauseVideo();
          //   this.native.toastWarn('common.connectionError1');
          //   return;
          // }

          let source: any =
            document.getElementById(id + 'postdetailsource') || '';
          let sourceSrc = source.getAttribute('src') || '';
          if (sourceSrc != '') return;

          this.getVideo();
        });
      };
    }
  }

  handleTotal() {
    let post = this.feedService.getPostFromId(
      this.destDid,
      this.channelId,
      this.postId,
    );
    let videoThumbKey = post.content['videoThumbKey'] || '';
    let duration = 29;
    if (videoThumbKey != '') {
      duration = videoThumbKey['duration'] || 0;
    }
    return UtilService.timeFilter(duration);
  }

  processGetBinaryResult(key: string, value: string) {
    this.cacheGetBinaryRequestKey = '';
    if (key.indexOf('img') > -1) {
      this.imgDownStatus = '';
      this.isImgPercentageLoading = false;
      this.isImgLoading = false;
      this.postImage = value;
      this.viewHelper.openViewer(
        this.titleBar,
        value,
        'common.image',
        'PostdetailPage.postview',
        this.appService,
      );
    } else if (key.indexOf('video') > -1) {
      this.videoDownStatus = '';
      this.isVideoPercentageLoading = false;
      this.isVideoLoading = false;
      this.videoObj = value;
      this.loadVideo(value);
    }
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
    let text = postContent || "";
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

 async clickDashang() {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    let channel: FeedsData.ChannelV3 = await this.feedService.getChannelFromIdV3(this.destDid, this.channelId) || null;
    let tippingAddress = '';
    if(tippingAddress != null){
      tippingAddress = channel.tipping_address || '';
    }
    if (tippingAddress == "") {
      this.native.toast('common.noElaAddress');
      return;
    }
    this.pauseVideo();
    this.viewHelper.showPayPrompt(this.destDid, this.channelId, tippingAddress);
  }

  clickComment(comment: FeedsData.CommentV3, event?: any) {
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
    let commentId: string = comment.commentId;
    this.native.navigateForward(['commentlist'], {
      queryParams: {
        destDid: this.destDid,
        channelId: this.channelId,
        postId: this.postId,
        commentId: commentId,
      },
    });
  }
  retry(destDid: string, channelId: string, postId: string) {
    this.feedService.republishOnePost(destDid, destDid, postId);
  }

 getPostLikeNum(post: FeedsData.PostV3) {
   try{
      this.hiveVaultController.getLikeByPost(
      post.destDid, post.channelId , post.postId
      ).then((result)=>{

        let list = result.find_message.items || [];

         //计算post like的数量
        let likeList = _.filter(list,(item)=>{
        return item.channel_id === post.channelId && item.post_id === post.postId && item.comment_id === "0";
        }) || [];
        this.likesNum = likeList.length;

        let index = _.find(likeList,(item)=>{
              return item.channel_id === post.channelId && item.post_id === post.postId && item.comment_id === "0";
              ;
        }) || "";

        if(index === ""){
          this.isLike = false;
        }else{
          this.isLike = true;
        }
      }).catch((err)=>{

      });
   }catch(err){
    this.likesNum = 0;
   }
  }

  getPostComments(post: FeedsData.PostV3) {
  try {
    this.hiveVaultController.getCommentsByPost(
      post.destDid,post.channelId,post.postId
      ).then((result)=>{
      let commentPostList = _.filter(result,(item)=>{
        return item.channelId === post.channelId && item.postId === post.postId && item.refcommentId === "0";
      }) || [];
      this.commentsNum = commentPostList.length;
      });
  } catch (error) {

  }
  }
}

