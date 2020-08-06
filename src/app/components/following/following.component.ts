import { Component, OnInit, NgZone } from '@angular/core';
import { FeedService } from '../../services/FeedService'
import { Events, IonTabs } from '@ionic/angular';
import { Router } from '@angular/router';
import { FeedsPage } from 'src/app/pages/feeds/feeds.page'
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { MenuService } from 'src/app/services/MenuService';

@Component({
  selector: 'app-following',
  templateUrl: './following.component.html',
  styleUrls: ['./following.component.scss'],
})
export class FollowingComponent implements OnInit {
  public nodeStatus = {};
  private channelList = [];
  constructor(
    private feedspage: FeedsPage,
    private tabs: IonTabs,
    private events: Events,
    private zone: NgZone,
    private router: Router,
    private feedService:FeedService,
    public theme:ThemeService,
    private native:NativeService,
    private menuService: MenuService) { 
    // this.channelList = this.feedService.refreshLocalChannels();
    this.channelList=this.feedService.refreshLocalSubscribedChannels();
    this.initnodeStatus()
    this.feedService.refreshSubscribedChannels();
    this.events.subscribe('feeds:refreshSubscribedChannels', list => {
      this.zone.run(() => {
          this.channelList = list;
          this.initnodeStatus();
      });
    });

    this.events.subscribe('feeds:refreshPage',()=>{
      this.zone.run(() => {
        this.channelList=this.feedService.refreshLocalSubscribedChannels();
        this.feedService.refreshSubscribedChannels();
      });
    });
  }

  ngOnInit() {}

  navTo(nodeId, channelId){
    this.read(nodeId, channelId);
    this.native.getNavCtrl().navigateForward(['/channels', nodeId, channelId]);

  }

  exploreFeeds(){
    this.tabs.select("search");
    this.feedspage.search();
  }

  parseAvatar(avatar: string): string{
    return this.feedService.parseChannelAvatar(avatar);
  }

  checkUnreadNumber(nodeId: string, channelId: number):number{
    let nodeChannelId = nodeId + channelId ;
    return this.feedService.getUnreadNumber(nodeChannelId);
  }

  read(nodeId: string, channelId: number){
    let nodeChannelId = nodeId + channelId ;
    this.feedService.readChannel(nodeChannelId);
  }

  menuMore(nodeId: string , channelId: number, channelName: string){
    this.menuService.showChannelMenu(nodeId, channelId, channelName);
  }


  checkServerStatus(nodeId: string){
    return this.feedService.getServerStatusFromId(nodeId);
  }

  initnodeStatus(){
    for(let index =0 ;index<this.channelList.length;index++){
           let nodeId = this.channelList[index]['nodeId'];
           let status = this.checkServerStatus(nodeId);
           this.nodeStatus[nodeId] = status;
    }
 }
}
