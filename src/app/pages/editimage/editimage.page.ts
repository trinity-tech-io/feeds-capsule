import { Component, OnInit } from '@angular/core';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { FeedService } from '../../services/FeedService';
import { NativeService } from '../../services/NativeService';
import { Events} from '@ionic/angular';
import { AppService } from '../../services/AppService';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
@Component({
  selector: 'app-editimage',
  templateUrl: './editimage.page.html',
  styleUrls: ['./editimage.page.scss'],
})
export class EditimagePage implements OnInit {
  public headPortrait:string ="";
  public croppedImage:string="";
  constructor(
    private feedService:FeedService,
    private nativeService:NativeService,
    private events:Events,
    private appService:AppService) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.events.subscribe("feeds:editImages",()=>{
      this.finish();
    });
    this.appService.hideright();
    titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_RIGHT, {
      key: "editImages",
      iconPath:"assets/icon/yes.ico"
      //iconPath:TitleBarPlugin.BuiltInIcon.ADD
    });

    this.headPortrait = this.feedService.getClipProfileIamge();
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:editImages");
    this.appService.addright();
    titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_RIGHT, null);
    let croppedImage = this.feedService.getClipProfileIamge();
    if(this.headPortrait === croppedImage){
      this.feedService.setClipProfileIamge("");
    }

  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64;
  }

  finish(){
    this.feedService.setClipProfileIamge(this.croppedImage);
    this.nativeService.pop();
  }

}
