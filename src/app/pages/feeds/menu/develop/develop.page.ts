import { Component, OnInit } from '@angular/core';
import {Events} from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';
import { TranslateService } from "@ngx-translate/core";
import { AlertController } from '@ionic/angular';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
@Component({
  selector: 'app-develop',
  templateUrl: './develop.page.html',
  styleUrls: ['./develop.page.scss'],
})
export class DevelopPage implements OnInit {

  public alert = null;
  
  constructor(
    public feedService :FeedService,
    public native: NativeService,
    public alertController: AlertController,
    public translate:TranslateService,
    public events: Events) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);

    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });
   
  }

  ionViewDidEnter(){
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("DevelopPage.develop"));
  }

  clearAll(){
    this.presentAlertConfirm();
  }

  async presentAlertConfirm() {
      this.alert = await this.alertController.create({
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
            this.native.setRootRouter(['/signin']);
          }
        }
      ]
    });

    await this.alert.present();
  }

  ionViewWillLeave(){
    if(this.alert!=null){
      this.alert = null;
    }
    this.events.unsubscribe("feeds:updateTitle");
  }

}
