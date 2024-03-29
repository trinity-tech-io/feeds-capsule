import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PopoverController } from '@ionic/angular';
import { ThemeService } from 'src/app/services/theme.service';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from 'src/app/services/NativeService';
import { HttpService } from 'src/app/services/HttpService';
import { ApiUrl } from 'src/app/services/ApiUrl';
import { UtilService } from 'src/app/services/utilService';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import _ from 'lodash';
import { DataHelper } from 'src/app/services/DataHelper';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { PasarAssistService } from 'src/app/services/pasar_assist.service';
import { CarrierService } from 'src/app/services/CarrierService';
import { PopupProvider } from 'src/app/services/popup';

@Component({
  selector: 'app-eidtchannel',
  templateUrl: './eidtchannel.page.html',
  styleUrls: ['./eidtchannel.page.scss'],
})
export class EidtchannelPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public connectionStatus = 1;
  public nodeId: string = '';
  public channelId: number = 0;
  public name: string = '';
  public des: string = '';
  public channelAvatar = '';
  public avatar = '';
  public oldChannelInfo: any = {};
  public oldChannelAvatar: string = '';
  public isPublic: string = '';
  private channelOwner: string = "";
  private channelSubscribes: number = null;
  private followStatus: boolean = false;
  private isClickConfirm: boolean = false;
  private channelCollections: FeedsData.ChannelCollections = null;
  private popover: any = null;
  constructor(
    private feedService: FeedService,
    public activatedRoute: ActivatedRoute,
    public theme: ThemeService,
    private translate: TranslateService,
    private events: Events,
    private native: NativeService,
    private zone: NgZone,
    private httpService: HttpService,
    private popoverController: PopoverController,
    private titleBarService: TitleBarService,
    private dataHelper: DataHelper,
    private nftContractControllerService: NFTContractControllerService,
    private pasarAssistService: PasarAssistService,
    private carrierService: CarrierService,
    private popupProvider: PopupProvider,
  ) {}

  ngOnInit() {
    let item = this.feedService.getChannelInfo();
    this.oldChannelInfo = item;
    let channelInfo = _.cloneDeep(item);
    this.nodeId = channelInfo['nodeId'] || '';
    this.channelId = channelInfo['channelId'] || '';
    this.name = channelInfo['name'] || '';
    this.des = channelInfo['des'] || '';
    this.channelOwner = channelInfo['channelOwner'] || '';
    this.channelSubscribes = channelInfo['channelSubscribes'] || '';
    this.followStatus = channelInfo['followStatus'] || false;
    this.oldChannelAvatar = this.feedService.getProfileIamge();
  }

  ionViewWillEnter() {
    this.initTitle();
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.channelAvatar = this.feedService.getProfileIamge();
    this.avatar = this.feedService.parseChannelAvatar(this.channelAvatar);

    this.events.subscribe(FeedsEvent.PublishType.connectionChanged, status => {
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.editFeedInfoFinish, () => {
      this.zone.run(() => {
        let channelInfo = this.feedService.getChannelInfo();
        channelInfo["name"] = this.name;
        channelInfo["des"] = this.des;
        this.feedService.setChannelInfo(channelInfo);
        //this.updatePublicData();
        this.native.hideLoading();
        this.native.pop();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.rpcRequestError, () => {
      this.native.hideLoading();
    });
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('EidtchannelPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewDidEnter() {}

  ionViewWillLeave() {
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
    }
    if(!this.isClickConfirm){
     this.feedService.setProfileIamge(this.oldChannelAvatar);
    }
    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.editFeedInfoFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestError);
    this.events.publish(FeedsEvent.PublishType.notification);
    this.events.publish(FeedsEvent.PublishType.addProflieEvent);
  }

  profileimage() {
    this.feedService.setChannelInfo({
      nodeId: this.nodeId,
      channelId: this.channelId,
      name: this.name,
      des: this.des,
      channelOwner: this.channelOwner,
      channelSubscribes: this.channelSubscribes,
      followStatus: this.followStatus
    });
    this.native.navigateForward(['/profileimage'], '');
  }

  cancel() {
    this.isClickConfirm = false;
    this.native.pop();
  }

  async confirm() {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (this.feedService.getServerStatusFromId(this.nodeId) != 0) {
      this.native.toastWarn('common.connectionError1');
      return;
    }
    await this.native.showLoading('common.waitMoment', isDismiss => {})
    await this.getPublicStatus();
    this.native.hideLoading();
    if(this.isPublic === "1"){
      this.open("EidtchannelPage.des","EidtchannelPage.des1")
      return;
    }
    if(this.isPublic === "2"){
      this.open("EidtchannelPage.des","EidtchannelPage.des2")
      return;
    }
    if(this.isPublic === "3"){
      this.open("EidtchannelPage.des","EidtchannelPage.des3")
      return;
    }
    this.isClickConfirm = true;

    if (this.checkparms() && this.isPublic === "") {
      this.native
        .showLoading('common.waitMoment', isDismiss => {})
        .then(() => {
          this.feedService.editFeedInfo(
            this.nodeId,
            Number(this.channelId),
            this.name,
            this.des,
            this.avatar,
          );
        });
    }
  }

  checkparms() {
    let nameValue = this.name || '';
    nameValue = this.native.iGetInnerText(nameValue);
    if (nameValue === '') {
      this.native.toast_trans('CreatenewfeedPage.inputName');
      return false;
    }

    if (this.name.length > 32) {
      this.native.toast_trans('CreatenewfeedPage.tipMsgLength1');
      return;
    }

    let descValue = this.des || '';
    descValue = this.native.iGetInnerText(descValue);

    if (descValue === '') {
      this.native.toast_trans('CreatenewfeedPage.inputFeedDesc');
      return false;
    }

    if (this.des.length > 128) {
      this.native.toast_trans('CreatenewfeedPage.tipMsgLength');
      return;
    }

    if (this.channelAvatar === '') {
      this.native.toast_trans('CreatenewfeedPage.des');
      return false;
    }

    if (
      this.oldChannelInfo['name'] === this.name &&
      this.oldChannelInfo['des'] === this.des &&
      this.oldChannelAvatar === this.channelAvatar
    ) {
      this.native.toast_trans('common.nochanges');
      return false;
    }

    return true;
  }

  updatePublicData() {
    if (this.isPublic === '') {
      return;
    }
    let serverInfo = this.feedService.getServerbyNodeId(this.nodeId);
    let feedsUrl = serverInfo['feedsUrl'] + '/' + this.channelId;
    let feedsUrlHash = UtilService.SHA256(feedsUrl);
    let obj = {
      feedsUrlHash: feedsUrlHash,
      name: this.name,
      description: this.des,
      feedsAvatar: this.avatar,
      followers: this.oldChannelInfo['subscribers'],
    };
    this.httpService.ajaxPost(ApiUrl.update, obj, false).then(result => {
      if (result['code'] === 200) {
      }
    });
  }

  async getPublicStatus() {
    this.channelCollections = await this.getChannelCollectionsStatus() || null;
    if(this.channelCollections != null){
      this.zone.run(() => {
        this.isPublic = '2';
      });
      return;
    }

    let serverInfo = this.feedService.getServerbyNodeId(this.nodeId);
    let feedsUrl = serverInfo['feedsUrl'] + '/' + this.channelId;
    let tokenInfo = await this.isExitStrick(feedsUrl);
    if(tokenInfo != null){
       this.isPublic = '3';
       return;
    }
    let feedsUrlHash = UtilService.SHA256(feedsUrl);
    try {
      let result = await this.httpService
      .ajaxGet(ApiUrl.get + '?feedsUrlHash=' + feedsUrlHash, false) || null;
    if(result === null){
       this.isPublic = '';
        return;
    }
    if(result['code'] === 200) {
        let resultData = result['data'] || '';
        if (resultData != '') {
          this.isPublic = '1';
        } else {
          this.isPublic = '';
        }
    }
    } catch (error) {

    }
  }

  async getChannelCollectionsStatus(){
    try {
      let server = this.feedService.getServerbyNodeId(this.nodeId) || null;
      if (server === null) {
      return;
      }
      let feedsUrl = server.feedsUrl + '/' + this.channelId;
      let feedsUrlHash = UtilService.SHA256(feedsUrl);
      let tokenId: string ="0x" + feedsUrlHash;
      tokenId =  UtilService.hex2dec(tokenId);
      let list = this.dataHelper.getPublishedActivePanelList() || [];
      let fitleItem = _.find(list,(item)=>{
          return item.tokenId === tokenId;
      }) || null;
      if(fitleItem != null){
         return fitleItem;
      }
      let result = await this.pasarAssistService.getPanel(tokenId);
      if(result != null){
       let tokenInfo = result["data"] || "";
       if(tokenInfo === ""){
           return null;
       }
       tokenInfo =  await this.handlePanels(result["data"]);
       let panelList=this.dataHelper.getPublishedActivePanelList() || [];
       panelList.push(tokenInfo);
       this.dataHelper.setPublishedActivePanelList(panelList);
       return tokenInfo;
       }
      return null;
     } catch (error) {
      return null;
     }
   }

   async isExitStrick(feedsUrl: string) {

    try {
     let tokenId: string ="0x" + UtilService.SHA256(feedsUrl);
     tokenId =  UtilService.hex2dec(tokenId);
     //let tokenInfo = await this.pasarAssistService.searchStickers(tokenId);
     let tokenInfo = await this.nftContractControllerService.getSticker().tokenInfo(tokenId);
     if(tokenInfo[0]!='0' && tokenInfo[2]!='0'){
          return tokenInfo;
     }
     return null;
    } catch (error) {
     return null;
    }
   }

   async handlePanels(item :any){
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
     let didJsON = this.feedService.getSignInData() || {};
     channelCollections.ownerName = didJsON["name"];
     let url: string = channelCollections.entry.url;
     let urlArr = url.replace("feeds://","").split("/");
     channelCollections.did = urlArr[0];
     let carrierAddress = urlArr[1];
     let nodeId = await this.carrierService.getIdFromAddress(carrierAddress,()=>{});
     channelCollections.nodeId = nodeId;
     return channelCollections;
  }

  open(des1: string,des2: string){
    this.popover = this.popupProvider.showalertdialog(
      this,
      des1,
      des2,
      this.ok,
      'finish.svg',
      'common.ok',
    );
  }

  ok(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      this.popover = null;
      that.native.pop();
    }
  }

}
