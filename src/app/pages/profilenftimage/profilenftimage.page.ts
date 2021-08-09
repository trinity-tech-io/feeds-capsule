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

@Component({
  selector: 'app-profilenftimage',
  templateUrl: './profilenftimage.page.html',
  styleUrls: ['./profilenftimage.page.scss'],
})
export class ProfilenftimagePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public nftImageList: any = [];
  public onSaleList: any = [];
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
    // let allList = this.feedService.getOwnNftCollectiblesList();
    let allList = this.nftPersistenceHelper.getCollectiblesMap();
    let clist = allList[createAddr] || [];
    if (clist.length === 0) {
      this.notOnSale(createAddr);
      this.OnSale(createAddr);
    } else {
      this.nftImageList = clist;
    }
  }

  doRefresh(event: any) {
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
          this.nftImageList.splice(cIndex, 1, item);
          this.hanleListCace(createAddress);
          // this.isLoading = false;
        } catch (err) {
          console.log('====err====' + JSON.stringify(err));
        }
      })
      .catch(() => {});
    // this.httpService
    //   .ajaxGet(ApiUrl.nftGet + feedsUri, false)
    //   .then(result => {
    //     let type = result['type'] || 'single';
    //     let royalties = royaltyOwner;
    //     let quantity = tokenNum;
    //     let fixedAmount = price || null;
    //     let thumbnail = result['thumbnail'] || '';
    //     if (thumbnail === '') {
    //       thumbnail = result['image'];
    //     }
    //     let item = {
    //       creator: createAddress,
    //       tokenId: tokenId,
    //       asset: result['image'],
    //       name: result['name'],
    //       description: result['description'],
    //       fixedAmount: fixedAmount,
    //       kind: result['kind'],
    //       type: type,
    //       royalties: royalties,
    //       quantity: quantity,
    //       thumbnail: thumbnail,
    //       createTime: createTime * 1000,
    //       moreMenuType: 'created',
    //     };
    //     try {
    //       this.nftImageList.splice(cIndex, 1, item);
    //       this.hanleListCace(createAddress);
    //       // this.isLoading = false;
    //     } catch (err) {
    //       console.log('====err====' + JSON.stringify(err));
    //     }
    //   })
    //   .catch(() => {});
  }

  async OnSale(accAddress: string) {
    this.onSaleList = [];
    let sellerInfo = await this.nftContractControllerService
      .getPasar()
      .getSellerByAddr(accAddress);
    let sellerAddr = sellerInfo[1];
    let orderCount = sellerInfo[3];
    if (orderCount === '0') {
    } else {
      for (let index = 0; index < orderCount; index++) {
        this.onSaleList.push(null);
      }
      await this.handleOrder(sellerAddr, orderCount, 'sale', accAddress);
    }
  }

  async handleOrder(
    sellerAddr: any,
    orderCount: any,
    listType: any,
    createAddress: any,
  ) {
    for (let index = 0; index < orderCount; index++) {
      try {
        let sellerOrder = await this.nftContractControllerService
          .getPasar()
          .getSellerOpenByIndex(sellerAddr, index);
        let tokenId = sellerOrder[3];
        let saleOrderId = sellerOrder[0];
        let price = sellerOrder[5];
        // const stickerContract = this.web3Service.getSticker();
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
            this.onSaleList.splice(index,1,item);
            this.nftImageList = _.unionWith(this.nftImageList,this.onSaleList);
            this.hanleListCace(createAddress);
            //this.isLoading = false;
          })
          .catch(() => {});
        // this.httpService
        //   .ajaxGet(ApiUrl.nftGet + feedsUri, false)
        //   .then(result => {
        //     let type = result['type'] || 'single';
        //     let royalties = result['royalties'] || '';
        //     let quantity = tokenNum;
        //     let fixedAmount = price || null;
        //     let thumbnail = result['thumbnail'] || '';
        //     if (thumbnail === '') {
        //       thumbnail = result['image'];
        //     }
        //     let item = {
        //       creator: createAddress,
        //       saleOrderId: saleOrderId,
        //       tokenId: tokenId,
        //       asset: result['image'],
        //       name: result['name'],
        //       description: result['description'],
        //       fixedAmount: fixedAmount,
        //       kind: result['kind'],
        //       type: type,
        //       royalties: royalties,
        //       quantity: quantity,
        //       thumbnail: thumbnail,
        //       sellerAddr: sellerAddr,
        //       createTime: createTime * 1000,
        //       moreMenuType: 'onSale',
        //     };
        //     let len = this.nftImageList.length - 1 + index;
        //     this.nftImageList.splice(len, 1, item);
        //     this.hanleListCace(createAddress);
        //     //this.isLoading = false;
        //   })
        //   .catch(() => {});
      } catch (error) {}
    }
  }

  hanleListCace(createAddress?: any) {
    // let ownNftCollectiblesList = this.feedService.getOwnNftCollectiblesList();
    let ownNftCollectiblesListMap = this.nftPersistenceHelper.getCollectiblesMap();
    ownNftCollectiblesListMap[createAddress] = _.unionWith(this.nftImageList,this.onSaleList);
    this.nftPersistenceHelper.setCollectiblesMap(ownNftCollectiblesListMap);

    // this.feedService.setOwnNftCollectiblesList(ownNftCollectiblesList);
    // this.feedService.setData(
    //   'feed.nft.own.collectibles.list',
    //   JSON.stringify(ownNftCollectiblesList),
    // );
  }

  async clickItem(item: any) {
    let imgUri = item['asset'];
    if (imgUri.indexOf('feeds:imgage:') > -1) {
      imgUri = imgUri.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
      // imgUri = ApiUrl.nftGet + imgUri;
    }
    //let imgBase64 = await this.compressImage(imgUri);
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

  compressImage(path: any): Promise<string> {
    //最大高度
    const maxHeight = 600;
    //最大宽度
    const maxWidth = 600;
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.src = path;

      img.onload = () => {
        const originHeight = img.height;
        const originWidth = img.width;
        let compressedWidth = img.height;
        let compressedHeight = img.width;
        if (originWidth > maxWidth && originHeight > maxHeight) {
          // 更宽更高，
          if (originHeight / originWidth > maxHeight / maxWidth) {
            // 更加严重的高窄型，确定最大高，压缩宽度
            compressedHeight = maxHeight;
            compressedWidth = maxHeight * (originWidth / originHeight);
          } else {
            //更加严重的矮宽型, 确定最大宽，压缩高度
            compressedWidth = maxWidth;
            compressedHeight = maxWidth * (originHeight / originWidth);
          }
        } else if (originWidth > maxWidth && originHeight <= maxHeight) {
          // 更宽，但比较矮，以maxWidth作为基准
          compressedWidth = maxWidth;
          compressedHeight = maxWidth * (originHeight / originWidth);
        } else if (originWidth <= maxWidth && originHeight > maxHeight) {
          // 比较窄，但很高，取maxHight为基准
          compressedHeight = maxHeight;
          compressedWidth = maxHeight * (originWidth / originHeight);
        } else {
          // 符合宽高限制，不做压缩
        }
        // 生成canvas
        let canvas = document.createElement('canvas');
        let context = canvas.getContext('2d');
        canvas.height = compressedHeight;
        canvas.width = compressedWidth;
        // context.globalAlpha = 0.2;
        context.clearRect(0, 0, compressedWidth, compressedHeight);
        context.drawImage(img, 0, 0, compressedWidth, compressedHeight);
        let base64 = canvas.toDataURL('image/*');
        resolve(base64);
      };
    });
  }
}