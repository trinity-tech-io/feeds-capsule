import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CarrierService } from '../../services/CarrierService';

@Component({
  selector: 'app-splashscreen',
  templateUrl: './splashscreen.page.html',
  styleUrls: ['./splashscreen.page.scss'],
})
export class SplashscreenPage implements OnInit {

  constructor(
    private modalCtrl: ModalController,
    private carrierService: CarrierService) { }

  ngOnInit() {

    setTimeout(() => {
      this.modalCtrl.dismiss();
    }, 3000);

  }

}
