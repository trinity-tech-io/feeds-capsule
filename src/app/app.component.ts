import { Component } from '@angular/core';
import { Platform, PopoverController, MenuController, ModalController, ActionSheetController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { FeedService, Avatar } from './services/FeedService';
import { AppService } from './services/AppService';
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { UtilService } from 'src/app/services/utilService';
import { StorageService } from './services/StorageService';
import { PopupProvider } from 'src/app/services/popup';
import { Events } from 'src/app/services/events.service';
import { LocalIdentityConnector } from '@elastosfoundation/elastos-connector-localidentity-cordova';
import { EssentialsConnector } from '@elastosfoundation/essentials-connector-cordova';
import { connectivity } from '@elastosfoundation/elastos-connectivity-sdk-cordova';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { GlobalService } from 'src/app/services/global.service';
import { Config } from './services/config';
import { Logger, LogLevel } from './services/logger';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IntentService } from './services/IntentService';
import { HttpService } from 'src/app/services/HttpService';
import { ApiUrl } from './services/ApiUrl';
import { IPFSService } from 'src/app/services/ipfs.service';
import { HiveService } from 'src/app/services/HiveService';
import { ViewHelper } from './services/viewhelper.service';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { HiveVaultApi } from 'src/app/services/hivevault_api.service';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';

let TAG: string = 'app-component';

// enum LogLevel {
//   NONE,
//   ERROR,
//   WARN,
//   INFO,
//   DEBUG,
// }
@Component({
  selector: 'my-app',
  templateUrl: 'app.html',
  styleUrls: ['app.scss'],
})
export class MyApp {
  private backButtoncount: number = 0;
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

  public isLoading: boolean = false;
  public loadingTitle: string = "";
  public loadingText: string = null;
  public loadingCurNumber: string = null;
  public loadingMaxNumber: string = null;

  constructor(
    private actionSheetController: ActionSheetController,
    private modalController: ModalController,
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
    private menuController: MenuController,
    private walletConnectControllerService: WalletConnectControllerService,
    private dataHelper: DataHelper,
    private globalService: GlobalService,
    private nftContractControllerService: NFTContractControllerService,
    private intentService: IntentService,
    private httpService: HttpService,
    private ipfsService: IPFSService,
    private hiveService: HiveService,
    private viewHelper: ViewHelper,
    private keyboard: Keyboard,
    private hiveVaultApi: HiveVaultApi,
    private hiveVaultController: HiveVaultController,
  ) {
    this.initializeApp();
    this.initProfileData();
    this.events.subscribe(FeedsEvent.PublishType.signinSuccess, async () => {
      try {
        await this.downloadEssAvatar()
        this.downloadCustomeAvatar()

        this.initProfileData();
      } catch (error) {
        Logger.error(TAG, error)
      }
    })

    this.events.subscribe(FeedsEvent.PublishType.walletConnectedRefreshPage, (walletAccount) => {
      this.updateWalletAddress(walletAccount);
    });

    this.events.subscribe(FeedsEvent.PublishType.nftLoadingUpdateText, (textObj: any) => {
      this.isLoading = textObj.isLoading;
      if (this.isLoading) {
        this.loadingTitle = textObj.loadingTitle;
        this.loadingText = textObj.loadingText;
        this.loadingCurNumber = textObj.loadingCurNumber || null;
        this.loadingMaxNumber = textObj.loadingMaxNumber || null;
      }
    });

    this.events.subscribe(FeedsEvent.PublishType.openPayPrompt, (obj) => {
      let nodeId: string = obj.nodeId;
      let channelId: number = obj.channelId;
      let elaAddress: string = obj.elaAddress;
      let amount: string = obj.amount;
      let memo: string = obj.memo;
      this.viewHelper.showPayPrompt(nodeId, channelId, elaAddress, amount, memo);
    });
  }

