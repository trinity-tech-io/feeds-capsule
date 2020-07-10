import { Component, OnInit, NgZone } from '@angular/core';
import { FeedService } from '../../services/FeedService'
import { Events, IonTabs } from '@ionic/angular';
import { Router } from '@angular/router';
import { FeedsPage } from 'src/app/pages/feeds/feeds.page'
import { ThemeService } from 'src/app/services/theme.service';
@Component({
  selector: 'app-following',
  templateUrl: './following.component.html',
  styleUrls: ['./following.component.scss'],
})
export class FollowingComponent implements OnInit {
  private channelList;
  constructor(
    private feedspage: FeedsPage,
    private tabs: IonTabs,
    private events: Events,
    private zone: NgZone,
    private router: Router,
    private feedService:FeedService,
    public theme:ThemeService) { 
    // this.channelList = this.feedService.refreshLocalChannels();
    this.channelList=this.feedService.refreshLocalSubscribedChannels();
    this.feedService.refreshSubscribedChannels();
    this.events.subscribe('feeds:refreshSubscribedChannels', list => {
      this.zone.run(() => {
          this.channelList = list;
      });
    });
  }

  ngOnInit() {}

  navTo(nodeId, channelId){
    this.read(nodeId, channelId);
    this.router.navigate(['/channels', nodeId, channelId]);

  }

  exploreFeeds(){
    this.tabs.select("search");
    this.feedspage.currentTab = "search";
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

  menuMore(){
    alert("more");
  }
}
