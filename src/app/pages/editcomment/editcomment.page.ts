import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { IonTextarea } from '@ionic/angular';
import { Events } from 'src/app/services/events.service';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from '../../services/NativeService';
import { ThemeService } from '../../services/theme.service';
import { TranslateService } from '@ngx-translate/core';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

import _ from 'lodash';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { DataHelper } from 'src/app/services/DataHelper';

@Component({
  selector: 'app-editcomment',
  templateUrl: './editcomment.page.html',
  styleUrls: ['./editcomment.page.scss'],
})
export class EditCommentPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild('newPostIonTextarea', { static: false })
  newPostIonTextarea: IonTextarea;
  public channelAvatar = './assets/icon/reserve.svg';
  public channelName = '';
  public subscribers: string = '';
  public newComment: string = '';
  public oldNewComment: string = '';
  public destDid: string = '';
  public channelId: string = "";
  public postId: string = "";
  public refcommentId: string = "0";
  public commentId: string = "";
  public imgUrl: string = '';
  public titleKey: string = '';
  constructor(
    private events: Events,
    private native: NativeService,
    private acRoute: ActivatedRoute,
    public theme: ThemeService,
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper,
    private hiveVaultController: HiveVaultController,
    private dataHelper: DataHelper
  ) { }

  ngOnInit() {
    this.acRoute.queryParams.subscribe(data => {
      let item = _.cloneDeep(data);
      this.destDid = item.destDid;
      this.channelId = item.channelId;
      this.postId = item.postId;
      this.refcommentId = item.refcommentId;
      this.commentId = item.commentId;
      let content = item.content || '';
      this.titleKey = item.titleKey;
      this.getContent(content);
    });
    let sid = setTimeout(() => {
      this.newPostIonTextarea.setFocus();
      clearTimeout(sid);
    }, 300);
  }

  async ionViewWillEnter() {
    this.initTitle();

    let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(this.destDid, this.channelId);
    this.channelName = channel['name'] || '';
    this.subscribers = channel['subscribers'] || '';
    let channelAvatarUri = channel['avatar'] || '';
    if (channelAvatarUri != '') {
      this.handleChannelAvatar(channelAvatarUri);
    }


    this.events.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      this.initTitle();
    });
  }

  ionViewDidEnter() {
  }

  handleChannelAvatar(channelAvatarUri: string) {
    let fileName: string = channelAvatarUri.split("@")[0];
    this.hiveVaultController.getV3Data(this.destDid, channelAvatarUri, fileName, "0")
      .then((result) => {
        this.channelAvatar = result;
      }).catch((err) => {
      })
  }

  ionViewWillLeave() {
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
  }

  newPostTextArea() {
    this.newPostIonTextarea.setFocus();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant(this.titleKey),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  async publishComment() {

    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    let newComment = this.native.iGetInnerText(this.newComment) || '';
    if (newComment === '') {
      this.native.toast_trans('CommentPage.inputComment');
      return false;
    }

    if (this.newComment === this.oldNewComment) {
      this.native.toast_trans('EditCommentPage.notModifiedYet');
      return false;
    }

    await this.native.showLoading('common.waitMoment');
    this.editComment();
  }

  private async editComment() {
    try {

      const originComment = await this.dataHelper.getCommentV3ById(this.postId, this.commentId);
      this.hiveVaultController.updateComment(originComment, this.newComment)
        .then(() => {
          let postId: string = originComment.postId;
          let refcommentId: string = originComment.refcommentId;
          let commentList = this.dataHelper.getcachedCommentList(postId, refcommentId) || [];
          let index = _.findIndex(commentList, (item: FeedsData.CommentV3) => {
            return item.destDid === this.destDid &&
              item.channelId === this.channelId &&
              item.postId === this.postId &&
              item.commentId === this.commentId;
          });
          if (index > -1) {
            commentList[index].content = this.newComment;
            commentList[index].status = FeedsData.PostCommentStatus.edited;
          }
          this.native.hideLoading();
          this.native.pop();

        }).catch((err) => {
          this.native.hideLoading();
        })
    } catch (error) {
      this.native.hideLoading();
    }
  }


  pressName(channelName: string) {
    this.viewHelper.createTip(channelName);
  }

  getContent(content: string) {
    this.newComment = content;
    this.oldNewComment = content;
  }

  addImg() {
    this.native.toast('common.comingSoon');
  }

}
