import { Component, OnInit } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
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
    public alertController: AlertController) {
      acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
      });
    }

  ngOnInit() {
  }

  comfirm(){
    if (this.mnemonic == ""){
      this.alertError("Please input mnemonic!");
      return ;
    }

    if (this.passphrase == ""){
      this.alertError("Please input passphrase!")
      return ;
    }

    if (this.index == null || this.index == 0){
      this.alertError("Please input index!");
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
      header: 'Alert',
      message: msg,
      buttons: [
         {
          text: 'Ok',
          handler: () => {
          }
        }
      ]
    });

    await alert.present();
  }
}
