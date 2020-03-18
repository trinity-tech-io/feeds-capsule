import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';

@Component({
  selector: 'app-newevent',
  templateUrl: './newevent.page.html',
  styleUrls: ['./newevent.page.scss'],
})
export class NeweventPage implements OnInit {
  private nodeId: string;
  private topic: string;
  constructor(
    private acRoute: ActivatedRoute,
    private navCtrl: NavController,
    private feedService: FeedService,
    private events: Events) {
    acRoute.params.subscribe((data)=>{
      this.nodeId = data.nodeId;
      this.topic = data.topic;
    });
    this.events.subscribe('feeds:postEventSuccess', () => {
      this.navigateBack();
    });
  }

  ngOnInit() {
  }

  navigateBack() {
    this.navCtrl.pop();
  }

  newevent(event: HTMLInputElement){
    this.feedService.postEvent(this.nodeId, this.topic, event.value);
  }
}
