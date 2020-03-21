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
      this.feedsList = feedService.getFavoriteFeeds();
      this.connectStatus = this.feedService.getConnectionStatus();

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
  }

  navigateToEventsPage(nodeId: string, feedName: string, lastSeqno: number) {
    this.router.navigate(['/favorite/content/',nodeId, feedName, lastSeqno]);
  }
}
