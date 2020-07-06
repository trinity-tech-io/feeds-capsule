import { Component, OnInit } from '@angular/core';
import { FeedService } from 'src/app/services/FeedService';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  private types = ["MyFeeds","Following","Likes"];
  private selectType: String = "MyFeeds"; 
  private description: String = "";
  private name: string = "";
  private followers = 0;
  private avatar = "";
  slideOpts = {
    initialSlide: 0,
    speed: 100,
    slidesPerView: 3,
  };

  constructor(
    private feedService: FeedService) {
    let signInData = this.feedService.getSignInData();
    this.name = signInData.name;

    this.description = signInData.description;
  }

  ngOnInit() {
  }

  changeType(type){
    this.selectType = type;
  }

}
