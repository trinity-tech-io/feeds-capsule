import { Component, OnInit, NgZone,ViewChild} from '@angular/core';
import { Events,ModalController} from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { UtilService } from 'src/app/services/utilService';
import { MenuService } from 'src/app/services/MenuService';
import { TranslateService } from "@ngx-translate/core";
import { PaypromptComponent } from 'src/app/components/payprompt/payprompt.component'
import { PopoverController,IonInfiniteScroll,IonContent} from '@ionic/angular';
import { AppService } from 'src/app/services/AppService';
import { PopupProvider } from 'src/app/services/popup';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
import { LogUtils } from 'src/app/services/LogUtils';
import * as _ from 'lodash';
let TAG: string = "Feeds-feeds";
@Component({
  selector: 'app-channels',
  templateUrl: './channels.page.html',
  styleUrls: ['./channels.page.scss'],
})
export class ChannelsPage implements OnInit {
  @ViewChild(IonContent,{static:true}) content: IonContent;
  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;

  public images = {};
  public isShowPrompt: boolean = false;
  public popover:any;
  public nodeStatus:any = {};
  public connectionStatus:number = 1;
  public channelAvatar:string = "";
  public channelName:string = "";
  public channelOwner:string = "";
  public channelDesc:string = "";
  public channelSubscribes:number = 0;
  public postList:any = [];

  public nodeId:string ="";
  public channelId:number = 0;

  public followStatus:boolean = false;

  public startIndex:number = 0;
  public pageNumber:number = 5;
  public totalData:any = [];

  public curPost:any = {};
  public styleObj:any = {width:""};


  public hideComment = true;

  // For comment component
  public postId = null;

  public clientHeight:number = 0;
  public isLoadimage:any ={};
  public isLoadVideoiamge:any = {};
  public videoIamges:any ={};

  public cacheGetBinaryRequestKey:string="";
  public cachedMediaType = "";

  public onlineStatus = null;

  public maxTextSize = 240;

  public fullScreenmodal:any = "";

  public downProgressObj ={};
  public curPostId:string = "";

  public downStatusObj = {};

  public curNodeId:string = "";

  public curImgPostId:string = "";

  public hideDeletedPosts:boolean = false;

  constructor(
    private popoverController:PopoverController,
    private zone: NgZone,
    private events: Events,
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private feedService: FeedService,
    public theme:ThemeService,
    private translate:TranslateService,
    private menuService: MenuService,
    public appService:AppService,
    public modalController:ModalController,
    private logUtils: LogUtils,
    public popupProvider:PopupProvider) {


  }

  subscribe(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.feedService.subscribeChannel(this.nodeId, Number(this.channelId));
  }

  tip(){
    let server = this.feedService.getServerbyNodeId(this.nodeId)||undefined;

    if (server == undefined ||server.elaAddress == undefined || server.elaAddress == ""){
      this.native.toast('common.noElaAddress');
      return;
    }

    this.pauseAllVideo();
    this.showPayPrompt(server.elaAddress);
  }

  async unsubscribe(){
    this.menuService.showUnsubscribeMenuWithoutName(this.nodeId, Number(this.channelId));

  }

  ngOnInit() {
    this.acRoute.params.subscribe((data)=>{
      this.nodeId = data.nodeId;
      this.channelId = data.channelId;
    });
  }

  init(){
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.initnodeStatus(this.nodeId);
    this.initChannelData();
    this.initRefresh();
    this.initStatus(this.postList);
  }

  initStatus(arr:any){
    for(let index = 0;index<arr.length;index++){
      let nodeId = arr[index]['nodeId'];
      this.initnodeStatus(nodeId);
     }
  }

  sortChannelList(){
    let channelList = this.feedService.getPostListFromChannel(this.nodeId, this.channelId) || [];;
    this.hideDeletedPosts = this.feedService.getHideDeletedPosts();
    if(!this.hideDeletedPosts){
      channelList = _.filter(channelList ,(item:any)=> { return item.post_status != 1; });
    }
    return channelList;
  }

