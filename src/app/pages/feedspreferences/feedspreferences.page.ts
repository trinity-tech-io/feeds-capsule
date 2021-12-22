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

@Component({
  selector: 'app-feedspreferences',
  templateUrl: './feedspreferences.page.html',
  styleUrls: ['./feedspreferences.page.scss'],
})
export class FeedspreferencesPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public connectionStatus = 1;
  public hideDeletedPosts: boolean = true;
  public nodeId: string = '';
  public feedId: number = 0;
  public feedPublicStatus = {};
  public curFeedPublicStatus: boolean = false;
  public popover: any = null;
  public developerMode: boolean = false;
  public isShowQrcode: boolean = true;

  public isFirst: boolean = false;

  public curCollectibleStatus: boolean = false;

  public collectibleStatus = {};

  private channelCollections: FeedsData.ChannelCollections = null;
  private exploreChannelCollectionList = [];
  public isLoading: boolean = false;
  public loadingTitle: string = "";
  public loadingText: string = "";
  public loadingCurNumber: string = "";
  public loadingMaxNumber: string = "";
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
  ) {}

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
    this.collectibleStatus = this.feedService.getCollectibleStatus();
    let key = this.nodeId + '_' + this.feedId;
    this.curCollectibleStatus = this.collectibleStatus[key] || false;
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.feedPublicStatus = this.feedService.getFeedPublicStatus() || {};
    this.getPublicStatus();
    let server = this.feedService.getServerbyNodeId(this.nodeId) || null;
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
    this.events.publish(FeedsEvent.PublishType.addProflieEvent);
  }

  clearEvent() {
    this.events.unsubscribe(FeedsEvent.PublishType.startLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.endLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
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

    this.events.subscribe(FeedsEvent.PublishType.nftCancelChannelOrder,(channelCollections: FeedsData.ChannelCollections)=>{
      let tokenId = channelCollections.tokenId;
      //自己频道
      let accountAddress = this.nftContractControllerService.getAccountAddress() || "";
      let ownChannelCollection = this.dataHelper.getOwnChannelCollection();
      let ownChannelCollectionList  = ownChannelCollection[accountAddress] || [];
      let itemIndex = _.findIndex(ownChannelCollectionList,(item: FeedsData.ChannelCollections)=>{
        return item.tokenId === tokenId;
      });
      let newChannelCollections = _.cloneDeep(channelCollections);
          newChannelCollections.panelId = "";
          newChannelCollections.status = "0";
      ownChannelCollectionList.splice(itemIndex,1,newChannelCollections);
      this.handleCace(accountAddress,ownChannelCollectionList);

      //explore feeds
      itemIndex = _.findIndex(this.exploreChannelCollectionList,(item: FeedsData.ChannelCollections)=>{
        return item.tokenId === tokenId;
       });
      this.exploreChannelCollectionList.splice(itemIndex,1);
      this.dataHelper.setPublishedActivePanelList(this.exploreChannelCollectionList);
      this.curFeedPublicStatus = false;

  });

  this.events.subscribe(FeedsEvent.PublishType.nftUpdateList, obj => {
    //自己频道
    let accountAddress = this.nftContractControllerService.getAccountAddress() || "";
    let ownChannelCollection = this.dataHelper.getOwnChannelCollection();
    let ownChannelCollectionList  = ownChannelCollection[accountAddress] || [];
    let type = obj["type"] || "";
    let tokenId = obj['tokenId'];
    if(type === "burn"){
      let itemIndex = _.findIndex(ownChannelCollectionList,(item: FeedsData.ChannelCollections)=>{
        return item.tokenId === tokenId;
      });
      ownChannelCollectionList.splice(itemIndex,1);
      this.handleCace(accountAddress,ownChannelCollectionList);
      return;
    }
    this.curFeedPublicStatus = true;
    let panelId = obj['panelId'];
    let itemIndex = _.findIndex(ownChannelCollectionList,(item: FeedsData.ChannelCollections)=>{
      return item.tokenId === tokenId;
    });
    let newChannelCollections = _.cloneDeep(ownChannelCollectionList[itemIndex]);
    newChannelCollections.panelId = panelId;
    newChannelCollections.status = "1";
    ownChannelCollectionList.splice(itemIndex,1,newChannelCollections);
    this.handleCace(accountAddress,ownChannelCollectionList);

    //explore Feeds
    this.exploreChannelCollectionList.push(newChannelCollections);
    this.dataHelper.setPublishedActivePanelList(this.exploreChannelCollectionList);

  });

    this.events.subscribe(FeedsEvent.PublishType.connectionChanged, status => {
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });
    this.events.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      this.initTitle();
    });
  }

  handleCace(accountAddress: string,ownChannelCollectionList: any) {
    let ownChannelCollection = this.dataHelper.getOwnChannelCollection();
    ownChannelCollection[accountAddress] = ownChannelCollectionList;
    this.dataHelper.setOwnChannelCollection(ownChannelCollection);
  }

  unPublicFeeds() {
    let server = this.feedService.getServerbyNodeId(this.nodeId) || null;
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
    let server = this.feedService.getServerbyNodeId(this.nodeId) || null;
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
    console.log("==this.channelCollections===",this.channelCollections)
    if(this.channelCollections != null){
      this.curFeedPublicStatus = true;
      return;
    }
    let server = this.feedService.getServerbyNodeId(this.nodeId) || null;
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
        this.isFirst = true;
      });
    }
  }

  toggle() {
    if (!this.curFeedPublicStatus) {
      if (this.feedService.getConnectionStatus() !== 0) {
        this.native.toastWarn('common.connectionError');
        return;
      }

      if (!this.isShowQrcode) {
        this.native.toastWarn('common.waitOnChain');
        return;
      }

      this.mintChannel();

      // if (this.developerMode) {
      //   this.developerModeConfirm();
      //   return;
      // }
      // this.publicFeeds('cancel');

      return;
    }

    if (this.curFeedPublicStatus) {
      if (this.feedService.getConnectionStatus() !== 0) {
        this.native.toastWarn('common.connectionError');
        return;
      }
      this.unPublicFeeds();
      return;
    }
  }

  async newToggle(){
    let channelCollections: FeedsData.ChannelCollections = this.channelCollections || null;
    if(channelCollections != null){
      if(channelCollections.status === "1"){//收藏品频道下架
        let accountAddress = this.nftContractControllerService.getAccountAddress() || "";
        if(accountAddress === '') {
        this.native.toastWarn('common.connectWallet');
        return;
        }
        this.menuService.showChannelCollectionsPublishedMenu(channelCollections);
           return;
      }
    }else{
    let server = this.feedService.getServerbyNodeId(this.nodeId) || null;
      if (server === null) {
      return;
      }
      let feedsUrl = server.feedsUrl + '/' + this.feedId;
      let tokenInfo = await this.isExitStrick(feedsUrl);
      if(tokenInfo != null){
        let accountAddress = this.nftContractControllerService.getAccountAddress() || "";
        if(accountAddress === '') {
        this.native.toastWarn('common.connectWallet');
        return;
        }
        let channelItem: FeedsData.ChannelCollections = await this.getChannelCollections(tokenInfo,accountAddress);
        this.menuService.showChannelCollectionsMenu(channelItem);
      }else{
        this.toggle();
      }
    }
  }

 async getChannelCollections(tokenInfo :any,accountAddress: string){
      let channelCollections: FeedsData.ChannelCollections = UtilService.getChannelCollections()
      channelCollections.status = "0";
      channelCollections.userAddr = accountAddress;
      channelCollections.panelId = "";
      channelCollections.tokenId = tokenInfo[0];
      channelCollections.type = "feeds-channel";
      const signinData = this.feedService.getSignInData();
      channelCollections.ownerDid = signinData.did;

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
    let urlArr = url.replace("feeds://","").split("/");
    channelCollections.did = urlArr[0];
    let carrierAddress = urlArr[1];
    let nodeId = await this.carrierService.getIdFromAddress(carrierAddress,()=>{});
    channelCollections.nodeId = nodeId;
    return channelCollections;
  }

  setCollectible() {
    this.zone.run(() => {
      this.curCollectibleStatus = !this.curCollectibleStatus;
      let key = this.nodeId + '_' + this.feedId;
      this.collectibleStatus[key] = this.curCollectibleStatus;
      this.feedService.setCollectibleStatus(this.collectibleStatus);
      this.storageService.set(
        'feeds.collectible.setting',
        JSON.stringify(this.collectibleStatus),
      );
    });
  }

  mintChannel(){
    this.native.navigateForward(['/galleriachannel'],{ queryParams:{"nodeId": this.nodeId,"channelId": this.feedId }});
  }

  async getChannelCollectionsStatus(){
     this.exploreChannelCollectionList =  this.dataHelper.getPublishedActivePanelList() || [];
     const signinData: any = this.feedService.getSignInData() || {};
     let ownerDid = signinData.did || "";
     let server = this.feedService.getServerbyNodeId(this.nodeId) || null;
     if (server === null) {
       return;
     }
     let feedsUrl = server.feedsUrl + '/' + this.feedId;
     let channelCollections: FeedsData.ChannelCollections = null;
     if(this.exploreChannelCollectionList.length === 0){
      this.exploreChannelCollectionList = await this.getActivePanelList();
      console.log("this.exploreChannelCollectionList",this.exploreChannelCollectionList);
     }

    channelCollections = _.find(this.exploreChannelCollectionList,(item: FeedsData.ChannelCollections)=>{
      return ownerDid === item.ownerDid && feedsUrl===item.entry.url;
     });
     return channelCollections;
    }

  async getActivePanelList(){
    let channelCollectionList = [];
    try{
    let activePanelCount = await this.nftContractControllerService.getGalleria().getActivePanelCount();
    for (let index = 0; index < activePanelCount; index++) {
      try {
        const item:any = await this.nftContractControllerService.getGalleria().getActivePanelByIndex(index);
        /*userAddr:2*/
        let channelCollections: FeedsData.ChannelCollections = UtilService.getChannelCollections();
        channelCollections.panelId = item[0];
        channelCollections.userAddr = item[2];
        channelCollections.diaBalance = await this.nftContractControllerService.getDiamond().getDiamondBalance(item[2]);
        channelCollections.type = "feeds-channel";
        channelCollections.tokenId = item[3];
      let tokenInfo =  await this.nftContractControllerService
        .getSticker().tokenInfo(channelCollections.tokenId);
      let tokenUri = tokenInfo[3]; //tokenUri
      tokenUri = this.nftContractHelperService.parseTokenUri(tokenUri);
      const tokenJson = await this.ipfsService
      .nftGet(this.ipfsService.getNFTGetUrl() + tokenUri);
      let avatar: FeedsData.GalleriaAvatar = tokenJson["avatar"];
      channelCollections.name = tokenJson["name"];
      channelCollections.description = tokenJson["description"];
      channelCollections.avatar = avatar;
      channelCollections.entry = tokenJson["entry"];
      let didUri = this.nftContractHelperService.parseTokenUri(item[6]);
      const didJson: any = await this.ipfsService
      .nftGet(this.ipfsService.getNFTGetUrl() + didUri);
      channelCollections.ownerDid = didJson.did;
      let result = await this.feedService.resolveDidObjectForName(channelCollections.ownerDid);
      let didName = result["name"] || "";
      channelCollections.ownerName = didName;
      let url: string = tokenJson["entry"]["url"];
      let urlArr = url.replace("feeds://","").split("/");
      channelCollections.did = urlArr[0];
      let carrierAddress = urlArr[1];
      let nodeId = await this.carrierService.getIdFromAddress(carrierAddress,()=>{});
      channelCollections.nodeId = nodeId;
      channelCollectionList.push(channelCollections);
      } catch (error) {
        console.error("Get Sale item error", error);
      }
    }
    this.dataHelper.setPublishedActivePanelList(channelCollectionList);
    console.log("===channelCollectionList===",channelCollectionList);
    return channelCollectionList;
    }catch (error) {
      channelCollectionList = [];
      this.dataHelper.setPublishedActivePanelList(channelCollectionList);
      return channelCollectionList;
    }
  }

 async isExitStrick(feedsUrl: string) {

   try {
    let tokenId: string ="0x" + UtilService.SHA256(feedsUrl);
    console.log("=====tokenId=====",tokenId);
    let tokenInfo = await this.pasarAssistService.searchStickers(tokenId);
    console.log("=====tokenInfo=====",tokenInfo);
    if(tokenInfo != null){
         return tokenInfo;
    }
    return null;
   } catch (error) {
    return null;
   }

  }


}
