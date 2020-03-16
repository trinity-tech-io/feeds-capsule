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
  feedList: any;

  constructor(
    private feedService: FeedService,
    private navCtrl: NavController,
    private events: Events,
    private zone: NgZone,
    private router: Router) {

    feedService.doExploreTopics();
    this.feedList = feedService.getAllFeeds();
    console.log('getAllFeeds222222222'+JSON.stringify(this.feedList));
    this.events.subscribe('feeds:allFeedsListChanged', (feedList) => {
      this.zone.run(() => {
        this.feedList = feedList;
        console.log("feedsList =>>>>"+JSON.stringify(this.feedList));
        console.log('getAllFeeds3333'+JSON.stringify(this.feedList));
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
    alert("subscribe:"+nodeId+";"+topic);
    this.feedService.subscribe(nodeId, topic);
  }

  unsubscribe(nodeId: string, topic: string){
    alert("unsubscribe"+nodeId+";"+topic);
    this.feedService.unSubscribe(nodeId, topic);
  }
}
