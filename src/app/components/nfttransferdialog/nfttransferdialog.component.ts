import { Component, OnInit } from '@angular/core';
import { PopoverController, NavParams, ModalController} from '@ionic/angular';
import _ from 'lodash';
import { IPFSService } from 'src/app/services/ipfs.service';
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { IntentService } from 'src/app/services/IntentService';
import { Events } from '../../services/events.service';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { PopupProvider } from 'src/app/services/popup';
import { Config } from 'src/app/services/config';
import { DataHelper } from 'src/app/services/DataHelper';

@Component({
  selector: 'app-nfttransferdialog',
  templateUrl: './nfttransferdialog.component.html',
  styleUrls: ['./nfttransferdialog.component.scss'],
})
export class NfttransferdialogComponent implements OnInit {
  public title: string = "";
  public imgUri: string = "";
  public walletAddress: string = "";
  public isAdvancedSetting: boolean = false;
  public quantity: string = "";
  public memo: string = 'Transfered via Feeds';
  public disableMemo: boolean = false;
  private tokenId: string = "";
  private curAssItem: any = null;
  private maxSize:number = 5 * 1024 * 1024;
  constructor(
    private navParams: NavParams,
    private popover: PopoverController,
    private ipfsService: IPFSService,
    private native: NativeService,
    private intentService: IntentService,
    private events: Events,
    private nftContractControllerService: NFTContractControllerService,
    private popupProvider: PopupProvider,
    private dataHelper: DataHelper,
    private modalController: ModalController,
    public theme:ThemeService,
  ) { }

  ngOnInit() {
    this.title = this.navParams.get('title');
    let assItem = this.navParams.get('assItem');
    this.curAssItem = _.cloneDeep(assItem);
    this.tokenId = assItem["tokenId"] || ""
    this.hanldeImg(assItem);
    this.quantity = assItem['curQuantity'] || assItem.quantity;
  }

