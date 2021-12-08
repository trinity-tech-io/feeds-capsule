import { Component, OnInit, ViewChild} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { PasarAssistService } from 'src/app/services/pasar_assist.service';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { NFTContractHelperService } from 'src/app/services/nftcontract_helper.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { MenuService } from 'src/app/services/MenuService';
import { Events } from 'src/app/services/events.service';
import { CarrierService } from 'src/app/services/CarrierService';

@Component({
  selector: 'app-channelcollections',
  templateUrl: './channelcollections.page.html',
  styleUrls: ['./channelcollections.page.scss'],
})
export class ChannelcollectionsPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public channelCollectionsList: FeedsData.ChannelCollections[] = [];
  public isLoadingData:boolean =  true;
  public isLoading: boolean = false;
  public loadingTitle: string = "";
  public loadingText: string = "";
  public loadingCurNumber: string = "";
  public loadingMaxNumber: string = "";
  constructor(
    private titleBarService: TitleBarService,
    private translate: TranslateService,
    private pasarAssistService: PasarAssistService,
    private nftContractControllerService: NFTContractControllerService,
    private nftContractHelperService: NFTContractHelperService,
    private ipfsService: IPFSService,
    private menuService: MenuService,
    private events: Events,
    private carrierService: CarrierService,
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
    this.addEvent();
    this.getChannelCollectionsList();
    console.log("=channelCollectionsList=",this.channelCollectionsList)
  }

  ionViewWillLeave() {
     this.removeEvent();
     this.events.publish(FeedsEvent.PublishType.addProflieEvent);
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('ChannelcollectionsPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

 async getChannelCollectionsList() {
    let type = "&types=feeds-channel";
    let result:any  = await this.pasarAssistService.listOwnSticker(type);
    let list = result.data.result || [];
    if(list.length === 0){
      this.channelCollectionsList = [];
      return;
    }
    for(let index = 0; index<list.length;index++){
      let channelCollections: FeedsData.ChannelCollections = {
        tokenId: '',
        nodeId: '',
        did: '',
        name: '',
        description: '',
        url: '',
        feedsUrlHash: '',
        ownerName: '',
        ownerDid: '',
        curQuantity: '1',
      };
      let item = list[index];
      channelCollections.tokenId = item.tokenId;
      channelCollections.name = item.name;
      channelCollections.description = item.description;
      channelCollections.feedsUrlHash = item.tokenIdHex.replace("0x","");
      channelCollections.ownerDid = item.tokenDid.did;

    let tokenInfo =  await this.nftContractControllerService
      .getSticker().tokenInfo(channelCollections.tokenId);

    let tokenUri = tokenInfo[3]; //tokenUri
    tokenUri = this.nftContractHelperService.parseTokenUri(tokenUri);
    const tokenJson = await this.ipfsService
    .nftGet(this.ipfsService.getNFTGetUrl() + tokenUri);
    let url: string = tokenJson["entry"]["url"];
    channelCollections.url = url;
    channelCollections.ownerName = "";
    let urlArr = url.replace("feeds://","").split("/");
    channelCollections.did = urlArr[0];
    let carrierAddress = urlArr[1];
    let nodeId = await this.carrierService.getIdFromAddress(carrierAddress,()=>{});
    channelCollections.nodeId = nodeId;
    this.channelCollectionsList.push(channelCollections);
    }
    this.isLoadingData = false;
  }

  doRefresh(event: any) {

  }

  clickMore(parm: any) {
    console.log("=====obj=====",parm);
    let channelItem = parm['channelItem'];
    this.hanldeChannelCollectionsMenu(channelItem);
  }

  hanldeChannelCollectionsMenu(channelItem :FeedsData.ChannelCollections){
    this.menuService.showChannelCollectionsMenu(channelItem);
  }

  addEvent(){
    this.events.subscribe(FeedsEvent.PublishType.startLoading, (obj) => {
      let title = obj["title"];
      let des = obj["des"];
      let curNum = obj["curNum"];
      let maxNum = obj["maxNum"];
      this.loadingTitle = title;
      this.loadingText = des;
      this.loadingCurNumber = curNum;
      this.loadingMaxNumber = maxNum;
      this.isLoading = true;
    });

    this.events.subscribe(FeedsEvent.PublishType.endLoading, (obj) => {
      this.isLoading = false;
    });

    this.events.subscribe(FeedsEvent.PublishType.nftUpdateList, obj => {
      // let type = obj['type'];
      // let burnNum = obj["burnNum"] || "0";
      // let sellQuantity = obj["sellQuantity"] || "0";
      // let assItem = obj['assItem'];
      // let createAddr = this.nftContractControllerService.getAccountAddress();
      this.getChannelCollectionsList();
    });
  }

  removeEvent() {
    this.events.unsubscribe(FeedsEvent.PublishType.nftUpdateList);
    this.events.unsubscribe(FeedsEvent.PublishType.startLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.endLoading);
  }

}
