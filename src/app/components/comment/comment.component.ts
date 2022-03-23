import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';
import { IonTextarea, Platform } from '@ionic/angular';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
})
export class CommentComponent implements OnInit {
  @ViewChild('comment', { static: false }) comment: IonTextarea;

  @Input() public channelAvatar = '';
  @Input() public channelName = '';

  @Input() public destDid = '';
  @Input() public channelId = 0;
  @Input() public postId = 0;
  @Input() public commentId = 0;
  @Input() public onlineStatus = 0;

  @Output() hideComment: EventEmitter<boolean> = new EventEmitter<boolean>();

  public newComment = '';
  public isAndroid = '';
  constructor(
    public theme: ThemeService,
    public native: NativeService,
    private feedService: FeedService,
    private platform: Platform,
    private feedsServiceApi: FeedsServiceApi
  ) { }

  ngOnInit() {
    if (this.platform.is('ios')) {
      this.isAndroid = "ios";
    } else {
      this.isAndroid = "android";
    }
  }

  ionViewDidEnter() {

    const timer = setTimeout(() => {
      this.comment.setFocus();
      clearTimeout(timer);
    }, 300);
  }

  addImg() {
    this.native.toast('common.comingSoon');
  }

  sendComment() {
    let newComment = this.native.iGetInnerText(this.newComment) || '';
    if (newComment === '') {
      this.native.toast_trans('CommentPage.inputComment');
      return false;
    }

    this.native
      .showLoading('common.waitMoment')
      .then(() => {
        this.publishComment();
      })
      .catch(() => {
        this.native.hideLoading();
      });
  }

  publishComment() {
    this.feedsServiceApi.postComment(
      this.destDid,
      Number(this.channelId),
      Number(this.postId),
      this.commentId,
      this.newComment,
    );
  }

  hideComponent() {
    this.hideComment.emit(true);
  }
}
