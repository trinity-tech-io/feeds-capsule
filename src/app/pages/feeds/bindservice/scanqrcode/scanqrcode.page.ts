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
      // this.events.subscribe('feeds:friendConnection', ret => {
      //   if (!this.waitFriendsOnline)
      //     return;

      //   let friendId = ret.friendId;

      //   this.declareOwner(friendId);
      // });

      
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
    // this.feedService.getFriends();
    

    this.scanAddress();
  }

  scanAddress() {
    this.waitFriendsOnline = false;
    
    appManager.sendIntent("scanqrcode", {}, {}, (res) => {
      let content = res.result.scannedContent;
      let contentStr = String(content);
      console.log("==msg=="+contentStr);
      let con = contentStr.split(".");

      this.carrierAddress = con[0];
      let nonce = con[1];   
      this.carrier.getIdFromAddress(this.carrierAddress, 
        (userId)=>{
            this.addFriends(this.carrierAddress, userId, nonce);
        },
        (err)=>{

        });
      }, (err: any) => {
          console.error(err);
      });
  }

  addFriends(address: string, nodeId: string, nonce: string){
    this.carrier.isValidAddress(address, (isValid) => {
      console.log("==msg=="+address);
      if (!isValid){
        // this.alertError("Address invalid");
        this.native.toast_trans('addressinvalid'+address);
        return;
      }
      
      this.carrier.addFriend(address, "hi",
        () => {
          this.zone.run(() => {
            this.navCtrl.pop().then(()=>{
              if (nonce == undefined) nonce = "";
              this.router.navigate(['/bindservice/startbinding/',nodeId, nonce, address]);
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
