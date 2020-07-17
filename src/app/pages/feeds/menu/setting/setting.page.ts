import { Component, OnInit, NgZone } from '@angular/core';
import {Events} from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';
import { TranslateService } from "@ngx-translate/core";
import { NavController, AlertController } from '@ionic/angular';
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
    private navCtrl: NavController,
    private router: Router,
    private zone: NgZone,
    private feedService :FeedService,
    private native: NativeService,
    public alertController: AlertController,
    private translate:TranslateService,
    private events: Events){ }

  ngOnInit() {
 
  }

  ionViewWillEnter() {
    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("SettingPage.setting"));
  }

  async presentAlertConfirm() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header:this.translate.instant('common.confirm'),
      message: this.translate.instant('common.des'),
      buttons: [
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {

          }
        }, {
          text: this.translate.instant('common.ok'),
          handler: () => {

            this.feedService.removeAllData();
            this.navCtrl.navigateRoot(['/signin']);
          }
        }
      ]
    });

    await alert.present();
  }

  ionViewWillUnload(){
    this.events.unsubscribe("feeds:updateTitle");
  }
   
}
