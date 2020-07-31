import { Component, OnInit, NgZone } from '@angular/core';
import { NavController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { CarrierService } from 'src/app/services/CarrierService';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from "@ngx-translate/core";


declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-scanqrcode',
  templateUrl: './scanqrcode.page.html',
  styleUrls: ['./scanqrcode.page.scss'],
})
export class ScanqrcodePage implements OnInit {
  private title = "01/06";
  private waitFriendsOnline = false;
  private carrierAddress: string;
  private scanContent: string;
  private nonce: string = "0";

  constructor(
    private native: NativeService,
    private zone: NgZone,
    private navCtrl: NavController,
    private feedService:FeedService,
    private carrier: CarrierService,
    private translate:TranslateService,
    public  theme:ThemeService
    ) {
  }

  ngOnInit() {

  }

  ionViewWillEnter() {
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

  initTitle(){
    titleBarManager.setTitle(this.title);
  }

  ionViewWillUnload(){
     
  }
 
  scanService(){
    this.scanAddress();
  }

  scanAddress() {
    this.waitFriendsOnline = false;
    
    appManager.sendIntent("scanqrcode", {}, {}, (res) => {
      let content = res.result.scannedContent;
      let contentStr = String(content);
      this.scanContent = contentStr;

      let result = this.feedService.parseBindServerUrl(contentStr);
      this.carrierAddress = result.carrierAddress;
      this.nonce = result.nonce;
      let did = result.did;
      this.carrier.getIdFromAddress(this.carrierAddress, 
        (userId)=>{
            this.addFriends(this.carrierAddress, userId, this.nonce, did);
        },
        (err)=>{
        });
      }, (err: any) => {
          console.error(err);
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
}
