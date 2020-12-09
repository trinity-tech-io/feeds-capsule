import { Component, OnInit, NgZone,ViewChild} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Events,ModalController} from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { MenuService } from 'src/app/services/MenuService';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from "@ngx-translate/core";
import { UtilService } from 'src/app/services/utilService';
import { IonInfiniteScroll,PopoverController} from '@ionic/angular';
import { EdittoolComponent } from '../../../../components/edittool/edittool.component';
import { AppService } from 'src/app/services/AppService';
import { LogUtils } from 'src/app/services/LogUtils';
import * as _ from 'lodash';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
let TAG: string = "Feeds-postview";
@Component({
  selector: 'app-postdetail',
  templateUrl: './postdetail.page.html',
  styleUrls: ['./postdetail.page.scss'],
})
export class PostdetailPage implements OnInit {
  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;
  public postImage:string = "assets/images/loading.gif";
  public connectionStatus:number = 1;
  public nodeStatus:any ={};
  public avatar: string = "";

  public channelAvatar:string = "";
  public channelName:string = "";
  public channelWName:string ="";
  public channelOwner:string = "";
  public channelWOwner:string = "";
  public postContent:string = "";
  public postTS:number = 0;
  public likesNum:number = 0;
  public commentsNum:number = 0;

  public commentList:any = [];

  public nodeId:string = "";
  public channelId:number = 0;
  public postId:number = 0;
  public startIndex:number = 0;
  public pageNumber:number = 5;
  public totalData:any = [];

  public popover: any;

  public postStatus = 0;
  public styleObj:any = {width:""};
  public dstyleObj:any = {width:""};

  public hideComment = true;

  public videoPoster:string ="";
  public posterImg:string ="";
  public videoObj:string ="";
  public videoisShow:boolean = false;


  public cacheGetBinaryRequestKey = "";
  public cachedMediaType = "";

  public downProgress:number = 0;

  public downStatus:string = "";

  public mediaType:any;

  public fullScreenmodal:any="";

  public hideDeletedComments:boolean = false;

  public maxTextSize = 240;

  public isFullContent = {};

  public isOwnComment = {};

