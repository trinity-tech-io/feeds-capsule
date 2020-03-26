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

    this.connectStatus = this.feedService.getConnectionStatus();
    this.acRoute.params.subscribe(data => {
      // console.log(data.address);
      // alert(data.address);

      this.address = data.address;

    });
    // this.route.queryParams.subscribe((data) => {
    //   this.address = data["address"];
    // });

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
    if (this.platform.platforms().indexOf("cordova") < 0){
      this.carrier.addFriend(this.address, this.friendRequest,
        () => {
            console.log("Add server success");
            alert("Add server success");
            this.native.setRootRouter("/menu/servers");
        }, null);
      return;
    }

    this.carrier.isValidAddress(this.address, (isValid) => {
      if (isValid){
        this.carrier.addFriend(this.address, this.friendRequest,
          () => {
              console.log("Add server success");
              // alert("Add server success");
              
              this.popup.ionicAlert("Prompt","Add server success","ok").then(() => { 
                this.native.setRootRouter("/menu/servers");
                this.native.pop();
              });
              
  
          }, (err) => {
              console.log("Add server error: " + err);
              alert("Add server error: " + err);
          });
      } else {
        alert ("Address invalid");
      }
      
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
}
