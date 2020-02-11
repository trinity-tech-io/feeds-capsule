import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'page-create-feed',
  templateUrl: './create-feed.html',
  styleUrls: ['./create-feed.scss'],
})

export class CreateFeedPage implements OnInit {
  constructor(
    private navCtrl: NavController) {}

  ngOnInit() {
  }

  navigateBack() {
    this.navCtrl.pop();
  }
}
