import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Events} from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { MenuService } from 'src/app/services/MenuService';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from "@ngx-translate/core";
import { UtilService } from 'src/app/services/utilService';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-postdetail',
  templateUrl: './postdetail.page.html',
  styleUrls: ['./postdetail.page.scss'],
})
export class PostdetailPage implements OnInit {
  private connectionStatus = 1;
  public nodeStatus:any ={};
  private bigImageUrl: string;
  private bigImage: boolean = false;
  private avatar: string = "";

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

  private myInterval;
  constructor(
    private acRoute: ActivatedRoute,
    private events: Events,
    private zone: NgZone,
    private native: NativeService,
    private feedService :FeedService,
    public theme:ThemeService,
    private translate:TranslateService,
    private menuService: MenuService) {
   
  }

  initData(){
    this.initnodeStatus();
    let channel = this.feedService.getChannelFromId(this.nodeId, this.channelId) || "";
    if (channel == "")
      return ;
    this.channelName = UtilService.moreNanme(channel["name"]);
    this.channelAvatar = this.feedService.parseChannelAvatar(channel["avatar"]);

    this.channelOwner = UtilService.moreNanme(channel["owner_name"]);

    let post = this.feedService.getPostFromId(this.nodeId, this.channelId, this.postId);
    this.postContent = post.content;
    this.postTS = post.created_at;
    this.likesNum = post.likes;
    this.commentsNum = post.comments;

    this.commentList = this.feedService.getCommentList(this.nodeId, this.channelId, this.postId);
  }
  
  ngOnInit() {
    this.acRoute.params.subscribe((data)=>{
      this.nodeId = data.nodeId;
      this.channelId = data.channelId;
      this.postId = data.postId;
      this.initData();
    });

    this.myInterval = setInterval(() => {
      let status: number = this.feedService.getServerStatusFromId(this.nodeId);
      if (status == 1)
        this.refreshCommFinish = true;

      if (this.refreshCommFinish){
        clearInterval(this.myInterval);
      }        
    }, 1000);
  }

  ionViewWillEnter() {
    this.connectionStatus = this.feedService.getConnectionStatus();
    
    if (this.connectionStatus == 0)
      this.feedService.getComments(this.nodeId,Number(this.channelId) ,Number(this.postId),Communication.field.last_update, 0, 0, 0, false);

    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
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

    this.events.subscribe("feeds:friendConnectionChanged", (nodeId, status)=>{
      this.zone.run(()=>{
        this.nodeStatus[nodeId] = status;
      });
    });
    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });
  
    this.events.subscribe("feeds:unsubscribeFinish",()=>{
      this.zone.run(()=>{
        this.native.navigateForward(['/tabs/home'],{
          replaceUrl: true
        });
      });
    });
  }


  ionViewWillLeave(){//清楚订阅事件代码
    this.hideBigImage();
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:refreshPage");
    this.events.unsubscribe("feeds:commentDataUpdate");
    this.events.unsubscribe("feeds:updataComment");
    this.events.unsubscribe("feeds:postDataUpdate");
    this.events.unsubscribe("feeds:friendConnectionChanged");
    this.events.unsubscribe("feeds:updateTitle");
    this.events.unsubscribe("feeds:unsubscribeFinish");
  }

  ionViewDidEnter() {
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
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

  showCommentPage(nodeId,channelId,postId){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.native.navigateForward(["comment",nodeId,channelId,postId],"");
  }

  checkMyLike(){
    return this.feedService.checkMyLike(this.nodeId, Number(this.channelId), Number(this.postId));
  }

  checkLikedComment(commentId: number){
    return this.feedService.checkLikedComment(this.nodeId, Number(this.channelId), Number(this.postId), commentId);
  }

  like(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (this.checkMyLike()){
      this.feedService.postUnlike(this.nodeId,Number(this.channelId),Number(this.postId),0);
      return ;
    }

    this.feedService.postLike(this.nodeId,Number(this.channelId),Number(this.postId),0);
  }

  likeComment(commentId: number){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

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
    this.menuService.showChannelMenu(this.nodeId, Number(this.channelId), this.channelName);
  }

  showBigImage(content: any){
    this.native.openViewer(this.getContentImg(this.postContent));
  }

  hideBigImage(){
    this.bigImage = false;
  }

  commentComment(){
    alert("TODO");
  }

  checkServerStatus(nodeId: string){
    return this.feedService.getServerStatusFromId(nodeId);
  }

  initnodeStatus(){
     let status = this.checkServerStatus(this.nodeId);
     this.nodeStatus[this.nodeId] = status;
  }
}
