import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { ThemeService } from 'src/app/services/theme.service';
import { IPFSService } from 'src/app/services/ipfs.service';

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
  public curQuantity:any = "";
  constructor(
    private nftContractControllerService: NFTContractControllerService,
    private viewHelper: ViewHelper,
    public theme: ThemeService,
    private ipfsService: IPFSService
  ) {}

  ngOnInit() {
    this.styleObj.width = (screen.width - 20 - 10) / 2 + 'px';
    this.curQuantity = this.assetItem['curQuantity'] || this.assetItem['quantity'];
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
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }
    return imgUri;
  }

  hanldePrice(price: string) {
    if (price != null)
      return this.nftContractControllerService.transFromWei(price);

    return price;
  }

  onSale(){
    this.viewHelper.showNftPrompt(
      this.assetItem,
      'CollectionsPage.putOnSale',
      'created',
    );
  }
}
