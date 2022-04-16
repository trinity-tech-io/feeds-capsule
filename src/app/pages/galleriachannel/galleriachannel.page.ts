import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { UtilService } from 'src/app/services/utilService';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { FeedService } from 'src/app/services/FeedService';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import { PopupProvider } from 'src/app/services/popup';
import { IPFSService } from 'src/app/services/ipfs.service';
import { Logger } from 'src/app/services/logger';
import { Config } from 'src/app/services/config';
import { DataHelper } from 'src/app/services/DataHelper';
import _ from 'lodash';
import { Params, ActivatedRoute } from '@angular/router';
import { HttpService } from 'src/app/services/HttpService';
import { ApiUrl } from 'src/app/services/ApiUrl';
import { StorageService } from 'src/app/services/StorageService';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';

const SUCCESS = 'success';
const SKIP = 'SKIP';
const TAG: string = 'GalleriachannelPage';
@Component({
  selector: 'app-galleriachannel',
  templateUrl: './galleriachannel.page.html',
  styleUrls: ['./galleriachannel.page.scss'],
})
export class GalleriachannelPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  private throwMsgTransDataLimit = 4 * 1000 * 1000;
  private transDataChannel: FeedsData.TransDataChannel =
    FeedsData.TransDataChannel.MESSAGE;
  public nftName: string = '';
  public nftDescription: string = '';
  /**single  multiple*/
  public nftRoyalties: string = '';
  public nftQuantity: string = '1';

  public fileName: string = '';
  public thumbnail: string = '';
  public popover: any;
  public isLoading: boolean = false;
  public loadingTitle: string = "common.waitMoment";
  public loadingText: string = "";
  public loadingCurNumber: string = "";
  public loadingMaxNumber: string = "";
  private realFile: any = null;
  public maxAvatarSize: number = 5 * 1024 * 1024;
  private didUri: string = null;
  private nodeId: string = null;
  private channelId: string = null;
  private feedsUrl: string = null;
  public channel: any = {};
  private avatarObj: any = {};
  private tippingAddress: any = {};
  constructor(
    private httpService: HttpService,
    private translate: TranslateService,
    private event: Events,
    private native: NativeService,
    private titleBarService: TitleBarService,
    private feedService: FeedService,
    public theme: ThemeService,
    private nftContractControllerService: NFTContractControllerService,
    private walletConnectControllerService: WalletConnectControllerService,
    private popupProvider: PopupProvider,
    private ipfsService: IPFSService,
    private activatedRoute: ActivatedRoute,
    private dataHelper: DataHelper,
    private storageService: StorageService,
    private feedsServiceApi: FeedsServiceApi
  ) { }

  ngOnInit() {

    this.activatedRoute.queryParams.subscribe((params: Params) => {
      this.nodeId = params.nodeId;
      this.channelId = params.channelId;
    });
  }

  ionViewWillEnter() {

    let server = this.feedsServiceApi.getServerbyNodeId(this.nodeId) || null;
    if (server != null) {
      this.feedsUrl = server.feedsUrl + '/' + this.channelId;
    }

    let elaAddress = server['elaAddress'] || null;

    if (elaAddress != null) {
      this.tippingAddress["elaMain"] = elaAddress;
    } else {
      this.tippingAddress["elaMain"] = "";
    }

    this.channel = this.feedService.getChannelFromId(this.nodeId, this.channelId);
    this.nftName = this.channel["name"];
    this.nftDescription = this.channel["introduction"];
    let galleriachannelAvatar = document.getElementById("galleriachannelAvatar") || null;
    if (galleriachannelAvatar != null) {
      let avatar = this.channel.avatar || "";
      if (avatar.startsWith('img://')) {
        let newAvatar = avatar.replace('img://', '');
        galleriachannelAvatar.setAttribute("src", newAvatar);
      } else if (avatar.startsWith('feeds:image:')) {
        let newAvatar = avatar.replace('feeds:image:', '');
        newAvatar = this.ipfsService.getNFTGetUrl() + newAvatar;
        galleriachannelAvatar.setAttribute("src", newAvatar);
      } else if (avatar.startsWith('feeds:imgage:')) {
        let newAvatar = avatar.replace('feeds:imgage:', '');
        newAvatar = this.ipfsService.getNFTGetUrl() + newAvatar;
        galleriachannelAvatar.setAttribute("src", newAvatar);
      } else if (avatar.startsWith('pasar:image:')) {
        let newAvatar = avatar.replace('pasar:image:', '');
        newAvatar = this.ipfsService.getNFTGetUrl() + newAvatar;
        galleriachannelAvatar.setAttribute("src", newAvatar);
      } else {
        galleriachannelAvatar.setAttribute("src", avatar);
      }
    }
    if (this.walletConnectControllerService.getAccountAddress() == '')
      this.walletConnectControllerService.connect();

    this.initTile();
    this.addEvent();
  }

  ionViewWillLeave() {
    this.removeEvent();
    this.native.handleTabsEvents()
  }

  ionViewDidLeave() {
    Logger.log(TAG, 'Leave page');
    this.nftContractControllerService
      .getSticker()
      .cancelMintProcess();
    this.nftContractControllerService
      .getSticker()
      .cancelSetApprovedProcess();
    this.nftContractControllerService
      .getPasar()
      .cancelCreateOrderProcess();
  }

  initTile() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('GalleriachannelPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  addEvent() {
    this.event.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      this.initTile();
    });
  }

  removeEvent() {
    this.event.unsubscribe(FeedsEvent.PublishType.updateTitle);
  }

  async mint() {
    if (!this.checkParms()) {
      // show params error
      return;
    }

    await this.doMint();
  }

  async doMint() {
    //Start loading
    let sid = setTimeout(() => {
      this.isLoading = false;
      this.nftContractControllerService
        .getSticker()
        .cancelMintProcess();
      this.nftContractControllerService
        .getSticker()
        .cancelSetApprovedProcess();
      this.nftContractControllerService
        .getGalleria()
        .cancelCreatePanelProcess();
      this.showSelfCheckDialog();
      clearTimeout(sid);
    }, Config.WAIT_TIME_MINT);

    this.loadingCurNumber = "1";
    this.loadingMaxNumber = "3";
    this.loadingMaxNumber = "5";

    this.loadingText = "common.uploadingData"
    this.isLoading = true;
    let tokenId = this.getTokenId();
    this.uploadData()
      .then(async (result) => {
        Logger.log(TAG, 'Upload Result', result);
        this.loadingCurNumber = "1";
        this.loadingText = "common.uploadDataSuccess";

        let jsonHash = result.jsonHash;
        this.loadingCurNumber = "2";
        this.loadingText = "GalleriachannelPage.mintingData";
        let didUri = await this.getDidUri();
        return this.mintContract(tokenId, jsonHash, this.nftQuantity, "0", didUri);
      })
      .then(mintResult => {
        if (mintResult === "") {
          return SKIP;
        }
        this.loadingCurNumber = "3";
        this.loadingText = "GalleriachannelPage.settingApproval";
        return this.handleSetApproval();
      })
      .then(setApprovalResult => {
        if (setApprovalResult == SKIP) return -1;
        this.loadingCurNumber = "4";
        this.loadingText = "GalleriachannelPage.creatingOrder";
        return this.handleCreateOrder(tokenId);
      })
      .then(tokenInfo => {
        if (tokenInfo == -1) return SKIP;
        this.loadingCurNumber = "5";
        this.loadingText = "GalleriachannelPage.checkingCollectibleResult";
        let panelId = tokenInfo[0];
        return this.handleOrderResult(tokenId, panelId);
      })
      .then((status) => {
        if (status === SKIP) {
          this.loadingCurNumber = "3";
          this.loadingText = "GalleriachannelPage.checkingCollectibleResult";
        }
        this.isLoading = false;
        clearTimeout(sid);
        this.showSuccessDialog();
      })
      .catch(error => {
        this.nftContractControllerService
          .getSticker()
          .cancelMintProcess();
        this.nftContractControllerService
          .getSticker()
          .cancelSetApprovedProcess();
        this.nftContractControllerService
          .getPasar()
          .cancelCreateOrderProcess();

        //this.native.hideLoading();
        this.isLoading = false;
        clearTimeout(sid);
        if (error == 'EstimateGasError') {
          this.native.toast_trans('common.publishSameDataFailed');
          return;
        }

        this.native.toast_trans('GalleriachannelPage.publicGallericaFailed');
      });
  }

  sendIpfsImage(file: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let blob = UtilService.dataURLtoBlob(file);
      let formData = new FormData();
      formData.append('', blob);
      Logger.log(TAG, 'Send img, formdata length is', formData.getAll('').length);
      this.ipfsService
        .nftPost(formData)
        .then(result => {
          let hash = result['Hash'] || null;
          if (!hash) {
            reject("Upload Image error, hash is null")
            return;
          }
          let kind = blob.type.replace("image/", "");
          let size = blob.size;
          let cid = 'feeds:image:' + hash;
          resolve({ "cid": cid, "size": size, "kind": kind });
        })
        .catch(err => {
          reject('Upload image error, error is ' + JSON.stringify(err));
        });
    });
  }

  sendIpfsThumbnail(thumbnailBase64: string) {
    return new Promise(async (resolve, reject) => {
      let thumbnailBlob = UtilService.dataURLtoBlob(thumbnailBase64);
      let formData = new FormData();
      formData.append('', thumbnailBlob);
      Logger.log(TAG, 'Send thumbnail, formdata length is', formData.getAll('').length);

      this.ipfsService
        .nftPost(formData)
        .then(result => {
          let hash = result['Hash'] || null;
          if (!hash) {
            reject("Send thumbnail error, hash is null");
            return;
          }

          this.thumbnail = thumbnailBase64;
          this.avatarObj['thumbnail'] = 'feeds:image:' + hash;
          resolve('');
        })
        .catch(err => {
          reject("Send thumbnail error, error is " + JSON.stringify(err));
        });
    });
  }

  sendIpfsJSON(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let type = "feeds-channel";
      let ipfsJSON = {
        version: '2',
        type: type,
        name: this.nftName,
        description: this.nftDescription,
        tippingAddress: this.tippingAddress,
        entry: {
          url: this.feedsUrl,
          location: "feeds-service",//feeds-service/hive
          version: "1.0"
        },
        avatar: this.avatarObj
      };

      let formData = new FormData();
      formData.append('', JSON.stringify(ipfsJSON));
      Logger.log(TAG, 'Send json, formdata length is', formData.getAll('').length);
      this.ipfsService
        .nftPost(formData)
        .then(result => {
          //{"Name":"blob","Hash":"QmaxWgjheueDc1XW2bzDPQ6qnGi9UKNf23EBQSUAu4GHGF","Size":"17797"};
          Logger.log(TAG, 'Json data is', JSON.stringify(result));
          let hash = result['Hash'] || null;
          if (hash != null) {
            let jsonHash = 'feeds:json:' + hash;
            resolve(jsonHash);
          }
        })
        .catch(err => {
          Logger.error(TAG, 'Send Json data error', err);
          reject('upload json error');
        });
    });
  }

  checkParms() {
    let accountAddress =
      this.nftContractControllerService.getAccountAddress() || '';
    if (accountAddress === '') {
      this.native.toastWarn('common.connectWallet');
      return;
    }
    if (this.nftName === '') {
      this.native.toastWarn('MintnftPage.nftNamePlaceholder');
      return false;
    }
    if (this.nftDescription === '') {
      this.native.toastWarn('MintnftPage.nftDescriptionPlaceholder');
      return false;
    }
    let regNumber = /^\+?[1-9][0-9]*$/;
    if (this.nftQuantity === '') {
      this.native.toastWarn('MintnftPage.nftQuantityPlaceholder');
      return false;
    }

    if (regNumber.test(this.nftQuantity) == false) {
      this.native.toastWarn('MintnftPage.quantityErrorMsg');
      return false;
    }
    return true;
  }

  handlePath(fileUri: string) {
    let pathObj = {};
    fileUri = fileUri.replace('/storage/emulated/0/', '/sdcard/');
    let path = fileUri.split('?')[0];
    let lastIndex = path.lastIndexOf('/');
    pathObj['fileName'] = path.substring(lastIndex + 1, fileUri.length);
    this.fileName = pathObj['fileName'];
    pathObj['filepath'] = path.substring(0, lastIndex);
    pathObj['filepath'] = pathObj['filepath'].startsWith('file://')
      ? pathObj['filepath']
      : `file://${pathObj['filepath']}`;
    return pathObj;
  }

  mintContract(
    tokenId: string,
    uri: string,
    supply: string,
    royalty: string,
    didUri: string
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const MINT_ERROR = 'Mint process error';
      let result = '';
      if (didUri === null) {
        reject(MINT_ERROR);
        return;
      }
      this.didUri = didUri;
      try {
        result = await this.nftContractControllerService
          .getSticker()
          .mint(tokenId, supply, uri, royalty, didUri);
      } catch (error) {
        reject(error);
        return;
      }

      result = result || '';
      if (result === '') {
        reject(MINT_ERROR);
        return;
      }

      resolve(SUCCESS);
    });
  }

  async handleSetApproval(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const SETAPPROVAL_ERROR = 'Set approval error ';
      let galleriaAddress = this.nftContractControllerService
        .getGalleria()
        .getGalleriaAddress();
      let result = '';
      let accountAddress = this.nftContractControllerService.getAccountAddress();
      try {
        result = await this.nftContractControllerService
          .getSticker()
          .setApprovalForAll(accountAddress, galleriaAddress, true);
      } catch (error) {
        reject(SETAPPROVAL_ERROR);
        return;
      }

      result = result || '';
      if (result === '') {
        reject(SETAPPROVAL_ERROR);
        return;
      }

      resolve(SUCCESS);
    });
  }

  async handleCreateOrder(tokenId: any): Promise<number> {
    return new Promise(async (resolve, reject) => {
      let tokenInfo = null;
      try {
        tokenInfo = await this.nftContractControllerService
          .getGalleria()
          .createPanel(tokenId, this.nftQuantity, this.didUri);
      } catch (error) {
        reject(-1);
      }

      if (tokenInfo == null || tokenInfo == undefined || tokenInfo == -1) {
        reject(-1);
        return;
      }
      resolve(tokenInfo);
    });
  }

  async handleOrderResult(
    tokenId: string,
    panelId: string,
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      this.handleCace(tokenId, panelId);
      resolve(SUCCESS);
    });
  }

  // 压缩图片
  compressImage(path: any, isCompress?: string): Promise<string> {
    isCompress = isCompress || null;
    return new Promise((resolve, reject) => {
      try {
        let img = new Image();
        img.crossOrigin = '*';
        img.crossOrigin = "Anonymous";
        img.src = path;
        img.onload = () => {
          let maxWidth = img.width;
          let maxHeight = img.height;
          if (isCompress != null) {
            maxWidth = img.width / 4;
            maxHeight = img.height / 4;
          }
          let imgBase64 = UtilService.resizeImg(img, maxWidth, maxHeight, 1);
          resolve(imgBase64);
        };
      } catch (err) {
        Logger.error(TAG, "Compress image error", err);
        reject("Compress image error" + JSON.stringify(err));
      }
    });
  }

  number(text: any) {
    var numPattern = /^(([1-9]\d*)|\d)(.\d{1,9})?$/;
    return numPattern.test(text);
  }

  uploadData(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      this.realFile = await this.handleChannelAvatar();
      if (this.realFile == null) {
        reject('upload file error');
        return;
      }
      this.sendIpfsImage(this.realFile).then((realFileObj: any) => {
        this.avatarObj["image"] = realFileObj.cid;
        this.avatarObj["size"] = realFileObj.size;
        this.avatarObj["kind"] = realFileObj.kind;
        return this.sendIpfsThumbnail(this.realFile);
      })
        .then(() => {
          return this.sendIpfsJSON();
        }).then((jsonHash) => {
          resolve({ jsonHash: jsonHash });
        })
        .catch((error) => {
          reject('upload file error');
        });
    });
  }

  showSuccessDialog() {
    let feedPublicStatus = this.feedService.getFeedPublicStatus() || {};
    let hash = UtilService.SHA256(this.feedsUrl);
    let status = feedPublicStatus[hash] || null;
    let des = "GalleriachannelPage.mintSuccessDesc";
    if (status === null || status != "1") {
      this.popover = this.popupProvider.showalertdialog(
        this,
        'GalleriachannelPage.mintSuccess',
        des,
        this.bindingCompleted,
        'finish.svg',
        'common.ok',
      );
    } else {
      des = "GalleriachannelPage.mintSuccessDesc1";
      this.popover = this.popupProvider.showConfirmdialog(
        this,
        'GalleriachannelPage.mintSuccess',
        des,
        this.cancelButton,
        this.okButton,
        './assets/images/finish.svg',
        'common.ok',
        "common.cancel"
      );
    }

  }

  cancelButton(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      this.popover = null;
      that.native.pop();
    }
  }

  handleDiscoverfeedsCache(feedsUrl: string) {
    let discoverfeeds = this.dataHelper.getDiscoverfeeds() || [];
    let newDiscoverfeeds = _.filter(discoverfeeds, (item) => {
      return item.url != feedsUrl;
    });
    this.dataHelper.setDiscoverfeeds(newDiscoverfeeds);
    this.storageService.set(
      'feed:discoverfeeds',
      JSON.stringify(newDiscoverfeeds),
    );
  }

  okButton(that: any) {
    let feedPublicStatus = that.feedService.getFeedPublicStatus() || {};
    let hash = UtilService.SHA256(that.feedsUrl);
    that.httpService
      .ajaxGet(ApiUrl.remove + '?feedsUrlHash=' + hash)
      .then(result => {
        if (result['code'] === 200) {
          feedPublicStatus = _.omit(feedPublicStatus, [hash]);
          that.feedService.setFeedPublicStatus(feedPublicStatus);
          if (this.popover != null) {
            this.popover.dismiss();
            this.popover = null;
            that.native.pop();
          }
          that.handleDiscoverfeedsCache(that.feedsUrl);
          that.storageService.set(
            'feeds.feedPublicStatus',
            JSON.stringify(feedPublicStatus)
          );
        }
      }).catch(() => {
        if (this.popover != null) {
          this.popover.dismiss();
          this.popover = null;
          that.native.pop();
        }
      });
  }

  showSelfCheckDialog() {
    //TimeOut
    this.openAlert();
  }


  openAlert() {
    this.popover = this.popupProvider.ionicAlert(
      this,
      'common.timeout',
      'common.mintTimeoutDesc',
      this.confirm,
      'tskth.svg',
    );
  }

  confirm(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      this.popover = null;
      that.native.pop();
    }
  }

  bindingCompleted(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      this.popover = null;
      that.native.pop();
    }
  }

  handleRoyalties(events: any) {
    let royalties = events.target.value || '';
    let regNumber = /^\+?[1-9][0-9]*$/;
    if (royalties == "" || royalties === "0") {
      return true;
    }
    if (regNumber.test(royalties) == false) {
      this.native.toastWarn('MintnftPage.royaltiesErrorMsg');
      return false;
    }
    if (parseInt(royalties) < 0 || parseInt(royalties) > 15) {
      this.native.toastWarn('MintnftPage.royaltiesErrorMsg');
      return false;
    }
  }

  handleQuantity(events: any) {
    let quantity = events.target.value || '';
    if (quantity == "") {
      return true;
    }
    let regNumber = /^\+?[1-9][0-9]*$/;
    if (regNumber.test(quantity) == false) {
      this.native.toastWarn('MintnftPage.quantityErrorMsg');
      return false;
    }
  }

  async handleCace(tokenId: any, panelId: string) {
    let tokenInfo = await this.nftContractControllerService
      .getSticker()
      .tokenInfo(tokenId);
    tokenId = tokenInfo[0];
    let accAddress =
      this.nftContractControllerService.getAccountAddress() || '';
    let channelCollections: FeedsData.ChannelCollections = UtilService.getChannelCollections();
    let galleriaEntry: FeedsData.GalleriaEntry = {
      url: this.feedsUrl,
      location: "feeds-service",
      version: "1.0"
    }
    channelCollections.entry = galleriaEntry;
    channelCollections.tokenId = tokenId;
    channelCollections.panelId = panelId;
    channelCollections.nodeId = this.nodeId;
    channelCollections.name = this.nftName;
    channelCollections.description = this.nftDescription;
    channelCollections.ownerName = "";
    channelCollections.avatar = this.avatarObj;
    let urlArr = this.feedsUrl.replace("feeds://", "").split("/");
    channelCollections.did = urlArr[0];
    channelCollections.userAddr = accAddress;
    channelCollections.ownerDid = (await this.dataHelper.getSigninData()).did;
    channelCollections.type = 'feeds-channel';
    channelCollections.status = '1';

    //exploer feeds
    let publishedActivePanelList = this.dataHelper.getPublishedActivePanelList() || [];
    publishedActivePanelList.push(channelCollections);
    this.dataHelper.setPublishedActivePanelList(publishedActivePanelList);
  }

  async getDidUri() {
    return await this.feedService.getDidUri();
  }

  getTokenId() {
    let tokenId = "0x" + UtilService.SHA256(this.feedsUrl);
    return tokenId;
  }

  async handleChannelAvatar() {

    let channelAvatar: string = this.feedService.parseChannelAvatar(this.channel['avatar']);
    if (channelAvatar.startsWith("data:image")) {
      return channelAvatar;
    }

    if (channelAvatar.startsWith("assets/images/profile")) {
      let fileName = channelAvatar.replace("assets/images/", "");
      let avatarBase64 = UtilService.getDefaultAvatar(fileName);
      return avatarBase64;
    }

    if (channelAvatar.startsWith("https://")) {
      let avatar = await UtilService.downloadFileFromUrl(channelAvatar);
      let avatarBase64 = await UtilService.blobToDataURL(avatar);
      return avatarBase64;
    }
  }

}
