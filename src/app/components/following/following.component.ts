import { Component, OnInit, NgZone } from '@angular/core';
import { FeedService } from '../../services/FeedService'
import { Events } from '@ionic/angular';
import { Router } from '@angular/router'

@Component({
  selector: 'app-following',
  templateUrl: './following.component.html',
  styleUrls: ['./following.component.scss'],
})
export class FollowingComponent implements OnInit {
  private channelList;
  constructor(
    private events: Events,
    private zone: NgZone,
    private router: Router,
    private feedService:FeedService) { 
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
    this.router.navigate(['/channels', nodeId, channelId]);

  }

  exploreFeeds(){
    alert("exploreFeeds");
  }

  parseAvatar(avatar: string): string{
    return this.feedService.parseChannelAvatar(avatar);
  }
}