  initializeApp() {
    this.platform.ready()
      .then(async () => {
        return await this.dataHelper.loadApiProvider();
      })
      .then(async (api) => {
        Config.changeApi(api);
        this.feedService.initDidManager();
        this.splashScreen.hide();
        //for ios
        if (this.isIOSPlatform()) {
          this.statusBar.backgroundColorByHexString('#f8f8ff');
          this.statusBar.overlaysWebView(false);
        }

        this.theme.getTheme();
        // Must do it in ios, otherwise the titlebar and status bar will overlap.

        this.statusBar.show();

        this.platform.backButton.subscribeWithPriority(99999, async () => {
          this.backButtoncount++;
          if (this.backButtoncount === 2) {
            this.backButtoncount = 0;

            //ess登陆框
            let sveltekqf8ju = document.getElementsByClassName("svelte-kqf8ju") || [];
            if (sveltekqf8ju.length > 0) {
              sveltekqf8ju[0].click();
              return;
            }

            //nft loading
            let nftloading: HTMLElement = document.querySelector("app-nftloading") || null;
            if (nftloading != null) {
              return;
            }

            if (this.keyboard.isVisible) {
              this.keyboard.hide();
              return;
            }

            //评论框
            let comment: HTMLElement = document.querySelector("app-comment") || null;
            if (comment != null) {
              let commentMask: HTMLElement = document.getElementById("commentMask") || null;
              if (commentMask != null) {
                commentMask.click();
              }
              return;
            }
            //频道选择框 app-switchfeed
            let switchfeed: HTMLElement = document.querySelector("app-switchfeed") || null;
            if (switchfeed != null) {
              let switchfeedMask: HTMLElement = document.getElementById("switchfeedMask") || null;
              if (switchfeedMask != null) {
                switchfeedMask.click();
              }
              return;
            }

            //分享菜单了 app-sharemenu

            let sharemenu: HTMLElement = document.querySelector("app-sharemenu") || null;
            if (sharemenu != null) {
              let sharemenuMask: HTMLElement = document.getElementById("sharemenuMask") || null;
              if (sharemenuMask != null) {
                sharemenuMask.click();
              }
              return;
            }

            const menu = await this.menuController.getOpen();
            if (menu) {
              await this.menuController.close();
              return;
            }

            const actionSheet = await this.actionSheetController.getTop();
            if (actionSheet) {
              await this.actionSheetController.dismiss();
              return;
            }
            const popover = await this.popoverController.getTop();
            if (popover) {
              await this.popoverController.dismiss();
              return;
            }
            const modal = await this.modalController.getTop();
            if (modal) {
              await modal.dismiss();
              return;
            }
            this.appService.handleBack();
          }
        });


        this.initSetting();
        this.initNftFirstdisclaimer();
        this.initFeedPublicStatus();
        this.initCurrentFeed();
        this.initDiscoverfeeds();
        this.initCollectibleSetting();
        this.initWhiteList();
        this.initFeedsSortType();
        this.initHideAdult();
        this.initPublishedActivePanelList();
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
        this.initIpfs();
        this.initAssist();
        await this.initUserDidUri();
      }).then(async () => {
        this.intentService.addIntentListener(
          (intent: IntentPlugin.ReceivedIntent) => {
            this.intentService.onMessageReceived(intent);
            this.intentService.dispatchIntent(intent);
          },
        );
      });
  }

  initConnector() {
    connectivity.registerConnector(this.localIdentityConnector);
    // To let users use Essentials for his operations:
    connectivity.registerConnector(this.essentialsConnector);
    connectivity.setApplicationDID(Config.APPLICATION_DID);
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
      .catch(err => { });
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
      .catch(err => { });
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
      .catch(err => { });
  }

