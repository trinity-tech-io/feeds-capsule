import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { FeedService } from 'src/app/services/FeedService';
import { DataHelper } from 'src/app/services/DataHelper';
import { Logger, LogLevel } from 'src/app/services/logger';
import { HiveVaultApi } from 'src/app/services/hivevault_api.service';

@Component({
  selector: 'app-hive-interface-test',
  templateUrl: './hive-interface-test.page.html',
  styleUrls: ['./hive-interface-test.page.scss'],
})
export class HiveInterfaceTestPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public openLog: boolean = false;
  public selectedNetwork: any = "MainNet";
  constructor(
    private translate: TranslateService,
    public theme: ThemeService,
    private titleBarService: TitleBarService,
    private native: NativeService,
    private feedService: FeedService,
    private zone: NgZone,
    private dataHelper: DataHelper,
    private hiveVaultApi: HiveVaultApi
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
    this.selectedNetwork = this.dataHelper.getDevelopNet();
    this.openLog = this.dataHelper.getDevelopLogMode();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      'Interface Test'
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  createCollection() {
    this.hiveVaultApi.createAllCollections();
  }

  //
  registeScripting() {
    this.hiveVaultApi.registeScripting();
  }

  // channel
  createChannel() {
    this.hiveVaultApi.createChannel('channel01', 'channel01 desc', 'address');
    alert('createChannel');
  }

  updateChannel() {
    alert('updateChannel');
  }

  queryChannelInfo() {
    alert('queryChannelInfo');
  }

  // post
  publishPost() {
    alert('publishPost');
  }

  updatePost() {
    alert('updatePost');
  }

  deletePost() {
    alert('deletePost');
  }

  queryPostByChannelId() {
    // this.hiveVaultApi.queryPostByChannelId();
    alert('queryPostByChannelId');
  }

  queryPostById() {
    alert('queryPostById');
  }

  //subscription
  querySubscrptionInfoByChannelId() {
    this.hiveVaultApi.querySubscrptionInfoByChannelId('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01');
    // alert('getSubscriptionInfo');
  }

  querySubscriptionInfoByUserDID() {
    this.hiveVaultApi.querySubscriptionInfoByUserDID('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D');
    // alert('getSubscriptionByUser');
  }

  subscribeChannel() {
    this.hiveVaultApi.subscribeChannel('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01', 'wangran');
    // alert('subscribe');
  }

  unSubscribeChannel() {
    this.hiveVaultApi.unSubscribeChannel('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01');
    // alert('unSubscribe');
  }

  // v
  //comment
  createComment() {
    this.hiveVaultApi.createComment('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01', 'postId01', 'refcommentId01', 'test content');
    // alert('addComment');
  }

  // v
  updateComment() {
    // this.hiveVaultApi.updateComment();
    this.hiveVaultApi.updateComment('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01', 'postId01', 'e008c6785f40e5a4e3b502562f1edab276de2a093c9dc1d584617ebda0e61bd6', 'update content');
    // alert('updateComment');
  }

  // v
  queryCommentByPostId() {
    // this.hiveVaultApi.getComment();
    this.hiveVaultApi.queryCommentByPostId('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01', 'postId01');
    // alert('getComments');
  }

  deleteComment() {
    this.hiveVaultApi.deleteComment('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01', 'postId01', 'e008c6785f40e5a4e3b502562f1edab276de2a093c9dc1d584617ebda0e61bd6');
    // alert('deleteComment');
  }

  queryCommentByID() {
    alert('queryCommentByID');
  }

  //like
  queryLikeById() {
    // this.hiveVaultApi.findLikeById();
    this.hiveVaultApi.queryLikeById('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01', 'postId01', 'e008c6785f40e5a4e3b502562f1edab276de2a093c9dc1d584617ebda0e61bd6');
    alert('getLikes');
  }

  queryLikeByPost() {
    // this.hiveVaultApi.findLikeById();
    this.hiveVaultApi.queryLikeByPost('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01', 'postId01');
    alert('getLikes');
  }

  queryLikeByChannel() {
    // this.hiveVaultApi.findLikeById();
    this.hiveVaultApi.queryLikeByChannel('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01');
    alert('getLikes');
  }

  async addLike() {
    await this.hiveVaultApi.addLike('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01', 'postId01', 'e008c6785f40e5a4e3b502562f1edab276de2a093c9dc1d584617ebda0e61bd6');
    // this.hiveVaultApi.addLike();
    // alert('addLike');
  }

  removeLike() {
    this.hiveVaultApi.removeLike('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01', 'postId01', '');
    // this.hiveVaultApi.removeLike();
    // alert('removeLike');
  }

  downloadCustomeAvatar() {
    alert('downloadCustomeAvatar');
  }

  downloadEssAvatar() {
    alert('downloadEssAvatar');
  }

  uploadMediaData() {
    alert('uploadMediaData');
  }
}
