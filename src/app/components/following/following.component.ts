import { Component, OnInit,Input} from '@angular/core';
import { FeedService } from '../../services/FeedService'
import { IonTabs } from '@ionic/angular';
import { FeedsPage } from 'src/app/pages/feeds/feeds.page'
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { MenuService } from 'src/app/services/MenuService';

@Component({
  selector: 'app-following',
  templateUrl: './following.component.html',
  styleUrls: ['./following.component.scss'],
})
export class FollowingComponent implements OnInit {
  @Input() followingList:any =[];
  @Input() nodeStatus:any = {};
  constructor(
    private feedspage: FeedsPage,
    private tabs: IonTabs,
    private feedService:FeedService,
    public theme:ThemeService,
    private native:NativeService,
    private menuService: MenuService) { 

  }

  ngOnInit() {
  
  }

  navTo(nodeId, channelId){
    this.read(nodeId, channelId);
    this.native.getNavCtrl().navigateForward(['/channels', nodeId, channelId]);

  }

  exploreFeeds(){
    this.tabs.select("search");
    this.feedspage.search();
  }

  parseAvatar(avatar: string): string{
    return this.feedService.parseChannelAvatar(avatar);
  }

  checkUnreadNumber(nodeId: string, channelId: number):number{
    let nodeChannelId = nodeId + channelId ;
    return this.feedService.getUnreadNumber(nodeChannelId);
  }

  read(nodeId: string, channelId: number){
    let nodeChannelId = nodeId + channelId ;
    this.feedService.readChannel(nodeChannelId);
  }

  menuMore(nodeId: string , channelId: number, channelName: string){
    this.menuService.showChannelMenu(nodeId, channelId, channelName);
  }
}
