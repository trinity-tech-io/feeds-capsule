import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'page-content',
  templateUrl: './content.html',
  styleUrls: ['./content.scss']
})

export class FeedContentPage implements OnInit {
  feedEvents: any;

  constructor(
    private feedService: FeedService,
    private acRoute: ActivatedRoute,
    private navCtrl: NavController,
    private events: Events,
    private zone: NgZone) {

    acRoute.params.subscribe((data)=>{
      console.log(JSON.stringify(data));
      let nodeId = data.nodeId;
      let topic = data.feedName;
      console.log("fff =>"+"nodeId:"+nodeId+";"+"topic:"+topic);
      this.feedEvents = feedService.getFeedEvents(nodeId+topic);
      feedService.updatefavoriteUnreadState(nodeId,topic,0);

      // this.feedEvents = serv.getFeedEvents(nodeId, topic, lastSeqno+1);
      // feedService.fetchFeedEvents(nodeId, topic);
    });

    
    this.events.subscribe('feeds:eventListChanged', (eventList) => {
      this.zone.run(() => {
        this.feedEvents = eventList;
      });
    });
  }

  ngOnInit() {
  }

  navigateBack() {
    this.navCtrl.pop();
  }
}
