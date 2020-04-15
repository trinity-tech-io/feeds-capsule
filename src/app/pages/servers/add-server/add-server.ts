import { Component, OnInit, NgZone } from '@angular/core';
import { Events, Platform } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { CarrierService } from 'src/app/services/CarrierService';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { AppService } from 'src/app/services/AppService';
import { PopupProvider } from 'src/app/services/popup';

@Component({
  selector: 'page-add-server',
  templateUrl: 'add-server.html',
  styleUrls: ['add-server.scss'],
})

export class AddServerPage implements OnInit {
  private connectStatus = 1;
  private address: string = '';
  private friendRequest = 'Feeds/0.1';

  constructor(
    private events: Events,
    private zone: NgZone,
    private acRoute: ActivatedRoute,
    private platform: Platform,
    private native: NativeService,
    private feedService: FeedService,
    private appService: AppService,
    private popup: PopupProvider,
    private carrier: CarrierService) {
      this.address = 'feeds://did:elastos:incNuym7VT7tRnpDPQbDvHJ12uHqiyrPSy';
      this.connectStatus = this.feedService.getConnectionStatus();
      this.acRoute.params.subscribe(data => {
        if (this.address == null ||
          this.address == undefined||
          this.address == '')
          return;
        this.resolveDid();
      });

      this.events.subscribe('feeds:connectionChanged', connectionStatus => {
        this.zone.run(() => {
            this.connectStatus = connectionStatus;
        });
      });
  }

  ngOnInit() {}

  navToBack() {
    this.native.pop();
  }

  addServer() {
    this.feedService.parseDid(this.address);
    if (this.platform.platforms().indexOf("cordova") < 0){
      this.carrier.addFriend(this.address, this.friendRequest,
        () => {
            console.log("Add server success");
            this.alertError("Add server success");
            this.native.setRootRouter("/menu/servers");
        }, null);
      return;
    }

    this.carrier.isValidAddress(this.address, (isValid) => {
      if (!isValid){
        this.alertError("Address invalid");
        return;
      }
      
      this.carrier.addFriend(this.address, this.friendRequest,
        () => {
            this.native.toast("Add server success");
            this.native.setRootRouter("/menu/servers");
            this.native.pop();
        }, (err) => {
            this.alertError("Add server error: " + err);
        });
      },
      (error: string) => {
        this.native.toast("address error: " + error);
      });
  }

  scanCode(){
    // this.router.navigate(['/scan']); 
    this.native.pop();
    this.appService.scanAddress();
  }

  alertError(error: string){
    alert (error);
  }
  
  onChange(){
    this.queryServer();
  }

  queryServer(){
    if (this.address.length > 53&&
      this.address.startsWith('feeds://') && 
      this.address.indexOf("did:elastos:")
    ){
      this.resolveDid();
    }
  }

  resolveDid(){
    this.feedService.resolveDidDocument(this.address,
      (avaliable)=>{
        for (let index = 0; index < avaliable.length; index++) {
          const element = avaliable[index];
          console.log("finnal result ===>"+JSON.stringify(element));
        }
      },(err)=>{
      }
    );
  }
}
