import { Component, OnInit,Input,Output,EventEmitter} from '@angular/core';
import { ApiUrl } from '../../services/ApiUrl';
@Component({
  selector: 'app-assetitem',
  templateUrl: './assetitem.component.html',
  styleUrls: ['./assetitem.component.scss'],
})
export class AssetitemComponent implements OnInit {
  @Input () assetItem:any = null;
  @Output() clickAssetItem = new EventEmitter();
  constructor() { }

  ngOnInit() {}

  clickItem(){
    this.clickAssetItem.emit(this.assetItem);
  }

  hanldeImg(imgUri:string){
    if(imgUri.indexOf("feeds:imgage:")>-1){
      imgUri = imgUri.replace("feeds:imgage:","");
      imgUri = ApiUrl.nftGet+imgUri;
    }
    return imgUri;
  }

}
