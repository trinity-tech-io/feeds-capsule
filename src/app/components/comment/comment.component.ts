import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';
import { IonTextarea, IonInput } from '@ionic/angular';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
})
export class CommentComponent implements OnInit {

  @ViewChild('comment', {static: false}) comment: IonTextarea;

  @Input() public channelAvatar = "";
  @Input() public channelName = "";
  
  @Input() public nodeId = "";
  @Input() public channelId = 0;
  @Input() public postId = 0;

  @Output() hideComment: EventEmitter<boolean> = new EventEmitter<boolean>();

  public newComment = "";

  constructor(
    public theme: ThemeService,
    public native: NativeService,
    private feedService: FeedService
  ) { }

  ngOnInit() {
  }

  ionViewDidEnter() {
    setTimeout(() => {
      this.comment.setFocus();
    }, 300);
  }

  addImg() {
    this.native.toast("common.comingSoon");
  }

  sendComment(){
    this.feedService.postComment(
      this.nodeId,
      Number(this.channelId),
      Number(this.postId),
      0,
      this.newComment
    );
  }

  hideComponent() {
    this.hideComment.emit(true);
  }
}