  initRefresh(){
    this.totalData = this.sortChannelList();
    this.startIndex = 0;
    if(this.totalData.length-this.pageNumber > 0){
      this.postList = this.totalData.slice(0,this.pageNumber);
      this.infiniteScroll.disabled =false;
      this.startIndex++;

      this.isLoadimage ={};
      this.isLoadVideoiamge ={};
      this.refreshImage();
    }else{
      this.postList = this.totalData;
      this.infiniteScroll.disabled =true;
      this.isLoadimage ={};
      this.isLoadVideoiamge ={};
      this.refreshImage();
    }
  }

  refreshChannelList(){
    if(this.startIndex === 0){
      this.initRefresh();
      return;
    }
    this.totalData = this.sortChannelList();
    if (this.totalData.length - this.pageNumber*this.startIndex > 0){
      this.postList = this.totalData.slice(0,(this.startIndex)*this.pageNumber);
      this.infiniteScroll.disabled =false;
     } else {
      this.postList =  this.totalData;
      this.infiniteScroll.disabled =true;
    }
    this.isLoadimage ={};
    this.isLoadVideoiamge ={};
    this.refreshImage();
  }

  initChannelData(){
    let channel = this.feedService.getChannelFromId(this.nodeId, this.channelId);
    this.checkFollowStatus(this.nodeId,this.channelId);
    if (channel == null || channel == undefined)
      return ;

    this.channelName = channel.name;
    this.channelOwner = this.feedService.indexText(channel.owner_name,25,25);
    this.channelDesc = channel.introduction;
    this.channelSubscribes = channel.subscribers;
    this.channelAvatar = this.feedService.parseChannelAvatar(channel.avatar);

  }
  ionViewWillEnter() {

    this.hideDeletedPosts = this.feedService.getHideDeletedPosts();
    this.clientHeight =screen.availHeight;
    this.native.setTitleBarBackKeyShown(true);
    this.styleObj.width = (screen.width - 105)+'px';
    this.initTitle();
    this.init();

    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe("feeds:updateTitle",()=>{
      if(this.menuService.postDetail!=null){
        this.menuService.hideActionSheet();
        this.menuMore(this.curPost);
      }

      this.initTitle();
    });

    this.events.subscribe('feeds:subscribeFinish', (nodeId, channelId)=> {
      this.zone.run(() => {
        this.checkFollowStatus(this.nodeId,this.channelId);
      });
    });

    this.events.subscribe('feeds:unsubscribeFinish', (nodeId, channelId, name) => {
      this.zone.run(() => {
        this.checkFollowStatus(this.nodeId,this.channelId);
        this.native.setRootRouter(['/tabs/home']);
      });
    });

    this.events.subscribe('feeds:editPostFinish',()=>{
        this.zone.run(() => {
          this.refreshChannelList();
        });
    });

    this.events.subscribe('feeds:deletePostFinish',()=>{
       this.native.hideLoading();
       this.zone.run(() => {
        this.refreshChannelList();
       });
    });

    this.events.subscribe('stream:getBinaryResponse', () => {
      this.zone.run(() => {

      });
    });

    this.events.subscribe('feeds:getBinaryFinish', (nodeId, key: string, value:string) => {
      this.zone.run(() => {
        this.processGetBinaryResult(key, value);
      });
    });

    this.events.subscribe('stream:getBinarySuccess', (nodeId, key: string, value:string) => {
      this.zone.run(() => {
        this.processGetBinaryResult(key, value);
        this.feedService.closeSession(nodeId);
      });
    });

    this.events.subscribe('stream:progress',(nodeId,progress)=>{
      this.zone.run(() => {
        if(this.curPostId === ""){
          return;
        }
        this.downProgressObj[this.curPostId] = progress;
        if(this.curImgPostId=== ""){
          return;
        }
        if(this.downStatusObj[this.curImgPostId]!=''){
            this.native.updateLoadingMsg(this.translate.instant("common.downloading")+" "+progress+"%");
        }
      });
    });

    this.events.subscribe('stream:error', (nodeId, error) => {
      this.zone.run(() => {
        this.feedService.handleSessionError(nodeId, error);
        this.pauseAllVideo();
        this.downProgressObj[this.curPostId] = 0;
        this.downStatusObj[this.curPostId] = "";
        this.curNodeId = "";
        this.native.hideLoading();
      });
    });

    this.events.subscribe('stream:onStateChangedCallback', (nodeId, state) => {
      this.zone.run(() => {

        if (this.cacheGetBinaryRequestKey == "")
          return;

        if (state === FeedsData.StreamState.CONNECTED){
          this.downStatusObj[this.curPostId] = "2";
          this.feedService.getBinary(nodeId, this.cacheGetBinaryRequestKey,this.cachedMediaType);
          if(this.downStatusObj[this.curImgPostId]!=''){
            this.native.updateLoadingMsg(this.translate.instant("common.downloading"));
          }
        }
      });
    });

    this.events.subscribe('rpcRequest:error', () => {
      this.zone.run(() => {
        this.native.hideLoading();
      });
    });

    this.events.subscribe('rpcResponse:error', () => {
      this.zone.run(() => {
        this.native.hideLoading();
      });
    });

   this.events.subscribe('rpcRequest:success', () => {
    this.zone.run(() => {
      this.refreshChannelList();
      this.isLoadimage ={};
      this.isLoadVideoiamge ={};
      this.refreshImage();
      this.initnodeStatus(this.postList);
      this.hideComponent(null);
      this.native.hideLoading();
      this.native.toast_trans("CommentPage.tipMsg1");
    });
   });

   this.events.subscribe('feeds:openRightMenu',()=>{
    this.curPostId = "";
    this.curImgPostId = "";
    this.feedService.closeSession(this.curNodeId);
    this.curNodeId = "";
    this.downProgressObj ={};
    this.downStatusObj ={};
    this.pauseAllVideo();
    this.hideFullScreen();
   });

   this.events.subscribe('stream:closed',(nodeId)=>{
      let mNodeId = nodeId || "";
      if (mNodeId != ""){
        this.feedService.closeSession(mNodeId);
      }
      this.pauseAllVideo();
      this.native.hideLoading();
      this.downStatusObj[this.curPostId] = "";
      this.curNodeId = "";
      this.downProgressObj[this.curPostId] = 0;
    });

    this.events.subscribe("feeds:friendConnectionChanged", (nodeId, status)=>{
      this.zone.run(()=>{
        this.nodeStatus[nodeId] = status;
      });
    });
  }

