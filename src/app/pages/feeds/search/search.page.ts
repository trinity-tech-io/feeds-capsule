import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { FeedService } from '../../../services/FeedService';
import { PopoverController, IonRefresher, IonSearchbar } from '@ionic/angular';
import { NativeService } from '../../../services/NativeService';
import { ThemeService } from '../../../services/theme.service';
import { UtilService } from '../../../services/utilService';
import { PopupProvider } from '../../../services/popup';
import { HttpService } from '../../../services/HttpService';
import { ApiUrl } from '../../../services/ApiUrl';
import { StorageService } from '../../../services/StorageService';
import { IntentService } from '../../../services/IntentService';
import { Events } from 'src/app/services/events.service';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { DataHelper } from 'src/app/services/DataHelper';
import _ from 'lodash';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { NFTContractHelperService } from 'src/app/services/nftcontract_helper.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { CarrierService } from 'src/app/services/CarrierService';
import { FileHelperService } from 'src/app/services/FileHelperService';
import { PasarAssistService } from 'src/app/services/pasar_assist.service';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { FeedsUrl, ScannerCode, ScannerHelper } from 'src/app/services/scanner_helper.service';
import { Logger } from 'src/app/services/logger';
import { FeedsPage } from '../feeds.page';

const TAG: string = 'SearchPage';
@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})

