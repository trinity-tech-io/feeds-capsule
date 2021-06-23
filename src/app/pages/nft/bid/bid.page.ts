import { Component,OnInit,ViewChild} from '@angular/core';
import { AlertController} from '@ionic/angular';
import { TranslateService } from "@ngx-translate/core";
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from '../../../services/theme.service';
import { NativeService } from '../../../services/NativeService';
import { Events } from '../../../services/events.service';
import { TitleBarService } from '../../../services/TitleBarService';
import { TitleBarComponent } from '../../..//components/titlebar/titlebar.component';
import { ApiUrl } from '../../../services/ApiUrl';
import { Web3Service } from '../../../services/Web3Service';
type detail = {
  type: string,
  details: string
}
@Component({
  selector: 'app-bid',
  templateUrl: './bid.page.html',
  styleUrls: ['./bid.page.scss'],
})
export class BidPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public contractDetails:detail[]= [];
  public owner:string = "test";
  public name:string = "test";
  public description:string = "test";
  public quantity:string = "1";
  public dateCreated:string = "";
  public expirationDate:string = "";
  public contractAddress:string = "";
  public tokenID:string = "";
  public blockchain:string = "Ethereum Sidechain (Elastos)";
  public fixedPrice:string = "17";
  public bibAmount:string = "";
  public minimumBid:string ="10";
  public currentBid:string ="";
  public showType:string = null;
  public assetUri:string = null;
  public royalties:string = null;
  public saleOrderId:string = null;
  public sellerAddress:string = null;
  constructor(
    private alertController:AlertController,
    private translate:TranslateService,
    private event:Events,
    private native:NativeService,
    private titleBarService:TitleBarService,
    public theme:ThemeService,
    private activatedRoute:ActivatedRoute,
    private web3Service:Web3Service
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(queryParams => {
      let asset = queryParams.asset || {};
      this.showType = queryParams.showType;
      this.owner = queryParams.name || "";
      this.name = queryParams.name || "";
      this.description = queryParams.description || "";
      this.quantity = queryParams.quantity || "1";
      this.tokenID = queryParams.tokenId || "";
      this.contractAddress = this.web3Service.getStickerAddr();
      this.assetUri = this.handleImg(asset);
      this.fixedPrice = queryParams.fixedAmount || "";
      this.royalties = queryParams.royalties || "";
      this.saleOrderId = queryParams.saleOrderId || "";
    });
  }

  ionViewWillEnter() {
    this.initTile();
    this.collectContractData();
    this.addEvent();
  }

  ionViewWillLeave(){
    this.removeEvent();
    this.event.publish(FeedsEvent.PublishType.search);
    this.event.publish(FeedsEvent.PublishType.notification);
    this.event.publish(FeedsEvent.PublishType.addProflieEvent);
    this.event.publish(FeedsEvent.PublishType.addBinaryEvevnt);
  }

  initTile(){
    this.titleBarService.setTitle(this.titleBar,this.translate.instant('BidPage.title'));
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar,true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

   addEvent(){
    this.event.subscribe(FeedsEvent.PublishType.updateTitle,()=>{
      this.initTile();
    });
   }

   removeEvent(){
    this.event.unsubscribe(FeedsEvent.PublishType.updateTitle);
   }

   collectContractData(){
    this.contractDetails = [];
    this.contractDetails.push({
      type:'AssetdetailsPage.owner',
      details:this.owner
    });

    this.contractDetails.push({
      type:'AssetdetailsPage.name',
      details:this.name
    });

    this.contractDetails.push({
      type:'AssetdetailsPage.description',
      details:this.description
    });

    this.contractDetails.push({
      type:'AssetdetailsPage.quantity',
      details:this.quantity
    });

    if(this.dateCreated!=""){
      this.contractDetails.push({
        type:'AssetdetailsPage.dateCreated',
        details:this.dateCreated
      });
    }

     if(this.expirationDate!=""){
      this.contractDetails.push({
        type:'MintnftPage.nftExpirationDate',
        details:this.expirationDate
      });
     }

    this.contractDetails.push({
      type:'AssetdetailsPage.contractAddress',
      details:this.contractAddress
    });

    this.contractDetails.push({
      type:'AssetdetailsPage.tokenID',
      details:this.tokenID
    });

    this.contractDetails.push({
      type:'BidPage.blockchain',
      details:this.blockchain
    });
   }

   clickBuy(){
    this.native.showLoading("common.waitMoment").then(()=>{
       this.buy();
   }).catch(()=>{
    this.native.hideLoading();
   });
   }

  async buy(){
    let pasarAddr = this.web3Service.getPasarAddr();
    const accBuyer = await this.web3Service.getAccount("04868f294d8ef6e1079752cd2e1f027a126b44ee27040d949a88f89bddc15f31");
    let pasarContract = this.web3Service.getPasar();
    const purchaseData = pasarContract.methods.buyOrder(this.saleOrderId).encodeABI();

    const purchaseTx = {
      from: accBuyer.address,
      to: pasarAddr,
      value:this.fixedPrice,
      data: purchaseData
    };

    const {
      status: purchaseStatus,
    } = await this.web3Service.sendTxWaitForReceipt(purchaseTx, accBuyer);
    this.native.hideLoading();
    if(purchaseStatus!=""&&purchaseStatus!=undefined){
        this.native.pop();
        //this.native.navigateForward(['confirmation'],{queryParams:{"showType":"buy"}});
    }else{
      alert("=====purchase fail====");
    }
   }

   bid(){
    this.native.navigateForward(['confirmation'],{queryParams:{"showType":"burn"}});
   }

   handleImg(imgUri:string){
    if(imgUri.indexOf("feeds:imgage:")>-1){
      imgUri = imgUri.replace("feeds:imgage:","");
      imgUri = ApiUrl.nftGet+imgUri;
    }
    return imgUri;
   }

  clickChangePrice(){
    this.presentAlertPrompt();
  }

 async changePrice(price:any){

    let pasarAddr = this.web3Service.getPasarAddr();
    let pasarContract = this.web3Service.getPasar();
    const accSeller = await this.web3Service.getAccount("04868f294d8ef6e1079752cd2e1f027a126b44ee27040d949a88f89bddc15f31");
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
      this.native.pop();
      //this.native.navigateForward(['confirmation'],{queryParams:{"showType":"buy"}});
    }else{
      alert("=====change Order Price fail====");
    }
   }

  clickCancelOrder(){
    this.native.showLoading("common.waitMoment").then(()=>{
      this.cancelOrder();
   }).catch(()=>{
    this.native.hideLoading();
   });
  }

  async cancelOrder(){

    let pasarAddr = this.web3Service.getPasarAddr();
    let pasarContract = this.web3Service.getPasar();
    const accSeller = await this.web3Service.getAccount("04868f294d8ef6e1079752cd2e1f027a126b44ee27040d949a88f89bddc15f31");

    const cancelData = pasarContract.methods.cancelOrder(this.saleOrderId).encodeABI();
    const cancelTx = {
      from: accSeller.address,
      to: pasarAddr,
      value: 0,
      data: cancelData,
    };
    const { status: cancelStatus } = await this.web3Service.sendTxWaitForReceipt(cancelTx, accSeller);
    this.native.hideLoading();
    if(cancelStatus!=""&&cancelStatus!=undefined){
      alert("=====cancel Order sucess====");
      this.native.pop();
      //this.native.navigateForward(['confirmation'],{queryParams:{"showType":"buy"}});
    }else{
      alert("=====cancel Order fail====");
    }
   }

   async presentAlertPrompt() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Prompt!',
      inputs: [
        {
          name: 'price',
          type: 'text',
          value:this.fixedPrice,
          placeholder: 'input change price'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {

          }
        }, {
          text: 'Ok',
          handler: (result) => {
            let price = result["price"] || "";
            if(price === ""){
              this.native.toast("input change price")
              return false;
            }
            this.native.showLoading("common.waitMoment").then(()=>{
              this.changePrice(price);
           }).catch(()=>{
            this.native.hideLoading();
           });

          }
        }
      ]
    });

    await alert.present();
  }

  hanldePrice(price:string){
    return this.web3Service.getFromWei(price);
  }

  copytext(text:any){
    let textdata = text || "";
    if(textdata!=""){
      this.native.copyClipboard(text).then(()=>{
        this.native.toast_trans("common.copysucceeded");
    }).catch(()=>{

    });;
    }
  }

}
