import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FeedService } from '../../../../services/FeedService';
import { NativeService } from '../../../../services/NativeService';

declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-channels',
  templateUrl: './channels.page.html',
  styleUrls: ['./channels.page.scss'],
})
export class ChannelsPage implements OnInit {
  private channelName;
  private channelOwner;
  private channelDesc;
  private channelSubscribes;
  private postList;

  private nodeId;
  private channelId;

  constructor(
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private feedService: FeedService
  ) {

    acRoute.params.subscribe((data)=>{
      this.nodeId = data.nodeId;
      this.channelId = data.channelId;

      let channel = this.feedService.getChannelFromId(this.nodeId, this.channelId);

      this.channelName = channel.name;
      this.channelOwner = channel.owner_name;
      this.channelDesc = channel.introduction;
      this.channelSubscribes = channel.subscribers;

      this.postList = this.feedService.getPostListFromChannel(this.nodeId, this.channelId);
      // this.posts = this.feedService.refreshLocalPost("",this.id);
    });

    
  }

  ngOnInit() {
    titleBarManager.setTitle("Feed");
    this.native.setTitleBarBackKeyShown(true);
  }

  like(nodeId, channelId, postId){
    this.feedService.postLike(nodeId,Number(channelId),Number(postId),null);
  }
 
  comment(){
    alert("comment")
  }


}
