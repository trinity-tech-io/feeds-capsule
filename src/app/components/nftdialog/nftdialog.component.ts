import { Component, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { PopoverController, NavParams } from '@ionic/angular';
import { FeedService } from '../../services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { Events } from '../../services/events.service';
import _ from 'lodash';
import { UtilService } from 'src/app/services/utilService';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';
import { Logger } from 'src/app/services/logger';
import { Config } from 'src/app/services/config';
import { PopupProvider } from 'src/app/services/popup';
import { DataHelper } from 'src/app/services/DataHelper';
import { NFTContractHelperService } from 'src/app/services/nftcontract_helper.service';

let TAG: string = 'NFTDialog';
@Component({
  selector: 'app-nftdialog',
  templateUrl: './nftdialog.component.html',
  styleUrls: ['./nftdialog.component.scss'],
})
export class NftdialogComponent implements OnInit {
  private throwMsgTransDataLimit = 4 * 1000 * 1000;
  private transDataChannel: FeedsData.TransDataChannel =
    FeedsData.TransDataChannel.MESSAGE;
  public menuType: any = '';
  public amount: any = '';
  public title: string = '';
  public saleOrderId: any = '';
  public assItem: any = {};
  public curAmount: any = '';
  public quantity: any = '';
  public Maxquantity: any = '';
  public imgBase64: string = '';
  public curAssItem: any = {};
  private orderId: any = '';
  public imgUri:string = "";
  private popoverDialog: any;
  private assetType:string = "";
  private didUri:string = null;
  private maxSize:number = 5 * 1024 * 1024;
  constructor(
    private navParams: NavParams,
    private popover: PopoverController,
    private native: NativeService,
    private feedService: FeedService,
    private events: Events,
    public theme: ThemeService,
    private nftContractControllerService: NFTContractControllerService,
    private ipfsService: IPFSService,
    private nftPersistenceHelper: NFTPersistenceHelper,
    private popupProvider: PopupProvider,
    private dataHelper: DataHelper,
    private nftContractHelperService: NFTContractHelperService,
  ) {}

  ngOnInit() {
    this.title = this.navParams.get('title');
    this.menuType = this.navParams.get('menuType');
    let assItem = this.navParams.get('assItem');
    console.log("assItem",assItem);
    this.curAssItem = assItem;
    let curAmount = assItem.fixedAmount || null;
    if (curAmount != null) {
      this.curAmount = this.nftContractControllerService.transFromWei(
        this.assItem.fixedAmount,
      );
    }
    this.assItem = _.cloneDeep(assItem);
    let price = this.assItem.fixedAmount || null;
    if (price != null) {
      this.amount = this.nftContractControllerService.transFromWei(price);
    }
    this.quantity = this.assItem['curQuantity'] || this.assItem.quantity;
    this.Maxquantity = this.assItem['curQuantity'] || this.assItem.quantity;
    this.saleOrderId = this.assItem.saleOrderId || '';
    this.assetType = this.assItem.type || "";
    this.hanldeImg();
  }

  confirm() {
    switch (this.menuType) {
      case 'sale':
        this.handleSaleList();
        break;
      case 'created':
        this.handleCreatedList();
        break;
      case 'burn':
        this.handleBurnNfts();
        break;
    }
  }

  async handleBurnNfts(){

    this.quantity = this.quantity || '';
    if (this.quantity === '') {
      this.native.toastWarn('MintnftPage.nftQuantityPlaceholder');
      return;
    }
    let regNumber = /^\+?[1-9][0-9]*$/;
    if (regNumber.test(this.quantity) == false) {
      this.native.toast_trans('MintnftPage.quantityErrorMsg');
      return;
    }

    if (parseInt(this.quantity) > parseInt(this.Maxquantity)) {
      this.native.toast_trans('MintnftPage.quantityErrorMsg1');
      return;
    }
    await this.popover.dismiss();
    this.events.publish(FeedsEvent.PublishType.startLoading,{des:"common.burningNFTSDesc",title:"common.waitMoment",curNum:"1",maxNum:"1",type:"changePrice"});
    let sId =setTimeout(()=>{
      this.nftContractControllerService.getSticker().cancelBurnProcess();
      this.events.publish(FeedsEvent.PublishType.endLoading);
      clearTimeout(sId);
      this.popupProvider.showSelfCheckDialog('common.burningNFTSTimeoutDesc');
    }, Config.WAIT_TIME_BURN_NFTS);

    let tokenId = this.assItem["tokenId"];
    let tokenNum = this.quantity.toString();

    this.nftContractControllerService.getSticker()
    .burnNfs(tokenId,tokenNum)
    .then(()=>{
      this.nftContractControllerService.getSticker().cancelBurnProcess();
      this.events.publish(FeedsEvent.PublishType.endLoading);
      this.events.publish(FeedsEvent.PublishType.nftUpdateList,{type:"burn",assItem:this.assItem,burnNum:tokenNum});
      clearTimeout(sId);
      this.native.toast("common.burnNFTSSuccess");
    }).catch(()=>{
      this.nftContractControllerService.getSticker().cancelBurnProcess();
      this.events.publish(FeedsEvent.PublishType.endLoading);
      clearTimeout(sId);
      this.native.toastWarn("common.burnNFTSFailed");
    });
  }

  handleCreatedList() {
    if (!this.number(this.amount)) {
      this.native.toastWarn('common.amountError');
      return;
    }

    if (this.amount <= 0) {
      this.native.toastWarn('MintnftPage.priceErrorMsg');
      return;
    }

    if (this.curAmount === this.amount) {
      this.native.toastWarn('MintnftPage.priceErrorMsg1');
      return;
    }
    this.quantity = this.quantity || '';
    if (this.quantity === '') {
      this.native.toastWarn('MintnftPage.nftQuantityPlaceholder');
      return;
    }
    let regNumber = /^\+?[1-9][0-9]*$/;
    if (regNumber.test(this.quantity) == false) {
      this.native.toast_trans('MintnftPage.quantityErrorMsg');
      return;
    }

    if (parseInt(this.quantity) > parseInt(this.Maxquantity)) {
      this.native.toast_trans('MintnftPage.quantityErrorMsg1');
      return;
    }
    let tokenId = this.assItem.tokenId;

    this.sellCollectibles(tokenId, 'created');
  }

 async sellCollectibles(tokenId: any, type: string) {
    await this.popover.dismiss();
    this.events.publish(FeedsEvent.PublishType.startLoading,{des:"common.sellingOrderDesc",title:"common.waitMoment",curNum:"1",maxNum:"1",type:"changePrice"});
    this.didUri = await this.getDidUri();
    if(this.didUri === null){
       this.native.toast("common.didUriNull");
       this.events.publish(FeedsEvent.PublishType.endLoading);
       return;
    }
    let sId =setTimeout(()=>{
      this.nftContractControllerService.getPasar().cancelCreateOrderProcess();
      this.nftContractControllerService.getSticker().cancelSetApprovedProcess();
      this.events.publish(FeedsEvent.PublishType.endLoading);
      clearTimeout(sId);
      this.popupProvider.showSelfCheckDialog('common.saleOrderTimeoutDesc');
    }, Config.WAIT_TIME_SELL_ORDER);

    this.doSetApproval()
      .then(() => {
        return this.doCreateOrder(tokenId, type);
      })
      .then(() => {
        this.nftContractControllerService.getPasar().cancelCreateOrderProcess();
        this.nftContractControllerService.getSticker().cancelSetApprovedProcess()
        this.events.publish(FeedsEvent.PublishType.endLoading);
        clearTimeout(sId);
        //show success
      })
      .catch(() => {
        this.nftContractControllerService.getPasar().cancelCreateOrderProcess();
        this.nftContractControllerService.getSticker().cancelSetApprovedProcess()
        this.events.publish(FeedsEvent.PublishType.endLoading);
        clearTimeout(sId);
      });
  }

  async handleSaleList() {
    if (!this.number(this.amount)) {
      this.native.toastWarn('common.amountError');
      return;
    }

    if (this.amount <= 0) {
      this.native.toastWarn('MintnftPage.priceErrorMsg');
      return;
    }

    if (this.curAmount === this.amount) {
      this.native.toastWarn('MintnftPage.priceErrorMsg1');
      return;
    }
    await this.popover.dismiss();
    this.events.publish(FeedsEvent.PublishType.startLoading, { des: "common.changingPriceDesc", title: "common.waitMoment", curNum: "1", maxNum: "1", type: "changePrice" });
    let sId = setTimeout(async () => {
      this.events.publish(FeedsEvent.PublishType.endLoading);
      this.nftContractControllerService.getPasar().cancelChangePriceProcess();
      this.popupProvider.showSelfCheckDialog('common.changePriceTimeoutDesc');
      clearTimeout(sId);
    }, Config.WAIT_TIME_CHANGE_PRICE);
    const price = this.amount.toString();
    this.nftContractHelperService.changePrice(this.saleOrderId, price, this.didUri).then(() => {
      this.nftContractControllerService.getPasar().cancelChangePriceProcess();
      this.events.publish(FeedsEvent.PublishType.endLoading);
      clearTimeout(sId);
    })
      .catch(() => {
        this.nftContractControllerService.getPasar().cancelChangePriceProcess();
        this.native.toast_trans('common.priceChangeFailed');
        this.events.publish(FeedsEvent.PublishType.endLoading);
        clearTimeout(sId);
      });
  }

  doSetApproval(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        let sellerAddress = this.nftContractControllerService.getAccountAddress();
        const sellerInfo = await this.nftContractControllerService
          .getPasar()
          .getSellerByAddr(sellerAddress);
        this.orderId = sellerInfo[2];

        // Seller approve pasar
        let pasarAddr = this.nftContractControllerService.getPasar().getAddress();
        let result = '';

        result = await this.nftContractControllerService
          .getSticker()
          .setApprovalForAll(sellerAddress, pasarAddr, true);

        if (!result) {
          reject('SetApprovalError');
          return;
        }

        resolve('Successs');
      } catch (error) {
        reject(error);
      }
    });
  }

  doCreateOrder(tokenId: any, type: string) {
    return new Promise(async (resolve, reject) => {
      try {
        let sellerAddress = this.nftContractControllerService.getAccountAddress();
        let price = UtilService.accMul(this.amount, this.quantity);
        Logger.log(TAG, 'Sell price is', price);
        let salePrice = this.nftContractControllerService.transToWei(
          price.toString(),
        );
        Logger.log(TAG, 'Trans price to wei', salePrice);
        Logger.log(TAG, 'Quantity type is ', typeof this.quantity);
        if (typeof this.quantity === 'number') {
          this.quantity = this.quantity.toString();
        }
        Logger.log(TAG, 'Quantity type is', typeof this.quantity);
        let orderIndex = -1;

        orderIndex = await this.nftContractControllerService
          .getPasar()
          .createOrderForSale(tokenId, this.quantity, salePrice,this.didUri);

        if (!orderIndex || orderIndex == -1) {
          reject('Create Order error');
          return;
        }

        await this.handleCreteOrderResult(tokenId, orderIndex, type);
        resolve('Success');
      } catch (error) {
        reject(error);
      }
    })
  }

  async handleCreteOrderResult(tokenId: string, orderIndex: number, type: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const item = await this.nftContractHelperService.getSellerNFTItembyIndexFromContract(orderIndex);
        const orderSellerDidObj = this.feedService.getSigninDidObj();
        item.orderSellerDidObj = orderSellerDidObj;
        const obj = { type: type, assItem: item, sellQuantity: this.quantity };
        this.events.publish(FeedsEvent.PublishType.nftUpdateList, obj);
        this.orderId = item.saleOrderId;
        if(item.type === "feeds-video"){
          resolve(item);
        }else{
          await this.getSetChannel(tokenId);
          resolve(item);
        }
      } catch (err) {
        Logger.error(err);
        reject(err);
      }
    });
  }

  number(text: any) {
    var numPattern = /^(([1-9]\d*)|\d)(.\d{1,9})?$/;
    return numPattern.test(text);
  }

  cancel() {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  async hanldeImg() {
    let imgUri = this.assItem['thumbnail'] || "";
    let type = this.assItem['type'] || "";
    let kind = this.assItem["kind"];
    let size = this.assItem["originAssetSize"];
    if(type === "feeds-video"){
      let videoInfo: FeedsData.FeedsVideo = this.assItem['video'] || null;
      if(videoInfo != null){
        imgUri = videoInfo.thumbnail;
        kind = videoInfo.kind;
        size = videoInfo.size;
      }else{
        imgUri = "";
      }

    }
    if(imgUri === ""){
      this.imgUri = "";
      return;
    }
    if (!size)
    size = '0';
    if (kind === "gif" && parseInt(size) <= this.maxSize) {
        imgUri = this.assItem['asset'];
    }
    if (imgUri.indexOf('feeds:imgage:') > -1) {
      imgUri = imgUri.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }else if(imgUri.indexOf('feeds:image:') > -1){
      imgUri = imgUri.replace('feeds:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }
   this.imgUri = imgUri;
  }

  async getSetChannel(tokenId: any) {
    let setChannel = this.feedService.getCollectibleStatus();
    let isTipToast:boolean = false;
    for (let key in setChannel) {
      let value = setChannel[key] || '';
      if (value) {
        isTipToast = true;
        let nodeId = key.split('_')[0];
        let channelId = parseInt(key.split('_')[1]);
        await this.sendPost(tokenId, nodeId, channelId);
      }
    }


    if(isTipToast){
      this.native.toast("CreatenewpostPage.tipMsg1");
    }
  }

  async sendPost(tokenId: any, nodeId: string, channelId: number) {
    let tempPostId = this.feedService.generateTempPostId();
     this.imgBase64 = await this.compressImage(this.imgUri);
    this.publishPostThrowMsg(tokenId, nodeId, channelId, tempPostId);
  }

  async publishPostThrowMsg(
    tokenId: any,
    nodeId: string,
    channelId: number,
    tempPostId: number,
  ) {
    let imgSize = this.imgBase64.length;
    if (imgSize > this.throwMsgTransDataLimit) {
      this.transDataChannel = FeedsData.TransDataChannel.SESSION;
      let memo: FeedsData.SessionMemoData = {
        feedId: channelId,
        postId: 0,
        commentId: 0,
        tempId: tempPostId,
      };
      this.feedService.restoreSession(nodeId, memo);
    } else {
      this.transDataChannel = FeedsData.TransDataChannel.MESSAGE;
    }

    let imgThumbs: FeedsData.ImgThumb[] = [];
    let imgThumb: FeedsData.ImgThumb = {
      index: 0,
      imgThumb: this.imgBase64,
      imgSize: imgSize,
    };
    imgThumbs.push(imgThumb);

    let nftContent = {};
    nftContent['version'] = '1.0';
    nftContent['imageThumbnail'] = imgThumbs;
    nftContent['text'] = this.assItem.name+ " - "+ this.assItem.description;
    nftContent['nftTokenId'] = tokenId;
    nftContent['nftOrderId'] = this.orderId;
    nftContent['nftImageType'] = this.assetType;

    this.feedService.declarePost(
      nodeId,
      channelId,
      JSON.stringify(nftContent),
      false,
      tempPostId,
      this.transDataChannel,
      this.imgBase64,
      '',
    );
  }

  // 压缩图片
  compressImage(path: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        let img = new Image();
        img.crossOrigin='*';
        img.crossOrigin = "Anonymous";
        img.src = path;
        img.onload = () =>{
          let maxWidth = img.width / 4;
          let maxHeight = img.height / 4;
          let imgBase64 = UtilService.resizeImg(img,maxWidth,maxHeight,1);
          resolve(imgBase64);
        };
      } catch (err) {
        Logger.error(TAG, "Compress image error", err);
        reject("Compress image error" + JSON.stringify(err));
      }
    });
  }

  async getDidUri(){
    return await this.feedService.getDidUri();
  }
}
