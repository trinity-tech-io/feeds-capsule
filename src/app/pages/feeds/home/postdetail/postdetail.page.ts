import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Events, PopoverController} from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { MenuService } from 'src/app/services/MenuService';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from "@ngx-translate/core";
import { UtilService } from 'src/app/services/utilService';
import { CommentComponent } from '../../../../components/comment/comment.component'

declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-postdetail',
  templateUrl: './postdetail.page.html',
  styleUrls: ['./postdetail.page.scss'],
})
export class PostdetailPage implements OnInit {
  private bigImageUrl: string;
  private bigImage: boolean = false;

  private channelAvatar = "";
  private channelName = "";
  private channelOwner = "";
  private postContent = "";
  private postTS = 0;
  private likesNum = 0;
  private commentsNum = 0;
  
  private commentList = null;
  private refreshCommFinish = false ;

  private nodeId;
  private channelId;
  private postId;

  constructor(
    private popoverController: PopoverController,
    private acRoute: ActivatedRoute,
    private events: Events,
    private zone: NgZone,
    private native: NativeService,
    private feedService :FeedService,
    public theme:ThemeService,
    private translate:TranslateService,
    private menuService: MenuService) {
      acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
        this.channelId = data.channelId;
        this.postId = data.postId;
        this.initData();
      });

      this.events.subscribe('feeds:refreshPage',()=>{
        this.zone.run(() => {
          this.initData();
        });
      });

      this.events.subscribe('feeds:commentDataUpdate',()=>{
        this.zone.run(() => {
          
          this.refreshCommFinish = true;
          this.commentList = this.feedService.getCommentList(this.nodeId, this.channelId, this.postId);
        });
      });
      
      this.events.subscribe('feeds:updataComment',(nodeId, channelId, postId, commentsNum)=>{
        this.zone.run(() => {
          if (this.nodeId == nodeId &&
            this.channelId == channelId &&
            this.postId == postId)
            this.commentsNum = commentsNum;
        });
      });
      
      this.events.subscribe('feeds:postDataUpdate',()=>{
        this.zone.run(() => {
          
          let post = this.feedService.getPostFromId(this.nodeId, this.channelId, this.postId);
          this.postContent = post.content;
          this.postTS = post.created_at;
          this.likesNum = post.likes;
          this.commentsNum = post.comments;  
        });
      });
  }

  initData(){
    let channel = this.feedService.getChannelFromId(this.nodeId, this.channelId);
    if (channel == null || channel == undefined)
      return ;
    this.channelName = channel.name;
    this.channelAvatar = this.feedService.parseChannelAvatar(channel.avatar);

    this.channelOwner = this.feedService.indexText(channel.owner_name,25,25);

    let post = this.feedService.getPostFromId(this.nodeId, this.channelId, this.postId);
    this.postContent = post.content;
    this.postTS = post.created_at;
    this.likesNum = post.likes;
    this.commentsNum = post.comments;

    this.commentList = this.feedService.getCommentList(this.nodeId, this.channelId, this.postId);
  }
  
  ngOnInit() {
   
  }

  ionViewWillEnter() {
    this.feedService.getComments(this.nodeId,Number(this.channelId) ,Number(this.postId),Communication.field.last_update, 0, 0, 0);

    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

  ionViewWillUnload(){
    this.hideBigImage();
    this.events.unsubscribe("feeds:updateTitle");
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("PostdetailPage.postdetail"));
  }

  getContentText(content: string): string{
    return this.feedService.parsePostContentText(content);
  }

  getContentImg(content: any): string{
    return this.feedService.parsePostContentImg(content);
  }

  indexText(text: string):string{
    return this.feedService.indexText(text,20,20);
  }

  async showCommentPage(nodeId,channelId,postId,event){
    const popover = await this.popoverController.create({
      component: CommentComponent,
      componentProps: {nodeId:nodeId, channelId:channelId, postId:postId},
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

  checkMyLike(){
    return this.feedService.checkMyLike(this.nodeId, Number(this.channelId), Number(this.postId));
  }

  checkLikedComment(commentId: number){
    return this.feedService.checkLikedComment(this.nodeId, Number(this.channelId), Number(this.postId), commentId);
  }

  like(){
    if (this.checkMyLike()){
      this.feedService.postUnlike(this.nodeId,Number(this.channelId),Number(this.postId),0);
      return ;
    }
    this.feedService.postLike(this.nodeId,Number(this.channelId),Number(this.postId),0);
  }

  likeComment(commentId: number){
    if (this.checkLikedComment(commentId)){
      this.feedService.postUnlike(this.nodeId,Number(this.channelId),Number(this.postId),commentId);
      return ;
    }
    this.feedService.postLike(this.nodeId,Number(this.channelId),Number(this.postId),commentId);
  }

  handleDisplayTime(createTime:number){
    let obj = UtilService.handleDisplayTime(createTime);
    if(obj.type === 's'){
      return this.translate.instant('common.just');
    }
    if(obj.type==='m'){
      return obj.content+this.translate.instant('HomePage.minutesAgo');
    }
    if(obj.type==='h'){
      return obj.content+this.translate.instant('HomePage.hoursAgo');
    }
    if(obj.type === 'yesterday'){
      return this.translate.instant('common.yesterday');
    }
    return  obj.content;
  }

  menuMore(){
    this.menuService.showChannelMenu(this.nodeId, this.channelId, this.channelName);
  }

  showBigImage(content: any){
    let contentObj = JSON.parse(content);
    if(contentObj.img!=""){
    this.bigImage = true;
    this.bigImageUrl =  this.getContentImg(content);
    }
  }

  hideBigImage(){
    this.bigImage = false;
  }

  commentComment(){
    alert("TODO");
  }
}
