import {
  Component,
  OnInit,
  NgZone,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  IonContent,
  ModalController,
  Platform,
  PopoverController,
  IonInfiniteScroll,
  IonRefresher
} from '@ionic/angular';
import { Events } from 'src/app/services/events.service';
import { MenuService } from 'src/app/services/MenuService';
import { FeedsPage } from '../feeds.page';
import { ThemeService } from 'src/app/services/theme.service';
import { UtilService } from 'src/app/services/utilService';
import { TranslateService } from '@ngx-translate/core';
import { NativeService } from 'src/app/services/NativeService';
import { AppService } from 'src/app/services/AppService';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { PopupProvider } from 'src/app/services/popup';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import { NFTContractHelperService } from 'src/app/services/nftcontract_helper.service';
import _ from 'lodash';
import { Logger } from 'src/app/services/logger';
import { HttpService } from '../../../services/HttpService';
import { DataHelper } from 'src/app/services/DataHelper';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { FileHelperService } from 'src/app/services/FileHelperService';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service'
import { CommonPageService } from 'src/app/services/common.page.service';
import { HiveVaultHelper } from 'src/app/services/hivevault_helper.service';
let TAG: string = 'Feeds-home';
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonContent, { static: true }) content: IonContent;
  @ViewChild(IonInfiniteScroll, { static: true })
  infiniteScroll: IonInfiniteScroll;
  @ViewChild(IonRefresher, { static: false }) refresher: IonRefresher;
  private homeTittleBar: HTMLElement;
  private homeTab: HTMLElement;
  public postList: any = [];
  public startIndex = 0;
  public pageNumber = 8;
  public totalData = [];
  public images = {};

  public styleObj: any = { width: '' };

  public hideComment = true;

  // For comment component
  public postId: string = '';
  public destDid: string = '';
  public channelId: string = '';
  public channelAvatar = null;
  public channelName = null;

  private clientHeight: number = 0;
  private clientWidth: number = 0;
  private isLoadimage: any = {};
  private isLoadAvatarImage: any = {};
  private isInitLikeNum: any = {};
  private isInitLikeStatus: any = {};
  private isInitComment: any = {};
  public isLoadVideoiamge: any = {};
  public videoIamges: any = {};

  public postgridindex: number = 0;

  public cacheGetBinaryRequestKey = '';
  public cachedMediaType = '';

  public maxTextSize = 240;

  public fullScreenmodal: any = '';

  public popover: any = '';

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

  public tabType: string = 'feeds';

  public pasarList: FeedsData.NFTItem[] = [];

  public isFinsh: any = [];

  public refreshEvent: any = null;

  public isLoading: boolean = false;
  public loadingTitle: string = "";
  public loadingText: string = "";
  public loadingCurNumber: string = "";
  public loadingMaxNumber: string = "";
  /** grid  list*/
  public styleType: string = "grid";

  private pasarListCount: number = 0;
  private pasarListPage: number = 0;
  public elaPrice: string = null;

  public searchText: string = "";
  public searchPasar: any = [];
  public isShowSearchField: boolean = false;
  public pasarsearchPlaceholder: string = "HomePage.search";
  // private searchBeforePasar: any = [];
  private nftImageType: any = {};
  private pasarGridisLoadimage: any = {};
  private pasarListisLoadimage: any = {};
  public isAutoGet: string = 'unAuto';
  public thumbImageName: string = "homeImg";
  private sortType: FeedsData.SortType = FeedsData.SortType.TIME_ORDER_LATEST;
  private likeMap: any = {};
  private likeNumMap: any = {};
  private commentNumMap: any = {};
  public isPostLoading: boolean = false;
  private hannelNameMap: any = {};
  private isLoadingLikeMap: any = {};
  private downPostAvatarMap: any = {};
  private avatarImageMap: any = {};
  private syncHiveDataStatus: number = null;
  private syncHiveDataDes: string = null;
  private useRemoteData: boolean = false;

  constructor(
    private platform: Platform,
    private elmRef: ElementRef,
    private feedspage: FeedsPage,
    private events: Events,
    private zone: NgZone,
    public theme: ThemeService,
    private translate: TranslateService,
    private native: NativeService,
    private menuService: MenuService,
    public appService: AppService,
    public modalController: ModalController,
    public popupProvider: PopupProvider,
    public popoverController: PopoverController,
    private viewHelper: ViewHelper,
    private titleBarService: TitleBarService,
    private nftContractControllerService: NFTContractControllerService,
    private ipfsService: IPFSService,
    private nftPersistenceHelper: NFTPersistenceHelper,
    private walletConnectControllerService: WalletConnectControllerService,
    private nftContractHelperService: NFTContractHelperService,
    private httpService: HttpService,
    private dataHelper: DataHelper,
    private keyboard: Keyboard,
    private fileHelperService: FileHelperService,
    private feedsServiceApi: FeedsServiceApi,
    private hiveVaultController: HiveVaultController
  ) { }

  ngOnInit() {
  }

  async initPostListData(scrollToTop: boolean) {
    this.infiniteScroll.disabled = false;
    this.startIndex = 0;

    this.postList = this.totalData = await this.sortPostList();
    // if (this.totalData.length - this.pageNumber > 0) {
    //   this.postList = this.totalData.slice(0, this.pageNumber);


    //   this.startIndex++;
    //   //this.infiniteScroll.disabled = false;
    // } else {

    //   this.postList = this.totalData;
    //   //this.infiniteScroll.disabled = true;
    // }
    if (scrollToTop) {
      this.scrollToTop(1);
    }
    this.isLoadimage = {};
    this.isLoadAvatarImage = {};
    this.avatarImageMap = {};
    this.downPostAvatarMap = {};
    this.isLoadVideoiamge = {};
    this.isInitLikeNum = {};
    this.isInitLikeStatus = {};
    this.isInitComment = {};
    this.refreshImage();
    this.dataHelper.resetNewPost();
    this.isPostLoading = false;
    //this.isInitPostList = false;
  }

  async sortPostList() {
    let postList = await this.dataHelper.getPostV3List() || [];
    this.hideDeletedPosts = this.dataHelper.getHideDeletedPosts();
    if (!this.hideDeletedPosts) {
      postList = _.filter(postList, (item: any) => {
        return item.status != 1;
      });
    }
    return postList;
  }

  async refreshPostList() {
    if (this.startIndex === 0) {
      this.initPostListData(false);
      return;
    }
    this.isPostLoading = false;
    this.postList = this.totalData = await this.sortPostList();
    // if (this.totalData.length === this.postList.length) {
    //   this.postList = this.totalData;
    // } else if (this.totalData.length - this.pageNumber * this.startIndex > 0) {
    //   this.postList = this.totalData.slice(
    //     0,
    //     this.startIndex * this.pageNumber,
    //   );
    //   // this.infiniteScroll.disabled = false;
    // } else {
    //   this.postList = this.totalData;
    //   // this.infiniteScroll.disabled = true;
    // }
    this.isLoadimage = {};
    this.isLoadAvatarImage = {};
    this.avatarImageMap = {};
    this.downPostAvatarMap = {};
    this.isLoadVideoiamge = {};
    this.isInitLikeNum = {};
    this.isInitLikeStatus = {};
    this.isInitComment = {};
    this.refreshImage();
    this.dataHelper.resetNewPost();
    //this.isInitPostList = false;
  }

  getElaUsdPrice() {
    this.httpService.getElaPrice().then((elaPrice: any) => {
      if (elaPrice != null) {
        this.elaPrice = elaPrice;
      }
    });
  }

  async ionViewWillEnter() {
    this.useRemoteData = false;
    this.initTitleBar();
    let syncHiveData = this.dataHelper.getSyncHiveData();
    this.syncHiveDataStatus = syncHiveData.status;
    this.syncHiveDataDes = syncHiveData.describe;
    this.sortType = this.dataHelper.getFeedsSortType();
    this.homeTittleBar = this.elmRef.nativeElement.querySelector("#homeTittleBar");
    this.homeTab = this.elmRef.nativeElement.querySelector("#homeTab");
    this.elaPrice = this.dataHelper.getElaUsdPrice();
    if (this.platform.is('ios')) {
      this.isAndroid = false;
    }
    this.styleObj.width = screen.width - 105 + 'px';
    this.clientHeight = screen.availHeight;
    this.clientWidth = screen.availWidth;
    this.handleScroll();
    let pasarListGrid = this.dataHelper.getPasarListGrid();
    if (!pasarListGrid) {
      this.styleType = "grid";
    } else {
      this.styleType = "list";
    }

    switch (this.tabType) {
      case 'feeds':
        if (this.syncHiveDataStatus === 6) {
          this.handleRefresherInfinite(false);
          this.isPostLoading = true;
          this.refreshPostList();
        } else {
          this.handleRefresherInfinite(true);
        }
        break;
      case 'pasar':
        this.handleRefresherInfinite(false);
        if (this.searchText != "" || this.searchText != null) {
          return;
        }
        await this.refreshLocalPasarData();
        break;
    }



    this.events.subscribe(FeedsEvent.PublishType.updateSyncHiveData, (syncHiveData: any) => {
      Logger.log(TAG, "FeedsEvent.PublishType.updateSyncHiveData");
      this.syncHiveDataStatus = syncHiveData.status;
      this.syncHiveDataDes = syncHiveData.describe;
      if (this.syncHiveDataStatus === 6) {
        this.isPostLoading = true;
        this.refreshPostList();
      }
    });

    this.events.subscribe(FeedsEvent.PublishType.homeCommonEvents, () => {
      this.addCommonEvents();
    });


    this.events.subscribe(FeedsEvent.PublishType.mintNft, () => {
      this.refreshPasarList();
      // this.pasarList = this.nftPersistenceHelper.getPasarList();
      //this.refreshPasarGridVisibleareaImage();
    });

    this.events.subscribe(FeedsEvent.PublishType.nftBuyOrder, async () => {
      // this.pasarList = this.nftPersistenceHelper.getPasarList();
      await this.refreshLocalPasarData();
    });


    this.events.subscribe(FeedsEvent.PublishType.unfollowFeedsFinish, (channel: FeedsData.SubscribedChannelV3) => {
      Logger.log(TAG, "revice unfollowFeedsFinish event");
      this.zone.run(async () => {
        this.hideDeletedPosts = this.dataHelper.getHideDeletedPosts();
        await this.refreshPostList();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.clearHomeEvent, () => {
      this.events.unsubscribe(FeedsEvent.PublishType.hideDeletedPosts);
      this.events.unsubscribe(FeedsEvent.PublishType.updateTab);
      this.events.unsubscribe(FeedsEvent.PublishType.homeCommonEvents);
      this.events.unsubscribe(FeedsEvent.PublishType.unfollowFeedsFinish);
      this.events.unsubscribe(FeedsEvent.PublishType.homeCommonEvents);
      this.events.unsubscribe(FeedsEvent.PublishType.updateSyncHiveData);
      this.clearData();
      this.events.unsubscribe(FeedsEvent.PublishType.clearHomeEvent);
    });

    this.events.subscribe(FeedsEvent.PublishType.updateTab, isInit => {
      Logger.log(TAG, "======= Receive updateTab========");
      this.zone.run(() => {
        if (isInit) {
          this.initPostListData(true);
          return;
        }
        this.refreshPostList();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.hideDeletedPosts, () => {
      this.zone.run(async () => {
        this.hideDeletedPosts = this.dataHelper.getHideDeletedPosts();
        this.refreshPostList();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.hideAdult, () => {
      this.zone.run(async () => {
        await this.native.showLoading('common.waitMoment');
        await this.refreshPasarList();
        this.isShowSearchField = false;
        this.native.hideLoading();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.pasarListGrid, () => {
      let pasarListGrid = this.dataHelper.getPasarListGrid();
      if (!pasarListGrid) {
        this.styleType = "grid";
      } else {
        this.styleType = "list";
      }
      this.zone.run(() => {
        this.refreshPasarGridVisibleareaImage();
      });
    });

    this.addCommonEvents();

  }

  addCommonEvents() {
    this.events.subscribe(FeedsEvent.PublishType.clickHome, () => {
      let newPostCount = this.dataHelper.getNewPostCount() || 0;
      this.content.getScrollElement().then((ponit: any) => {
        if (ponit.scrollTop > 110 || newPostCount > 0) {
          this.initPostListData(true);
        }
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.nftdisclaimer, () => {
      let accAdress = this.nftContractControllerService.getAccountAddress() || "";
      if (accAdress === "") {
        this.connectWallet();
        return;
      }
      this.native.navigateForward(['mintnft'], {});
    });

    this.events.subscribe(FeedsEvent.PublishType.startLoading, (obj) => {
      let title = obj["title"];
      let des = obj["des"];
      let curNum = obj["curNum"];
      let maxNum = obj["maxNum"];
      this.loadingTitle = title;
      this.loadingText = des;
      this.loadingCurNumber = curNum;
      this.loadingMaxNumber = maxNum;
      this.isLoading = true;
    });

    this.events.subscribe(FeedsEvent.PublishType.endLoading, (obj) => {
      this.isLoading = false;
    });

    this.events.subscribe(FeedsEvent.PublishType.nftCancelOrder, async assetItem => {

      let saleOrderId = assetItem.saleOrderId;
      let sellerAddr = assetItem.sellerAddr;
      let tokenId = assetItem.tokenId;
      let curTokenNum = await this.nftContractControllerService
        .getSticker().balanceOf(tokenId);
      let createAddr = this.nftContractControllerService.getAccountAddress();
      if (sellerAddr === createAddr) {
        //add created
        assetItem['fixedAmount'] = null;
        assetItem['moreMenuType'] = 'created';
        //add OwnNftCollectiblesList
        let createAddr = this.nftContractControllerService.getAccountAddress();
        let clist = this.nftPersistenceHelper.getCollectiblesList(createAddr);
        this.handleCancelOrder(tokenId, curTokenNum, assetItem, createAddr, saleOrderId, clist, sellerAddr);
      }
    });
    this.events.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      this.initTitleBar();
    });


    this.events.subscribe(FeedsEvent.PublishType.getCommentFinish, (comment: FeedsData.CommentV3) => {
      Logger.log(TAG, "======= Receive getCommentFinish ========");
      let postId = comment.postId;
      this.commentNumMap[postId] = this.commentNumMap[postId] + 1;
      let refcommentId = comment.refcommentId;
      let cachedCommentList = this.dataHelper.getcachedCommentList(postId, refcommentId) || [];
      cachedCommentList.push(comment);
    });

    this.events.subscribe(FeedsEvent.PublishType.editPostFinish, () => {
      Logger.log(TAG, "======= Receive editPostFinish ========")
      this.zone.run(() => {
        this.refreshPostList();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.deletePostFinish, (deletePostEventData: any) => {
      Logger.log(TAG, "=======Receive  deletePostFinish========")
      this.zone.run(async () => {
        await this.native.showLoading('common.waitMoment');
        try {
          let post: FeedsData.PostV3 = await this.dataHelper.getPostV3ById(deletePostEventData.destDid, deletePostEventData.postId);
          this.hiveVaultController.deletePost(post).then((result: any) => {
            this.refreshPostList();
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

      this.hideFullScreen();
      this.pauseAllVideo();

    });

  }

  ionViewWillLeave() {
    this.events.unsubscribe(FeedsEvent.PublishType.mintNft);
    this.events.unsubscribe(FeedsEvent.PublishType.nftBuyOrder);
    this.events.unsubscribe(FeedsEvent.PublishType.hideDeletedPosts);
    this.events.unsubscribe(FeedsEvent.PublishType.hideAdult);
    this.events.unsubscribe(FeedsEvent.PublishType.pasarListGrid);
    this.events.unsubscribe(FeedsEvent.PublishType.unfollowFeedsFinish);
    this.clearData();
  }

  clearData() {
    this.isPostLoading = false;
    this.doRefreshCancel();
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = null;
    }

    this.isLoading = false;
    this.events.unsubscribe(FeedsEvent.PublishType.nftdisclaimer);
    this.events.unsubscribe(FeedsEvent.PublishType.startLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.endLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.nftCancelOrder);
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
    this.events.unsubscribe(FeedsEvent.PublishType.getCommentFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.editPostFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.deletePostFinish);

    this.events.unsubscribe(FeedsEvent.PublishType.openRightMenu);
    this.events.unsubscribe(FeedsEvent.PublishType.clickHome);

    CommonPageService.removeAllAvatar(this.isLoadAvatarImage, 'homeChannelAvatar');
    this.removeImages();
    this.removeAllVideo();
    this.isLoadimage = {};
    this.isLoadAvatarImage = {};
    this.avatarImageMap = {};
    this.downPostAvatarMap = {};
    this.isLoadVideoiamge = {};
    this.isInitLikeNum = {};
    this.isInitLikeStatus = {};
    this.isInitComment = {};

    let isImgPercentageLoadingkeys: string[] = Object.keys(this.isImgPercentageLoading) || [];
    for (let index = 0; index < isImgPercentageLoadingkeys.length; index++) {
      const key = isImgPercentageLoadingkeys[index];
      this.isImgPercentageLoading[key] = false;
    }

    let isImgLoadingkeys: string[] = Object.keys(this.isImgLoading) || [];
    for (let index = 0; index < isImgLoadingkeys.length; index++) {
      const key = isImgLoadingkeys[index];
      this.isImgLoading[key] = false;
    }

    this.imgDownStatus[this.imgDownStatusKey] = '';
    this.imgPercent = 0;
    this.imgRotateNum['transform'] = 'rotate(0deg)';

    this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
    this.isVideoLoading[this.videoDownStatusKey] = false;
    this.videoDownStatus[this.videoDownStatusKey] = '';
    this.videoPercent = 0;
    this.videoRotateNum['transform'] = 'rotate(0deg)';

    this.hideFullScreen();
    this.native.hideLoading();
  }

  ionViewDidLeave() {
    this.events.unsubscribe(FeedsEvent.PublishType.updateTab);
    this.events.unsubscribe(FeedsEvent.PublishType.homeCommonEvents);
    this.events.unsubscribe(FeedsEvent.PublishType.updateSyncHiveData);
  }



  getContentText(content: string): string {
    return this.feedsServiceApi.parsePostContentText(content);
  }

  getContentShortText(post: any): string {
    let content = post.content.content;
    let text = this.feedsServiceApi.parsePostContentText(content) || '';
    return text.substring(0, 180) + '...';
  }

  getPostContentTextSize(content: string) {
    let text = this.feedsServiceApi.parsePostContentText(content);
    let size = UtilService.getSize(text);
    return size;
  }

  getContentImg(content: any): string {
    return this.feedsServiceApi.parsePostContentImg(content);
  }

  getChannelOwnerName(destDid, channelId): string {

    const key = UtilService.getKey(destDid, channelId);
    let channel = this.dataHelper.channelsMapV3[key];
    if (channel === null) {
      return '';
    } else {
      return UtilService.moreNanme(channel['owner_name'], 40);
    }
  }

  like(destDid: string, channelId: string, postId: string) {

    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
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

  navTo(destDid: string, channelId: string, postId: number) {
    this.pauseVideo(destDid + '-' + channelId + '-' + postId);
    this.clearData();
    this.native.navigateForward(['/channels', destDid, channelId], "");
  }

  async navToPostDetail(
    destDid: string,
    channelId: string,
    postId: string,
    event?: any,
  ) {
    //let post = await this.dataHelper.getPostV3ById(destDid, postId);;
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
    this.clearData();
    this.native
      .getNavCtrl()
      .navigateForward(['/postdetail', destDid, channelId, postId]);
  }

  exploreFeeds() {
    this.native.setRootRouter(['/tabs/search']);
    this.feedspage.search();
  }

  async parseAvatar(destDid: string, channelId: string): Promise<string> {

    const key = UtilService.getKey(destDid, channelId);
    let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;

    if (channel === null) return './assets/icon/reserve.svg';
    return channel.avatar;

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

    let destDid = post.destDid;
    let ownerDid = (await this.dataHelper.getSigninData()).did;
    let channelName = await this.getChannelName(post.destDid, post.channelId);
    if (ownerDid != '' && ownerDid === destDid) {//自己的post
      this.menuService.showHomeMenu(
        post.destDid,
        post.channelId,
        channelName,
        post.postId,
      );
    } else {//别人的post
      this.menuService.showChannelMenu(
        post.destDid,
        post.channelId,
        channelName,
        post.postId,
      );
    }
  }

  async getChannelName(destDid: string, channelId: string) {

    let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
    if (channel === null) {
      return '';
    }
    return channel.name;
  }

  moreName(name: string) {
    return UtilService.moreNanme(name);
  }

  loadData(event) {
    this.refreshEvent = event;
    switch (this.tabType) {
      case 'feeds':
        this.zone.run(() => {
          this.hiveVaultController.loadPostMoreData(this.useRemoteData, this.postList).then((postList: FeedsData.PostV3[]) => {
            if (postList.length > 0) {
              this.postList = postList;
              this.refreshImage();
            }
            event.target.complete();
          }).catch(err => {
            event.target.complete();
          });
        });
        break;
      case 'pasar':
        this.zone.run(() => {
          this.elaPrice = this.dataHelper.getElaUsdPrice();
          this.loadMorePasarData().then((list) => {
            if (list.length > 0) {
              this.pasarList = list;
              this.refreshPasarGridVisibleareaImage();
            }
            event.target.complete();
          });
        });
        break;
    }
  }

  loadMorePasarData(): Promise<FeedsData.NFTItem[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const list = await this.nftContractHelperService.loadMorePasarListFromAssist(this.sortType, this.pasarListPage) || [];
        let pasarList: FeedsData.NFTItem[] = [];
        if (list && list.length > 0) {
          this.pasarListPage++;
          pasarList = _.unionWith(this.pasarList, list, _.isEqual);
          pasarList = this.nftContractHelperService.sortData(pasarList, this.sortType);
        }
        resolve(pasarList);
      } catch (error) {
        reject(error);
      }
    });
  }

  async doRefresh(event) {
    this.refreshEvent = event;
    this.isPostLoading = false;
    this.useRemoteData = true;
    switch (this.tabType) {
      case 'feeds':
        this.useRemoteData = true;
        //TODO use loadMoreData
        try {
          this.dataHelper.cleanCachedComment();
          this.dataHelper.cleanCacheLikeNum();
          this.dataHelper.cleanCachedLikeStatus();
          await this.hiveVaultController.syncAllPost();
          await this.hiveVaultController.syncAllComments();
          await this.hiveVaultController.syncAllLikeData();

          await this.initPostListData(true);
          if (event != null) event.target.complete();
          this.refreshEvent = null;
        } catch (error) {
          if (event != null) event.target.complete();
          this.refreshEvent = null;
        }

        break;
      case 'pasar':
        this.elaPrice = this.dataHelper.getElaUsdPrice();
        this.zone.run(async () => {
          await this.refreshPasarList();
          event.target.complete();
          this.handleRefresherInfinite(false);
          this.refreshEvent = null;
        });
        break;
    }
  }

  async refreshPasarList() {
    try {
      this.pasarListPage = 0;
      this.pasarList = await this.nftContractHelperService.refreshPasarListFromAssist(this.sortType);
      this.refreshPasarGridVisibleareaImage();
      this.pasarListPage++;
    } catch (err) {
      Logger.error(TAG, err);
    }
  }

  refreshPasarGridVisibleareaImage() {
    if (this.tabType === 'pasar' && this.styleType === 'grid') {
      let sid = setTimeout(() => {
        this.pasarGridisLoadimage = {};
        this.setPasarGridVisibleareaImage();
        clearTimeout(sid);
      }, 100);
      return;
    }

    if (this.tabType === 'pasar' && this.styleType === 'list') {
      let sid = setTimeout(() => {
        this.pasarListisLoadimage = {};
        this.setPasarListVisibleareaImage();
        clearTimeout(sid);
      }, 100);
      return;
    }
  }

  scrollToTop(int) {
    let sid = setTimeout(() => {
      this.content.scrollToTop(1);
      clearTimeout(sid);
    }, int);
  }


  async showComment(destDid: string, channelId: string, postId: string) {

    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    // if (this.checkServerStatus(destDid) != 0) {
    //   this.native.toastWarn('common.connectionError1');
    //   return;
    // }

    // let post = this.feedService.getPostFromId(nodeId, channelId, postId);
    // if (!this.feedService.checkPostIsAvalible(post)) return;

    this.pauseVideo(destDid + '-' + channelId + '-' + postId);

    this.postId = postId;
    this.channelId = channelId;
    this.destDid = destDid;
    this.channelAvatar = await this.parseAvatar(destDid, channelId);
    this.channelName = await this.getChannelName(destDid, channelId);
    this.hideComment = false;
  }

  hideComponent(event) {
    this.postId = "";
    this.channelId = "";
    this.destDid = "";
    this.channelAvatar = null;
    this.channelName = null;
    this.hideComment = true;
  }

  setVisibleareaImage() {

    let postgridList = document.getElementsByClassName('post-grid');
    let postgridNum = document.getElementsByClassName('post-grid').length;
    for (let postgridindex = 0; postgridindex < postgridNum; postgridindex++) {
      let srcId = postgridList[postgridindex].getAttribute('id') || '';
      if (srcId != '') {
        let arr = srcId.split('-');
        let destDid = arr[0];
        let channelId = arr[1];
        let postId = arr[2];
        let mediaType = arr[3];
        let id = destDid + '-' + channelId + '-' + postId;

        //post Avatar
        this.handlePostAvatar(id, srcId, postgridindex);
        //postImg
        if (mediaType === '1') {
          this.handlePostImg(id, srcId, postgridindex);
        }
        if (mediaType === '2') {
          //video
          this.handleVideo(id, srcId, postgridindex);
        }

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
      }
    }
  }

  async handlePostAvatar(id: string, srcId: string, rowindex: number) {
    // 13 存在 12不存在
    let isload = this.isLoadAvatarImage[id] || '';
    let postAvatar = document.getElementById(id + '-homeChannelAvatar') || null;
    try {
      if (
        id != '' &&
        postAvatar.getBoundingClientRect().top >= -100 &&
        postAvatar.getBoundingClientRect().bottom <= this.clientHeight
      ) {
        if (isload === '') {
          this.isLoadAvatarImage[id] = '11';
          postAvatar.setAttribute('src', '/assets/icon/reserve.svg');
          let arr = srcId.split('-');

          let destDid: string = arr[0];
          let channelId: string = arr[1];
          let postId: string = arr[2];
          let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;

          //this.hiveVaultController.checkPostIsLast();

          const post = _.find(this.postList, item => {
            return (
              item.postId === postId
            );
          });
          // this.hiveVaultController.checkPostIsLast(post);

          let avatarUri = "";
          if (channel != null) {
            this.hannelNameMap[postId] = channel.name;
            avatarUri = channel.avatar;
          }
          let fileName: string = avatarUri.split("@")[0];
          this.avatarImageMap[id] = avatarUri;//存储相同头像的Post的Map
          let isDown = this.downPostAvatarMap[fileName] || "";
          if (isDown != '') {
            return;
          }
          this.downPostAvatarMap[fileName] = "down";
          //头像
          this.hiveVaultController.
            getV3Data(destDid, avatarUri, fileName, "0")
            .then(imagedata => {
              let realImage = imagedata || '';
              if (realImage != '') {
                this.downPostAvatarMap[fileName] = "";
                for (let key in this.avatarImageMap) {
                  let uri = this.avatarImageMap[key] || "";
                  if (uri === avatarUri) {
                    let newPostAvatar = document.getElementById(key + '-homeChannelAvatar') || null;
                    if (newPostAvatar != null && this.isLoadAvatarImage[key] === "11") {
                      newPostAvatar.setAttribute('src', realImage);
                    }
                    this.isLoadAvatarImage[key] = "13";
                    delete this.avatarImageMap[key];
                  }
                }
              } else {
                this.downPostAvatarMap[fileName] = "";
                for (let key in this.avatarImageMap) {
                  let uri = this.avatarImageMap[key] || "";
                  if (uri === avatarUri && this.isLoadAvatarImage[key] === "11") {
                    this.isLoadAvatarImage[key] = "13";
                    delete this.avatarImageMap[key];
                  }
                }
              }
            })
            .catch(reason => {
              this.downPostAvatarMap[fileName] = "";
              for (let key in this.avatarImageMap) {
                let uri = this.avatarImageMap[key] || "";
                if (uri === avatarUri && this.isLoadAvatarImage[key] === "11") {
                  this.isLoadAvatarImage[key] = '13';
                  delete this.avatarImageMap[key];
                }
              }
              Logger.error(TAG,
                "Excute 'handlePostAvatar' in home page is error , get image data error, error msg is ",
                reason
              );
            });
        }
      } else {
        let postAvatarSrc = postAvatar.getAttribute('src') || './assets/icon/reserve.svg';
        if (
          this.isLoadAvatarImage[id] === '13' &&
          postAvatarSrc != './assets/icon/reserve.svg'
        ) {
          postAvatar.setAttribute('src', '/assets/icon/reserve.svg');
          delete this.isLoadAvatarImage[id];
          delete this.avatarImageMap[id];
        }
      }
    } catch (error) {
      delete this.isLoadAvatarImage[id];
      delete this.avatarImageMap[id];
    }
  }

  initTitleBar() {
    let title = this.translate.instant('FeedsPage.tabTitle1');
    if ("FeedsPage.tabTitle1" === title) {
      let code = localStorage.getItem('io.trinity.feeds.language') || "";
      if (code === "zh") {
        title = "主页";
      } else if (code === "en") {
        title = "Home";
      } else {
        title = "Home";
      }
    }
    this.titleBarService.setTitle(this.titleBar, title);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  showBigImage(destDid: string, channelId: string, postId: string) {
    this.pauseAllVideo();
    this.zone.run(async () => {

      let imagesId = destDid + '-' + channelId + '-' + postId + 'postimg';
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
              'FeedsPage.tabTitle1',
              this.appService,
              false,
              ''
            );
          } else {
            //下载原图
            this.isImgLoading[this.imgCurKey] = false;//隐藏loading
            if (this.isExitDown()) {
              this.openAlert();
              return;
            }

            this.imgDownStatusKey = destDid + '-' + channelId + '-' + postId;
            this.imgDownStatus[this.imgDownStatusKey] = '1';
            this.isImgPercentageLoading[this.imgCurKey] = true;

            //await this.native.showLoading('common.waitMoment');
            this.hiveVaultController
              .getV3Data(destDid, imageKey, fileOriginName, type)
              .then(async realImg => {
                let img = realImg || '';
                this.imgDownStatus[this.imgDownStatusKey] = '';
                this.isImgLoading[this.imgCurKey] = false;
                this.isImgPercentageLoading[this.imgCurKey] = false;
                if (img != '') {
                  this.viewHelper.openViewer(
                    this.titleBar,
                    realImg,
                    'common.image',
                    'FeedsPage.tabTitle1',
                    this.appService,
                    false,
                    ''
                  );
                }
              }).catch(() => {
                this.imgDownStatus[this.imgDownStatusKey] = '';
                this.isImgLoading[this.imgCurKey] = false;
                this.isImgPercentageLoading[this.imgCurKey] = false;
              });
          }
        }).catch((err) => {
          this.imgDownStatus[this.imgDownStatusKey] = '';
          this.isImgLoading[this.imgCurKey] = false;
          this.isImgPercentageLoading[this.imgCurKey] = false;
        });
    });
  }

  async handlePostImg(id: string, srcId: string, rowindex: number) {
    // 13 存在 12不存在
    let isload = this.isLoadimage[id] || '';
    let rpostimg = document.getElementById(id + 'rpostimg');
    let postImage = document.getElementById(id + 'postimg');
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
            postImage.style.display = 'none';
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
                rpostimg.style.display = 'block';
              } else {
                this.hiveVaultController.
                  getV3Data(destDid, thumbnailKey, fileThumbnaiName, type).
                  then((thumbImagedata) => {
                    let thumbImage = thumbImagedata || "";
                    if (thumbImage != '') {
                      this.isLoadimage[id] = '13';
                      postImage.setAttribute('src', thumbImagedata);
                      rpostimg.style.display = 'block';
                    } else {
                      this.isLoadimage[id] = '12';
                      rpostimg.style.display = 'none';
                    }
                  }).catch(() => {
                    rpostimg.style.display = 'none';
                  })
              }
            })
            .catch(reason => {
              rpostimg.style.display = 'none';
              Logger.error(TAG,
                "Excute 'handlePostImg' in home page is error , get image data error, error msg is ",
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
      this.isLoadimage[id] = '';
    }
  }

  async handleVideo(id: string, srcId: string, rowindex: number) {
    let isloadVideoImg = this.isLoadVideoiamge[id] || '';
    let vgplayer = document.getElementById(id + 'vgplayer');
    let video: any = document.getElementById(id + 'video') || '';
    let source: any = document.getElementById(id + 'source') || '';
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
          //vgplayer.style.display = "none";
          let arr = srcId.split('-');
          let destDid = arr[0];
          let postId: string = arr[2];

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

                //video.
                this.setFullScreen(id);
                this.setOverPlay(id, srcId, post);
              } else {
                this.isLoadVideoiamge[id] = '12';
                video.style.display = 'none';
                vgplayer.style.display = 'none';
              }
            })
            .catch(reason => {
              video.style.display = 'none';
              vgplayer.style.display = 'none';
              this.isLoadVideoiamge[id] = '';
              Logger.error(TAG,
                "Excute 'hanldVideo' in home page is error , get image data error, error msg is ",
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
    } catch (error) {
      this.isLoadVideoiamge[id] = '';
    }
  }


  ionScroll() {

    this.native.throttle(this.handleScroll(), 200, this, true);
    switch (this.tabType) {
      case 'feeds':
        this.native.throttle(this.setVisibleareaImage(), 200, this, true);
        break;
      case 'pasar':
        if (this.styleType === 'grid') {
          this.native.throttle(this.setPasarGridVisibleareaImage(), 200, this, true);
        } else if (this.styleType === 'list') {
          this.native.throttle(this.setPasarListVisibleareaImage(), 200, this, true);
        }
        break;
      default:
        break;
    }
  }

  refreshImage() {
    let sid = setTimeout(() => {
      this.setVisibleareaImage();
      clearTimeout(sid);
      sid = null;
    }, 100);
  }

  pauseVideo(id: string) {
    let videoElement: any = document.getElementById(id + 'video') || '';
    let source: any = document.getElementById(id + 'source') || '';
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
        let videoElement: any = document.getElementById(id + 'video') || '';
        if (videoElement != '') {
          videoElement.setAttribute('poster', "assets/images/loading.png"); // empty source
        }
        let source: any = document.getElementById(id + 'source') || '';
        if (source != '') {
          let sourcesrc = source.getAttribute('src') || '';
          if (source != '' && sourcesrc != '') {
            source.removeAttribute('src'); // empty source
          }
        }
      }
    }
  }

  removeClass(elem, cls) {
    var newClass = ' ' + elem.className.replace(/[\t\r\n]/g, '') + ' ';
    while (newClass.indexOf(' ' + cls + ' ') >= 0) {
      newClass = newClass.replace(' ' + cls + ' ', ' ');
    }
    elem.className = newClass.replace(/^\s+|\s+$/g, '');
  }

  setFullScreen(id: string) {
    let vgfullscreen = document.getElementById(id + 'vgfullscreenhome');
    vgfullscreen.onclick = () => {
      this.pauseVideo(id);
      let postImg: string = document
        .getElementById(id + 'video')
        .getAttribute('poster');
      let videoSrc: string = document
        .getElementById(id + 'source')
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
        let imgElement: any = document.getElementById(id + 'post-img') || '';
        if (imgElement != '') {
          imgElement.setAttribute('src', 'assets/images/loading.png'); // empty source
        }
      }
    }
  }

  setOverPlay(id: string, srcId: string, post: FeedsData.PostV3) {
    let vgoverlayplay: any =
      document.getElementById(id + 'vgoverlayplayhome') || '';
    let source: any = document.getElementById(id + 'source') || '';
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
    let videoId = destDid + '-' + channelId + '-' + postId + 'vgplayer';
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
              .getV3Data(destDid, originKey, fileName, type)
              .then((downVideoResult: string) => {
                let downVideodata = downVideoResult || '';
                if (downVideodata != '') {
                  this.videoDownStatus[this.videoDownStatusKey] = '';
                  this.isVideoLoading[this.videoCurKey] = false;
                  this.zone.run(() => {
                    this.loadVideo(id, downVideodata);
                  });
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
    let source: any = document.getElementById(id + 'source') || '';
    if (source === '') {
      return;
    }
    source.setAttribute('src', videodata);
    let vgoverlayplay: any = document.getElementById(id + 'vgoverlayplayhome');
    let vgcontrol: any = document.getElementById(id + 'vgcontrolshome');

    let video: any = document.getElementById(id + 'video');
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
      let id = nodeId + "-" + channelId + "-" + postId;
      let postImage = document.getElementById(id + 'postimg') || null;
      if (postImage != null) {
        postImage.setAttribute('src', value);
      }
      let post =
        _.find(this.postList, item => {
          return (
            item.nodeId === nodeId &&
            item.channel_id === parseInt(channelId) &&
            item.id === parseInt(postId)
          );
        }) || {};
      let content = post.content || {};
      let isNft = content.nftOrderId || '';
      this.viewHelper.openViewer(
        this.titleBar,
        value,
        'common.image',
        'FeedsPage.tabTitle1',
        this.appService,
        false,
        isNft
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

  async clickDashang(destDid: string, channelId: string, postId: string) {

    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
    let tippingAddress = '';
    if (tippingAddress != null) {
      tippingAddress = channel.tipping_address || '';
    }
    if (tippingAddress == "") {
      this.native.toast('common.noElaAddress');
      return;
    }
    this.pauseVideo(destDid + '-' + channelId + '-' + postId);
    this.viewHelper.showPayPrompt(destDid, channelId, tippingAddress);
  }

  retry(destDid: string, channelId: string, postId: string) {
    //重新发送Post
  }

  async buy(post: any) {
    this.native
      .showLoading('common.waitMoment')
      .then(() => {
        return this.nftContractHelperService.resolveBuyNFTFromPost(post);
      })
      .then((stateAndItem: FeedsData.OrderStateAndNFTItem) => {
        switch (stateAndItem.state) {
          case FeedsData.OrderState.SALEING:
            // this.native.navigateForward(['bid'], { queryParams: stateAndItem.item });
            this.navigateForwardBidPage(stateAndItem.item);
            break;
          case FeedsData.OrderState.SOLD:
            this.native.toast_trans('common.sold');
            break;
          case FeedsData.OrderState.CANCELED:
            this.native.toast_trans('common.offTheShelf');
            break;
          default:
            break;
        }
        this.native.hideLoading();
      })
      .catch(() => {
        this.native.hideLoading();
      });
  }

  async clickTab(type: string) {
    this.tabType = type;
    this.doRefreshCancel();
    switch (type) {
      case 'feeds':
        await this.content.scrollToTop(0);
        if (this.syncHiveDataStatus === 6) {
          this.handleRefresherInfinite(false);
        } else {
          this.handleRefresherInfinite(true);
        }
        this.isShowSearchField = false;
        this.refreshPostList();
        break;
      case 'pasar':
        await this.content.scrollToTop(0);
        if (this.pasarList.length === 0) {
          this.refresher.disabled = false;
          this.infiniteScroll.disabled = true;
        } else {
          this.handleRefresherInfinite(false);
        }
        this.elaPrice = this.dataHelper.getElaUsdPrice();
        let value =
          this.popoverController.getTop()['__zone_symbol__value'] || '';
        if (value != '') {
          this.popoverController.dismiss();
          this.popover = null;
        }

        this.removeImages();
        this.removeAllVideo();
        this.isLoadimage = {};
        this.isLoadVideoiamge = {};
        this.isInitLikeNum = {};
        this.isInitLikeStatus = {};
        this.isInitComment = {};
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

        this.hideFullScreen();
        this.native.hideLoading();

        // if (!this.pasarList || this.pasarList.length == 0) {
        this.searchText = '';
        await this.refreshLocalPasarData();
        this.refreshPasarGridVisibleareaImage();
        // }else{
        //   this.refreshPasarGridVisibleareaImage();
        // }
        break;
    }
  }

  async refreshLocalPasarData() {
    this.pasarList = await this.nftContractHelperService.loadData(0, this.sortType);
    this.pasarListPage = 1;
    this.refreshPasarGridVisibleareaImage();
  }

  async create() {

    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.pauseAllVideo();
    this.clearData();

    const channels = await this.dataHelper.getSelfChannelListV3();
    if (channels.length === 0) {
      this.native.navigateForward(['/createnewfeed'], '');
      return;
    }

    this.dataHelper.setSelsectNftImage("");
    this.native.navigateForward(['createnewpost'], '');
  }

  createNft() {
    let nftFirstdisclaimer = this.dataHelper.getNftFirstdisclaimer() || "";
    if (nftFirstdisclaimer === "") {
      this.viewHelper.showNftdisclaimerPrompt();
      return;
    }
    let accAdress = this.nftContractControllerService.getAccountAddress() || "";
    if (accAdress === "") {
      this.connectWallet();
      return;
    }
    this.native.navigateForward(['mintnft'], {});
  }

  async connectWallet() {
    await this.walletConnectControllerService.connect();
  }

  async getOpenOrderByIndex(index: number): Promise<FeedsData.NFTItem> {
    return new Promise(async (resolve, reject) => {
      try {
        const orderInfo = await this.nftContractHelperService.getOpenOrderByIndex(index);
        const tokenInfo = await this.nftContractHelperService.getTokenInfo(String(orderInfo.tokenId), true);
        const tokenJson = await this.nftContractHelperService.getTokenJson(tokenInfo.tokenUri);
        const item: FeedsData.NFTItem = this.nftContractHelperService.createItemFromOrderInfo(orderInfo, tokenInfo, tokenJson, 'onSale');
        resolve(item);
      } catch (error) {
        Logger.error(error);
        reject(error);
      }
    });
  }

  clickAssetItem(assetitem: any) {
    assetitem['showType'] = 'buy';
    Logger.log(TAG, 'Click asset item', assetitem);
    this.clearData();
    this.navigateForwardBidPage(assetitem);
  }

  isNftOrderId(nodeId: string, channelId: number, postId: number) {
    let post =
      _.find(this.postList, item => {
        return (
          item.nodeId === nodeId &&
          item.channel_id === channelId &&
          item.id === postId
        );
      }) || {};
    //homebidAvatar
    let nftOrderId = post.content.nftOrderId || '';
    if (nftOrderId != '') {
      this.nftImageType[nftOrderId] = post.content.nftImageType || '';
      return nftOrderId;
    }
    return '';
  }

  clickMore(parm: any) {
    let asstItem = parm['assetItem'];
    let accountAddress = this.nftContractControllerService.getAccountAddress();
    if (asstItem['sellerAddr'] === accountAddress) {
      this.handleOnSale(asstItem);
    } else {
      this.handleShareOnShare(asstItem);
    }
  }

  handleOnSale(asstItem: any) {
    this.menuService.showOnSaleMenu(asstItem);
  }

  handleShareOnShare(asstItem: any) {
    this.menuService.showShareOnSaleMenu(asstItem);
  }

  doRefreshCancel() {
    if (this.refreshEvent) {
      this.refreshEvent.target.complete();
      this.refreshEvent = null;
    }
  }

  async handleCancelOrder(tokenId: any, curTokenNum: any, assetItem: any, createAddr: any, saleOrderId: any, clist: any, sellerAddr: any) {
    //add OwnNftCollectiblesList
    if (parseInt(curTokenNum) === 0) {

      clist = _.filter(clist, item => {
        return item.tokenId != tokenId;
      });

      clist.push(assetItem);
      this.nftPersistenceHelper.setCollectiblesMap(createAddr, clist);

    } else {

      clist = _.filter(clist, item => {
        return item.saleOrderId != saleOrderId;
      });

      let index = _.findIndex(clist, (item: any) => {
        return item.tokenId === tokenId && item.moreMenuType === "created";
      });

      assetItem.curQuantity = (parseInt(curTokenNum) + parseInt(assetItem.curQuantity)).toString();
      clist[index] = _.cloneDeep(assetItem);
      this.nftPersistenceHelper.setCollectiblesMap(createAddr, clist);
    }

    // let pList = this.nftPersistenceHelper.getPasarList();
    let pList = _.filter(this.pasarList, item => {
      return !(
        item.saleOrderId === saleOrderId && item.sellerAddr === sellerAddr
      );
    });
    this.pasarList = pList;
    //this.searchPasar = _.cloneDeep(this.pasarList);
    // this.nftPersistenceHelper.setPasarList(pList);
    this.dataHelper.deletePasarItem(saleOrderId);
  }

  handleScroll() {
    this.content.getScrollElement().then((ponit: any) => {
      if (this.isAndroid) {
        this.handelAndroidScroll(ponit);
      } else {
        this.handelIosScroll(ponit);
      }

    });
  }

  handelAndroidScroll(ponit: any) {

    if (ponit.scrollTop > 0) {
      this.homeTittleBar.style.display = "none";
      this.homeTab.setAttribute("style", "top:0px;height:47px;line-height:37px;");
      let sort = this.elmRef.nativeElement.querySelector("#sort") || null;
      if (sort != null) {
        sort.setAttribute("style", "top:93px;");
      }
    } else {
      this.homeTittleBar.style.display = "block";
      this.homeTab.setAttribute("style", "top:31px;height:34px;");
      let sort = this.elmRef.nativeElement.querySelector("#sort") || null;
      if (sort != null) {
        sort.setAttribute("style", "top:132px;");
      }
    }
  }

  handelIosScroll(ponit: any) {
    if (ponit.scrollTop > 0) {
      this.homeTittleBar.style.display = "none";
      this.homeTab.setAttribute("style", "top:0px;height:47px;line-height:37px;");
    } else {
      this.homeTittleBar.style.display = "block";
      this.homeTab.setAttribute("style", "top:36px;height:34px;");
    }
  }

  ionClear() {
    this.searchText = '';
    this.isShowSearchField = false;
    this.handleRefresherInfinite(false);

    const isShowAdult = this.dataHelper.getAdultStatus();
    let searchPasar = this.dataHelper.getPasarItemListWithAdultFlag(isShowAdult);

    if (searchPasar.length > 0) {
      this.pasarList = searchPasar;
      this.refreshPasarGridVisibleareaImage();
    }
  }

  getItems(events: any) {
    this.searchText = events.target.value || '';

    if (events && events.keyCode === 13) {
      this.keyboard.hide();
      if (this.searchText === "" || this.searchText === null) {
        this.ionClear();
        return;
      }
      this.handleRefresherInfinite(true);
      this.handlePasarSearch();
    }
  }

  handlePasarSearch() {
    this.zone.run(async () => {
      await this.native.showLoading('common.waitMoment');
      this.pasarList = await this.nftContractHelperService.searchPasarOrder(FeedsData.SearchType.DEFAULT, this.searchText, this.sortType);
      this.refreshPasarGridVisibleareaImage();
      this.native.hideLoading();
    });
  }

  handleRefresherInfinite(isOpen: boolean) {
    this.refresher.disabled = isOpen;
    this.infiniteScroll.disabled = isOpen;
  }

  clickfilterCircle() {
    this.isShowSearchField = !this.isShowSearchField;
  }

  setPasarGridVisibleareaImage() {
    let homePasarGrid = document.getElementById("homePasarGrid") || null;
    if (homePasarGrid === null) {
      return;
    }
    let homePasarGridCols = homePasarGrid.getElementsByClassName("homePasarGridCol") || null;
    let len = homePasarGridCols.length;
    for (let itemIndex = 0; itemIndex < len; itemIndex++) {
      let item = homePasarGridCols[itemIndex];
      let id = item.getAttribute("id") || "";
      if (id === "") {
        continue;
      }
      let arr = id.split("-");
      let fileName = arr[0];
      let kind = arr[1];
      let size = arr[2];
      let thumbImage = document.getElementById(fileName + "-homeImg");
      let srcStr = thumbImage.getAttribute("src") || "";
      let isload = this.pasarGridisLoadimage[fileName] || '';
      try {
        if (
          id != '' &&
          thumbImage.getBoundingClientRect().top >= -100 &&
          thumbImage.getBoundingClientRect().bottom <= this.clientHeight
        ) {
          if (isload === "") {
            // if (kind == 'gif' && size && parseInt(size, 10) > 10 * 1000 * 1000) {
            //   Logger.log(TAG, 'Work around, Not show');
            //   continue;
            // }

            let fetchUrl = this.ipfsService.getNFTGetUrl() + fileName;
            this.pasarGridisLoadimage[fileName] = '12';
            this.fileHelperService.getNFTData(fetchUrl, fileName, kind).then((data) => {
              this.zone.run(() => {
                this.pasarGridisLoadimage[fileName] = '13';
                let dataSrc = data || "";
                if (dataSrc != "") {
                  thumbImage.setAttribute("src", data);
                }
              });
            }).catch((err) => {
              if (this.pasarGridisLoadimage[fileName] === '13') {
                this.pasarGridisLoadimage[fileName] = '';
                thumbImage.setAttribute('src', './assets/icon/reserve.svg');
              }
            });
          }
        } else {
          srcStr = thumbImage.getAttribute('src') || '';
          if (
            thumbImage.getBoundingClientRect().top < -100 &&
            this.pasarGridisLoadimage[fileName] === '13' &&
            srcStr != './assets/icon/reserve.svg'
          ) {
            this.pasarGridisLoadimage[fileName] = '';
            thumbImage.setAttribute('src', './assets/icon/reserve.svg');
          }
        }
      } catch (error) {
        if (this.pasarGridisLoadimage[fileName] === '13') {
          this.pasarGridisLoadimage[fileName] = '';
          thumbImage.setAttribute('src', './assets/icon/reserve.svg');
        }
      }
    }
  }


  setPasarListVisibleareaImage() {

    let homePasarList = document.getElementById("homePasarList") || null;
    if (homePasarList === null) {
      return;
    }
    let homePasarListCol = homePasarList.getElementsByClassName("homePasarListCol") || null;
    let len = homePasarListCol.length;

    for (let itemIndex = 0; itemIndex < len; itemIndex++) {
      let item = homePasarListCol[itemIndex];
      let id = item.getAttribute("id") || "";
      if (id === "") {
        continue;
      }
      let arr = id.split("-");
      let fileName = arr[0];
      let kind = arr[1];
      let size = arr[2];
      let thumbImage = document.getElementById(fileName + "-thumbImage") || null;
      let srcStr = thumbImage.getAttribute("src") || "";
      let isload = this.pasarListisLoadimage[fileName] || '';

      try {
        if (
          id != '' &&
          thumbImage.getBoundingClientRect().top >= -100 &&
          thumbImage.getBoundingClientRect().bottom <= this.clientHeight
        ) {
          if (isload === "") {
            //  if (kind == 'gif' && size && parseInt(size, 10) > 10 * 1000 * 1000) {
            //    Logger.log(TAG, 'Work around, Not show');
            //    continue;
            //  }

            let fetchUrl = this.ipfsService.getNFTGetUrl() + fileName;
            this.pasarListisLoadimage[fileName] = '12';

            this.fileHelperService.getNFTData(fetchUrl, fileName, kind).then((data) => {
              this.zone.run(() => {
                this.pasarListisLoadimage[fileName] = '13';
                let dataSrc = data || "";
                if (dataSrc != "") {
                  thumbImage.setAttribute("src", data);
                }
              });
            }).catch((err) => {
              if (this.pasarListisLoadimage[fileName] === '13') {
                this.pasarListisLoadimage[fileName] = '';
                thumbImage.setAttribute('src', './assets/icon/reserve.svg');
              }
            });
          }
        } else {
          srcStr = thumbImage.getAttribute('src') || '';
          if (
            thumbImage.getBoundingClientRect().top < -100 &&
            this.pasarListisLoadimage[fileName] === '13' &&
            srcStr != './assets/icon/reserve.svg'
          ) {
            this.pasarListisLoadimage[fileName] = '';
            thumbImage.setAttribute('src', './assets/icon/reserve.svg');
          }
        }
      } catch (error) {
        if (this.pasarListisLoadimage[fileName] === '13') {
          this.pasarListisLoadimage[fileName] = '';
          thumbImage.setAttribute('src', './assets/icon/reserve.svg');
        }
      }
    }
  }

  handleId(item: any) {
    let thumbnailUri = "";
    let kind = "";
    let size = "";
    let version = item["version"] || "1";
    if (version === "1") {
      thumbnailUri = item['thumbnail'] || "";
      kind = item["kind"];
      size = item["originAssetSize"];
      if (!size)
        size = '0';
      if (kind === "gif" && parseInt(size) <= 5 * 1024 * 1024) {
        thumbnailUri = item['asset'] || "";
      }
    } else if (version === "2") {
      let jsonData = item['data'] || "";
      if (jsonData != "") {
        thumbnailUri = jsonData['thumbnail'] || "";
        kind = jsonData["kind"];
        size = jsonData["size"];
        if (!size)
          size = '0';
        if (kind === "gif" && parseInt(size) <= 5 * 1024 * 1024) {
          thumbnailUri = jsonData['image'] || "";;
        }
      } else {
        thumbnailUri = "";
      }
    }
    if (thumbnailUri === "") {
      return "";
    }

    if (thumbnailUri.indexOf('feeds:imgage:') > -1) {
      thumbnailUri = thumbnailUri.replace('feeds:imgage:', '');
    } else if (thumbnailUri.indexOf('feeds:image:') > -1) {
      thumbnailUri = thumbnailUri.replace('feeds:image:', '');
    } else if (thumbnailUri.indexOf('pasar:image:') > -1) {
      thumbnailUri = thumbnailUri.replace('pasar:image:', '');
    }
    return thumbnailUri + "-" + kind + "-" + size;
  }

  async changeSortType(sortType: number, event: any) {
    this.sortType = sortType;
    this.dataHelper.setFeedsSortType(sortType);
    event.stopPropagation();
    await this.native.showLoading('common.waitMoment');
    let searchText = this.searchText || '';
    if (searchText != '') {
      this.pasarList = await this.nftContractHelperService.searchPasarOrder(FeedsData.SearchType.DEFAULT, this.searchText, this.sortType);
      this.refreshPasarGridVisibleareaImage();
    } else {
      await this.refreshPasarList();
    }
    this.isShowSearchField = false;
    this.native.hideLoading();
  }

  clickSortArrow() {
    this.isShowSearchField = false;
    // this.searchText = "";
    // if (this.searchBeforePasar.length > 0) {
    //   this.pasarList = _.cloneDeep(this.searchBeforePasar);
    //   this.searchBeforePasar = [];
    //   this.refreshPasarGridVisibleareaImage();
    // }
    // this.handleRefresherInfinite(false);
  }

  navigateForwardBidPage(assetItem: FeedsData.NFTItem) {
    this.dataHelper.setBidPageAssetItem(assetItem);
    this.native.navigateForward(['bid'], { queryParams: assetItem });
  }

  async tryButton() {
    this.syncHiveDataStatus = 0;
    this.syncHiveDataDes = "GalleriahivePage.preparingData";
    try {
      await this.hiveVaultController.deleteCollection(HiveVaultHelper.TABLE_FEEDS_SCRIPTING);
    } catch (error) {

    }
    const signinData = await this.dataHelper.getSigninData();
    let userDid = signinData.did
    localStorage.removeItem(userDid + HiveVaultController.CREATEALLCollECTION);
    this.dataHelper.setSyncHiveData({ status: this.syncHiveDataStatus, describe: this.syncHiveDataDes });
    this.events.publish(FeedsEvent.PublishType.initHiveData);
  }
}