  ionViewWillLeave(){

    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:updateTitle");
    this.events.unsubscribe("feeds:subscribeFinish");
    this.events.unsubscribe("feeds:unsubscribeFinish");
    this.events.unsubscribe("feeds:editPostFinish");
    this.events.unsubscribe("feeds:deletePostFinish");

    this.events.unsubscribe("feeds:getBinaryFinish");

    this.events.unsubscribe("rpcRequest:error");
    this.events.unsubscribe("rpcResponse:error");
    this.events.unsubscribe("rpcRequest:success");

    this.events.unsubscribe("stream:getBinaryResponse");
    this.events.unsubscribe("stream:getBinarySuccess");
    this.events.unsubscribe("stream:error");
    this.events.unsubscribe("stream:onStateChangedCallback");
    this.events.unsubscribe("feeds:openRightMenu");
    this.events.unsubscribe("stream:progress");
    this.events.unsubscribe("stream:closed");
    this.events.unsubscribe("feeds:friendConnectionChanged");
    this.removeImages();
    this.removeAllVideo();
    this.isLoadimage ={};
    this.isLoadVideoiamge ={};
    this.curPost={};
    this.downProgressObj = {};
    this.downStatusObj = {};
    if(this.curNodeId !=""){
      this.feedService.closeSession(this.curNodeId);
    }
    this.curNodeId ="";
    this.curPostId ="";
    this.curImgPostId = "";
    this.events.publish("update:tab");
    this.events.publish("addBinaryEvevnt");
    this.native.hideLoading();
    this.hideFullScreen();
  }

