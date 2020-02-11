import { Component, OnInit } from '@angular/core';
import { FeedService } from 'src/app/services/FeedService';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'page-about-feed',
  templateUrl: './about.html',
  styleUrls: ['./about.scss']
})

export class FeedAboutPage implements OnInit {
  intro: any;

  constructor(
    private navCtrl: NavController,
    private service: FeedService) {

    this.intro = service.getFeedDescr('carrier');
  }

  ngOnInit() {
  }

  navigateBackPage() {
    this.navCtrl.pop();
  }
}
