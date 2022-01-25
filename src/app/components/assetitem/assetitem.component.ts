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
  @Input() elaPrice: string = null;
  @Input() isAutoGet: string = null;
  @Input() thumbImageName: string = "thumbImage";
  @Output() clickAssetItem = new EventEmitter();
  @Output() clickMore = new EventEmitter();
  public styleObj: any = { width: '' };
  public imgUri = './assets/icon/reserve.svg';
  public thumbImageId: string = "";
  public maxSize: number = 5 * 1024 * 1024;
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
    this.styleObj.width = (screen.width - 20 - 10) / 2 + 'px';
    if (this.assetItem === null) {
      return;
    }
    let fileName = "";
    let fetchUrl = "";
    let version = this.assetItem['version'] || "1";
    let thumbnailUri = "";
    let kind = "";
    let size = "";
    if (version === "1") {
      thumbnailUri = this.assetItem['thumbnail'] || "";
      kind = this.assetItem["kind"];
      size = this.assetItem["originAssetSize"];
      if (!size)
      size = '0';
     if (kind === "gif" && parseInt(size) <= this.maxSize) {
      thumbnailUri = this.assetItem['asset'];
     }
    } else if (version === "2") {
      let jsonData = this.assetItem['data'] || "";
      if (jsonData != "") {
        thumbnailUri = jsonData['thumbnail'] || "";
        kind = jsonData["kind"];
        size = jsonData["size"];
        if (!size)
        size = '0';
      if (kind === "gif" && parseInt(size) <= this.maxSize) {
        thumbnailUri = jsonData['image'] || "";
      }
      } else {
        thumbnailUri = "";
      }
    }
    if (thumbnailUri === "") {
      return "";
    }

    if (thumbnailUri.indexOf('feeds:imgage:') > -1) {
      thumbnailUri = thumbnailUri.replace('feeds:imgage:', '');
      fileName = thumbnailUri;
      fetchUrl = this.ipfsService.getNFTGetUrl() + thumbnailUri;
    } else if (thumbnailUri.indexOf('feeds:image:') > -1) {
      thumbnailUri = thumbnailUri.replace('feeds:image:', '');
      fileName = thumbnailUri;
      fetchUrl = this.ipfsService.getNFTGetUrl() + thumbnailUri;
    } else if (thumbnailUri.indexOf('pasar:image:') > -1) {
      thumbnailUri = thumbnailUri.replace('pasar:image:', '');
      fileName = thumbnailUri;
      fetchUrl = this.ipfsService.getNFTGetUrl() + thumbnailUri;
    }

    this.thumbImageId = thumbnailUri;
    this.isAutoGet = this.isAutoGet || "";
    if (this.isAutoGet === "") {
      this.fileHelperService.getNFTData(fetchUrl, fileName, kind).then((data) => {
        this.zone.run(() => {
          this.imgUri = data;
        });
      });
    }
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

  hanldeUsdPrice(ethPrice: string) {
    let usdPrice = null;
    if (this.elaPrice != null) {
      let ethprice = this.nftContractControllerService.transFromWei(ethPrice);
      usdPrice = UtilService.accMul(this.elaPrice, ethprice).toFixed(2);
    }
    return usdPrice;
  }


  onSale() {
    this.viewHelper.showNftPrompt(
      this.assetItem,
      'CollectionsPage.putOnSale',
      'created',
    );
  }

  handleCurQuantity(assetItem: any) {
    //if(assetItem != null){
    return assetItem['curQuantity'] || assetItem['quantity'];
    //}
  }
}
