import { Component, OnInit,Input,Output,EventEmitter} from '@angular/core';
import { ApiUrl } from '../../services/ApiUrl';
// import { Web3Service } from '../../services/Web3Service';
import { ThemeService } from 'src/app/services/theme.service';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';

@Component({
  selector: 'app-newassetitem',
  templateUrl: './newassetitem.component.html',
  styleUrls: ['./newassetitem.component.scss'],
})
export class NewassetitemComponent implements OnInit {
  @Input () type = "";
  @Input () assetItem:any = null;
  @Output() clickAssetItem = new EventEmitter();
  @Output() clickMore = new EventEmitter();
  public styleObj:any = {width:""};
  constructor(
    // private web3Service:Web3Service,
    public theme: ThemeService,
    private nftContractControllerService: NFTContractControllerService
  ) { }

  ngOnInit() {
    this.styleObj.width = (screen.width-40) +"px";
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
     return this.nftContractControllerService.transFromWei(price);

     return price;
  }
}
