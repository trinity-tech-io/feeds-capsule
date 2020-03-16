import { Component, OnInit } from '@angular/core';
import { FeedService } from 'src/app/services/FeedService';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'page-about-feed',
  templateUrl: './about.html',
  styleUrls: ['./about.scss']
})

export class FeedAboutPage implements OnInit {
  description: string;

  constructor(
    private navCtrl: NavController,
    private service: FeedService,
    private acRoute: ActivatedRoute) {

    acRoute.params.subscribe((data)=>{
      console.log(JSON.stringify(data));
      this.description = service.getFeedDescr(data.feedKey);
    })
  }

  ngOnInit() {
  }

  navigateBackPage() {
    this.navCtrl.pop();
  }
}
