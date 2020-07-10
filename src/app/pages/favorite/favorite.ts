import { Component, NgZone } from '@angular/core';
import { NavController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { Events } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'page-favorite',
  templateUrl: 'favorite.html',
  styleUrls: ['favorite.scss']
})

export class FavorFeedsPage {
  private connectStatus = 1;
  private feedsList: any;
  private today: number = Date.now();

  constructor(
    private feedService: FeedService,
    private navCtrl: NavController,
    private router: Router,
    private events: Events,
    private zone: NgZone) {
      // this.feedsList = feedService.getFavoriteFeeds();
      this.connectStatus = this.feedService.getConnectionStatus();

      this.feedsList=feedService.refreshLocalSubscribedChannels();
      this.feedService.refreshSubscribedChannels();

      this.events.subscribe('feeds:favoriteFeedListChanged', (feedsList) => {
        this.zone.run(() => {
          this.feedsList = feedsList;
        });
      });

      this.events.subscribe('feeds:connectionChanged', connectionStatus => {
        this.zone.run(() => {
            this.connectStatus = connectionStatus;
        });
      });

      this.events.subscribe('feeds:loadMoreSubscribedChannels', list => {
        this.zone.run(() => {
            this.feedsList = list;
        });
      });
    
      this.events.subscribe('feeds:refreshSubscribedChannels', list => {
        this.zone.run(() => {
            this.feedsList = list;
        });
      });
    
      this.events.subscribe('feeds:unsubscribeFinish', (nodeId, channelId, name) => {
        this.zone.run(() => {
          this.feedsList=feedService.refreshLocalSubscribedChannels();
        });
      });
  }

  navigateToEventsPage(nodeId: string, name: string, id: number, ownerName: string) {
    // this.feedService.readChannel(nodeId, id);
    this.router.navigate(['/favorite/content/',nodeId, name, id , ownerName]);
  }

  doRefresh(event) {
    this.feedService.refreshSubscribedChannels();
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  loadData(event) {
    this.feedService.loadMoreSubscribedChannels();
    setTimeout(() => {
      event.target.complete();
    }, 500);
  }

  getUnreadNum(ChannelId: number): number{
    return 0;
    // return this.feedService.getUnreadNumber(ChannelId);
  }
}