export class SearchPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonRefresher, { static: true }) ionRefresher: IonRefresher;
  @ViewChild('searchbar', { static: false }) searchbar: IonSearchbar;

  public popover: any = '';
  public curAddingItem = {};
  public addingChanneList = [];
  public searchAddingChanneList = [];
  public isSearch: string = '';
  public searchfeedsList = [];
  public discoverSquareList = [];
  public pageNum: number = 1;
  public pageSize: number = 10;
  public totalNum: number = 0;
  public isLoading: boolean = true;
  public developerMode: boolean = false;
  public searchSquareList = [];
  public followedList = [];
  public httpAllData = [];
  public unfollowedFeed = [];
  public searchUnfollowedFeed = [];
  public scanServiceStyle = { right: '' };
  public curtotalNum: number = 0;
  private clientHeight: number = 0;
  private pasarGridisLoadimage: any = {};
  private channelCollectionList: any = [];//所有的
  private channelCollectionsAvatarisLoad: any = {};
  public channelCollectionPageList: any = [];//页面显示用
  public searchChannelCollectionPageList: any = [];//搜索使用
  private panelPageSize: number = 10;//一页多少个
  private panelPageNum: number = 1;//页码
  private confirmdialog = null;

  private displayName: string = '';
  private toBeSubscribeddestDid: string = '';
  private toBeSubscribedChannelId: string = '';
  // {
  //   "nodeId": "8Dsp9jkTg8TEfCkwMoXimwjLeaRidMczLZYNWbKGj1SF",
  //   "did": "did:elastos:ibfZa4jQ1QgDRP9rpfbUbZWpXgbd9z7oKF",
  //   "carrierAddress": "GsfYTr2bTBSppVxMYwj2e8gPpx4CRAZVd2NjehUmRAWYeuiLWmaH",
  //   "feedId": 4,
  //   "feedName": "feeds_testing 4",
  //   "feedUrl": "feeds://did:elastos:ibfZa4jQ1QgDRP9rpfbUbZWpXgbd9z7oKF/GsfYTr2bTBSppVxMYwj2e8gPpx4CRAZVd2NjehUmRAWYeuiLWmaH/4",
  //   "serverUrl": "feeds://did:elastos:ibfZa4jQ1QgDRP9rpfbUbZWpXgbd9z7oKF/GsfYTr2bTBSppVxMYwj2e8gPpx4CRAZVd2NjehUmRAWYeuiLWmaH",
  //   "status": 7,
  //   "friendState": 2,
  //   "avatar":"./assets/images/profile-1.svg",
  //   "follower": 5
  // }
  constructor(
    private nftContractControllerService: NFTContractControllerService,
    private feedService: FeedService,
    private events: Events,
    private zone: NgZone,
    private native: NativeService,
    public theme: ThemeService,
    private popoverController: PopoverController,
    private popupProvider: PopupProvider,
    private httpService: HttpService,
    private intentService: IntentService,
    public storageService: StorageService,
    private translate: TranslateService,
    private viewHelper: ViewHelper,
    private titleBarService: TitleBarService,
    private dataHelper: DataHelper,
    private nftContractHelperService: NFTContractHelperService,
    private ipfsService: IPFSService,
    private carrierService: CarrierService,
    private fileHelperService: FileHelperService,
    private pasarAssistService: PasarAssistService,
    private feedsServiceApi: FeedsServiceApi,
    private hiveVaultController: HiveVaultController,
    private feedspage: FeedsPage
  ) { }

  ngOnInit() {
    this.scanServiceStyle['right'] = (screen.width * 7.5) / 100 + 5 + 'px';
  }

  initTile() {
    let title = this.translate.instant('FeedsPage.tabTitle4');
    this.titleBarService.setTitle(this.titleBar, title);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  initSubscribe() {
    this.events.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      this.initTile();
    });

    this.events.subscribe(
      FeedsEvent.PublishType.subscribeFinish,
      (subscribeFinishData: FeedsEvent.SubscribeFinishData) => {
        this.zone.run(() => {
          let nodeId = subscribeFinishData.nodeId;
          let channelId = subscribeFinishData.channelId;
          this.unfollowedFeed = this.getUnfollowedFeed() || [];
          this.searchUnfollowedFeed = _.cloneDeep(this.unfollowedFeed);
          this.addingChanneList =
            this.feedService.getToBeAddedFeedsList() || [];
          this.searchAddingChanneList = _.cloneDeep(this.addingChanneList);
          this.handleSearch();
        });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.addFeedStatusChanged,
      (addFeedStatusChangedData: FeedsEvent.AddFeedStatusChangedData) => {
        this.zone.run(() => {
          let nodeId = addFeedStatusChangedData.nodeId;
          let channelId = addFeedStatusChangedData.feedId;
          this.addingChanneList =
            this.feedService.getToBeAddedFeedsList() || [];
          this.searchAddingChanneList = _.cloneDeep(this.addingChanneList);
          let arrIndex = _.findIndex(this.channelCollectionPageList, (item: any) => {
            let feedNodeId = item['nodeId'];
            let feedUrl = item['url'] || item.entry.url;
            let feedId = feedUrl.split('/')[4];
            return nodeId == feedNodeId && channelId == feedId;
          });
          if (arrIndex != -1) {
            this.channelCollectionPageList.splice(arrIndex, 1);
          }
          this.discoverSquareList = this.filterdiscoverSquareList(
            this.discoverSquareList,
          );
        });
      },
    );

  }

  removeSubscribe() {
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = '';
    }
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
    this.events.unsubscribe(FeedsEvent.PublishType.subscribeFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.addFeedStatusChanged);
  }

  ionViewWillEnter() {
    this.clientHeight = screen.availHeight;
    this.events.subscribe(FeedsEvent.PublishType.search, () => {
      this.initTile();
      //this.init();
    });
    this.initTile();
    //this.init();
  }

  initTitleBar() {
    let title = this.translate.instant('SearchPage.title');
    this.titleBarService.setTitle(this.titleBar, title);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  async init() {
    let discoverfeeds = this.dataHelper.getDiscoverfeeds();
    if (discoverfeeds.length === 0) {
      this.pageNum = 1;
      await this.native.showLoading('common.waitMoment');
      this.initData('', false);
    } else {
      this.channelCollectionPageList = await this.filterChannelCollection();
      this.refreshChannelCollectionAvatar();
      this.httpAllData = _.cloneDeep(discoverfeeds);
      this.discoverSquareList = _.cloneDeep(discoverfeeds);
      this.refreshDiscoverSquareFeedAvatar();
    }
    this.developerMode = this.feedService.getDeveloperMode();
    this.unfollowedFeed = this.getUnfollowedFeed();
    this.discoverSquareList = this.filterdiscoverSquareList(
      this.discoverSquareList,
    );
    this.initSubscribe();
    this.handleSearch();
  }

  ionViewWillLeave() {
    this.removeSubscribe();
    this.curAddingItem = '';
    this.events.unsubscribe(FeedsEvent.PublishType.search);
  }

  subscribe(destDid: string, id: string) {
    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
    this.native.toastWarn('common.connectionError');
    return;
    }

    //TODO
    // this.hiveVaultController.subscribeChannel();
  }

  getItems(events: any) {
    this.isSearch = events.target.value || '';
    this.scanServiceStyle['z-index'] = -1;
    if (
      (events && events.keyCode === 13) ||
      (events.keyCode === 8 && this.isSearch === '')
    ) {
      if (this.checkFeedUrl(this.isSearch)) {
        this.scanServiceStyle['z-index'] = 3;
        this.addFeedUrl(this.isSearch);
        return;
      }
      if (this.isSearch == '') {
        this.scanServiceStyle['z-index'] = 3;
        this.ionRefresher.disabled = false;
        this.addingChanneList = this.feedService.getToBeAddedFeedsList() || [];
        this.unfollowedFeed = this.getUnfollowedFeed() || [];
        let discoverfeeds = this.dataHelper.getDiscoverfeeds() || [];
        if (discoverfeeds.length > 0) {
          this.discoverSquareList = this.filterdiscoverSquareList(
            discoverfeeds,
          );
        }
        this.searchChannelCollectionPageList = _.cloneDeep(this.channelCollectionPageList);
        this.searchAddingChanneList = _.cloneDeep(this.addingChanneList);
        return;
      }
      this.ionRefresher.disabled = true;
      this.handleSearch();
    }
  }

  ionClear() {
    this.scanServiceStyle['z-index'] = 3;
    this.isSearch = '';
    if (this.checkFeedUrl(this.isSearch)) {
      this.addFeedUrl(this.isSearch);
      return;
    }
    if (this.isSearch == '') {
      this.ionRefresher.disabled = false;
      this.addingChanneList = this.feedService.getToBeAddedFeedsList() || [];
      this.unfollowedFeed = this.getUnfollowedFeed() || [];
      let discoverfeeds = this.dataHelper.getDiscoverfeeds() || [];
      if (discoverfeeds.length > 0) {
        this.discoverSquareList = this.filterdiscoverSquareList(discoverfeeds);
      }
      this.searchAddingChanneList = _.cloneDeep(this.addingChanneList);
      this.refreshDiscoverSquareFeedAvatar();
      return;
    }
    this.ionRefresher.disabled = true;
    this.handleSearch();
  }
  handleSearch() {
    if (this.isSearch === '') {
      return;
    }
    this.addingChanneList = this.searchAddingChanneList.filter(
      channel =>
        channel.feedName.toLowerCase().indexOf(this.isSearch.toLowerCase()) >
        -1,
    );

    this.channelCollectionPageList = this.searchChannelCollectionPageList.filter(
      (feed: FeedsData.ChannelCollections) => feed.name.toLowerCase().indexOf(this.isSearch.toLowerCase()) > -1,
    );

    if (this.channelCollectionPageList.length > 0) {
      this.refreshChannelCollectionAvatar();
    }

    this.unfollowedFeed = this.searchUnfollowedFeed.filter(
      feed => feed.name.toLowerCase().indexOf(this.isSearch.toLowerCase()) > -1,
    );


    this.discoverSquareList = this.searchSquareList.filter(
      feed => feed.name.toLowerCase().indexOf(this.isSearch.toLowerCase()) > -1,
    );
    if (this.discoverSquareList.length > 0) {
      this.refreshDiscoverSquareFeedAvatar();
    }
  }

  doRefresh(event) {
    //let sid = setTimeout(() => {
    this.feedService.updateSubscribedFeed();
    this.dataHelper.setDiscoverfeeds([]);
    this.curtotalNum = 0;
    this.panelPageNum = 1;
    this.pageNum = 1;
    this.initData(event, false);
    //event.target.complete();
    //clearTimeout(sid);
    //}, 2000);
  }

  navTo(destDid: string, channelId: string) {
    this.removeSubscribe();
    this.native.navigateForward(['/channels', destDid, channelId], '');
  }

  parseChannelAvatar(avatar: string): string {
    return this.feedService.parseChannelAvatar(avatar);
  }

  moreName(name: string) {
    return UtilService.moreNanme(name);
  }

  pressName(channelName: string) {
    let name = channelName || '';
    if (name != '' && name.length > 15) {
      this.viewHelper.createTip(name);
    }
  }

  discover() {
    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
    this.native.toastWarn('common.connectionError');
    return;
    }
    this.native.go('discoverfeed');
  }

  handleStatus(item: any) {
    let status = item['status'] || 0;
    let keyString = 'SearchPage.status';
    return keyString + status;
  }

  handeleStatus(addingchannel: any) {
    this.curAddingItem = addingchannel;
    this.popover = this.popupProvider.ionicConfirm(
      this,
      'SearchPage.confirmTitle',
      'SearchPage.des1',
      this.cancel,
      this.confirm1,
      './assets/images/tskth.svg',
    );
  }

  confirm1(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      let nodeId = that.curAddingItem['nodeId'];
      let srcfeedId = that.curAddingItem['feedId'];
      that.feedService.removeTobeAddedFeeds(nodeId, srcfeedId).then(() => {
        that.zone.run(() => {
          that.addingChanneList =
            that.feedService.getToBeAddedFeedsList() || [];
          that.searchAddingChanneList = _.cloneDeep(that.addingChanneList);
          let allChannelCollectionList = that.dataHelper.getPublishedActivePanelList();
          let channelCollectionPageList = _.filter(allChannelCollectionList, feed => {
            let feedNodeId = feed['nodeId'];
            let feedUrl = feed['url'] || feed.entry.url;
            let feedId = feedUrl.split('/')[4];
            return feedNodeId == nodeId && feedId == srcfeedId;
          });
          if (channelCollectionPageList.length > 0) {
            let feed = channelCollectionPageList[0];
            that.channelCollectionPageList.push(feed);
            that.searchChannelCollectionPageList = _.cloneDeep(that.channelCollectionPageList);
            that.refreshChannelCollectionAvatar();
            return;
          }

          let feedlist = _.filter(that.httpAllData, feed => {
            let feedNodeId = feed['nodeId'];
            let feedUrl = feed['url'];
            let feedId = feedUrl.split('/')[4];
            return feedNodeId == nodeId && feedId == srcfeedId;
          });
          if (feedlist.length > 0) {
            let feed = feedlist[0];
            that.discoverSquareList.push(feed);
          }
          that.searchSquareList = _.cloneDeep(that.discoverSquareList);
        });
      });
    }
  }

  cancel(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      let nodeId = that.curAddingItem['nodeId'];
      let feedId = that.curAddingItem['feedId'];
      let carrierAddress: string = that.curAddingItem['carrierAddress'];
      that.feedService.continueAddFeeds(nodeId, feedId, carrierAddress);
    }
  }

  async scanService() {
    let scanObj = await this.popupProvider.scan() || {};
    let scanData = scanObj["data"] || {};
    let scannedContent = scanData["scannedText"] || "";
    Logger.log(TAG, 'Scan content is', scannedContent);
    const scanResult = ScannerHelper.parseScannerResult(scannedContent);
    Logger.log(TAG, 'Parse scan result is', scanResult);

    if (!scanResult || !scanResult.feedsUrl || scanResult.code == ScannerCode.INVALID_FORMAT) {
      this.native.toastWarn('AddServerPage.tipMsg');
      return;
    }
    const feedsUrl = scanResult.feedsUrl;

    //TODO
    //Show channel info dialog
    // this.hiveVaultController.subscribeChannel(feedsUrl.destDid, feedsUrl.channelId, displayName);

    this.showSubscribePrompt(feedsUrl);
  }

  loadData(events: any) {
    this.pageNum = this.pageNum + 1;
    this.httpService
      .ajaxGet(
        ApiUrl.listPage +
        '?pageNum=' +
        this.pageNum +
        '&pageSize=' +
        this.pageSize,
        false,
      )
      .then(result => {
        if (result['code'] === 200) {
          this.totalNum = result['data']['total'];
          let arr = result['data']['result'] || [];
          if (arr.length === 0) {
            if (events != '') {
              events.target.complete();
            }
            return;
          }
          this.refreshDiscoverSquareFeedAvatar()
          this.curtotalNum = this.curtotalNum + arr.length;
          this.handleCache(arr);
          let discoverSquareList = this.dataHelper.getDiscoverfeeds();
          this.httpAllData = _.cloneDeep(discoverSquareList);
          this.discoverSquareList = this.filterdiscoverSquareList(
            discoverSquareList,
          );
        }

        if (this.curtotalNum >= this.totalNum) {
          if (events != '') {
            events.target.complete();
          }
          return;
        }
        if (this.curtotalNum < this.totalNum) {
          this.loadData(events);
        }
      })
      .catch(err => { });
  }

  async initData(events: any, isLoading: boolean = true) {
    this.isLoading = true;
    await this.getActivePanelList();
    this.channelCollectionPageList = this.filterChannelCollection();
    this.refreshChannelCollectionAvatar();
    this.httpService
      .ajaxGet(
        ApiUrl.listPage +
        '?pageNum=' +
        this.pageNum +
        '&pageSize=' +
        this.pageSize,
        isLoading,
      )
      .then(result => {
        if (result['code'] === 200) {
          this.isLoading = false;
          this.totalNum = result['data']['total'];
          let discoverSquareList = result['data']['result'] || [];
          this.refreshDiscoverSquareFeedAvatar();
          this.curtotalNum = discoverSquareList.length;
          this.handleCache(discoverSquareList);
          discoverSquareList = this.dataHelper.getDiscoverfeeds();
          this.httpAllData = _.cloneDeep(discoverSquareList);

          this.discoverSquareList = this.filterdiscoverSquareList(
            discoverSquareList,
          );
          this.searchSquareList = _.cloneDeep(this.discoverSquareList);
          if (this.curtotalNum <= this.totalNum) {
            this.loadData(events);
          }
        }
      })
      .catch(err => {
        this.isLoading = false;
        if (events != '') {
          events.target.complete();
        }
      });
  }

  clickItem(feed: any) {
    let isClick = false;
    if (isClick) {
      return;
    }
    isClick = true;
    let feedsUrlHash = feed.feedsUrlHash
    this.getAvatar(feedsUrlHash).then((result) => {
      isClick = false;
      if (result != null) {
        this.removeSubscribe();
        feed.feedsAvatar = result;
        this.native.go('discoverfeedinfo', {
          params: feed,
        });
      }
    }).catch((err) => {
      isClick = false;
    });
  }

  handleShow(feed: any) {
    let feedNodeId = feed['nodeId'];
    let feedUrl = feed['url'];
    let feedId = feedUrl.split('/')[4];
    let followFeed = _.filter(this.followedList, (item: any) => {
      return feedNodeId == item['nodeId'] && feedId == item['id'];
    });

    if (followFeed.length > 0) {
      return false;
    }

    let addingFeed = _.filter(this.addingChanneList, (item: any) => {
      return feedNodeId == item['nodeId'] && feedId == item['feedId'];
    });

    if (addingFeed.length > 0) {
      return false;
    }

    let channelCollectionPageList = _.filter(this.channelCollectionPageList, (item: FeedsData.ChannelCollections) => {
      let url = item.entry.url;
      let urlArr = url.replace("feeds://", "").split("/");
      let channelId = urlArr[2];
      return feedNodeId == item['nodeId'] && feedId == channelId;
    });

    if (channelCollectionPageList.length > 0) {
      return false;
    }

    let purpose = feed['purpose'] || '';
    if (purpose != '' && !this.developerMode) {
      return false;
    }

    return true;
  }

  filterdiscoverSquareList(discoverSquare: any) {
    this.developerMode = this.feedService.getDeveloperMode();
    this.followedList = this.feedService.getChannelsList() || [];
    this.addingChanneList = this.feedService.getToBeAddedFeedsList() || [];
    this.searchAddingChanneList = _.cloneDeep(this.addingChanneList);
    let discoverSquareList = [];
    discoverSquareList = _.filter(discoverSquare, (feed: any) => {
      return this.handleShow(feed);
    });
    this.searchSquareList = _.cloneDeep(discoverSquareList);
    return discoverSquareList;
  }

  getUnfollowedFeed() {
    let feedList = this.feedService.getChannelsList() || [];
    let unfollowedFeed = _.filter(feedList, feed => {
      return !feed['isSubscribed'];
    });
    this.searchUnfollowedFeed = _.cloneDeep(unfollowedFeed);
    return unfollowedFeed;
  }


  //TODO
  discoverSubscribe(feedInfo: any) {
    let feedUrl = feedInfo['url'];
    let feedsUrlHash = feedInfo['feedsUrlHash'];
    let followers = feedInfo['followers'];
    let feedName = feedInfo['name'];
    let desc = feedInfo['description'];
    let ownerName = feedInfo['ownerName'];
    //let avatar = this.avatarList[feedsUrlHash];
    let isClick = false;
    if (isClick) {
      return;
    }
    isClick = true;
    this.getAvatar(feedsUrlHash).then((result: any) => {
      isClick = false;
      if (result != null) {
        let avatar = result;
        this.feedService
          .addFeed(feedUrl, avatar, followers, feedName, ownerName, desc)
          .then(isSuccess => {
            if (isSuccess) {
              this.zone.run(() => {
              });
            }
          })
          .catch(err => { });
      }
    }).catch((err) => {
      isClick = false;
    });

  }

  checkFeedUrl(feedUrl: string): boolean {
    if (feedUrl == null || feedUrl == undefined || feedUrl == '') {
      return false;
    }
    if (
      feedUrl.length < 54 ||
      !feedUrl.startsWith('feeds://') ||
      !feedUrl.indexOf('did:elastos:')
    ) {
      return false;
    }

    let splitStr = feedUrl.split('/');
    if (splitStr.length != 5 || splitStr[4] == '') {
      return false;
    }
    return true;
  }

  addFeedUrl(result: string) {
    this.feedService.addFeed(result, '', 0, '', '', '').then(isSuccess => {
      if (isSuccess) {
        this.zone.run(() => {
          this.searchbar.value = '';
          this.isSearch = '';
          this.init();
        });
      }
    });
  }

  handleCache(addArr: any) {
    let discoverfeeds = this.dataHelper.getDiscoverfeeds() || [];
    _.each(addArr, (feed: any) => {
      if (this.isExitFeed(discoverfeeds, feed) === '') {
        discoverfeeds.push(feed);
      }
    });
    this.dataHelper.setDiscoverfeeds(discoverfeeds);
    this.storageService.set(
      'feed:discoverfeeds',
      JSON.stringify(discoverfeeds),
    );
  }

  isExitFeed(discoverfeeds: any, feed: any) {
    return _.find(discoverfeeds, feed) || '';
  }

  getChannelOwner(nodeId: string, channelId: string) {
    let channel = this.feedService.getChannelFromId(nodeId, channelId) || {};
    let ownerName: string = channel['owner_name'] || '';
    if (ownerName === '') {
      return 'common.obtain';
    }
    return '@' + ownerName;
  }

  getChannelDes(nodeId: string, channelId: string) {
    let channel = this.feedService.getChannelFromId(nodeId, channelId) || {};
    let channelDes: string = channel['introduction'] || '';
    if (channelDes === '') {
      return '';
    }
    return channelDes;
  }

  getAddingFeedOwner(addingchannel) {
    let ownerName = '';
    let feed = addingchannel || '';
    if (feed != '') ownerName = addingchannel['ownerName'];
    if (ownerName == '') return this.translate.instant('common.obtain');
    return '@' + ownerName;
  }

  getAddingFeedDes(addingchannel) {
    let description = '';
    let feed = addingchannel || '';
    if (feed != '') description = addingchannel['feedDes'];
    return description;
  }


  clickAddingchannel(addingchannel: any) {

    let isClick = false;
    if (isClick) {
      return;
    }
    let nodeId = addingchannel["nodeId"];
    let srcFeedId = addingchannel["feedId"];
    let feed = _.find(this.httpAllData, (item) => {
      let feedUrl = item['url'];
      let feedId = feedUrl.split('/')[4];
      return item.nodeId == nodeId && feedId == srcFeedId;
    });
    let feedsUrlHash = feed['feedsUrlHash'];
    isClick = true;
    this.getAvatar(feedsUrlHash).then((result) => {
      isClick = false;
      if (result != null) {
        this.removeSubscribe();
        feed["carrierAddress"] = addingchannel["carrierAddress"];
        feed.feedsAvatar = result;
        this.native.go('discoverfeedinfo', {
          params: feed,
        });
      }
    }).catch((err) => {
      isClick = false;
    });
  }


  ionScroll() {
    this.native.throttle(this.setDiscoverSquareFeedAvatar(), 200, this, true);
    this.native.throttle(this.setChannelCollectionAvatar(), 200, this, true);
  }

  setDiscoverSquareFeedAvatar() {
    let discoverSquareFeed = document.getElementsByClassName("discoverSquareFeed") || [];
    let len = discoverSquareFeed.length;
    for (let itemIndex = 0; itemIndex < len; itemIndex++) {
      let item = discoverSquareFeed[itemIndex];
      let feedsUrlHash = item.getAttribute("id");
      let thumbImage = document.getElementById(feedsUrlHash + '-avatar');
      let srcStr = thumbImage.getAttribute("src") || "";
      let isload = this.pasarGridisLoadimage[feedsUrlHash] || '';
      try {
        if (
          feedsUrlHash != '' &&
          thumbImage.getBoundingClientRect().top >= -100 &&
          thumbImage.getBoundingClientRect().bottom <= this.clientHeight
        ) {
          if (isload === "") {
            this.pasarGridisLoadimage[feedsUrlHash] = '12';
            let key = feedsUrlHash + "-Channel-avatar";
            this.dataHelper.loadData(key).then((result) => {
              if (result != null) {
                this.zone.run(() => {
                  this.pasarGridisLoadimage[feedsUrlHash] = '13';
                  thumbImage.setAttribute("src", result);
                });
              } else {
                let avatarUrl = ApiUrl.getAvatar + "?feedsUrlHash=" + feedsUrlHash;
                this.httpService.ajaxGet(avatarUrl, false).then((result: any) => {
                  let code = result['code'];
                  if (code === 200) {
                    let data = result['data'];
                    this.zone.run(() => {
                      this.pasarGridisLoadimage[feedsUrlHash] = '13';
                      thumbImage.setAttribute("src", data['feedsAvatar']);
                    });
                    this.dataHelper.saveData(key, data['feedsAvatar']);
                  }
                }).catch((err) => {

                });
              }
            }).catch(err => {

            })

          }
        } else {
          srcStr = thumbImage.getAttribute('src') || '';
          if (
            thumbImage.getBoundingClientRect().top < -100 &&
            this.pasarGridisLoadimage[feedsUrlHash] === '13' &&
            srcStr != './assets/icon/reserve.svg'
          ) {
            this.pasarGridisLoadimage[feedsUrlHash] = '';
            thumbImage.setAttribute('src', './assets/icon/reserve.svg');
          }
        }
      } catch (error) {
        this.pasarGridisLoadimage[feedsUrlHash] = '';
        thumbImage.setAttribute('src', './assets/icon/reserve.svg');
      }
    }
  }

  refreshDiscoverSquareFeedAvatar() {
    let sid = setTimeout(() => {
      this.pasarGridisLoadimage = {};
      this.setDiscoverSquareFeedAvatar();
      clearTimeout(sid);
    }, 100);
  }

  handleId(feed: any) {
    return feed.feedsUrlHash + "-avatar";
  }

  getAvatar(feedsUrlHash: string) {
    return new Promise((resolve, reject) => {
      let key = feedsUrlHash + "-Channel-avatar";
      this.dataHelper.loadData(key).then((result) => {
        if (result != null) {
          resolve(result);
        } else {
          let avatarUrl = ApiUrl.getAvatar + "?feedsUrlHash=" + feedsUrlHash;
          this.httpService.ajaxGet(avatarUrl, false).then((result: any) => {
            let code = result['code'];
            if (code === 200) {
              let data = result['data'];
              resolve(data['feedsAvatar']);
              this.dataHelper.saveData(key, data['feedsAvatar']);
            } else {
              resolve(null);
            }
          }).catch((err) => {
            reject(null)
          });
        }
      }).catch(err => {
        reject(null)
      })
    });
  }

  async getActivePanelList() {
    this.channelCollectionList = [];
    this.channelCollectionPageList = [];
    try {
      let result = await this.pasarAssistService.
        listGalleriaPanelsFromService(this.panelPageNum, this.panelPageSize);
      let panelsList: any;
      if (result != null) {
        panelsList = result["data"]["result"] || [];
      } else {
        panelsList = [];
      }
      while (result != null && panelsList.length > 0) {
        await this.handlePanels(panelsList);
        this.panelPageNum = this.panelPageNum + 1;
        result = await this.pasarAssistService.
          listGalleriaPanelsFromService(this.panelPageNum, this.panelPageSize);
        if (result != null) {
          panelsList = result["data"]["result"] || [];
        } else {
          panelsList = [];
        }
      }
      this.dataHelper.setPublishedActivePanelList(this.channelCollectionList);
    } catch (error) {
      this.dataHelper.setPublishedActivePanelList(this.channelCollectionList);
    }
  }

  async handlePanels(result: []) {
    for (let index = 0; index < result.length; index++) {
      let channelCollections: FeedsData.ChannelCollections = UtilService.getChannelCollections();
      let item: any = result[index];
      channelCollections.version = item.version;
      channelCollections.panelId = item.panelId;
      channelCollections.userAddr = item.user;
      channelCollections.diaBalance = await this.nftContractControllerService.getDiamond().getDiamondBalance(channelCollections.userAddr);
      channelCollections.type = item.type;
      channelCollections.tokenId = item.tokenId;
      channelCollections.name = item.name;
      channelCollections.description = item.description;
      channelCollections.avatar = item.avatar;
      channelCollections.entry = item.entry;
      channelCollections.ownerDid = item.tokenDid.did;
      let didJsON = await this.feedService.resolveDidObjectForName(channelCollections.ownerDid);
      let didName = didJsON["name"] || "";
      channelCollections.ownerName = didName;
      let url: string = channelCollections.entry.url;
      let urlArr = url.replace("feeds://", "").split("/");
      channelCollections.did = urlArr[0];
      let carrierAddress = urlArr[1];
      let nodeId = await this.carrierService.getIdFromAddress(carrierAddress, () => { });
      channelCollections.nodeId = nodeId;
      this.channelCollectionList.push(channelCollections);
    }
    this.dataHelper.setPublishedActivePanelList(this.channelCollectionList);
  }



  clickChannelCollection(channelCollections: FeedsData.ChannelCollections) {
    let avatarId = this.handleCollectionImgId(channelCollections);
    let feedsAvatar = document.getElementById(avatarId).getAttribute("src") || "";
    let newChannelCollections: any = _.cloneDeep(channelCollections);
    newChannelCollections.feedsAvatar = feedsAvatar;
    newChannelCollections.url = channelCollections.entry.url;
    this.removeSubscribe();
    this.native.go('discoverfeedinfo', {
      params: newChannelCollections,
    });
  }

  subscribeChannelCollection(channelCollections: FeedsData.ChannelCollections) {

    let feedUrl = channelCollections.entry.url;
    let followers = 0;
    let feedName = channelCollections.name;
    let desc = channelCollections.description;
    let ownerName = channelCollections.ownerName;
    //let avatarId = this.handleCollectionImgId(channelCollections);
    let avatar = channelCollections.avatar.image;
    this.feedService
      .addFeed(feedUrl, avatar, followers, feedName, ownerName, desc)
      .then(isSuccess => {
        if (isSuccess) {
          this.zone.run(() => {
          });
        }
      })
      .catch(err => { });
  }

  handleChannelCollectionId(channelCollections: FeedsData.ChannelCollections) {
    let tokenId: string = channelCollections.tokenId;
    let channelAvatar = channelCollections.avatar.image;
    let kind = channelCollections.avatar.kind;
    let channelAvatarUri = "";
    if (channelAvatar.indexOf('feeds:imgage:') > -1) {
      channelAvatarUri = channelAvatar.replace('feeds:imgage:', '');
    } else if (channelAvatar.indexOf('feeds:image:') > -1) {
      channelAvatarUri = channelAvatar.replace('feeds:image:', '');
    } else if (channelAvatar.indexOf('pasar:image:') > -1) {
      channelAvatarUri = channelAvatar.replace('pasar:image:', '');
    }
    return "serachPage-" + channelAvatarUri + "-" + kind + "-" + tokenId;
  }

  handleCollectionImgId(channelCollections: FeedsData.ChannelCollections) {
    let channelAvatar = channelCollections.avatar.image;
    let tokenId: string = channelCollections.tokenId;
    let channelCollectionAvatarId = "";
    let channelAvatarUri = "";
    if (channelAvatar.indexOf('feeds:imgage:') > -1) {
      channelAvatarUri = channelAvatar.replace('feeds:imgage:', '');
      channelCollectionAvatarId = channelAvatarUri;
    } else if (channelAvatar.indexOf('feeds:image:') > -1) {
      channelAvatarUri = channelAvatar.replace('feeds:image:', '');
    } else if (channelAvatar.indexOf('pasar:image:') > -1) {
      channelAvatarUri = channelAvatar.replace('pasar:image:', '');
    }
    channelCollectionAvatarId = "serachPage-avatar-" + channelAvatarUri + "-" + tokenId;
    return channelCollectionAvatarId;
  }

  setChannelCollectionAvatar() {
    let discoverSquareFeed = document.getElementsByClassName("channelCollectionFeeds") || [];
    let len = discoverSquareFeed.length;
    for (let itemIndex = 0; itemIndex < len; itemIndex++) {
      let item = discoverSquareFeed[itemIndex];
      let arr = item.getAttribute("id").split("-");
      let avatarUri = arr[1];
      let kind = arr[2];
      let tokenId: string = arr[3];
      let thumbImage = document.getElementById('serachPage-avatar-' + avatarUri + "-" + tokenId);
      let srcStr = thumbImage.getAttribute("src") || "";
      let isload = this.channelCollectionsAvatarisLoad[tokenId] || '';
      try {
        if (
          avatarUri != '' &&
          thumbImage.getBoundingClientRect().top >= -100 &&
          thumbImage.getBoundingClientRect().bottom <= this.clientHeight
        ) {
          if (isload === "") {
            this.channelCollectionsAvatarisLoad[tokenId] = '12';
            let fetchUrl = this.ipfsService.getNFTGetUrl() + avatarUri;
            this.fileHelperService.getNFTData(fetchUrl, avatarUri, kind).then((data) => {
              this.zone.run(() => {
                this.channelCollectionsAvatarisLoad[tokenId] = '13';
                let dataSrc = data || "";
                if (dataSrc != "") {
                  thumbImage.setAttribute("src", data);
                }
              });
            }).catch((err) => {
              if (this.channelCollectionsAvatarisLoad[tokenId] === '13') {
                this.channelCollectionsAvatarisLoad[tokenId] = '';
                thumbImage.setAttribute('src', './assets/icon/reserve.svg');
              }
            });

          }
        } else {
          srcStr = thumbImage.getAttribute('src') || '';
          if (
            thumbImage.getBoundingClientRect().top < -100 &&
            this.channelCollectionsAvatarisLoad[tokenId] === '13' &&
            srcStr != './assets/icon/reserve.svg'
          ) {
            this.channelCollectionsAvatarisLoad[tokenId] = '';
            thumbImage.setAttribute('src', './assets/icon/reserve.svg');
          }
        }
      } catch (error) {
        this.channelCollectionsAvatarisLoad[tokenId] = '';
        thumbImage.setAttribute('src', './assets/icon/reserve.svg');
      }
    }
  }

  refreshChannelCollectionAvatar() {
    let sid = setTimeout(() => {
      this.channelCollectionsAvatarisLoad = {};
      this.setChannelCollectionAvatar();
      clearTimeout(sid);
    }, 100);
  }

  async filterChannelCollection() {
    let publishedActivePanelList = this.dataHelper.getPublishedActivePanelList();
    let channelCollectionList = _.cloneDeep(publishedActivePanelList);
    let ownerDid = (await this.dataHelper.getSigninData()).did;
    let channelCollectionPageList = [];
    channelCollectionPageList = _.filter(channelCollectionList, (item: FeedsData.ChannelCollections) => {
      return item.ownerDid != ownerDid;
    });
    this.followedList = this.feedService.getChannelsList() || [];
    this.addingChanneList = this.feedService.getToBeAddedFeedsList() || [];
    this.searchAddingChanneList = _.cloneDeep(this.addingChanneList);
    channelCollectionPageList = _.filter(channelCollectionPageList, (feed: any) => {
      return this.handleChannelShow(feed);
    });
    let newChannelCollectionPageList = _.orderBy(channelCollectionPageList, ['diaBalance'], ['desc']);
    this.searchChannelCollectionPageList = _.cloneDeep(newChannelCollectionPageList);
    return newChannelCollectionPageList;
  }

  handleChannelShow(feed: any) {
    let feedNodeId = feed['nodeId'];
    let feedUrl = feed['url'] || feed.entry.url;
    let feedId = feedUrl.split('/')[4];
    let followFeed = _.filter(this.followedList, (item: any) => {
      return feedNodeId == item['nodeId'] && feedId == item['id'];
    });

    if (followFeed.length > 0) {
      return false;
    }
    let addingFeed = _.filter(this.addingChanneList, (item: any) => {
      return feedNodeId == item['nodeId'] && feedId == item['feedId'];
    });

    if (addingFeed.length > 0) {
      return false;
    }

    return true;
  }


  ////
  async showSubscribePrompt(feedsUrl: FeedsUrl) {
    //Temp
    this.displayName = (await this.dataHelper.getSigninData()).name;
    this.toBeSubscribeddestDid = feedsUrl.destDid;
    this.toBeSubscribedChannelId = feedsUrl.channelId;
    let channelName = decodeURIComponent(feedsUrl.channelName);
    this.confirmdialog = await this.popupProvider.showConfirmdialog(
      this,
      'common.confirmDialog',
      this.translate.instant('SearchPage.follow')+" "+ channelName + '?',
      this.cancelButton,
      this.okButton,
      './assets/images/finish.svg',
      'SearchPage.follow',
      "common.editedContentDes2"
    );
  }

  async cancelButton(that: any) {
    if (that.confirmdialog != null) {
      await that.confirmdialog.dismiss();
      that.confirmdialog = null;
    }
  }

  async okButton(that: any) {
    if (that.confirmdialog != null) {
      await that.confirmdialog.dismiss();
      that.confirmdialog = null;
      await that.native.showLoading("common.waitMoment");
      try {
        await that.hiveVaultController.getChannelInfoById(that.toBeSubscribeddestDid, that.toBeSubscribedChannelId);
        await that.hiveVaultController.subscribeChannel(that.toBeSubscribeddestDid, that.toBeSubscribedChannelId, that.displayName);
        that.native.hideLoading();
        that.native.toast('common.subscribeSuccess');
        that.native.setRootRouter(['/tabs/profile']);
        that.feedspage.profile();

      } catch (error) {
        that.native.hideLoading();
        that.native.toastWarn('common.subscribeFail');
      } finally {
        that.native.hideLoading();
      }
    }
  }
}
