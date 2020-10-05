import { Component, OnInit, Input } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
})
export class CommentComponent implements OnInit {

  @Input() public channelAvatar = "";
  @Input() public channelName = "";
  
  @Input() public nodeId = "";
  @Input() public channelId = 0;
  @Input() public postId = 0;

  public newComment = "";

  constructor(
    public theme: ThemeService,
    public native: NativeService,
    private feedService: FeedService
  ) { }

  ngOnInit() {}

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
}