  ionViewDidEnter() {

  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("ChannelsPage.feeds"));
  }

  like(nodeId:string, channelId:number, postId:number){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (this.checkMyLike(nodeId,channelId,postId)){
      this.feedService.postUnlike(nodeId,Number(channelId),Number(postId),0);
      return ;
    }

    this.feedService.postLike(nodeId,Number(channelId),Number(postId),0);
  }


  getChannel(nodeId:string, channelId:number):any{
    let channel = this.feedService.getChannelFromId(nodeId,channelId) || "";
    if(channel === ""){
         return ""
    }else{
      return UtilService.moreNanme(channel["name"]);
    }

  }

  getContentText(content: string): string{
    return this.feedService.parsePostContentText(content);
  }

  getContentShortText(post:any): string{
    let   content = post.content;
    let  text = this.feedService.parsePostContentText(content) || "";
    return text.substring(0,180)+"...";
  }

  getContentImg(content: any): string{
    return this.feedService.parsePostContentImg(content);
  }


  getPostContentTextSize(content:string){
    let text = this.feedService.parsePostContentText(content);
    let size = UtilService.getSize(text);
    return size;
   }

  getChannelOwnerName(nodeId, channelId){
   let channel = this.feedService.getChannelFromId(nodeId,channelId) || "";
    if(channel === ""){
      return "";
    }else{
      return UtilService.moreNanme(channel["owner_name"],40);
    }
  }

  navToPostDetail(nodeId:string, channelId:number, postId:number,event?:any){
    event = event || "";
    if(event!=""){
     let e = event||window.event; //兼容IE8
     let target = e.target||e.srcElement;  //判断目标事件
     if(target.tagName.toLowerCase()=="span"){
      let url = target.textContent || target.innerText;
      this.native.clickUrl(url,event);
      return;
     }
    }
    this.pauseVideo(nodeId+channelId+postId);
    this.native.getNavCtrl().navigateForward(['/postdetail',nodeId, channelId,postId]);
  }

  showCommentPage(nodeId:string, channelId:string, postId:string){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }
    this.pauseAllVideo();
    this.native.navigateForward(["comment",nodeId,channelId,postId],"");
  }

  checkMyLike(nodeId: string, channelId: number, postId: number){
    return this.feedService.checkMyLike(nodeId, channelId, postId);
  }

  checkFollowStatus(nodeId: string, channelId: number){
    let channelsMap = this.feedService.getChannelsMap();
    let nodeChannelId = this.feedService.getChannelId(nodeId,channelId);
    if (channelsMap[nodeChannelId] == undefined || !channelsMap[nodeChannelId].isSubscribed){
      this.followStatus = false;
    }
    else{
      this.followStatus = true;
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

  menuMore(post:any){
    this.pauseAllVideo();
    this.curPost = post;
    let isMine = this.checkChannelIsMine();
    if (isMine === 0 && post.post_status != 1) {
      this.menuService.showPostDetailMenu(post.nodeId, Number(post.channel_id), this.channelName,post.id);
    } else {
      this.menuService.showShareMenu(post.nodeId, Number(post.channel_id), this.channelName,post.id);
    }
  }

  checkServerStatus(nodeId: string){
    return this.feedService.getServerStatusFromId(nodeId);
  }

  initnodeStatus(nodeId:string) {
    let status = this.checkServerStatus(nodeId);
    this.nodeStatus[nodeId] = status;
  }

  async showPayPrompt(elaAddress:string) {
    this.pauseAllVideo();
    this.isShowPrompt = true;
    this.popover = await this.popoverController.create({
      mode: 'ios',
      cssClass: 'PaypromptComponent',
      component: PaypromptComponent,
      backdropDismiss: false,
      componentProps: {
        "title": this.translate.instant("ChannelsPage.tip"),
        "elaAddress": elaAddress,
        "defalutMemo": ""
      }
    });
    this.popover.onWillDismiss().then(() => {
      this.isShowPrompt = false;
      this.popover = null;
    });
    return await this.popover.present();
  }

  doRefresh(event:any){
    let sId =  setTimeout(() => {
      this.images = {};
      this.startIndex = 0;
      this.init();
      this.initStatus(this.postList);
      event.target.complete();
      this.refreshImage();
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
        this.initStatus(arr);
        this.postList = this.postList.concat(arr);
        this.refreshImage();
       });
       event.target.complete();
      }else{
       arr = this.totalData.slice(this.startIndex*this.pageNumber,this.totalData.length);
       this.zone.run(()=>{
          this.initStatus(arr);
          this.postList =  this.postList.concat(arr);
       });
       this.infiniteScroll.disabled =true;
       this.refreshImage();
       event.target.complete();
       clearTimeout(sId);
      }
    },500);
  }

  checkChannelIsMine(){
    if (this.feedService.checkChannelIsMine(this.nodeId, this.channelId))
      return 0;

    return 1;
  }

  scrollToTop(int) {
    let sid = setTimeout(() => {
       this.content.scrollToTop(1);
       clearTimeout(sid)
     }, int);
   }


  showComment(nodeId:string, channelId:number, postId:number) {
      if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }
    this.pauseVideo(nodeId+channelId+postId);
    this.postId = postId;
    this.onlineStatus = this.nodeStatus[nodeId];
    this.hideComment = false;
  }

  hideComponent(event:any) {
    this.postId = null;
    this.onlineStatus = null;
    this.hideComment = true;
  }

  ionScroll(){
    this.native.throttle(this.setVisibleareaImage(),200,this,true);
  }

  setVisibleareaImage(){

    let postgridList = document.getElementsByClassName("channelgird");
    let postgridNum = document.getElementsByClassName("channelgird").length;
    for(let postgridindex =0;postgridindex<postgridNum;postgridindex++){
      let srcId = postgridList[postgridindex].getAttribute("id") || '';
      if(srcId!=""){
        let arr = srcId.split("-");
        let nodeId = arr[0];
        let channelId = arr[1];
        let postId = arr[2];
        let mediaType = arr[3];
        let id = nodeId+channelId+postId;
        //postImg
        if(mediaType === '1'){
          this.handlePsotImg(id,srcId,postgridindex);
        }
         if(mediaType === '2'){
          //video
          this.hanldVideo(id,srcId,postgridindex);
          }
      }

    }

  }

  handlePsotImg(id:string,srcId:string,rowindex:number){
    // 13 存在 12不存在
    let isload = this.isLoadimage[id] || "";
    let rpostImage = document.getElementById(id+"channelrow");
    let postImage:any = document.getElementById(id+"postimgchannel") || "";
    try {
      if(id!=''&&postImage.getBoundingClientRect().top>=-100&&postImage.getBoundingClientRect().top<=this.clientHeight){
        if(isload===""){
          //rpostImage.style.display = "none";
          this.isLoadimage[id] = "11";
          let arr = srcId.split("-");
          let nodeId =arr[0];
          let channelId:any = arr[1];
          let postId:any = arr[2];
         let key = this.feedService.getImgThumbKeyStrFromId(nodeId,channelId,postId,0,0);
         this.feedService.getData(key).then((imagedata)=>{
              let image = imagedata || "";
              if(image!=""){
                this.isLoadimage[id] ="13";
                //rpostImage.style.display = "block";
                //this.images[id] = this.images;
                this.zone.run(()=>{
                  postImage.setAttribute("src",image);
                  //this.images[id] = this.images;
                });

                //rpostImage.style.display = "none";
              }else{
                this.zone.run(()=>{
                  this.isLoadimage[id] ="12";
                  rpostImage.style.display = 'none';
                })
              }
            }).catch((reason)=>{
              rpostImage.style.display = 'none';
              this.logUtils.loge("getImageData error:"+JSON.stringify(reason),TAG);
            })
        }
      }else{
        let postImageSrc = postImage.getAttribute("src") || "";
        if(postImage.getBoundingClientRect().top<-100&&this.isLoadimage[id]==="13"&&postImageSrc!=""){
          this.isLoadimage[id] = "";
          postImage.setAttribute("src","assets/images/loading.png");
        }
      }
    } catch (error) {
      this.logUtils.loge("getImageData error:"+JSON.stringify(error),TAG);
    }
  }

  hanldVideo(id:string,srcId:string,rowindex:number){

    let  isloadVideoImg  = this.isLoadVideoiamge[id] || "";
    let  vgplayer = document.getElementById(id+"vgplayerchannel");
    let  video:any = document.getElementById(id+"videochannel");
    let  source:any = document.getElementById(id+"sourcechannel");
    let  downStatus = this.downStatusObj[id] || "";
    if(id!=""&&source!=""&&downStatus===''){
       this.pauseVideo(id);
    }
    try {
      if(id!=''&&video.getBoundingClientRect().top>=-100&&video.getBoundingClientRect().top<=this.clientHeight){
        if(isloadVideoImg===""){
          this.isLoadVideoiamge[id] = "11";
          //vgplayer.style.display = "none";
          let arr = srcId.split("-");
          let nodeId =arr[0];
          let channelId:any = arr[1];
          let postId:any = arr[2];
          let key = this.feedService.getVideoThumbStrFromId(nodeId,channelId,postId,0);
          this.feedService.getData(key).then((imagedata)=>{
              let image = imagedata || "";
              if(image!=""){
                this.isLoadVideoiamge[id] = "13";
                //vgplayer.style.display = "block";
                video.setAttribute("poster",image);
                this.setFullScreen(id);
                this.setOverPlay(id,srcId);
              }else{
                this.isLoadVideoiamge[id] = "12";
                video.style.display='none';
                vgplayer.style.display = 'none';
              }
            }).catch((reason)=>{
              vgplayer.style.display = 'none';
              this.logUtils.loge("getVideoData error:"+JSON.stringify(reason),TAG);
            });
        }
      }else{
        let postSrc =  video.getAttribute("poster") || "";
        if(video.getBoundingClientRect().top<-100&&this.isLoadVideoiamge[id]==="13"&&postSrc!="assets/images/loading.png"){
          video.setAttribute("poster","assets/images/loading.png");
          let sourcesrc =  source.getAttribute("src") || "";
          if(sourcesrc  != ""){
            //video.pause();
            source.removeAttribute("src");
          }
          this.isLoadVideoiamge[id]="";
        }
      }
    } catch (error) {

    }
  }

  refreshImage(){
    let sid = setTimeout(()=>{
        //this.isLoadimage ={};
        //this.isLoadVideoiamge ={};
        this.setVisibleareaImage();
      clearTimeout(sid);
    },0);
  }

  showBigImage(nodeId:string,channelId:number,postId:number){
    this.pauseAllVideo();
    this.zone.run(()=>{
      this.native.showLoading("common.waitMoment", 5*60*1000).then(()=>{
        let contentVersion = this.feedService.getContentVersion(nodeId,channelId,postId,0);
        let thumbkey= this.feedService.getImgThumbKeyStrFromId(nodeId,channelId,postId,0,0);
        let key = this.feedService.getImageKey(nodeId,channelId,postId,0,0);
        if(contentVersion == "0"){
          key = thumbkey;
        }
        this.feedService.getData(key).then((realImg)=>{
          let img = realImg || "";
          if(img!=""){
            //this.curNodeId = "";
            //this.curImgPostId = nodeId+channelId+postId;
            this.downStatusObj[nodeId+channelId+postId] = "";
            this.native.hideLoading();
            this.native.openViewer(realImg,"common.image","ChannelsPage.feeds",this.appService);
          }else{
            if(this.isExitDown()){
              this.native.hideLoading();
              this.openAlert();
              return;
            }
            this.curImgPostId = nodeId+channelId+postId;
            this.cacheGetBinaryRequestKey = key;
            this.cachedMediaType = "img";
            this.feedService.processGetBinary(nodeId, channelId, postId, 0, 0, FeedsData.MediaType.containsImg, key,
              (transDataChannel)=>{
                if (transDataChannel == FeedsData.TransDataChannel.SESSION){
                  this.downStatusObj[nodeId+channelId+postId] = "1";
                  this.curNodeId = nodeId;
                  return;
                }

                if (transDataChannel == FeedsData.TransDataChannel.MESSAGE){
                  this.downStatusObj[nodeId+channelId+postId] = "1";
                  this.curNodeId = "";
                  return;
                }
              },(err)=>{
                this.native.hideLoading();
              });
          }
        });
      }).catch(()=>{
        this.native.hideLoading();
      });
    });
  }

  pauseVideo(id:string){

    let videoElement:any = document.getElementById(id+'videochannel') || "";
    let source:any = document.getElementById(id+'sourcechannel') || "";
    if(source!=""){
      if(!videoElement.paused){  //判断是否处于暂停状态
        videoElement.pause();
      }
    }
  }

  pauseAllVideo(){
    let videoids = this.isLoadVideoiamge;
    for(let id  in videoids){
      let value = videoids[id] || "";
      if(value === "13"){
        let  downStatus = this.downStatusObj[id] || "";
        if(downStatus === ""){
          this.pauseVideo(id);
        }
      }
    }
  }


  removeAllVideo(){
    let videoids = this.isLoadVideoiamge;
    for(let id  in videoids){
      let value = videoids[id] || "";
      if(value === "13"){
        let videoElement:any = document.getElementById(id+'videochannel') || "";
        if(videoElement!=""){
          //videoElement.setAttribute('poster',"assets/images/loading.png"); // empty source
        }
        let source:any = document.getElementById(id+'sourcechannel') || "";
        let sourcesrc =  source.getAttribute("src") || "";
        if(source!=""&&sourcesrc!=""){
          source.removeAttribute('src'); // empty source
          // let sid=setTimeout(()=>{
          //   videoElement.load();
          //   clearTimeout(sid);
          // },10)
        }
      }
    }

  }

  setFullScreen(id:string){
    let vgfullscreen = document.getElementById(id+"vgfullscreenchannel");
    vgfullscreen.onclick=()=>{
      this.pauseVideo(id);
      let postImg:string = document.getElementById(id+"videochannel").getAttribute("poster");
      let videoSrc:string = document.getElementById(id+"sourcechannel").getAttribute("src");
      this.fullScreenmodal = this.native.setVideoFullScreen(postImg,videoSrc);
    }
  }

  hideFullScreen(){
    if(this.fullScreenmodal != ""){
      this.modalController.dismiss();
      this.fullScreenmodal = "";
    }
  }

  removeImages(){
    let iamgseids = this.isLoadimage;
    for(let id  in iamgseids){
      let value = iamgseids[id] || "";
      if(value === "13"){
        let imgElement:any = document.getElementById(id+'postimgchannel') || "";
        if(imgElement!=""){
            imgElement.removeAttribute('src'); // empty source
        }
        }
      }
    }


    setOverPlay(id:string,srcId:string){
      let vgoverlayplay:any = document.getElementById(id+"vgoverlayplaychannel") || "";
      let source:any = document.getElementById(id+"sourcechannel") || "";

      if(vgoverlayplay!=""){
       vgoverlayplay.onclick = ()=>{
        this.zone.run(()=>{
           let sourceSrc = source.getAttribute("src") || "";
           if(sourceSrc === ""){
            this.getVideo(id,srcId);
           }
        });
       }
      }
    }

    getVideo(id:string,srcId:string){
      let arr = srcId.split("-");
      let nodeId =arr[0];
      let channelId:any = arr[1];
      let postId:any = arr[2];

      // this.curPostId = id;
      // this.downProgressObj = {};
      // this.downStatusObj = {};

      let key = this.feedService.getVideoKey(nodeId,channelId,postId,0,0);
          this.feedService.getData(key).then((videoResult:string)=>{
            this.zone.run(()=>{
              let videodata = videoResult || "";
              if (videodata == ""){
                if(this.isExitDown()){
                  this.pauseVideo(id);
                  this.openAlert();
                  return;
                }
                this.curPostId = id;
                this.cacheGetBinaryRequestKey = key;
                this.cachedMediaType = "video";

                this.feedService.processGetBinary(nodeId, channelId, postId, 0, 0, FeedsData.MediaType.containsVideo, key,
                  (transDataChannel)=>{
                    if (transDataChannel == FeedsData.TransDataChannel.SESSION){
                      this.downProgressObj[id] = 0;
                      this.downStatusObj[id] = "1";
                      this.curNodeId = nodeId;
                      return;
                    }

                    if (transDataChannel == FeedsData.TransDataChannel.MESSAGE){
                      this.downProgressObj[id] = 0;
                      this.downStatusObj[id] = "1";
                      this.curNodeId = "";
                      return;
                    }
                  },(err)=>{
                    this.pauseVideo(id);
                    this.native.hideLoading();
                  });
                return;
              }
              this.downStatusObj[id] = "";
              this.loadVideo(id,videodata);
            })
          });
    }


    loadVideo(id:string,videodata:string){
      let source:any = document.getElementById(id+"sourcechannel") || "";
      if(source === ""){
        return;
      }
      source.setAttribute("src",videodata);
      let vgbuffering:any = document.getElementById(id+"vgbufferingchannel") || "";
      let vgoverlayplay:any = document.getElementById(id+"vgoverlayplaychannel");
      let video:any = document.getElementById(id+"videochannel");
      let vgcontrol:any = document.getElementById(id+"vgcontrolschannel");
      video.addEventListener('ended',()=>{
          vgbuffering.style.display ="none";
          vgoverlayplay.style.display = "block";
          vgcontrol.style.display = "none";
      });

      video.addEventListener('pause',()=>{
        vgbuffering.style.display ="none";
        vgoverlayplay.style.display = "block";
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

    handleTotal(post:any){
      let videoThumbKey = post.content["videoThumbKey"] || "";
      let duration = 29;
      if(videoThumbKey != ""){
        duration = videoThumbKey["duration"] || 0;
      }
      return UtilService.timeFilter(duration);
    }

  processGetBinaryResult(key: string, value: string){
    this.native.hideLoading();
    if (key.indexOf("img")>-1){
      this.downStatusObj[this.curImgPostId] = "";
      this.curImgPostId = "";
      this.cacheGetBinaryRequestKey = "";
      this.native.hideLoading();
      this.native.openViewer(value,"common.image","ChannelsPage.feeds",this.appService);
    } else if (key.indexOf("video")>-1){
      this.downProgressObj[this.curPostId] = 0;
      this.downStatusObj[this.curPostId] = "";
      this.curPostId ="";
      let arr = this.cacheGetBinaryRequestKey.split("-");
      let nodeId =arr[0];
      let channelId:any = arr[1];
      let postId:any = arr[2];
      let id = nodeId+channelId+postId;
      this.cacheGetBinaryRequestKey = "";
      this.loadVideo(id,value);
    }
  }

  isExitDown(){

    if((JSON.stringify(this.downStatusObj) == "{}")){
          return false;
    }

    for(var key in this.downStatusObj) {
      if(this.downStatusObj[key] != ""){
            return true;
      }
    }

    return false;

  }

  openAlert(){
    this.popover = this.popupProvider.ionicAlert(
      this,
      // "ConfirmdialogComponent.signoutTitle",
      "",
      "common.downDes",
      this.cancel,
      'tskth.svg'
    );
  }

  cancel(that:any){
      if(this.popover!=null){
         this.popover.dismiss();
      }
  }

  clickAvatar(){
   if(this.channelAvatar.indexOf("data:image")>-1){
    this.feedService.setSelsectIndex(0);
    this.feedService.setProfileIamge(this.channelAvatar);
   }else if(this.channelAvatar.indexOf("assets/images")>-1){
    let index = this.channelAvatar.substring(this.channelAvatar.length-5,this.channelAvatar.length-4);
    this.feedService.setSelsectIndex(index);
    this.feedService.setProfileIamge(this.channelAvatar);
   }

  this.feedService.setChannelInfo(
    {
      "nodeId":this.nodeId,
      "channelId":this.channelId,
      "name":this.channelName,
      "des":this.channelDesc,
      "followStatus":this.followStatus,
      "channelSubscribes":this.channelSubscribes
    });
   this.native.navigateForward(['/feedinfo'],"");
  }

  pressContent(postContent:string){
    let text = this.feedService.parsePostContentText(postContent);
    this.native.copyClipboard(text).then(()=>{
      this.native.toast_trans("common.copysucceeded");
    }).catch(()=>{

    });
  }

}
