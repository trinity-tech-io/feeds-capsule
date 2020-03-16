import { Component, NgZone} from '@angular/core';
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
  feedsList: any;
  today: number = Date.now();

  constructor(
    private service: FeedService,
    private navCtrl: NavController,
    private router: Router,
    private events: Events,
    private zone: NgZone) {
      this.feedsList = service.getFavoriteFeeds();

      this.events.subscribe('feeds:favoriteFeedListChanged', (feedsList) => {
        this.zone.run(() => {
          this.feedsList = feedsList;
          console.log("feedsList =>>>>"+JSON.stringify(this.feedsList));
        });
      });
  }

  navigateToEventsPage(nodeId: string, feedName: string, lastSeqno: number) {
    console.log(nodeId+";"+feedName+";"+lastSeqno);
    this.router.navigate(['/favorite/content/',nodeId, feedName, lastSeqno]);
  }
}