  constructor(
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
    let channel = this.feedService.getChannelFromId(this.nodeId, this.channelId) || "";

    this.channelWName = channel["name"] || "";
    this.channelName = UtilService.moreNanme(channel["name"]);
    this.channelAvatar = this.feedService.parseChannelAvatar(channel["avatar"]);
    this.channelWOwner = channel["owner_name"] || "";
    this.channelOwner = UtilService.moreNanme(channel["owner_name"],40);

    this.initPostContent();
    this.initnodeStatus();
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
      this.commentList = this.totalData.slice(0,this.pageNumber);
      this.startIndex++;
      this.infiniteScroll.disabled =false;
    }else{
      this.commentList = this.totalData;
      this.infiniteScroll.disabled =true;
    }
    this.initOwnCommentObj();
  }

  initOwnCommentObj(){
    let len = this.commentList.length;
    for(let index = 0;index<len;index++){
        let comment = this.commentList[index];
        this.checkCommentIsMine(comment);
    }
  }

  refreshCommentList(){
    this.totalData = this.sortCommentList();
    if (this.totalData.length - this.pageNumber*this.startIndex > 0){
      this.commentList = this.totalData.slice(0,(this.startIndex)*this.pageNumber);
      this.infiniteScroll.disabled =false;
     } else {
      this.commentList =  this.totalData;
      this.infiniteScroll.disabled =true;
    }
    this.initOwnCommentObj();
  }

  sortCommentList(){
   let commentList = this.feedService.getCommentList(this.nodeId, this.channelId, this.postId) || [];
   this.hideDeletedComments = this.feedService.getHideDeletedComments();
   if(!this.hideDeletedComments){
      commentList = _.filter(commentList ,(item:any)=> { return item.status != 1; });
   }
   return commentList;
  }

  ngOnInit() {
    this.acRoute.params.subscribe((data)=>{
      this.nodeId = data.nodeId;
      this.channelId = data.channelId;
      this.postId = data.postId;
    });
  }

  initPostContent(){
    let post = this.feedService.getPostFromId(this.nodeId, this.channelId, this.postId);

    this.postStatus = post.post_status || 0;
    this.mediaType = post.content.mediaType;
    this.postContent = post.content;
    this.postTS = post.created_at;
    this.likesNum = post.likes;
    this.commentsNum = post.comments;

    if(this.mediaType === 1){
      this.getImage();
    }
    if(post.content.mediaType === 2){
      let key = this.feedService.getVideoThumbStrFromId(this.nodeId,this.channelId,this.postId,0) || "";
      if(key!=""){
        this.getVideoPoster(key);
      }
    }
  }

  ionViewWillEnter() {
    this.hideDeletedComments = this.feedService.getHideDeletedComments();
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
    this.styleObj.width = (screen.width - 55)+'px';
    this.dstyleObj.width= (screen.width - 105)+'px';
    this.initData(true);
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.feedService.refreshPostById(this.nodeId,this.channelId,this.postId);

    if (this.connectionStatus == 0)
      this.feedService.updateComment(this.nodeId, Number(this.channelId) ,Number(this.postId));

    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.logUtils.logd("feeds:connectionChanged",TAG);
        this.connectionStatus = status;
      });
    });


    this.events.subscribe('feeds:commentDataUpdate',()=>{
      this.zone.run(() => {
        this.logUtils.logd("feeds:commentDataUpdate",TAG);
        this.startIndex = 0;
        this.initData(true);
      });
    });

    this.events.subscribe('feeds:getCommentFinish',(nodeId, channelId, postId)=>{
      this.logUtils.logd("feeds:getCommentFinish",TAG);
      this.zone.run(() => {
        if (nodeId == this.nodeId && channelId == this.channelId && postId == this.postId){
          this.startIndex = 0;
          this.initData(true);
          titleBarManager.hideActivityIndicator(TitleBarPlugin.TitleBarActivityType.OTHER);
        }
      });
    });

    this.events.subscribe("feeds:friendConnectionChanged", (nodeId, status)=>{
      this.zone.run(()=>{
        this.logUtils.logd("feeds:friendConnectionChanged",TAG);
        this.nodeStatus[nodeId] = status;
      });
    });

    this.events.subscribe("feeds:updateTitle",()=>{
      this.logUtils.logd("feeds:updateTitle",TAG);
      if(this.menuService.postDetail!=null){
        this.menuService.hideActionSheet();
        this.menuMore();
      }
      this.initTitle();
    });

    this.events.subscribe("feeds:refreshPostDetail", ()=>{
      this.zone.run(() => {
        this.logUtils.logd("feeds:refreshPostDetail",TAG);
        let post = this.feedService.getPostFromId(this.nodeId, this.channelId, this.postId);
        this.postContent = post.content;
        this.postTS = post.created_at;
        this.likesNum = post.likes;
        this.commentsNum = post.comments;
      });
    });

    this.events.subscribe('feeds:editPostFinish', () => {
      this.logUtils.logd("feeds:editPostFinish",TAG);
      this.initData(true);
    });

    this.events.subscribe('feeds:deletePostFinish', () => {
      this.logUtils.logd("feeds:deletePostFinish",TAG);
      this.events.publish("update:tab");
      this.native.hideLoading();
      this.initData(true);
    });

    this.events.subscribe('feeds:editCommentFinish', () => {
      this.logUtils.logd("feeds:editCommentFinish",TAG);
      this.initData(false);
    });

    this.events.subscribe('feeds:deleteCommentFinish', () => {
      this.logUtils.logd("feeds:deleteCommentFinish",TAG);
      this.native.hideLoading();
      this.initData(false);
    });

    this.events.subscribe('rpcRequest:error', () => {
      this.zone.run(() => {
        this.logUtils.logd("rpcRequest:error",TAG);
        //this.pauseVideo();
        this.native.hideLoading();
      });
    });

    this.events.subscribe('rpcResponse:error', () => {
      this.zone.run(() => {
        this.logUtils.logd("rpcResponse:error",TAG);
        //this.pauseVideo();
        this.native.hideLoading();
      });
    });

   this.events.subscribe('rpcRequest:success', () => {
    this.zone.run(() => {
      this.logUtils.logd("rpcRequest:success",TAG);
      this.startIndex = 0;
      this.initRefresh();
      this.native.hideLoading();
      this.hideComment =true;
      this.native.toast_trans("CommentPage.tipMsg1");
      });
    });

    this.events.subscribe('stream:getBinaryResponse', () => {
      this.zone.run(() => {
        this.logUtils.logd("stream:getBinaryResponse",TAG);

      });
    });

    this.events.subscribe('feeds:getBinaryFinish', (nodeId, key: string, value, mediaType) => {
      this.zone.run(() => {
        this.logUtils.logd("feeds:getBinaryFinish",TAG);
        this.downProgress = 0;
        this.downStatus = "";
        this.native.hideLoading();
        this.processGetBinaryResult(key, value);
      });
    });

    this.events.subscribe('stream:getBinarySuccess', (nodeId, key: string, value) => {
      this.zone.run(() => {
        this.logUtils.logd("stream:getBinarySuccess",TAG);
        this.native.hideLoading();
        this.downStatus = "";
        this.downProgress = 0;
        this.feedService.closeSession(nodeId);
        this.processGetBinaryResult(key, value);
      });
    });

    this.events.subscribe('stream:error', (nodeId, error) => {
      this.zone.run(() => {
        this.logUtils.logd("stream:error",TAG);
        this.feedService.handleSessionError(nodeId, error);
        this.pauseVideo();
        this.native.hideLoading();
        this.downProgress = 0;
        this.downStatus = "";
      });
    });

    this.events.subscribe('stream:onStateChangedCallback', (nodeId, state) => {
      this.zone.run(() => {
        this.logUtils.logd("stream:onStateChangedCallback",TAG);
        if (this.cacheGetBinaryRequestKey == "")
          return;

        if (state === FeedsData.StreamState.CONNECTED){
          this.downStatus = '2';
          this.feedService.getBinary(this.nodeId, this.cacheGetBinaryRequestKey, this.cachedMediaType);
          if(this.cachedMediaType === 'img'&&this.downStatus!=""){
            this.native.updateLoadingMsg(this.translate.instant("common.downloading"));
          }
        }
      });
    });

    this.events.subscribe('stream:progress',(nodeId,progress)=>{
        this.zone.run(() => {
          this.logUtils.logd("stream:progress",TAG);
          this.downProgress = progress;
          if(this.cachedMediaType === 'img'&&this.downStatus!=""){
            this.native.updateLoadingMsg(this.translate.instant("common.downloading")+" "+progress+"%");
          }
        });
    })

    this.events.subscribe('feeds:openRightMenu',()=>{
      this.logUtils.logd("feeds:openRightMenu",TAG);
      this.downStatus ="";
      this.downProgress = 0;
      this.feedService.closeSession(this.nodeId);
      this.native.hideLoading();
      this.pauseVideo();
      this.hideFullScreen();
     });

     this.events.subscribe('stream:closed',(nodeId)=>{
      this.logUtils.logd("stream:closed",TAG);
      let mNodeId = nodeId || "";
      if (mNodeId != ""){
        this.feedService.closeSession(mNodeId);
      }
      this.downStatus ="";
      this.downProgress = 0;
      this.native.hideLoading();
      this.pauseVideo();
      this.hideFullScreen();
    });

    titleBarManager.showActivityIndicator(TitleBarPlugin.TitleBarActivityType.OTHER, "Loading latest comments");
  }


  ionViewWillLeave(){//清楚订阅事件代码
     this.events.unsubscribe("feeds:editCommentFinish");
     this.events.unsubscribe("feeds:editPostFinish");

     this.events.unsubscribe("feeds:connectionChanged");
     this.events.unsubscribe("feeds:commentDataUpdate");
     this.events.unsubscribe("feeds:friendConnectionChanged");
     this.events.unsubscribe("feeds:updateTitle");
     this.events.unsubscribe("feeds:refreshPostDetail");


     this.events.unsubscribe("feeds:deletePostFinish");
     this.events.unsubscribe("feeds:deleteCommentFinish");

     this.events.unsubscribe("feeds:getBinaryFinish");

     this.events.unsubscribe("rpcRequest:error");
     this.events.unsubscribe("rpcResponse:error");
     this.events.unsubscribe("rpcRequest:success");

     this.events.unsubscribe("stream:getBinaryResponse");
     this.events.unsubscribe("stream:getBinarySuccess");
     this.events.unsubscribe("stream:error");
     this.events.unsubscribe("stream:onStateChangedCallback");
     this.events.unsubscribe("stream:progress");
     this.events.unsubscribe("feeds:openRightMenu");
     this.events.unsubscribe("stream:closed");
     this.events.publish("update:tab");
     this.events.publish("addBinaryEvevnt");
     this.events.unsubscribe("feeds:getCommentFinish");

     titleBarManager.hideActivityIndicator(TitleBarPlugin.TitleBarActivityType.OTHER);
  }


  ionViewDidLeave(){
    this.menuService.hideActionSheet();
    if(this.popover!=null){
      this.popover.dismiss();
    }

    this.hideComment = true;
    this.postImage = "";
    this.isFullContent = {};
    this.isOwnComment = {};
    this.downProgress = 0;
    this.feedService.closeSession(this.nodeId);
    this.clearVideo();
    this.native.hideLoading();
    this.hideFullScreen();
  }

  ionViewDidEnter() {

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

  showComment() {
    this.pauseVideo();
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
        return this.translate.instant('common.yesterday');
      }
      return obj.content +this.translate.instant('HomePage.daysAgo');
    }
    return  obj.content;
  }

  menuMore(){
    let isMine = this.checkChannelIsMine();
    this.pauseVideo();
    if(isMine === 0 && this.postStatus != 1){
      this.menuService.showPostDetailMenu(this.nodeId, Number(this.channelId), this.channelName,this.postId);
    }else{
      this.menuService.showShareMenu(this.nodeId, Number(this.channelId), this.channelName,this.postId);
    }
  }

  showBigImage(){
    this.zone.run(()=>{
      this.native.showLoading("common.waitMoment", 5*60*1000).then(()=>{
        let contentVersion = this.feedService.getContentVersion(this.nodeId,this.channelId,this.postId,0);
        let thumbkey= this.feedService.getImgThumbKeyStrFromId(this.nodeId,this.channelId,this.postId,0,0);
        let key = this.feedService.getImageKey(this.nodeId,this.channelId,this.postId,0,0);
        if(contentVersion == "0"){
             key = thumbkey;
        }
        this.feedService.getData(key).then((realImg)=>{
          let img = realImg || "";
          if(img!=""){
            this.downStatus = "";
            this.native.hideLoading();
            this.native.openViewer(realImg,"common.image","PostdetailPage.postview",this.appService);
          }else{
            this.cacheGetBinaryRequestKey = key;
            this.cachedMediaType = "img";
            this.feedService.processGetBinary(this.nodeId, this.channelId, this.postId, 0, 0, FeedsData.MediaType.containsImg, key,
              (transDataChannel)=>{
                if (transDataChannel == FeedsData.TransDataChannel.SESSION){
                  this.downStatus = '1';
                  return;
                }

                if (transDataChannel == FeedsData.TransDataChannel.MESSAGE){
                  this.downStatus = '';
                  return;
                }
              },
              (err)=>{
                this.native.hideLoading();
              });
          }
        });
      }).catch(()=>{
        this.native.hideLoading();
      });
    });
  }

  checkServerStatus(nodeId: string){
    return this.feedService.getServerStatusFromId(nodeId);
  }

  initnodeStatus(){
     let status = this.checkServerStatus(this.nodeId);
     this.nodeStatus[this.nodeId] = status;
  }

  getImage(){
    let key = this.feedService.getImgThumbKeyStrFromId(this.nodeId,this.channelId,this.postId,0,0) || "";
    if(key !=""){
      this.feedService.getData(key).then((image)=>{
        this.postImage = image || "";
      }).catch((reason)=>{
        this.logUtils.loge("getImageData error:"+JSON.stringify(reason),TAG);
      })
    }

  }

  doRefresh(event:any){
    let sId =  setTimeout(() => {
      //this.postImage = "";
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
       this.commentList = this.commentList.concat(arr);
       });
       this.initnodeStatus();
       this.initOwnCommentObj();
       event.target.complete();
      }else{
       arr = this.totalData.slice(this.startIndex*this.pageNumber,this.totalData.length);
       this.zone.run(()=>{
           this.commentList = this.commentList.concat(arr);
       });
       this.infiniteScroll.disabled =true;
       this.initnodeStatus();
       this.initOwnCommentObj();
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

  pressOwnerName(){
    if(this.channelWOwner!= "" && this.channelWOwner.length>40){
      this.native.createTip(this.channelWOwner);
    }
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
                        content:comment.content
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

  getVideoPoster(id:string){
    this.feedService.getData(id).then((imagedata)=>{
      let image = imagedata || "";
      if(image!=""){
        this.zone.run(()=>{
           this.videoisShow = true;
            this.posterImg = imagedata;
            let id = this.nodeId+this.channelId+this.postId;
            let sid =setTimeout(()=>{
              let  video:any = document.getElementById(id+"postdetailvideo") || "";
              video.setAttribute("poster",this.posterImg);
              this.setFullScreen();
              this.setOverPlay();
              clearTimeout(sid);
            },0);

        })
      }else{
        this.videoisShow = false;
      }
   }).catch((err)=>{

   })
  }

  getVideo(key:string){

    this.feedService.getData(key).then((videodata:string)=>{
      this.zone.run(()=>{
        let videoData = videodata || "";
        if (videoData == ""){
          this.cacheGetBinaryRequestKey = key;
          this.cachedMediaType = "video";

          this.feedService.processGetBinary(this.nodeId, this.channelId, this.postId, 0, 0, FeedsData.MediaType.containsVideo, key,
            (transDataChannel)=>{
              if (transDataChannel == FeedsData.TransDataChannel.SESSION){
                this.downStatus = '1';
                return;
              }
              if (transDataChannel == FeedsData.TransDataChannel.MESSAGE){
                this.downStatus = '';
                return;
              }
            },
            (err)=>{
              this.pauseVideo();
            });
        return;
        }
        this.downStatus = "";
        this.videoObj = videoData;
        this.loadVideo(videoData);
      });
      });
  }

  loadVideo(videodata:any){
    let id = this.nodeId+this.channelId+this.postId;
    let source:any = document.getElementById(id+"postdetailsource") || "";
    source.setAttribute("src",videodata);
    let  video:any = document.getElementById(id+"postdetailvideo") || "";
    let vgbuffering:any = document.getElementById(id+"vgbufferingpostdetail");
    let vgoverlayplay:any = document.getElementById(id+"vgoverlayplaypostdetail");
    let vgcontrol:any = document.getElementById(id+"vgcontrolspostdetail");
    video.addEventListener('ended',()=>{

        vgoverlayplay.style.display = "block";
        vgbuffering.style.display ="none";
        vgcontrol.style.display = "none";
    });

    video.addEventListener('pause',()=>{
      vgoverlayplay.style.display = "block";
      vgbuffering.style.display ="none";
      vgcontrol.style.display = "none";
    });

    video.addEventListener('play',()=>{
      vgcontrol.style.display = "block";
     });


     video.addEventListener('canplay',()=>{
          vgbuffering.style.display ="none";
          video.play();
     });
     video.load();
  }

  pauseVideo(){
    if(this.postStatus != 1&&this.mediaType===2){
      let id = this.nodeId+this.channelId+this.postId;
      let  video:any = document.getElementById(id+"postdetailvideo") || "";
      if(!video.paused){  //判断是否处于暂停状态
          video.pause();  //停止播放
      }
    }
  }

  clearVideo(){
    if(this.postStatus != 1&&this.mediaType===2){
      this.posterImg ="";
      this.videoObj ="";
      let id = this.nodeId+this.channelId+this.postId;
      let video:any = document.getElementById(id+"postdetailvideo") || "";
      if(video!=""){
        //video.removeAttribute('poster');
      }

      let source:any = document.getElementById(id+"postdetailsource") || "";
      if(source != ""){
        source.removeAttribute('src'); // empty source
      }
      if(video!=""){
        // let sid=setTimeout(()=>{
        //   video.load();
        //   clearTimeout(sid);
        // },10)
      }
    }
  }

  setFullScreen(){
    let id = this.nodeId+this.channelId+this.postId;
    let vgfullscreen:any = document.getElementById(id+"vgfullscreenpostdetail") || "";
    if(vgfullscreen !=""){
      vgfullscreen.onclick=()=>{
         this.pauseVideo();
         let postImg:string = document.getElementById(id+"postdetailvideo").getAttribute("poster");
         let videoSrc:string = document.getElementById(id+"postdetailsource").getAttribute("src");
         this.fullScreenmodal = this.native.setVideoFullScreen(postImg,videoSrc);
     }
    }
  }

  hideFullScreen(){
    if(this.fullScreenmodal != ""){
      this.modalController.dismiss();
      this.fullScreenmodal = "";
    }
  }

  setOverPlay(){

    let id = this.nodeId+this.channelId+this.postId;
    let vgoverlayplay:any = document.getElementById(id+"vgoverlayplaypostdetail") || "";
    if(vgoverlayplay!=""){
     vgoverlayplay.onclick = ()=>{
      this.zone.run(()=>{
        let source:any = document.getElementById(id+"postdetailsource") || "";
        let sourceSrc = source.getAttribute("src") || "";
        if (sourceSrc != "")
          return;

        let key = this.feedService.getVideoKey(this.nodeId,this.channelId,this.postId,0,0);
        this.getVideo(key);
      });
     }
    }
  }

  handleTotal(){
    let post = this.feedService.getPostFromId(this.nodeId, this.channelId, this.postId);
    let videoThumbKey = post.content["videoThumbKey"] || "";
    let duration = 29;
    if(videoThumbKey != ""){
      duration = videoThumbKey["duration"] || 0;
    }
    return UtilService.timeFilter(duration);
  }

  processGetBinaryResult(key: string, value: string){
    this.cacheGetBinaryRequestKey = "";
    if (key.indexOf("img")>-1){
      this.native.hideLoading();
      this.native.openViewer(value,"common.image","PostdetailPage.postview",this.appService);
    } else if (key.indexOf("video")>-1){
      this.videoObj = value;
      this.loadVideo(value);
    }
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
}