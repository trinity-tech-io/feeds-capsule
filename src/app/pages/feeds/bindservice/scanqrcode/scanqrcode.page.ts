import { Component, OnInit, NgZone } from '@angular/core';
import { FeedService } from '../../../../services/FeedService';
import { CarrierService } from '../../../../services/CarrierService';
import { NativeService } from '../../../../services/NativeService';
import { ThemeService } from '../../../../services/theme.service';
import { TranslateService } from "@ngx-translate/core";
import { Events,PopoverController} from '@ionic/angular';
import { CameraService } from '../../../../services/CameraService';
import { PopupProvider } from '../../../../services/popup';
import jsQR from "jsqr";

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-scanqrcode',
  templateUrl: './scanqrcode.page.html',
  styleUrls: ['./scanqrcode.page.scss'],
})
export class ScanqrcodePage implements OnInit {

  public connectionStatus = 1;
  public title = "01/06";
  public waitFriendsOnline = false;
  public carrierAddress: string;
  public scanContent: string;
  public nonce: string = "0";
  public popover:any = null;
  constructor(
    private events: Events,
    private native: NativeService,
    private zone: NgZone,
    private feedService:FeedService,
    private carrier: CarrierService,
    private translate:TranslateService,
    public  theme:ThemeService,
    private camera: CameraService,
    public popupProvider:PopupProvider,
    private popoverController:PopoverController
    ) {
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);

    this.connectionStatus = this.feedService.getConnectionStatus();
    this.events.subscribe(FeedsEvent.PublishType.connectionChanged,(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });
  }

  initTitle(){
    titleBarManager.setTitle(this.title);
  }

  ionViewDidEnter() {
  }

  ionViewWillLeave(){
    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    let value =  this.popoverController.getTop()["__zone_symbol__value"] || "";
    if(value!=""){
      this.popoverController.dismiss();
      this.popover = null;
    }
  }

  scanService(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }
    this.checkDid("scanService");
  }

  scanAddress() {
    this.waitFriendsOnline = false;

    appManager.sendIntent("https://scanner.elastos.net/scanqrcode", {}, {}, (res) => {
      let content = res.result.scannedContent;
      let contentStr = String(content);
      this.scanContent = contentStr;
      this.handleAddress();
      }, (err: any) => {
          console.error(err);
      });
  }

  handleAddress(){
    if (!this.scanContent.startsWith('feeds://') &&
    !this.scanContent.startsWith('feeds_raw://')){
      this.scanContent = "";
      alert(this.translate.instant("AddServerPage.tipMsg"));
      return ;
  }

  let result = this.feedService.parseBindServerUrl(this.scanContent);
  this.carrierAddress = result.carrierAddress;
  this.nonce = result.nonce;
  let did = result.did;
  this.carrier.getIdFromAddress(this.carrierAddress,
    (userId)=>{
        this.addFriends(this.carrierAddress, userId, this.nonce, did);
    },
    (err)=>{
    });
  }

  addFriends(address: string, nodeId: string, nonce: string, did: string){
    this.carrier.isValidAddress(address, (isValid:boolean) => {
      if (!isValid){
        let errMsg= this.translate.instant('common.addressinvalid')+": "+address;
        this.native.toast(errMsg);
        return;
      }
      this.carrier.addFriend(address, "hi",
        () => {
          this.zone.run(() => {
              let feedUrl = "-1";
              if (nonce == undefined) nonce = "";
              if (nonce == "0") feedUrl = this.scanContent;
              this.native.navigateForward(['/bindservice/startbinding/',nodeId, nonce, address, did, feedUrl],{
                replaceUrl: true
              });
          });
        }, (err) => {
        });
      },
      (error) => {
        // this.native.toast("address error: " + error);
      });
  }

  declareOwner(nodeId: string){
    this.feedService.declareOwnerRequest(nodeId, this.carrierAddress, this.nonce);
  }


  scanImage(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }
    this.checkDid("scanImage");
  }

  addImg(type: number) {
    this.camera.openCamera(
      80, 0, type,
      (imageUrl: any) => {
        this.zone.run(() => {
           this.base64ToqR(imageUrl);
        });
      },
      (err: any) => {
        console.error('Add img err', err);
      }
    );
  }

 base64ToqR(data:string) {
  let qrcanvas:any = document.getElementById("qrcanvas1");
  let ctx = qrcanvas.getContext("2d");
    let img = new Image();
    img.src = data;
    img.onload = ()=>{
       ctx.drawImage(img, 0, 0,500,500);
       let imageData = ctx.getImageData(0, 0,500,500);
       const code = jsQR(imageData.data,500,500, {
            inversionAttempts: "dontInvert",
        });
        if(code){
          this.scanContent = code.data;
          this.handleAddress();
        }else{
          this.native.toastWarn("AddServerPage.tipMsg1");
        }
    };
  }

  checkDid(clickType:string){
    let signInData = this.feedService.getSignInData() || {};
    let did = signInData["did"];
    this.feedService.checkDIDDocument(did).then((isOnSideChain)=>{
      if (!isOnSideChain){
        //show one button dialog
        //if click this button
        //call feedService.promptpublishdid() function
        this.openAlert();
        return;
      }
      this.handleJump(clickType);
    });
  }

  openAlert(){
    this.popover = this.popupProvider.ionicAlert(
      this,
      // "ConfirmdialogComponent.signoutTitle",
      "",
      "common.didnotrelease",
      this.confirm,
      'tskth.svg'
    );
  }

  confirm(that:any){
      if(this.popover!=null){
         this.popover.dismiss();
         that.feedService.promptpublishdid();
      }
  }

  handleJump(clickType:string){
      if(clickType === "scanService"){
           this.scanAddress();
           return;
      }
      if(clickType === "scanImage"){
        this.addImg(0);
        return;
      }
  }
}
