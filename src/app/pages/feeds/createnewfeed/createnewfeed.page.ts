import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { NavController, PopoverController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from '@ngx-translate/core';
import { TipdialogComponent } from '../../../components/tipdialog/tipdialog.component';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { PopupProvider } from 'src/app/services/popup';
import { LanguageService } from 'src/app/services/language.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { HiveService } from 'src/app/services/HiveService'
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service'

@Component({
  selector: 'app-createnewfeed',
  templateUrl: './createnewfeed.page.html',
  styleUrls: ['./createnewfeed.page.scss'],
})
export class CreatenewfeedPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public namelen = 0;
  public len = 0;
  public connectionStatus = 1;
  public channelAvatar = '';
  public avatar = '';
  public curFeedPublicStatus: boolean = true;
  public developerMode: boolean = false;
  public isHelp: boolean = false;
  public arrowBoxStyle: any = { top: '0px' };
  public curLang: string = '';
  public tippingAddress: string = '';
  constructor(
    private popover: PopoverController,
    private navCtrl: NavController,
    private feedService: FeedService,
    private popoverController: PopoverController,
    private zone: NgZone,
    private events: Events,
    private native: NativeService,
    public theme: ThemeService,
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private popup: PopupProvider,
    private languageService: LanguageService,
    private ipfsService: IPFSService,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController,
    private popupProvider: PopupProvider

  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
    this.curLang = this.languageService.getCurLang();
    this.developerMode = this.feedService.getDeveloperMode();
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.channelAvatar = this.feedService.getProfileIamge();
    this.avatar = this.feedService.parseChannelAvatar(this.channelAvatar);
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

    this.events.subscribe(FeedsEvent.PublishType.tipdialogCancel, () => {
      this.popover.dismiss();
    });

    this.events.subscribe(
      FeedsEvent.PublishType.tipdialogConfirm,
      (tipdialogData: FeedsEvent.TipDialogData) => {
        let name = tipdialogData.name;
        let desc = tipdialogData.desc;
        this.popover.dismiss();
        this.native
          .showLoading('common.waitMoment', isDismiss => {
            if (isDismiss) {
              this.showTimeOutErrorAlert();
            }
          })
          .then(() => {
            this.uploadChannel(name, desc)
            // carrirer 发送创建频道
            // this.feedService.createTopic(
            //   this.selectedServer.nodeId,
            //   name,
            //   desc,
            //   this.channelAvatar,
            // );
          })
          .catch(() => {
            this.native.hideLoading();
          });
      },
    );

    this.events.subscribe(FeedsEvent.PublishType.connectionChanged, status => {
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe(
      FeedsEvent.PublishType.createTopicSuccess,
      (createTopicSuccessData: FeedsEvent.CreateTopicSuccessData) => {
        this.zone.run(() => {
          console.log("FeedsEvent.PublishType.createTopicSuccess112");
          let nodeId = createTopicSuccessData.nodeId;
          let channelId = createTopicSuccessData.channelId;
          this.native.hideLoading();
          this.navCtrl.pop().then(() => {
            this.publicFeeds(nodeId, channelId);
          });
        });
      },
    );

    this.feedService.checkBindingServerVersion(() => {
      this.zone.run(() => {
        this.navCtrl.pop().then(() => {
          this.feedService.hideAlertPopover();
        });
      });
    });
  }

  showTimeOutErrorAlert() {
    this.popup.ionicAlert1(
      'common.error',
      'common.transMsgTimeout',
      'common.ok',
    );
  }

  mintChannel(nodeId: string, channelId: number) {
    this.native.navigateForward(['/galleriachannel'], { queryParams: { "nodeId": nodeId, "channelId": channelId } });
  }

  ionViewDidEnter() { }

  ionViewWillLeave() {
    this.events.unsubscribe(FeedsEvent.PublishType.tipdialogCancel);
    this.events.unsubscribe(FeedsEvent.PublishType.tipdialogConfirm);
    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.createTopicSuccess);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestError);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcResponseError);
    this.events.publish(FeedsEvent.PublishType.addRpcRequestError);
    this.events.publish(FeedsEvent.PublishType.addRpcResponseError);
    this.events.publish(FeedsEvent.PublishType.addConnectionChanged);
    this.events.publish(FeedsEvent.PublishType.addProflieEvent);
    this.native.hideLoading();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('CreatenewfeedPage.createNewFeed'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }
  // 创建频道
  async createChannel(name: HTMLInputElement, desc: HTMLInputElement) {
    // if (this.feedService.getConnectionStatus() != 0) {
    //   this.native.toastWarn('common.connectionError');
    //   return;
    // }

    // let feedList = this.feedService.getMyChannelList() || [];

    // if (feedList.length >= 5) {
    //   this.native.toastWarn('CreatenewfeedPage.feedMaxNumber');
    //   return;
    // }

   await this.processCreateChannel(name, desc);
  }

  async processCreateChannel(name: HTMLInputElement, desc: HTMLInputElement) {
    let nameValue = name.value || '';
    nameValue = this.native.iGetInnerText(nameValue);
    if (nameValue == '') {
      this.native.toast_trans('CreatenewfeedPage.tipMsg1');
      return;
    }

    if (name.value.length > 32) {
      this.native.toast_trans('CreatenewfeedPage.tipMsgLength1');
      return;
    }

    let descValue = desc.value || '';
    descValue = this.native.iGetInnerText(descValue);
    if (descValue == '') {
      this.native.toast_trans('CreatenewfeedPage.tipMsg2');
      return;
    }

    if (desc.value.length > 128) {
      this.native.toast_trans('CreatenewfeedPage.tipMsgLength');
      return;
    }

    this.channelAvatar = this.feedService.getProfileIamge() || '';

    // if (this.channelAvatar == '') {
    //   this.native.toast_trans('CreatenewfeedPage.tipMsg');
    //   return;
    // }

    this.avatar = this.feedService.parseChannelAvatar(this.channelAvatar);

    let checkRes = this.feedService.checkValueValid(name.value);
    if (checkRes) {
      this.native.toast_trans('CreatenewfeedPage.nameContainInvalidChars');
      return;
    }

    await this.uploadChannel(name.value, desc.value);
  }

  async uploadChannel(name: string, desc: string) {
    try {
      await this.native.showLoading('common.waitMoment');
      // 创建channles（用来存储userid下的所有创建的频道info）
      const signinData = await this.dataHelper.getSigninData();
      let userDid = signinData.did
      let userDisplayName = signinData.name;
      await this.hiveVaultController.createCollectionAndRregisteScript(userDid)
      let tippingAddress = this.tippingAddress || '';
      const channelId = await this.hiveVaultController.createChannel(name, desc, this.avatar, tippingAddress)
      await this.hiveVaultController.subscribeChannel(userDid, channelId, userDisplayName);

      this.native.hideLoading()
      this.native.pop()
    } catch (error) {
      const signinData = await this.dataHelper.getSigninData();
      let userDid = signinData.did
      localStorage.setItem(userDid + HiveService.CREATEALLCollECTION, "true")
      this.native.hideLoading();
      console.log("create channel error =========", JSON.stringify(error))
      this.native.toast('CreatenewfeedPage.alreadyExist'); // 需要更改错误提示
    }
  }

  profileimage() {
    this.native.navigateForward(['/profileimage'], '');
  }

  async createDialog(name: string, des: string) {
    let popover = await this.popoverController.create({
      mode: 'ios',
      cssClass: 'genericPopup',
      component: TipdialogComponent,
      componentProps: {
        // did: this.selectedServer.did,
        name: name,
        des: des,
        feedPublicStatus: this.curFeedPublicStatus,
        developerMode: this.developerMode,
      },
    });
    popover.onWillDismiss().then(() => {
      popover = null;
    });

    return await popover.present();
  }

  clickPublicFeeds() {
    this.zone.run(() => {
      this.curFeedPublicStatus = !this.curFeedPublicStatus;
    });
  }

  publicFeeds(nodeId: string, feedId: number) {
    if (!this.curFeedPublicStatus) {
      return;
    }

    this.mintChannel(nodeId, feedId);
  }

  help(event: any) {
    let e = event || window.event; //兼容IE8
    let target = e.target || e.srcElement; //判断目标事件
    let boundingClientRect = target.getBoundingClientRect();
    this.arrowBoxStyle['top'] = boundingClientRect.top - 16.5 + 'px';
    this.isHelp = !this.isHelp;
  }

  handleAvatar() {
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

 async scanWalletAddress(){
    let scanObj =  await this.popupProvider.scan() || {};
    let scanData = scanObj["data"] || {};
     let scannedContent = scanData["scannedText"] || "";
     if(scannedContent === ''){
       this.tippingAddress = "";
       return;
     }
     if (scannedContent.indexOf('ethereum:') > -1) {
       this.tippingAddress  = scannedContent.replace('ethereum:', '');
     }else if (scannedContent.indexOf('elastos:') > -1) {
       this.tippingAddress  = scannedContent.replace('elastos:', '');
     }else{
       this.tippingAddress  = scannedContent;
     }
  }
}
