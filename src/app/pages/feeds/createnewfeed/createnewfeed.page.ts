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
import { UtilService } from 'src/app/services/utilService';
import _ from 'lodash';
import SparkMD5 from 'spark-md5';

@Component({
  selector: 'app-createnewfeed',
  templateUrl: './createnewfeed.page.html',
  styleUrls: ['./createnewfeed.page.scss'],
})
export class CreatenewfeedPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public namelen = 0;
  public len = 0;
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
    this.developerMode = this.dataHelper.getDeveloperMode();
    this.channelAvatar = this.dataHelper.getProfileIamge();
    this.avatar = this.feedService.parseChannelAvatar(this.channelAvatar);
  }

  mintChannel(nodeId: string, channelId: number) {
    this.native.navigateForward(['/galleriachannel'], { queryParams: { "nodeId": nodeId, "channelId": channelId } });
  }

  ionViewDidEnter() { }

  ionViewWillLeave() {
    this.native.hideLoading();
    this.native.handleTabsEvents();
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

    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

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

    this.channelAvatar = this.dataHelper.getProfileIamge() || '';

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

    const signinDid = (await this.dataHelper.getSigninData()).did;
    const channelId = UtilService.generateChannelId(signinDid,name.value);
    await this.native.showLoading('common.waitMoment');
    try {

      const selfchannels =  await this.hiveVaultController.getSelfChannel() || [];

      if (selfchannels.length >= 15) {
      this.native.hideLoading();
      this.native.toastWarn('CreatenewfeedPage.feedMaxNumber');
      return;
      }

      const list  =  _.filter(selfchannels,(channel: FeedsData.ChannelV3)=>{
                    return channel.destDid === signinDid && channel.channelId === channelId;
            });
      if(list.length > 0){
        this.native.hideLoading();
        this.native.toast('CreatenewfeedPage.alreadyExist'); // 需要更改错误提示
          return;
      }
      await this.uploadChannel(name.value, desc.value);
    } catch (error) {
      this.native.hideLoading();
    }

  }

  async uploadChannel(name: string, desc: string) {
    try {
      // 创建channles（用来存储userid下的所有创建的频道info）
      const signinData = await this.dataHelper.getSigninData();
      let userDid = signinData.did
      let userDisplayName = signinData.name;
      let tippingAddress = this.tippingAddress || '';
      const channelId = await this.hiveVaultController.createChannel(name, desc, this.avatar, tippingAddress)
      await this.hiveVaultController.subscribeChannel(userDid, channelId, userDisplayName);

      this.native.hideLoading()
      this.native.pop()
    } catch (error) {
      this.native.hideLoading();
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
