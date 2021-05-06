import { Component, OnInit, ViewChild } from '@angular/core';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { FeedService } from '../../services/FeedService';
import { NativeService } from '../../services/NativeService';
import { Events } from 'src/app/services/events.service';
import { AppService } from '../../services/AppService';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

@Component({
  selector: 'app-editimage',
  templateUrl: './editimage.page.html',
  styleUrls: ['./editimage.page.scss'],
})
export class EditimagePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public headPortrait:string ="";
  public croppedImage:string="";
  constructor(
    private feedService:FeedService,
    private nativeService:NativeService,
    private events:Events,
    private appService:AppService,
    private titleBarService: TitleBarService) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.events.subscribe(FeedsEvent.PublishType.editImages,()=>{
      this.finish();
    });
    this.initTitle();
    this.headPortrait = this.feedService.getClipProfileIamge();
  }

  initTitle(){
    this.titleBarService.hideRight(this.titleBar);
    this.titleBarService.setTitleBarEditImage(this.titleBar);
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewWillLeave(){
    this.events.unsubscribe(FeedsEvent.PublishType.editImages);
    this.titleBarService.addRight(this.titleBar);
    this.titleBarService.setIcon(this.titleBar, FeedsData.TitleBarIconSlot.INNER_RIGHT, null, null);
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
