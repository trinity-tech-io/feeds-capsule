import { Component, OnInit, NgZone} from '@angular/core';
import { NavController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { Events } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'page-search',
  templateUrl: './search.html',
  styleUrls: ['./search.scss']
})

export class SearchFeedPage implements OnInit {
  private feedList: any;
  private connectStatus = 1;
  constructor(
    private feedService: FeedService,
    private navCtrl: NavController,
    private events: Events,
    private zone: NgZone,
    private router: Router) {
    this.connectStatus = this.feedService.getConnectionStatus();

    feedService.doExploreTopics();
    this.feedList = feedService.getAllFeeds();
    this.events.subscribe('feeds:allFeedsListChanged', (feedList) => {
      this.zone.run(() => {
        this.feedList = feedList;
      });
    });
    this.events.subscribe('feeds:connectionChanged', connectionStatus => {
      this.zone.run(() => {
          this.connectStatus = connectionStatus;
      });
    });
  }

  ngOnInit() {
  }

  public navigateToDetailPage(nodeId: string, topic: string) {
    // this.navCtrl.navigateForward('favorite/search/about');
    this.router.navigate(['/favorite/search/about/',nodeId+topic]);
  }

  navigateBackPage() {
    this.navCtrl.pop();
  }

  subscribe(nodeId: string, topic: string){
    this.feedService.subscribe(nodeId, topic);
  }

  unsubscribe(nodeId: string, topic: string){
    this.feedService.unSubscribe(nodeId, topic);
  }
}
