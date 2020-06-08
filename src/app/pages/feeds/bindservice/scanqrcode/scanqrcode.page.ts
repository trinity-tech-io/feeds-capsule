import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { CarrierService } from 'src/app/services/CarrierService';
import { Events } from '@ionic/angular';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-scanqrcode',
  templateUrl: './scanqrcode.page.html',
  styleUrls: ['./scanqrcode.page.scss'],
})
export class ScanqrcodePage implements OnInit {
  private title = "Binding server";
  private waitFriendsOnline = false;
  constructor(
    private router: Router,
    private navCtrl: NavController,
    private feedService:FeedService,
    private carrier: CarrierService,
    ) {
      titleBarManager.setTitle(this.title);

      // this.events.subscribe('feeds:friendConnection', ret => {
      //   if (!this.waitFriendsOnline)
      //     return;

      //   let friendId = ret.friendId;

      //   this.declareOwner(friendId);
      // });

      
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
      let con = contentStr.split(".");

      let address = con[0];
      let nonce = con[1];

      this.carrier.getIdFromAddress(address, 
        (userId)=>{
            this.addFriends(address, userId, nonce);
        },
        (err)=>{

        });
      }, (err: any) => {
          console.error(err);
      });
  }

  addFriends(address: string, nodeId: string, nonce: string){
    this.carrier.isValidAddress(address, (isValid) => {
      if (!isValid){
        // this.alertError("Address invalid");
        return;
      }
      
      this.carrier.addFriend(address, "hi",
        () => {
          this.navCtrl.pop().then(()=>{
            console.log(nodeId);
            console.log(nonce);
            if (nonce == undefined) nonce = "";
            this.router.navigate(['/bindservice/startbinding/',nodeId, nonce]);
          });
        }, (err) => {

        });
      },
      (error) => {
        // this.native.toast("address error: " + error);
      });
  }

  declareOwner(nodeId: string){
    this.feedService.declareOwnerRequest(nodeId);
  }

  abort(){
    this.navCtrl.pop();
  }

  test(){
    // this.feedService.test("did:elastos:iYPDHiR4V9fkqd8K8RcibDR3bTCSAkFB68");
    // this.feedService.test("did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D");
    // this.feedService.test("did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D");
    this.feedService.test("did:elastos:iULesifRfjcNrVv7zjLFXXwKzbDQZHcPgd");


  }
}
