import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { FeedService } from '../../../../services/FeedService';
import { CarrierService } from '../../../../services/CarrierService';
import { NativeService } from '../../../../services/NativeService';
import { ThemeService } from '../../../../services/theme.service';
import { TranslateService } from "@ngx-translate/core";
import { Events,PopoverController} from '@ionic/angular';
import { CameraService } from '../../../../services/CameraService';
import { PopupProvider } from '../../../../services/popup';
import { IntentService } from 'src/app/services/IntentService';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

@Component({
  selector: 'app-scanqrcode',
  templateUrl: './scanqrcode.page.html',
  styleUrls: ['./scanqrcode.page.scss'],
})
export class ScanqrcodePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public connectionStatus = 1;
  public title = "01/06";
  public waitFriendsOnline = false;
  public carrierAddress: string;
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
    private popoverController:PopoverController,
    private intentService:IntentService,
    private titleBarService: TitleBarService
    ) {
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);

    this.connectionStatus = this.feedService.getConnectionStatus();
    this.events.subscribe(FeedsEvent.PublishType.connectionChanged,(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });
  }

  initTitle(){
    this.titleBarService.setTitle(this.titleBar, this.title);
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

  async scanAddress() {
    try {
      let res = await this.intentService.scanQRCode();
      this.handleAddress(res);
    } catch (error) {
      
    }
  }

  handleAddress(scanResult: string){
    if (!scanResult.startsWith('feeds://') &&
        !scanResult.startsWith('feeds_raw://')){
      alert(this.translate.instant("AddServerPage.tipMsg"));
      return ;
    }

    let result = this.feedService.parseBindServerUrl(scanResult);
    this.carrierAddress = result.carrierAddress;
    this.nonce = result.nonce;
    let did = result.did;
    this.carrier.getIdFromAddress(this.carrierAddress,
      (userId)=>{
          this.addFriends(this.carrierAddress, userId, this.nonce, did, scanResult);
      },
      (err)=>{
      }
    );
  }

  addFriends(address: string, nodeId: string, nonce: string, did: string, scanResult: string){
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
              if (nonce == "0") feedUrl = scanResult;
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
  }
}
