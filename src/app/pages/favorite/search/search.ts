import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';

@Component({
  selector: 'page-search',
  templateUrl: './search.html',
  styleUrls: ['./search.scss']
})

export class SearchFeedPage implements OnInit {
  feedDescs: any;

  constructor(
    public serv: FeedService,
    public navCtrl: NavController) {

    this.feedDescs = serv.getAllFeeds();
  }

  ngOnInit() {
  }

  public navigateToDetailPage() {
    this.navCtrl.navigateForward('favorite/search/about');
  }

  navigateBackPage() {
    this.navCtrl.pop();
  }
}
