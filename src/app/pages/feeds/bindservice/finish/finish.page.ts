import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-finish',
  templateUrl: './finish.page.html',
  styleUrls: ['./finish.page.scss'],
})
export class FinishPage implements OnInit {

  constructor(
    private router: Router,
    private navCtrl: NavController,
    ) {}

  ngOnInit() {
  }

  createChannel(){
    this.navCtrl.pop().then(()=>{
      this.router.navigate(['/createnewfeed']);
    });
  }

  returnMain(){
    this.navCtrl.pop();
  }
}
