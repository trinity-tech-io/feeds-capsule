import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Platform } from '@ionic/angular';
import { FeedService } from '../../services/FeedService';
import { ThemeService } from '../../services/theme.service';
import { UtilService } from '../../services/utilService';
import { NativeService } from '../../services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { AppService } from '../../services/AppService';
import { ViewHelper } from '../../services/viewhelper.service';
import { FeedsServiceApi } from '../../services/api_feedsservice.service';

@Component({
  selector: 'app-likes',
  templateUrl: './likes.component.html',
  styleUrls: ['./likes.component.scss'],
})
export class LikesComponent implements OnInit {
  @Input() likeList: any = [];
  @Input() nodeStatus: any = {};
  @Input() isLoadVideoiamge: any = {};

  @Input() isImgLoading: any = {};
  @Input() isImgPercentageLoading: any = {};
  @Input() imgloadingStyleObj: any = {};
  @Input() imgPercent: number = 0;
  @Input() imgRotateNum: any = {};

  @Input() isVideoPercentageLoading: any = {};
  @Input() videoPercent: number = 0;
  @Input() videoRotateNum: any = {};
  @Input() isVideoLoading: any = {};
  @Input() videoloadingStyleObj: any = {};

  @Input() hideDeletedPosts: boolean = false;
  @Output() fromChild = new EventEmitter();
  @Output() commentParams = new EventEmitter();
  @Output() clickImage = new EventEmitter();
  @Output() toPage = new EventEmitter();

  public styleObj: any = { width: '' };
  public maxTextSize = 240;
  public isPress: boolean = false;
  public isAndroid: boolean = true;
  constructor(
    private platform: Platform,
    private feedService: FeedService,
    public theme: ThemeService,
    private translate: TranslateService,
    private native: NativeService,
    private viewHelper: ViewHelper,
    public appService: AppService,
    private feedsServiceApi: FeedsServiceApi
  ) { }

  ngOnInit() {
    if (this.platform.is('ios')) {
      this.isAndroid = true;
    }
    this.styleObj.width = screen.width - 105 + 'px';
  }

  channelName(destDid: string, channelId: string) {
    let channel = this.getChannel(destDid, channelId) || '';
    if (channel === '') {
      return '';
    } else {
      return UtilService.moreNanme(channel['name']);
    }
  }

  channelOwnerName(nodeId, channelId) {
    let channel = this.getChannel(nodeId, channelId) || '';
    if (channel === '') {
      return '';
    } else {
      return UtilService.moreNanme(channel['owner_name']);
    }
  }

  getChannel(destDid: string, channelId: string): any {
    return this.feedService.getChannelFromId(destDid, channelId) || '';
  }

  checkServerStatus(destDid: string) {
    return this.feedService.getServerStatusFromId(destDid);
  }

  like(destDid: string, channelId: string, postId: string) {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    // if (this.checkServerStatus(destDid) != 0) {
    //   this.native.toastWarn('common.connectionError1');
    //   return;
    // }

    if (this.checkMyLike(destDid, channelId, postId)) {
      this.feedsServiceApi.postUnlike(destDid, channelId, postId, 0);
      return;
    }

    this.feedsServiceApi.postLike(destDid, channelId, postId, 0);
  }

  getContentText(content: string): string {
    return this.feedsServiceApi.parsePostContentText(content);
  }

  getContentShortText(post: any): string {
    let content = post.content.content;
    let text = this.feedsServiceApi.parsePostContentText(content) || '';
    return text.substring(0, 180) + '...';
  }

  getPostContentTextSize(content: string) {
    let text = this.feedsServiceApi.parsePostContentText(content);
    let size = UtilService.getSize(text);
    return size;
  }

  navTo(destDid: string, channelId: number, postId: number) {
    this.pauseVideo(destDid + '-' + channelId + '-' + postId);
    this.toPage.emit({
      destDid: destDid,
      channelId: channelId,
      page: '/channels',
    });
  }

  navToPostDetail(
    destDid: string,
    channelId: number,
    postId: number,
    event?: any,
  ) {
    if (this.isPress) {
      this.isPress = false;
      return;
    }
    event = event || '';
    if (event != '') {
      let e = event || window.event; //兼容IE8
      let target = e.target || e.srcElement; //判断目标事件
      if (target.tagName.toLowerCase() == 'span') {
        let url = target.textContent || target.innerText;
        this.native.clickUrl(url, event);
        return;
      }
    }
    this.pauseVideo(destDid + '-' + channelId + '-' + postId);
    this.toPage.emit({
      destDid: destDid,
      channelId: channelId,
      postId: postId,
      page: '/postdetail',
    });
  }

