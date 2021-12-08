import { Component, NgZone, OnInit, ViewChild} from '@angular/core';
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
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { FileHelperService } from 'src/app/services/FileHelperService';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import _ from 'lodash';
@Component({
  selector: 'app-channelcollections',
  templateUrl: './channelcollections.page.html',
  styleUrls: ['./channelcollections.page.scss'],
})
export class ChannelcollectionsPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public channelCollectionList: FeedsData.ChannelCollections[] = [];
  public isLoadingData:boolean =  true;
  public isLoading: boolean = false;
  public loadingTitle: string = "";
  public loadingText: string = "";
  public loadingCurNumber: string = "";
  public loadingMaxNumber: string = "";
  private clientHeight: number = 0;
  private accountAddress: string = "";
  public channelCollectionsAvatarisLoad: any = {};
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
    private native: NativeService,
    private fileHelperService: FileHelperService,
    private zone: NgZone,
    private walletConnectControllerService: WalletConnectControllerService,
    public theme: ThemeService
  ) { }

  ngOnInit() {

  }

  ionViewWillEnter() {
    this.clientHeight = screen.availHeight;
    this.accountAddress = this.walletConnectControllerService.getAccountAddress() || "";
    this.initTitle();
    this.addEvent();
    this.native.showLoading('common.waitMoment');
    this.getChannelCollectionsList();
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
    this.channelCollectionList = [];
    let type = "&types=feeds-channel";
    let result:any  = await this.pasarAssistService.listOwnSticker(type);
    let list = result.data.result || [];
    if(list.length === 0){
      this.channelCollectionList = [];
      return;
    }
    for(let index = 0; index<list.length;index++){
      let channelCollections: FeedsData.ChannelCollections = this.getChannelCollections()
      let item = list[index];
      channelCollections.status = "0";
      channelCollections.userAddr = this.accountAddress;
      channelCollections.panelId = "";
      channelCollections.tokenId = item.tokenId;
      channelCollections.type = item.type;
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
    let avatar: FeedsData.GalleriaAvatar = tokenJson["avatar"];
    channelCollections.avatar = avatar;
    channelCollections.url = url;
    channelCollections.ownerName = "";
    let urlArr = url.replace("feeds://","").split("/");
    channelCollections.did = urlArr[0];
    let carrierAddress = urlArr[1];
    let nodeId = await this.carrierService.getIdFromAddress(carrierAddress,()=>{});
    channelCollections.nodeId = nodeId;
    this.channelCollectionList.push(channelCollections);
    }
    await this.getActivePanelList();
    console.log("====this.channelCollectionList====",this.channelCollectionList);
    this.isLoadingData = false;
    this.refreshChannelCollectionAvatar();
    this.native.hideLoading();
  }

  doRefresh(event) {
    this.refreshChannelCollectionAvatar();
    event.target.complete();
  }

  clickMore(parm: any) {
    let channelItem: FeedsData.ChannelCollections = parm['channelItem'];
    this.hanldeChannelCollectionsMenu(channelItem);
  }

  hanldeChannelCollectionsMenu(channelItem :FeedsData.ChannelCollections){
    let status = channelItem.status;
    if(status === "0"){
      this.menuService.showChannelCollectionsMenu(channelItem);
    }else{
      this.menuService.showChannelCollectionsPublishedMenu(channelItem);
    }
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

    this.events.subscribe(FeedsEvent.PublishType.nftCancelChannelOrder,(channelCollections: FeedsData.ChannelCollections)=>{
        console.log("====channelCollections====",channelCollections);
        let tokenId = channelCollections.tokenId;
        let itemIndex = _.findIndex(this.channelCollectionList,(item)=>{
          return item.tokenId === tokenId;
        });
        console.log("==itemIndex==",itemIndex);
        let newChannelCollections = _.cloneDeep(channelCollections);
            newChannelCollections.panelId = "";
            newChannelCollections.status = "0";
        this.channelCollectionList.splice(itemIndex,1,newChannelCollections);
        console.log("==channelCollectionList==",this.channelCollectionList);
        this.refreshChannelCollectionAvatar();
    });

    this.events.subscribe(FeedsEvent.PublishType.nftUpdateList, obj => {
      let tokenId = obj['tokenId'];
      let panelId = obj['panelId'];
      let itemIndex = _.findIndex(this.channelCollectionList,(item)=>{
        return item.tokenId === tokenId;
      });

      let newChannelCollections = _.cloneDeep(this.channelCollectionList[itemIndex]);
      newChannelCollections.panelId = panelId;
      newChannelCollections.status = "1";
      this.channelCollectionList.splice(itemIndex,1,newChannelCollections);
      console.log("==channelCollectionList==",this.channelCollectionList);
      this.refreshChannelCollectionAvatar();
    });
  }

  removeEvent() {
    this.events.unsubscribe(FeedsEvent.PublishType.nftUpdateList);
    this.events.unsubscribe(FeedsEvent.PublishType.startLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.endLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.nftCancelChannelOrder);
  }

  ionScroll() {
    this.native.throttle(this.setChannelCollectionAvatar(), 200, this, true);
  }

  setChannelCollectionAvatar(){
    let discoverSquareFeed = document.getElementsByClassName("channelCollectionsAvatar") || [];
    let len = discoverSquareFeed.length;
    console.log("==len==",len);
    for(let itemIndex = 0;itemIndex<len;itemIndex++){
      let item = discoverSquareFeed[itemIndex];
      let arr = item.getAttribute("id").split("-");
      let avatarUri = arr[1];
      let kind = arr[2];
      let thumbImage =  document.getElementById('channelCollectionsPage-avatar-'+avatarUri);
      let srcStr =  thumbImage.getAttribute("src") || "";
      let isload = this.channelCollectionsAvatarisLoad[avatarUri] || '';
      try {
         if (
          avatarUri != '' &&
           thumbImage.getBoundingClientRect().top >= -100 &&
           thumbImage.getBoundingClientRect().top <= this.clientHeight
         ) {
           if(isload === ""){
            this.channelCollectionsAvatarisLoad[avatarUri] = '12';
            let fetchUrl = this.ipfsService.getNFTGetUrl() + avatarUri;
            this.fileHelperService.getNFTData(fetchUrl,avatarUri, kind).then((data) => {
              this.zone.run(() => {
                this.channelCollectionsAvatarisLoad[avatarUri] = '13';
                let dataSrc = data || "";
                if(dataSrc!=""){
                  thumbImage.setAttribute("src",data);
                }
              });
            }).catch((err)=>{
              if(this.channelCollectionsAvatarisLoad[avatarUri] === '13'){
                this.channelCollectionsAvatarisLoad[avatarUri] = '';
                thumbImage.setAttribute('src', './assets/icon/reserve.svg');
               }
            });

           }
         }else{
           srcStr = thumbImage.getAttribute('src') || '';
           if (
             thumbImage.getBoundingClientRect().top < -100 &&
             this.channelCollectionsAvatarisLoad[avatarUri] === '13' &&
             srcStr != './assets/icon/reserve.svg'
           ) {
            this.channelCollectionsAvatarisLoad[avatarUri] = '';
             thumbImage.setAttribute('src', './assets/icon/reserve.svg');
           }
         }
      } catch (error) {
        this.channelCollectionsAvatarisLoad[avatarUri] = '';
       thumbImage.setAttribute('src', './assets/icon/reserve.svg');
      }
    }
  }

  refreshChannelCollectionAvatar(){
    let sid = setTimeout(()=>{
      this.channelCollectionsAvatarisLoad = {};
      this.setChannelCollectionAvatar();
      clearTimeout(sid);
    },100);
  }

  getChannelAvatarUri(channelCollections: FeedsData.ChannelCollections) {
    let channelAvatar = channelCollections.avatar.image;
    let kind = channelCollections.avatar.kind;
    let channelAvatarUri = "";
    if (channelAvatar.indexOf('feeds:imgage:') > -1) {
      channelAvatarUri = channelAvatar.replace('feeds:imgage:', '');
    } else if (channelAvatar.indexOf('feeds:image:') > -1) {
      channelAvatarUri = channelAvatar.replace('feeds:image:', '');
    }
    return "channelCollectionsPage-"+channelAvatarUri+"-"+kind;
  }

  async getActivePanelList(){
    let activePanelCount = await this.nftContractControllerService.getGalleria().getActivePanelCount();
    for (let index = 0; index < activePanelCount; index++) {
      try {
        const item:any = await this.nftContractControllerService.getGalleria().getActivePanelByIndex(index);
        /*userAddr:2*/
        if(this.accountAddress === item[2]){
        let channelCollections: FeedsData.ChannelCollections = this.getChannelCollections();
        channelCollections.panelId = item[0];
        channelCollections.userAddr = item[2]
        channelCollections.type = "feeds-channel";
        channelCollections.status = "1";
        channelCollections.tokenId = item[3];
      let tokenInfo =  await this.nftContractControllerService
        .getSticker().tokenInfo(channelCollections.tokenId);
      let tokenUri = tokenInfo[3]; //tokenUri
      tokenUri = this.nftContractHelperService.parseTokenUri(tokenUri);
      const tokenJson = await this.ipfsService
      .nftGet(this.ipfsService.getNFTGetUrl() + tokenUri);
      let url: string = tokenJson["entry"]["url"];
      let avatar: FeedsData.GalleriaAvatar = tokenJson["avatar"];
      channelCollections.name = tokenJson["name"];
      channelCollections.description = tokenJson["description"];
      channelCollections.avatar = avatar;
      channelCollections.url = url;
      channelCollections.ownerName = "";
      let urlArr = url.replace("feeds://","").split("/");
      channelCollections.did = urlArr[0];
      let carrierAddress = urlArr[1];
      let nodeId = await this.carrierService.getIdFromAddress(carrierAddress,()=>{});
      channelCollections.nodeId = nodeId;
      this.channelCollectionList.push(channelCollections)
      }
      } catch (error) {
        console.error("Get Sale item error", error);
      }
    }
  }

  getChannelCollections() {
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
      avatar: {
        image: '',
        size: 0,
        kind: '',
        thumbnail: ''
      },
      type: '',
      status: '0',
      panelId: '',
      userAddr: ''
    };
    return channelCollections;
  }
}
