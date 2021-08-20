import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from '../../services/TitleBarService';
import { TitleBarComponent } from '../../components/titlebar/titlebar.component';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { FeedService, Avatar } from 'src/app/services/FeedService';
import { NativeService } from '../../services/NativeService';
import { IPFSService } from 'src/app/services/ipfs.service';
import _ from 'lodash';
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';
import { Logger } from 'src/app/services/logger';

const TAG: string = 'ProfileImagePage';
@Component({
  selector: 'app-profilenftimage',
  templateUrl: './profilenftimage.page.html',
  styleUrls: ['./profilenftimage.page.scss'],
})
export class ProfilenftimagePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public nftImageList: any = [];
  public onSaleList: any = [];
  public styleObj: any = { width: '' };
  public isFinsh:any = [];
  constructor(
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private nftContractControllerService: NFTContractControllerService,
    private feedService: FeedService,
    private native: NativeService,
    private ipfsService: IPFSService,
    private nftPersistenceHelper: NFTPersistenceHelper
  ) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.initTile();
    this.styleObj.width = (screen.width - 20 - 10) / 2 + 'px';
    this.getImageList();
  }

  initTile() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('MintnftPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewWillLeave() {}

  getImageList() {
    let createAddr =
      this.nftContractControllerService.getAccountAddress() || '';
    if (createAddr === '') {
      this.nftImageList = [];
    }

    let list = this.nftPersistenceHelper.getCollectiblesList(createAddr);
    if (list.length === 0) {
      this.notOnSale(createAddr);
      this.OnSale(createAddr);
    } else {
      this.nftImageList = list;
    }
  }

  doRefresh(event: any) {
    let nftImageList = _.cloneDeep(this.nftImageList);
    let arr = _.filter(nftImageList,(item)=>{
      return item === null;
    });
    if(arr.length > 0 && this.isFinsh.length<nftImageList.length){
       event.target.complete();
       return;
    }
    this.isFinsh = [];
    let accAddress =
      this.nftContractControllerService.getAccountAddress() || '';
    this.nftImageList = [];
    let sId2 = setTimeout(() => {
      if (accAddress === '') {
        event.target.complete();
        clearTimeout(sId2);
        return;
      }
      this.notOnSale(accAddress);
      this.OnSale(accAddress);
      event.target.complete();
      clearTimeout(sId2);
    }, 500);
  }

  async notOnSale(accAddress: string) {
    this.nftImageList = [];
    let nftCreatedCount = await this.nftContractControllerService
      .getSticker()
      .tokenCountOfOwner(accAddress);
    if (nftCreatedCount === '0') {
      this.nftImageList = [];
      this.hanleListCace(accAddress);
    } else {
      for (let index = 0; index < nftCreatedCount; index++) {
        this.nftImageList.push(null);
      }
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
          'created',
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
    listType: any,
    cIndex: any,
    createAddress: any,
    createTime: any,
  ) {
    feedsUri = feedsUri.replace('feeds:json:', '');
    this.ipfsService
      .nftGet(this.ipfsService.getNFTGetUrl() + feedsUri)
      .then(result => {
        let type = result['type'] || 'single';
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
        try {
          this.isFinsh.push("1");
          this.nftImageList[cIndex] = item;
          let nftImageList = _.cloneDeep(this.nftImageList);
          let arr = _.filter(nftImageList,(item)=>{
                return item === null;
          });
          if(arr.length === 0){
            this.hanleListCace(createAddress);
          }
        } catch (err) {
          Logger.error(TAG, 'Handle feeds url error', err);
        }
      })
      .catch(() => {
        this.isFinsh.push("1");
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
    } else {

      for (let index = 0; index < orderCount; index++) {
           this.nftImageList.push(null);
      }

      let nftCreatedCount = await this.nftContractControllerService
      .getSticker()
      .tokenCountOfOwner(accAddress);

      await this.handleOrder(sellerAddr, orderCount, 'sale', accAddress,nftCreatedCount);
    }
  }

  async handleOrder(
    sellerAddr: any,
    orderCount: any,
    listType: any,
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
            let type = result['type'] || 'single';
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
            this.isFinsh.push("1");
            let nftIndex = parseInt(nftCreatedCount) + index;
            this.nftImageList[nftIndex] = item;
            let nftImageList = _.cloneDeep(this.nftImageList);
            let arr = _.filter(nftImageList,(item)=>{
              return item === null;
            });
           if(arr.length === 0){
            this.hanleListCace(createAddress);
           }
          })
          .catch(() => {
            this.isFinsh.push("1");
          });
      } catch (error) {}
    }
  }

  hanleListCace(createAddress?: any) {
    let ownNftCollectiblesList = this.nftPersistenceHelper.getCollectiblesList(createAddress);
    ownNftCollectiblesList =  this.nftImageList;
    this.nftPersistenceHelper.setCollectiblesMap(createAddress, ownNftCollectiblesList);
  }

  async clickItem(item: any) {
    let imgUri = item['asset'];
    if (imgUri.indexOf('feeds:imgage:') > -1) {
      imgUri = imgUri.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }
    this.native.navigateForward(['editimage'], { replaceUrl: true });
    this.feedService.setClipProfileIamge(imgUri);
  }

  hanldeImg(imgUri: string) {
    if (imgUri.indexOf('feeds:imgage:') > -1) {
      imgUri = imgUri.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
      // imgUri = ApiUrl.nftGet + imgUri;
    }
    return imgUri;
  }

  // 压缩图片
  compressImage(path: any): Promise<string> {
    //最大高度
    const maxHeight = 600;
    //最大宽度
    const maxWidth = 600;
    return new Promise((resolve, reject) => {
      try {
        let img = new Image();
        img.src = path;

        img.onload = () => {
          const originHeight = img.height;
          const originWidth = img.width;
          let tempWidth:any;
          let tempHeight:any;
          //let compressedWidth = img.height;
          //let compressedHeight = img.width;
          if(originWidth > 0 && originHeight > 0){
            //原图片宽高比例 大于 指定的宽高比例，这就说明了原图片的宽度必然 > 高度
            if (originWidth/originHeight >= maxWidth/maxHeight) {
                if (originWidth > maxWidth) {
                    tempWidth = maxWidth;
                    // 按原图片的比例进行缩放
                    tempHeight = (originHeight * maxWidth) / originWidth;
                } else {
                    // 按原图片的大小进行缩放
                    tempWidth = originWidth;
                    tempHeight = originHeight;
                }
            } else {// 原图片的高度必然 > 宽度
                if (originHeight > maxHeight) {
                    tempHeight = maxHeight;
                    // 按原图片的比例进行缩放
                    tempWidth = (originWidth * maxHeight) / originHeight;
                } else {
                    // 按原图片的大小进行缩放
                    tempWidth = originWidth;
                    tempHeight = originHeight;
                }
            }
          }
          // 生成canvas
          let canvas = document.createElement('canvas');
          let context = canvas.getContext('2d');
          canvas.height = tempHeight;
          canvas.width =  tempWidth;
          // context.globalAlpha = 0.2;
          context.clearRect(0, 0, tempWidth,tempHeight);
          context.drawImage(img, 0, 0, tempWidth,tempHeight);
          let base64 = canvas.toDataURL('image/*',1);
          if (!base64) {
            let error = "Compress image error, result is null";
            Logger.error(TAG, error);
            reject(error);
          }
          resolve(base64);
        };
      } catch (err) {
        Logger.error(TAG, "Compress image error", err);
        reject("Compress image error" + JSON.stringify(err));
      }
    });
  }
}