  initSetting() {
    this.updateElaPrice();
    this.feedService.getData("feeds:elaPrice").then((elaPrice: any) => {
      if (elaPrice === null) {
        this.setElaUsdPrice("");
      } else {
        this.setElaUsdPrice(elaPrice);
      }
    }).catch(err => { });

    this.dataHelper.loadDevelopLogMode().then((isOpenLog: boolean) => {
      if (isOpenLog)
        Logger.setLogLevel(LogLevel.DEBUG);
      else
        Logger.setLogLevel(LogLevel.WARN);
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
      .catch(err => { });

    this.feedService
      .getData('feeds.hideDeletedPosts')
      .then(status => {
        if (status === null) {
          this.feedService.setHideDeletedPosts(false);
          return;
        }
        this.feedService.setHideDeletedPosts(status);
      })
      .catch(err => { });

    this.feedService
      .getData('feeds.hideDeletedComments')
      .then(status => {
        if (status === null) {
          this.feedService.setHideDeletedComments(false);
          return;
        }
        this.feedService.setHideDeletedComments(status);
      })
      .catch(err => { });

    this.feedService
      .getData("feeds.pasarListGrid")
      .then((pasarListGrid) => {
        if (pasarListGrid === null) {
          this.feedService.setPasarListGrid(false);
          return;
        }
        this.feedService.setPasarListGrid(pasarListGrid);
      })
      .catch(err => { });
  }

  initDisclaimer() {
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

  initIpfs() {
    let ipfsBaseUrl = localStorage.getItem("selectedIpfsNetwork") || ''
    if (ipfsBaseUrl === '') {
      ipfsBaseUrl = Config.defaultIPFSApi();
      localStorage.setItem("selectedIpfsNetwork", ipfsBaseUrl);
    }

    ApiUrl.setIpfs(ipfsBaseUrl);
    this.globalService.refreshBaseNFTIPSFUrl();
  }

  initAssist() {
    // let assistBaseUrl = localStorage.getItem("selectedAssistPasarNetwork") || '';
    // if(assistBaseUrl === ""){
    //   assistBaseUrl = Config.defaultAssistApi();
    //   localStorage.setItem("selectedAssistPasarNetwork",assistBaseUrl);
    // }
    ApiUrl.setAssist(Config.ASSIST_SERVER);
    this.globalService.refreshBaseAssistUrl();
  }

  initUserDidUri() {
    return this.dataHelper.loadUserDidUriMap();
  }

  about() {
    this.native.navigateForward('/menu/about', '');
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

  async disconnectWallet() {
    await this.walletConnectControllerService.disconnect();
    await this.walletConnectControllerService.destroyWalletConnect();
    this.nftContractControllerService.init();
  }

  clearData() {
    this.feedService.signOut()
      .then(() => {
        this.events.publish(FeedsEvent.PublishType.clearHomeEvent);
        this.globalService.restartApp();
        this.native.setRootRouter('signin');
      })
      .catch(err => {
        //TODO
      });
  }

  showSignoutDialog() {
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
      error => { },
    );

    this.events.subscribe(FeedsEvent.PublishType.openRightMenuForSWM, () => {
      this.getAvatar();
    })
  }

  async getAvatar() {
    let avatar = await this.feedService.getUserAvatar(this.userDid);
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
  }

  handleImages() {

  }

  settings() {
    this.native.navigateForward('settings', '');
  }

  ionViewWillLeave() {
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = null;
    }

    this.events.unsubscribe(FeedsEvent.PublishType.walletConnectedRefreshPage);
    this.events.unsubscribe(FeedsEvent.PublishType.nftLoadingUpdateText);
    this.events.unsubscribe(FeedsEvent.PublishType.openPayPrompt);
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
      .catch(() => { });
  }

  initWhiteList() {
    this.feedService.getData("feeds.WhiteList")
      .then((whiteListData: FeedsData.WhiteItem[]) => {
        if (whiteListData === null) {
          this.feedService.setWhiteListData([]);
          this.ajaxGetWhiteList(false);
          return;
        }
        this.feedService.setWhiteListData(whiteListData);
        this.ajaxGetWhiteList(false);
      })
      .catch()
  }

  async initFeedsSortType() {
    try {
      await this.dataHelper.loadFeedsSortType();
    } catch (error) {
    }
  }

  async connectWallet() {
    await this.walletConnectControllerService.connect();
    this.updateWalletAddress(null);
  }

  updateWalletAddress(walletAccount: string) {
    if (!walletAccount)
      this.walletAddress = this.walletConnectControllerService.getAccountAddress();
    else
      this.walletAddress = walletAccount;
    this.walletAddressStr = UtilService.resolveAddress(this.walletAddress);
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
      that.events.publish(FeedsEvent.PublishType.clickDisconnectWallet);
    }
  }

  updateElaPrice() {
    setInterval(() => {
      this.setElaUsdPrice("");
    }, 60000 * 10);
  }

  setElaUsdPrice(caceElaPrice: any) {
    this.httpService.getElaPrice().then((elaPrice: any) => {
      if (elaPrice != null) {
        this.feedService.setElaUsdPrice(elaPrice);
        this.feedService.setData("feeds:elaPrice", elaPrice);
      }
    }).catch(() => {
      if (caceElaPrice != "") {
        this.feedService.setElaUsdPrice(caceElaPrice);
        this.feedService.setData("feeds:elaPrice", caceElaPrice);
      }
    });
  }

  initNftFirstdisclaimer() {
    this.feedService
      .getData("feeds:nftFirstdisclaimer")
      .then((nftFirstdisclaimer: any) => {
        if (nftFirstdisclaimer === null) {
          this.feedService.setNftFirstdisclaimer("");
        } else {
          this.feedService.setNftFirstdisclaimer(nftFirstdisclaimer);
        }
      }).catch(() => {

      })
  }

  initHideAdult() {
    this.dataHelper.loadData('feeds.hideAdult').then((isShowAdult) => {
      if (isShowAdult === null) {
        this.dataHelper.changeAdultStatus(true);
        return;
      }
      this.dataHelper.changeAdultStatus(isShowAdult);
    }).catch((err) => {

    });
  }

  initPublishedActivePanelList() {
    this.dataHelper.loadData('feeds.published.activePanel.list').then((publishedActivePanelList) => {
      if (publishedActivePanelList === null) {
        this.dataHelper.setPublishedActivePanelList([]);
        return;
      }
      this.dataHelper.setPublishedActivePanelList(publishedActivePanelList);
    }).catch((err) => {

    });
  }

  ajaxGetWhiteList(isLoading: boolean) {
    this.httpService.ajaxGet(ApiUrl.getWhiteList, isLoading).then((result: any) => {
      if (result.code === 200) {
        const whiteListData = result.data || [];
        this.feedService.setWhiteListData(whiteListData);
        this.feedService.setData("feeds.WhiteList", whiteListData);
      }
    }).catch((err) => {

    });
  }

  async downloadCustomeAvatar() {
    await this.hiveVaultController.downloadCustomeAvatar("custome")
  }
  async downloadEssAvatar() {
    await this.hiveVaultController.downloadEssAvatar()
  }

}