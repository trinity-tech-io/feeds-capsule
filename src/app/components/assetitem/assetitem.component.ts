import { Component, OnInit,Input,Output,EventEmitter} from '@angular/core';
import { ApiUrl } from '../../services/ApiUrl';
import { Web3Service } from '../../services/Web3Service';
@Component({
  selector: 'app-assetitem',
  templateUrl: './assetitem.component.html',
  styleUrls: ['./assetitem.component.scss'],
})
export class AssetitemComponent implements OnInit {
  @Input () type = "";
  @Input () assetItem:any = null;
  @Output() clickAssetItem = new EventEmitter();
  @Output() clickMore = new EventEmitter();
  public styleObj:any = {width:""};
  constructor(
    private web3Service:Web3Service
  ) { }

  ngOnInit() {

    this.styleObj.width = (screen.width-20-10)/2 +"px";
    console.log("======width======="+this.styleObj.width);
  }

  clickItem(){
    this.clickAssetItem.emit(this.assetItem);
  }

  more(){
    let obj = {"type":this.type,"assetItem":this.assetItem}
    this.clickMore.emit(obj);
  }

  hanldeImg(imgUri:string){
    if(imgUri.indexOf("feeds:imgage:")>-1){
      imgUri = imgUri.replace("feeds:imgage:","");
      imgUri = ApiUrl.nftGet+imgUri;
    }
    return imgUri;
  }

  hanldePrice(price:string){
     if(price!="")
     return this.web3Service.getFromWei(price);

     return price;
  }

}