  async hanldeImg(assItem:any) {
    let newAssItem  =  _.cloneDeep(assItem);
    let imgUri = "";
    let kind = "";
    let version = newAssItem['version'] || "1";
    let size = "";
    if(version === "1"){
      imgUri = newAssItem['thumbnail'] || "";
      kind = newAssItem["kind"];
      size = newAssItem["originAssetSize"];
      if (!size)
      size = '0';
      if (kind === "gif" && parseInt(size) <= this.maxSize) {
          imgUri = newAssItem['asset'] || "";
      }
    }else if(version === "2"){
      let jsonData  = newAssItem['data'] || "";
      if(jsonData != ""){
        imgUri = jsonData['thumbnail'] || "";
        kind = jsonData["kind"];
        size = jsonData["size"];
        if (!size)
        size = '0';
        if (kind === "gif" && parseInt(size) <= this.maxSize) {
            imgUri =  jsonData['image'] || "";;
        }
      }else{
        imgUri = "";
      }
    }
    if(imgUri === ""){
      this.imgUri = "";
      return;
    }
    if (imgUri.indexOf('feeds:imgage:') > -1) {
      imgUri = imgUri.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }else if(imgUri.indexOf('feeds:image:') > -1){
      imgUri = imgUri.replace('feeds:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }else if(imgUri.indexOf('pasar:image:') > -1){
      imgUri = imgUri.replace('pasar:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }
   this.imgUri = imgUri;
  }

  async cancel() {
    if (this.popover != null) {
       await this.popover.dismiss();
    }
  }

  async confirm() {
   let isOK = await this.checkParam();
   if(isOK){
    let memo = this.memo || "Transfered via Feeds";
    if(memo === ""){
      this.handleTransfer();
     }else{
       this.handleTransferWithMemo();
     }
   }
  }

 async checkParam(){
    let ownerAddress = this.nftContractControllerService.getAccountAddress() || "";
    if(this.walletAddress === ""){
      this.native.toastWarn("common.walletAddressDes");
        return false;
    }

    if(ownerAddress === this.walletAddress){
       this.native.toastWarn("common.walletAddressDes1");
       return false;
    }
    let sellerDiaBalance = await this.nftContractControllerService.getDiamond().getDiamondBalance(ownerAddress);
    if(parseFloat(sellerDiaBalance) < 0.01){
      this.native.toastWarn("common.walletAddressDes2");
      return false;
    }
    return true;
  }

 async scanWalletAddress(){
   let scanObj =  await this.popupProvider.scan() || {};
   let scanData = scanObj["data"] || {};
    let scannedContent = scanData["scannedText"] || "";
    if(scannedContent === ''){
      this.walletAddress = "";
      return;
    }
    if (scannedContent.indexOf('ethereum:') > -1) {
      this.walletAddress  = scannedContent.replace('ethereum:', '');
    }else if (scannedContent.indexOf('elastos:') > -1) {
      this.walletAddress  = scannedContent.replace('elastos:', '');
    }else{
      this.walletAddress  = scannedContent;
    }
  }

 async handleTransfer(){
  await this.popover.dismiss();
  this.events.publish(FeedsEvent.PublishType.startLoading,{des:"common.tranferNFTSDesc",title:"common.waitMoment",curNum:"1",maxNum:"1",type:"changePrice"});
  let sId =setTimeout(()=>{
    this.nftContractControllerService.getSticker().cancelTransferProcess();
    this.events.publish(FeedsEvent.PublishType.endLoading);
    clearTimeout(sId);
    this.popupProvider.showSelfCheckDialog('common.tranferNFTSTimeoutDesc');
  }, Config.WAIT_TIME_BURN_NFTS);


  let tokenNum = this.quantity.toString();
  let ownerAddress = this.nftContractControllerService.getAccountAddress() || "";
  this.nftContractControllerService.getSticker()
  .safeTransferFrom(ownerAddress,this.walletAddress,this.tokenId,tokenNum)
  .then(()=>{
    this.nftContractControllerService.getSticker().cancelTransferProcess();
    this.events.publish(FeedsEvent.PublishType.endLoading);
    this.events.publish(FeedsEvent.PublishType.nftUpdateList,{type:"transfer",assItem:this.curAssItem,transferNum:tokenNum});
    clearTimeout(sId);
    this.native.toast("common.tranferNFTSSuccess");
  }).catch(()=>{
    this.nftContractControllerService.getSticker().cancelTransferProcess();
    this.events.publish(FeedsEvent.PublishType.endLoading);
    clearTimeout(sId);
    this.native.toastWarn("common.tranferNFTSFailed");
  });
 }

 async handleTransferWithMemo(){
  await this.popover.dismiss();
  this.events.publish(FeedsEvent.PublishType.startLoading,{des:"common.tranferNFTSDesc",title:"common.waitMoment",curNum:"1",maxNum:"1",type:"changePrice"});
  let sId =setTimeout(()=>{
    this.nftContractControllerService.getSticker().cancelTransferProcess();
    this.events.publish(FeedsEvent.PublishType.endLoading);
    clearTimeout(sId);
    this.popupProvider.showSelfCheckDialog('common.tranferNFTSTimeoutDesc');
  }, Config.WAIT_TIME_BURN_NFTS);


  let tokenNum = this.quantity.toString();
  let ownerAddress = this.nftContractControllerService.getAccountAddress() || "";
  this.nftContractControllerService.getSticker()
  .safeTransferFromWithMemo(ownerAddress,this.walletAddress,this.tokenId,tokenNum,this.memo)
  .then(()=>{
    this.nftContractControllerService.getSticker().cancelTransferProcess();
    this.events.publish(FeedsEvent.PublishType.endLoading);
    this.events.publish(FeedsEvent.PublishType.nftUpdateList,{type:"transfer",assItem:this.curAssItem,transferNum:tokenNum});
    clearTimeout(sId);
    this.native.toast("common.tranferNFTSSuccess");
  }).catch(()=>{
    this.nftContractControllerService.getSticker().cancelTransferProcess();
    this.events.publish(FeedsEvent.PublishType.endLoading);
    clearTimeout(sId);
    this.native.toastWarn("common.tranferNFTSFailed");
  });
 }

 advancedSettings() {
  this.isAdvancedSetting = !this.isAdvancedSetting;
 }

}
