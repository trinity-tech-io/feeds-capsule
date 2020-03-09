import { Component, OnInit } from '@angular/core';
import { Events } from '@ionic/angular';
import { CarrierService } from 'src/app/services/CarrierService';

@Component({
  selector: 'page-about',
  templateUrl: './about.html',
  styleUrls: ['./about.scss'],
})
export class AboutPage implements OnInit {

  constructor(
    private events:Events,
    private carrierService:CarrierService) {
  }

  ngOnInit() {
  }
  // abouttest(){
  //   alert("abouttest");
  // }
}
