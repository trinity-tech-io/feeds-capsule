import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { CarrierService } from 'src/app/services/CarrierService';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { Events } from '@ionic/angular';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-scanqrcode',
  templateUrl: './scanqrcode.page.html',
  styleUrls: ['./scanqrcode.page.scss'],
})
export class ScanqrcodePage implements OnInit {
  private title = "ScanqrcodePage.bindingServer";
  private waitFriendsOnline = false;
  private carrierAddress: string;
  private scanContent: string;

  constructor(
    private native: NativeService,
    private zone: NgZone,
    private router: Router,
    private navCtrl: NavController,
    private feedService:FeedService,
    private carrier: CarrierService,
    private translate:TranslateService,
    private events: Events,
    ) {
  }

  ionViewDidEnter() {
    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

  ionViewWillUnload(){
    this.events.unsubscribe("feeds:updateTitle");
  }


  initTitle(){
    titleBarManager.setTitle(this.translate.instant(this.title));
  }
  ngOnInit() {
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
      let nonce = result.nonce;
      let did = result.did;
      this.carrier.getIdFromAddress(this.carrierAddress, 
        (userId)=>{
            this.addFriends(this.carrierAddress, userId, nonce, did);
        },
        (err)=>{
        });
      }, (err: any) => {
          console.error(err);
      });
  }

  addFriends(address: string, nodeId: string, nonce: string, did: string){
    this.carrier.isValidAddress(address, (isValid) => {
      if (!isValid){
        // this.alertError("Address invalid");
        this.native.toast_trans('addressinvalid'+address);
        return;
      }
      
      this.carrier.addFriend(address, "hi",
        () => {
          this.zone.run(() => {
            this.navCtrl.pop().then(()=>{
              let feedUrl = "-1";
              if (nonce == undefined) nonce = "";
              if (nonce == "0") feedUrl = this.scanContent;
              
              this.native.getNavCtrl().navigateForward(['/bindservice/startbinding/',nodeId, nonce, address, did, feedUrl]);
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
    this.feedService.declareOwnerRequest(nodeId, this.carrierAddress);
  }

  abort(){
    this.navCtrl.pop();
  }
}
