import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FeedService } from '../../services/FeedService';
import { ThemeService } from '../../services/theme.service';
import { UtilService } from '../../services/utilService';
import { ViewHelper } from '../../services/viewhelper.service';

@Component({
  selector: 'app-following',
  templateUrl: './following.component.html',
  styleUrls: ['./following.component.scss'],
})
export class FollowingComponent implements OnInit {
  @Output() fromChild = new EventEmitter();
  @Input() followingList: any = [];
  @Output() toFollowPage = new EventEmitter();
  constructor(
    private feedService: FeedService,
    public theme: ThemeService,
    private viewHelper: ViewHelper,
  ) {}

  ngOnInit() {}

  moreName(name: string) {
    return UtilService.moreNanme(name);
  }

  navTo(destDid: string, channelId: string) {
    this.read(destDid, channelId);
    this.toFollowPage.emit({
      destDid:destDid,
      channelId: channelId,
      page: '/channels',
    });
  }

  checkUnreadNumber(destDid: string, channelId: string): number {
    // let nodeChannelId = this.feedService.getChannelId(destDid, channelId);
    // return this.feedService.getUnreadNumber(nodeChannelId);
    return 0;
  }

  read(destDid: string, channelId: string) {
    // let nodeChannelId = this.feedService.getChannelId(nodeId, channelId);
    // this.feedService.readChannel(nodeChannelId);
    return 0;
  }

  menuMore(channel: FeedsData.ChannelV3) {
    //let channelName = "";
    this.fromChild.emit({
      destDid: channel.destDid,
      channelId: channel.channelId,
      channelName: channel.name,
      postId: 0,
      tabType: 'myfollow',
    });
  }

  pressName(channelName: string) {
    let name = channelName || '';
    if (name != '' && name.length > 15) {
      this.viewHelper.createTip(name);
    }
  }
}
