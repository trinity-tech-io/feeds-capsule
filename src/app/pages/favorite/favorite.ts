import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';

@Component({
  selector: 'page-favorite',
  templateUrl: 'favorite.html',
  styleUrls: ['favorite.scss']
})

export class FavorFeedsPage {
  feeds: any;
  today: number = Date.now();

  constructor(
    service: FeedService,
    private navCtrl: NavController) {
      this.feeds = service.getFavorFeeds();
  }

  navigateToEventsPage(feedName: string) {
    this.navCtrl.navigateForward('/favorite/content');
  }
}
