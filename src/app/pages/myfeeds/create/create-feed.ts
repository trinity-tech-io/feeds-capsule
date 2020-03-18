import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';

@Component({
  selector: 'page-create-feed',
  templateUrl: './create-feed.html',
  styleUrls: ['./create-feed.scss'],
})
export class CreateFeedPage implements OnInit {
  private serverList: any;
  constructor(
    private navCtrl: NavController,
    private feedService: FeedService) {
      
      this.serverList = feedService.getServerList();
      // alert(JSON.stringify(this.serverList));
    }

  ngOnInit() {
  }

  createTopic(name: HTMLInputElement, desc: HTMLInputElement, select: HTMLInputElement){
    this.feedService.createTopic(select.value, name.value, desc.value);
    alert("createTopic"+name.value+";"+desc.value+";"+select.value);
  }
  navigateBack() {
    this.navCtrl.pop();
  }
}
