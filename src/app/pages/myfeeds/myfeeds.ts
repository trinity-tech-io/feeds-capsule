import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { Router } from '@angular/router';

@Component({
  selector: 'page-myfeeds',
  templateUrl: './myfeeds.html',
  styleUrls: ['./myfeeds.scss']
})

export class MyfeedsPage implements OnInit {
  myfeeds: any;

  constructor(
    public feedService: FeedService,
    public navCtrl: NavController,
    private events: Events,
    private router: Router,
    private zone: NgZone) {

    this.myfeeds = feedService.getMyFeeds();
    
    this.events.subscribe('feeds:ownFeedListChanged', (feedList) => {
      this.zone.run(() => {
        this.myfeeds = feedList;
      });
    });
  }

  ngOnInit() {
  }

  public navigateToBoardPage(nodeId: string, topic: string) {
    // this.navCtrl.navigateForward('/menu/myfeeds/board');
    this.router.navigate(['/menu/myfeeds/board/',nodeId, topic]);
  }
}
