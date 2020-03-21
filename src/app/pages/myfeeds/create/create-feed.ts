import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';

@Component({
  selector: 'page-create-feed',
  templateUrl: './create-feed.html',
  styleUrls: ['./create-feed.scss'],
})
export class CreateFeedPage implements OnInit {
  private connectStatus = 1;
  private serverList: any;
  constructor(
    private navCtrl: NavController,
    private feedService: FeedService,
    private zone: NgZone,
    private events: Events) {
      this.connectStatus = this.feedService.getConnectionStatus();
      this.serverList = feedService.getServerList();
      this.events.subscribe('feeds:createTopicSuccess', () => {
        this.navigateBack();
      });
      this.events.subscribe('feeds:connectionChanged', connectionStatus => {
        this.zone.run(() => {
            this.connectStatus = connectionStatus;
        });
    });
  }

  ngOnInit() {
  }

  createTopic(name: HTMLInputElement, desc: HTMLInputElement, select: HTMLInputElement){
    this.feedService.createTopic(select.value, name.value, desc.value);
  }
  navigateBack() {
    this.navCtrl.pop();
  }

  
}
