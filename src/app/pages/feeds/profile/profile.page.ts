import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { ModalController, PopoverController } from '@ionic/angular';
import { Events } from 'src/app/services/events.service';
import { ThemeService } from 'src/app/services/theme.service';
import { IonInfiniteScroll } from '@ionic/angular';
import { MenuService } from 'src/app/services/MenuService';
import { NativeService } from 'src/app/services/NativeService';
import { AppService } from 'src/app/services/AppService';
import { PopupProvider } from 'src/app/services/popup';
import { IntentService } from 'src/app/services/IntentService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from 'src/app/services/StorageService';
import _ from 'lodash';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import { UtilService } from 'src/app/services/utilService';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { Logger } from 'src/app/services/logger';
import { NFTContractHelperService } from 'src/app/services/nftcontract_helper.service';
import { FileHelperService } from 'src/app/services/FileHelperService';
import { PostHelperService } from 'src/app/services/post_helper.service';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';
import { HiveService } from 'src/app/services/HiveService';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { FeedService } from 'src/app/services/FeedService';
import { CommonPageService } from 'src/app/services/common.page.service';

let TAG: string = 'Feeds-profile';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonInfiniteScroll, { static: true })
  infiniteScroll: IonInfiniteScroll;

  public channels = []; //myFeeds page

  public collectiblesList: FeedsData.NFTItem[] = []; //NFT列表
  public totalLikeList = [];
  public startIndex: number = 0;
  public pageNumber: number = 5;
  public likeList = []; //like page
  public selectType: string = 'ProfilePage.myFeeds';
  public followers = 0;

  // Sign in data
  public name: string = '';
  public avatar: string = '';
  public description: string = '';

  public hideComment = true;

  // For comment component
  public postId = null;
  public nodeId = null;
  public channelId = null;
  public channelAvatar = null;
  public channelName = null;

  public curItem: any = {};

  public clientHeight: number = 0;
  private clientWidth: number = 0;
  private isInitLikeNum: any = {};
  private isInitLikeStatus: any = {};
  private isInitComment: any = {};
  private isLoadimage: any = {};
  private isLoadAvatarImage: any = {};
  public isLoadVideoiamge: any = {};
  public videoIamges: any = {};

  public cacheGetBinaryRequestKey: string = '';
  public cachedMediaType = '';

  public fullScreenmodal: any = '';

  public curPostId: string = '';

  public popover: any = '';

  public hideDeletedPosts: boolean = false;

  public hideSharMenuComponent: boolean = false;

  public qrCodeString: string = null;

  public isShowUnfollow: boolean = false;

  public isShowQrcode: boolean = false;

  public isShowTitle: boolean = false;

  public isShowInfo: boolean = false;

  public isPreferences: boolean = false;

  public shareDestDid: string = '';

  public shareChannelId: string = '';

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

  public isAddProfile: boolean = false;

  public likeSum: number = 0;

  public ownNftSum: number = 0;

  public myFeedsSum: number = 0;


  public walletAddress: string = '';
  public walletAddressStr: string = '';
  public onSaleList: any = [];
  public isFinsh: any = [];

  public elaPrice: string = null;

  private notSaleOrderCount = 0;
  private saleOrderCount = 0;

  private refreshSaleOrderFinish = false;
  private refreshNotSaleOrderFinish = false;

  private isRefreshingCollectibles = false;
  private refreshingCollectiblesHelper: FeedsData.NFTItem[] = [];
  public isAutoGet: string = 'unAuto';
  public thumbImageName: string = "profileImg";
  private profileCollectiblesisLoadimage: any = {};
  private myFeedsIsLoadimage: any = {};
  private sortType = FeedsData.SortType.TIME_ORDER_LATEST;
  private collectiblesPageNum: number = 0;

  private likeMap: any = {};
  private likeNumMap: any = {};
  private commentNumMap: any = {};
  private channelNameMap: any = {};
  public isLoadingLikeMap: any = {};
  private downPostAvatarMap: any = {};
  private avatarImageMap: any = {};
  private downMyFeedsAvatarMap: any = {};
  private myFeedsAvatarImageMap: any = {};

  constructor(
    public theme: ThemeService,
    private events: Events,
    private zone: NgZone,
    public menuService: MenuService,
    public native: NativeService,
    public appService: AppService,
    public modalController: ModalController,
    public popupProvider: PopupProvider,
    public popoverController: PopoverController,
    private intentService: IntentService,
    private viewHelper: ViewHelper,
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private storageService: StorageService,
    private walletConnectControllerService: WalletConnectControllerService,
    private nftContractControllerService: NFTContractControllerService,
    private ipfsService: IPFSService,
    private nftPersistenceHelper: NFTPersistenceHelper,
    private dataHelper: DataHelper,
    private nftContractHelperService: NFTContractHelperService,
    private fileHelperService: FileHelperService,
    private postHelperService: PostHelperService,
    private feedsServiceApi: FeedsServiceApi,
    private hiveVaultController: HiveVaultController,
    private feedService: FeedService
  ) {
  }

  ngOnInit() {
  }

  async initMyFeeds(channels?: FeedsData.ChannelV3[]) {
    try {
      let newChannels = channels || null;
      if (newChannels != null) {
        channels = _.uniqWith(newChannels, _.isEqual) || [];
        newChannels = _.sortBy(newChannels, (item: FeedsData.ChannelV3) => {
          return -item.createdAt;
        });
        this.channels = newChannels;
      } else {
        let newSelfChannels = await this.dataHelper.getSelfChannelListV3() || [];
        newSelfChannels = _.sortBy(newSelfChannels, (item: FeedsData.ChannelV3) => {
          return -item.createdAt;
        });
        this.channels = _.uniqWith(newSelfChannels, _.isEqual) || [];
      }

      this.myFeedsSum = this.channels.length;
      let followedList = await this.dataHelper.getSubscribedChannelV3List(FeedsData.SubscribedChannelType.OTHER_CHANNEL) || [];
      this.followers = followedList.length;
      this.refreshMyFeedsVisibleareaImage();
    } catch (error) {

    }
  }

  initLike() {
    // 赞/收藏
    this.startIndex = 0;
    this.initRefresh();
  }

  async initRefresh() {
    this.totalLikeList = await this.sortLikeList();
    this.likeSum = this.totalLikeList.length;
    this.startIndex = 0;
    if (this.totalLikeList.length - this.pageNumber > 0) {
      this.likeList = this.totalLikeList.slice(0, this.pageNumber);
      this.isLoadimage = {};
      this.isLoadVideoiamge = {};
      this.isLoadAvatarImage = {};
      this.avatarImageMap = {};
      this.downPostAvatarMap = {};
      this.isInitLikeNum = {};
      this.isInitLikeStatus = {};
      this.isInitComment = {};
      this.refreshImage();
      this.startIndex++;
    } else {
      this.likeList = this.totalLikeList;
      this.isLoadimage = {};
      this.isLoadVideoiamge = {};
      this.isLoadAvatarImage = {};
      this.avatarImageMap = {};
      this.downPostAvatarMap = {};
      this.isInitLikeNum = {};
      this.isInitLikeStatus = {};
      this.isInitComment = {};
      this.refreshImage();
    }
  }

  async refreshLikeList() {
    if (this.startIndex === 0) {
      this.initRefresh();
      return;
    }

    this.totalLikeList = await this.sortLikeList();
    this.likeSum = this.totalLikeList.length;
    if (this.totalLikeList.length === this.likeList.length) {
      this.likeList = this.totalLikeList;
    } else if (this.totalLikeList.length - this.pageNumber * this.startIndex > 0) {
      this.likeList = this.likeList.slice(0, this.startIndex * this.pageNumber);
    } else {
      this.likeList = this.totalLikeList;
    }
    this.isLoadimage = {};
    this.isLoadVideoiamge = {};
    this.isLoadAvatarImage = {};
    this.avatarImageMap = {};
    this.downPostAvatarMap = {};
    this.isInitLikeNum = {};
    this.isInitLikeStatus = {};
    this.isInitComment = {};
    this.refreshImage();
  }

  async sortLikeList() {
    let likeList = [];
    try {
      let likes: FeedsData.LikeV3[] = await this.dataHelper.getSelfAllLikeV3Data() || [];
      for (let likeIndex = 0; likeIndex < likes.length; likeIndex++) {
        let item = likes[likeIndex];
        if (item.commentId === '0' && item.status === FeedsData.PostCommentStatus.available) {
          let post = await this.dataHelper.getPostV3ById(item.destDid, item.postId) || null;
          if (post != null) {
            likeList.push(post);
          }
        }
      }
    } catch (error) {

    }

    likeList = _.sortBy(likeList, (item: any) => {
      return -item.createdAt;
    });

    this.hideDeletedPosts = this.dataHelper.getHideDeletedPosts();
    if (!this.hideDeletedPosts) {
      likeList = _.filter(likeList, (item: any) => {
        return item.status != 1;
      });
    }
    return likeList;
  }

  async addProflieEvent() {
    this.updateWalletAddress("");
    this.events.subscribe(FeedsEvent.PublishType.clickDisconnectWallet, () => {
      this.walletAddress = '';
      this.walletAddressStr = '';
      this.ownNftSum = 0;
    });
    this.events.subscribe(FeedsEvent.PublishType.nftUpdatePrice, async (nftPrice) => {
      // this.price = nftPrice;
      await this.getCollectiblesList();
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

      let textObj = {
        "isLoading": true,
        "loadingTitle": title,
        "loadingText": des,
        "loadingCurNumber": curNum,
        "loadingMaxNumber": maxNum
      }
      this.events.publish(FeedsEvent.PublishType.nftLoadingUpdateText, textObj);

    });

    this.events.subscribe(FeedsEvent.PublishType.endLoading, (obj) => {
      let textObj = {
        "isLoading": false,
      }
      this.events.publish(FeedsEvent.PublishType.nftLoadingUpdateText, textObj);
    });

    this.events.subscribe(FeedsEvent.PublishType.nftUpdateList, obj => {
      let type = obj['type'];
      let burnNum = obj["burnNum"] || "0";
      let sellQuantity = obj["sellQuantity"] || "0";
      let assItem = obj['assItem'];
      let createAddr = this.nftContractControllerService.getAccountAddress();
      Logger.log(TAG, 'Update asset item', assItem);
      Logger.log(TAG, 'this.collectiblesList', this.collectiblesList);

      //let saleOrderId = assItem['saleOrderId'];
      let tokenId = assItem['tokenId'];
      switch (type) {
        case 'transfer':
          let transferNum = obj["transferNum"];
          this.handleNftTransfer(tokenId, createAddr, transferNum);
          break;
        case 'burn':
          this.handleNftBurn(tokenId, createAddr, burnNum);
          break;
        case 'created':
          this.handleCreate(tokenId, createAddr, assItem, sellQuantity);
          break;
      }
    });

    this.events.subscribe(FeedsEvent.PublishType.nftCancelOrder, async assetItem => {

      let saleOrderId = assetItem.saleOrderId;
      let sellerAddr = assetItem.sellerAddr;
      let tokenId = assetItem.tokenId;

      let curTokenNum = await this.nftContractControllerService
        .getSticker().balanceOf(tokenId);

      let createAddr = this.nftContractControllerService.getAccountAddress();
      assetItem['fixedAmount'] = null;
      assetItem['moreMenuType'] = 'created';
      let clist = this.nftPersistenceHelper.getCollectiblesList(createAddr);
      this.handleCancelOrder(tokenId, curTokenNum, assetItem, createAddr, saleOrderId, clist, sellerAddr);
    });

    this.events.subscribe(
      FeedsEvent.PublishType.walletAccountChanged,
      (walletAccount) => {
        this.zone.run(async () => {
          this.updateWalletAddress(walletAccount);
          //await this.getOwnNftSum();
          if (walletAccount != '') {
            await this.getCollectiblesList();
          }
        });
      },
    );


    this.hideDeletedPosts = this.dataHelper.getHideDeletedPosts();
    this.clientHeight = screen.availHeight;
    this.clientWidth = screen.availWidth;
    this.curItem = {};
    this.changeType(this.selectType);

    this.events.subscribe(FeedsEvent.PublishType.hideDeletedPosts, () => {
      this.zone.run(() => {
        this.hideDeletedPosts = this.dataHelper.getHideDeletedPosts();
        this.refreshLikeList();
      });
    });


    let signInData = await this.dataHelper.getSigninData();

    this.name = signInData['nickname'] || signInData['name'] || '';
    this.description = signInData['description'] || '';
    let userDid = signInData['did'] || '';
    let avatar = await this.feedService.getUserAvatar(userDid);

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

    this.avatar = imgUri;

    this.events.subscribe(FeedsEvent.PublishType.updateLikeList, list => {
      this.zone.run(() => {
        this.refreshLikeList();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.channelsDataUpdate, () => {
      this.zone.run(() => {
        this.initMyFeeds();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.refreshPage, () => {
      this.zone.run(() => {
        this.initMyFeeds();
        this.initLike();
      });
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
      Logger.log(TAG, "======= Receive editPostFinish ========");
      this.zone.run(() => {
        this.refreshLikeList();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.deletePostFinish, (deletePostEventData: any) => {
      this.zone.run(async () => {
        await this.native.showLoading('common.waitMoment');
        try {
          let post: FeedsData.PostV3 = await this.dataHelper.getPostV3ById(deletePostEventData.destDid, deletePostEventData.postId);
          this.hiveVaultController.deletePost(post).then(async (result: any) => {
            this.refreshLikeList();
            this.native.hideLoading();
          }).catch((err: any) => {
            this.native.hideLoading();
          })
        } catch (error) {
          this.native.hideLoading();
        }
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      if (this.menuService.postDetail != null) {
        this.menuService.hideActionSheet();
        this.showMenuMore(this.curItem);
      }
    });

    this.events.subscribe(FeedsEvent.PublishType.openRightMenu, () => {
      this.isImgPercentageLoading[this.imgDownStatusKey] = false;
      this.isImgLoading[this.imgDownStatusKey] = false;
      this.imgDownStatus[this.imgDownStatusKey] = '';

      this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
      this.isVideoLoading[this.videoDownStatusKey] = false;
      this.videoDownStatus[this.videoDownStatusKey] = '';
      this.curPostId = '';
      this.pauseAllVideo();
      this.hideFullScreen();
    });

    this.events.subscribe(FeedsEvent.PublishType.tabSendPost, () => {
      this.hideSharMenuComponent = false;
      this.isImgPercentageLoading[this.imgDownStatusKey] = false;
      this.isImgLoading[this.imgDownStatusKey] = false;
      this.imgDownStatus[this.imgDownStatusKey] = '';

      this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
      this.isVideoLoading[this.videoDownStatusKey] = false;
      this.videoDownStatus[this.videoDownStatusKey] = '';
      this.pauseAllVideo();
    });

  }

  async ionViewWillEnter() {
    this.initTitleBar();
    this.elaPrice = this.dataHelper.getElaUsdPrice();
    this.events.subscribe(FeedsEvent.PublishType.addProflieEvent, async () => {
      this.elaPrice = this.dataHelper.getElaUsdPrice();
      if (!this.collectiblesList || this.collectiblesList.length == 0) {
        await this.getCollectiblesList();
      }

      this.addProflieEvent();
      this.isAddProfile = true;
    });

    this.addProflieEvent();

    this.initMyFeeds();

    if (!this.collectiblesList || this.collectiblesList.length == 0) {
      await this.getCollectiblesList();
    }


    this.totalLikeList = await this.sortLikeList() || [];
    this.likeSum = this.totalLikeList.length;
  }

  ionViewWillLeave() {
    this.events.unsubscribe(FeedsEvent.PublishType.addProflieEvent);
    this.clearData();
  }

  initTitleBar() {
    let title = this.translate.instant('FeedsPage.tabTitle2');
    this.titleBarService.setTitle(this.titleBar, title);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  clearData() {
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = null;
    }
    this.isAddProfile = false;
    this.hideSharMenuComponent = false;
    this.events.unsubscribe(FeedsEvent.PublishType.updateLikeList);
    this.events.unsubscribe(FeedsEvent.PublishType.channelsDataUpdate);
    this.events.unsubscribe(FeedsEvent.PublishType.refreshPage);

    this.events.unsubscribe(FeedsEvent.PublishType.editPostFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.deletePostFinish);

    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
    this.events.unsubscribe(FeedsEvent.PublishType.openRightMenu);
    this.events.unsubscribe(FeedsEvent.PublishType.tabSendPost);
    this.events.unsubscribe(FeedsEvent.PublishType.hideDeletedPosts);
    this.events.unsubscribe(FeedsEvent.PublishType.startLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.endLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.nftCancelOrder);
    this.events.unsubscribe(FeedsEvent.PublishType.walletAccountChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.nftUpdateList);
    this.events.unsubscribe(FeedsEvent.PublishType.nftdisclaimer);

    this.events.unsubscribe(FeedsEvent.PublishType.nftUpdatePrice);
    this.events.unsubscribe(FeedsEvent.PublishType.clickDisconnectWallet);
    this.clearDownStatus();
    this.native.hideLoading();
    this.hideFullScreen();
    CommonPageService.removeAllAvatar(this.myFeedsIsLoadimage, 'myFeedsAvatar')
    this.removeImages();
    this.removeAllVideo();
    this.isLoadimage = {};
    this.isLoadVideoiamge = {};
    this.isLoadAvatarImage = {};
    this.avatarImageMap = {};
    this.downPostAvatarMap = {};
    this.isInitLikeNum = {};
    this.isInitLikeStatus = {};
    this.isInitComment = {};
    this.myFeedsIsLoadimage = {};
    this.downMyFeedsAvatarMap = {};
    this.myFeedsAvatarImageMap = {};
    this.curItem = {};
    this.curPostId = '';
  }

  clearDownStatus() {
    this.isImgPercentageLoading[this.imgDownStatusKey] = false;
    this.isImgLoading[this.imgDownStatusKey] = false;
    this.imgDownStatus[this.imgDownStatusKey] = '';
    this.imgPercent = 0;
    this.imgRotateNum['transform'] = 'rotate(0deg)';

    this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
    this.isVideoLoading[this.videoDownStatusKey] = false;
    this.videoDownStatus[this.videoDownStatusKey] = '';
    this.videoPercent = 0;
    this.videoRotateNum = 'rotate(0deg)';
  }

  async changeType(type: string) {
    this.pauseAllVideo();
    this.selectType = type;
    this.hideSharMenuComponent = false;
    switch (type) {
      case 'ProfilePage.myFeeds':
        this.initMyFeeds();
        break;
      case 'ProfilePage.collectibles':
        this.elaPrice = this.dataHelper.getElaUsdPrice();
        //if (!this.collectiblesList || this.collectiblesList.length == 0)
        await this.getCollectiblesList();
        break;
      case 'ProfilePage.myLikes':
        this.startIndex = 0;
        this.initLike();
        break;
    }

    this.isRefreshingCollectibles = false;
  }

  async doRefresh(event: any) {
    //this.updateWalletAddress(null);
    switch (this.selectType) {
      case 'ProfilePage.myFeeds':
        try {
          const did = (await this.dataHelper.getSigninData()).did;
          const selfchannels = await this.hiveVaultController.syncSelfChannel(did);
          await this.initMyFeeds(selfchannels);
          event.target.complete();
        } catch (error) {
          event.target.complete();
        }
        break;
      case 'ProfilePage.collectibles':
        try {
          await this.refreshCollectibles();
          this.refreshCollectiblesVisibleareaImage();
          event.target.complete();
        } catch (error) {
          event.target.complete();
        }

        break;
      case 'ProfilePage.myLikes':
        try {
          await this.hiveVaultController.syncAllLikeData();
          this.startIndex = 0;
          this.initLike();
          event.target.complete();
        } catch (error) {
          event.target.complete();
        }
        break;
    }
  }

  loadData(event: any) {
    switch (this.selectType) {
      case 'ProfilePage.myFeeds':
        event.target.complete();
        break;
      case 'ProfilePage.collectibles':
        this.zone.run(async () => {
          this.collectiblesPageNum++;
          let list = await this.nftContractHelperService.loadCollectiblesData(null, this.collectiblesPageNum, this.sortType);

          list = _.unionWith(this.collectiblesList, list, _.isEqual);
          // this.collectiblesList = this.nftContractHelperService.sortData(list, this.sortType);

          this.refreshCollectiblesVisibleareaImage();
          event.target.complete();
        });
        break;
      case 'ProfilePage.myLikes':
        let sId = setTimeout(() => {
          let arr = [];
          if (
            this.totalLikeList.length - this.pageNumber * this.startIndex >
            this.pageNumber
          ) {
            arr = this.totalLikeList.slice(
              this.startIndex * this.pageNumber,
              (this.startIndex + 1) * this.pageNumber,
            );
            this.startIndex++;
            this.zone.run(() => {
              this.likeList = this.likeList.concat(arr);
            });
            this.refreshImage();
            event.target.complete();
          } else {
            if (this.totalLikeList.length === this.likeList.length) {
              event.target.complete();
              clearTimeout(sId);
              return;
            }
            arr = this.totalLikeList.slice(
              this.startIndex * this.pageNumber,
              this.totalLikeList.length,
            );
            this.zone.run(() => {
              this.likeList = this.likeList.concat(arr);
            });
            this.refreshImage();
            event.target.complete();
            clearTimeout(sId);
          }
        }, 500);
        break;
    }
  }

  async showMenuMore(item: any) {
    this.pauseAllVideo();
    this.curItem = item;
    switch (item['tabType']) {
      case 'myfeeds':
        this.isShowTitle = true;
        this.isShowInfo = true;
        this.isShowQrcode = true;
        this.isPreferences = true;
        this.isShowUnfollow = false;
        this.channelName = item.channelName;
        this.qrCodeString = await this.getQrCodeString(item);
        this.hideSharMenuComponent = true;
        break;
      case 'myfollow':
        this.isShowTitle = true;
        this.isShowInfo = true;
        this.isShowQrcode = true;
        this.isPreferences = false;
        this.isShowUnfollow = true;
        this.channelName = item.channelName;
        this.qrCodeString = await this.getQrCodeString(item);
        this.hideSharMenuComponent = true;
        break;
      case 'mylike':
        this.qrCodeString = await this.getQrCodeString(item);
        this.isShowTitle = false;
        this.isShowInfo = false;
        this.isPreferences = false;
        this.isShowQrcode = false;
        this.isShowUnfollow = true;
        this.hideSharMenuComponent = true;
        break;
    }
  }

  showComment(commentParams) {
    this.postId = commentParams.postId;
    this.channelId = commentParams.channelId;
    this.nodeId = commentParams.nodeId;
    this.channelAvatar = commentParams.channelAvatar;
    this.channelName = commentParams.channelName;
    this.hideComment = false;
  }

  hideComponent(event) {
    this.postId = null;
    this.channelId = null;
    this.nodeId = null;
    this.channelAvatar = null;
    this.channelName = null;
    this.hideComment = true;
  }

  ionScroll() {
    if (this.selectType === 'ProfilePage.myLikes') {
      this.native.throttle(this.setVisibleareaImage(), 200, this, true);
    } else if (this.selectType === 'ProfilePage.collectibles') {
      this.native.throttle(this.setCollectiblesVisibleareaImage(), 200, this, true);
    } else if (this.selectType === 'ProfilePage.myFeeds') {
      this.native.throttle(this.setMyFeedsVisibleareaImage(), 200, this, true);
    }
  }

  async setMyFeedsVisibleareaImage() {
    let ionRowMyfeeds = document.getElementsByClassName("ionRowMyfeeds") || null;
    let len = ionRowMyfeeds.length;
    for (let itemIndex = 0; itemIndex < len; itemIndex++) {
      let item = ionRowMyfeeds[itemIndex];
      let id = item.getAttribute("id") || "";
      if (id === "") {
        continue;
      }

      let avatarImage = document.getElementById(id + "-myFeedsAvatar");
      let srcStr = avatarImage.getAttribute("src") || "";
      let isload = this.myFeedsIsLoadimage[id] || '';
      try {
        if (
          id != '' &&
          avatarImage.getBoundingClientRect().top >= -100 &&
          avatarImage.getBoundingClientRect().bottom <= this.clientHeight
        ) {
          if (isload === "") {
            let arr = id.split("-");
            this.myFeedsIsLoadimage[id] = '11';
            let destDid = arr[0];
            let channelId = arr[1];
            let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
            let avatarUri = "";
            if (channel != null) {
              avatarUri = channel.avatar;
            }
            let fileName: string = avatarUri.split("@")[0];

            this.myFeedsAvatarImageMap[id] = avatarUri;//存储相同头像的channel的Map
            let isDown = this.downMyFeedsAvatarMap[fileName] || "";
            if (isDown != '') {
              continue;
            }
            this.downMyFeedsAvatarMap[fileName] = fileName;
            this.hiveVaultController.getV3Data(destDid, avatarUri, fileName, "0").then((data) => {
              this.zone.run(() => {
                this.downMyFeedsAvatarMap[fileName] = '';
                let srcData = data || "";
                if (srcData != "") {
                  for (let key in this.myFeedsAvatarImageMap) {
                    let uri = this.myFeedsAvatarImageMap[key] || "";
                    if (uri === avatarUri && this.myFeedsIsLoadimage[key] === "11") {
                      this.myFeedsIsLoadimage[key] = '13';
                      let newAvatarImage = document.getElementById(key + '-myFeedsAvatar') || null;
                      if (newAvatarImage != null) {
                        newAvatarImage.setAttribute("src", data);
                      }
                      delete this.myFeedsAvatarImageMap[key];
                    }
                  }
                } else {
                  for (let key in this.myFeedsAvatarImageMap) {
                    let uri = this.myFeedsAvatarImageMap[key] || "";
                    if (uri === avatarUri && this.myFeedsIsLoadimage[key] === "11") {
                      this.myFeedsIsLoadimage[key] = '13';
                      delete this.myFeedsAvatarImageMap[key];
                    }
                  }
                }
              });
            }).catch((err) => {
              this.downMyFeedsAvatarMap[fileName] = '';
              for (let key in this.myFeedsAvatarImageMap) {
                let uri = this.myFeedsAvatarImageMap[key] || "";
                if (uri === avatarUri && this.myFeedsIsLoadimage[key] === "11") {
                  this.myFeedsIsLoadimage[key] = '13';
                  delete this.myFeedsAvatarImageMap[key];
                }
              }

            });
          }
        } else {
          srcStr = avatarImage.getAttribute('src') || './assets/icon/reserve.svg';
          if (
            this.myFeedsIsLoadimage[id] === '13' &&
            srcStr != './assets/icon/reserve.svg'
          ) {
            avatarImage.setAttribute('src', './assets/icon/reserve.svg');
            this.myFeedsIsLoadimage[id] = '';
            delete this.myFeedsAvatarImageMap[id];
          }
        }
      } catch (error) {
          this.myFeedsIsLoadimage[id] = '';
          delete this.myFeedsAvatarImageMap[id];
      }

    }
  }

  setCollectiblesVisibleareaImage() {
    let profileCollectibles = document.getElementById("profileCollectibles") || null;
    if (profileCollectibles === null) {
      return;
    }
    let profileCollectiblesCol = profileCollectibles.getElementsByClassName("profileCollectiblesCol") || null;
    let len = profileCollectiblesCol.length;
    for (let itemIndex = 0; itemIndex < len; itemIndex++) {
      let item = profileCollectiblesCol[itemIndex];
      let id = item.getAttribute("id") || "";
      if (id === "") {
        continue;
      }
      let arr = id.split("-");
      let fileName = arr[0];
      let kind = arr[1];
      let size = arr[2];
      let thumbImage = document.getElementById(fileName + "-profileImg");
      let srcStr = thumbImage.getAttribute("src") || "";
      let isload = this.profileCollectiblesisLoadimage[fileName] || '';
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
            this.profileCollectiblesisLoadimage[fileName] = '12';
            this.fileHelperService.getNFTData(fetchUrl, fileName, kind).then((data) => {
              this.zone.run(() => {
                this.profileCollectiblesisLoadimage[fileName] = '13';
                let srcData = data || "";
                if (srcData != "") {
                  thumbImage.setAttribute("src", data);
                }
              });
            }).catch((err) => {
              if (this.profileCollectiblesisLoadimage[fileName] === '13') {
                this.profileCollectiblesisLoadimage[fileName] = '';
                thumbImage.setAttribute('src', './assets/icon/reserve.svg');
              }
            });
          }
        } else {
          srcStr = thumbImage.getAttribute('src') || './assets/icon/reserve.svg';
          if (
            thumbImage.getBoundingClientRect().top < -100 &&
            this.profileCollectiblesisLoadimage[fileName] === '13' &&
            srcStr != './assets/icon/reserve.svg'
          ) {
            this.profileCollectiblesisLoadimage[fileName] = '';
            thumbImage.setAttribute('src', './assets/icon/reserve.svg');
          }
        }
      } catch (error) {
        if (this.profileCollectiblesisLoadimage[fileName] === '13') {
          this.profileCollectiblesisLoadimage[fileName] = '';
          thumbImage.setAttribute('src', './assets/icon/reserve.svg');
        }
      }
    }

  }

  refreshCollectiblesVisibleareaImage() {
    if (this.selectType === "ProfilePage.collectibles") {
      let sid = setTimeout(() => {
        this.profileCollectiblesisLoadimage = {};
        this.setCollectiblesVisibleareaImage();
        clearTimeout(sid);
      }, 100);
    }
  }

  refreshMyFeedsVisibleareaImage() {
    if (this.selectType === "ProfilePage.myFeeds") {
      let sid = setTimeout(() => {
        this.myFeedsIsLoadimage = {};
        this.downMyFeedsAvatarMap = {};
        this.myFeedsAvatarImageMap = {};
        this.setMyFeedsVisibleareaImage();
        clearTimeout(sid);
      }, 100);
    }
  }



  handleId(item: any) {
    let version = item['version'] || "1";
    let thumbnailUri = "";
    let kind = "";
    let size = "";
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
          thumbnailUri = jsonData['image'] || "";
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
    return thumbnailUri + "-" + kind + "-" + size + "-profile";
  }

  setVisibleareaImage() {
    let postgridList = document.getElementsByClassName('postgridlike');
    let postgridNum = document.getElementsByClassName('postgridlike').length;
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

        this.handlePostAvatar(id, srcId, postgridindex);
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
    let rpostImage = document.getElementById(id + 'likerow');
    let postImage: any = document.getElementById(id + 'postimglike') || '';
    try {
      if (
        id != '' &&
        postImage.getBoundingClientRect().top >= -100 &&
        postImage.getBoundingClientRect().bottom <= this.clientHeight
      ) {
        if (isload === '') {
          this.isLoadimage[id] = '11';
          let arr = srcId.split('-');
          let destDid = arr[0];
          let postId: any = arr[2];

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
              } else {
                this.hiveVaultController.
                  getV3Data(destDid, thumbnailKey, fileThumbnaiName, type)
                  .then((thumbImagedata) => {
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
                "Excute 'handlePostImg' in profile page is error , get data error, error msg is ",
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
      Logger.error(TAG,
        "Excute 'handlePsotImg' in profile page is error , get image data error, error msg is ",
        error
      );
    }
  }

  async handlePostAvatar(id: string, srcId: string, rowindex: number) {
    // 13 存在 12不存在
    let isload = this.isLoadAvatarImage[id] || '';
    let postAvatar = document.getElementById(id + '-likeChannelAvatar');
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
          let avatarUri = "";
          if (channel != null) {
            avatarUri = channel.avatar;
            this.channelNameMap[postId] = channel.name || '';
          } else {
            this.channelNameMap[postId] = "";
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
            getV3Data(destDid, avatarUri, fileName, "0",)
            .then(imagedata => {
              let realImage = imagedata || '';
              if (realImage != '') {
                this.downPostAvatarMap[fileName] = "";
                for (let key in this.avatarImageMap) {
                  let uri = this.avatarImageMap[key] || "";
                  if (uri === avatarUri && this.isLoadAvatarImage[key]=== "11") {
                    let newPostAvatar = document.getElementById(key + '-likeChannelAvatar') || null;
                    if (newPostAvatar != null) {
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
                  if (uri === avatarUri) {
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
                if (uri === avatarUri && this.isLoadAvatarImage[key]=== "11") {
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

  async hanldVideo(id: string, srcId: string, rowindex: number) {
    let isloadVideoImg = this.isLoadVideoiamge[id] || '';
    let vgplayer = document.getElementById(id + 'vgplayerlike');
    let video: any = document.getElementById(id + 'videolike');
    let source: any = document.getElementById(id + 'sourcelike') || '';
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
                "Excute 'hanldVideo' in profile page is error , get video data error, error msg is ",
                reason
              );
            });
        }
      } else {
        let postSrc = video.getAttribute('poster') || '';
        if (
          video.getBoundingClientRect().top < -100 &&
          this.isLoadVideoiamge[id] === '13' &&
          postSrc != ''
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
      Logger.error(TAG,
        "Excute 'hanldVideo' in profile page is error , get data error, error msg is ",
        error
      );
    }
  }

  refreshImage() {
    let sid = setTimeout(() => {
      this.setVisibleareaImage();
      clearTimeout(sid);
    }, 100);
  }

  pauseVideo(id: string) {
    let videoElement: any = document.getElementById(id + 'videolike') || '';
    let source: any = document.getElementById(id + 'sourcelike') || '';
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
        let videoElement: any = document.getElementById(id + 'videolike') || '';
        if (videoElement != '') {
            videoElement.setAttribute('poster',"./assets/images/loading.png"); // empty source
        }
        let source: any = document.getElementById(id + 'sourcelike') || '';
        let sourcesrc = '';
        if (source != '') {
          sourcesrc = source.getAttribute('src') || '';
        }
        if (source != '' && sourcesrc != '') {
          source.removeAttribute('src'); // empty source
        }
      }
    }
  }

  setFullScreen(id: string) {
    let vgfullscreen = document.getElementById(id + 'vgfullscreelike');
    vgfullscreen.onclick = () => {
      this.pauseVideo(id);
      let postImg: string = document
        .getElementById(id + 'videolike')
        .getAttribute('poster');
      let videoSrc: string = document
        .getElementById(id + 'sourcelike')
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
        let imgElement: any = document.getElementById(id + 'postimglike') || '';
        if (imgElement != '') {
          imgElement.setAttribute('src','assets/images/loading.png');
        }
      }
    }
  }

  setOverPlay(id: string, srcId: string, post: FeedsData.PostV3) {
    let vgoverlayplay: any =
      document.getElementById(id + 'vgoverlayplaylike') || '';
    let source: any = document.getElementById(id + 'sourcelike') || '';

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

    let videoId = destDid + '-' + channelId + '-' + postId + 'vgplayerlike';
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
              .getV3Data(destDid, originKey, fileName, type)
              .then((downVideoResult: string) => {
                let downVideodata = downVideoResult || '';
                if (downVideodata != '') {
                  this.videoDownStatus[this.videoDownStatusKey] = '';
                  this.isVideoLoading[this.videoCurKey] = false;
                  this.loadVideo(id, downVideodata);
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
    let source: any = document.getElementById(id + 'sourcelike') || '';
    if (source === '') {
      return;
    }
    source.setAttribute('src', videodata);
    let vgoverlayplay: any = document.getElementById(id + 'vgoverlayplaylike');
    let video: any = document.getElementById(id + 'videolike');
    let vgcontrol: any = document.getElementById(id + 'vgcontrolslike');
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

  showBigImage(item: any) {
    this.pauseAllVideo();
    this.zone.run(async () => {
      let imagesId =
        item.destDid + '-' + item.channelId + '-' + item.postId + 'postimglike';
      let imagesObj = document.getElementById(imagesId);
      let imagesWidth = imagesObj.clientWidth;
      let imagesHeight = imagesObj.clientHeight;
      this.imgloadingStyleObj['position'] = 'absolute';
      this.imgloadingStyleObj['left'] =
        (imagesWidth - this.roundWidth) / 2 + 'px';
      this.imgloadingStyleObj['top'] =
        (imagesHeight - this.roundWidth) / 2 + 'px';
      this.imgCurKey = item.nodeId + '-' + item.channelId + '-' + item.postId;
      this.isImgLoading[this.imgCurKey] = true;

      let post = await this.dataHelper.getPostV3ById(item.destDid, item.postId);
      let mediaDatas = post.content.mediaData;
      const elements = mediaDatas[0];
      //原图
      let imageKey = elements.originMediaPath;
      let type = elements.type;
      //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
      let fileOriginName: string = imageKey.split("@")[0];
      //原图
      this.hiveVaultController
        .getV3Data(item.destDid, imageKey, fileOriginName, type, "false")
        .then(async realImg => {
          let img = realImg || '';
          if (img != '') {
            this.isImgLoading[this.imgCurKey] = false;
            this.viewHelper.openViewer(
              this.titleBar,
              realImg,
              'common.image',
              'FeedsPage.tabTitle2',
              this.appService,
            );
          } else {
            this.isImgLoading[this.imgCurKey] = false;
            if (this.isExitDown()) {
              this.openAlert();
              return;
            }
            this.imgDownStatusKey =
              item.destDid + '-' + item.channelId + '-' + item.postId;

            this.imgDownStatusKey = item.destDid + '-' + item.channelId + '-' + item.postId;
            this.imgDownStatus[this.imgDownStatusKey] = '1';
            this.isImgPercentageLoading[this.imgCurKey] = true;
            this.hiveVaultController
              .getV3Data(item.destDid, imageKey, fileOriginName, type)
              .then(async realImg => {
                let img = realImg || '';
                this.isImgPercentageLoading[this.imgCurKey] = false;
                this.isImgLoading[this.imgCurKey] = false;
                this.imgDownStatus[this.imgDownStatusKey] = '';
                if (img != '') {
                  this.viewHelper.openViewer(
                    this.titleBar,
                    realImg,
                    'common.image',
                    'FeedsPage.tabTitle2',
                    this.appService,
                  );
                }
              }).catch(() => {
                this.isImgPercentageLoading[this.imgCurKey] = false;
                this.isImgLoading[this.imgCurKey] = false;
                this.imgDownStatus[this.imgDownStatusKey] = '';
              });
          }
        });
    });
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
      let id = nodeId + "-" + channelId + "-" + postId;
      let postImage = document.getElementById(id + 'postimglike') || null;
      if (postImage != null) {
        postImage.setAttribute('src', value);
      }
      this.viewHelper.openViewer(
        this.titleBar,
        value,
        'common.image',
        'FeedsPage.tabTitle1',
        this.appService,
      );
    } else if (key.indexOf('video') > -1) {
      this.videoDownStatus[this.videoDownStatusKey] = '';
      this.isVideoLoading[this.videoDownStatusKey] = false;
      this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
      this.videoPercent = 0;
      this.videoRotateNum['transform'] = 'rotate(0deg)';
      this.curPostId = '';
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
      './assets/images/tskth.svg',
    );
  }

  cancel(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  profiledetail() {
    this.clearData();
    this.native.navigateForward('/menu/profiledetail', '');
  }

  async hideShareMenu(objParm: any) {
    let buttonType = objParm['buttonType'];
    let destDid = objParm['destDid'];
    let channelId = objParm['channelId'];
    switch (buttonType) {
      case 'unfollow':
        let connectStatus1 = this.dataHelper.getNetworkStatus();
        if (connectStatus1 === FeedsData.ConnState.disconnected) {
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
            await this.hiveVaultController.removePostListByChannel(destDid, channelId);
            this.events.publish(FeedsEvent.PublishType.unfollowFeedsFinish, channel);
            this.native.hideLoading();
          }).catch(() => {
            this.native.hideLoading();
          });
        } catch (error) {
          this.native.hideLoading();
        }

        this.qrCodeString = null;
        this.hideSharMenuComponent = false;
        break;
      case 'share':
        if (this.selectType === 'ProfilePage.myFeeds') {
          let content = this.getQrCodeString(this.curItem);

          const myDestDid = this.curItem['destDid'];
          const myChannelId = this.curItem['channelId'];
          const myPostId = this.curItem['postId'] || 0;
          this.hideSharMenuComponent = false;
          await this.native.showLoading("common.generateSharingLink");
          try {
            let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(myDestDid, myChannelId) || null;
            let ownerDid = (await this.dataHelper.getSigninData()).did;
            const sharedLink = await this.intentService.createShareLink(myDestDid, myChannelId, myPostId, ownerDid, channel);
            const title = this.intentService.createShareChannelTitle(myDestDid, myChannelId, channel) || "";
            this.intentService.share(title, sharedLink);
          } catch (error) {
          }

          this.native.hideLoading();
          return;
        }
        if (this.selectType === 'ProfilePage.myLikes') {
          destDid = this.curItem['destDid'];
          channelId = this.curItem['channelId'];
          let postId = this.curItem['postId'];
          let post: any = await this.dataHelper.getPostV3ById(destDid, postId) || null;
          let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
          let ownerDid = (await this.dataHelper.getSigninData()).did;
          let postContent = '';
          if (post != null) {
            postContent = post.content.content || "";
          }

          this.hideSharMenuComponent = false;
          await this.native.showLoading("common.generateSharingLink");
          try {
            //share post
            const sharedLink = await this.intentService.createShareLink(destDid, channelId, postId, ownerDid, channel);
            this.intentService.share(this.intentService.createSharePostTitle(destDid, channelId, postId, postContent), sharedLink);
          } catch (error) {
          }
          this.native.hideLoading();

          return;
        }
        this.native.toast('common.comingSoon');
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
        this.clearData();
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

  async getQrCodeString(feed: any) {
    let destDid = feed['destDid'];
    this.shareDestDid = destDid;
    let channelName = feed['channelName'] || '';
    let channelId = feed['channelId'] || '';
    this.shareChannelId = channelId;
    let ownerDid: string = (await this.dataHelper.getSigninData()).did;
    let qrcodeString = "feeds://v3/" + ownerDid + "/" + channelId + '/' + encodeURIComponent(channelName);
    return qrcodeString;
  }

  toPage(eventParm: any) {
    let destDid = eventParm['destDid'];
    let channelId = eventParm['channelId'];
    let postId = eventParm['postId'] || '';
    let page = eventParm['page'];
    this.clearData();
    if (postId != '') {
      this.native
        .getNavCtrl()
        .navigateForward([page, destDid, channelId, postId]);
    } else {
      this.native.getNavCtrl().navigateForward([page, destDid, channelId]);
    }
  }

  async clickAvatar(destDid: string, channelId: string) {
    let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId);
    let followStatus = await this.checkFollowStatus(destDid, channelId);
    let channelName = channel.name;
    let channelDesc = channel.intro;
    let channelSubscribes = 0;
    let feedAvatar = this.feedService.parseChannelAvatar(channel.avatar);
    if (feedAvatar.indexOf("@feeds/data/") > -1) {
      // d30054aa1d08abfb41c7225eb61f18e4@feeds/data/d30054aa1d08abfb41c7225eb61f18e4
      let imgKey = destDid + "-" + channelId + "-myFeedsAvatar";
      feedAvatar = document.getElementById(imgKey).getAttribute("src");
    }

    if (feedAvatar.indexOf('data:image') > -1 ||
      feedAvatar.startsWith("https:")) {
      this.dataHelper.setSelsectIndex(0);
      this.dataHelper.setProfileIamge(feedAvatar);
    } else if (feedAvatar.indexOf('assets/images') > -1) {
      let index = feedAvatar.substring(
        feedAvatar.length - 5,
        feedAvatar.length - 4,
      );
      this.dataHelper.setSelsectIndex(index);
      this.dataHelper.setProfileIamge(feedAvatar);
    }
    let ownerDid: string = (await this.dataHelper.getSigninData()).did;
    this.dataHelper.setChannelInfo({
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
    this.clearData();
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

  async createPost() {

    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.clearData();
    const channels = await this.dataHelper.getSelfChannelListV3() || []
    if (channels.length === 0) {
      this.native.navigateForward(['/createnewfeed'], '');
      return;
    }

    this.dataHelper.setSelsectNftImage("");
    this.native.navigateForward(['createnewpost'], '');
  }

  async connectWallet() {
    await this.walletConnectControllerService.connect();
    //this.updateWalletAddress(null);
  }

  copyWalletAddr() {
    this.native
      .copyClipboard(this.walletAddress)
      .then(() => {
        this.native.toast_trans('common.textcopied');
      })
      .catch(() => { });
  }

  clickWalletAddr() {
    this.walletDialog();
  }

  walletDialog() {
    this.popover = this.popupProvider.ionicConfirm(
      this,
      'common.disconnectWallet',
      this.walletAddress,
      this.cancel,
      this.disconnect,
      './assets/images/tskth.svg',
      'common.disconnect',
    );
  }

  async disconnect(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      await that.walletConnectControllerService.disconnect();
      await that.walletConnectControllerService.destroyWalletConnect();
      await that.nftContractControllerService.init();
      that.walletAddress = '';
      that.walletAddressStr = '';
      that.ownNftSum = 0;
    }
  }

  updateWalletAddress(walletAccount: string) {
    if (!walletAccount)
      this.walletAddress = this.walletConnectControllerService.getAccountAddress();
    else
      this.walletAddress = walletAccount;
    Logger.log(TAG, 'Update WalletAddress', this.walletAddress);
    this.walletAddressStr = UtilService.resolveAddress(this.walletAddress);
    if (this.walletAddress === "") {
      this.ownNftSum = 0;
    }
  }

  subsciptions() {
    this.clearData();
    this.native.navigateForward(['subscriptions'], '');
  }

  chanelCollections() {
    let account = this.walletConnectControllerService.getAccountAddress() || null;
    if (account === null) {
      this.walletConnectControllerService.connect();
      return;
    }
    this.clearData();
    this.native.navigateForward(['channelcollections'], '');
  }

  async getOwnNftSum() {
    let accAddress =
      this.nftContractControllerService.getAccountAddress() || '';
    if (accAddress === '') {
      this.ownNftSum = 0;
      return;
    }
    try {
      this.notSaleOrderCount = await this.nftContractHelperService.getNotSaleTokenCount(accAddress);
      this.saleOrderCount = await this.nftContractHelperService.getSaleOrderCount(accAddress);
      this.ownNftSum = this.notSaleOrderCount + this.saleOrderCount;
    } catch (error) {
      this.ownNftSum = 0;
    }
  }

  async getCollectiblesList() {
    let accAddress =
      this.nftContractControllerService.getAccountAddress() || '';
    if (accAddress === '') {
      this.collectiblesList = [];
      return;
    }
    let list = this.nftPersistenceHelper.getCollectiblesList(accAddress);
    if (list.length === 0) {
      await this.refreshCollectibles();
      this.refreshCollectiblesVisibleareaImage();
      return;
    }

    // this.collectiblesList = this.nftContractHelperService.sortData(list, this.sortType);
    this.collectiblesList = list;
    this.ownNftSum = this.collectiblesList.length;
    this.refreshCollectiblesVisibleareaImage();
  }



  async processNotOnSaleOrder(accAddress: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.notSaleOrderCount == 0) {
          this.refreshNotSaleOrderFinish = true;
          resolve('SUCCESS');
          return;
        }

        for (let index = 0; index < this.notSaleOrderCount; index++) {
          try {
            const item = await this.nftContractHelperService.getNotSellerCollectiblesFromContract(accAddress, index);
            this.refreshingCollectiblesHelper.push(item);
            this.collectiblesList = this.refreshingCollectiblesHelper;
            this.saveCollectiblesToCache(accAddress);
            // this.collectiblesList.push(item);
          } catch (error) {
            Logger.error("Get not sale item error", error);
          }
        }

        this.refreshNotSaleOrderFinish = true;
        resolve('SUCCESS');
      } catch (error) {
        reject(error);
      }
    });
  }

  async processOnSaleOrder(accAddress: string) {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.saleOrderCount == 0) {
          this.refreshSaleOrderFinish = true;
          resolve('SUCCESS');
          return;
        }

        for (let index = 0; index < this.saleOrderCount; index++) {
          try {
            const item = await this.nftContractHelperService.getSellerCollectibleFromContract(accAddress, index);
            this.refreshingCollectiblesHelper.push(item);
            this.collectiblesList = this.refreshingCollectiblesHelper;
            this.saveCollectiblesToCache(accAddress);
          } catch (error) {
            Logger.error("Get Sale item error", error);
          }
        }
        this.refreshSaleOrderFinish = true;
        resolve('SUCCESS');
      } catch (error) {
        reject(error);
      }
    });
  }

  clickAssetItem(assetitem: any) {
    this.clearData();
    this.dataHelper.setAssetPageAssetItem(assetitem);
    this.native.navigateForward(['assetdetails'], {});
  }

  clickMore(parm: any) {
    let asstItem = parm['assetItem'];
    let type = asstItem['moreMenuType'];
    Logger.log(TAG, 'clickMore parm is', parm);
    switch (type) {
      case 'onSale':
        this.handleOnSale(asstItem);
        break;
      case 'created':
        this.handleCreated(asstItem);
        break;
    }
  }

  handleOnSale(asstItem: any) {
    this.menuService.showOnSaleMenu(asstItem);
  }

  handleCreated(asstItem: any) {
    this.menuService.showCreatedMenu(asstItem);
  }

  clickMint() {
    this.createNft();
  }

  async createNft() {
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
    this.clearData();
    this.native.navigateForward(['mintnft'], {});
  }

  getImageBase64(uri: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.crossOrigin = '*';
      img.crossOrigin = "Anonymous";
      img.src = uri;

      img.onload = () => {
        let canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, img.width, img.height);
        let dataURL = canvas.toDataURL("image/*");
        resolve(dataURL);
      };
    });
  }

  handleImg(imgUri: string) {
    if (imgUri.indexOf('feeds:imgage:') > -1) {
      imgUri = imgUri.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    } else if (imgUri.indexOf('feeds:image:') > -1) {
      imgUri = imgUri.replace('feeds:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    } else if (imgUri.indexOf('pasar:image:') > -1) {
      imgUri = imgUri.replace('pasar:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }
    return imgUri;
  }

  async handleCreate(tokenId: any, createAddr: any, assItem: any, sellQuantity: any) {
    let quantity = await this.nftContractControllerService
      .getSticker()
      .balanceOf(tokenId);
    let list = this.nftPersistenceHelper.getCollectiblesList(createAddr);
    // let cpList = this.nftPersistenceHelper.getPasarList();
    let cpItem = _.cloneDeep(assItem);
    if (parseInt(quantity) <= 0) {

      let index = _.findIndex(list, (item: any) => {
        return item.tokenId === tokenId && item.moreMenuType === "created";
      });
      cpItem["curQuantity"] = sellQuantity;
      list.splice(index, 1, cpItem);
      Logger.log(TAG, 'Update list', list);

    } else {

      let index = _.findIndex(list, (item: any) => {
        return item.tokenId === tokenId && item.moreMenuType === "created";
      });
      let createItem = _.cloneDeep(assItem);
      createItem['moreMenuType'] = "created";
      createItem["fixedAmount"] = null;
      createItem["curQuantity"] = quantity;
      list[index] = createItem;

      cpItem["curQuantity"] = sellQuantity;
      list.push(cpItem);

      Logger.log(TAG, 'Update list', list);
    }

    this.zone.run(() => {
      this.collectiblesList = list;
      this.ownNftSum = this.collectiblesList.length;
      this.nftPersistenceHelper.setCollectiblesMap(createAddr, list);
      this.refreshCollectiblesVisibleareaImage();
      Logger.log(TAG, 'handleCreate this.collectiblesList', this.collectiblesList);

    });
  }

  async handleCancelOrder(tokenId: any, curTokenNum: any, assetItem: any, createAddr: any, saleOrderId: any, clist: any, sellerAddr: any) {
    //add OwnNftCollectiblesList
    if (parseInt(curTokenNum) === 0) {

      clist = _.filter(clist, item => {
        return item.tokenId != tokenId;
      });

      clist.push(assetItem);
      this.collectiblesList = clist;
      this.ownNftSum = this.collectiblesList.length;
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
      this.collectiblesList = clist;
      this.ownNftSum = this.collectiblesList.length;
      this.nftPersistenceHelper.setCollectiblesMap(createAddr, clist);
    }

    // let pList = this.nftPersistenceHelper.getPasarList();
    // pList = _.filter(pList, item => {
    //   return !(
    //     item.saleOrderId === saleOrderId && item.sellerAddr === sellerAddr
    //   );
    // });
    // this.nftPersistenceHelper.setPasarList(pList);
    this.dataHelper.deletePasarItem(saleOrderId);
  }

  async handleNftBurn(tokenId: any, createAddr: any, burnNum: any) {
    let quantity = await this.nftContractControllerService
      .getSticker()
      .balanceOf(tokenId);
    let bList = this.nftPersistenceHelper.getCollectiblesList(createAddr);

    if (parseInt(quantity) === 0) {

      bList = _.filter(bList, item => {
        return !(item.tokenId === tokenId && item.moreMenuType === "created");
      });

      this.collectiblesList = bList;
      this.ownNftSum = this.collectiblesList.length;
      this.nftPersistenceHelper.setCollectiblesMap(createAddr, bList);

    } else {

      _.forEach(bList, (item: any) => {
        if (item.tokenId === tokenId && item.moreMenuType === "onSale") {
          item.quantity = (parseInt(item.quantity) - parseInt(burnNum)).toString();
        } else if (item.tokenId === tokenId && item.moreMenuType === "created") {
          item.curQuantity = parseInt(quantity);
          item.quantity = (parseInt(item.quantity) - parseInt(burnNum)).toString();
        }
      });

      // let index = _.findIndex(bList, (item:any) => {
      //   return item.tokenId === tokenId && item.moreMenuType === "created";
      // });

      // bList[index].curQuantity = parseInt(quantity);
      // bList[index].quantity = parseInt(quantity);

      this.collectiblesList = bList;
      this.nftPersistenceHelper.setCollectiblesMap(createAddr, bList);
    }
  }

  async handleNftTransfer(tokenId: any, createAddr: any, transferNum: any) {
    let quantity = await this.nftContractControllerService
      .getSticker()
      .balanceOf(tokenId);
    let bList = this.nftPersistenceHelper.getCollectiblesList(createAddr);

    if (parseInt(quantity) === 0) {

      bList = _.filter(bList, item => {
        return !(item.tokenId === tokenId && item.moreMenuType === "created");
      });

      this.collectiblesList = bList;
      this.ownNftSum = this.collectiblesList.length;
      this.nftPersistenceHelper.setCollectiblesMap(createAddr, bList);

    } else {

      _.forEach(bList, (item: any) => {
        if (item.tokenId === tokenId && item.moreMenuType === "onSale") {
          item.quantity = (parseInt(item.quantity) - parseInt(transferNum)).toString();
        } else if (item.tokenId === tokenId && item.moreMenuType === "created") {
          item.curQuantity = parseInt(quantity);
          item.quantity = (parseInt(item.quantity) - parseInt(transferNum)).toString();
        }
      });

      this.collectiblesList = bList;
      this.nftPersistenceHelper.setCollectiblesMap(createAddr, bList);
    }
  }

  async refreshCollectibles() {
    // if (this.isRefreshingCollectibles) {
    //   return;
    // }
    // this.isRefreshingCollectibles = true;

    this.collectiblesPageNum = 0;
    // this.collectiblesList = [];
    this.refreshNotSaleOrderFinish = false;
    this.refreshSaleOrderFinish = false;
    this.elaPrice = this.dataHelper.getElaUsdPrice();
    // await this.getOwnNftSum();
    let accAddress = this.nftContractControllerService.getAccountAddress() || '';

    if (accAddress === '') {
      this.isRefreshingCollectibles = false;
      return;
    }

    this.collectiblesList = await this.nftContractHelperService.queryOwnerCollectibles(accAddress);
    this.saveCollectiblesToCache(accAddress);
    this.ownNftSum = this.collectiblesList.length;
    // this.collectiblesList = await this.nftContractHelperService.refreshCollectiblesData(this.sortType);




    // this.refreshingCollectiblesHelper = [];
    // this.processOnSaleOrder(accAddress).then(() => {
    //   return this.processNotOnSaleOrder(accAddress);
    // }).then(() => {
    //   Logger.log(TAG, 'On sale collectiblesList is', this.collectiblesList);
    //   this.refreshCollectiblesVisibleareaImage();
    //   this.isRefreshingCollectibles = false;
    //   this.prepareSaveCollectiblesData(accAddress);
    // });
  }

  saveCollectiblesToCache(createAddress: string) {
    this.nftPersistenceHelper.setCollectiblesMap(createAddress, this.collectiblesList);
    Logger.log(TAG, 'Save CollectiblesList', this.collectiblesList);
  }

  prepareSaveCollectiblesData(address: string) {
    if (this.refreshNotSaleOrderFinish && this.refreshSaleOrderFinish)
      this.saveCollectiblesToCache(address);
  }
}
