import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { ThemeService } from 'src/app/services/theme.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { UtilService } from 'src/app/services/utilService';

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
  constructor(
    private nftContractControllerService: NFTContractControllerService,
    private viewHelper: ViewHelper,
    public theme: ThemeService,
    private ipfsService: IPFSService
  ) {}

  ngOnInit() {
    this.styleObj.width = (screen.width - 20 - 10) / 2 + 'px';
  }

  clickItem() {
    this.clickAssetItem.emit(this.assetItem);
  }

  more() {
    let obj = { assetItem: this.assetItem };
    this.clickMore.emit(obj);
  }

  hanldeImg(assetItem: any) {
   let imgUri = assetItem['thumbnail'];
   let kind = assetItem["kind"];
   if(kind === "gif"){
       imgUri = assetItem['asset'];
   }
   if (imgUri.indexOf('feeds:imgage:') > -1) {
      imgUri = imgUri.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }else if(imgUri.indexOf('feeds:image:') > -1){
      imgUri = imgUri.replace('feeds:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }
    return imgUri;
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
