import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'slides-example',
  templateUrl: './notification.page.html',
  styleUrls: ['./notification.page.scss'],
})
export class NotificationPage {
  // Optional parameters to pass to the swiper instance. See http://idangero.us/swiper/api/ for valid options.
  slideOpts = {
    initialSlide: 2,
    speed: 400,
    slidesPerView: 3,
  };
  constructor(private router: Router) {

    

  }

  goToServer(){
    this.router.navigate(['/menu/servers']);
  }
}
