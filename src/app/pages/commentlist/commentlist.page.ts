import { Component, OnInit, NgZone,ViewChild} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Events,ModalController,Platform} from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { MenuService } from 'src/app/services/MenuService';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from "@ngx-translate/core";
import { UtilService } from 'src/app/services/utilService';
import { IonInfiniteScroll,PopoverController} from '@ionic/angular';
import { EdittoolComponent } from '../../components/edittool/edittool.component';
import { AppService } from 'src/app/services/AppService';
import { LogUtils } from 'src/app/services/LogUtils';
import * as _ from 'lodash';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
let TAG: string = "Feeds-commentlist";

@Component({
  selector: 'app-commentlist',
  templateUrl: './commentlist.page.html',
  styleUrls: ['./commentlist.page.scss'],
})
export class CommentlistPage implements OnInit {

  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;
  public connectionStatus:number = 1;


  public nodeId:string = "";
  public channelId:number = 0;
  public postId:number = 0;
  public startIndex:number = 0;
  public pageNumber:number = 5;
  public totalData:any = [];

  public styleObj:any = {width:""};
  public dstyleObj:any = {width:""};

  public hideComment = true;

  public isOwnComment = {};

  public userNameList:any = {};

  public isPress:boolean = false;
  public isAndroid:boolean = true;
  public commentId:number = 0;
  public replayCommentList = [];
  public hideDeletedComments:boolean = false;
  public isFullContent = {};
  public maxTextSize = 240;
  public popover: any = null;
  public channelAvatar:string = "";
  public channelName:string ="";
  public commentsNum:number = 0;
  public captainComment:any ={};
  public avatar: string = "";
  public updatedAt:number = 0;
  public channelOwner:string ="";
  constructor(
    private platform: Platform,
    private popoverController:PopoverController,
    private acRoute: ActivatedRoute,
    private events: Events,
    private zone: NgZone,
    private native: NativeService,
    private feedService :FeedService,
    public theme:ThemeService,
    private translate:TranslateService,
    public menuService: MenuService,
    public appService:AppService,
    public modalController: ModalController,
    private logUtils: LogUtils) {
  }

  initData(isInit:boolean){

    if(isInit){
       this.initRefresh();
    }else{
       this.refreshCommentList();
    }
  }

  initRefresh(){
    this.startIndex = 0;
    this.totalData = this.sortCommentList();
    if(this.totalData.length-this.pageNumber > 0){
      this.replayCommentList = this.totalData.slice(0,this.pageNumber);

      this.startIndex++;
      this.infiniteScroll.disabled =false;
    }else{
      this.replayCommentList = this.totalData;
      this.infiniteScroll.disabled =true;
    }
    this.initOwnCommentObj();
  }



  initOwnCommentObj(){
    _.each(this.replayCommentList,(replayItem)=>{
        let key = replayItem['id'];
        this.userNameList[key] = replayItem["user_name"];
        this.checkCommentIsMine(replayItem);
      });
  }

  refreshCommentList(){
    this.totalData = this.sortCommentList();
    if (this.startIndex!=0&&this.totalData.length - this.pageNumber*this.startIndex > 0){
      this.replayCommentList = this.totalData.slice(0,(this.startIndex)*this.pageNumber);
      this.infiniteScroll.disabled =false;
     } else {
      this.replayCommentList =  this.totalData;
      this.infiniteScroll.disabled =true;
    }
    this.initOwnCommentObj();
  }

  sortCommentList(){
   let replayCommentList = this.feedService.getReplayCommentList(this.nodeId, this.channelId, this.postId,this.commentId) || [];
   this.commentsNum = replayCommentList.length;
   this.hideDeletedComments = this.feedService.getHideDeletedComments();
   if(!this.hideDeletedComments){
    replayCommentList = _.filter(replayCommentList ,(item:any)=> { return item.status != 1; });
   }
   return replayCommentList;
  }

  ngOnInit() {
    this.acRoute.queryParams.subscribe((data)=>{
      this.nodeId = data.nodeId;
      this.channelId = data.channelId;
      this.postId = data.postId;
      this.commentId = data.commentId;
      let feed = this.feedService.getChannelFromId(this.nodeId, this.channelId) || "";
      if(feed!=""){
        this.channelOwner = UtilService.moreNanme(feed["owner_name"],40);
      }
      this.userNameList[this.commentId] = data.username;
    });
  }

