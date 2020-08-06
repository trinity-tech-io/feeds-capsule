import { Component, OnInit, NgZone } from '@angular/core';
import { Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { MenuService } from 'src/app/services/MenuService';

@Component({
  selector: 'app-myfeeds',
  templateUrl: './myfeeds.component.html',
  styleUrls: ['./myfeeds.component.scss'],
})
export class MyfeedsComponent implements OnInit {
  public nodeStatus = {};
  private channels: any = [];
  constructor(
    private events: Events,
    private zone: NgZone,
    private feedService: FeedService,
    public theme:ThemeService,
    private native:NativeService,
    private menuService: MenuService) {

  
  }

  ngOnInit() {
    this.channels = this.feedService.getMyChannelList();
    this.initnodeStatus();
       
    this.events.subscribe('feeds:channelsDataUpdate', () =>{
      this.channels = this.feedService.getMyChannelList();
      this.initnodeStatus();
    });
  }

  createNewFeed(){
    let bindServer = this.feedService.getBindingServer();
    if (bindServer != null && bindServer != undefined)
      this.native.navigateForward(['/createnewfeed'],"");
    else 
      this.native.getNavCtrl().navigateForward(['/bindservice/scanqrcode']);
  }


  doRefresh(event) {
    this.feedService.refreshMyChannels();
    this.events.subscribe('feeds:refreshMyChannel',(list) => {
      this.zone.run(() => {
        this.channels = list;
      });
    });
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  navTo(nodeId, channelId){
    this.native.getNavCtrl().navigateForward(['/channels', nodeId, channelId]);
  }

  bindServer(){
    // this.router.navigate(['/bindservice/scanqrcode']);
  }

  parseAvatar(avatar: string): string{
    return this.feedService.parseChannelAvatar(avatar);
  }

  menuMore(nodeId: string , channelId: number, channelName: string){
    this.menuService.showShareMenu(nodeId, channelId, channelName);
  }

  handleClientNumber(nodeId){
    return this.feedService.getServerStatisticsNumber(nodeId);
  }

  checkServerStatus(nodeId: string){
    return this.feedService.getServerStatusFromId(nodeId);
  }

  initnodeStatus(){
     for(let index =0 ;index<this.channels.length;index++){
            let nodeId = this.channels[index]['nodeId'];
            let status = this.checkServerStatus(nodeId);
            this.nodeStatus[nodeId] = status;
     }
  }
}

