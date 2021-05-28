import { Component,OnInit,ViewChild} from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from '../../../services/theme.service';
import { NativeService } from '../../../services/NativeService';
import { Events } from '../../../services/events.service';
import { TitleBarService } from '../../../services/TitleBarService';
import { TitleBarComponent } from '../../..//components/titlebar/titlebar.component';
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
  public dateCreated:string = "2020-04-22";
  public expirationDate:string = "2020-05-22";
  public contractAddress:string = "0x127b53641289999999";
  public tokenID:string = "0dklnhk678chjjkllkmnk1";
  public blockchain:string = "Ethereum Sidechain (Elastos)";
  public fixedPrice:string = "17";
  public bibAmount:string = "";
  public minimumBid:string ="10";
  public currentBid:string ="17";
  public showType:string = null;
  constructor(
    private translate:TranslateService,
    private event:Events,
    private native:NativeService,
    private titleBarService:TitleBarService,
    public theme:ThemeService,
    private activatedRoute:ActivatedRoute,
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(queryParams => {
      this.showType = queryParams.showType;
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

    this.contractDetails.push({
      type:'AssetdetailsPage.dateCreated',
      details:this.dateCreated
    });

    this.contractDetails.push({
      type:'MintnftPage.nftExpirationDate',
      details:this.expirationDate
    });

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

   buy(){
    this.native.navigateForward(['confirmation'],{queryParams:{"showType":"buy"}});
   }

   bid(){
    this.native.navigateForward(['confirmation'],{queryParams:{"showType":"burn"}});
   }

}
