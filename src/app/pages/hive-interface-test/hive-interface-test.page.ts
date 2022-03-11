import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { FeedService } from 'src/app/services/FeedService';
import { DataHelper } from 'src/app/services/DataHelper';
import { Logger, LogLevel } from 'src/app/services/logger';
import { HiveVaultApi } from 'src/app/services/api_hivevault.service';

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

  //
  registeScripting() {
    this.hiveVaultApi.registeScripting();
  }

  // channel
  createChannel() {
    // this.hiveVaultApi.createChannel();
    alert('createChannel');
  }

  getChannelInfo() {
    alert('getChannelInfo');
  }

  // post
  getPost() {
    alert('getPost');
  }

  createPost() {
    alert('createPost');
  }

  deletePost() {
    alert('deletePost');
  }

  updatePost() {
    alert('updatePost');
  }

  //subscription
  getSubscriptionInfo() {
    // this.hiveVaultApi.getSubscriptionByChannelId();
    alert('getSubscriptionInfo');
  }

  getSubscriptionByUser() {
    alert('getSubscriptionByUser');
  }

  subscribe() {
    alert('subscribe');
  }

  unSubscribe() {
    alert('unSubscribe');
  }

  //comment
  addComment() {
    // this.hiveVaultApi.createComment();
    alert('addComment');
  }

  updateComment() {
    // this.hiveVaultApi.updateComment();
    alert('updateComment');
  }

  getComments() {
    // this.hiveVaultApi.getComment();
    alert('getComments');
  }

  deleteComment() {
    // this.hiveVaultApi.deleteComment();
    alert('deleteComment');
  }

  //like
  getLikes() {
    // this.hiveVaultApi.findLikeById();
    alert('getLikes');
  }

  addLike() {
    // this.hiveVaultApi.addLike();
    alert('addLike');
  }

  removeLike() {
    // this.hiveVaultApi.removeLike();
    alert('removeLike');
  }
}
