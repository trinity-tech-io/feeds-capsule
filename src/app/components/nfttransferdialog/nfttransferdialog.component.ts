import { Component, OnInit } from '@angular/core';
import { PopoverController, NavParams } from '@ionic/angular';
import _ from 'lodash';
import { IPFSService } from 'src/app/services/ipfs.service';
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { IntentService } from 'src/app/services/IntentService';
import { Events } from '../../services/events.service';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { PopupProvider } from 'src/app/services/popup';
import { Config } from 'src/app/services/config';

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
  public memo: string = '';
  public disableMemo: boolean = false;
  private tokenId: string = "";
  private curAssItem: any = null;
  constructor(
    private navParams: NavParams,
    private popover: PopoverController,
    private ipfsService: IPFSService,
    private native: NativeService,
    private intentService: IntentService,
    private events: Events,
    private nftContractControllerService: NFTContractControllerService,
    private popupProvider: PopupProvider,
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
    let imgUri = newAssItem['thumbnail'];
    let kind = newAssItem["kind"];
    if(kind === "gif"){
        imgUri = newAssItem['asset'];
    }
    if (imgUri.indexOf('feeds:imgage:') > -1) {
      imgUri = imgUri.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }else if(imgUri.indexOf('feeds:image:') > -1){
      imgUri = imgUri.replace('feeds:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }
   this.imgUri = imgUri;
  }

  cancel() {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  confirm() {
   if(this.checkParam()){
     this.handleTransfer();
   }
  }

  checkParam(){
    let ownerAddress = this.nftContractControllerService.getAccountAddress() || "";
    if(this.walletAddress === ""){
      this.native.toastWarn("common.walletAddressDes");
        return false;
    }

    if(ownerAddress === this.walletAddress){
       this.native.toastWarn("common.walletAddressDes1");
       return false;
    }

    return true;
  }

 async scanWalletAddress(){
    let scannedContent = (await this.intentService.scanQRCode()) || '';
    if (scannedContent != '' && scannedContent.indexOf('ethereum:') > -1) {
      this.walletAddress  = scannedContent.replace('ethereum:', '');
    }else if (scannedContent != '' && scannedContent.indexOf('elastos:') > -1) {
      this.walletAddress  = scannedContent.replace('elastos:', '');
    }
    else {
      this.walletAddress = scannedContent;
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

 advancedSettings() {
  this.isAdvancedSetting = !this.isAdvancedSetting;
 }

}