import { Component, OnInit, NgZone } from '@angular/core';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from '../../../services/FeedService';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-setting',
  templateUrl: './setting.page.html',
  styleUrls: ['./setting.page.scss'],
})
export class SettingPage implements OnInit {
  private buttonDisable:boolean = false;
  constructor(
    private router: Router,
    private zone: NgZone,
    private feedService :FeedService,
    private native: NativeService,
    public alertController: AlertController){ }

  ngOnInit() {
    titleBarManager.setTitle("Setting");
    this.native.setTitleBarBackKeyShown(true);
  }

  clearAll(){
    this.presentAlertConfirm();
  }

  async presentAlertConfirm() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Confirm!',
      message: 'Clear <strong>all cached data</strong>!!!',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {

          }
        }, {
          text: 'Ok',
          handler: () => {

            this.feedService.removeAllData();
          }
        }
      ]
    });

    await alert.present();
  }

  test(){
    this.zone.run(()=>{
      this.buttonDisable = true;
    })

    this.router.navigate(['/bindservice/importmnemonic']);


  }
   
}
