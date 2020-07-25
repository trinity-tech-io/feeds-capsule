import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, Events, PopoverController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { CommentComponent } from '../../components/comment/comment.component'
@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
})
export class DetailPage implements OnInit {
  private connectStatus = 1;
  private name = "title"
  private ownerName = "ownerName"
  private content = "content"
  private comments = 0;
  private likes = 0;
  private nodeId: string;
  private created_at: number;
  private commentList: any;
  private channelId: number;
  private postId: number;
  constructor(
    private popoverController: PopoverController,
    private events: Events,
    private zone: NgZone,
    private navCtrl: NavController,
    private acRoute: ActivatedRoute,
    private feedService: FeedService) {
    this.connectStatus = this.feedService.getConnectionStatus();

    acRoute.params.subscribe((data)=>{
      this.nodeId = data.nodeId;
      this.channelId = data.channelId;
      this.postId = data.postId;

      let channel = this.feedService.getChannelFromId(this.nodeId, data.channelId);
      this.name = channel.name;
      this.ownerName = channel.owner_name;
      
      let post = this.feedService.getPostFromId(this.nodeId,data.channelId,data.postId);
      this.content = post.content;
      this.comments = post.comments;
      this.likes = post.likes;
      this.created_at = post.created_at;

      this.commentList = this.feedService.getCommentList(this.nodeId, this.channelId, this.postId);

      this.feedService.getComments(this.nodeId,this.channelId,this.postId,Communication.field.last_update, 0, 0, 10);

    });
    this.events.subscribe('feeds:connectionChanged', connectionStatus => {
      this.zone.run(() => {
          this.connectStatus = connectionStatus;
      });
    });

    this.events.subscribe('feeds:updataPostLike',(nodeId, channelId, postId, likes)=>{
      this.zone.run(() => {
        this.likes = likes;            
      });
    });

    this.events.subscribe('feeds:postDataUpdate',()=>{
      this.zone.run(() => {
        let post = this.feedService.getPostFromId(this.nodeId,this.channelId,this.postId);
        this.content = post.content;
        this.comments = post.comments;
        this.likes = post.likes;
        this.created_at = post.created_at;     
      });
    });

    this.events.subscribe('feeds:commentDataUpdate',()=>{
      this.zone.run(() => {
        this.commentList = this.feedService.getCommentList(this.nodeId, this.channelId, this.postId);        
      });
    });

  }

  ngOnInit() {
  }

  like(){
    this.feedService.postLike(this.nodeId,Number(this.channelId),Number(this.postId),0);
  }

  likeComment(commentId: number){
    this.feedService.postLike(this.nodeId,Number(this.channelId),Number(this.postId),commentId);
  }
  comment(){
  }

  async showCommentPage(event){
    const popover = await this.popoverController.create({
      component: CommentComponent,
      componentProps: {nodeId:this.nodeId,channelId:this.channelId,postId:this.postId},
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
