import { Component, OnInit,NgZone  } from '@angular/core';
import { CameraService } from 'src/app/services/CameraService';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
declare let appManager: AppManagerPlugin.AppManager;
@Component({
  selector: 'app-videorecord',
  templateUrl: './videorecord.page.html',
  styleUrls: ['./videorecord.page.scss'],
})
export class VideorecordPage implements OnInit {

  constructor(private camera: CameraService,
              private zone:NgZone) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    appManager.setVisible('show');
  }

  videorecord(){
    navigator.device.capture.captureImage((videodata)=>{
        console.log("========"+videodata);
    }, (error)=>{
      console.log("========"+JSON.stringify(error));
    }, {limit:2});
  }

  addImg(type: number) {
    this.camera.openCamera(
      30, 0, type,
      (imageUrl: any) => {
        this.zone.run(() => {
          console.info('Add info',imageUrl);
        });
      },
      (err: any) => {
        console.error('Add img err', err);
      }
    );
  }

}
