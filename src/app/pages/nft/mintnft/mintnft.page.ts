import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../../services/theme.service';
import { CameraService } from '../../../services/CameraService';
import { NativeService } from '../../../services/NativeService';
import { UtilService } from '../../../services/utilService';
// import { Web3Service } from '../../../services/Web3Service';
import { Events } from '../../../services/events.service';
import { TitleBarService } from '../../../services/TitleBarService';
import { TitleBarComponent } from '../../../components/titlebar/titlebar.component';
import { File, DirectoryEntry } from '@ionic-native/file/ngx';
import { HttpService } from '../../../services/HttpService';
import { FeedService } from '../../../services/FeedService';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import { PopupProvider } from 'src/app/services/popup';
import { IPFSService } from 'src/app/services/ipfs.service';

const SUCCESS = 'success';
const SKIP = 'SKIP';
@Component({
  selector: 'app-mintnft',
  templateUrl: './mintnft.page.html',
  styleUrls: ['./mintnft.page.scss'],
})
export class MintnftPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  private throwMsgTransDataLimit = 4 * 1000 * 1000;
  private transDataChannel: FeedsData.TransDataChannel =
    FeedsData.TransDataChannel.MESSAGE;
  public assetBase64: string = '';
  public nftName: string = '';
  public nftDescription: string = '';
  public curPublishtoPasar: boolean = true;
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
  private imagePath = "";
  private tokenId:string = "";
  constructor(
    private translate: TranslateService,
    private event: Events,
    private zone: NgZone,
    private camera: CameraService,
    private native: NativeService,
    private titleBarService: TitleBarService,
    private httpService: HttpService,
    private file: File,
    // private web3Service:Web3Service,
    private feedService: FeedService,
    public theme: ThemeService,
    private nftContractControllerService: NFTContractControllerService,
    private walletConnectControllerService: WalletConnectControllerService,
    private popupProvider: PopupProvider,
    private ipfsService: IPFSService
  ) {}

  ngOnInit() {}

  ionViewWillEnter() {
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

  clickPublishtoPasar() {
    this.zone.run(() => {
      this.curPublishtoPasar = !this.curPublishtoPasar;
    });
  }

  addAsset() {
    this.addImg(0)
      .then((imagePath) => {
        this.imagePath = imagePath;
        let pathObj = this.handlePath(this.imagePath);
        let fileName = pathObj['fileName'];
        let filePath = pathObj['filepath'];
        return this.getFlieObj(fileName, filePath);
      }).then((fileBase64) => {
        this.assetBase64 = fileBase64;
        return this.compressImage(fileBase64);
      }).then((compressBase64) => {
        this.thumbnail = compressBase64;
      });
  }

  mint() {
    if (!this.checkParms()) {
      // show params error
      return;
    }

    this.doMint();
  }

  async doMint() {
    //Start loading
    await this.native.showLoading(
      'common.waitMoment',
      isDismiss => {
        if (isDismiss) {
          this.nftContractControllerService
            .getSticker()
            .cancelMintProcess();
          this.nftContractControllerService
            .getSticker()
            .cancelSetApprovedProcess();
          this.nftContractControllerService
            .getPasar()
            .cancelCreateOrderProcess();
          this.showSelfCheckDialog();
        }
      },
      3 * 60000,
    );

    let tokenId = '';
    let jsonHash = '';
    this.native.changeLoadingDesc("common.uploadingData");
    this.uploadData()
      .then((result) => {
        console.log("Upload Result is", result);
        this.native.changeLoadingDesc("common.uploadDataSuccess");
        tokenId = result.tokenId;
        jsonHash = result.jsonHash;
        this.native.changeLoadingDesc("common.mintingData");
        let nftRoyalties = UtilService.accMul(parseInt(this.nftRoyalties),10000);
        return this.mintContract(tokenId, jsonHash, this.nftQuantity,nftRoyalties.toString());
      })
      .then(mintResult => {
        if (mintResult != '' && this.curPublishtoPasar) {
          this.native.changeLoadingDesc("common.settingApproval");
          return this.handleSetApproval();
        }
        return SKIP;
      })
      .then(setApprovalResult => {
        if (setApprovalResult == SKIP) return -1;
        this.native.changeLoadingDesc("common.creatingOrder");
        return this.handleCreateOrder(tokenId);
      })
      .then(orderIndex => {
        if (orderIndex == -1) return SKIP;
        this.native.changeLoadingDesc("common.checkingCollectibleResult");
        return this.handleOrderResult(tokenId, orderIndex);
      })
      .then(() => {
        //Finish
        this.handleCace('created',tokenId);
        this.native.hideLoading();
        this.showSuccessDialog();
        // this.native.pop();
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

        this.native.hideLoading();
        this.native.toast_trans('common.publicPasarFailed');
      });
  }

  getFlieObj(fileName: string, filepath: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      this.file
      .resolveLocalFilesystemUrl(filepath)
      .then((dirEntry: DirectoryEntry) => {
        dirEntry.getFile(
          fileName,
          { create: true, exclusive: false },
          fileEntry => {
            fileEntry.file(
              file => {
                let fileReader = new FileReader();
                fileReader.onloadend = (event: any) => {
                  this.zone.run(() => {
                    let assetBase64 = fileReader.result.toString();
                    resolve(assetBase64);
                  });
                };
                fileReader.onprogress = (event: any) => {
                  this.zone.run(() => {});
                };
                fileReader.readAsDataURL(file);
              },
              () => {},
            );
          },
          () => {
            reject('error');
          },
        );
      })
      .catch(dirEntryErr => {
        reject(dirEntryErr);
        console.log('====dirEntryErr====' + JSON.stringify(dirEntryErr));
      });
    });
  }

  sendIpfsImage(fileName: string, file: any):Promise<string>{
    return new Promise(async (resolve, reject) => {
      let blob = this.dataURLtoBlob(file);
      let formData = new FormData();
      formData.append('', blob);
      this.ipfsService
        .nftPost(formData)
        .then(result => {
          let hash = result['Hash'] || null;
          let index = fileName.lastIndexOf(".");
          let imgFormat = fileName.substr(index+1);
          if (!hash) {
            reject("Upload Image error, hash is null")
            return;
          }

          this.assetBase64 = file;
          this.imageObj['imgSize'] = result['Size'];
          let tokenId = '0x' + UtilService.SHA256(hash);
          this.imageObj['imgHash'] = 'feeds:imgage:' + hash;
          this.imageObj['imgFormat'] = imgFormat;

          resolve(tokenId);
        })
        .catch(err => {
          reject('Upload image error, error is ' + JSON.stringify(err));
        });
      // this.httpService
      //   .ajaxNftPost(ApiUrl.nftAdd, formData)
      //   .then(result => {
      //     let hash = result['Hash'] || null;
      //     let imgFormat = fileName.split('.')[1];
      //     if (!hash) {
      //       reject("Upload Image error, hash is null")
      //       return;
      //     }

      //     this.assetBase64 = file;
      //     this.imageObj['imgSize'] = result['Size'];
      //     let tokenId = '0x' + UtilService.SHA256(hash);
      //     this.imageObj['imgHash'] = 'feeds:imgage:' + hash;
      //     this.imageObj['imgFormat'] = imgFormat;

      //     resolve(tokenId);
      //   })
      //   .catch(err => {
      //     reject('Upload image error, error is ' + JSON.stringify(err));
      //   });
    });
  }

  sendIpfsThumbnail(thumbnailBase64: string) {
    return new Promise(async (resolve, reject) => {
      let thumbnailBlob = this.dataURLtoBlob(thumbnailBase64);
      let formData = new FormData();
      formData.append('', thumbnailBlob);
      this.ipfsService
        .nftPost(formData)
        .then(result => {
          let hash = result['Hash'] || null;
          if (!hash) {
            reject("Send thumbnail error, hash is null");
            return;
          }

          this.thumbnail = thumbnailBase64;
          this.imageObj['thumbnail'] = 'feeds:imgage:' + hash;
          resolve('');
        })
        .catch(err => {
          reject("Send thumbnail error, error is " + JSON.stringify(err));
        });
      // this.httpService
      //   .ajaxNftPost(ApiUrl.nftAdd, formData)
      //   .then(result => {
      //     let hash = result['Hash'] || null;
      //     if (!hash) {
      //       reject("Send thumbnail error, hash is null");
      //       return;
      //     }

      //     this.thumbnail = thumbnailBase64;
      //     this.imageObj['thumbnail'] = 'feeds:imgage:' + hash;
      //     resolve('');
      //   })
      //   .catch(err => {
      //     reject("Send thumbnail error, error is " + JSON.stringify(err));
      //   });
    });
  }

  sendIpfsJSON(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let ipfsJSON = {
        version: '1',
        type: 'image',
        name: this.nftName,
        description: this.nftDescription,
        image: this.imageObj['imgHash'],
        kind: this.imageObj['imgFormat'],
        size: this.imageObj['imgSize'],
        thumbnail: this.imageObj['thumbnail'],
      };

      let formData = new FormData();
      formData.append('', JSON.stringify(ipfsJSON));

      this.ipfsService
        .nftPost(formData)
        .then(result => {
          //{"Name":"blob","Hash":"QmaxWgjheueDc1XW2bzDPQ6qnGi9UKNf23EBQSUAu4GHGF","Size":"17797"};
          console.log('====json Data=====' + JSON.stringify(result));
          let hash = result['Hash'] || null;
          if (hash != null) {
            //let tokenId = '0x' + UtilService.SHA256(hash);
            let jsonHash = 'feeds:json:' + hash;

            resolve(jsonHash);
          }
        })
        .catch(err => {
          console.log('========' + JSON.stringify(err));
          reject('upload json error');
        });
      // this.httpService
      //   .ajaxNftPost(ApiUrl.nftAdd, formData)
      //   .then(result => {
      //     //{"Name":"blob","Hash":"QmaxWgjheueDc1XW2bzDPQ6qnGi9UKNf23EBQSUAu4GHGF","Size":"17797"};
      //     console.log('====json Data=====' + JSON.stringify(result));
      //     let hash = result['Hash'] || null;
      //     if (hash != null) {
      //       //let tokenId = '0x' + UtilService.SHA256(hash);
      //       let jsonHash = 'feeds:json:' + hash;

      //       resolve(jsonHash);
      //     }
      //   })
      //   .catch(err => {
      //     console.log('========' + JSON.stringify(err));
      //     reject('upload json error');
      //   });
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

  addImg(type: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.camera.openCamera(
        100,
        1,
        type,
        (imgPath: any) => {
          // this.zone.run(() => {
          // this.imagePath = imgPath;
          resolve(imgPath);
          // });
        },
        (err: any) => {
          console.error('Add img err', err);
          let imgUrl = this.assetBase64 || '';
          if (!imgUrl) {
            this.native.toast_trans('common.noImageSelected');
            reject(err);
            return;
          }
        }
      );
    });
  }

  removeImg() {
    this.thumbnail = '';
    this.assetBase64 = '';
  }

  checkParms() {
    let accountAddress =
      this.nftContractControllerService.getAccountAddress() || '';
    if (accountAddress === '') {
      this.native.toastWarn('common.connectWallet');
      return;
    }

    if (this.thumbnail === '') {
      this.native.toastWarn('MintnftPage.nftAssetPlaceholder');
      return false;
    }

    if (this.nftName === '') {
      this.native.toastWarn('MintnftPage.nftNamePlaceholder');
      return false;
    }

    if (this.nftDescription === '') {
      this.native.toastWarn('MintnftPage.nftDescriptionPlaceholder');
      return false;
    }

    if (
      this.curPublishtoPasar &&
      this.issueRadionType === 'oneTimeIssue' &&
      this.nftFixedAmount === null
    ) {
      this.native.toastWarn('MintnftPage.nftFixedAmount');
      return false;
    }

    if (
      this.curPublishtoPasar &&
      this.issueRadionType === 'oneTimeIssue' &&
      !this.number(this.nftFixedAmount)
    ) {
      this.native.toastWarn('common.amountError');
      return false;
    }

    if (
      this.curPublishtoPasar &&
      this.issueRadionType === 'oneTimeIssue' &&
      this.nftFixedAmount <= 0
    ) {
      this.native.toastWarn('MintnftPage.priceErrorMsg');
      return;
    }

    if (
      this.curPublishtoPasar &&
      this.issueRadionType === 'reIssueable' &&
      this.nftMinimumAmount === null
    ) {
      this.native.toastWarn('MintnftPage.nftMinimumAmount');
      return false;
    }
    let regNumber = /^\+?[1-9][0-9]*$/;
    if (this.nftRoyalties === '') {
      this.native.toastWarn('MintnftPage.nftRoyaltiesPlaceholder');
      return false;
    }

    if (regNumber.test(this.nftRoyalties) == false) {
      this.native.toastWarn('MintnftPage.royaltiesErrorMsg');
      return false;
    }

    if(parseInt(this.nftRoyalties)<=0 || parseInt(this.nftRoyalties)>15){
      this.native.toastWarn('MintnftPage.royaltiesErrorMsg');
      return false;
    }

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
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const MINT_ERROR = 'Mint process error';
      let result = '';
      try {
        result = await this.nftContractControllerService
          .getSticker()
          .mint(tokenId, supply, uri, royalty);
      } catch (error) {
        reject(MINT_ERROR);
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
      let pasarAddress = this.nftContractControllerService
        .getPasar()
        .getAddress();
      let result = '';
      let accountAddress = this.nftContractControllerService.getAccountAddress();
      try {
        result = await this.nftContractControllerService
          .getSticker()
          .setApprovalForAll(accountAddress, pasarAddress, true);
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
      let price = UtilService.accMul(this.nftFixedAmount, this.nftQuantity);
      let salePrice = this.nftContractControllerService
        .transToWei(price.toString())
        .toString();
      let orderIndex = -1;
      try {
        orderIndex = await this.nftContractControllerService
          .getPasar()
          .createOrderForSale(tokenId, this.nftQuantity, salePrice);
      } catch (error) {
        reject(orderIndex);
      }

      if (orderIndex == null || orderIndex == undefined || orderIndex == -1) {
        orderIndex = -1;
        reject(orderIndex);
        return;
      }
      resolve(orderIndex);
    });
  }

  async handleOrderResult(
    tokenId: string,
    orderIndex: number,
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      this.handleCace('onSale',tokenId,orderIndex);
      await this.getSetChannel(tokenId);
      resolve(SUCCESS);
    });
  }

  // 压缩图片
  compressImage(path: any): Promise<string> {
    //最大高度
    const maxHeight = 600;
    //最大宽度
    const maxWidth = 600;
    return new Promise((resolve, reject) => {
      try {
        let img = new Image();
        img.src = path;

        img.onload = () => {
          const originHeight = img.height;
          const originWidth = img.width;
          let compressedWidth = img.height;
          let compressedHeight = img.width;
          if (originWidth > maxWidth && originHeight > maxHeight) {
            // 更宽更高，
            if (originHeight / originWidth > maxHeight / maxWidth) {
              // 更加严重的高窄型，确定最大高，压缩宽度
              compressedHeight = maxHeight;
              compressedWidth = maxHeight * (originWidth / originHeight);
            } else {
              //更加严重的矮宽型, 确定最大宽，压缩高度
              compressedWidth = maxWidth;
              compressedHeight = maxWidth * (originHeight / originWidth);
            }
          } else if (originWidth > maxWidth && originHeight <= maxHeight) {
            // 更宽，但比较矮，以maxWidth作为基准
            compressedWidth = maxWidth;
            compressedHeight = maxWidth * (originHeight / originWidth);
          } else if (originWidth <= maxWidth && originHeight > maxHeight) {
            // 比较窄，但很高，取maxHight为基准
            compressedHeight = maxHeight;
            compressedWidth = maxHeight * (originWidth / originHeight);
          } else {
            // 符合宽高限制，不做压缩
          }
          // 生成canvas
          let canvas = document.createElement('canvas');
          let context = canvas.getContext('2d');
          canvas.height = compressedHeight;
          canvas.width = compressedWidth;
          // context.globalAlpha = 0.2;
          context.clearRect(0, 0, compressedWidth, compressedHeight);
          context.drawImage(img, 0, 0, compressedWidth, compressedHeight);
          let base64 = canvas.toDataURL('image/*', 0.7);
          if (!base64) {
            let error = "Compress image error, result is null";
            console.log(error);
            reject(error);
          }
          resolve(base64);
        };
      } catch (err) {
        console.log("Compress image error", err);
        reject("Compress image error" + JSON.stringify(err));
      }
    });
  }

  async getSetChannel(tokenId: any) {
    let setChannel = this.feedService.getCollectibleStatus();
    for (let key in setChannel) {
      let value = setChannel[key] || '';
      if (value) {
        let nodeId = key.split('_')[0];
        let channelId = parseInt(key.split('_')[1]);
        await this.sendPost(tokenId, nodeId, channelId);
      }
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
    nftContent['text'] = this.nftDescription;
    nftContent['nftTokenId'] = tokenId;
    nftContent['nftOrderId'] = this.orderId;
    //let content = this.feedService.createContent(this.nftDescription,imgThumbs,null);
    this.feedService.declarePost(
      nodeId,
      channelId,
      JSON.stringify(nftContent),
      false,
      tempPostId,
      this.transDataChannel,
      this.thumbnail,
      '',
    );
  }

  number(text: any) {
    var numPattern = /^(([1-9]\d*)|\d)(.\d{1,9})?$/;
    return numPattern.test(text);
  }

  uploadData(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let pathObj = this.handlePath(this.imagePath);
      let fileName = pathObj['fileName'];
      let filePath = pathObj['filepath']
      let file = null;
      let tokenId = "";
      this.getFlieObj(fileName, filePath).then((fileBase64) => {
        file = fileBase64;
        return this.sendIpfsImage(fileName, file);
      }).then((cid) => {
        tokenId = cid;
        return this.sendIpfsThumbnail(this.thumbnail);
      }).then(() => {
        return this.sendIpfsJSON();
      }).then((jsonHash) => {
        resolve({ tokenId: tokenId, jsonHash: jsonHash });
      }).catch((error) => {
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

  handleRoyalties(events:any) {
   let royalties = events.target.value || '';
   let regNumber = /^\+?[1-9][0-9]*$/;
   if (regNumber.test(royalties) == false) {
    this.native.toastWarn('MintnftPage.royaltiesErrorMsg');
    return false;
  }
  if(parseInt(royalties)<=0 || parseInt(royalties)>15){
    this.native.toastWarn('MintnftPage.royaltiesErrorMsg');
    return false;
  }
  }

  async handleCace(type:string,tokenId:any,orderIndex?: number){
    let tokenInfo = await this.nftContractControllerService
    .getSticker()
    .tokenInfo(tokenId);
    let createTime = tokenInfo[7];
    let royalties = UtilService.accMul(this.nftRoyalties,10000);
    let accAddress =
    this.nftContractControllerService.getAccountAddress() || '';
    let allList = this.feedService.getOwnNftCollectiblesList();
    let slist = allList[accAddress] || [];
    let item:any = {};
       switch(type){
         case 'created':
          item = {
            creator:accAddress,
            tokenId: tokenId,
            asset: this.imageObj['imgHash'],
            name: this.nftName,
            description: this.nftDescription,
            fixedAmount:null,
            kind: this.imageObj['imgFormat'],
            type: this.issueRadionType,
            royalties: royalties,
            quantity: this.nftQuantity,
            thumbnail: this.imageObj['thumbnail'],
            createTime: createTime * 1000,
            moreMenuType: 'created',
          };
          slist.push(item);
           break;
         case 'onSale':
          let order = await this.nftContractControllerService
          .getPasar()
          .getSellerOrderByIndex(orderIndex);

        this.orderId = order[0];
        // tokenId = order[3];
        let sellerAddr = order[7] || '';
        let saleOrderId = order[0];
        item = {
          creator:accAddress,
          saleOrderId: saleOrderId,
          tokenId: tokenId,
          asset: this.imageObj['imgHash'],
          name: this.nftName,
          description: this.nftDescription,
          fixedAmount: order[5],
          kind: this.imageObj['imgFormat'],
          type: this.issueRadionType,
          royalties: royalties,
          quantity: this.nftQuantity,
          thumbnail: this.imageObj['thumbnail'],
          sellerAddr: sellerAddr,
          createTime: createTime * 1000,
          moreMenuType: 'onSale',
        };
        let list = this.feedService.getPasarList();
        list.push(item);
        this.feedService.setPasarList(list);
        this.feedService.setData('feed.nft.pasarList', JSON.stringify(list));
           break;
       }
      this.feedService.setOwnNftCollectiblesList(allList);
      this.feedService.setData(
         'feed.nft.own.collectibles.list',
         JSON.stringify(allList),
      );
  }
}
