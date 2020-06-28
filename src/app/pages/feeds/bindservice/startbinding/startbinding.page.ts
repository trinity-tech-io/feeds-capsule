import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { FeedService } from 'src/app/services/FeedService';
import { Events } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-startbinding',
  templateUrl: './startbinding.page.html',
  styleUrls: ['./startbinding.page.scss'],
})
export class StartbindingPage implements OnInit {
  private title = "Binding server";
  private nonce = "12345";
  private nodeId: string;
  private carrierAddress: string;
  constructor(
    private zone: NgZone,
    private native: NativeService,
    private events: Events,
    private acRoute: ActivatedRoute,
    private router: Router,
    private feedService:FeedService,
    private navCtrl: NavController
  ) {

    acRoute.params.subscribe((data)=>{
      titleBarManager.setTitle(this.title);

      this.nodeId = data.nodeId;
      if (data.nonce!="")
        this.nonce = data.nonce ;
      else this.nonce = this.feedService.generateNonce();  

      this.carrierAddress = data.address;
      if(this.feedService.getFriendConnection(this.nodeId) == 1)
        this.native.showLoading("Connecting server");
    });

    this.events.subscribe('feeds:owner_declared', (nodeId, phase, did, payload) => {
      switch(phase){
        case "owner_declared":
          this.zone.run(() => {
            this.navCtrl.pop().then(()=>{
              this.router.navigate(['/bindservice/importdid/',nodeId]);
            });
          });
          break;
        // case "did_imported":
        //   this.navCtrl.pop().then(()=>{
        //     this.router.navigate(['/bindservice/publishdid/',nodeId, did, payload]);
        //   });
        //   break;
        case "credential_issued":
          this.zone.run(() => {
            this.navCtrl.pop().then(()=>{
              this.router.navigate(['/bindservice/issuecredential/',nodeId, did]);
            });
          });
          break;
      }
    });

    this.events.subscribe("feeds:friendConnectionChanged", (nodeId, status)=>{
      if(this.nodeId == nodeId && status == 0)
      this.native.hideLoading();
    });

    // this.native.showLoading("Connecting server").then(() => {
    // });

    this.events.subscribe('feeds:resolveDidError', (nodeId, did, payload) => {
      this.zone.run(() => {
        this.navCtrl.pop().then(()=>{
          this.router.navigate(['/bindservice/publishdid/',nodeId, did, payload]);
        });
      });
    });

    this.events.subscribe('feeds:resolveDidSucess', (nodeId, did) => {
      this.zone.run(() => {
        this.navCtrl.pop().then(()=>{
          this.router.navigate(['/bindservice/issuecredential', nodeId, did]);
        });
      });
    });

  }
  
  ngOnInit() {
  }

  confirm(){
    this.feedService.declareOwnerRequest(this.nodeId, this.carrierAddress);
  }

  abort(){
    this.navCtrl.pop();
  }
}
