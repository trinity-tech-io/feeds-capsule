import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';

class Attribute {
  constructor(
    public iconName: string,
    public attrName: string,
    public attrValue: string) {}
}

@Component({
  selector: 'page-server-info',
  templateUrl: 'server-info.html',
  styleUrls: ['server-info.scss'],
})

export class ServerInfoPage implements OnInit {
  private didString: string;
  state: number = 0;
  private connectStatus:any;
  private attrs;

  constructor(
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private feedService: FeedService) {}

  ngOnInit() {
    this.didString="did:elastos:ixxxxxxxxxxxxxxxxxxx"
    this.connectStatus = this.feedService.getConnectionStatus();
    this.acRoute.params.subscribe(data => {
      console.log(data.userId);
      
      let server = this.feedService.findServer(data.userId);
      console.log(JSON.stringify(server));
      if (server == undefined){
        return ;
      }

      this.attrs = [
        new Attribute('radio-button-on', 'nodeid', server.userId.slice(0, 31)),
        // new Attribute('home', 'address', server.address.slice(0, 31)),
        new Attribute('person', 'name', server.name),
        new Attribute('mail', 'email', server.email),
        new Attribute('locate', 'region', server.region)
      ];
    });
  }

  navigateBackPage() {
    this.native.pop();
  }
}
