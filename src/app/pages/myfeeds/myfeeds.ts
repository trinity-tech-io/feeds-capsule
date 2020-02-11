import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';

@Component({
  selector: 'page-myfeeds',
  templateUrl: './myfeeds.html',
  styleUrls: ['./myfeeds.scss']
})

export class MyfeedsPage implements OnInit {
  myfeeds: any;

  constructor(
    public service: FeedService,
    public navCtrl: NavController) {

    this.myfeeds = service.getMyFeeds();
  }

  ngOnInit() {
  }

  public navigateToBoardPage() {
    this.navCtrl.navigateForward('/menu/myfeeds/board');
  }
}
