import { Component, OnInit, Input, NgZone, Output, EventEmitter } from '@angular/core';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { ThemeService } from 'src/app/services/theme.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { UtilService } from 'src/app/services/utilService';
import { FileHelperService } from 'src/app/services/FileHelperService';

@Component({
  selector: 'app-assetitem',
  templateUrl: './assetitem.component.html',
  styleUrls: ['./assetitem.component.scss'],
})
export class AssetitemComponent implements OnInit {
  @Input() assetItem: any = null;
  @Input() elaPrice:string = null;
  @Output() clickAssetItem = new EventEmitter();
  @Output() clickMore = new EventEmitter();
  public styleObj: any = { width: '' };
  public imgUri = './assets/icon/reserve.svg';
  constructor(
    private nftContractControllerService: NFTContractControllerService,
    private viewHelper: ViewHelper,
    public theme: ThemeService,
    private ipfsService: IPFSService,
    private fileHelperService: FileHelperService,
    private zone: NgZone,
  ) {

  }

  ngOnInit() {
    console.log("AssetitemComponent assetItem", this.assetItem);
    this.styleObj.width = (screen.width - 20 - 10) / 2 + 'px';
    if(this.assetItem === null){
        return;
    }
    let fileName = "";
    let fetchUrl = "";

    let thumbnailUri = this.assetItem['thumbnail'];
    let kind = this.assetItem["kind"];
    if (kind === "gif") {
      thumbnailUri = this.assetItem['asset'];
    }

    if (thumbnailUri.indexOf('feeds:imgage:') > -1) {
      thumbnailUri = thumbnailUri.replace('feeds:imgage:', '');
      fileName = thumbnailUri;
      fetchUrl = this.ipfsService.getNFTGetUrl() + thumbnailUri;
    } else if (thumbnailUri.indexOf('feeds:image:') > -1) {
      thumbnailUri = thumbnailUri.replace('feeds:image:', '');
      fileName = thumbnailUri;
      fetchUrl = this.ipfsService.getNFTGetUrl() + thumbnailUri;
    }

    this.fileHelperService.getNFTData(fetchUrl, fileName, kind).then((data) => {
      this.zone.run(() => {
        this.imgUri = data;
      });
    });


    console.log('AssetitemComponent', this.assetItem['saleOrderId']);
  }

  clickItem() {
    this.clickAssetItem.emit(this.assetItem);
  }

  more() {
    let obj = { assetItem: this.assetItem };
    this.clickMore.emit(obj);
  }

  hanldeImg(assetItem: any) {
    return this.imgUri;
  }

  hanldePrice(price: string) {
    if (price != null)
      return this.nftContractControllerService.transFromWei(price);

    return price;
  }

  hanldeUsdPrice(ethPrice: string){
    let usdPrice = null;
    if(this.elaPrice != null){
      let ethprice = this.nftContractControllerService.transFromWei(ethPrice);
      usdPrice = UtilService.accMul(this.elaPrice,ethprice).toFixed(2);
    }
    return usdPrice;
  }


  onSale(){
    this.viewHelper.showNftPrompt(
      this.assetItem,
      'CollectionsPage.putOnSale',
      'created',
    );
  }

  handleCurQuantity(assetItem:any){
    //if(assetItem != null){
        return  assetItem['curQuantity'] || assetItem['quantity'];
    //}
  }
}
