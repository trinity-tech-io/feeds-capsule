import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ApiUrl } from '../../services/ApiUrl';
// import { Web3Service } from '../../services/Web3Service';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
@Component({
  selector: 'app-assetitem',
  templateUrl: './assetitem.component.html',
  styleUrls: ['./assetitem.component.scss'],
})
export class AssetitemComponent implements OnInit {
  @Input() assetItem: any = null;
  @Output() clickAssetItem = new EventEmitter();
  @Output() clickMore = new EventEmitter();
  public styleObj: any = { width: '' };
  constructor(
    private nftContractControllerService: NFTContractControllerService,
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

  hanldeImg(imgUri: string) {
    if (imgUri.indexOf('feeds:imgage:') > -1) {
      imgUri = imgUri.replace('feeds:imgage:', '');
      imgUri = ApiUrl.nftGet + imgUri;
    }
    return imgUri;
  }

  hanldePrice(price: string) {
    if (price != null)
      return this.nftContractControllerService.transFromWei(price);

    return price;
  }

  onSale() {}
}
