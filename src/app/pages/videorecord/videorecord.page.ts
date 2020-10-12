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
  //videodata
  // {
  //   "name": "video_20201012_144635.mp4",
  //   "localURL": "cdvfile://localhost/sdcard/DCIM/Camera/video_20201012_144635.mp4",
  //   "type": "video/mp4",
  //   "lastModified": null,
  //   "lastModifiedDate": 1602485203000,
  //   "size": 7455582,
  //   "start": 0,
  //   "end": 0,
  //   "fullPath": "file:///storage/emulated/0/DCIM/Camera/video_20201012_144635.mp4"
  // }
  public flieUri:string ="";
  public videotype:string = "video/mp4";
  constructor(private camera: CameraService,
              private zone:NgZone) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    appManager.setVisible('show');
  }


  videorecord(){
    navigator.device.capture.captureVideo((videosdata:any)=>{
      this.zone.run(()=>{
        let videodata = videosdata[0];
        this.flieUri =  videodata['localURL'];
        console.log("========"+JSON.stringify(this.flieUri));
     });
  }, (error)=>{
       console.log("========"+JSON.stringify(error));
  }, {limit:1});
  }

  browsevideo() {

    this.camera.getVideo().then((flieUri)=>{
      console.log("====flieUri===="+flieUri);
      this.flieUri = flieUri;
    }).catch((err)=>{
      console.log("====err===="+JSON.stringify(err));
    })
   
  }

}
