import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';

@Component({
  selector: 'app-newevent',
  templateUrl: './newevent.page.html',
  styleUrls: ['./newevent.page.scss'],
})
export class NeweventPage implements OnInit {
  private connectStatus = 1;
  private nodeId: string;
  private topic: string;
  constructor(
    private acRoute: ActivatedRoute,
    private navCtrl: NavController,
    private zone: NgZone,
    private feedService: FeedService,
    private events: Events) {

    this.connectStatus = this.feedService.getConnectionStatus();
    acRoute.params.subscribe((data)=>{
      this.nodeId = data.nodeId;
      this.topic = data.topic;
    });
    this.events.subscribe('feeds:postEventSuccess', () => {
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

  navigateBack() {
    this.navCtrl.pop();
  }

  newevent(event: HTMLInputElement){
    // this.feedService.postEvent(this.nodeId, this.topic, event.value);
  }
}
