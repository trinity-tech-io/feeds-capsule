import { Component, OnInit, NgZone,ViewChild} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Events} from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { MenuService } from 'src/app/services/MenuService';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from "@ngx-translate/core";
import { UtilService } from 'src/app/services/utilService';
import { IonInfiniteScroll} from '@ionic/angular';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-postdetail',
  templateUrl: './postdetail.page.html',
  styleUrls: ['./postdetail.page.scss'],
})
export class PostdetailPage implements OnInit {
  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;
  public images:any = {};
  public connectionStatus:number = 1;
  public nodeStatus:any ={};
  public avatar: string = "";

  public channelAvatar:string = "";
  public channelName:string = "";
  public channelWName:string ="";
  public channelOwner:string = "";
  public postContent:string = "";
  public postTS:number = 0;
  public likesNum:number = 0;
  public commentsNum:number = 0;
  
  public commentList:any = [];

  public nodeId:string = "";
  public channelId:number = 0;
  public postId:number = 0;
  public objStyle:any={"width":""};
  public startIndex:number = 0;
  public pageNumber:number = 5;
  public totalData:any = [];

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
    this.channelWName = channel["name"] || "";
    this.channelName = UtilService.moreNanme(channel["name"]);
    this.channelAvatar = this.feedService.parseChannelAvatar(channel["avatar"]);

    this.channelOwner = UtilService.moreNanme(channel["owner_name"]);

    let post = this.feedService.getPostFromId(this.nodeId, this.channelId, this.postId);
    this.postContent = post.content;
    this.postTS = post.created_at;
    this.likesNum = post.likes;
    this.commentsNum = post.comments;
    this.initRefresh();
    //this.scrollToTop(1);
  }

  initRefresh(){
    this.totalData = this.feedService.getCommentList(this.nodeId, this.channelId, this.postId) || [];
    if(this.totalData.length-this.pageNumber > this.pageNumber){
      this.commentList = this.totalData.slice(this.startIndex,this.pageNumber);
      this.startIndex++;
      this.infiniteScroll.disabled =false;
    }else{
      this.commentList = this.totalData.slice(0,this.totalData.length);
      this.infiniteScroll.disabled =true;
    }
  }
  
  ngOnInit() {
    this.objStyle["width"] = (screen.width - 157)+"px"; 
    this.acRoute.params.subscribe((data)=>{
      this.nodeId = data.nodeId;
      this.channelId = data.channelId;
      this.postId = data.postId;
     
    });
  }

  ionViewWillEnter() {
    this.initData();
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.feedService.refreshPostById(this.nodeId,this.channelId,this.postId);

    if (this.connectionStatus == 0)
      this.feedService.getComments(this.nodeId,Number(this.channelId) ,Number(this.postId),Communication.field.last_update, 0, 0, 0, false);

    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });
  

    this.events.subscribe('feeds:commentDataUpdate',()=>{
      this.zone.run(() => {
        this.startIndex = 0;
        this.initData();
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
  
    this.events.subscribe("feeds:refreshPostDetail", ()=>{
      this.zone.run(() => {
        let post = this.feedService.getPostFromId(this.nodeId, this.channelId, this.postId);
        this.postContent = post.content;
        this.postTS = post.created_at;
        this.likesNum = post.likes;
        this.commentsNum = post.comments;  
      });
    });
  }


  ionViewWillLeave(){//清楚订阅事件代码
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:commentDataUpdate");
    this.events.unsubscribe("feeds:friendConnectionChanged");
    this.events.unsubscribe("feeds:updateTitle");
    this.events.unsubscribe("feeds:refreshPostDetail");
  }

  ionViewDidEnter() {
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

 
  initTitle(){
    titleBarManager.setTitle(this.translate.instant("PostdetailPage.postview"));
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
      if(obj.content === 1){
        return obj.content+this.translate.instant('HomePage.oneminuteAgo');
      }
      return obj.content+this.translate.instant('HomePage.minutesAgo');
    }
    if(obj.type==='h'){
      if(obj.content === 1){
        return obj.content+this.translate.instant('HomePage.onehourAgo');
      }
      return obj.content+this.translate.instant('HomePage.hoursAgo');
    }
    if(obj.type === 'day'){
      if(obj.content === 1){
        return obj.content +this.translate.instant('HomePage.onedayAgo');
      }
      if(obj.content === 2){
        return this.translate.instant('common.yesterday');
      }
      return obj.content +this.translate.instant('HomePage.daysAgo');
    }
    return  obj.content;
  }

  menuMore(){
    this.menuService.showShareMenu(this.nodeId, Number(this.channelId), this.channelName);
  }

  showBigImage(content: any){
    this.native.openViewer(this.getImage());
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

  getImage(){
    let nodeChannelPostId = this.nodeId+this.channelId+this.postId;
    let img = this.images[nodeChannelPostId] || "";
    if (img == ""){
      this.images[nodeChannelPostId] = "undefine";
      this.feedService.loadPostContentImg(nodeChannelPostId).then((image)=>{
        this.images[nodeChannelPostId] = image||"none";
      }).catch(()=>{
        console.log("getImageError");
      })
    }
    return this.images[nodeChannelPostId];
  }

  doRefresh(event:any){
    let sId =  setTimeout(() => {
      this.images = {};
      this.startIndex = 0;
      this.initData();
      event.target.complete();
      clearTimeout(sId);
    },500);
  }

  loadData(event:any){
    let sId = setTimeout(() => {
      let arr = [];        
      if(this.totalData.length - this.pageNumber*this.startIndex>this.pageNumber){
       arr = this.totalData.slice(this.startIndex*this.pageNumber,(this.startIndex+1)*this.pageNumber);
       this.startIndex++;
       this.zone.run(()=>{
       this.commentList = this.commentList.concat(arr);
       });
       this.initnodeStatus();
       event.target.complete();
      }else{
       arr = this.totalData.slice(this.startIndex*this.pageNumber,this.totalData.length);
       this.zone.run(()=>{
           this.commentList = this.commentList.concat(arr);
       });
       this.infiniteScroll.disabled =true;
       this.initnodeStatus();
       event.target.complete();
       clearTimeout(sId);
      }
    },500);

  
  }

  pressName(){
    if(this.channelWName!= "" && this.channelWName.length>15){
      this.native.createTip(this.channelWName);
    }
  }
}
