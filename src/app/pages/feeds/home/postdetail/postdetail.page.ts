import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FeedService } from '../../../../services/FeedService';
import { NativeService } from '../../../../services/NativeService';

declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-postdetail',
  templateUrl: './postdetail.page.html',
  styleUrls: ['./postdetail.page.scss'],
})
export class PostdetailPage implements OnInit {
  private channelName;
  private channelOwner;
  private postContent;
  private postTS;
  private likesNum;
  private commentsNum;
  
  private commentList;

  private nodeId;
  private channelId;
  private postId;

  constructor(
    private acRoute: ActivatedRoute,
    private native: NativeService,
    private feedService :FeedService) {

      acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
        this.channelId = data.channelId;
        this.postId = data.postId;
  
        let channel = this.feedService.getChannelFromId(this.nodeId, this.channelId);
        this.channelName = channel.name;
        this.channelOwner = channel.owner_name;

        let post = this.feedService.getPostFromId(this.nodeId, this.channelId, this.postId);
        this.postContent = post.content;
        this.postTS = post.created_at;
        this.likesNum = post.likes;
        this.commentsNum = post.comments;

        this.commentList = this.feedService.getCommentList(this.nodeId, this.channelId, this.postId);
        
      });
  }

  ngOnInit() {
    titleBarManager.setTitle("Post");
    this.native.setTitleBarBackKeyShown(true);
  }

}