  ionViewWillEnter() {
    this.getCaptainComment();
    if(this.platform.is("ios")){
      this.isAndroid = false;
    }

    this.hideDeletedComments = this.feedService.getHideDeletedComments();
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
    this.styleObj.width = (screen.width - 55)+'px';
    this.dstyleObj.width= (screen.width - 105)+'px';
    this.initData(true);
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.feedService.refreshPostById(this.nodeId,this.channelId,this.postId);

    //if (this.connectionStatus == 0)
      //this.feedService.updateComment(this.nodeId, Number(this.channelId) ,Number(this.postId));
    this.events.subscribe(FeedsEvent.PublishType.connectionChanged,(status)=>{
      this.zone.run(() => {
        this.logUtils.logd("Received connectionChanged event, Connection change to "+ status,TAG);
        this.connectionStatus = status;
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.commentDataUpdate,()=>{
      this.zone.run(() => {
        this.logUtils.logd("Received commentDataUpdate event",TAG);
        this.startIndex = 0;
        this.initData(true);
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.getCommentFinish,(nodeId, channelId, postId)=>{
      this.zone.run(() => {
        this.logUtils.logd("Received getCommentFinish event, nodeId is "+ nodeId + " channelId is"+channelId+" postId is "+postId,TAG);
        if (nodeId == this.nodeId && channelId == this.channelId && postId == this.postId){
          this.startIndex = 0;
          this.initData(true);
        }
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.updateTitle,()=>{
      this.logUtils.logd("Received updateTitle event",TAG);
      if(this.menuService.postDetail!=null){
        this.menuService.hideActionSheet();
        this.menuMore();
      }
      this.initTitle();
    });


    this.events.subscribe(FeedsEvent.PublishType.editCommentFinish, () => {
      this.logUtils.logd("Received editCommentFinish event",TAG);
      this.initData(false);
    });

    this.events.subscribe(FeedsEvent.PublishType.deleteCommentFinish, () => {
      this.logUtils.logd("Received deleteCommentFinish event",TAG);
      this.getCaptainComment();
      this.native.hideLoading();
      this.initData(false);
    });

    this.events.subscribe(FeedsEvent.PublishType.rpcRequestError, () => {
      this.zone.run(() => {
        this.logUtils.logd("Received rpcRequest error event",TAG);
        this.native.hideLoading();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.rpcResponseError, () => {
      this.zone.run(() => {
        this.logUtils.logd("Received rpcResponse error event",TAG);
        this.native.hideLoading();
      });
    });

   this.events.subscribe(FeedsEvent.PublishType.rpcRequestSuccess, () => {
    this.zone.run(() => {
      this.logUtils.logd("Received rpcRequest success event",TAG);
      this.startIndex = 0;
      this.initRefresh();
      this.native.hideLoading();
      this.hideComment =true;
      this.native.toast_trans("CommentPage.tipMsg1");
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.openRightMenu,()=>{
      this.logUtils.logd("Received openRightMenu event",TAG);
     });
  }


  ionViewWillLeave(){//清楚订阅事件代码

    let value =  this.popoverController.getTop()["__zone_symbol__value"] || "";
    if(value!=""){
      this.popoverController.dismiss();
      this.popover = null;
    }

     this.events.unsubscribe(FeedsEvent.PublishType.editCommentFinish);

     this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
     this.events.unsubscribe(FeedsEvent.PublishType.commentDataUpdate);
     this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);

     this.events.unsubscribe(FeedsEvent.PublishType.deleteCommentFinish);


     this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestError);
     this.events.unsubscribe(FeedsEvent.PublishType.rpcResponseError);
     this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestSuccess);
     this.events.publish(FeedsEvent.PublishType.updateTab);
     this.events.publish(FeedsEvent.PublishType.addBinaryEvevnt);
     this.events.publish(FeedsEvent.PublishType.addProflieEvent);
     this.events.unsubscribe(FeedsEvent.PublishType.getCommentFinish);
  }


  ionViewDidLeave(){
    this.menuService.hideActionSheet();
    this.hideComment = true;
    this.isOwnComment = {};
  }

  ionViewDidEnter() {

  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("CommentlistPage.title"));
  }

  getContentText(): string{
     return this.captainComment.content;
  }

  getContentImg(content: any): string{
    return this.feedService.parsePostContentImg(content);
  }

  indexText(text: string,limit: number, indexLength: number):string{
    return this.feedService.indexText(text,limit,indexLength);
  }

  showComment(commentId:number) {
    let channel = this.feedService.getChannelFromId(this.nodeId, this.channelId) || "";
    this.channelName = channel["name"];
    this.channelAvatar = this.feedService.parseChannelAvatar(channel["avatar"]);
    this.commentId = commentId;
    if(this.checkServerStatus(this.nodeId) != 0){
      this.native.toastWarn('common.connectionError1');
      return;
    }

    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }
    this.hideComment = false;
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

    if(this.checkServerStatus(this.nodeId) != 0){
      this.native.toastWarn('common.connectionError1');
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

    if(this.checkServerStatus(this.nodeId) != 0){
      this.native.toastWarn('common.connectionError1');
      return;
    }

    if (this.checkLikedComment(commentId)){
      this.feedService.postUnlike(this.nodeId,Number(this.channelId),Number(this.postId),commentId);
      return ;
    }

    this.feedService.postLike(this.nodeId,Number(this.channelId),Number(this.postId),commentId);
  }

  handleUpdateDate(updatedTime:number){
    let updateDate = new Date(updatedTime*1000);
    return UtilService.dateFormat(updateDate,'yyyy-MM-dd HH:mm:ss')
  }

  doRefresh(event:any){
    let sId =  setTimeout(() => {
      this.getCaptainComment();
      this.initData(true);
      event.target.complete();
      clearTimeout(sId);
    },500);
  }

  loadData(event:any){
    let sId = setTimeout(() => {
      let arr = [];
      if(this.totalData.length - this.pageNumber*this.startIndex>0){
       arr = this.totalData.slice(this.startIndex*this.pageNumber,(this.startIndex+1)*this.pageNumber);
       this.startIndex++;
       this.zone.run(()=>{
       this.replayCommentList = this.replayCommentList.concat(arr);
       });
       this.initOwnCommentObj();
       event.target.complete();
      }else{
       arr = this.totalData.slice(this.startIndex*this.pageNumber,this.totalData.length);
       this.zone.run(()=>{
           this.replayCommentList = this.replayCommentList.concat(arr);
       });
       this.infiniteScroll.disabled =true;
       this.initOwnCommentObj();
       event.target.complete();
       clearTimeout(sId);
      }
    },500);
  }

  userName(userName:string){

    let name = userName || "";

    if(name!=""){
      this.native.createTip(name);
    }

  }

  async openEditTool(ev:any,comment:any) {
    this.popover = await this.popoverController.create({
      mode: 'ios',
      cssClass:'editToolPopup',
      component: EdittoolComponent,
      componentProps: { nodeId:comment.nodeId,
                        channelId:Number(comment.channel_id),
                        postId:Number(comment.post_id),
                        commentById:Number(comment.comment_id),
                        commentId:Number(comment.id),
                        content:comment.content,
                        editKey:"CommentlistPage.editreply",
                        deleteKey:"CommentlistPage.deletereply"
                      },
      event: ev,
      translucent: true
    });

    this.popover.onWillDismiss().then(()=>{
         if(this.popover!=null){
           this.popover = null;
         }
    })
    return await this.popover.present();
  }

  handleCommentStatus(){
    let status = "(edit)"
    return status;
  }

  checkChannelIsMine(){
    if (this.feedService.checkChannelIsMine(this.nodeId, this.channelId))
      return 0;

    return 1;
  }

  navTo(nodeId:string, channelId:number){
    this.native.navigateForward(['/channels', nodeId, channelId],"");
  }

  checkCommentIsMine(comment:any){
    let commentId = comment.id;
    let isOwnComment = this.feedService.checkCommentIsMine(comment.nodeId,Number(comment.channel_id),Number(comment.post_id),Number(comment.id));
    this.isOwnComment[commentId] = isOwnComment;
  }

  hideComponent(event) {
    this.hideComment = true;
  }

  getPostContentTextSize(content:string){
    let size = UtilService.getSize(content);
    return size;
  }

  handleCommentContent(text:string){
    return text.substring(0,180);
  }

  showFullContent(commentId:string){
     this.isFullContent[commentId] = true;
  }

  hideFullContent(commentId:string){
    this.isFullContent[commentId] = false;
  }

  pressContent(postContent:string){
    if(this.platform.is('ios')){
      this.isPress = true;
   }
    let text = this.feedService.parsePostContentText(postContent);
    this.native.copyClipboard(text).then(()=>{
      this.native.toast_trans("common.textcopied");
    }).catch(()=>{

    });
  }

  clickUrl(event:any){
    event = event || "";
    if(event!=""){
     let e = event||window.event; //兼容IE8
     let target = e.target||e.srcElement;  //判断目标事件
     if(target.tagName.toLowerCase()=="span"){
      if(this.isPress){
        this.isPress =false;
       return;
      }
      let url = target.textContent || target.innerText;
      this.native.clickUrl(url,event);
     }
    }
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
        return this.translate.instant('common.yesterday');
      }
      return obj.content +this.translate.instant('HomePage.daysAgo');
    }
    return  obj.content;
  }

  checkServerStatus(nodeId: string){
    return this.feedService.getServerStatusFromId(nodeId);
  }

  getCaptainComment(){
    let captainCommentList = this.feedService.getCaptainCommentList(this.nodeId, this.channelId, this.postId) || [];
    this.captainComment = _.find(captainCommentList,(item)=>{
        return item.id == this.commentId;
    });
    let id = this.captainComment.id;
    this.userNameList[id] = this.captainComment["user_name"]
    this.updatedAt = this.captainComment["updated_at"];
    this.checkCommentIsMine(this.captainComment);
  }

  menuMore(){
    this.menuService.showCommentDetailMenu(this.captainComment);
  }
}
