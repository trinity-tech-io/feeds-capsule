import { Component, OnInit } from '@angular/core';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from '../../../services/FeedService';
import { AlertController } from '@ionic/angular';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-setting',
  templateUrl: './setting.page.html',
  styleUrls: ['./setting.page.scss'],
})
export class SettingPage implements OnInit {

  constructor(
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
          text: 'Okay',
          handler: () => {

            this.feedService.removeAllData();
          }
        }
      ]
    });

    await alert.present();
  }
}
