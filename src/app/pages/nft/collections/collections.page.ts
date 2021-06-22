import { Component,OnInit,ViewChild} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from "@ngx-translate/core";
import { FeedService } from '../../../services/FeedService';
import { ThemeService } from '../../../services/theme.service';
import { NativeService } from '../../../services/NativeService';
import { Events } from '../../../services/events.service';
import { TitleBarService } from '../../../services/TitleBarService';
import { TitleBarComponent } from '../../..//components/titlebar/titlebar.component';
import { Web3Service } from '../../../services/Web3Service';
import { HttpService } from '../../../services/HttpService';
import { ApiUrl } from '../../../services/ApiUrl';
@Component({
  selector: 'app-collections',
  templateUrl: './collections.page.html',
  styleUrls: ['./collections.page.scss'],
})
export class CollectionsPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public nodeId:string = "";
  public channelId:number = null;
  public selectType:string = "CollectionsPage.created";
  public createdList = [];
  public purchasedList = [];
  public onSaleList = [];
  public likesList:any = [];
  public isMine:number = null;
  public isLoading:boolean =true;
  constructor(
    private translate:TranslateService,
    private event:Events,
    private native: NativeService,
    private activatedRoute:ActivatedRoute,
    private feedService: FeedService,
    private titleBarService:TitleBarService,
    private web3Service:Web3Service,
    private httpService:HttpService,
    public theme:ThemeService,) { }

  ngOnInit(){
    this.activatedRoute.queryParams.subscribe(queryParams => {
      this.nodeId = queryParams.nodeId;
      this.channelId = queryParams.channelId;
    });
  }

  ionViewWillEnter() {
    this.isMine = this.checkChannelIsMine();
    this.getNftCreated();
    this.initTile();
    this.addEvent();
  }

  ionViewWillLeave(){
    this.removeEvent();
    this.event.publish(FeedsEvent.PublishType.search);
    this.event.publish(FeedsEvent.PublishType.notification);
    this.event.publish(FeedsEvent.PublishType.addProflieEvent);
  }

  initTile(){
    this.titleBarService.setTitle(this.titleBar,this.translate.instant('CollectionsPage.title'));
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

   changeType(type:string){
    this.selectType = type;
    switch(type){
      case 'CollectionsPage.created':
        this.isLoading = true;
         this.getNftCreated();
        break;
      case 'CollectionsPage.purchased':
        this.isLoading = true;
        this.getPurchased();
        break;
      case 'CollectionsPage.onSale':
        this.isLoading = true;
        this.getOnSale();
        break;
      case 'CollectionsPage.likes':
          this.isLoading = true;
          this.likesList = [];
          this.isLoading = false;
          break;
    }
  }

  addAsset(){
    this.native.navigateForward(['mintnft'],{});
  }

  clickAssetItem(assetitem:any){
    this.native.navigateForward(['assetdetails'],{queryParams:assetitem});
  }

  checkChannelIsMine(){
    if (this.feedService.checkChannelIsMine(this.nodeId, this.channelId))
      return 0;

    return 1;
  }

 async getNftCreated(){
    this.createdList = [];
    let web3 = await this.web3Service.getWeb3Js();
    this.getTotalSupply(web3);
 }

 async getTotalSupply(web3:any){
  let pasarAbi = this.web3Service.getPasarAbi();
  let pasarAddr = this.web3Service.getPasarAddr();
  const pasarContract = new web3.eth.Contract(pasarAbi,pasarAddr);
  let openOrderCount =  await pasarContract.methods.getOpenOrderCount().call();
  for(let index =0; index<openOrderCount;index++){
      this.tokenIdByIndex(pasarContract,index);
  }
}

async tokenIdByIndex(pasarContract:any,index:any){
   let openOrder =  await pasarContract.methods.getOpenOrderByIndex(index).call();
   let tokenId = openOrder[3];
   //let saleOrderId = openOrder[0];
   let price = openOrder[5];
   this.getUri(tokenId,price);
}

async getUri(tokenId:string,price:any){
  let web3 = await this.web3Service.getWeb3Js();
  let stickerAbi = this.web3Service.getStickerAbi();
  let stickerAddr = this.web3Service.getStickerAddr();
  const stickerContract = new web3.eth.Contract(stickerAbi,stickerAddr);
  let feedsUri =  await stickerContract.methods.uri(tokenId).call();
  this.handleFeedsUrl(feedsUri,tokenId,price);
}

handleFeedsUrl(feedsUri:string,tokenId:string,price:any){
  feedsUri  = feedsUri.replace("feeds:json:","");
  console.log(feedsUri);
  this.httpService.ajaxGet(ApiUrl.nftGet+feedsUri,false).then((result)=>{
  let type = result["type"] || "single";
  let royalties = result["royalties"] || "1";
  let quantity = result["quantity"] || "1";
  let fixedAmount = price || "1";
  let minimumAmount = result["minimumAmount"] || "";
  let item = {
      "tokenId":tokenId,
      "asset":result["image"],
      "name":result["name"],
      "description":result["description"],
      "fixedAmount":fixedAmount,
      "minimumAmount":minimumAmount,
      "kind":result["kind"],
      "type":type,
      "royalties":royalties,
      "quantity":quantity
  }
  try{
    this.createdList.push(item);
    this.isLoading = false;
  }catch(err){
   console.log("====err===="+JSON.stringify(err));
  }
  }).catch(()=>{

  });
}

async getPurchased(){
  this.purchasedList = [];
  let web3 = await this.web3Service.getWeb3Js();
  let pasarAbi = this.web3Service.getPasarAbi();
  let pasarAddr = this.web3Service.getPasarAddr();
  const pasarContract = new web3.eth.Contract(pasarAbi,pasarAddr);
  let purchasedCount = await pasarContract.methods.getBuyerCount().call();
  console.log("======purchasedCount======="+purchasedCount);
  for(let index = 0;index<purchasedCount;index++){
     let purchased = await pasarContract.methods.getBuyerByIndex(index).call();
     let buyerAddr = purchased[1];
     let orderCount = purchased[2];
    this.handleBuyOrder(web3,pasarContract,buyerAddr,orderCount);
      }
}

async getOnSale(){
  this.onSaleList = [];
  let web3 = await this.web3Service.getWeb3Js();
  let pasarAbi = this.web3Service.getPasarAbi();
  let pasarAddr = this.web3Service.getPasarAddr();
  const pasarContract = new web3.eth.Contract(pasarAbi,pasarAddr);
  let sellerCountCount = await pasarContract.methods.getSellerCount().call();
  console.log("=====sellerCountCount======"+sellerCountCount);
  for(let index = 0;index<sellerCountCount;index++){
     let seller = await pasarContract.methods.getSellerByIndex(index).call();
     let sellerAddr = seller[1];
     let orderCount = seller[2];
     this.handleOrder(web3,pasarContract,sellerAddr,orderCount);
    }
}

async handleOrder(web3:any,pasarContract:any,sellerAddr:any,orderCount:any){
   for(let index=0;index<orderCount;index++){
    let sellerOrder =  await pasarContract.methods.getSellerOpenByIndex(sellerAddr,index).call();
    let tokenId = sellerOrder[3];
    let saleOrderId = sellerOrder[0];
    let price = sellerOrder[5];
    let stickerAbi = this.web3Service.getStickerAbi();
    let stickerAddr = this.web3Service.getStickerAddr();
    const stickerContract = new web3.eth.Contract(stickerAbi,stickerAddr);
    let feedsUri =  await stickerContract.methods.uri(tokenId).call();
    feedsUri  = feedsUri.replace("feeds:json:","");
    console.log(feedsUri);
    this.httpService.ajaxGet(ApiUrl.nftGet+feedsUri,false).then((result)=>{
     let type = result["type"] || "single";
     let royalties = result["royalties"] || "1";
     let quantity = result["quantity"] || "1";
     let fixedAmount = price || "1";
     //let minimumAmount = result["minimumAmount"] || "";
     let item = {
         "saleOrderId":saleOrderId,
         "tokenId":tokenId,
         "asset":result["image"],
         "name":result["name"],
         "description":result["description"],
         "fixedAmount":fixedAmount,
         "kind":result["kind"],
         "type":type,
         "royalties":royalties,
         "quantity":quantity
     }
     try{
       this.onSaleList.push(item);
       this.isLoading = false;
     }catch(err){
     console.log("====err===="+JSON.stringify(err));
     }
     }).catch(()=>{

     });

   }
}

async handleBuyOrder(web3:any,pasarContract:any,buyerAddr:any,orderCount:any){
  for(let index=0;index<orderCount;index++){
    let purchasedOrder =  await pasarContract.methods.getBuyerOrderByIndex(buyerAddr,index).call();
    let tokenId = purchasedOrder[3];
    let saleOrderId = purchasedOrder[0];
    let price = purchasedOrder[5];

    let stickerAbi = this.web3Service.getStickerAbi();
    let stickerAddr = this.web3Service.getStickerAddr();
    const stickerContract = new web3.eth.Contract(stickerAbi,stickerAddr);
    let feedsUri =  await stickerContract.methods.uri(tokenId).call();
    feedsUri  = feedsUri.replace("feeds:json:","");
    console.log(feedsUri);
    this.httpService.ajaxGet(ApiUrl.nftGet+feedsUri,false).then((result)=>{
     let type = result["type"] || "single";
     let royalties = result["royalties"] || "1";
     let quantity = result["quantity"] || "1";
     let fixedAmount = price || "1";
     let minimumAmount = result["minimumAmount"] || "";
     let item = {
         "saleOrderId":saleOrderId,
         "tokenId":tokenId,
         "asset":result["image"],
         "name":result["name"],
         "description":result["description"],
         "fixedAmount":fixedAmount,
         "minimumAmount":minimumAmount,
         "kind":result["kind"],
         "type":type,
         "royalties":royalties,
         "quantity":quantity
     }
     try{
       this.purchasedList.push(item);
       this.isLoading = false;
     }catch(err){
     console.log("====err===="+JSON.stringify(err));
     }
     }).catch(()=>{

     });
  }
}
}