  checkMyLike(destDid: string, channelId: string, postId: string) {
    return this.feedService.checkMyLike(destDid, channelId, postId);
  }

  parseAvatar(destDid: string, channelId: string): string {
    return this.feedService.parseChannelAvatar(
      this.getChannel(destDid, channelId).avatar || '',
    );
  }

  handleDisplayTime(createTime: number) {
    let obj = UtilService.handleDisplayTime(createTime);
    if (obj.type === 's') {
      return this.translate.instant('common.just');
    }
    if (obj.type === 'm') {
      if (obj.content === 1) {
        return obj.content + this.translate.instant('HomePage.oneminuteAgo');
      }
      return obj.content + this.translate.instant('HomePage.minutesAgo');
    }
    if (obj.type === 'h') {
      if (obj.content === 1) {
        return obj.content + this.translate.instant('HomePage.onehourAgo');
      }
      return obj.content + this.translate.instant('HomePage.hoursAgo');
    }
    if (obj.type === 'day') {
      if (obj.content === 1) {
        return this.translate.instant('common.yesterday');
      }
      return obj.content + this.translate.instant('HomePage.daysAgo');
    }
    return obj.content;
  }

  menuMore(destDid: string, channelId: string, postId: string) {
    let channelName = this.getChannel(destDid, channelId).name;
    this.fromChild.emit({
      destDid: destDid,
      channelId: channelId,
      channelName: channelName,
      postId: postId,
      tabType: 'mylike',
    });
  }

  pressName(destDid: string, channelId: string) {
    let channel = this.getChannel(destDid, channelId) || '';
    if (channel != '') {
      let name = channel['name'] || '';
      if (name != '' && name.length > 15) {
        this.viewHelper.createTip(name);
      }
    }
  }

  pressOwerName(destDid: string, channelId: string) {
    let channel = this.getChannel(destDid, channelId) || '';
    if (channel != '') {
      let name = channel['owner_name'] || '';
      if (name != '' && name.length > 15) {
        this.viewHelper.createTip(name);
      }
    }
  }

  showComment(destDid: string, channelId: string, postId: string) {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    // if (this.checkServerStatus(destDid) != 0) {
    //   this.native.toastWarn('common.connectionError1');
    //   return;
    // }

    this.commentParams.emit({
      destDid: destDid,
      channelId: channelId,
      postId: postId,
      onlineStatus: this.nodeStatus[destDid],
      channelAvatar: this.parseAvatar(destDid, channelId),
      channelName: this.channelName(destDid, channelId),
    });
  }

  showBigImage(destDid: string, channelId: number, postId: number) {
    this.clickImage.emit({
      destDid: destDid,
      channelId: channelId,
      postId: postId,
      tabType: 'mylike',
    });
  }

  pauseVideo(id: string) {
    let videoElement: any = document.getElementById(id + 'videolike') || '';
    let source: any = document.getElementById(id + 'sourcelike') || '';
    if (source != '') {
      videoElement.pause();
      source.removeAttribute('src'); // empty source
      let sid = setTimeout(() => {
        videoElement.load();
        clearTimeout(sid);
      }, 10);
    }
  }

  pauseAllVideo() {
    let videoids = this.isLoadVideoiamge;
    for (let id in videoids) {
      let value = videoids[id] || '';
      if (value === '13') {
        this.pauseVideo(id);
      }
    }
  }

  handleTotal(post: any) {
    let videoThumbKey = post.content['videoThumbKey'] || '';
    let duration = 29;
    if (videoThumbKey != '') {
      duration = videoThumbKey['duration'] || 0;
    }
    return UtilService.timeFilter(duration);
  }

  pressContent(postContent: string) {
    if (this.platform.is('ios')) {
      this.isPress = true;
    }
    let text = this.feedsServiceApi.parsePostContentText(postContent);
    this.native
      .copyClipboard(text)
      .then(() => {
        this.native.toast_trans('common.textcopied');
      })
      .catch(() => { });
  }

  clickDashang(destDid: string, channelId: string, postId: string) {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    let channel :any = this.feedService.getChannelFromIdV3(destDid,channelId);
    let tippingAddress = channel.tipping_address || "";
    if (tippingAddress == "") {
      this.native.toast('common.noElaAddress');
      return;
    }
    this.pauseVideo(destDid + '-' + channelId + '-' + postId);
    this.viewHelper.showPayPrompt(destDid, channelId, tippingAddress);
  }
}
