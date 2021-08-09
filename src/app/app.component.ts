import { Component } from '@angular/core';
import { Platform, PopoverController, MenuController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { FeedService, Avatar } from './services/FeedService';
import { AppService } from './services/AppService';
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { UtilService } from 'src/app/services/utilService';
import { StorageService } from './services/StorageService';
import { PopupProvider } from 'src/app/services/popup';
import { LogUtils } from 'src/app/services/LogUtils';
import { Events } from 'src/app/services/events.service';
import { LocalIdentityConnector } from '@elastosfoundation/elastos-connector-localidentity-cordova';
import { EssentialsConnector } from '@elastosfoundation/essentials-connector-cordova';
import { connectivity } from '@elastosfoundation/elastos-connectivity-sdk-cordova';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { IPFSService } from 'src/app/services/ipfs.service';
import { NFTContractParsarService } from 'src/app/services/nftcontract_parsar.service';
import { NFTContractStickerService } from 'src/app/services/nftcontract_sticker.service';
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';
import { GlobalService } from 'src/app/services/global.service';
import { Config } from './services/config';

enum LogLevel {
  NONE,
  ERROR,
  WARN,
  INFO,
  DEBUG,
}
@Component({
  selector: 'my-app',
  templateUrl: 'app.html',
  styleUrls: ['app.scss'],
})
export class MyApp {
  public name: string = '';
  public avatar: string = '';
  public wName: string = '';
  public popover: any = null;
  public sService: any = null;
  private userDid: string = '';
  private localIdentityConnector = new LocalIdentityConnector();
  private essentialsConnector = new EssentialsConnector();
  public walletAddress: string = '';
  public walletAddressStr: string = '';
  constructor(
    private events: Events,
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private feedService: FeedService,
    private appService: AppService,
    public theme: ThemeService,
    public native: NativeService,
    public storageService: StorageService,
    public popupProvider: PopupProvider,
    private popoverController: PopoverController,
    private logUtils: LogUtils,
    private menuController: MenuController,
    private walletConnectControllerService: WalletConnectControllerService,
    private dataHelper: DataHelper,
    private ipfsService: IPFSService,
    private nftContractParsarService: NFTContractParsarService,
    private nftContractStickerService: NFTContractStickerService,
    private nftPersistenceHelper: NFTPersistenceHelper,
    private globalService: GlobalService
  ) {
    this.initializeApp();
    this.initProfileData();
    this.events.subscribe(FeedsEvent.PublishType.signinSuccess, () => {
      this.initProfileData();
    });

    this.events.subscribe(
      FeedsEvent.PublishType.walletConnectedRefreshSM,
      () => {
        this.updateWalletAddress();
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.walletDisconnectedRefreshSM,
      () => {
        this.updateWalletAddress();
      },
    );
    // this.dataHelper.loadWalletAccountAddress().then((address)=>{
    //   console.log("accountAddress",address);
    //   this.walletAddress = address;
    //   this.walletAddressStr = UtilService.resolveAddress(address);
    // });
  }

  initializeApp() {
    this.platform.ready()
      .then(() => {
        return this.dataHelper.loadApiProvider()
      })
      .then((api) => {
        Config.changeApi(api);
        this.feedService.initDidManager();
        this.splashScreen.hide();
        //for ios
        if (this.isIOSPlatform()) {
          this.statusBar.backgroundColorByHexString('#f8f8ff');
          this.statusBar.styleDefault();
        }

        this.platform.backButton.subscribeWithPriority(9999, () => {
          this.appService.handleBack();
        });
        this.statusBar.show();

        this.initSetting();
        this.initFeedPublicStatus();
        this.initCurrentFeed();
        this.initDiscoverfeeds();
        this.initCollectibleSetting();
        // this.initFeedNftPasarList();
        // this.initNftOwnCollectiblesList();
        // this.native.networkInfoInit();
        this.native.addNetworkListener(
          () => {
            this.events.publish(FeedsEvent.PublishType.networkStatusChanged, 1);
          },
          () => {
            this.events.publish(FeedsEvent.PublishType.networkStatusChanged, 0);
          },
        );
        this.initDisclaimer();
        this.initConnector();
    });
  }

  initConnector() {
    connectivity.registerConnector(this.localIdentityConnector);
    // To let users use Essentials for his operations:
    connectivity.registerConnector(this.essentialsConnector);
    connectivity.setApplicationDID(
      'did:elastos:iqtWRVjz7gsYhyuQEb1hYNNmWQt1Z9geXg',
    );
  }

  initDiscoverfeeds() {
    this.feedService
      .getData('feed:discoverfeeds')
      .then(discoverfeeds => {
        if (discoverfeeds === null) {
          this.feedService.setDiscoverfeeds([]);
          return;
        }
        this.feedService.setDiscoverfeeds(JSON.parse(discoverfeeds));
      })
      .catch(err => {});
  }

  initCurrentFeed() {
    this.feedService
      .getData('feeds.currentFeed')
      .then(currentFeed => {
        if (currentFeed === null) {
          this.feedService.setCurrentFeed(null);
          return;
        }
        this.feedService.setCurrentFeed(JSON.parse(currentFeed));
      })
      .catch(err => {});
  }

  initFeedPublicStatus() {
    this.feedService
      .getData('feeds.feedPublicStatus')
      .then(feedPublicStatus => {
        if (feedPublicStatus === null) {
          this.feedService.setFeedPublicStatus({});
          return;
        }
        this.feedService.setFeedPublicStatus(JSON.parse(feedPublicStatus));
      })
      .catch(err => {});
  }

  initSetting() {


    this.dataHelper.loadDevelopLogMode().then((isOpenLog: boolean) => {
      if (isOpenLog)
        this.logUtils.setLogLevel(LogLevel.DEBUG);
      else
        this.logUtils.setLogLevel(LogLevel.WARN);
    });
    this.dataHelper.loadDevelopNet().then((net: string) => {
      this.globalService.changeNet(net);
    });

    this.feedService
      .getData('feeds.developerMode')
      .then(status => {
        if (status === null) {
          this.feedService.setDeveloperMode(false);
          return;
        }
        this.feedService.setDeveloperMode(status);
      })
      .catch(err => {});

    this.feedService
      .getData('feeds.hideDeletedPosts')
      .then(status => {
        if (status === null) {
          this.feedService.setHideDeletedPosts(false);
          return;
        }
        this.feedService.setHideDeletedPosts(status);
      })
      .catch(err => {});

    this.feedService
      .getData('feeds.hideDeletedComments')
      .then(status => {
        if (status === null) {
          this.feedService.setHideDeletedComments(false);
          return;
        }
        this.feedService.setHideDeletedComments(status);
      })
      .catch(err => {});

    // this.feedService.getData("feeds.hideOfflineFeeds").then((status)=>{
    //   if(status === null){
    //     this.feedService.setHideOfflineFeeds(true);
    //     return;
    //   }
    //   this.feedService.setHideOfflineFeeds(status);
    // }).catch((err)=>{

    // });
  }

  initDisclaimer() {
    //localStorage.setItem('org.elastos.dapp.feeds.disclaimer',"");
    //localStorage.setItem('org.elastos.dapp.feeds.first',"");

    this.splashScreen.hide();
    this.appService.initTranslateConfig();
    this.appService.init();
    let isDisclaimer =
      localStorage.getItem('org.elastos.dapp.feeds.disclaimer') || '';
    if (isDisclaimer === '') {
      this.native.setRootRouter('disclaimer');
      return;
    }

    let isLearnMore =
      localStorage.getItem('org.elastos.dapp.feeds.isLearnMore') || '';
    if (isLearnMore === '') {
      this.native.navigateForward('learnmore', {});
      return;
    }

    this.appService.initializeApp();
  }

  goToFeedSource() {
    this.handleJump();
  }

  // goToDev(){
  //   this.native.navigateForward('menu/develop',"");
  // }

  about() {
    this.native.navigateForward('/menu/about', '');
  }

  checkIsShowDonation() {
    let isShowButton = true;
    if (this.platform.is('ios')) isShowButton = false;

    return isShowButton;
  }

  donation() {
    this.native.navigateForward('/menu/donation', '');
  }

  cancel(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  confirm(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
    that.clearData();
    that.disconnectWallet();
  }

  disconnectWallet() {
    this.walletConnectControllerService.disconnect();
  }

  clearData() {
    this.feedService
      .signOut()
      .then(() => {
        this.events.publish(FeedsEvent.PublishType.clearHomeEvent);
        this.native.setRootRouter('signin');
        this.native.toast('app.des');
      })
      .catch(err => {
        //TODO
      });
  }

  signout() {
    this.popover = this.popupProvider.ionicConfirm(
      this,
      'ConfirmdialogComponent.signoutTitle',
      'ConfirmdialogComponent.signoutMessage',
      this.cancel,
      this.confirm,
      './assets/images/signout.svg',
    );
  }

  initProfileData() {
    this.feedService.initSignInDataAsync(
      signInData => {
        if (signInData == null || signInData == undefined) return;
        this.wName = signInData.nickname || signInData.name || '';
        this.userDid = signInData.did || "";
        this.name = UtilService.moreNanme(this.wName, 15);
      },
      error => {},
    );

    this.events.subscribe(FeedsEvent.PublishType.openRightMenuForSWM, () => {
      this.getAvatar();
    })
  }

  async getAvatar() {
    this.avatar = await this.feedService.getUserAvatar(this.userDid);
  }

  handleImages() {
    return this.avatar;
  }

  settings() {
    this.native.navigateForward('settings', '');
  }

  handleJump() {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }
    let bindingServer = this.feedService.getBindingServer() || null;
    if (bindingServer === null) {
      this.native.navigateForward(['/bindservice/scanqrcode'], '');
    } else {
      this.native.navigateForward(['/menu/servers/server-info'], '');
    }
  }

  ionViewWillLeave() {
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = null;
    }
  }

  profiledetail() {
    this.menuController.close();
    this.native.navigateForward('/menu/profiledetail', '');
  }

  public isIOSPlatform(): boolean {
    if (this.platform.is('ios')) {
      return true;
    }
    return false;
  }

  initCollectibleSetting() {
    this.feedService
      .getData('feeds.collectible.setting')
      .then(collectibleSetting => {
        if (collectibleSetting === null) {
          this.feedService.setCollectibleStatus({});
          return;
        }
        this.feedService.setCollectibleStatus(JSON.parse(collectibleSetting));
      })
      .catch(() => {});
  }

  // initFeedNftPasarList() {
  //   this.feedService
  //     .getData('feed.nft.pasarList')
  //     .then(nftPasarList => {
  //       if (nftPasarList === null) {
  //         this.feedService.setPasarList([]);
  //         return;
  //       }

  //       console.log(
  //         '=======nftPasarList======' + nftPasarList,
  //       );
  //       this.feedService.setPasarList(JSON.parse(nftPasarList));
  //     })
  //     .catch(() => {});
  // }

  // initNftOwnCollectiblesList() {
  //   this.feedService
  //     .getData('feed.nft.own.collectibles.list')
  //     .then(nftOwnCollectiblesList => {
  //       console.log(
  //         '=======NftOwnCollectiblesList======' + nftOwnCollectiblesList,
  //       );
  //       if (
  //         nftOwnCollectiblesList === null ||
  //         nftOwnCollectiblesList === '[]'
  //       ) {
  //         this.feedService.setOwnNftCollectiblesList({});
  //         return;
  //       }
  //       this.feedService.setOwnNftCollectiblesList(
  //         JSON.parse(nftOwnCollectiblesList),
  //       );
  //     })
  //     .catch(() => {});
  // }

  async connectWallet() {
    await this.walletConnectControllerService.connect();
    this.updateWalletAddress();
  }

  updateWalletAddress() {
    this.walletAddress = this.walletConnectControllerService.getAccountAddress();
    this.walletAddressStr = UtilService.resolveAddress(this.walletAddress);
  }

  copyWalletAddr() {
    this.native
      .copyClipboard(this.walletAddress)
      .then(() => {
        this.native.toast_trans('common.textcopied');
      })
      .catch(() => {});
  }

  clickWalletAddr() {
    this.walletDialog();
  }

  walletDialog() {
    this.popover = this.popupProvider.ionicConfirm(
      this,
      'common.confirm',
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
      this.walletAddress = '';
      this.walletAddressStr = '';
    }
  }
}
