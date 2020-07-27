import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { UtilService } from 'src/app/services/utilService';
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'slides-example',
  templateUrl: './notification.page.html',
  styleUrls: ['./notification.page.scss'],
})
export class NotificationPage {
  private notificationList: any;
  // Optional parameters to pass to the swiper instance. See http://idangero.us/swiper/api/ for valid options.
  slideOpts = {
    initialSlide: 2,
    speed: 400,
    slidesPerView: 3,
  };
  constructor(
    private zone: NgZone,
    private events: Events,
    public theme:ThemeService,
    private translate:TranslateService,
    private feedService :FeedService,
    private router: Router) {
    this.notificationList = this.feedService.getNotificationList();
  }

  ionViewWillEnter() {
    this.events.subscribe('feeds:UpdateNotification',()=>{
      this.zone.run(() => {
        this.notificationList = this.feedService.getNotificationList();
      });
    });
  }

  ionViewWillUnload(){
  }

  goToServer(){
    this.router.navigate(['/menu/servers']);
  }

  handleDisplayTime(createTime:number){

    let obj = UtilService.handleDisplayTime(createTime);
    if(obj.type === 's'){
       return this.translate.instant('common.just');
    }
    if(obj.type==='m'){
      return obj.content+this.translate.instant('HomePage.minutesAgo');
    }
    if(obj.type==='h'){
      return obj.content+this.translate.instant('HomePage.hoursAgo');
    }

    if(obj.type === 'yesterday'){
      return this.translate.instant('common.yesterday');
    }
    return  obj.content;
  }

}
