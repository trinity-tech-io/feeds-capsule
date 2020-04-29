import { Component, OnInit } from '@angular/core';
import { NavParams } from '@ionic/angular'; 
import { PopoverController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
})
export class CommentComponent implements OnInit {
  private newComment: string;
  private nodeId: string;
  private channelId: number;
  private postId: number;

  constructor(
    private feedService: FeedService,
    private navParams: NavParams,
    private popover: PopoverController) { }

  ngOnInit() {
    this.nodeId = this.navParams.data.nodeId;
    this.channelId = this.navParams.data.channelId;
    this.postId = this.navParams.data.postId;
  }

  publishComment(){
    this.feedService.postComment(this.nodeId,Number(this.channelId),Number(this.postId),null,this.newComment)
    this.popover.dismiss();
  }
}
