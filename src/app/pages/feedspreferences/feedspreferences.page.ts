import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { ActivatedRoute, Params } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../services/theme.service';
import { FeedService } from '../../services/FeedService';
import { NativeService } from '../../services/NativeService';
import { HttpService } from '../../services/HttpService';
import { ApiUrl } from '../../services/ApiUrl';
import { StorageService } from '../../services/StorageService';
import { UtilService } from '../../services/utilService';
import { PopupProvider } from '../../services/popup';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import _ from 'lodash';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { NFTContractHelperService } from 'src/app/services/nftcontract_helper.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { CarrierService } from 'src/app/services/CarrierService';
import { MenuService } from 'src/app/services/MenuService';
import { PasarAssistService } from 'src/app/services/pasar_assist.service';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';

@Component({
  selector: 'app-feedspreferences',
  templateUrl: './feedspreferences.page.html',
  styleUrls: ['./feedspreferences.page.scss'],
})
export class FeedspreferencesPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public hideDeletedPosts: boolean = true;
  public nodeId: string = '';
  public feedId: string = "0";
  public feedPublicStatus = {};
  public curFeedPublicStatus: boolean = false;
  public popover: any = null;
  public developerMode: boolean = false;
  public isShowQrcode: boolean = true;

  public isFirst: boolean = false;

  public curCollectibleStatus: boolean = false;

  public collectibleStatus = {};

  private channelCollections: FeedsData.ChannelCollections = null;
  public isLoading: boolean = false;
  public loadingTitle: string = "";
  public loadingText: string = "";
  public loadingCurNumber: string = "";
  public loadingMaxNumber: string = "";
  public isShowMint: boolean = false;
  constructor(
    private translate: TranslateService,
    private events: Events,
    public theme: ThemeService,
    public activeRoute: ActivatedRoute,
    private feedService: FeedService,
    private native: NativeService,
    public httpService: HttpService,
    private storageService: StorageService,
    public popupProvider: PopupProvider,
    private popoverController: PopoverController,
    private zone: NgZone,
    private titleBarService: TitleBarService,
    private nftContractControllerService: NFTContractControllerService,
    private dataHelper: DataHelper,
    private nftContractHelperService: NFTContractHelperService,
    private ipfsService: IPFSService,
    private carrierService: CarrierService,
    private menuService: MenuService,
    private pasarAssistService: PasarAssistService,
    private feedsServiceApi: FeedsServiceApi,
  ) { }

  ngOnInit() {
    this.activeRoute.queryParams.subscribe((params: Params) => {
      this.nodeId = params.nodeId;
      this.feedId = params.feedId;
    });
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('FeedspreferencesPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewWillEnter() {
    this.collectibleStatus = this.dataHelper.getCollectibleStatus();
    let key = this.nodeId + '_' + this.feedId;
    this.curCollectibleStatus = this.collectibleStatus[key] || false;
    this.feedPublicStatus = this.feedService.getFeedPublicStatus() || {};
    this.getPublicStatus();
    let server = this.feedsServiceApi.getServerbyNodeId(this.nodeId) || null;
    if (server != null) {
      this.feedService.checkDIDOnSideChain(server.did, isOnSideChain => {
        this.isShowQrcode = isOnSideChain;
      });
    }
    this.developerMode = this.feedService.getDeveloperMode();
    this.initTitle();
    this.addEvent();
  }

  ionViewWillLeave() {
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = null;
    }
    this.clearEvent();
    this.native.handleTabsEvents()
  }

  clearEvent() {
    this.events.unsubscribe(FeedsEvent.PublishType.startLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.endLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
    this.events.unsubscribe(FeedsEvent.PublishType.nftCancelChannelOrder);
    this.events.unsubscribe(FeedsEvent.PublishType.nftUpdateList);
  }

  addEvent() {
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

    this.events.subscribe(FeedsEvent.PublishType.nftCancelChannelOrder, (channelCollections: FeedsData.ChannelCollections) => {
      this.zone.run(() => {
        this.curFeedPublicStatus = false;
        this.isShowMint = false;
        let publishedActivePanelList = this.dataHelper.getPublishedActivePanelList() || [];
        if (publishedActivePanelList.length === 0) {
          return;
        }
        let tokenId = channelCollections.tokenId;
        let itemIndex = _.findIndex(publishedActivePanelList, (item: any) => {
          return item.tokenId === tokenId;
        });
        this.channelCollections = null;
        publishedActivePanelList.splice(itemIndex, 1);
        this.dataHelper.setPublishedActivePanelList(publishedActivePanelList);
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.nftUpdateList, obj => {
      let type = obj["type"] || "";
      if (type === "burn") {
        this.zone.run(() => {
          this.curFeedPublicStatus = false;
          this.isShowMint = false;
        });
        return;
      }
      this.zone.run(() => {
        this.curFeedPublicStatus = true;
        this.isShowMint = false;
        let newItem = _.cloneDeep(obj["assItem"]);
        newItem["panelId"] = obj["panelId"];
        this.channelCollections = newItem;
        let publishedActivePanelList = this.dataHelper.getPublishedActivePanelList() || [];
        publishedActivePanelList.push(newItem);
        this.dataHelper.setPublishedActivePanelList(publishedActivePanelList);
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      this.initTitle();
    });
  }

  unPublicFeeds() {
    let server = this.feedsServiceApi.getServerbyNodeId(this.nodeId) || null;
    if (server === null) {
      return;
    }
    let feed = this.feedService.getChannelFromId(this.nodeId, this.feedId);
    let feedsUrl = server.feedsUrl + '/' + feed['id'];
    let feedsUrlHash = UtilService.SHA256(feedsUrl);
    this.httpService
      .ajaxGet(ApiUrl.remove + '?feedsUrlHash=' + feedsUrlHash)
      .then(result => {
        if (result['code'] === 200) {
          this.zone.run(() => {
            this.curFeedPublicStatus = false;
            this.isFirst = true;
          });
          this.feedPublicStatus = _.omit(this.feedPublicStatus, [feedsUrlHash]);
          this.feedService.setFeedPublicStatus(this.feedPublicStatus);
          this.storageService.set(
            'feeds.feedPublicStatus',
            JSON.stringify(this.feedPublicStatus),
          );
        }
      });
  }

  publicFeeds(buttonType: string) {
    let server = this.feedsServiceApi.getServerbyNodeId(this.nodeId) || null;
    if (server === null) {
      return;
    }
    let feed = this.feedService.getChannelFromId(this.nodeId, this.feedId);
    let feedsUrl = server.feedsUrl + '/' + feed['id'];
    let channelAvatar = this.feedService.parseChannelAvatar(feed['avatar']);
    let feedsUrlHash = UtilService.SHA256(feedsUrl);
    let obj = {
      did: server['did'],
      name: feed['name'],
      description: feed['introduction'],
      url: feedsUrl,
      feedsUrlHash: feedsUrlHash,
      feedsAvatar: channelAvatar,
      followers: feed['subscribers'],
      ownerName: feed['owner_name'],
      nodeId: this.nodeId,
      ownerDid: feed['owner_did'],
    };

    if (this.developerMode && buttonType === 'confirm') {
      obj['purpose'] = '1';
    }

    this.httpService.ajaxPost(ApiUrl.register, obj).then(result => {
      if (result['code'] === 200) {
        this.zone.run(() => {
          this.isFirst = true;
          this.curFeedPublicStatus = true;
        });
        this.feedPublicStatus[feedsUrlHash] = '1';
        this.feedService.setFeedPublicStatus(this.feedPublicStatus);
        this.storageService.set(
          'feeds.feedPublicStatus',
          JSON.stringify(this.feedPublicStatus)
        );
      }
    });
  }

  developerModeConfirm() {
    this.popover = this.popupProvider.ionicConfirm(
      this,
      'SearchPage.confirmTitle',
      'ServerInfoPage.des1',
      this.cancel,
      this.confirm,
      './assets/images/tskth.svg',
      'ServerInfoPage.des2',
      'ServerInfoPage.des3',
    );
  }

  cancel(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
    that.publicFeeds('cancel');
  }

  confirm(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
    that.publicFeeds('confirm');
  }

  async getPublicStatus() {

    this.channelCollections = await this.getChannelCollectionsStatus() || null;
    if (this.channelCollections != null) {
      this.zone.run(() => {
        this.curFeedPublicStatus = true;
      });
      return;
    }
    let server = this.feedsServiceApi.getServerbyNodeId(this.nodeId) || null;
    if (server === null) {
      return;
    }
    let feedsUrl = server.feedsUrl + '/' + this.feedId;
    let feedsUrlHash = UtilService.SHA256(feedsUrl);
    let curFeedPublicStatus = this.feedPublicStatus[feedsUrlHash] || '';
    if (curFeedPublicStatus === '') {
      this.httpService
        .ajaxGet(ApiUrl.get + '?feedsUrlHash=' + feedsUrlHash, false)
        .then(result => {
          if (result['code'] === 200) {
            let resultData = result['data'] || '';
            if (resultData != '') {
              this.zone.run(() => {
                this.curFeedPublicStatus = true;
                this.isFirst = true;
                this.isShowMint = true;
              });
              this.feedPublicStatus[feedsUrlHash] = '1';
              this.feedService.setFeedPublicStatus(this.feedPublicStatus);
              this.storageService.set(
                'feeds.feedPublicStatus',
                JSON.stringify(this.feedPublicStatus)
              );
            } else {
              this.zone.run(() => {
                this.curFeedPublicStatus = false;
              });
            }
          }
        });
    } else {
      this.zone.run(() => {
        this.curFeedPublicStatus = true;
        this.isShowMint = true;
        this.isFirst = true;
      });
    }
  }

  toggle() {
    if (!this.curFeedPublicStatus) {
      let connectStatus = this.dataHelper.getNetworkStatus();
      if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
      }

      if (!this.isShowQrcode) {
        this.native.toastWarn('common.waitOnChain');
        this.native.hideLoading();
        return;
      }
      this.native.hideLoading();
      this.mintChannel();

      // if (this.developerMode) {
      //   this.developerModeConfirm();
      //   return;
      // }
      // this.publicFeeds('cancel');

      return;
    }

    if (this.curFeedPublicStatus) {
      let connectStatus = this.dataHelper.getNetworkStatus();
      if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
      }
      this.unPublicFeeds();
      return;
    }
  }

  async newToggle() {
    await this.native.showLoading("common.waitMoment");
    let channelCollections: FeedsData.ChannelCollections = this.channelCollections || null;
    if (channelCollections != null && this.curFeedPublicStatus) {
      let accountAddress = this.nftContractControllerService.getAccountAddress() || "";
      if (accountAddress === '') {
        this.native.hideLoading();
        this.native.toastWarn('common.connectWallet');
        return;
      }
      this.native.hideLoading();
      this.menuService.showChannelCollectionsPublishedMenu(channelCollections);
      return;
    } else {
      let server = this.feedsServiceApi.getServerbyNodeId(this.nodeId) || null;
      if (server === null) {
        this.native.hideLoading();
        return;
      }
      let feedsUrl = server.feedsUrl + '/' + this.feedId;
      let tokenInfo = await this.isExitStrick(feedsUrl);
      if (tokenInfo != null) {
        let accountAddress = this.nftContractControllerService.getAccountAddress() || "";
        if (accountAddress === '') {
          this.native.toastWarn('common.connectWallet');
          this.native.hideLoading();
          return;
        }
        let channelItem: FeedsData.ChannelCollections = await this.getChannelCollections(tokenInfo, accountAddress);
        this.native.hideLoading();
        this.menuService.showChannelCollectionsMenu(channelItem);
      } else {
        this.toggle();
      }
    }
  }

  async getChannelCollections(tokenInfo: any, accountAddress: string) {
    let channelCollections: FeedsData.ChannelCollections = UtilService.getChannelCollections()
    channelCollections.status = "0";
    channelCollections.userAddr = accountAddress;
    channelCollections.panelId = "";
    channelCollections.tokenId = tokenInfo[0];
    channelCollections.type = "feeds-channel";
    channelCollections.ownerDid = (await this.dataHelper.getSigninData()).did;

    let tokenUri = tokenInfo[3]; //tokenUri
    tokenUri = this.nftContractHelperService.parseTokenUri(tokenUri);
    const tokenJson = await this.ipfsService
      .nftGet(this.ipfsService.getNFTGetUrl() + tokenUri);
    channelCollections.name = tokenJson["name"];
    channelCollections.description = tokenJson["description"];
    let avatar: FeedsData.GalleriaAvatar = tokenJson["avatar"];
    channelCollections.avatar = avatar;
    channelCollections.entry = tokenJson["entry"];
    channelCollections.ownerName = "";
    let url: string = tokenJson["entry"]["url"];
    let urlArr = url.replace("feeds://", "").split("/");
    channelCollections.did = urlArr[0];
    let carrierAddress = urlArr[1];
    let nodeId = await this.carrierService.getIdFromAddress(carrierAddress, () => { });
    channelCollections.nodeId = nodeId;
    return channelCollections;
  }

  setCollectible() {
    this.zone.run(() => {
      this.curCollectibleStatus = !this.curCollectibleStatus;
      let key = this.nodeId + '_' + this.feedId;
      this.collectibleStatus[key] = this.curCollectibleStatus;
      this.dataHelper.setCollectibleStatus(this.collectibleStatus);
      this.storageService.set(
        'feeds.collectible.setting',
        JSON.stringify(this.collectibleStatus),
      );
    });
  }

  mintChannel() {
    this.native.navigateForward(['/galleriachannel'], { queryParams: { "nodeId": this.nodeId, "channelId": this.feedId } });
  }

  async getChannelCollectionsStatus() {
    try {
      let server = this.feedsServiceApi.getServerbyNodeId(this.nodeId) || null;
      if (server === null) {
        return;
      }
      let feedsUrl = server.feedsUrl + '/' + this.feedId;
      let feedsUrlHash = UtilService.SHA256(feedsUrl);
      let tokenId: string = "0x" + feedsUrlHash;
      tokenId = UtilService.hex2dec(tokenId);
      let list = this.dataHelper.getPublishedActivePanelList() || [];
      let fitleItem = _.find(list, (item) => {
        return item.tokenId === tokenId;
      }) || null;
      if (fitleItem != null) {
        return fitleItem;
      }
      let result = await this.pasarAssistService.getPanel(tokenId);
      if (result != null) {
        let tokenInfo = result["data"] || "";
        if (tokenInfo === "") {
          return null;
        }
        tokenInfo = await this.handlePanels(result["data"]);
        let panelList = this.dataHelper.getPublishedActivePanelList() || [];
        panelList.push(tokenInfo);
        this.dataHelper.setPublishedActivePanelList(panelList);
        return tokenInfo;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async handlePanels(item: any) {
    let channelCollections: FeedsData.ChannelCollections = UtilService.getChannelCollections();
    channelCollections.version = item.version;
    channelCollections.panelId = item.panelId;
    channelCollections.userAddr = item.user;
    //channelCollections.diaBalance = await this.nftContractControllerService.getDiamond().getDiamondBalance(channelCollections.userAddr);
    channelCollections.diaBalance = "0";
    channelCollections.type = item.type;
    channelCollections.tokenId = item.tokenId;
    channelCollections.name = item.name;
    channelCollections.description = item.description;
    channelCollections.avatar = item.avatar;
    channelCollections.entry = item.entry;
    channelCollections.ownerDid = item.tokenDid.did;
    channelCollections.ownerName = (await this.dataHelper.getSigninData()).name;
    let url: string = channelCollections.entry.url;
    let urlArr = url.replace("feeds://", "").split("/");
    channelCollections.did = urlArr[0];
    let carrierAddress = urlArr[1];
    let nodeId = await this.carrierService.getIdFromAddress(carrierAddress, () => { });
    channelCollections.nodeId = nodeId;
    return channelCollections;
  }

  async isExitStrick(feedsUrl: string) {

    try {
      let tokenId: string = "0x" + UtilService.SHA256(feedsUrl);
      tokenId = UtilService.hex2dec(tokenId);
      //let tokenInfo = await this.pasarAssistService.searchStickers(tokenId);
      let tokenInfo = await this.nftContractControllerService.getSticker().tokenInfo(tokenId);
      if (tokenInfo[0] != '0' && tokenInfo[2] != '0') {
        return tokenInfo;
      }
      return null;
    } catch (error) {
      return null;
    }

  }


}
