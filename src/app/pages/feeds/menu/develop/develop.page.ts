import { Component, OnInit } from '@angular/core';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';
import { NavController, AlertController } from '@ionic/angular';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
@Component({
  selector: 'app-develop',
  templateUrl: './develop.page.html',
  styleUrls: ['./develop.page.scss'],
})
export class DevelopPage implements OnInit {

  constructor(
    private navCtrl: NavController,
    private feedService :FeedService,
    private native: NativeService,
    public alertController: AlertController) { }

  ngOnInit() {
    titleBarManager.setTitle("Develop");
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
            this.navCtrl.navigateRoot(['/signin']);
          }
        }
      ]
    });

    await alert.present();
  }

}
