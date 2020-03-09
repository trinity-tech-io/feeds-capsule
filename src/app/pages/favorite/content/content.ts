import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

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
    private serv: FeedService,
    private acRoute: ActivatedRoute,
    private navCtrl: NavController) {

    acRoute.params.subscribe((data)=>{
      alert(JSON.stringify(data));
      this.feedEvents = serv.getFeedEvents('carrier');
    })
    
  }

  ngOnInit() {
  }

  navigateBack() {
    this.navCtrl.pop();
  }
}
