import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { ThemeService } from '../../services/theme.service';
import { NativeService } from '../../services/NativeService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { UtilService } from 'src/app/services/utilService';
import { Logger } from 'src/app/services/logger';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { FeedService, Avatar } from 'src/app/services/FeedService';
import _ from 'lodash';
import { IonRefresher } from '@ionic/angular';
import { NFTContractHelperService } from 'src/app/services/nftcontract_helper.service';
import { FileHelperService } from 'src/app/services/FileHelperService';
import { DataHelper } from 'src/app/services/DataHelper';
const TAG: string = 'NftavatarlistPage';
@Component({
  selector: 'app-nftavatarlist',
  templateUrl: './nftavatarlist.page.html',
  styleUrls: ['./nftavatarlist.page.scss'],
})
export class NftavatarlistPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonRefresher, { static: false }) refresher: IonRefresher;
  private sortType = FeedsData.SortType.TIME_ORDER_LATEST;
  private profileNftImagePagePostisLoad: any = {};
  public nftAvatarList: any = [];
  public onSaleList: any = [];
  public styleObj: any = { width: '' };
  public isFinsh: any = [];
  public type: string = "";
  public isLoading: boolean = false;
  private clientHeight: number = 0;
  constructor(
    private zone: NgZone,
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private nftContractControllerService: NFTContractControllerService,
    private nftPersistenceHelper: NFTPersistenceHelper,
    private ipfsService: IPFSService,
    private native: NativeService,
    private feedService: FeedService,
    private nftContractHelperService: NFTContractHelperService,
    private fileHelperService: FileHelperService,
    private dataHelper: DataHelper,
    public theme: ThemeService,
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.clientHeight = screen.availHeight;
    this.clientHeight = screen.availHeight;
    this.styleObj.width = (screen.width - 20 - 10) / 2 + 'px';
    this.initTitle();
    this.getImageList();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('NftavatarlistPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewDidLoad() {
  }

  ionViewWillLeave() {

  }

  async getImageList() {
    let createAddr =
      this.nftContractControllerService.getAccountAddress() || '';
    if (createAddr === '') {
      this.isLoading = false;
      this.nftAvatarList = [];
    }
    let avatarKey = createAddr + "_avatar";
    let list = this.nftPersistenceHelper.getCollectiblesList(avatarKey);
    if (list.length === 0) {
      this.isLoading = true;
      await this.refreshCollectibles(null, createAddr);
    } else {
      this.nftAvatarList = this.nftContractHelperService.sortData(list, this.sortType);
      this.refreshProfileNftImagePagePost();
    }
  }


  async refreshCollectibles(event: any, accAddress: string) {
    try {
      const address = this.nftContractControllerService.getAccountAddress() || "";
      let nftImageList = await this.nftContractHelperService.queryOwnerCollectibles(address);
      this.nftAvatarList = _.filter(nftImageList, (item) => {
        return item.type === "avatar";
      });
      this.isLoading = false;
      this.hanleListCace(accAddress);
      this.refreshProfileNftImagePagePost();
      if (event != null) {
        event.target.complete();
      }
    } catch (err) {
      this.isLoading = false;
      if (event != null) {
        event.target.complete();
      }
    }
  }

  async doRefresh(event: any) {
    let accAddress =
      this.nftContractControllerService.getAccountAddress() || '';
    if (accAddress === '') {
      this.isLoading = false;
      this.nftAvatarList = [];
      event.target.complete();
    }
    try {
      await this.refreshCollectibles(event, accAddress);
      event.target.complete();
    } catch (error) {
      event.target.complete();
    }
  }

  hanleListCace(createAddress?: any) {
    let avatarKey = createAddress + "_avatar";
    let ownNftCollectiblesList = this.nftPersistenceHelper.getCollectiblesList(avatarKey);
    ownNftCollectiblesList = this.nftAvatarList;
    this.nftPersistenceHelper.setCollectiblesMap(avatarKey, ownNftCollectiblesList);
  }

  async clickItem(item: any) {

    let version = item['version'] || "1";
    let imgUri = "";
    let kind = "";
    let size = "";
    if(version === "1"){
       size = item["originAssetSize"];
       if (!size)
       size = '0';
       imgUri = item['asset'] || "";
      if(parseInt(size) > 5 * 1024 * 1024) {
      imgUri = item['thumbnail'];
      }
    }else if(version === "2"){
      let jsonData = item['data'] || "";
       kind = jsonData["kind"];
        size = jsonData["size"];
        if (!size)
        size = '0';
      if (jsonData != "") {
        imgUri  = jsonData['image'] || "";
      }
      if(parseInt(size) > 5 * 1024 * 1024) {
        imgUri = item['thumbnail'];
      }
    }

    this.dataHelper.setClipProfileIamge(imgUri);
    this.native.pop();
  }


  getProfileNftImagePage(item: any) {
    let version = item['version'] || "1";
    let thumbnailUri = "";
    let kind = "";
    let size = "";
    if(version === "1"){
      thumbnailUri = item['thumbnail'] || "";
      kind = item["kind"];
      size = item["originAssetSize"];
      if (!size)
        size = '0';
      if (kind === "gif" && parseInt(size) <= 5 * 1024 * 1024) {
        thumbnailUri = item['asset'] || "";
      }
    }else if(version === "2"){
      let jsonData = item['data'] || "";
      if (jsonData != "") {
        thumbnailUri = jsonData['thumbnail'] || "";
        kind = jsonData["kind"];
        size = jsonData["size"];
        if (!size)
        size = '0';
      if (kind === "gif" && parseInt(size) <= 5 * 1024 * 1024) {
        thumbnailUri = jsonData['image'] || "";
      }
      } else {
        thumbnailUri = "";
      }
    }
    if(thumbnailUri === ""){
      return;
    }
    if (thumbnailUri.indexOf('feeds:imgage:') > -1) {
      thumbnailUri = thumbnailUri.replace('feeds:imgage:', '');
    } else if (thumbnailUri.indexOf('feeds:image:') > -1) {
      thumbnailUri = thumbnailUri.replace('feeds:image:', '');
    } else if (thumbnailUri.indexOf('pasar:image:') > -1) {
      thumbnailUri = thumbnailUri.replace('pasar:image:', '');
    }
    return thumbnailUri + "-" + kind + "-" + size + "-nftavatarlistPage";
  }

  getChannelAvatarId(item: any) {
    let version = item['version'] || "1";
    let thumbnailUri = "";
    let kind = "";
    let size = "";
    if(version === "1"){
      thumbnailUri = item['thumbnail'] || "";
      kind = item["kind"];
      size = item["originAssetSize"];
      if (!size)
        size = '0';
      if (kind === "gif" && parseInt(size) <= 5 * 1024 * 1024) {
        thumbnailUri = item['asset'] || "";
      }
    }else if(version === "2"){
      let jsonData = item['data'] || "";
      if (jsonData != "") {
        thumbnailUri = jsonData['thumbnail'] || "";
        kind = jsonData["kind"];
        size = jsonData["size"];
        if (!size)
        size = '0';
      if (kind === "gif" && parseInt(size) <= 5 * 1024 * 1024) {
        thumbnailUri = jsonData['image'] || "";
      }
      } else {
        thumbnailUri = "";
      }
    }
    if(thumbnailUri === ""){
      return;
    }
    if (thumbnailUri.indexOf('feeds:imgage:') > -1) {
      thumbnailUri = thumbnailUri.replace('feeds:imgage:', '');
    } else if (thumbnailUri.indexOf('feeds:image:') > -1) {
      thumbnailUri = thumbnailUri.replace('feeds:image:', '');
    } else if (thumbnailUri.indexOf('pasar:image:') > -1) {
      thumbnailUri = thumbnailUri.replace('pasar:image:', '');
    }
    return "nftavatarlistPage-avatar-" + thumbnailUri;
  }

  ionScroll() {
    this.native.throttle(this.setprofileNftImagePagePost(), 200, this, true);
  }

  setprofileNftImagePagePost() {
    let discoverSquareFeed = document.getElementsByClassName("nftavatarlistPage") || [];
    let len = discoverSquareFeed.length;
    for (let itemIndex = 0; itemIndex < len; itemIndex++) {
      let item = discoverSquareFeed[itemIndex];
      let arr = item.getAttribute("id").split("-");
      let avatarUri = arr[0];
      let kind = arr[1];
      let thumbImage = document.getElementById('nftavatarlistPage-avatar-' + avatarUri);
      let srcStr = thumbImage.getAttribute("src") || "";
      let isload = this.profileNftImagePagePostisLoad[avatarUri] || '';
      try {
        if (
          avatarUri != '' &&
          thumbImage.getBoundingClientRect().top >= -100 &&
          thumbImage.getBoundingClientRect().bottom <= this.clientHeight
        ) {
          if (isload === "") {
            this.profileNftImagePagePostisLoad[avatarUri] = '12';
            let fetchUrl = this.ipfsService.getNFTGetUrl() + avatarUri;
            this.fileHelperService.getNFTData(fetchUrl, avatarUri, kind).then((data) => {
              this.zone.run(() => {
                this.profileNftImagePagePostisLoad[avatarUri] = '13';
                let dataSrc = data || "";
                if (dataSrc != "") {
                  thumbImage.setAttribute("src", data);
                }
              });
            }).catch((err) => {
              if (this.profileNftImagePagePostisLoad[avatarUri] === '13') {
                this.profileNftImagePagePostisLoad[avatarUri] = '';
                thumbImage.setAttribute('src', './assets/icon/reserve.svg');
              }
            });

          }
        } else {
          srcStr = thumbImage.getAttribute('src') || '';
          if (
            thumbImage.getBoundingClientRect().top < -100 &&
            this.profileNftImagePagePostisLoad[avatarUri] === '13' &&
            srcStr != './assets/icon/reserve.svg'
          ) {
            this.profileNftImagePagePostisLoad[avatarUri] = '';
            thumbImage.setAttribute('src', './assets/icon/reserve.svg');
          }
        }
      } catch (error) {
        this.profileNftImagePagePostisLoad[avatarUri] = '';
        thumbImage.setAttribute('src', './assets/icon/reserve.svg');
      }
    }
  }

  refreshProfileNftImagePagePost() {
    let sid = setTimeout(() => {
      this.profileNftImagePagePostisLoad = {};
      this.setprofileNftImagePagePost();
      clearTimeout(sid);
    }, 100);
  }


}
