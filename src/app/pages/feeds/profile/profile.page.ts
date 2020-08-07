import { Component, OnInit, NgZone } from '@angular/core';
import { Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  private connectionStatus = 1;
  private selectType: String = "ProfilePage.myFeeds"; 
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
    private feedService: FeedService,
    public theme:ThemeService,
    private events: Events,
    private zone: NgZone) {
  
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.events.publish("feeds:refreshPage");
    this.connectionStatus = this.feedService.getConnectionStatus();

    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });
    let signInData = this.feedService.getSignInData() || {};
    this.name = signInData["name"] || "";

    this.description = signInData["description"] || "";
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:updateLikeList");
    this.events.unsubscribe("feeds:connectionChanged");
  }

  changeType(type:string){
    this.selectType = type;
  }

}
