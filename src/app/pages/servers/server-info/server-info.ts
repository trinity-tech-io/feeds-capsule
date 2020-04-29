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
  
  // state: number = 0;
  private connectStatus:any;
  
  private serverStatus:number = 1;
  private clientNumber:number = 0;

  private didString: string;
  // private attrs;
  private name: string;
  private owner: string;
  private introduction: string;
  private feedsUrl: string;

  constructor(
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private feedService: FeedService) {}

  ngOnInit() {
    // this.didString="did:elastos:ixxxxxxxxxxxxxxxxxxx"
    this.connectStatus = this.feedService.getConnectionStatus();
    this.acRoute.params.subscribe(data => {
      let server = this.feedService.findServer(data.did);
      this.serverStatus = this.feedService.getServersStatus()[server.nodeId].status;
      this.clientNumber = this.feedService.getServerStatisticsMap()[server.nodeId].connecting_clients;

      if (server == undefined){
        return ;
      }

      this.didString = server.did;
      this.name = server.name;
      this.owner = server.owner;
      this.introduction = server.introduction;
      this.feedsUrl = server.feedsUrl;
    });
  }

  navigateBackPage() {
    this.native.pop();
  }
}
