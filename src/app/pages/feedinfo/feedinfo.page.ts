import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Platform } from '@ionic/angular';
import { ThemeService } from '../../services/theme.service';
import { FeedService } from '../../services/FeedService';
import { NativeService } from '../../services/NativeService';
import { MenuService } from '../../services/MenuService';
import { PopoverController } from '@ionic/angular';
import { PaypromptComponent } from '../../components/payprompt/payprompt.component';
import { AppService } from '../../services/AppService';
import { UtilService } from '../../services/utilService';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { IntentService } from 'src/app/services/IntentService';

import  _ from 'lodash';

@Component({
  selector: 'app-feedinfo',
  templateUrl: './feedinfo.page.html',
  styleUrls: ['./feedinfo.page.scss'],
})

export class FeedinfoPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public connectionStatus = 1;
  public nodeId: string = '';
  public channelId: number = 0;
  public name: string = '';
  public des: string = '';
  public channelAvatar = '';
  public oldChannelInfo: any = {};
  public oldChannelAvatar: string = '';
  public serverInfo: any = {};
  public feedsUrl: string = null;
  public qrcodeString: string = null;
  public severVersion: string = '';
  public elaAddress: string = '';
  public developerMode: boolean = false;
  public channelSubscribes: number = 0;
  public followStatus: boolean = false;
  public isShowPrompt: boolean = false;
  public popover: any;
  public isPress: boolean = false;
  public updatedTime: number = 0;
  public isMine: boolean = null;
  public channelOwner: string = '';
  public type: string = '';
  public serverDid: string = '';
  constructor(
    private popoverController: PopoverController,
    private feedService: FeedService,
    public theme: ThemeService,
    private translate: TranslateService,
    private events: Events,
    private native: NativeService,
    private zone: NgZone,
    private menuService: MenuService,
    private appService: AppService,
    private platform: Platform,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper,
    private intentService: IntentService
  ) {}

  ngOnInit() {

  }

  initChannelInfo(){
    let item = this.feedService.getChannelInfo();
    this.oldChannelInfo = item;
    let channelInfo = _.cloneDeep(item);
    this.type = channelInfo['type'] || "";
    this.updatedTime = channelInfo['updatedTime'] || 0;
    this.nodeId = channelInfo['nodeId'] || '';
    this.channelId = channelInfo['channelId'] || '';
    this.name = channelInfo['name'] || '';
    this.des = channelInfo['des'] || '';
    this.serverInfo = this.feedService.getServerbyNodeId(this.nodeId) || null;
    let feedsUrl = "";
    if(this.serverInfo != null){
      this.elaAddress =
      this.serverInfo['elaAddress'] || 'common.emptyElaAddressDes';
      this.serverDid = this.serverInfo['did'];
      feedsUrl = this.serverInfo['feedsUrl'] || null;
      this.feedsUrl = feedsUrl + '/' + this.channelId;
      this.qrcodeString = this.feedsUrl + '#' + encodeURIComponent(this.name);
    }else{
      this.serverDid = channelInfo["did"];
      this.elaAddress = "common.emptyElaAddressDes";
      this.feedsUrl = channelInfo["feedUrl"];
      console.log("===this.feedsUrl===",this.feedsUrl);
      this.qrcodeString = this.feedsUrl + '#' + encodeURIComponent(this.name);
    }

    this.severVersion =
      this.feedService.getServerVersionByNodeId(this.nodeId) ||
      '<1.3.0(Outdated)';

    this.oldChannelAvatar = this.feedService.getProfileIamge();

    this.followStatus = channelInfo['followStatus'] || null;
    if (this.followStatus == null) this.followStatus = false;

    this.channelSubscribes = channelInfo['channelSubscribes'] || 0;
    this.channelOwner = channelInfo.channelOwner || "";
  }

  ionViewWillEnter() {
    this.developerMode = this.feedService.getDeveloperMode();
    this.initChannelInfo();
    this.initTitle();
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.channelAvatar = this.feedService.getProfileIamge();
    let avatar = this.feedService.parseChannelAvatar(this.channelAvatar);
    document.getElementById("feedsInfoAvatar").setAttribute("src",avatar);
    this.addEvents();
  }

  addEvents() {

    this.events.subscribe(FeedsEvent.PublishType.channelInfoRightMenu,()=>{
      this.clickEdit();
    });

    this.events.subscribe(FeedsEvent.PublishType.connectionChanged, status => {
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.rpcRequestError, () => {
      this.native.hideLoading();
    });

    this.events.subscribe(
      FeedsEvent.PublishType.subscribeFinish,
      (subscribeFinishData: FeedsEvent.SubscribeFinishData) => {
        this.zone.run(() => {
          let nodeId = subscribeFinishData.nodeId;
          let channelId = subscribeFinishData.channelId;
          this.checkFollowStatus(nodeId,channelId);
        });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.unsubscribeFinish,
      (unsubscribeData: FeedsEvent.unsubscribeData) => {
        this.zone.run(() => {
          this.native.setRootRouter(['/tabs/home']);
        });
      },
    );
  }

  removeEvents() {
    this.events.unsubscribe(FeedsEvent.PublishType.channelInfoRightMenu);
    this.events.unsubscribe(FeedsEvent.PublishType.unsubscribeFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.subscribeFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestError);
    this.events.publish(FeedsEvent.PublishType.notification);
    this.events.publish(FeedsEvent.PublishType.addProflieEvent);
    this.events.publish(FeedsEvent.PublishType.search);
  }

  checkFollowStatus(nodeId: string, channelId: number) {
    let channelsMap = this.feedService.getChannelsMap();
    let nodeChannelId = this.feedService.getChannelId(nodeId, channelId);
    if (
      channelsMap[nodeChannelId] == undefined ||
      !channelsMap[nodeChannelId].isSubscribed
    ) {
      this.followStatus = false;
    } else {
      this.followStatus = true;
    }
  }

  initTitle() {
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
   //this.titleBarService.setTitleBarMoreMemu(this.titleBar);
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('FeedinfoPage.title'),
    );
    this.isMine = this.feedService.checkChannelIsMine(
      this.nodeId,
      this.channelId,
    );

    if(this.isMine&&this.type===""){
      if(!this.theme.darkMode){
        this.titleBarService.setTitleBarMoreMemu(this.titleBar,"channelInfoRightMenu","assets/icon/dot.ico");
      }else{
        this.titleBarService.setTitleBarMoreMemu(this.titleBar,"channelInfoRightMenu","assets/icon/dark/dot.ico");
      }
    }

  }

  ionViewWillLeave() {
    this.removeEvents();
  }

  clickEdit() {
    if (!this.isMine) {
      return;
    }
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (this.feedService.getServerStatusFromId(this.nodeId) != 0) {
      this.native.toastWarn('common.connectionError1');
      return;
    }

    this.native.go('/eidtchannel');
  }

  subscribe() {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.feedService.subscribeChannel(this.nodeId, Number(this.channelId));
  }

  unsubscribe() {
    this.menuService.showUnsubscribeMenuWithoutName(
      this.nodeId,
      Number(this.channelId),
    );
  }

  async showPayPrompt(elaAddress: string) {
    this.isShowPrompt = true;
    this.popover = await this.popoverController.create({
      mode: 'ios',
      cssClass: 'PaypromptComponent',
      component: PaypromptComponent,
      backdropDismiss: false,
      componentProps: {
        title: this.translate.instant('ChannelsPage.tip'),
        elaAddress: elaAddress,
        defalutMemo: '',
      },
    });
    this.popover.onWillDismiss().then(() => {
      this.isShowPrompt = false;
      this.popover = null;
    });
    return await this.popover.present();
  }

  showPreviewQrcode(feedsUrl: string) {
    if (this.isPress) {
      this.isPress = false;
      return;
    }
    let isOwner = this.feedService.checkChannelIsMine(
      this.nodeId,
      this.channelId,
    );
    if (isOwner) {
      this.titleBarService.setIcon(
        this.titleBar,
        FeedsData.TitleBarIconSlot.INNER_RIGHT,
        null,
        null,
      );
    }
    this.viewHelper.showPreviewQrcode(
      this.titleBar,
      feedsUrl,
      'common.qRcodePreview',
      'FeedinfoPage.title',
      'feedinfo',
      this.appService,
      isOwner,
    );
  }

  menuMore(feedsUrl: string) {
    if (this.platform.is('ios')) {
      this.isPress = true;
    }
    //@Deprecated
    this.intentService.share('', feedsUrl);
  }

  handleTime(updatedTime: number) {
    let updateDate = new Date(updatedTime);
    return UtilService.dateFormat(updateDate, 'yyyy-MM-dd HH:mm:ss');
  }

  copyText(text: any) {
    this.native
      .copyClipboard(text)
      .then(() => {
        this.native.toast_trans('common.textcopied');
      })
      .catch(() => {});
  }
}
