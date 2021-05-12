import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';
import { IonTextarea} from '@ionic/angular';

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
  @Input() public commentId = 0;
  @Input() public onlineStatus = 0;

  @Output() hideComment: EventEmitter<boolean> = new EventEmitter<boolean>();

  public newComment = "";

  constructor(
    public theme: ThemeService,
    public native: NativeService,
    private feedService: FeedService
  ) { }

  ngOnInit() {
    let sid = setTimeout(() => {
      this.comment.setFocus();
      clearTimeout(sid);
    }, 500);
  }

  ionViewDidEnter() {

  }

  addImg() {
    this.native.toast("common.comingSoon");
  }

  sendComment(){
    // this.feedService.postComment(
    //   this.nodeId,
    //   Number(this.channelId),
    //   Number(this.postId),
    //   0,
    //   this.newComment
    // );

    let newComment = this.native.iGetInnerText(this.newComment) || "";
    if(newComment===""){
      this.native.toast_trans('CommentPage.inputComment');
      return false;
    }

    this.native.showLoading("common.waitMoment",(isDismiss)=>{
    }).then(()=>{
           this.publishComment();
    }).catch(()=>{
         this.native.hideLoading();
    });
  }


  publishComment(){
    this.feedService.postComment(this.nodeId,Number(this.channelId),Number(this.postId),this.commentId,this.newComment);
  }

  hideComponent() {
    this.hideComment.emit(true);
  }
}
