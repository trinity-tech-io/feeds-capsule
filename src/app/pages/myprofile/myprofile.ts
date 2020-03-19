import { Component, OnInit, NgZone } from '@angular/core';
import { CarrierService } from 'src/app/services/CarrierService';
import { Events } from '@ionic/angular';

class Attribute {
  constructor(
    public iconName: string,
    public attrName: string,
    public attrValue: string) {}
}

@Component({
  selector: 'page-myprofile',
  templateUrl: './myprofile.html',
  styleUrls: ['./myprofile.scss'],
})

export class MyprofilePage implements OnInit {
  private connectStatus: number = 1;
  private attrs:Attribute[] = [];

   constructor(
    private event: Events,
    private zone: NgZone,
    private carrierService: CarrierService) {

    this.event.subscribe('feeds:connectionChanged', connectionStatus => {
      this.zone.run(() => {
          this.connectStatus = connectionStatus;
          this.attrs = [
            new Attribute('radio-button-on', 'nodeId',carrierService.getNodeId()),
            new Attribute('person', 'userId', carrierService.getNodeId()),
            new Attribute('home', 'address', carrierService.getAddress())
          ];
      });
    });
    
  }

  ngOnInit() {
  }

}
