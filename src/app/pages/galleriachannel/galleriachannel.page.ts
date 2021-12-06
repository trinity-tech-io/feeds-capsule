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
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';
import { Logger } from 'src/app/services/logger';
import { Config } from 'src/app/services/config';
import { NFTContractHelperService } from 'src/app/services/nftcontract_helper.service';

import _ from 'lodash';
import { Params , ActivatedRoute } from '@angular/router';
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
  public issueRadionType: string = 'single';
  public nftRoyalties: string = '';
  public nftQuantity: string = '1';
  public nftFixedAmount: number = null;
  public nftMinimumAmount: number = null;
  /**fixedPrice highestBid */
  public sellMethod: string = 'fixedPrice';
  public expirationDate: string = '';
  public maxExpirationDate: string = '';
  public minExpirationDate: string = '';
  public fileName: string = '';
  public thumbnail: string = '';
  private imageObj: any = {};
  private orderId: any = '';
  public popover: any;
  public isLoading:boolean = false;
  public loadingTitle:string = "common.waitMoment";
  public loadingText:string = "";
  public loadingCurNumber:string = "";
  public loadingMaxNumber:string = "";
  private realFile: any = null;
  public  maxAvatarSize:number = 5 * 1024 * 1024;
  private didUri:string = null;
  private nodeId: string = null;
  private channelId: string = null;
  private feedsUrl: string = null;
  private channel: any = {};
  private avatarObj: any = {};
  private tippingAddress: any = {};
  constructor(
    private translate: TranslateService,
    private event: Events,
    private zone: NgZone,
    private native: NativeService,
    private titleBarService: TitleBarService,
    private feedService: FeedService,
    public theme: ThemeService,
    private nftContractControllerService: NFTContractControllerService,
    private walletConnectControllerService: WalletConnectControllerService,
    private popupProvider: PopupProvider,
    private ipfsService: IPFSService,
    private nftPersistenceHelper: NFTPersistenceHelper,
    private nftContractHelperService: NFTContractHelperService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {

    this.activatedRoute.queryParams.subscribe((params: Params) => {
      this.nodeId = params.nodeId;
      this.channelId = params.channelId;
      console.log("===nodeId===",this.nodeId);
      console.log("===channelId===",this.channelId);
    });
  }

  ionViewWillEnter() {

    let server = this.feedService.getServerbyNodeId(this.nodeId) || null;
    if (server != null) {
      this.feedsUrl = server.feedsUrl + '/' + this.channelId;
    }

    let elaAddress = server['elaAddress'] || null;

    if(elaAddress != null){
      this.tippingAddress["elaMain"] = elaAddress;
    }else{
      this.tippingAddress["elaMain"] = null;
    }

    this.channel = this.feedService.getChannelFromId(this.nodeId, Number(this.channelId));
    this.nftName = this.channel["name"];
    this.nftDescription = this.channel["introduction"];

    if (this.walletConnectControllerService.getAccountAddress() == '')
      this.walletConnectControllerService.connect();

    this.minExpirationDate = UtilService.dateFormat(new Date());
    this.expirationDate = UtilService.dateFormat(
      new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
    );
    this.maxExpirationDate = UtilService.dateFormat(
      new Date(new Date().getTime() + 10 * 365 * 24 * 60 * 60 * 1000),
    );
    this.initTile();
    this.addEvent();
  }

  ionViewWillLeave() {
    this.removeEvent();
    this.event.publish(FeedsEvent.PublishType.addBinaryEvevnt);
    this.event.publish(FeedsEvent.PublishType.addProflieEvent);
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
      this.translate.instant('MintnftPage.title'),
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

  //@Deprecated
  // addAsset() {
  //   this.addImg(0)
  //     .then((imagePath) => {
  //       this.imagePath = imagePath;
  //       let pathObj = this.handlePath(this.imagePath);
  //       let fileName = pathObj['fileName'];
  //       let filePath = pathObj['filepath'];
  //       let index = fileName.lastIndexOf(".");
  //       let imgFormat = fileName.substr(index+1);
  //       this.imageObj['imgFormat'] = imgFormat;
  //       return this.getFlieObj(fileName, filePath);
  //     }).then((fileBase64) => {
  //       this.assetBase64 = fileBase64;
  //       return this.compressImage(fileBase64);
  //     }).then((compressBase64) => {
  //       this.thumbnail = compressBase64;
  //     });
  // }

  mint() {
    if (!this.checkParms()) {
      // show params error
      return;
    }

    this.doMint();
  }

  async doMint() {
    //Start loading
    let sid = setTimeout(()=>{
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
    },Config.WAIT_TIME_MINT);

    this.loadingCurNumber = "1";
    this.loadingMaxNumber = "3";
    this.loadingMaxNumber = "5";

    this.loadingText = "common.uploadingData"
    this.isLoading = true;
    let tokenId = this.getTokenId();
    this.uploadData()
      .then(async(result) => {
        Logger.log(TAG, 'Upload Result', result);
        this.loadingCurNumber = "1";
        this.loadingText = "common.uploadDataSuccess";

        let jsonHash = result.jsonHash;
        this.loadingCurNumber = "2";
        this.loadingText = "common.mintingData";
        let didUri = await this.getDidUri();
        return this.mintContract(tokenId, jsonHash, this.nftQuantity,"0",didUri);
      })
      .then(mintResult => {
          this.loadingCurNumber = "3";
          this.loadingText = "common.settingApproval";
          return this.handleSetApproval();
      })
      .then(setApprovalResult => {
        if (setApprovalResult == SKIP) return -1;
        //this.native.changeLoadingDesc("common.creatingOrder");
        this.loadingCurNumber = "4";
        this.loadingText = "common.creatingOrder";
        return this.handleCreateOrder(tokenId);
      })
      .then(orderIndex => {
        if (orderIndex == -1) return SKIP;
        //this.native.changeLoadingDesc("common.checkingCollectibleResult");
        this.loadingCurNumber = "5";
        this.loadingText = "common.checkingCollectibleResult";
        console.log("===tokenInfo====",orderIndex);
        //return this.handleOrderResult(tokenId, orderIndex);
      })
      .then((status) => {
        if(status === SKIP){
          this.loadingCurNumber = "3";
          this.loadingText = "common.checkingCollectibleResult";
        }
        //Finish
        //if(!this.curPublishtoPasar){
          //this.handleCace('created',tokenId);
        //}
        //this.native.hideLoading();
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

        this.native.toast_trans('common.publicPasarFailed');
      });
  }

  // getFlieObj(fileName: string, filepath: string): Promise<string> {
  //   return new Promise(async (resolve, reject) => {
  //     this.file
  //     .resolveLocalFilesystemUrl(filepath)
  //     .then((dirEntry: DirectoryEntry) => {
  //       dirEntry.getFile(
  //         fileName,
  //         { create: true, exclusive: false },
  //         fileEntry => {
  //           fileEntry.file(
  //             file => {
  //               let fileReader = new FileReader();
  //               fileReader.onloadend = (event: any) => {
  //                 this.zone.run(() => {
  //                   let assetBase64 = fileReader.result.toString();
  //                   resolve(assetBase64);
  //                 });
  //               };
  //               fileReader.onprogress = (event: any) => {
  //                 this.zone.run(() => {});
  //               };
  //               fileReader.readAsDataURL(file);
  //             },
  //             () => {},
  //           );
  //         },
  //         () => {
  //           reject('error');
  //         },
  //       );
  //     })
  //     .catch(dirEntryErr => {
  //       reject(dirEntryErr);
  //       Logger.error(TAG, 'Get File object error', dirEntryErr)
  //     });
  //   });
  // }

  sendIpfsImage(file: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let blob = this.dataURLtoBlob(file);
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
          let kind = blob.type.replace("image/","");
          console.log("===kind==",kind);
          let size = blob.size;
          console.log("===size==",size);
          let cid = 'feeds:image:' + hash;
          resolve({"cid": cid , "size": size,"kind":kind});
        })
        .catch(err => {
          reject('Upload image error, error is ' + JSON.stringify(err));
        });
    });
  }

  sendIpfsThumbnail(thumbnailBase64: string) {
    return new Promise(async (resolve, reject) => {
      let thumbnailBlob = this.dataURLtoBlob(thumbnailBase64);
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
          console.log("===this.avatarObj====",this.avatarObj);
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
        ownerName: this.channel['owner_name'],
        nodeId: this.nodeId,
        name: this.nftName,
        description: this.nftDescription,
        tippingAddress:this.tippingAddress,
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

  dataURLtoBlob(dataurl: string) {
    let arr = dataurl.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  //@Deprecated
  // addImg(type: number): Promise<any> {
  //   return new Promise((resolve, reject) => {
  //     this.camera.openCamera(
  //       100,
  //       1,
  //       type,
  //       (imgPath: any) => {
  //         resolve(imgPath);
  //       },
  //       (err: any) => {
  //         Logger.error(TAG, 'Add img err', err);
  //         let imgUrl = this.assetBase64 || '';
  //         if (!imgUrl) {
  //           this.native.toast_trans('common.noImageSelected');
  //           reject(err);
  //           return;
  //         }
  //       }
  //     );
  //   });
  // }

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

    // if (
    //   this.curPublishtoPasar &&
    //   this.issueRadionType === 'oneTimeIssue' &&
    //   this.nftFixedAmount === null
    // ) {
    //   this.native.toastWarn('MintnftPage.nftFixedAmount');
    //   return false;
    // }

    // if (
    //   this.curPublishtoPasar &&
    //   this.issueRadionType === 'oneTimeIssue' &&
    //   !this.number(this.nftFixedAmount)
    // ) {
    //   this.native.toastWarn('common.amountError');
    //   return false;
    // }

    // if (
    //   this.curPublishtoPasar &&
    //   this.issueRadionType === 'oneTimeIssue' &&
    //   this.nftFixedAmount <= 0
    // ) {
    //   this.native.toastWarn('MintnftPage.priceErrorMsg');
    //   return;
    // }

    // if (
    //   this.curPublishtoPasar &&
    //   this.issueRadionType === 'reIssueable' &&
    //   this.nftMinimumAmount === null
    // ) {
    //   this.native.toastWarn('MintnftPage.nftMinimumAmount');
    //   return false;
    // }
    let regNumber = /^\+?[1-9][0-9]*$/;
    // if (this.nftRoyalties === '') {
    //   this.native.toastWarn('MintnftPage.nftRoyaltiesPlaceholder');
    //   return false;
    // }

    // if (this.nftRoyalties!="0"&&regNumber.test(this.nftRoyalties) == false) {
    //   this.native.toastWarn('MintnftPage.royaltiesErrorMsg');
    //   return false;
    // }

    // if(parseInt(this.nftRoyalties)<0 || parseInt(this.nftRoyalties)>15){
    //   this.native.toastWarn('MintnftPage.royaltiesErrorMsg');
    //   return false;
    // }

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

  radioChange() {
    if (this.issueRadionType === 'single') {
      this.nftQuantity = '1';
    } else {
      this.nftQuantity = '';
    }
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
      if(didUri === null){
        reject(MINT_ERROR);
        return;
      }
      this.didUri = didUri;
      try {
        result = await this.nftContractControllerService
          .getSticker()
          .mint(tokenId, supply, uri, royalty,didUri);
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
          .setApprovalForAll(accountAddress,galleriaAddress, true);
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
          .createPanel(tokenId,this.nftQuantity,this.didUri);
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
    orderIndex: number,
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      this.handleCace('onSale', tokenId, orderIndex);
      await this.getSetChannel(tokenId,orderIndex);
      resolve(SUCCESS);
    });
  }

  // 压缩图片
  compressImage(path: any): Promise<string> {

    return new Promise((resolve, reject) => {
      try {
        let img = new Image();
        img.crossOrigin='*';
        img.crossOrigin = "Anonymous";
        img.src = path;
        img.onload = () =>{
          let maxWidth = img.width / 4;
          let maxHeight = img.height / 4;
         let imgBase64 = UtilService.resizeImg(img,maxWidth,maxHeight,1);
         resolve(imgBase64);
        };
      } catch (err) {
        Logger.error(TAG, "Compress image error", err);
        reject("Compress image error" + JSON.stringify(err));
      }
    });
  }

  async getSetChannel(tokenId: any,orderIndex:any) {

    let order = await this.nftContractControllerService
    .getPasar()
    .getSellerOrderByIndex(orderIndex);
    this.orderId = order[0];

    let setChannel = this.feedService.getCollectibleStatus();
    let isTipToast:boolean = false;
    for (let key in setChannel) {
      let value = setChannel[key] || '';
      if (value) {
        isTipToast = true;
        let nodeId = key.split('_')[0];
        let channelId = parseInt(key.split('_')[1]);
        await this.sendPost(tokenId, nodeId, channelId);
      }
    }

    if(isTipToast){
      this.native.toast("CreatenewpostPage.tipMsg1");
    }
  }

  async sendPost(tokenId: any, nodeId: string, channelId: number) {
    let tempPostId = this.feedService.generateTempPostId();
    this.publishPostThrowMsg(tokenId, nodeId, channelId, tempPostId);
  }

  async publishPostThrowMsg(
    tokenId: any,
    nodeId: string,
    channelId: number,
    tempPostId: number,
  ) {
    let imgSize = this.thumbnail.length;
    if (imgSize > this.throwMsgTransDataLimit) {
      this.transDataChannel = FeedsData.TransDataChannel.SESSION;
      let memo: FeedsData.SessionMemoData = {
        feedId: channelId,
        postId: 0,
        commentId: 0,
        tempId: tempPostId,
      };
      this.feedService.restoreSession(nodeId, memo);
    } else {
      this.transDataChannel = FeedsData.TransDataChannel.MESSAGE;
    }

    let imgThumbs: FeedsData.ImgThumb[] = [];
    let imgThumb: FeedsData.ImgThumb = {
      index: 0,
      imgThumb: this.thumbnail,
      imgSize: imgSize,
    };
    imgThumbs.push(imgThumb);

    let nftContent = {};
    nftContent['version'] = '1.0';
    nftContent['imageThumbnail'] = imgThumbs;
    nftContent['text'] = this.nftName+" - "+ this.nftDescription;
    nftContent['nftTokenId'] = tokenId;
    nftContent['nftOrderId'] = this.orderId;

    // this.feedService.declarePost(
    //   nodeId,
    //   channelId,
    //   JSON.stringify(nftContent),
    //   false,
    //   tempPostId,
    //   this.transDataChannel,
    //   this.assetBase64,
    //   '',
    // );
  }

  number(text: any) {
    var numPattern = /^(([1-9]\d*)|\d)(.\d{1,9})?$/;
    return numPattern.test(text);
  }

  uploadData(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      this.realFile = this.handleChannelAvatar();
      if (this.realFile == null)
        console.log("Not select image");
      this.sendIpfsImage(this.realFile).then((realFileObj:any) => {
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
    this.popover = this.popupProvider.showalertdialog(
      this,
      'common.mintSuccess',
      'common.mintSuccessDesc',
      this.bindingCompleted,
      'finish.svg',
      'common.ok',
    );
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

  handleQuantity(events:any){
    let quantity = events.target.value || '';
    if(quantity == ""){
      return true;
    }
    let regNumber = /^\+?[1-9][0-9]*$/;
    if (regNumber.test(quantity) == false) {
      this.native.toastWarn('MintnftPage.quantityErrorMsg');
      return false;
    }
  }

  async handleCace(type:string,tokenId:any,orderIndex?: number){
    let tokenInfo = await this.nftContractControllerService
    .getSticker()
    .tokenInfo(tokenId);
    tokenId = tokenInfo[0];
    let createTime = tokenInfo[7];
    let creator = tokenInfo[4];//原作者
    let royalties = UtilService.accMul(this.nftRoyalties,10000);
    let accAddress =
    this.nftContractControllerService.getAccountAddress() || '';

    let slist = this.nftPersistenceHelper.getCollectiblesList(accAddress);
    let imageType = "image";
    let item:any = {};
    switch (type) {
      case 'created':
        item = {
          creator: creator,//原创者
          tokenId: tokenId,
          asset: this.imageObj['imgHash'],
          name: this.nftName,
          description: this.nftDescription,
          fixedAmount: null,
          kind: this.imageObj['imgFormat'],
          type: imageType,
          royalties: royalties,
          quantity: this.nftQuantity,
          curQuantity: this.nftQuantity,
          thumbnail: this.imageObj['thumbnail'],
          createTime: createTime * 1000,
          moreMenuType: 'created',
          sellerAddr: accAddress,//所有者
        };
        slist.push(item);
        break;
      case 'onSale':
        item = await this.nftContractHelperService.getSellerNFTItembyIndexFromContract(orderIndex);
        let orderSellerDidObj = this.feedService.getDidUriJson();
        item.orderSellerDidObj = orderSellerDidObj;
        slist.push(item);
        this.event.publish(FeedsEvent.PublishType.mintNft);
        break;
    }
    this.nftPersistenceHelper.setCollectiblesMap(accAddress, slist);
  }

 async getDidUri(){
    let didUriJSON = this.feedService.getDidUriJson();
    let didUri = await this.ipfsService.generateDidUri(didUriJSON);
    return didUri;
  }

  getTokenId() {
   let tokenId  = "0x"+UtilService.SHA256(this.feedsUrl);
   return tokenId;
  }

  handleChannelAvatar(){
    let channelAvatar = this.feedService.parseChannelAvatar(this.channel['avatar']);
    if(channelAvatar.startsWith("data:image")){
        return channelAvatar;
    }
    return null;


  }

}
