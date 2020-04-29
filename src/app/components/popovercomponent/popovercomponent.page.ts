import { Component, OnInit, NgZone } from '@angular/core';
import {PopoverController} from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { NavParams } from '@ionic/angular'; 
import { CameraService } from 'src/app/services/CameraService';

@Component({
  selector: 'app-popovercomponent',
  templateUrl: './popovercomponent.page.html',
  styleUrls: ['./popovercomponent.page.scss'],
})
export class PopovercomponentPage implements OnInit {
  private newEvent: string = "";
  private eventImgUrl: string = "";

  constructor(
    private feedService: FeedService,
    private popover: PopoverController,
    private navParams: NavParams,
    private camera: CameraService,
    private zone: NgZone) {     
  }

  ngOnInit() {
  }
  createNewEvent()
  {
    if (this.newEvent == ""){
      alert("Please input message!");
      return;
    }
    this.feedService.publishPost(
      this.navParams.data.nodeId,
      this.navParams.data.id,
      this.newEvent)
    this.popover.dismiss();
  }

  addPic(){
    this.openCamera(0);
  }

  openCamera(type: number){
    this.camera.openCamera(50,0,type,
      (imageUrl)=>{
        this.zone.run(() => {
          this.eventImgUrl = imageUrl;
        });
      },
      (err)=>{alert(err)});
  }

}
