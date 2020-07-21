import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events } from '@ionic/angular';
import { Router } from '@angular/router';
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
  private channels: any;
  constructor(
    private events: Events,
    private zone: NgZone,
    private router: Router,
    private feedService: FeedService,
    public theme:ThemeService,
    private native:NativeService,
    private menuService: MenuService) {

    this.channels = this.feedService.refreshMyChannels();
    
    this.events.subscribe('feeds:createTopicSuccess',()=>{
      this.zone.run(() => {
        this.channels = this.feedService.getMyChannelList();
      });
    });

    this.events.subscribe('feeds:refreshMyChannel',(list) => {
      this.zone.run(() => {
        this.channels = list;
      });
    });

    this.events.subscribe('feeds:channelsDataUpdate', () =>{
      this.channels = this.feedService.getMyChannelList();
    });
  }

  ngOnInit() {}

  createNewFeed(){
    this.native.getNavCtrl().navigateForward(['/createnewfeed']);
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
}

