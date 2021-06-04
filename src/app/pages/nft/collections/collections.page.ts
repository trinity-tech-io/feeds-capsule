import { Component,OnInit,ViewChild} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from "@ngx-translate/core";
import { FeedService } from '../../../services/FeedService';
import { ThemeService } from '../../../services/theme.service';
import { NativeService } from '../../../services/NativeService';
import { Events } from '../../../services/events.service';
import { TitleBarService } from '../../../services/TitleBarService';
import { TitleBarComponent } from '../../..//components/titlebar/titlebar.component';
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
  public createdList:any = [];
  public purchasedList:any = [];
  public onSaleList:any = [];
  public likesList:any = [];
  public isMine:number = null;
  constructor(
    private translate:TranslateService,
    private event:Events,
    private native: NativeService,
    private activatedRoute:ActivatedRoute,
    private feedService: FeedService,
    private titleBarService:TitleBarService,
    public theme:ThemeService,) { }

  ngOnInit(){
    this.activatedRoute.queryParams.subscribe(queryParams => {
      this.nodeId = queryParams.nodeId;
      this.channelId = queryParams.channelId;
    });
  }

  ionViewWillEnter() {
    this.isMine = this.checkChannelIsMine();
    this.createdList = this.feedService.getNftAssetList();
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
        this.createdList = this.feedService.getNftAssetList();
        break;
      case 'CollectionsPage.purchased':
        this.purchasedList = this.feedService.getNftAssetList();
        break;
      case 'CollectionsPage.onSale':
        this.onSaleList = this.feedService.getNftAssetList();
        break;
      case 'CollectionsPage.likes':
          this.likesList = this.feedService.getNftAssetList();
          break;
    }
  }

  addAsset(){
    this.native.navigateForward(['mintnft'],{});
  }

  clickAssetItem(){
    this.native.navigateForward(['assetdetails'],{});
  }

  checkChannelIsMine(){
    if (this.feedService.checkChannelIsMine(this.nodeId, this.channelId))
      return 0;

    return 1;
  }

}
