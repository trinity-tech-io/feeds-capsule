import { Component, OnInit ,Input,Output,EventEmitter} from '@angular/core';
import { FeedService } from '../../services/FeedService'
import { IonTabs } from '@ionic/angular';
import { FeedsPage } from 'src/app/pages/feeds/feeds.page'
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { UtilService } from 'src/app/services/utilService';


@Component({
  selector: 'app-following',
  templateUrl: './following.component.html',
  styleUrls: ['./following.component.scss'],
})
export class FollowingComponent implements OnInit {
  @Output() fromChild=new EventEmitter();
  @Input() followingList:any =[];
  @Input() nodeStatus:any = {};
  constructor(
    private feedspage: FeedsPage,
    private tabs: IonTabs,
    private feedService:FeedService,
    public theme:ThemeService,
    private native:NativeService) { 

  }

  ngOnInit() {
  
  }

  moreName(name:string){
    return UtilService.moreNanme(name);
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
    this.fromChild.emit({"nodeId":nodeId,"channelId":channelId,"channelName":channelName,"postId":0,"tabType":"myfollow"});
  }

  pressName(channelName:string){
    let name =channelName || "";
    if(name != "" && name.length>15){
      this.native.createTip(name);
    }
  }
}
