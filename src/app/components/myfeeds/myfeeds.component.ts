import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FeedService } from '../../services/FeedService';
import { NativeService } from '../../services/NativeService';
import { ThemeService } from '../../services/theme.service';
import { UtilService } from '../../services/utilService';
import { PopupProvider } from '../../services/popup';
import { ViewHelper } from '../../services/viewhelper.service';
import { DataHelper } from 'src/app/services/DataHelper';
@Component({
  selector: 'app-myfeeds',
  templateUrl: './myfeeds.component.html',
  styleUrls: ['./myfeeds.component.scss'],
})
export class MyfeedsComponent implements OnInit {
  @Output() fromChild = new EventEmitter();
  @Input() channels: any = [];
  @Input() followers:any = 0;
  @Output() toFeedPage = new EventEmitter();
  @Output() subsciptions = new EventEmitter();
  @Output() chanelCollections = new EventEmitter();
  public popover: any = '';
  public avatarList:any = '';
  constructor(
    private dataHelper: DataHelper,
    public theme: ThemeService,
    private native: NativeService,
    private viewHelper: ViewHelper,
    public popupProvider: PopupProvider,
  ) {}

  ngOnInit() {
  }

  moreName(name: string) {
    return UtilService.moreNanme(name);
  }

  createNewFeed() { // 创建频道
    this.checkDid();
  }

  navTo(destDid: string, channelId: number) {
    this.toFeedPage.emit({
      destDid: destDid,
      channelId: channelId,
      page: '/channels',
    });
  }

  menuMore(destDid: string, channelId: number, channelName: string) {
    this.fromChild.emit({
      destDid: destDid,
      channelId: channelId,
      channelName: channelName,
      postId: 0,
      tabType: 'myfeeds',
    });
  }

  handleClientNumber(destDid: string) {
    return 0;
  }

  pressName(channelName: string) {
    let name = channelName || '';
    if (name != '' && name.length > 15) {
      this.viewHelper.createTip(name);
    }
  }

  checkDid() {
    this.dataHelper.setProfileIamge('assets/images/profile-1.svg');
    this.dataHelper.setSelsectIndex(1);

    this.native.navigateForward(['/createnewfeed'], '');
  }

  clickFollowing() {
    this.subsciptions.emit();
  }

  clickChanelCollections() {
    this.chanelCollections.emit();
  }
}
