import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from '../../../services/theme.service';
import { NativeService } from '../../../services/NativeService';
import { Events } from '../../../services/events.service';
import { TitleBarService } from '../../../services/TitleBarService';
import { TitleBarComponent } from '../../..//components/titlebar/titlebar.component';
import { FeedService } from 'src/app/services/FeedService';
import { PopupProvider } from 'src/app/services/popup';
import { PopoverController } from '@ionic/angular';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { HttpService } from '../../../services/HttpService';
import _ from 'lodash';
import { UtilService } from 'src/app/services/utilService';
import { Config } from 'src/app/services/config';
import { NFTContractHelperService } from 'src/app/services/nftcontract_helper.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { Logger } from 'src/app/services/logger';
import { UserDIDService } from 'src/app/services/userdid.service';
import { VideoService } from 'src/app/services/video.service';

type detail = {
  type: string;
  details: string;
};
type videoId = {
  "videoId": string,
  "sourceId": string
  "vgbufferingId": string,
  "vgcontrolsId": string
  "vgoverlayplayId": string,
  "vgfullscreeId": string
};
let TAG: string = "Bid";
@Component({
  selector: 'app-bid',
  templateUrl: './bid.page.html',
  styleUrls: ['./bid.page.scss'],
})
export class BidPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public contractDetails: detail[] = [];
  public seller: string = '';
  public name: string = '';
  public description: string = 'test';
  public quantity: string = '1';
  public dateCreated: string = '';
  public expirationDate: string = '';
  public stickerContractAddress: string = '';
  public parsarContractAddress: string = '';
  public tokenID: string = '';
  public blockchain: string = 'Elastos Smart Chain (ESC)';
  public fixedPrice: string = '';
  public bibAmount: string = '';
  public minimumBid: string = '';
  public currentBid: string = '';
  public showType: string = null;
  public assetUri: string = null;
  public royalties: string = null;
  public saleOrderId: string = null;
  public sellerAddress: string = null;
  private curAssetItem = null;
  public popover: any = null;
  public developerMode: boolean = false;
  public nftStatus: string = null;
  public accAddress: string = null;
  public isLoading:boolean = false;
  public loadingTitle:string = "common.waitMoment";
  public loadingText:string = "common.buyingOrderDesc";
  public loadingCurNumber:string = "1";
  public loadingMaxNumber:string = "2";
  public usdPrice:string = null;
  public imageType:string = "";
  private creator: string = "";
  private isBuy: boolean = false;
  private orderCreateTime: number = null;
  private tokenCreateTime: number = null;
  private didUri: string = null
  public did: string = null;
  public didDispaly: string = null;
  public didName: string = null;
  private NftDidList: any = null;
  public isSwitch: boolean = false;
  public dispalyOwer: string = "";
  public videoIdObj: videoId = {
    videoId: '',
    sourceId: '',
    vgbufferingId: '',
    vgcontrolsId: '',
    vgoverlayplayId: '',
    vgfullscreeId: ''
  };
  public thumbnail: string = "";
  public kind: string = "";
  public isAudioLoading: boolean = false;
  constructor(
    private translate: TranslateService,
    private event: Events,
    private native: NativeService,
    private titleBarService: TitleBarService,
    public theme: ThemeService,
    private activatedRoute: ActivatedRoute,
    private feedService: FeedService,
    private popoverController: PopoverController,
    public popupProvider: PopupProvider,
    private nftContractControllerService: NFTContractControllerService,
    private ipfsService: IPFSService,
    private httpService: HttpService,
    private nftContractHelperService: NFTContractHelperService,
    private dataHelper: DataHelper,
    private videoService: VideoService
  ) {}

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((queryParams: FeedsData.NFTItem) => {
      this.saleOrderId = queryParams.saleOrderId || '';
      if (this.saleOrderId == '') {
        Logger.log('Sale orderId is null');
        return;
      }
      const pasarItem: FeedsData.NFTItem = this.dataHelper.getBidPageAssetItem();
      this.curAssetItem = _.cloneDeep(pasarItem);

      this.imageType = queryParams.type || '';
      this.showType = queryParams.showType;
      this.seller = queryParams.sellerAddr || '';
      this.name = queryParams.name || '';
      this.description = queryParams.description || '';
      this.quantity = String(queryParams.curQuantity) || String(queryParams.quantity);
      this.tokenID = queryParams.tokenId || '';
      this.creator = queryParams.creator || '';
      this.orderCreateTime = queryParams.orderCreateTime || null;
      this.tokenCreateTime = queryParams.tokenCreateTime || null;

      let orderSellerDidObj: FeedsData.DidObj = this.curAssetItem["orderSellerDidObj"] || null;
      if (orderSellerDidObj != null) {
        let orderSellerDid = orderSellerDidObj.did || null;
        if (orderSellerDid != null) {
          this.did = orderSellerDid.replace("did:elastos:", "");
          this.didDispaly = UtilService.resolveDid(this.did);
        }
      } else {
        this.feedService.getDidFromWalletAddress(this.seller).then((didObj: FeedsData.DidObj) => {
          if (didObj && didObj.did) {
            this.did = didObj.did.replace("did:elastos:", "");
            this.didDispaly = UtilService.resolveDid(this.did);
            this.handleNftDid();
          }else{
            this.dispalyOwer = UtilService.resolveAddress(this.seller);
          }
        }).catch(()=>{
          this.dispalyOwer = UtilService.resolveAddress(this.seller);
        });
      }

      this.stickerContractAddress = this.nftContractControllerService
        .getSticker()
        .getStickerAddress();
      this.parsarContractAddress = this.nftContractControllerService
        .getPasar()
        .getPasarAddress();

        if(this.imageType === "video"){
          this.videoService.intVideoAllId(TAG);
          this.videoIdObj = this.videoService.getVideoAllId();
        }else if(this.imageType === "audio"){
          let ipfsUrl = this.ipfsService.getNFTGetUrl();
          let audioInfo: FeedsData.FeedsAudio = this.curAssetItem.data || null;
          if(audioInfo === null){
            this.thumbnail = "";
            return;
          }
          this.kind = audioInfo.kind;
          let audioUri = audioInfo.audio;
             audioUri = audioUri.replace('feeds:audio:', '');
          this.assetUri = ipfsUrl + audioUri;
        }else{
          let version = queryParams.version || "1";
          this.assetUri = this.handleImg(this.curAssetItem,version);
        }
      this.fixedPrice = queryParams.fixedAmount || null;
      this.royalties = queryParams.royalties || null;
      this.saleOrderId = queryParams.saleOrderId || '';
      this.sellerAddress = queryParams.sellerAddr || '';
    });
  }

 ionViewWillEnter() {
    let audio = document.getElementById("bid-audio") || null;
    if(audio != null ){
      this.isAudioLoading = true;
      audio.addEventListener("loadeddata",()=>{
         audio.style.display = "block";
         this.isAudioLoading = false;
      });
      audio.style.display = "none";
    }
    this.NftDidList= this.dataHelper.getNftDidList() || {};
    this.handleNftDid();
    this.accAddress =
      this.nftContractControllerService.getAccountAddress() || null;
    this.developerMode = this.feedService.getDeveloperMode();
    this.initTile();
    this.collectContractData();
    this.addEvent();
    if(this.fixedPrice != null){
    let elaPrice = this.dataHelper.getElaUsdPrice() || "";
    if(elaPrice != ""){
      let ethprice = this.nftContractControllerService.transFromWei(this.fixedPrice);
      this.usdPrice  = UtilService.accMul(elaPrice,ethprice).toFixed(2);
     }else{
      this.httpService.getElaPrice().then((elaPrice)=>{
        if(elaPrice != null){
          let ethprice = this.nftContractControllerService.transFromWei(this.fixedPrice);
          this.usdPrice  = UtilService.accMul(elaPrice,ethprice).toFixed(2);
         }
      });
    }
   }
   if(this.imageType === "video"){
    let ipfsUrl = this.ipfsService.getNFTGetUrl();
    let videoInfo: FeedsData.FeedsVideo = this.curAssetItem.data || null;
    if(videoInfo === null){
      this.thumbnail = "";
      return;
    }
    let thumbnail = videoInfo.thumbnail;
    this.thumbnail  = thumbnail;
    let thumbnailUri = thumbnail.replace('feeds:image:', '');
    thumbnailUri = ipfsUrl + thumbnailUri;
    let kind = videoInfo.kind;
    let video = videoInfo.video;
    let videoUri = video.replace('feeds:video:', '');
    videoUri = ipfsUrl + videoUri;
    this.videoService.getVideoPoster(thumbnailUri,kind,videoUri);
  }
  }

  ionViewWillLeave() {
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = null;
    }
    this.removeEvent();
    if(this.isBuy){
      this.event.publish(FeedsEvent.PublishType.nftBuyOrder);
    }
    this.native.handleTabsEvents();
  }

  initTile() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('BidPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  addEvent() {
    this.event.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      this.initTile();
    });
  }

  removeEvent() {
    this.event.unsubscribe(FeedsEvent.PublishType.updateTitle);
  }

 async collectContractData() {

    this.contractDetails = [];

    this.contractDetails.push({
      type: 'AssetdetailsPage.name',
      details: this.name,
    });

    this.contractDetails.push({
      type: 'AssetdetailsPage.description',
      details: this.description,
    });

    let creatorAddress = await this.getCreatorAddress();
    let creatorAddressDes:any = await this.handleCreatorAddress(creatorAddress)
    this.contractDetails.push({
      type: creatorAddressDes,
      details: creatorAddress,
    });
    this.contractDetails.push({
      type: 'AssetdetailsPage.owner',
      details: this.seller,
    });

    let tokenID = '0x'+UtilService.dec2hex(this.tokenID);
    this.contractDetails.push({
      type: 'AssetdetailsPage.tokenID',
      details: tokenID,
    });

    if(this.royalties!=null){
      let royalties = UtilService.accDiv(this.royalties,10000);
      this.contractDetails.push({
        type: 'AssetdetailsPage.royalties',
        details: royalties +"%",
      });
    }

    this.contractDetails.push({
      type: 'AssetdetailsPage.quantity',
      details: this.quantity,
    });

    // this.contractDetails.push({
    //   type: 'common.state',
    //   details: this.translate.instant('common.onsale'),
    // });

    let saleDes = "";

    if(creatorAddress === this.seller){
      saleDes = "AssetdetailsPage.firstSale";
    }else{
      saleDes = "AssetdetailsPage.secondarySale";
    }

    this.contractDetails.push({
      type: 'AssetdetailsPage.saleType',
      details: this.translate.instant(saleDes),
    });


    let tokenCreateTime = await this.getTokenCreateTime();
    this.contractDetails.push({
      type: 'AssetdetailsPage.dateCreated',
      details:tokenCreateTime,
    });

    let marketDate = await this.getMarketDate();
    this.contractDetails.push({
      type: 'AssetdetailsPage.dateoNMarket',
      details: marketDate,
    });

    if (this.expirationDate != '') {
      this.contractDetails.push({
        type: 'MintnftPage.nftExpirationDate',
        details: this.expirationDate,
      });
    }

    this.contractDetails.push({
      type: 'AssetdetailsPage.stickerContractAddress',
      details: this.stickerContractAddress,
    });

    if (this.developerMode) {
      this.contractDetails.push({
        type: 'AssetdetailsPage.pasarContractAddress',
        details: this.parsarContractAddress,
      });
    }

    this.contractDetails.push({
      type: 'BidPage.blockchain',
      details: this.blockchain,
    });
  }
 async getTokenCreateTime() {
    if(this.tokenCreateTime != null){
      let createDate = new Date(this.tokenCreateTime*1000);
      let dateCreated = UtilService.dateFormat(
            createDate,
            'yyyy-MM-dd HH:mm:ss',
      );
      return dateCreated;
    }

    let tokenInfo = await this.nftContractControllerService.getSticker().tokenInfo(this.tokenID);
    let createDate = new Date(parseInt(tokenInfo[6])*1000);
    let dateCreated = UtilService.dateFormat(
          createDate,
          'yyyy-MM-dd HH:mm:ss',
    );
    return dateCreated;
  }

  async clickBuy() {
    let accountAddress =
      this.nftContractControllerService.getAccountAddress() || '';
    if (accountAddress === '') {
      this.native.toast_trans('common.connectWallet');
      return;
    }

    let orderInfo = await this.nftContractControllerService.getPasar().getOrderById(this.saleOrderId);
    let orderState = parseInt(orderInfo[2]);
    let orderType =  orderInfo[1] || "1";
    if(orderType === "2"){
      this.native.toast_trans('common.auction');
        return;
    }
    if(orderState === FeedsData.OrderState.SOLD){
      this.native.toast_trans('common.sold');
          return;
    }
    if(orderState === FeedsData.OrderState.CANCELED){
      this.native.toast_trans('common.offTheShelf');
          return;
    }

    if(orderState === FeedsData.OrderState.SALEING){
    //start loading
    this.isLoading = true;
    this.didUri = await this.getDidUri();

    // new didUri
    if(this.didUri === null){
      this.native.toast("common.didUriNull");
      this.isLoading = false;
      return;
    }

    let sId = setTimeout(()=>{
       //Buy order Timeout
       this.nftContractControllerService.getPasar().cancelBuyOrderProcess();
       this.isLoading = false;
       this.showSelfCheckDialog();
       clearTimeout(sId);
    },Config.WAIT_TIME_BUY_ORDER)
      this.nftContractHelperService.buyOrder(this.curAssetItem, this.quantity, this.didUri, (eventName: string, result: FeedsData.ContractEventResult) => {
        if (eventName == FeedsData.ContractEvent.TRANSACTION_HASH) {
          this.loadingText = 'common.queryTransactionResult';
          this.loadingCurNumber = "2";
          // this.loadingMaxNumber = null;
        }
      }).then(() => {
        //Finish buy order
        this.isLoading = false;
        clearTimeout(sId)
        this.isBuy = true;
        this.native.pop();
      })
      .catch((error) => {
        this.buyFail();
        this.isLoading = false;
        this.isBuy = false;
        clearTimeout(sId)
      });
    }
  }

  // buy(): Promise<string> {
  //   return new Promise(async (resolve, reject) => {
  //     let accountAddress = this.nftContractControllerService.getAccountAddress();
  //     let price = this.fixedPrice;
  //     let purchaseStatus = '';
  //     try {
  //       purchaseStatus = await this.nftContractControllerService
  //         .getPasar()
  //         .buyOrder(accountAddress, this.saleOrderId, price);

  //       if (!purchaseStatus) {
  //         reject('Error');
  //         return;
  //       }
  //       this.handleBuyResult();
  //       resolve('Success');
  //     } catch (error) {
  //       reject(error);
  //     }
  //   });
  // }



  buyFail() {
    this.popover = this.popupProvider.ionicAlert(
      this,
      '',
      'common.buyNftError',
      this.confirm,
      'tskth.svg',
      'common.ok',
    );
  }

  confirm(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      this.popover = null;
    }
  }

  bid() {
    this.native.navigateForward(['confirmation'], {
      queryParams: { showType: 'burn' },
    });
  }

  handleImg(queryParams: any,version :string): string {
    let fetchUrl = "";
    let imageUri = "";
    if(version === "1"){
      imageUri = queryParams.asset || "";
    }else if(version === "2"){
      let data = queryParams.data || "";
      if(data != ""){
        imageUri  = data.image || "";
      }else{
        imageUri  = "";
      }
    }
    if(imageUri === ""){
      return "";
    }
    if(imageUri.indexOf('feeds:imgage:') > -1) {
      imageUri = imageUri.replace('feeds:imgage:', '');
      fetchUrl = this.ipfsService.getNFTGetUrl() + imageUri;
    } else if (imageUri.indexOf('feeds:image:') > -1) {
      imageUri = imageUri.replace('feeds:image:', '');
      fetchUrl = this.ipfsService.getNFTGetUrl() + imageUri;
    } else if (imageUri.indexOf('pasar:image:') > -1) {
      imageUri = imageUri.replace('pasar:image:', '');
      fetchUrl = this.ipfsService.getNFTGetUrl() + imageUri;
    }
    return fetchUrl;
  }

 hanldePrice(price: string) {
    let ethprice = this.nftContractControllerService.transFromWei(price)
    return ethprice;
  }

  copytext(text: any) {
    let textdata = text || '';
    if (textdata != '') {
      this.native
        .copyClipboard(text)
        .then(() => {
          this.native.toast_trans('common.textcopied');
        })
        .catch(() => {});
    }
  }

  showSelfCheckDialog() {
    //TimeOut
    this.openAlert();
  }

  openAlert() {
    this.popover = this.popupProvider.ionicAlert(
      this,
      'common.timeout',
      'common.buyOrderTimeoutDesc',
      this.confirm,
      'tskth.svg',
    );
  }

  buyTimeOutconfirm(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      this.popover = null;
    }
  }

 async getCreatorAddress(){

  if(this.creator!=""){
  return  this.creator;
  }

  let tokenInfo = await this.nftContractControllerService.getSticker().tokenInfo(this.tokenID);
  return tokenInfo[4];

  }

  async getMarketDate(){
    if(this.orderCreateTime!=null){
      let createDate = new Date(this.orderCreateTime*1000);
      let dateCreated = UtilService.dateFormat(
        createDate,
        'yyyy-MM-dd HH:mm:ss',
      );
      return dateCreated;
    }
    let order = await this.nftContractControllerService
    .getPasar()
    .getOrderById(this.saleOrderId);
   let createDate = new Date(parseInt(order[15])*1000);
   let dateCreated = UtilService.dateFormat(
     createDate,
     'yyyy-MM-dd HH:mm:ss',
   );
    return dateCreated;
  }

 async handleCreatorAddress(creatorAddress: string){
  return new Promise((resolve, reject) => {
    let whiteListData :FeedsData.WhiteItem[] =  this.feedService.getWhiteListData();
    let whiteListItem =  _.find(whiteListData,(item: FeedsData.WhiteItem)=>{
           return item.address === creatorAddress;
    }) || "";
    if(whiteListItem != ""){
      resolve('BidPage.verifiedCreator');
    }else{
      resolve('AssetdetailsPage.creator');
    }
  });

  }

  async getDidUri(){
    return await this.feedService.getDidUri();
  }

  handleNftDid(){
    if(this.did === null){
      return;
    }
   let didname =  this.NftDidList[this.did] || null;
   if(didname === null){
     let did = "did:elastos:"+this.did;
     this.feedService.resolveDidObjectForName(did).then((result) => {
               this.didName = result["name"] || null;
               if(this.didName!=null){
                  this.isSwitch = true;
               }
               this.NftDidList[this.did] =  this.didName;
               this.dataHelper.setNftDidList(this.NftDidList);
      }).catch(()=>{
      });
   }else{
      this.didName = this.NftDidList[this.did];
      this.isSwitch = true;
   }
  }

  switchDid(){
   if(!this.isSwitch){
     return;
   }
   if(this.didName!=null){
      this.didName = null;
   }else{
    this.didName = this.NftDidList[this.did];
   }
  }

  copyDid(){
    if(this.did === null){
      return;
    }
   if(this.didName === null){
    this.native
    .copyClipboard(this.did)
    .then(() => {
      this.native.toast_trans('common.textcopied');
    })
    .catch(() => {});
   }
  }

  openPasarExplorer(){
   let url = "https://pasarprotocol.io/explorer/collectible/detail/"+this.tokenID;
    this.native.openUrl(url);
  }
}
