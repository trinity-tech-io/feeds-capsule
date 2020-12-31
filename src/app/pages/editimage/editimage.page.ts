import { Component, OnInit } from '@angular/core';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { FeedService } from '../../services/FeedService';
import { NativeService } from '../../services/NativeService';
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
    private nativeService:NativeService) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.headPortrait = this.feedService.getClipProfileIamge();
  }

  ionViewWillLeave(){
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
