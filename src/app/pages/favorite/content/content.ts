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
  private connectStatus = 1;
  private feedEvents: any;
  private title: string = "Topic";

  constructor(
    private feedService: FeedService,
    private acRoute: ActivatedRoute,
    private navCtrl: NavController,
    private events: Events,
    private zone: NgZone) {
    this.connectStatus = this.feedService.getConnectionStatus();

    acRoute.params.subscribe((data)=>{
      let nodeId = data.nodeId;
      let topic = data.feedName;
      this.title = topic;
      this.feedEvents = feedService.getFeedEvents(nodeId+topic);
      feedService.updatefavoriteUnreadState(nodeId,topic,0);
    });

    
    this.events.subscribe('feeds:eventListChanged', (eventList) => {
      this.zone.run(() => {
        this.feedEvents = eventList;
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

  navigateBack() {
    this.navCtrl.pop();
  }
}
