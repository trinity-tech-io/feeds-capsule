import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events, PopoverController} from '@ionic/angular';
import { FeedService } from '../../services/FeedService';
import { Router } from '@angular/router'
import { CommentComponent } from '../../components/comment/comment.component'


@Component({
  selector: 'app-likes',
  templateUrl: './likes.component.html',
  styleUrls: ['./likes.component.scss'],
})
export class LikesComponent implements OnInit {
  private likeList;
  constructor(
    private popoverController: PopoverController,
    private feedService :FeedService,
    private zone: NgZone,
    private router: Router,
    private events: Events) {
    
    this.likeList = this.feedService.getLikeList();    
    this.events.subscribe('feeds:updateLikeList', (list) => {
      this.zone.run(() => {
        this.likeList = list;
      });
    });
    
  }

  ngOnInit() {}

  getChannel(nodeId, channelId):any{
    return this.feedService.getChannelFromId(nodeId,channelId);
  }

  like(nodeId, channelId, postId){
    this.feedService.postLike(nodeId,Number(channelId),Number(postId),0);
  }

  comment(){
    alert("TODO")
  }

  getChannelOwnerName(nodeId, channelId){
    let ownerName:string = this.getChannel(nodeId, channelId).owner_name
    return this.feedService.indexText(ownerName,25,25);
  }

  getContentText(content: string): string{
    return this.feedService.parsePostContentText(content);
  }

  getContentImg(content: any): string{
    return this.feedService.parsePostContentImg(content);
  }

  navTo(nodeId, channelId){
    this.router.navigate(['/feeds/tabs/home/channels', nodeId, channelId]);
  }

  navToPostDetail(nodeId, channelId, postId){
    this.router.navigate(['/feeds/tabs/home/postdetail',nodeId, channelId,postId]);
  }

  async showCommentPage(event, nodeId, channelId, postId){
    const popover = await this.popoverController.create({
      component: CommentComponent,
      componentProps: {nodeId: nodeId, channelId: channelId, postId: postId},
      event:event,
      translucent: true,
      cssClass: 'bottom-sheet-popover'
    });

    popover.onDidDismiss().then((result)=>{
      if(result.data == undefined){
        return;
      }
    });
    return await popover.present();
  }
}
