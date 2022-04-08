import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { NavController, IonTextarea } from '@ionic/angular';
import { Events } from 'src/app/services/events.service';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from '../../services/NativeService';
import { ThemeService } from '../../services/theme.service';
import { TranslateService } from '@ngx-translate/core';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';

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
  public nodeStatus: any = {};
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
    private navCtrl: NavController,
    private zone: NgZone,
    private feedService: FeedService,
    public theme: ThemeService,
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper,
    private feedsServiceApi: FeedsServiceApi,
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

    let channel :any = await this.feedService.getChannelFromIdV3(this.destDid, this.channelId);
    this.channelName = channel['name'] || '';
    this.subscribers = channel['subscribers'] || '';
    let channelAvatarUri = channel['avatar'] || '';
    if(channelAvatarUri != ''){
       this.handleChannelAvatar(channelAvatarUri);
    }


    this.events.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      this.initTitle();
    });

    this.events.subscribe(FeedsEvent.PublishType.rpcRequestError, () => {
      this.zone.run(() => {
        this.native.hideLoading();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.rpcResponseError, () => {
      this.zone.run(() => {
        this.native.hideLoading();
      });
    });

    this.events.subscribe(
      FeedsEvent.PublishType.friendConnectionChanged,
      (friendConnectionChangedData: FeedsEvent.FriendConnectionChangedData) => {
        this.zone.run(() => {
          let nodeId = friendConnectionChangedData.nodeId;
          let connectionStatus = friendConnectionChangedData.connectionStatus;
          this.nodeStatus[nodeId] = connectionStatus;
        });
      },
    );

    this.initnodeStatus();
  }

  ionViewDidEnter() {
  }

  handleChannelAvatar(channelAvatarUri: string){
    let fileName:string = channelAvatarUri.split("@")[0];
    this.hiveVaultController.getV3Data(this.destDid,channelAvatarUri,fileName,"0")
    .then((result)=>{
       this.channelAvatar = result;
    }).catch((err)=>{
    })
  }

  ionViewWillLeave() {
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestError);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcResponseError);
    this.events.unsubscribe(FeedsEvent.PublishType.friendConnectionChanged);
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

  publishComment() {

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

    this.native
      .showLoading('common.waitMoment', isDismiss => { })
      .then(() => {
        this.editComment();
      })
      .catch(() => {
        this.native.hideLoading();
      });
  }

  private editComment() {
    try {
      this.hiveVaultController.updateComment(
        this.destDid,
        this.channelId,
        this.postId,
        this.commentId,
        this.newComment)
        .then(()=>{
          this.native.hideLoading();
          this.native.pop();
        }).catch((err)=>{
          this.native.hideLoading();
        })
    } catch (error) {
      this.native.hideLoading();
    }
  }

  checkServerStatus(destId: string) {
    return this.feedService.getServerStatusFromId(destId);
  }

  initnodeStatus() {
    let status = this.checkServerStatus(this.destDid);
    this.nodeStatus[this.destDid] = status;
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
