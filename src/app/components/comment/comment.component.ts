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
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';


@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
})
export class CommentComponent implements OnInit {
  @ViewChild('comment', { static: false }) comment: IonTextarea;

  @Input() public channelAvatar = '';
  @Input() public channelName = '';

  @Input() public destDid: string = '';
  @Input() public channelId: string = '';
  @Input() public postId: string = '0';
  @Input() public commentId: string = '0';
  @Input() public onlineStatus = 0;

  @Output() hideComment: EventEmitter<boolean> = new EventEmitter<boolean>();

  public newComment = '';
  public isAndroid = '';
  constructor(
    public theme: ThemeService,
    public native: NativeService,
    private feedService: FeedService,
    private platform: Platform,
    private feedsServiceApi: FeedsServiceApi,
    private hiveVaultController: HiveVaultController
  ) { }

  ngOnInit() {
    if (this.platform.is('ios')) {
      this.isAndroid = "ios";
    } else {
      this.isAndroid = "android";
    }

    this.parseAvatar();
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

  async parseAvatar() {
   let avatarUri = this.channelAvatar;
    this.channelAvatar = "./assets/icon/reserve.svg";
    let avatar = await this.handleChannelAvatar(avatarUri,this.destDid);
    this.channelAvatar = avatar;
  }

  handleChannelAvatar(channelAvatarUri: string,destDid: string): Promise<string>{
    return new Promise(async (resolve, reject) => {
      try {
        let fileName:string = "channel-avatar-"+channelAvatarUri.split("@")[0];
        this.hiveVaultController.getV3Data(destDid,channelAvatarUri,fileName,"0")
        .then((result)=>{
           let channelAvatar = result || '';
           resolve(channelAvatar);
        }).catch((err)=>{
          resolve('');
        })
      }catch(err){
        resolve('');
      }
    });

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
    try {
      this.hiveVaultController.updateComment(
        this.destDid,
        this.channelId,
        this.postId,
        this.commentId,
        this.newComment
      ).then(()=>{
        this.native.hideLoading();
        this.hideComponent();
      }).catch((err)=>{
        this.native.hideLoading();
      })
    } catch (error) {
      this.native.hideLoading();
    }

  }

  hideComponent() {
    this.hideComment.emit(true);
  }
}
