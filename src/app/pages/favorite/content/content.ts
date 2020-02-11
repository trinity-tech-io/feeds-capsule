import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

import { FeedService } from 'src/app/services/FeedService';

@Component({
  selector: 'page-content',
  templateUrl: './content.html',
  styleUrls: ['./content.scss']
})

export class FeedContentPage implements OnInit {
  feedEvents: any;

  constructor(
    private serv: FeedService,
    private navCtrl: NavController) {

    this.feedEvents = serv.getFeedEvents('carrier');
  }

  ngOnInit() {
  }

  navigateBack() {
    this.navCtrl.pop();
  }
}
