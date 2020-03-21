import { Component, OnInit , NgZone} from '@angular/core';
import { FeedService } from 'src/app/services/FeedService';
import { NavController , Events } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'page-about-feed',
  templateUrl: './about.html',
  styleUrls: ['./about.scss']
})

export class FeedAboutPage implements OnInit {
  private description: string;
  private connectStatus = 1;


  constructor(
    private events: Events,
    private zone: NgZone,
    private navCtrl: NavController,
    private feedService: FeedService,
    private acRoute: ActivatedRoute) {
    this.connectStatus = this.feedService.getConnectionStatus();

    acRoute.params.subscribe((data)=>{
      console.log(JSON.stringify(data));
      this.description = feedService.getFeedDescr(data.feedKey);
    })

    this.events.subscribe('feeds:connectionChanged', connectionStatus => {
      this.zone.run(() => {
          this.connectStatus = connectionStatus;
      });
  });
  }

  ngOnInit() {
  }

  navigateBackPage() {
    this.navCtrl.pop();
  }
}
