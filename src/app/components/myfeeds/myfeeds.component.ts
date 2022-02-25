import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FeedService } from '../../services/FeedService';
import { NativeService } from '../../services/NativeService';
import { ThemeService } from '../../services/theme.service';
import { UtilService } from '../../services/utilService';
import { PopupProvider } from '../../services/popup';
import { ViewHelper } from '../../services/viewhelper.service';
import { HiveService } from '../../services/HiveService'
import { from } from 'rxjs';
@Component({
  selector: 'app-myfeeds',
  templateUrl: './myfeeds.component.html',
  styleUrls: ['./myfeeds.component.scss'],
})
export class MyfeedsComponent implements OnInit {
  @Output() fromChild = new EventEmitter();
  @Input() channels: any = [];
  @Input() nodeStatus: any = {};
  @Input() followers:any = 0;
  @Output() toFeedPage = new EventEmitter();
  @Output() subsciptions = new EventEmitter();
  @Output() chanelCollections = new EventEmitter();
  public popover: any = '';
  constructor(
    private feedService: FeedService,
    public theme: ThemeService,
    private native: NativeService,
    private viewHelper: ViewHelper,
    public popupProvider: PopupProvider,
    private hiveService: HiveService
  ) {}

  ngOnInit() {
    console.log("MyfeedsComponent")
  }

  moreName(name: string) {
    return UtilService.moreNanme(name);
  }

  createNewFeed() { // 创建频道
    this.checkDid();
  }

  navTo(nodeId: string, channelId: number) {
    this.toFeedPage.emit({
      nodeId: nodeId,
      channelId: channelId,
      page: '/channels',
    });
  }

  parseAvatar(avatar: string): string {
    return this.feedService.parseChannelAvatar(avatar);
  }

  menuMore(nodeId: string, channelId: number, channelName: string) {
    this.fromChild.emit({
      nodeId: nodeId,
      channelId: channelId,
      channelName: channelName,
      postId: 0,
      tabType: 'myfeeds',
    });
  }

  handleClientNumber(nodeId) {
    console.log("nodeId ====== ", nodeId)
    return this.feedService.getServerStatisticsNumber(nodeId);
  }

  pressName(channelName: string) {
    let name = channelName || '';
    if (name != '' && name.length > 15) {
      this.viewHelper.createTip(name);
    }
  }

  checkDid() {
    this.feedService.setProfileIamge('assets/images/profile-1.svg');
    this.feedService.setSelsectIndex(1);
    // if (this.feedService.getConnectionStatus() != 0) {
    //   this.native.toastWarn('common.connectionError');
    //   return;
    // }

    // let bindServer = this.feedç√Service.getBindingServer();

    // if (bindServer != null && bindServer != undefined) {
    //   if (this.feedService.getConnectionStatus() != 0) {
    //     this.native.toastWarn('common.connectionError');
    //     return;
    //   }

    //   if (
    //     !this.feedService.checkBindingServerVersion(() => {
    //       this.feedService.hideAlertPopover();
    //     })
    //   )
    //     return;

    // console.log("点击了创建feeds 按钮 ====== ")
      this.native.navigateForward(['/createnewfeed'], '');
    // } else {
      // this.native.navigateForward(['bindservice/learnpublisheraccount'], '');
    // }
  }

  clickFollowing() {
    this.subsciptions.emit();
  }

  clickChanelCollections() {
    this.chanelCollections.emit();
  }
}
