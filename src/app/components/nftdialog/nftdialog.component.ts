import { Component, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { PopoverController,NavParams} from '@ionic/angular';
import { ApiUrl } from '../../services/ApiUrl';
import { Web3Service } from '../../services/Web3Service';
import { NativeService } from 'src/app/services/NativeService';
import _ from 'lodash';

@Component({
  selector: 'app-nftdialog',
  templateUrl: './nftdialog.component.html',
  styleUrls: ['./nftdialog.component.scss'],
})
export class NftdialogComponent implements OnInit {
  public amount:any = "";
  public title: string = "";
  public saleOrderId:any = "";
  public assItem:any = {};
  public curAmount:any = "";
  constructor(
    private navParams: NavParams,
    private popover: PopoverController,
    private web3Service:Web3Service,
    private native:NativeService,
    public theme: ThemeService){

    }

  ngOnInit() {
    this.title = this.navParams.get('title');
    let assItem = this.navParams.get('assItem');
    this.curAmount =this.web3Service.getFromWei(this.assItem.fixedAmount);
    this.assItem =  _.cloneDeep(assItem);
    let price = this.assItem.fixedAmount || "";
    this.amount =this.web3Service.getFromWei(price);
    this.saleOrderId = this.assItem.saleOrderId || "";

  }

  confirm(){

    if(!this.number(this.amount)) {
      this.native.toastWarn('common.amountError');
      return;
    }

   if(this.amount <= 0) {
      this.native.toast_trans('common.amountError');
      return;
    }

    if(this.curAmount === this.amount){
      this.native.toast_trans('change price');
      return;
    }

    this.native.showLoading("common.waitMoment").then(()=>{
      this.changePrice();
    }).catch(()=>{
      this.native.hideLoading();
    })

  }

 async changePrice(){

  let pasarAddr = this.web3Service.getPasarAddr();
  let pasarContract = this.web3Service.getPasar();
  const accSeller = await this.web3Service.getAccount("04868f294d8ef6e1079752cd2e1f027a126b44ee27040d949a88f89bddc15f31");
  let price = this.web3Service.getToWei(this.amount.toString()).toString();
  const changeData = pasarContract.methods.changeOrderPrice(this.saleOrderId,price).encodeABI();
  const changeTx = {
    from:accSeller.address,
    to: pasarAddr,
    value: 0,
    data: changeData,
  };
  const { status: changeStatus } = await this.web3Service.sendTxWaitForReceipt(changeTx, accSeller);
  this.native.hideLoading();
  if(changeStatus!=""&&changeStatus!=undefined){
    alert("=====change Order Price sucess====");
    this.curAmount = this.amount;
    this.popover.dismiss();
  }else{
    alert("=====change Order Price fail====");
  }
}

  number(text:any) {
    var numPattern = /^(([1-9]\d*)|\d)(.\d{1,9})?$/;
    return numPattern.test(text);
  }

  cancel(){
    if(this.popover!=null){
      this.popover.dismiss();
    }
  }

  hanldeImg(){
    let imgUri = this.assItem["thumbnail"];
    if(imgUri.indexOf("feeds:imgage:")>-1){
      imgUri = imgUri.replace("feeds:imgage:","");
      imgUri = ApiUrl.nftGet+imgUri;
    }
    return imgUri;
  }

}
