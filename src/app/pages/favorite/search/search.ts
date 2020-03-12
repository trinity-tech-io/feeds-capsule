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
    public feedService: FeedService,
    public navCtrl: NavController) {

    feedService.doExploreTopics();
    this.feedDescs = feedService.getAllFeeds();
  }

  ngOnInit() {
  }

  public navigateToDetailPage() {
    this.navCtrl.navigateForward('favorite/search/about');
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
