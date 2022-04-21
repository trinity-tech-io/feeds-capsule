import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from '../../services/TitleBarService';
import { TitleBarComponent } from '../../components/titlebar/titlebar.component';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { FeedService, Avatar } from 'src/app/services/FeedService';
import { NativeService } from '../../services/NativeService';
import { IPFSService } from 'src/app/services/ipfs.service';
import _ from 'lodash';
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';
import { Logger } from 'src/app/services/logger';
import { UtilService } from 'src/app/services/utilService';
import { ActivatedRoute } from '@angular/router';
import { Events } from 'src/app/services/events.service';
import { NFTContractHelperService } from 'src/app/services/nftcontract_helper.service';
import { FileHelperService } from 'src/app/services/FileHelperService';
import { DataHelper } from 'src/app/services/DataHelper';
const TAG: string = 'ProfileImagePage';
@Component({
  selector: 'app-profilenftimage',
  templateUrl: './profilenftimage.page.html',
  styleUrls: ['./profilenftimage.page.scss'],
})
export class ProfilenftimagePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  private sortType = FeedsData.SortType.TIME_ORDER_LATEST;
  public nftImageList: any = [];
  public onSaleList: any = [];
  public styleObj: any = { width: '' };
  public isFinsh: any = [];
  public type: string = "";
  private collectiblesPageNum: number = 0;
  private profileNftImagePagePostisLoad: any = {};
  private clientHeight: number = 0;
  constructor(
    private zone: NgZone,
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private nftContractControllerService: NFTContractControllerService,
    private feedService: FeedService,
    private native: NativeService,
    private ipfsService: IPFSService,
    private nftPersistenceHelper: NFTPersistenceHelper,
    private activatedRoute: ActivatedRoute,
    private nftContractHelperService: NFTContractHelperService,
    private fileHelperService: FileHelperService,
    private dataHelper: DataHelper
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(queryParams => {
      this.type = queryParams.type || "";
    });
  }

  ionViewWillEnter() {
    this.initTile();
    this.clientHeight = screen.availHeight;
    this.styleObj.width = (screen.width - 20 - 10) / 2 + 'px';
    this.getImageList();
  }

  async refreshCollectibles(event: any) {
    try {
      const address = this.nftContractControllerService.getAccountAddress() || "";
      this.nftImageList = await this.nftContractHelperService.queryOwnerCollectibles(address);
      if (event != null) {
        event.target.complete();
      }
    } catch (err) {
      if (event != null) {
        event.target.complete();
      }
    }
  }

  initTile() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('ProfilenftimagePage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewWillLeave() {

  }

  async getImageList() {
    let createAddr =
      this.nftContractControllerService.getAccountAddress() || '';
    if (createAddr === '') {
      this.nftImageList = [];
    }

    let list = this.nftPersistenceHelper.getCollectiblesList(createAddr);
    if (list.length === 0) {
      await this.refreshCollectibles(null);
      this.refreshProfileNftImagePagePost();
    } else {
      this.nftImageList = this.nftContractHelperService.sortData(list, this.sortType);
      this.refreshProfileNftImagePagePost()
    }
  }

  async doRefresh(event: any) {
    let createAddr =
      this.nftContractControllerService.getAccountAddress() || '';
    if (createAddr === '') {
      this.nftImageList = [];
      event.target.complete();
    }
    await this.refreshCollectibles(event);
    this.refreshProfileNftImagePagePost()
  }

  async clickItem(item: any) {

    if (this.type === "postImages") {
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
      await this.native.showLoading('common.waitMoment', isDismiss => { }, 30000);
      let fetchUrl = this.ipfsService.getNFTGetUrl() + thumbnailUri;
      this.fileHelperService.getNFTData(fetchUrl, thumbnailUri, kind).then((data) => {
        this.zone.run(() => {
          let dataSrc = data || "";
          if (dataSrc != "") {
            this.dataHelper.setSelsectNftImage(dataSrc);
            this.native.pop();
            this.native.hideLoading();
          }
        });
      }).catch((err) => {
        this.native.hideLoading();
      });
    } else {
      let version = item['version'] || "1";
      let imgUri = "";
      let size  = "";
      if(version === "1"){
        imgUri = item['asset'] || "";
        size = item["originAssetSize"];
        if (!size)
          size = '0';
        if (parseInt(size) > 5 * 1024 * 1024) {
          imgUri = item['thumbnail'] || "";
        }
      }else if(version === "2"){
        let jsonData = item['data'] || "";
        if (jsonData != "") {
          imgUri = jsonData['image'] || "";
          size = jsonData["size"];
          if (!size)
          size = '0';
        if (parseInt(size) > 5 * 1024 * 1024) {
          imgUri = jsonData['thumbnail'] || "";
        }
        } else {
          imgUri = "";
        }
      }

      if (imgUri.indexOf('feeds:imgage:') > -1) {
        imgUri = imgUri.replace('feeds:imgage:', '');
        imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
      } else if (imgUri.indexOf('feeds:image:') > -1) {
        imgUri = imgUri.replace('feeds:image:', '');
        imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
      } else if (imgUri.indexOf('pasar:image:') > -1) {
        imgUri = imgUri.replace('pasar:image:', '');
        imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
      }
      this.native.navigateForward(['editimage'], { replaceUrl: true });
      this.dataHelper.setClipProfileIamge(imgUri);
    }

  }




  loadData(event: any) {
    this.zone.run(async () => {
      this.collectiblesPageNum++;
      let list = await this.nftContractHelperService.loadCollectiblesData(null, this.collectiblesPageNum, this.sortType);
      list = _.unionWith(this.nftImageList, list, _.isEqual);
      this.nftImageList = this.nftContractHelperService.sortData(list, this.sortType);
      this.refreshProfileNftImagePagePost()
      event.target.complete();
    });
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
    return thumbnailUri + "-" + kind + "-" + size + "-profileNftImage";
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
    }  else if (thumbnailUri.indexOf('pasar:image:') > -1) {
      thumbnailUri = thumbnailUri.replace('pasar:image:', '');
    }
    return "profileNftImagePage-post-"+thumbnailUri;
  }

  ionScroll() {
    this.native.throttle(this.setprofileNftImagePagePost(), 200, this, true);
  }

  setprofileNftImagePagePost() {
    let discoverSquareFeed = document.getElementsByClassName("profileNftImagePage") || [];
    let len = discoverSquareFeed.length;
    for (let itemIndex = 0; itemIndex < len; itemIndex++) {
      let item = discoverSquareFeed[itemIndex];
      let id = item.getAttribute("id") || "";
      if (id === "") {
        continue;
      }
      let arr = id.split("-");
      let avatarUri = arr[0];
      let kind = arr[1];
      let thumbImage = document.getElementById('profileNftImagePage-post-' + avatarUri);
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
