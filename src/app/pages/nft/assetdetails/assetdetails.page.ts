import { Component, OnInit,ViewChild} from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { NativeService } from '../../../services/NativeService';
import { ThemeService } from '../../../services/theme.service';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
type detail = {
  type: string,
  details: string
}
@Component({
  selector: 'app-assetdetails',
  templateUrl: './assetdetails.page.html',
  styleUrls: ['./assetdetails.page.scss'],
})
export class AssetdetailsPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public contractDetails:detail[]= [];
  public owner:string = "test";
  public name:string = "test";
  public description:string = "test";
  public quantity:string = "1";
  public dateCreated:string = "2020-04-22";
  public contractAddress:string = "0x127b53641289999999";
  public tokenID:string = "0dklnhk678chjjkllkmnk1";

  public purchaseInfos:detail[] = [];
  public creator:string = "AnnaNFT45";
  public datePurchased:string = "2020-05-06";
  public price:number = 100;
  public currency:string = "ELASC";
  public type:string = "Bid"
  public purchaseInfoQuantity:string = "1";
  public isShowPurchaseInfo:boolean = true;
  constructor(
    private translate:TranslateService,
    private event:Events,
    private native:NativeService,
    private titleBarService:TitleBarService,
    public theme:ThemeService) { }

  ngOnInit() {

  }

  ionViewWillEnter() {
    this.initTile();
    this.collectContractData();
    this.collectPurchaseInfos();
    this.addEvent();
  }

  ionViewWillLeave(){
    this.removeEvent();
    this.event.publish(FeedsEvent.PublishType.search);
  }

  initTile(){
    this.titleBarService.setTitle(this.titleBar,this.translate.instant('AssetdetailsPage.title'));
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar,true);
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

    this.contractDetails.push({
      type:'AssetdetailsPage.dateCreated',
      details:this.dateCreated
    });

    this.contractDetails.push({
      type:'AssetdetailsPage.contractAddress',
      details:this.contractAddress
    });

    this.contractDetails.push({
      type:'AssetdetailsPage.tokenID',
      details:this.tokenID
    });


   }

   collectPurchaseInfos(){
     this.purchaseInfos = [];
     this.purchaseInfos.push({
      type:'AssetdetailsPage.creator',
      details:this.creator
    });

    this.purchaseInfos.push({
      type:'AssetdetailsPage.datePurchased',
      details:this.datePurchased
    });

    this.purchaseInfos.push({
      type:'AssetdetailsPage.price',
      details:this.price.toString()
    });

    this.purchaseInfos.push({
      type:'AssetdetailsPage.currency',
      details:this.currency
    });

    this.purchaseInfos.push({
      type:'AssetdetailsPage.type',
      details:this.type
    });

    this.purchaseInfos.push({
      type:'AssetdetailsPage.quantity',
      details:this.purchaseInfoQuantity
    });

   }

   clickArrow(){
     this.isShowPurchaseInfo = !this.isShowPurchaseInfo;
   }

   purchaseInfoBurn(){
     this.native.navigateForward(['bid'],{queryParams:{"showType":"burn"}});
   }
}
