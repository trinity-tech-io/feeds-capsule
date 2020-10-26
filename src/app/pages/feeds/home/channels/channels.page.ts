import { Component, OnInit, NgZone,ViewChild,ElementRef} from '@angular/core';
import { Events} from '@ionic/angular';
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
import { VgFullscreenAPI} from 'ngx-videogular';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

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


  constructor(
    private elmRef: ElementRef,
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
    public vgFullscreenAPI:VgFullscreenAPI) {

   
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

  initRefresh(){
    this.totalData = this.feedService.getPostListFromChannel(this.nodeId, this.channelId) || [];
    if(this.totalData.length-this.pageNumber > this.pageNumber){
      this.postList = this.totalData.slice(0,this.startIndex*this.pageNumber+this.pageNumber);
      this.infiniteScroll.disabled =false;
      if(this.startIndex === 0){
        this.startIndex++;
      }
      this.isLoadimage ={};
      this.isLoadVideoiamge ={};
      this.refreshImage();
    }else{
      this.postList = this.totalData.slice(0,this.totalData.length);
      this.infiniteScroll.disabled =true;
      this.isLoadimage ={};
      this.isLoadVideoiamge ={};
      this.refreshImage();
    }
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
    this.clientHeight =screen.availHeight;
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
    
    this.styleObj.width = (screen.width - 105)+'px';
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

    this.events.subscribe("feeds:editChannel",()=>{
      this.clickEdit()
    });

    this.events.subscribe('feeds:subscribeFinish', (nodeId, channelId, name)=> {
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
        this.initRefresh();
    });

    this.events.subscribe('feeds:deletePostFinish',()=>{
       this.native.hideLoading();
       this.initRefresh();
    });
  }

  ionViewWillLeave(){
    titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_RIGHT, null);

    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:updateTitle");
    this.events.unsubscribe("feeds:editChannel");
    this.events.unsubscribe("feeds:subscribeFinish");
    this.events.unsubscribe("feeds:unsubscribeFinish");
    this.events.unsubscribe("feeds:editPostFinish");
    this.events.unsubscribe("feeds:deletePostFinish");
    this.removeImages();
    this.removeAllVideo();
    this.isLoadimage ={};
    this.isLoadVideoiamge ={};
    this.curPost={};
  }

  ionViewDidEnter() {
    
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("ChannelsPage.feeds"));

    if (this.feedService.checkChannelIsMine(this.nodeId, this.channelId)) {
      console.log('Channel is mine!');
      titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_RIGHT, {
        key: "editChannel",
        iconPath: TitleBarPlugin.BuiltInIcon.EDIT
      });
    } else {
      titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_RIGHT, null);
    }
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
 
  comment(){
    alert("comment")
  }

  getChannel(nodeId, channelId):any{
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

  getContentImg(content: any): string{
    return this.feedService.parsePostContentImg(content);
  }

  getChannelOwnerName(nodeId, channelId){
   let channel = this.feedService.getChannelFromId(nodeId,channelId) || "";
    if(channel === ""){
      return "";
    }else{
      return UtilService.moreNanme(channel["owner_name"],40);
    }
  }

  navToPostDetail(nodeId:string, channelId:number, postId:number){
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
    let nodeChannelId = nodeId+channelId;
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
      if(this.totalData.length - this.pageNumber*this.startIndex>this.pageNumber){
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

  clickEdit(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    if(this.feedService.getServerStatusFromId(this.nodeId) != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

     this.pauseAllVideo();
  
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
      });
   
    this.native.go("/eidtchannel");
  }

  checkChannelIsMine(){
    if (this.feedService.checkChannelIsMine(this.nodeId, this.channelId))
      return 0;
    
    return 1;
  }

  pressName(nodeId:string,channelId: number){
    let name ="";
    let channel = this.feedService.getChannelFromId(nodeId,channelId) || "";
    if (channel != ""){
      name = channel["name"] || "";
    }
    if(name != "" && name.length>15){
      this.native.createTip(name);
    }
  }

  pressOwnName(nodeId:string,channelId: number){
    let name ="";
    let channel = this.feedService.getChannelFromId(nodeId,channelId) || "";
    if (channel != ""){
      name = channel["owner_name"] || "";
    }
    if(name != "" && name.length>40){
      this.native.createTip(name);
    }
  }


  scrollToTop(int) {
    let sid = setTimeout(() => {
       this.content.scrollToTop(1);
       clearTimeout(sid)
     }, int);
   }


  showComment(nodeId, channelId, postId) {
    this.postId = postId;
    this.hideComment = false;
  }

  hideComponent(event) {
    console.log('Hide comment component?', event);
    this.postId = null;
    this.hideComment = true;
  }

  ionScroll(){
    this.native.throttle(this.setVisibleareaImage(),200,this,true);
  }

  setVisibleareaImage(){

    let postgridList = document.getElementsByClassName("channelgird");
    let postgridNum = document.getElementsByClassName("channelgird").length;
    //console.log("====postgridNum====="+postgridNum);
    for(let postgridindex =0;postgridindex<postgridNum;postgridindex++){ 
      let id = postgridList[postgridindex].getAttribute("id") || '';
      //postImg
      this.handlePsotImg(id,postgridindex);

      //video
      this.hanldVideo(id,postgridindex);
   
    }

  }

  handlePsotImg(id:string,rowindex:number){
    // 13 存在 12不存在
    let isload = this.isLoadimage[id] || "";
    let rpostImage = document.getElementById(id+"channelrow");
    let postImage:any = document.getElementById(id+"postimgchannel") || "";
    //console.log("======="+rowindex+"-"+postImage+"-"+postImage.getBoundingClientRect().top);
    try {
      if(id!=''&&postImage.getBoundingClientRect().top>=-this.clientHeight&&postImage.getBoundingClientRect().top<=this.clientHeight){
        //console.log("======="+rowindex+"-"+postImage.getBoundingClientRect().top+"-"+id+"");
        if(isload===""){
          rpostImage.style.display = "none";
          this.isLoadimage[id] = "11";
         this.feedService.loadPostContentImg(id).then((imagedata)=>{
              let image = imagedata || "";
              //console.log("=====ssssssimage"+image);
              if(image!=""){
                this.isLoadimage[id] ="13";
                rpostImage.style.display = "block";
                //this.images[id] = this.images;
                this.zone.run(()=>{
                  postImage.setAttribute("src",image);
                  //this.images[id] = this.images;
                });
              
                //rpostImage.style.display = "none";
              }else{
                this.zone.run(()=>{
                  //console.log("=====ssssss");
                  this.isLoadimage[id] ="12";
                  rpostImage.style.display = 'none';   
                })
              }
            }).catch(()=>{
              rpostImage.style.display = 'none'; 
              console.log("getImageError");
            })
        }
      }else{
        let postImageSrc = postImage.getAttribute("src") || "";
        if(postImage.getBoundingClientRect().top<-this.clientHeight&&this.isLoadimage[id]==="13"&&postImageSrc!=""){ 
          //console.log("======="+rowindex);  
          this.isLoadimage[id] = "";
          postImage.removeAttribute("src");
        }
      }
    } catch (error) {
    
    }
  }

  hanldVideo(id:string,rowindex:number){

    let  isloadVideoImg  = this.isLoadVideoiamge[id] || "";
    let  vgplayer = document.getElementById(id+"vgplayerchannel");
    let  video:any = document.getElementById(id+"videochannel");
    let  source:any = document.getElementById(id+"sourcechannel");

    if(id!=""&&source!=""){
      this.pauseVideo(id);
   }
    try {
      if(id!=''&&video.getBoundingClientRect().top>=-this.clientHeight&&video.getBoundingClientRect().top<=this.clientHeight){
        //console.log("========="+rowindex+"==="+video.getBoundingClientRect().top);
        if(isloadVideoImg===""){
          this.isLoadVideoiamge[id] = "11";
          vgplayer.style.display = "none";
          this.feedService.loadVideoPosterImg(id).then((imagedata)=>{
              let image = imagedata || "";
              if(image!=""){
                this.isLoadVideoiamge[id] = "13";
                vgplayer.style.display = "block";
                video.setAttribute("poster",image);
                this.setFullScreen(id);
                  this.feedService.loadVideo(id).then((data:string)=>{
                    this.zone.run(()=>{
                     source.setAttribute("src",data);
                     video.load();
                    });
                 
                 }).catch((err)=>{
                  this.isLoadVideoiamge[id] = "12";
                 })
                //}
              }else{
  
                video.style.display='none';
                vgplayer.style.display = 'none'; 
              }
            }).catch(()=>{
              vgplayer.style.display = 'none'; 
              console.log("getImageError");
            });
        }
      }else{
        let postSrc =  video.getAttribute("poster") || "";
        if(video.getBoundingClientRect().top<-this.clientHeight&&this.isLoadVideoiamge[id]==="13"&&postSrc!=""){
          video.pause();
          video.removeAttribute("poster");
          source.removeAttribute("src");
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

  showBigImage(id:any){
    let idStr = id+"postimgchannel";
    let content = document.getElementById(idStr).getAttribute("src") || "";
    if(content!=''){
      this.pauseAllVideo();
      let isOwer = this.feedService.checkChannelIsMine(this.nodeId, this.channelId);
      if(isOwer){
        titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_RIGHT, null);
      }
      this.native.openViewer(content,"common.image","ChannelsPage.feeds",this.appService,isOwer);
    }
  }

  pauseVideo(id:string){

    let videoElement:any = document.getElementById(id+'videochannel') || "";
    let source:any = document.getElementById(id+'sourcechannel') || "";
    if(source!=""){
      videoElement.pause();
      //videoElement.removeAttribute('src'); // empty source
      //videoElement.load();
    }
  }
  
  pauseAllVideo(){
    let videoids = this.isLoadVideoiamge;
    for(let id  in videoids){
      let value = videoids[id] || "";
      if(value === "13"){
        this.pauseVideo(id);
      }
    }
  }


  removeAllVideo(){
    let videoids = this.isLoadVideoiamge;
    for(let id  in videoids){
      let value = videoids[id] || "";
      if(value === "13"){
        let videoElement:any = document.getElementById(id+'videochannel') || "";
        let source:any = document.getElementById(id+'sourcechannel') || "";
        if(source!=""){
          videoElement.pause();
          videoElement.removeAttribute('poster'); // empty source
          source.removeAttribute('src'); // empty source
          videoElement.load();
        }
      }
    }
  
  }

  setFullScreen(id:string){
    let vgfullscreen = document.getElementById(id+"vgfullscreenchannel");
    vgfullscreen.onclick=()=>{
    let isFullScreen = this.vgFullscreenAPI.isFullscreen;
    if(isFullScreen){
      this.native.setTitleBarBackKeyShown(true);
      titleBarManager.setTitle(this.translate.instant("ChannelsPage.feeds"));
      this.appService.addright();
      if (this.feedService.checkChannelIsMine(this.nodeId, this.channelId)) {
        titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_RIGHT, {
          key: "editChannel",
          iconPath: TitleBarPlugin.BuiltInIcon.EDIT
        });
      } else {
        titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_RIGHT, null);
      }
    }else{
      this.native.setTitleBarBackKeyShown(false);
      titleBarManager.setTitle(this.translate.instant("common.video"));
      titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_RIGHT, null);
      this.appService.hideright();
     
    }

    this.vgFullscreenAPI.toggleFullscreen(vgfullscreen);
   
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

}
