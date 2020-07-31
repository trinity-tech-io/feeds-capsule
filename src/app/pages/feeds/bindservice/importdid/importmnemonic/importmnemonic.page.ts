import { Component, OnInit } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { TranslateService } from "@ngx-translate/core";
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-importmnemonic',
  templateUrl: './importmnemonic.page.html',
  styleUrls: ['./importmnemonic.page.scss'],
})
export class ImportmnemonicPage implements OnInit {
  private nodeId = "";
  private mnemonic: string = "";
  private passphrase: string = "";
  private index: number = 0;
  constructor(
    private acRoute: ActivatedRoute,
    private navCtrl: NavController,
    private feedService:FeedService,
    public alertController: AlertController,
    private translate:TranslateService,) {
      acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
      });
    }

  ngOnInit() {
  }

  confirm(){
    if (this.mnemonic == ""){
      this.alertError(this.translate.instant('ImportmnemonicPage.tipMsg'));
      return ;
    }

    if (this.passphrase == ""){
      this.alertError(this.translate.instant('ImportmnemonicPage.tipMsg1'))
      return ;
    }

    if (this.index == null || this.index == 0){
      this.alertError(this.translate.instant('ImportmnemonicPage.tipMsg2'));
      return ;
    }

    this.feedService.importDidRequest(this.nodeId, this.mnemonic,this.passphrase,this.index);
  }

  abort(){
    this.navCtrl.pop();
  }


  async alertError(msg: string) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: this.translate.instant('ImportmnemonicPage.alert'),
      message: msg,
      buttons: [
         {
          text: this.translate.instant('ImportmnemonicPage.ok'),
          handler: () => {
          }
        }
      ]
    });

    await alert.present();
  }
}
