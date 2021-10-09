import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { ThemeService } from '../../services/theme.service';
import { NativeService } from '../../services/NativeService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { UtilService } from 'src/app/services/utilService';
import { Logger } from 'src/app/services/logger';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { FeedService, Avatar } from 'src/app/services/FeedService';
import _ from 'lodash';
import { IonRefresher } from '@ionic/angular';
const TAG: string = 'NftavatarlistPage';
@Component({
  selector: 'app-nftavatarlist',
  templateUrl: './nftavatarlist.page.html',
  styleUrls: ['./nftavatarlist.page.scss'],
})
export class NftavatarlistPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonRefresher,{static:false}) refresher: IonRefresher;
  public nftAvatarList: any = [];
  public onSaleList: any = [];
  public styleObj: any = { width: '' };
  public isFinsh:any = [];
  public type:string = "";
  private maxCount:number = 0;
  public isLoading:boolean = false;
  constructor(
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private nftContractControllerService: NFTContractControllerService,
    private nftPersistenceHelper: NFTPersistenceHelper,
    private ipfsService: IPFSService,
    private native: NativeService,
    private feedService: FeedService,
    public theme: ThemeService
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
    this.getImageList();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('NftavatarlistPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewDidLoad(){
  }

  ionViewWillLeave(){

  }

  getImageList() {
    this.isFinsh = [];
    let createAddr =
      this.nftContractControllerService.getAccountAddress() || '';
    if (createAddr === '') {
      this.isLoading = false;
      this.nftAvatarList = [];
    }
    let avatarKey = createAddr+"_avatar";
    let list = this.nftPersistenceHelper.getCollectiblesList(avatarKey);
    if (list.length === 0) {
      this.isLoading = true;
      this.notOnSale(createAddr);
      this.OnSale(createAddr);
    } else {
      this.isLoading = false;
      this.nftAvatarList = list;
    }
  }

 async doRefresh(event: any) {
    this.isFinsh = [];
    this.nftAvatarList = [];
    let accAddress =
      this.nftContractControllerService.getAccountAddress() || '';
    this.notOnSale(accAddress);
    this.OnSale(accAddress);
    let nftCreatedCount = await this.nftContractControllerService
      .getSticker()
      .tokenCountOfOwner(accAddress);
    let sellerInfo = await this.nftContractControllerService
      .getPasar()
      .getSellerByAddr(accAddress);
    let orderCount = sellerInfo[3];
    this.maxCount = parseInt(nftCreatedCount) + parseInt(orderCount);
    // let sId2 = setTimeout(() => {
    //   if (accAddress === '') {
    //     event.target.complete();
    //     clearTimeout(sId2);
    //     return;
    //   }
    //   this.notOnSale(accAddress);
    //   this.OnSale(accAddress);
    //   event.target.complete();
    //   clearTimeout(sId2);
    // }, 500);
  }

  async notOnSale(accAddress: string) {
    this.nftAvatarList = [];
    let nftCreatedCount = await this.nftContractControllerService
      .getSticker()
      .tokenCountOfOwner(accAddress);
    let sellerInfo = await this.nftContractControllerService
      .getPasar()
      .getSellerByAddr(accAddress);
    let orderCount = sellerInfo[3];
    this.maxCount = parseInt(nftCreatedCount) + parseInt(orderCount);
    if(this.maxCount === 0){
      this.isLoading = false;
      this.nftAvatarList = [];
      this.hanleListCace(accAddress);
      return;
    }
    if (nftCreatedCount === '0') {
      this.isLoading = false;
      this.nftAvatarList = [];
      this.hanleListCace(accAddress);
    } else {
      for (let cIndex = 0; cIndex < nftCreatedCount; cIndex++) {
        let tokenId = await this.nftContractControllerService
          .getSticker()
          .tokenIdOfOwnerByIndex(accAddress, cIndex);
        let tokenInfo = await this.nftContractControllerService
          .getSticker()
          .tokenInfo(tokenId);
        let price = '';
        let tokenNum = tokenInfo[2];
        let tokenUri = tokenInfo[3];
        let createTime = tokenInfo[7];
        let royaltyOwner = tokenInfo[4];
        this.handleFeedsUrl(
          tokenUri,
          tokenId,
          price,
          tokenNum,
          royaltyOwner,
          cIndex,
          accAddress,
          createTime,
        );
      }
    }
  }

  handleFeedsUrl(
    feedsUri: string,
    tokenId: string,
    price: any,
    tokenNum: any,
    royaltyOwner: any,
    cIndex: any,
    createAddress: any,
    createTime: any,
  ) {
    feedsUri = feedsUri.replace('feeds:json:', '');
    this.ipfsService
      .nftGet(this.ipfsService.getNFTGetUrl() + feedsUri)
      .then(result => {
        let type = result['type'] || '';
        this.isFinsh.push("1");
        if(this.maxCount === this.isFinsh.length){
          this.refresher.complete();
          this.isLoading = false;
        }
        if(type === 'avatar'){

          let royalties = royaltyOwner;
          let quantity = tokenNum;
          let fixedAmount = price || null;
          let thumbnail = result['thumbnail'] || '';
          if (thumbnail === '') {
            thumbnail = result['image'];
          }

          let item = {
            creator: createAddress,
            tokenId: tokenId,
            asset: result['image'],
            name: result['name'],
            description: result['description'],
            fixedAmount: fixedAmount,
            kind: result['kind'],
            type: type,
            royalties: royalties,
            quantity: quantity,
            thumbnail: thumbnail,
            createTime: createTime * 1000,
            moreMenuType: 'created',
          };
          this.nftAvatarList.push(item);
          this.hanleListCace(createAddress);
        }
      })
      .catch(() => {
        this.isFinsh.push("1");
        if(this.maxCount === this.isFinsh.length){
          this.refresher.complete()
          this.isLoading = false;
        }
       });
  }

  async OnSale(accAddress: string) {
    //this.onSaleList = [];
    let sellerInfo = await this.nftContractControllerService
      .getPasar()
      .getSellerByAddr(accAddress);
    let sellerAddr = sellerInfo[1];
    let orderCount = sellerInfo[3];
    if (orderCount === '0') {
      this.isLoading = false;
    } else {

      let nftCreatedCount = await this.nftContractControllerService
      .getSticker()
      .tokenCountOfOwner(accAddress);

      await this.handleOrder(sellerAddr, orderCount,accAddress,nftCreatedCount);
    }
  }

  async handleOrder(
    sellerAddr: any,
    orderCount: any,
    createAddress: any,
    nftCreatedCount:any
  ) {
    for (let index = 0; index < orderCount; index++) {
      try {
        let sellerOrder = await this.nftContractControllerService
          .getPasar()
          .getSellerOpenByIndex(sellerAddr, index);
        let tokenId = sellerOrder[3];
        let saleOrderId = sellerOrder[0];
        let price = sellerOrder[5];

        let tokenInfo = await this.nftContractControllerService
          .getSticker()
          .tokenInfo(tokenId);
        let feedsUri = tokenInfo[3];
        let createTime = tokenInfo[7];
        feedsUri = feedsUri.replace('feeds:json:', '');
        let tokenNum = tokenInfo[2];
        this.ipfsService
          .nftGet(this.ipfsService.getNFTGetUrl() + feedsUri)
          .then(result => {
            let type = result['type'] || '';
            this.isFinsh.push("1");
            if(this.maxCount === this.isFinsh.length){
              this.refresher.complete();
              this.isLoading = false;
            }
            if(type === 'avatar'){
              let royalties = result['royalties'] || '';
              let quantity = tokenNum;
              let fixedAmount = price || null;
              let thumbnail = result['thumbnail'] || '';
              if (thumbnail === '') {
                thumbnail = result['image'];
              }

              let item = {
                creator: createAddress,
                saleOrderId: saleOrderId,
                tokenId: tokenId,
                asset: result['image'],
                name: result['name'],
                description: result['description'],
                fixedAmount: fixedAmount,
                kind: result['kind'],
                type: type,
                royalties: royalties,
                quantity: quantity,
                thumbnail: thumbnail,
                sellerAddr: sellerAddr,
                createTime: createTime * 1000,
                moreMenuType: 'onSale',
              };
              this.nftAvatarList.push(item);
              this.hanleListCace(createAddress);
            }
          })
          .catch(() => {
            this.isFinsh.push("1");
            if(this.maxCount === this.isFinsh.length){
              this.refresher.complete()
              this.isLoading = false;
            }
          });
      } catch (error) {
        this.refresher.complete();
        this.isLoading = false;
      }
    }
  }

  hanleListCace(createAddress?: any) {
    let avatarKey = createAddress+"_avatar";
    let ownNftCollectiblesList = this.nftPersistenceHelper.getCollectiblesList(avatarKey);
    ownNftCollectiblesList =  this.nftAvatarList;
    this.nftPersistenceHelper.setCollectiblesMap(avatarKey, ownNftCollectiblesList);
  }

  async clickItem(item: any) {

    let imgUri = item['asset'];
    this.feedService.setClipProfileIamge(imgUri);
    this.native.pop();

    if(this.type === "postImages"){
      if (imgUri.indexOf('feeds:imgage:') > -1) {
        imgUri = imgUri.replace('feeds:imgage:', '');
        imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
      }else if(imgUri.indexOf('feeds:image:') > -1){
        imgUri = imgUri.replace('feeds:image:', '');
        imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
      }
     await this.native.showLoading('common.waitMoment', isDismiss => {}, 30000);
     let imgBase64 = await this.compressImage(imgUri);
      this.feedService.setSelsectNftImage(imgBase64);
      this.native.pop();
      this.native.hideLoading();
     return;
  }
  //this.native.navigateForward(['editimage'], { replaceUrl: true });
  }

  hanldeImg(item:any) {
    let imgUri = item['thumbnail'];
    let kind = item["kind"];
    if(kind === "gif"){
        imgUri = item['asset'];
    }
    if (imgUri.indexOf('feeds:imgage:') > -1) {
      imgUri = imgUri.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }else if (imgUri.indexOf('feeds:image:') > -1) {
      imgUri = imgUri.replace('feeds:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
      // imgUri = ApiUrl.nftGet + imgUri;
    }
    return imgUri;
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
        this.native.hideLoading();
        reject("Compress image error" + JSON.stringify(err));
      }
    });
  }

}
