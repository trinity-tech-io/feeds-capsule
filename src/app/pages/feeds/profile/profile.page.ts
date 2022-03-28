import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { ModalController, PopoverController } from '@ionic/angular';
import { Events } from 'src/app/services/events.service';
import { FeedService, Avatar } from 'src/app/services/FeedService';
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

  public nodeStatus = {}; //friends status;
  public channels = []; //myFeeds page

  public collectiblesList: FeedsData.NFTItem[] = []; //NFT列表
  public totalLikeList = [];
  public startIndex: number = 0;
  public pageNumber: number = 5;
  public likeList = []; //like page
  public connectionStatus = 1;
  public selectType: string = 'ProfilePage.myFeeds';
  public followers = 0;

  // Sign in data
  public name: string = '';
  public avatar: string = '';
  public description: string = '';

  public hideComment = true;
  public onlineStatus = null;

  // For comment component
  public postId = null;
  public nodeId = null;
  public channelId = null;
  public channelAvatar = null;
  public channelName = null;

  public curItem: any = {};

  public clientHeight: number = 0;
  public isLoadimage: any = {};
  public isLoadVideoiamge: any = {};
  public videoIamges: any = {};

  public cacheGetBinaryRequestKey: string = '';
  public cachedMediaType = '';

  public fullScreenmodal: any = '';

  public curPostId: string = '';

  public popover: any = '';

  public curNodeId: string = '';

  public hideDeletedPosts: boolean = false;

  public hideSharMenuComponent: boolean = false;

  public qrCodeString: string = null;

  public feedName: string = null;

  public isShowUnfollow: boolean = false;

  public isShowQrcode: boolean = false;

  public isShowTitle: boolean = false;

  public isShowInfo: boolean = false;

  public isPreferences: boolean = false;

  public shareNodeId: string = '';

  public shareFeedId: string = '';

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
  private sortType = FeedsData.SortType.TIME_ORDER_LATEST;
  private collectiblesPageNum: number = 0;
  constructor(
    private feedService: FeedService,
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
    private postHelperService: PostHelperService
  ) {
  }

  ngOnInit() { }

  initMyFeeds() {
    this.channels = this.feedService.getMyChannelList() || [];
    this.myFeedsSum = this.channels.length;
    let followedList = this.feedService.getFollowedChannelList() || [];
    this.followers = followedList.length;
    this.initnodeStatus(this.channels);
  }

  initLike() {
    this.startIndex = 0;
    this.initRefresh();
    this.initnodeStatus(this.likeList);
  }

  initRefresh() {
    this.totalLikeList = this.sortLikeList();
    this.likeSum = this.totalLikeList.length;
    this.startIndex = 0;
    if (this.totalLikeList.length - this.pageNumber > 0) {
      this.likeList = this.totalLikeList.slice(0, this.pageNumber);
      this.isLoadimage = {};
      this.isLoadVideoiamge = {};
      this.refreshImage();
      this.startIndex++;
      this.infiniteScroll.disabled = false;
    } else {
      this.likeList = this.totalLikeList;
      this.isLoadimage = {};
      this.isLoadVideoiamge = {};
      this.refreshImage();
      this.infiniteScroll.disabled = true;
    }
  }

  refreshLikeList() {
    if (this.startIndex === 0) {
      this.initRefresh();
      return;
    }

    this.totalLikeList = this.sortLikeList();
    if (this.totalLikeList.length - this.pageNumber * this.startIndex > 0) {
      this.likeList = this.likeList.slice(0, this.startIndex * this.pageNumber);
      this.infiniteScroll.disabled = false;
    } else {
      this.likeList = this.totalLikeList;
      this.infiniteScroll.disabled = true;
    }
    this.isLoadimage = {};
    this.isLoadVideoiamge = {};
    this.refreshImage();
  }

  sortLikeList() {
    let likeList = this.feedService.getLikeList() || [];
    this.hideDeletedPosts = this.feedService.getHideDeletedPosts();
    if (!this.hideDeletedPosts) {
      likeList = _.filter(likeList, (item: any) => {
        return item.post_status != 1;
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

    this.events.subscribe(FeedsEvent.PublishType.clickDialog, (dialogData: any) => {
      let pageName = dialogData.pageName;
      let dialogName = dialogData.dialogName;
      let dialogbutton = dialogData.clickButton;
      if (pageName === "profile") {
        this.handleDialog(dialogName, dialogbutton, pageName);
      }
    });

    this.events.subscribe(FeedsEvent.PublishType.startLoading, (obj) => {

      let title = obj["title"];
      let des = obj["des"];
      let curNum = obj["curNum"];
      let maxNum = obj["maxNum"];

      let textObj = {
      "isLoading":true,
      "loadingTitle":title,
      "loadingText":des,
      "loadingCurNumber":curNum,
      "loadingMaxNumber":maxNum
       }
     this.events.publish(FeedsEvent.PublishType.nftLoadingUpdateText,textObj);

    });

    this.events.subscribe(FeedsEvent.PublishType.endLoading, (obj) => {
      let textObj = {
        "isLoading":false,
         }
      this.events.publish(FeedsEvent.PublishType.nftLoadingUpdateText,textObj);
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


    this.hideDeletedPosts = this.feedService.getHideDeletedPosts();
    this.clientHeight = screen.availHeight;
    this.curItem = {};
    this.changeType(this.selectType);
    this.connectionStatus = this.feedService.getConnectionStatus();

    this.events.subscribe(FeedsEvent.PublishType.hideDeletedPosts, () => {
      this.zone.run(() => {
        this.hideDeletedPosts = this.feedService.getHideDeletedPosts();
        this.refreshLikeList();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.connectionChanged, status => {
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    let signInData = this.feedService.getSignInData() || {};

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

    this.events.subscribe(FeedsEvent.PublishType.editPostFinish, () => {
      this.zone.run(() => {
        this.refreshLikeList();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.deletePostFinish, () => {
      this.zone.run(() => {
        this.refreshLikeList();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      if (this.menuService.postDetail != null) {
        this.menuService.hideActionSheet();
        this.showMenuMore(this.curItem);
      }
    });

    this.events.subscribe(
      FeedsEvent.PublishType.streamGetBinaryResponse,
      () => {
        this.zone.run(() => { });
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
          this.feedService.closeSession(nodeId);
          this.processGetBinaryResult(key, value);
        });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.streamGetBinaryResponse,
      () => {
        this.zone.run(() => { });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.streamError,
      (streamErrorData: FeedsEvent.StreamErrorData) => {
        this.zone.run(() => {
          let nodeId = streamErrorData.nodeId;
          let error = streamErrorData.error;
          this.clearDownStatus();
          this.feedService.handleSessionError(nodeId, error);
          this.pauseAllVideo();
          this.native.hideLoading();
          this.curPostId = '';
          this.curNodeId = '';
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
        this.refreshLikeList();
        this.isLoadimage = {};
        this.isLoadVideoiamge = {};
        this.refreshImage();
        this.initnodeStatus(this.likeList);
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

      this.curPostId = '';
      if (this.curNodeId != '') {
        this.feedService.closeSession(this.curNodeId);
      }
      this.curNodeId = '';
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
      this.native.hideLoading();
      this.curNodeId = '';
    });
  }

  async ionViewWillEnter() {
    this.initTitleBar();
    this.elaPrice = this.feedService.getElaUsdPrice();
    this.events.subscribe(FeedsEvent.PublishType.addProflieEvent, async () => {
      this.elaPrice = this.feedService.getElaUsdPrice();
      if (!this.collectiblesList || this.collectiblesList.length == 0) {
        await this.getCollectiblesList();
      }

      this.addProflieEvent();
      this.isAddProfile = true;
    });

    this.addProflieEvent();

    this.channels = this.feedService.getMyChannelList() || [];
    this.myFeedsSum = this.channels.length;

    if (!this.collectiblesList || this.collectiblesList.length == 0) {
      await this.getCollectiblesList();
    }


    this.totalLikeList = this.sortLikeList() || [];
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
    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.friendConnectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.channelsDataUpdate);
    this.events.unsubscribe(FeedsEvent.PublishType.refreshPage);

    this.events.unsubscribe(FeedsEvent.PublishType.editPostFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.deletePostFinish);

    this.events.unsubscribe(FeedsEvent.PublishType.getBinaryFinish);

    this.events.unsubscribe(FeedsEvent.PublishType.streamGetBinaryResponse);
    this.events.unsubscribe(FeedsEvent.PublishType.streamGetBinarySuccess);
    this.events.unsubscribe(FeedsEvent.PublishType.streamError);
    this.events.unsubscribe(
      FeedsEvent.PublishType.streamOnStateChangedCallback,
    );

    this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestError);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcResponseError);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestSuccess);

    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
    this.events.unsubscribe(FeedsEvent.PublishType.openRightMenu);
    this.events.unsubscribe(FeedsEvent.PublishType.tabSendPost);
    this.events.unsubscribe(FeedsEvent.PublishType.streamProgress);
    this.events.unsubscribe(FeedsEvent.PublishType.streamClosed);
    this.events.unsubscribe(FeedsEvent.PublishType.hideDeletedPosts);
    this.events.unsubscribe(FeedsEvent.PublishType.startLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.endLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.nftCancelOrder);
    this.events.unsubscribe(FeedsEvent.PublishType.walletAccountChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.nftUpdateList);
    this.events.unsubscribe(FeedsEvent.PublishType.clickDialog);
    this.events.unsubscribe(FeedsEvent.PublishType.nftdisclaimer);

    this.events.unsubscribe(FeedsEvent.PublishType.nftUpdatePrice);
    this.events.unsubscribe(FeedsEvent.PublishType.clickDisconnectWallet);
    this.clearDownStatus();
    this.native.hideLoading();
    this.hideFullScreen();
    this.removeImages();
    this.removeAllVideo();
    this.isLoadimage = {};
    this.isLoadVideoiamge = {};
    this.curItem = {};
    this.curPostId = '';
    if (this.curNodeId != '') {
      this.feedService.closeSession(this.curNodeId);
    }
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
        this.elaPrice = this.feedService.getElaUsdPrice();
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

  checkServerStatus(nodeId: string) {
    return this.feedService.getServerStatusFromId(nodeId);
  }

  initnodeStatus(list: any) {
    list = list || [];
    for (let index = 0; index < list.length; index++) {
      let nodeId = list[index]['nodeId'];
      let status = this.checkServerStatus(nodeId);
      this.nodeStatus[nodeId] = status;
    }
  }

  async doRefresh(event: any) {
    //this.updateWalletAddress(null);
    switch (this.selectType) {
      case 'ProfilePage.myFeeds':
        let sId1 = setTimeout(() => {
          this.initMyFeeds();
          event.target.complete();
          clearTimeout(sId1);
        }, 500);
        break;
      case 'ProfilePage.collectibles':
        // await this.getCollectiblesList();
        await this.refreshCollectibles();
        this.refreshCollectiblesVisibleareaImage();
        event.target.complete();
        break;
      case 'ProfilePage.myLikes':
        let sId = setTimeout(() => {
          this.startIndex = 0;
          this.initLike();
          event.target.complete();
          clearTimeout(sId);
        }, 500);
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
            this.initnodeStatus(arr);

            event.target.complete();
          } else {
            arr = this.totalLikeList.slice(
              this.startIndex * this.pageNumber,
              this.totalLikeList.length,
            );
            this.zone.run(() => {
              this.likeList = this.likeList.concat(arr);
            });
            this.refreshImage();
            this.infiniteScroll.disabled = true;
            this.initnodeStatus(arr);

            event.target.complete();
            clearTimeout(sId);
          }
        }, 500);
        break;
    }
  }

  showMenuMore(item: any) {
    this.pauseAllVideo();
    this.curItem = item;
    switch (item['tabType']) {
      case 'myfeeds':
        this.isShowTitle = true;
        this.isShowInfo = true;
        this.isShowQrcode = true;
        this.isPreferences = true;
        this.isShowUnfollow = false;
        this.feedName = item.channelName;
        this.qrCodeString = this.getQrCodeString(item);
        this.hideSharMenuComponent = true;
        break;
      case 'myfollow':
        this.isShowTitle = true;
        this.isShowInfo = true;
        this.isShowQrcode = true;
        this.isPreferences = false;
        this.isShowUnfollow = true;
        this.feedName = item.channelName;
        this.qrCodeString = this.getQrCodeString(item);
        this.hideSharMenuComponent = true;
        break;
      case 'mylike':
        this.qrCodeString = this.getQrCodeString(item);
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
    this.onlineStatus = commentParams.onlineStatus;
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
    this.onlineStatus = null;
  }

  ionScroll() {
    if (this.selectType === 'ProfilePage.myLikes') {
      this.native.throttle(this.setVisibleareaImage(), 200, this, true);
    } else if (this.selectType === 'ProfilePage.collectibles') {
      this.native.throttle(this.setCollectiblesVisibleareaImage(), 200, this, true);
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
          thumbImage.getBoundingClientRect().top <= this.clientHeight
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
    let rpostImage = document.getElementById(id + 'likerow');
    let postImage: any = document.getElementById(id + 'postimglike') || '';
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
                this.feedService.getData(thumbkey).then((thumbImagedata) => {
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
                "Excute 'handlePsotImg' in profile page is error , get data error, error msg is ",
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

  hanldVideo(id: string, srcId: string, rowindex: number) {
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
    }, 0);
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
          //videoElement.removeAttribute('poster',"assets/images/loading.gif"); // empty source
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
          imgElement.removeAttribute('src'); // empty source
        }
      }
    }
  }

  setOverPlay(id: string, srcId: string) {
    let vgoverlayplay: any =
      document.getElementById(id + 'vgoverlayplaylike') || '';
    let source: any = document.getElementById(id + 'sourcelike') || '';

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

    let videoId = nodeId + '-' + channelId + '-' + postId + 'vgplayerlike';
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
          let post = _.find(this.likeList, post => {
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
              } else {
                this.videoDownStatus[this.videoDownStatusKey] = '0';
                this.curNodeId = '';
              }
            },
            err => {
              this.videoDownStatus[this.videoDownStatusKey] = '';
              this.isVideoLoading[this.videoDownStatusKey] = false;
              this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
              this.videoRotateNum = {};
              this.videoPercent = 0;
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
    this.zone.run(() => {
      let imagesId =
        item.nodeId + '-' + item.channelId + '-' + item.postId + 'postimglike';
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

      let contentVersion = this.feedService.getContentVersion(
        item.nodeId,
        item.channelId,
        item.postId,
        0,
      );
      let thumbkey = this.feedService.getImgThumbKeyStrFromId(
        item.nodeId,
        item.channelId,
        item.postId,
        0,
        0,
      );
      let key = this.feedService.getImageKey(
        item.nodeId,
        item.channelId,
        item.postId,
        0,
        0,
      );
      if (contentVersion == '0') {
        key = thumbkey;
      }

      const content: FeedsData.Content = this.feedService.getContentFromId(item.nodeId, item.channelId, item.postId, 0);
      if (content.version == '2.0') {
        const mediaDatas = content.mediaDatas;
        if (mediaDatas && mediaDatas.length > 0) {
          const elements = mediaDatas[0];
          this.postHelperService.getPostData(elements.originMediaCid, elements.type)
            .then((value) => {
              this.isImgLoading[this.imgCurKey] = false;
              this.viewHelper.openViewer(
                this.titleBar,
                value,
                'common.image',
                'FeedsPage.tabTitle2',
                this.appService,
              );
            })
            .catch(() => {
              //TODO
            });
        }
        return;
      }

      this.feedService.getData(key).then(realImg => {
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
          if (this.checkServerStatus(item.nodeId) != 0) {
            this.isImgLoading[this.imgCurKey] = false;
            this.native.toastWarn('common.connectionError1');
            return;
          }

          if (this.isExitDown()) {
            this.isImgLoading[this.imgCurKey] = false;
            this.openAlert();
            return;
          }
          this.imgDownStatusKey =
            item.nodeId + '-' + item.channelId + '-' + item.postId;
          this.cachedMediaType = 'img';
          this.feedService.processGetBinary(
            item.nodeId,
            item.channelId,
            item.postId,
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
              } else {
                this.imgDownStatus[this.imgDownStatusKey] = '0';
                this.curNodeId = '';
              }
            },
            err => {
              this.isImgLoading[this.imgDownStatusKey] = false;
              this.isImgPercentageLoading[this.imgDownStatusKey] = false;
              this.imgDownStatus[this.imgDownStatusKey] = '';
              this.imgPercent = 0;
              this.imgRotateNum = {};
              this.curNodeId = '';
            },
          );
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
    let nodeId = objParm['nodeId'];
    let feedId = objParm['feedId'];
    switch (buttonType) {
      case 'unfollow':
        if (this.feedService.getConnectionStatus() != 0) {
          this.native.toastWarn('common.connectionError');
          return;
        }
        if (this.checkServerStatus(nodeId) != 0) {
          this.native.toastWarn('common.connectionError1');
          return;
        }

        this.feedService.unsubscribeChannel(nodeId, feedId);
        this.qrCodeString = null;
        this.hideSharMenuComponent = false;
        break;
      case 'share':
        if (this.selectType === 'ProfilePage.myFeeds') {
          let content = this.getQrCodeString(this.curItem);

          const myNodeId = this.curItem['nodeId'];
          const myChannelId = this.curItem['channelId'];
          const myPostId = this.curItem['postId'] || 0;
          this.hideSharMenuComponent = false;
          await this.native.showLoading("common.generateSharingLink");
          try {
            const sharedLink = await this.intentService.createShareLink(myNodeId, myChannelId, myPostId);
            const title = this.intentService.createShareChannelTitle(myNodeId, myChannelId) || "";
            this.intentService.share(title, sharedLink);
          } catch (error) {
          }
          this.native.hideLoading();
          return;
        }
        if (this.selectType === 'ProfilePage.myLikes') {
          nodeId = this.curItem['nodeId'];
          feedId = this.curItem['channelId'];
          let postId = this.curItem['postId'];
          let post =
            this.feedService.getPostFromId(nodeId, feedId, postId) || null;
          let postContent = '';
          if (post != null) {
            postContent = this.feedService.parsePostContentText(post.content);
          }

          this.hideSharMenuComponent = false;
          await this.native.showLoading("common.generateSharingLink");
          try {
            //share post
            const sharedLink = await this.intentService.createShareLink(nodeId, feedId, postId);
            this.intentService.share(this.intentService.createSharePostTitle(nodeId, feedId, postId), sharedLink);
          } catch (error) {
          }
          this.native.hideLoading();

          return;
        }
        this.native.toast('common.comingSoon');
        break;
      case 'info':
        this.clearData();
        this.clickAvatar(nodeId, feedId);
        break;
      case 'preferences':
        if (this.feedService.getConnectionStatus() != 0) {
          this.native.toastWarn('common.connectionError');
          return;
        }
        this.clearData();
        this.native.navigateForward(['feedspreferences'], {
          queryParams: {
            nodeId: this.shareNodeId,
            feedId: this.shareFeedId,
          },
        });
        this.hideSharMenuComponent = false;
        break;
      case 'cancel':
        this.qrCodeString = null;
        this.hideSharMenuComponent = false;
        break;
    }
    let sharemenu:HTMLElement = document.querySelector("app-sharemenu") || null;
    if(sharemenu != null){
      sharemenu.remove();
    }
  }

  getQrCodeString(feed: any) {
    let nodeId = feed['nodeId'];
    this.shareNodeId = nodeId;
    let serverInfo = this.feedService.getServerbyNodeId(nodeId);
    let feedsUrl = serverInfo['feedsUrl'] || null;
    let feedId = feed['channelId'] || '';
    this.shareFeedId = feedId;
    feedsUrl = feedsUrl + '/' + feedId;
    let feedsName = feed['channelName'] || '';
    return feedsUrl + '#' + encodeURIComponent(feedsName);
  }

  toPage(eventParm: any) {
    let nodeId = eventParm['nodeId'];
    let channelId = eventParm['channelId'];
    let postId = eventParm['postId'] || '';
    let page = eventParm['page'];
    this.clearData();
    if (postId != '') {
      this.native
        .getNavCtrl()
        .navigateForward([page, nodeId, channelId, postId]);
    } else {
      this.native.getNavCtrl().navigateForward([page, nodeId, channelId]);
    }
  }

  clickAvatar(nodeId: string, feedId: number) {
    let feed = this.feedService.getChannelFromId(nodeId, feedId);
    let followStatus = this.checkFollowStatus(nodeId, feedId);
    let feedName = feed.name;
    let feedDesc = feed.introduction;
    let feedSubscribes = feed.subscribers;
    let feedAvatar = this.feedService.parseChannelAvatar(feed.avatar);
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

    this.feedService.setChannelInfo({
      nodeId: nodeId,
      channelId: feedId,
      name: feedName,
      des: feedDesc,
      followStatus: followStatus,
      channelSubscribes: feedSubscribes,
    });

    this.native.navigateForward(['/feedinfo'], '');
  }

  checkFollowStatus(nodeId: string, channelId: number) {
    let channelsMap = this.feedService.getChannelsMap();
    let nodeChannelId = this.feedService.getChannelId(nodeId, channelId);
    if (
      channelsMap[nodeChannelId] == undefined ||
      !channelsMap[nodeChannelId].isSubscribed
    ) {
      return false;
    } else {
      return true;
    }
  }

  createPost() {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    let bindingServer = this.feedService.getBindingServer();
    if (bindingServer == null || bindingServer == undefined) {
      this.viewHelper.showPublisherDialog("profile");
      return;
    }

    let nodeId = bindingServer['nodeId'];
    if (this.checkServerStatus(nodeId) != 0) {
      this.native.toastWarn('common.connectionError1');
      return;
    }

    if (
      !this.feedService.checkBindingServerVersion(() => {
        this.feedService.hideAlertPopover();
      })
    )
      return;

    this.clearData();

    if (this.feedService.getMyChannelList().length === 0) {
      this.native.navigateForward(['/createnewfeed'], '');
      return;
    }

    let currentFeed = this.feedService.getCurrentFeed();
    if (currentFeed === null) {
      let myFeed = this.feedService.getMyChannelList()[0];
      let currentFeed = {
        nodeId: myFeed.nodeId,
        feedId: myFeed.id,
      };
      this.feedService.setCurrentFeed(currentFeed);
      this.storageService.set('feeds.currentFeed', JSON.stringify(currentFeed));
    }
    this.feedService.setSelsectNftImage("");
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
    let nftFirstdisclaimer = this.feedService.getNftFirstdisclaimer() || "";
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

  handleDialog(dialogName: string, dialogbutton: string, pageName: string) {
    switch (dialogName) {
      case "publisherAccount":
        this.publisherAccount(dialogbutton, pageName)
        break;
      case "guide":
        this.guide(dialogbutton);
        break;
    }
  }

  async publisherAccount(dialogbutton: string, pageName: string) {
    switch (dialogbutton) {
      case "createNewPublisherAccount":
        this.feedService.setBindPublisherAccountType('new');
        break;
      case "bindExistingPublisherAccount":
        this.feedService.setBindPublisherAccountType('exit');
        await this.native.navigateForward(['bindservice/scanqrcode'], "");
        await this.popoverController.dismiss();
        break;
    }
  }

  async guide(dialogbutton: string) {
    switch (dialogbutton) {
      case "guidemac":
        await this.native.navigateForward(["guidemac"], "");
        await this.popoverController.dismiss();
        break;
      case "guideubuntu":
        await this.native.navigateForward(["guideubuntu"], "");
        await this.popoverController.dismiss();
        break;
      case "skip":
        await this.native.navigateForward(['bindservice/scanqrcode'], "");
        await this.popoverController.dismiss();
        break;
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
    this.elaPrice = this.feedService.getElaUsdPrice();
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
