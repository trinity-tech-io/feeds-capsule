import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { Events } from 'src/app/services/events.service';
import { NativeService } from 'src/app/services/NativeService';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { ActivatedRoute } from '@angular/router';
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IntentService } from 'src/app/services/IntentService';
import { PopupProvider } from 'src/app/services/popup';
import { Config } from 'src/app/services/config';
import { Logger } from 'src/app/services/logger';
import { IPFSService } from 'src/app/services/ipfs.service';
import { UtilService } from 'src/app/services/utilService';
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';
import { NFTContractHelperService } from 'src/app/services/nftcontract_helper.service';
const SUCCESS = 'success';
const SKIP = 'SKIP';
const TAG: string = 'MintpostPage';
@Component({
  selector: 'app-mintpost',
  templateUrl: './mintpost.page.html',
  styleUrls: ['./mintpost.page.scss'],
})

// {
// 	"nodeId": nodeId,
// 	"channelId": channelId,
// 	"postId": postId,
// 	"channelName": channelName
// }
export class MintpostPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  private nodeId: string = "";
  private channelId: number = 0;
  private postId: number = 0;
  private didUri:string = null;
  public nftName: string = "";
  public nftDescription: string = "";
  public isLoading:boolean = false;
  public loadingTitle:string = "common.waitMoment";
  public loadingText:string = "";
  public loadingCurNumber:string = "";
  public loadingMaxNumber:string = "";
  public popover: any = null;
  public postTextJson = {
    "version": "2",
    "name":"",
    "description":"",
    "type":"FeedsPost",
    "data": {
        "text_body":"",
        "text_source":"",
        "feeds_channel":"",
    },
    "adult": false
  };
  constructor(
    private translate: TranslateService,
    private event: Events,
    private native: NativeService,
    private titleBarService: TitleBarService,
    private activatedRoute: ActivatedRoute,
    private feedService: FeedService,
    private nftContractControllerService: NFTContractControllerService,
    private intentService: IntentService,
    private popupProvider: PopupProvider,
    private ipfsService: IPFSService,
    private nftPersistenceHelper: NFTPersistenceHelper,
    private nftContractHelperService: NFTContractHelperService,
    public theme: ThemeService,
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((queryParams:any) => {
       this.nodeId = queryParams.nodeId;
       this.channelId = queryParams.channelId;
       this.postId = queryParams.postId;
       this.postTextJson.data['feeds_channel'] = queryParams.channelName;
    });
  }

  ionViewWillEnter() {
    this.initTile();
    this.initPostContent();
  }

  initPostContent() {
    let post = this.feedService.getPostFromId(
      this.nodeId,
      this.channelId,
      this.postId,
    );

   this.postTextJson.data.text_body =  this.feedService.parsePostContentText(post.content);
  }

  ionViewWillLeave() {

  }

  initTile() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('common.mintpost'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

 async mint(){
    if (!this.checkParms()) {
      // show params error
      return;
    }
    this.postTextJson.data.text_source = await this.getUrl();
    this.doMint();
  }

  checkParms() {
    let accountAddress =
      this.nftContractControllerService.getAccountAddress() || '';
    if (accountAddress === '') {
      this.native.toastWarn('common.connectWallet');
      return;
    }
    if (this.postTextJson.name === '') {
      this.native.toastWarn('MintnftPage.nftNamePlaceholder');
      return false;
    }

    if (this.postTextJson.description === '') {
      this.native.toastWarn('MintnftPage.nftDescriptionPlaceholder');
      return false;
    }

    return true;
  }

 async getUrl(){
   // await this.native.showLoading("common.generateSharingLink");
    try {
      const sharedLink = await this.intentService.createShareFullLink(this.nodeId, this.channelId, this.postId);
      //this.native.hideLoading();
      return sharedLink;
    } catch (error) {
    }
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
        .getPasar()
        .cancelCreateOrderProcess();
      this.showSelfCheckDialog();
      clearTimeout(sid);
    },Config.WAIT_TIME_MINT);

    this.loadingCurNumber = "1";
    this.loadingMaxNumber = "3";
    this.loadingText = "common.uploadingData"
    this.isLoading = true;

    let tokenId = '';
    let jsonHash = '';
    //this.native.changeLoadingDesc("common.uploadingData");
    this.uploadData()
      .then(async(result) => {
        Logger.log(TAG, 'Upload Result', result);
        //this.native.changeLoadingDesc("common.uploadDataSuccess");
        this.loadingCurNumber = "1";
        this.loadingText = "common.uploadDataSuccess";

        tokenId = result.tokenId;
        jsonHash = result.jsonHash;
        //this.native.changeLoadingDesc("common.mintingData");
        this.loadingCurNumber = "2";
        this.loadingText = "common.mintingData";
        //let did = this.feedService.
        let didUri = await this.getDidUri();
        return this.mintContract(tokenId, jsonHash,"1","0",didUri);
      }).then((status) => {
        if(status === SKIP){
          this.loadingCurNumber = "3";
          this.loadingText = "common.checkingCollectibleResult";
        }
        //Finish
          this.handleCace('created',tokenId);
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

  uploadData(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let tokenId = "";
      this.sendIpfsText().then((cid)=>{
          tokenId = cid;
      }).then(()=>{
        return this.sendIpfsJSON();
      }).then((jsonHash) => {
        resolve({ tokenId: tokenId, jsonHash: jsonHash });
      }).catch((error) => {
        reject('upload file error');
      });
    });
  }

  sendIpfsJSON(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let ipfsJSON:any = null;
          ipfsJSON = this.postTextJson;
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

  sendIpfsText(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let ipfsText:string = null;
          ipfsText = this.postTextJson.data.text_body;
      let formData = new FormData();
      formData.append('',ipfsText);
      Logger.log(TAG, 'Send json, formdata length is', formData.getAll('').length);
      this.ipfsService
        .nftPost(formData)
        .then(result => {
          //{"Name":"blob","Hash":"QmaxWgjheueDc1XW2bzDPQ6qnGi9UKNf23EBQSUAu4GHGF","Size":"17797"};
          let hash = result['Hash'] || null;
          if (!hash) {
            reject("Upload Image error, hash is null")
            return;
          }
          let tokenId = '0x' + UtilService.SHA256(hash);
          resolve(tokenId);
        })
        .catch(err => {
          Logger.error(TAG, 'Send Json data error', err);
          reject('upload json error');
        });
    });
  }

  async getDidUri(){
    return await this.feedService.getDidUri();
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

  async handleCace(type:string,tokenId:any,orderIndex?: number){
    let tokenInfo = await this.nftContractControllerService
    .getSticker()
    .tokenInfo(tokenId);
    const tokenJson = await this.nftContractHelperService.getTokenJson(tokenInfo.tokenUri);;
    tokenId = tokenInfo[0];
    // let createTime = tokenInfo[7];
    // let creator = tokenInfo[4];//原作者
    // let royalties = UtilService.accMul(this.nftRoyalties,10000);
    let accAddress =
    this.nftContractControllerService.getAccountAddress() || '';

    let slist = this.nftPersistenceHelper.getCollectiblesList(accAddress);
    // let imageType = "image";
    // if(this.assetType === "avatar"){
    //    imageType = "avatar";
    // }
    let item:any = {};
    switch (type) {
      case 'created':
        // item = {
        //   creator: creator,//原创者
        //   tokenId: tokenId,
        //   asset: this.imageObj['imgHash'],
        //   name: this.nftName,
        //   description: this.nftDescription,
        //   fixedAmount: null,
        //   kind: this.imageObj['imgFormat'],
        //   type: imageType,
        //   royalties: royalties,
        //   quantity: this.nftQuantity,
        //   curQuantity: this.nftQuantity,
        //   thumbnail: this.imageObj['thumbnail'],
        //   createTime: createTime * 1000,
        //   moreMenuType: 'created',
        //   sellerAddr: accAddress,//所有者
        //   adult: this.adult
        // };
        item = this.nftContractHelperService.creteItemFormTokenId(tokenInfo, tokenJson, 'created');
        slist.push(item);
        break;
    }
    this.nftPersistenceHelper.setCollectiblesMap(accAddress, slist);
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

  bindingCompleted(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      this.popover = null;
      that.native.pop();
    }
  }

}
