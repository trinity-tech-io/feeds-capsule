import { Component, OnInit, NgZone } from '@angular/core';
import { Events } from '@ionic/angular';
import { CarrierService } from 'src/app/services/CarrierService';
import { CameraService } from 'src/app/services/CameraService';
import { ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'page-about',
  templateUrl: './about.html',
  styleUrls: ['./about.scss'],
})

export class AboutPage implements OnInit {
  private imgUrl: string = "../../../assets/images/avatar.svg";

  constructor(
    private camera: CameraService,
    private zone: NgZone,
    private actionSheetController:ActionSheetController) {
  }

  ngOnInit() {
  }

  async openCamera(){
    // this.camera.openCamera(50,0,2,
    //   (imageUrl)=>{
    //     // alert(imageUrl);
    //     console.log(imageUrl);
    //     this.zone.run(() => {
    //       // this.imgUrl = "../../../assets/images/logo.png";
    //       // document.getElementById("imgShow").src = imageUrl;
    //       this.imgUrl = imageUrl;
    //     });
    //   },
    //   (err)=>{alert(err)});



      const actionSheet = await this.actionSheetController.create({
        // header: 'Albums',
        buttons: [{
          text: 'Delete',
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            console.log('Delete clicked');
          }
        },{
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }]
      });
      await actionSheet.present();

  }


}
