import { Component, OnInit, NgZone } from '@angular/core';
import { Events, Platform } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { CarrierService } from 'src/app/services/CarrierService';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';

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
    private route: ActivatedRoute,
    private platform: Platform,
    private native: NativeService,
    private feedService: FeedService,
    private carrier: CarrierService) {

    this.connectStatus = this.feedService.getConnectionStatus();

    this.route.queryParams.subscribe((data) => {
      this.address = data["address"];
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
    if (this.platform.is("desktop")) {
      this.carrier.addFriend(this.address, this.friendRequest,
        () => {
            console.log("Add server success");
            alert("Add server success");
            this.native.setRootRouter("/menu/servers");
        }, null);
      return;
    }

    this.carrier.isValidAddress(this.address, (data) => {
      this.carrier.addFriend(this.address, this.friendRequest,
        () => {
            console.log("Add server success");
            alert("Add server success");
            this.native.setRootRouter("/menu/servers");
        }, (err) => {
            console.log("Add server error: " + err);
            alert("Add server error: " + err);
        });
      },
      (error: string) => {
        this.native.toast("address error: " + error);
      });
  }
}
