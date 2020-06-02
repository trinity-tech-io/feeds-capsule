import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { FeedService } from '../../../../services/FeedService';
import { NativeService } from '../../../../services/NativeService';
import { Router } from '@angular/router'
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
    private router: Router,
    private zone: NgZone,
    private events: Events,
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private feedService: FeedService
  ) {

    acRoute.params.subscribe((data)=>{
      this.nodeId = data.nodeId;
      this.channelId = data.channelId;

      let channel = this.feedService.getChannelFromId(this.nodeId, this.channelId);

      this.channelName = channel.name;
      // this.channelOwner = channel.owner_name;
      this.channelOwner = this.feedService.indexText(channel.owner_name,25,25);
      this.channelDesc = channel.introduction;
      this.channelSubscribes = channel.subscribers;

      this.postList = this.feedService.getPostListFromChannel(this.nodeId, this.channelId);
      // this.posts = this.feedService.refreshLocalPost("",this.id);
    });

    this.events.subscribe('feeds:postDataUpdate',()=>{
      this.zone.run(() => {
        
        
        this.postList = this.feedService.getPostList();;
      });
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

  getChannel(nodeId, channelId):any{
    return this.feedService.getChannelFromId(nodeId,channelId);
  }

  getContentText(content: string): string{
    return this.feedService.parsePostContentText(content);
  }

  getContentImg(content: any): string{
    return this.feedService.parsePostContentImg(content);
  }

  getChannelOwnerName(nodeId, channelId){
    let ownerName:string = this.getChannel(nodeId, channelId).owner_name
    
    // if (ownerName.length >25){
    //   console.log("1111111111")
    //   return ownerName.slice(0,15)+"..."+ownerName.slice(ownerName.length-10,ownerName.length);
    // }
    //   console.log("222222222")
    // return ownerName;

    return this.feedService.indexText(ownerName,25,25);

  }

  navTo(nodeId, channelId){
    this.router.navigate(['/feeds/tabs/home/channels', nodeId, channelId]);
  }

  navToPostDetail(nodeId, channelId, postId){
    this.router.navigate(['/feeds/tabs/home/postdetail',nodeId, channelId,postId]);
  }
}
