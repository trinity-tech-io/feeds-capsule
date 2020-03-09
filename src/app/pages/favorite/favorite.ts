import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
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
    private router: Router) {
      this.feedsList = service.getFavorFeeds();
  }

  navigateToEventsPage(feedName: string) {
    this.router.navigate(['/favorite/content/',feedName]);
  }
}
