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
    this.getTotalSupply();
 }

 async getTotalSupply(){
  const pasarContract = this.web3Service.getPasar();
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
   let stickerContract = this.web3Service.getSticker();
   let tokenInfo = await stickerContract.methods.tokenInfo(tokenId).call();
   let tokenUri = tokenInfo[3];
   let tokenNum = tokenInfo[2];
   this.getUri(tokenId,price,tokenUri,tokenNum);
}

async getUri(tokenId:string,price:any,tokenUri:any,tokenNum:any){
  this.handleFeedsUrl(tokenUri,tokenId,price,tokenNum);
}

handleFeedsUrl(feedsUri:string,tokenId:string,price:any,tokenNum:any){
  feedsUri  = feedsUri.replace("feeds:json:","");
  console.log(feedsUri);
  this.httpService.ajaxGet(ApiUrl.nftGet+feedsUri,false).then((result)=>{
  let type = result["type"] || "single";
  let royalties = result["royalties"] || "1";
  let quantity = tokenNum;
  let fixedAmount = price || "1";
  let thumbnail = result["thumbnail"] || "";
  if(thumbnail === ""){
    thumbnail = result["image"];
  }
  let item = {
      "tokenId":tokenId,
      "asset":result["image"],
      "name":result["name"],
      "description":result["description"],
      "fixedAmount":fixedAmount,
      "kind":result["kind"],
      "type":type,
      "royalties":royalties,
      "quantity":quantity,
      "thumbnail":thumbnail
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
  const pasarContract = this.web3Service.getPasar();
  let purchasedCount = await pasarContract.methods.getBuyerCount().call();
  for(let index = 0;index<purchasedCount;index++){
     let purchased = await pasarContract.methods.getBuyerByIndex(index).call();
     let buyerAddr = purchased[1];
     let orderCount = purchased[2];
    this.handleBuyOrder(pasarContract,buyerAddr,orderCount);
      }
}

async getOnSale(){
  this.onSaleList = [];
  const pasarContract = this.web3Service.getPasar();
  let sellerCountCount = await pasarContract.methods.getSellerCount().call();
  for(let index = 0;index<sellerCountCount;index++){
     let seller = await pasarContract.methods.getSellerByIndex(index).call();
     let sellerAddr = seller[1];
     let orderCount = seller[2];
     this.handleOrder(pasarContract,sellerAddr,orderCount);
    }
}

async handleOrder(pasarContract:any,sellerAddr:any,orderCount:any){
   for(let index=0;index<orderCount;index++){
    let sellerOrder =  await pasarContract.methods.getSellerOpenByIndex(sellerAddr,index).call();
    let tokenId = sellerOrder[3];
    let saleOrderId = sellerOrder[0];
    let price = sellerOrder[5];
    const stickerContract = this.web3Service.getSticker();
    let tokenInfo = await stickerContract.methods.tokenInfo(tokenId).call();
    let feedsUri= tokenInfo[3];
    feedsUri  = feedsUri.replace("feeds:json:","");
    let tokenNum = tokenInfo[2];
    this.httpService.ajaxGet(ApiUrl.nftGet+feedsUri,false).then((result)=>{
     let type = result["type"] || "single";
     let royalties = result["royalties"] || "1";
     let quantity = tokenNum;
     let fixedAmount = price || "1";
     let thumbnail = result["thumbnail"] || "";
     if(thumbnail === ""){
       thumbnail = result["image"];
     }
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
         "quantity":quantity,
         "thumbnail":thumbnail
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

async handleBuyOrder(pasarContract:any,buyerAddr:any,orderCount:any){
  for(let index=0;index<orderCount;index++){
    let purchasedOrder =  await pasarContract.methods.getBuyerOrderByIndex(buyerAddr,index).call();
    let tokenId = purchasedOrder[3];
    let saleOrderId = purchasedOrder[0];
    let price = purchasedOrder[5];

    const stickerContract = this.web3Service.getSticker();
    let tokenInfo = await stickerContract.methods.tokenInfo(tokenId).call();
    let feedsUri= tokenInfo[3];
    feedsUri  = feedsUri.replace("feeds:json:","");
    let tokenNum = tokenInfo[2];
    this.httpService.ajaxGet(ApiUrl.nftGet+feedsUri,false).then((result)=>{
     let type = result["type"] || "single";
     let royalties = result["royalties"] || "1";
     let quantity = tokenNum;
     let fixedAmount = price || "1";
     let thumbnail = result["thumbnail"] || "";
     if(thumbnail === ""){
       thumbnail = result["image"];
     }
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
         "quantity":quantity,
         "thumbnail":thumbnail
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
