import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Platform, ActionSheetController } from '@ionic/angular';
import { FeedService, Avatar } from '../../../../services/FeedService';
import { NativeService } from '../../../../services/NativeService';
import { ThemeService } from '../../../../services/theme.service';
import { CarrierService } from '../../../../services/CarrierService';
import { AppService } from '../../../../services/AppService';
import { StorageService } from '../../../../services/StorageService';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { PopoverController } from '@ionic/angular';
import { IntentService } from 'src/app/services/IntentService';
import { IPFSService } from 'src/app/services/ipfs.service';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';
import { DataHelper } from 'src/app/services/DataHelper';

type ProfileDetail = {
  type: string;
  details: string;
};

@Component({
  selector: 'app-profiledetail',
  templateUrl: './profiledetail.page.html',
  styleUrls: ['./profiledetail.page.scss'],
})
export class ProfiledetailPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public developerMode: boolean = false;
  public avatar: string = '';
  public name = '';
  public description = '';
  public did = '';
  public gender = '';
  public telephone = '';
  public email = '';
  public location = '';
  public profileDetails: ProfileDetail[] = [];

  public isShowPublisherAccount: boolean = false;
  public isShowQrcode: boolean = true;
  public serverStatus: number = 1;
  public clientNumber: number = 0;
  public nodeId: string = '';
  public serverDetails: any[] = [];
  public isPress: boolean = false;
  public didString: string = '';
  public serverName: string = '';
  public owner: string = '';
  public introduction: string = null;
  public feedsUrl: string = null;
  public elaAddress: string = '';
  public actionSheet: any = null;
  public walletAddress: string = null;
  constructor(
    private actionSheetController: ActionSheetController,
    private zone: NgZone,
    private native: NativeService,
    private feedService: FeedService,
    private translate: TranslateService,
    public theme: ThemeService,
    private events: Events,
    private carrierService: CarrierService,
    private appService: AppService,
    private platform: Platform,
    private storageService: StorageService,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper,
    private nftContractControllerService: NFTContractControllerService,
    private popoverController: PopoverController,
    private intentService: IntentService,
    private ipfsService: IPFSService,
    private feedsServiceApi: FeedsServiceApi,
    private dataHelper: DataHelper
  ) { }

  ngOnInit() { }

  collectData() {
    this.profileDetails = [];
    this.profileDetails.push({
      type: 'ProfiledetailPage.name',
      details: this.name,
    });

    this.profileDetails.push({
      type: 'ProfiledetailPage.did',
      details: this.did,
    });

    if (this.developerMode) {
      let carrierUserId = this.carrierService.getNodeId();
      this.profileDetails.push({
        type: 'NodeId',
        details: carrierUserId,
      });
    }

    if (
      this.telephone != '还未设置' &&
      this.telephone != 'Not set yet' &&
      this.telephone != ''
    ) {
      this.profileDetails.push({
        type: 'ProfiledetailPage.telephone',
        details: this.telephone,
      });
    }

    if (
      this.email != '还未设置' &&
      this.email != 'Not set yet' &&
      this.email != ''
    ) {
      this.profileDetails.push({
        type: 'ProfiledetailPage.email',
        details: this.email,
      });
    }

    if (
      this.location != '还未设置' &&
      this.location != 'Not set yet' &&
      this.location != ''
    ) {
      this.profileDetails.push({
        type: 'ProfiledetailPage.location',
        details: this.location,
      });
    }
  }

  async ionViewWillEnter() {
    this.walletAddress =
      this.nftContractControllerService.getAccountAddress() || '';
    this.developerMode = this.feedService.getDeveloperMode();
    this.initTitle();

    let signInData = await this.dataHelper.getSigninData();
    this.name = signInData['nickname'] || signInData['name'] || '';
    this.description = signInData['description'] || '';
    this.did = this.feedService.rmDIDPrefix(signInData['did'] || '');
    this.telephone = signInData['telephone'] || '';
    this.email = signInData['email'] || '';
    this.location = signInData['location'] || '';
    this.avatar = await this.feedService.getUserAvatar(this.did);
    this.collectData();

    this.initData();

    this.events.subscribe(
      FeedsEvent.PublishType.serverConnectionChanged,
      () => {
        this.zone.run(() => {
          if (this.nodeId != "") {
            this.serverStatus = this.feedService.getServerStatusFromId(
              this.nodeId,
            );
          }
        });
      },
    );

    this.events.subscribe(FeedsEvent.PublishType.removeFeedSourceFinish, () => {
      this.native.hideLoading();
    });
  }

  ionViewDidEnter() { }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('ProfiledetailPage.profileDetails'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewWillUnload() { }

  ionViewWillLeave() {
    this.events.unsubscribe(FeedsEvent.PublishType.serverConnectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.removeFeedSourceFinish);
    this.native.handleTabsEvents();
  }

  handleImages() {
    let imgUri = "";
    if (this.avatar.indexOf('feeds:imgage:') > -1) {
      imgUri = this.avatar.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    } else if (this.avatar.indexOf('feeds:image:') > -1) {
      imgUri = this.avatar.replace('feeds:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    } else if (this.avatar.indexOf('pasar:image:') > -1) {
      imgUri = this.avatar.replace('pasar:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }
    else {
      imgUri = this.avatar;
    }
    return imgUri;
  }

  copytext(text: any) {
    let textdata = text || '';
    if (textdata != '') {
      this.native
        .copyClipboard(text)
        .then(() => {
          this.native.toast_trans('common.textcopied');
        })
        .catch(() => { });
    }
  }

  initData() {
    let bindingServer = this.feedService.getBindingServer() || null;
    let nodeId = "";
    let did = "";
    if (bindingServer === null) {
      this.isShowPublisherAccount = false;
    } else {
      this.isShowPublisherAccount = true;
      nodeId = bindingServer.nodeId || "";
      this.nodeId = bindingServer.nodeId || "";
      did = bindingServer.did || "";
    }

    this.isShowQrcode = false;

    if (did != "") {
      this.feedService.checkDIDOnSideChain(did, isOnSideChain => {
        this.zone.run(() => {
          this.isShowQrcode = isOnSideChain;
          if (!this.isShowQrcode) {
            this.native.toastWarn('common.waitOnChain');
          }
        });
      });
    }

    if (nodeId != "") {
      this.serverStatus = this.feedService.getServerStatusFromId(nodeId);
      this.clientNumber = this.feedService.getServerStatisticsNumber(nodeId);
      let server = this.feedsServiceApi.getServerbyNodeId(nodeId) || null;
      this.didString = server.did;
      this.serverName =
        server.name ||
        this.translate.instant('DIDdata.NotprovidedfromDIDDocument');
      this.owner = server.owner;
      this.introduction = server.introduction;
      this.feedsUrl = server.feedsUrl || null;
      this.elaAddress = server.elaAddress || '';
      this.collectServerData(server);
    }



  }

  collectServerData(bindingServer: any) {
    this.serverDetails = [];

    this.serverDetails.push({
      type: 'ServerInfoPage.name',
      details:
        bindingServer.name ||
        this.translate.instant('DIDdata.NotprovidedfromDIDDocument'),
    });

    this.serverDetails.push({
      type: 'ServerInfoPage.owner',
      details: bindingServer.owner || '',
    });

    if (this.developerMode) {
      this.serverDetails.push({
        type: 'NodeId',
        details: bindingServer.nodeId || '',
      });
    }

    this.serverDetails.push({
      type: 'ServerInfoPage.introduction',
      details: bindingServer.introduction || '',
    });

    if (this.developerMode) {
      let version = this.feedService.getServerVersionByNodeId(
        bindingServer.nodeId,
      );
      if (version != '') {
        this.serverDetails.push({
          type: 'ServerInfoPage.version',
          details: version || '<1.3.0(Outdated)',
        });
      }
    }

    this.serverDetails.push({
      type: 'ServerInfoPage.elaaddress',
      details:
        bindingServer.elaAddress ||
        this.translate.instant('DIDdata.Notprovided'),
    });

    if (this.developerMode) {
      this.serverDetails.push({
        type: 'ServerInfoPage.did',
        details: this.feedService.rmDIDPrefix(bindingServer.did),
      });
    }

    this.serverDetails.push({
      type: 'ServerInfoPage.feedsSourceQRCode',
      details: bindingServer.feedsUrl || '',
      qrcode: true,
    });
  }

  showPreviewQrcode(feedsUrl: string) {
    if (this.isPress) {
      this.isPress = false;
      return;
    }
    this.viewHelper.showPreviewQrcode(
      this.titleBar,
      feedsUrl,
      'common.qRcodePreview',
      'ProfiledetailPage.profileDetails',
      'profileDetails',
      this.appService,
    );
  }

  menuMore(feedsUrl: string) {
    if (this.platform.is('ios')) {
      this.isPress = true;
    }
    //@Deprecated
    this.intentService.share('', feedsUrl);
  }

  async deleteFeedSource() {

    this.actionSheet = await this.actionSheetController.create({
      cssClass: 'editPost',
      buttons: [
        {
          text: this.translate.instant('ServerInfoPage.DeletethisFeedSource'),
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.native
              .showLoading('common.waitMoment', isDismiss => { })
              .then(() => {
                this.feedService.deleteFeedSource(this.nodeId).then(() => {
                  this.native.toast('ServerInfoPage.removeserver');
                  this.isShowPublisherAccount = false;
                  this.native.hideLoading();
                  this.dataHelper.setCurrentChannel(null);
                  this.storageService.remove('feeds.currentChannel');
                  this.native.hideLoading();
                  this.events.publish(FeedsEvent.PublishType.updateTab);
                });
              })
              .catch(() => {
                this.native.hideLoading();
              });
          },
        },
        {
          text: this.translate.instant('ServerInfoPage.cancel'),
          role: 'cancel',
          icon: 'close-circle',
          handler: () => { },
        },
      ],
    });

    this.actionSheet.onWillDismiss().then(() => {
      if (this.actionSheet != null) {
        this.actionSheet = null;
      }
    });

    await this.actionSheet.present();
  }

  clickEdit() {
    if (!this.isShowQrcode) {
      this.native.toastWarn('common.waitOnChain');
      return;
    }

    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
    this.native.toastWarn('common.connectionError');
    return;
    }

    if (this.feedService.getServerStatusFromId(this.nodeId) !== 0) {
      this.native.toastWarn('common.connectionError1');
      return;
    }

    this.native.navigateForward(['editserverinfo'], {
      queryParams: {
        name: this.name,
        introduction: this.introduction,
        elaAddress: this.elaAddress,
        nodeId: this.nodeId,
        did: this.didString,
      },
    });
  }

  clickCollections() {
    this.native.navigateForward(['collections'], {
      queryParams: { nodeId: this.nodeId, channelId: 12 },
    });
  }

  editProfile() {
    this.native.navigateForward(['editprofileimage'], {});
  }

}
