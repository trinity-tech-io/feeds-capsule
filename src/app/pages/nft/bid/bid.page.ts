import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from '../../../services/theme.service';
import { NativeService } from '../../../services/NativeService';
import { Events } from '../../../services/events.service';
import { TitleBarService } from '../../../services/TitleBarService';
import { TitleBarComponent } from '../../..//components/titlebar/titlebar.component';
import { FeedService } from 'src/app/services/FeedService';
// import { Web3Service } from '../../../services/Web3Service';
import { PopupProvider } from 'src/app/services/popup';
import { PopoverController } from '@ionic/angular';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';

import _ from 'lodash';
import { UtilService } from 'src/app/services/utilService';
type detail = {
  type: string;
  details: string;
};
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
  private curAssetItem = {};
  public popover: any = null;
  public developerMode: boolean = false;
  public nftStatus: string = null;
  public accAddress: string = null;
  constructor(
    private translate: TranslateService,
    private event: Events,
    private native: NativeService,
    private titleBarService: TitleBarService,
    public theme: ThemeService,
    private activatedRoute: ActivatedRoute,
    // private web3Service:Web3Service,
    private feedService: FeedService,
    private popoverController: PopoverController,
    public popupProvider: PopupProvider,
    private nftContractControllerService: NFTContractControllerService,
    private ipfsService: IPFSService,
    private nftPersistenceHelper: NFTPersistenceHelper
  ) {}

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(queryParams => {
      this.curAssetItem = _.cloneDeep(queryParams);
      let asset = queryParams.asset || {};
      this.showType = queryParams.showType;
      this.seller = queryParams.sellerAddr || '';
      this.name = queryParams.name || '';
      this.description = queryParams.description || '';
      this.quantity = queryParams.quantity || '1';
      this.tokenID = queryParams.tokenId || '';
      this.stickerContractAddress = this.nftContractControllerService
        .getSticker()
        .getStickerAddress();
      this.parsarContractAddress = this.nftContractControllerService
        .getPasar()
        .getPasarAddress();
      this.assetUri = this.handleImg(asset);
      this.fixedPrice = queryParams.fixedAmount || null;
      this.royalties = queryParams.royalties || null;
      this.saleOrderId = queryParams.saleOrderId || '';
      this.sellerAddress = queryParams.sellerAddr || '';
      let createTime = queryParams.createTime || '';
      if (createTime != '') {
        let createDate = new Date(parseInt(createTime));
        this.dateCreated = UtilService.dateFormat(
          createDate,
          'yyyy-MM-dd HH:mm:ss',
        );
      }
    });
  }

  ionViewWillEnter() {
    this.accAddress =
      this.nftContractControllerService.getAccountAddress() || null;
    this.developerMode = this.feedService.getDeveloperMode();
    this.initTile();
    this.collectContractData();
    this.addEvent();
  }

  ionViewWillLeave() {
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = null;
    }
    this.removeEvent();
    this.event.publish(FeedsEvent.PublishType.search);
    this.event.publish(FeedsEvent.PublishType.notification);
    this.event.publish(FeedsEvent.PublishType.addProflieEvent);
    this.event.publish(FeedsEvent.PublishType.addBinaryEvevnt);
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

  collectContractData() {
    this.contractDetails = [];
    this.contractDetails.push({
      type: 'AssetdetailsPage.owner',
      details: this.seller,
    });

    this.contractDetails.push({
      type: 'AssetdetailsPage.name',
      details: this.name,
    });

    this.contractDetails.push({
      type: 'AssetdetailsPage.description',
      details: this.description,
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

    //if(this.nftStatus!=null){
    this.contractDetails.push({
      type: 'common.state',
      details: this.translate.instant('common.onsale'),
    });
    //}

    if (this.dateCreated != '') {
      this.contractDetails.push({
        type: 'AssetdetailsPage.dateCreated',
        details: this.dateCreated,
      });
    }

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
      type: 'AssetdetailsPage.tokenID',
      details: this.tokenID,
    });

    this.contractDetails.push({
      type: 'BidPage.blockchain',
      details: this.blockchain,
    });
  }

  clickBuy() {
    let accountAddress =
      this.nftContractControllerService.getAccountAddress() || '';
    if (accountAddress === '') {
      this.native.toast_trans('common.connectWallet');
      return;
    }
    this.native
      .showLoading('common.waitMoment', isDismiss => {}, 60000)
      .then(() => {
        this.buy();
      })
      .catch(() => {
        this.native.hideLoading();
      });
  }

  async buy() {
    let accountAddress = this.nftContractControllerService.getAccountAddress();
    let price = this.fixedPrice;
    let purchaseStatus = '';
    try {
      purchaseStatus = await this.nftContractControllerService
        .getPasar()
        .buyOrder(accountAddress, this.saleOrderId, price);
    } catch (error) {}

    purchaseStatus = purchaseStatus || '';

    this.native.hideLoading();
    if (purchaseStatus != '' && purchaseStatus != undefined) {
      let plist = this.feedService.getPasarList();
      plist = _.filter(plist, item => {
        return item.saleOrderId != this.saleOrderId;
      });

      plist = _.sortBy(plist, (item: any) => {
        return -Number(item.createTime);
      });

      this.nftPersistenceHelper.setPasarList(plist);

      // this.feedService.setPasarList(plist);
      // this.feedService.setData('feed.nft.pasarList', JSON.stringify(plist));

      let createAddress = this.nftContractControllerService.getAccountAddress();
      if (this.sellerAddress === createAddress) {
        // let alllist = this.feedService.getOwnNftCollectiblesList();
        let alllist = this.nftPersistenceHelper.getCollectiblesMap();
        let olist = alllist[createAddress] || [];
        olist = _.filter(olist, item => {
          return item.saleOrderId != this.saleOrderId;
        });
        //add created
        let cItem: any = _.cloneDeep(this.curAssetItem);
        cItem.fixedAmount = '';
        cItem['moreMenuType'] = 'created';
        olist.push(cItem);
        alllist[createAddress] = olist;

        this.nftPersistenceHelper.setCollectiblesMap(alllist);
        // this.feedService.setOwnNftCollectiblesList(alllist);
        // this.feedService.setData(
        //   'feed.nft.own.collectibles.list',
        //   JSON.stringify(alllist),
        // );
      }
      this.native.pop();
    } else {
      this.buyFail();
    }
  }

  buyFail() {
    this.popover = this.popupProvider.ionicAlert(
      this,
      // "ConfirmdialogComponent.signoutTitle",
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

  handleImg(imgUri: string) {
    if (imgUri.indexOf('feeds:imgage:') > -1) {
      imgUri = imgUri.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
      // imgUri = ApiUrl.nftGet + imgUri;
    }
    return imgUri;
  }

  hanldePrice(price: string) {
    return this.nftContractControllerService.transFromWei(price);
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
}
