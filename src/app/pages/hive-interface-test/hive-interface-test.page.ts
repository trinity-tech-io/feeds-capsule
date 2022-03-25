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
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { FileHelperService } from 'src/app/services/FileHelperService';


@Component({
  selector: 'app-hive-interface-test',
  templateUrl: './hive-interface-test.page.html',
  styleUrls: ['./hive-interface-test.page.scss'],
})


export class HiveInterfaceTestPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public openLog: boolean = false;
  public selectedNetwork: any = "MainNet";
  private destDid = 'did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D';
  constructor(
    private translate: TranslateService,
    public theme: ThemeService,
    private titleBarService: TitleBarService,
    private native: NativeService,
    private feedService: FeedService,
    private zone: NgZone,
    private dataHelper: DataHelper,
    private hiveVaultApi: HiveVaultApi,
    private hiveVaultController: HiveVaultController,
    private fileHelperService: FileHelperService
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
    this.hiveVaultApi.createChannel('channelId01', 'channel01 desc', 'address');
  }

  updateChannel() {
    //TODO
    // this.hiveVaultApi.updateChannel();
    alert('updateChannel');
  }

  queryChannelInfo() {
    this.hiveVaultApi.queryChannelInfo(this.destDid, 'b434c0d62c83ccdf1ecaabf831894f87b086c58bd2f4711d889ae832056d9c7d');
  }

  // post
  publishPost() {
    this.hiveVaultApi.publishPost('channelId01', 'tag01', 'testContent');
    alert('publishPost');
  }

  updatePost() {
    //TODO
    // this.hiveVaultApi.updatePost('');
    alert('updatePost');
  }

  deletePost() {
    //TODO
    // this.hiveVaultApi.deletePost('');
    alert('deletePost');
  }

  queryPostByChannelId() {
    // this.hiveVaultApi.queryPostByChannelId(this.destDid, 'channelId01');
    this.hiveVaultController.getPostListByChannel(this.destDid, 'channelId01');
    alert('queryPostByChannelId');
  }

  queryPostById() {
    this.hiveVaultApi.queryPostById(this.destDid, 'channelId01', 'need Input postId');
    alert('queryPostById');
  }

  //subscription
  querySubscrptionInfoByChannelId() {
    this.hiveVaultApi.querySubscrptionInfoByChannelId('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01');
    // alert('getSubscriptionInfo');
  }

  querySubscriptionInfoByUserDID() {
    this.hiveVaultApi.querySubscriptionInfoByUserDID('did:elastos:imZgAo9W38Vzo1pJQfHp6NJp9LZsrnRPRr', 'did:elastos:imZgAo9W38Vzo1pJQfHp6NJp9LZsrnRPRr');
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

  syncSelfChannel() {
    this.hiveVaultController.syncSelfChannel();
  }

  syncSelfPost() {
    this.hiveVaultController.syncSelfPost();
  }

  downloadData() {
    // this.hiveVaultController.getV3Data('','');


  }

  async writeData() {
    const fileName = 'testFile';
    const data = '1234567890';
    await this.fileHelperService.saveV3Data(fileName, data);
  }

  async readData() {
    const fileName = 'testFile';
    const type = '';
    const result = await this.fileHelperService.getV3Data(fileName, type);
    if (result && result != '') {
      console.log('read from local fileName', fileName);
      console.log('read from local type', type);
      console.log('read from local result', result);
      console.log('read from local result length', result.length);
      return;
    }
  }

  async getSubscriptionChannel() {
    const list = await this.dataHelper.getSubscribedChannelV3List();
    console.log('list', list);
    list.forEach(element => {
      console.log('element = ', element);
    });



    const postList = await this.dataHelper.getPostV3List();
    console.log('postList', postList);
    postList.forEach(element => {
      console.log('postList element = ', element);
    });
  }
}
