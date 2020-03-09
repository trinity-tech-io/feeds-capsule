import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { CarrierService } from 'src/app/services/CarrierService';
import { NativeService } from 'src/app/services/NativeService';

@Component({
  selector: 'page-add-server',
  templateUrl: 'add-server.html',
  styleUrls: ['add-server.scss'],
})

export class AddServerPage implements OnInit {
  private address: string = '';
  private friendRequest = 'Feeds/0.1';

  constructor(
    private route: ActivatedRoute,
    private platform: Platform,
    private native: NativeService,
    private carrier: CarrierService) {

    this.route.queryParams.subscribe((data) => {
      this.address = data["address"];
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
