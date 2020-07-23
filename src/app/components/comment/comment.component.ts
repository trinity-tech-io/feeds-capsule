import { Component, OnInit } from '@angular/core';
import { NavParams } from '@ionic/angular'; 
import { PopoverController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
})
export class CommentComponent implements OnInit {
  private newComment: string="";
  private nodeId: string;
  private channelId: number;
  private postId: number;

  constructor(
    private feedService: FeedService,
    private native:NativeService,
    private navParams: NavParams,
    private popover: PopoverController) { }

  ngOnInit() {
    this.nodeId = this.navParams.data.nodeId;
    this.channelId = this.navParams.data.channelId;
    this.postId = this.navParams.data.postId;
  }

  publishComment(){
    let newComment = this.native.iGetInnerText(this.newComment) || "";
    if(newComment===""){
      this.native.toast_trans('CommentComponent.enterComments');
      return false;
    }
    this.feedService.postComment(this.nodeId,Number(this.channelId),Number(this.postId),0,this.newComment)
    this.popover.dismiss();
  }
}
