import { Component, OnInit, NgZone, ViewChild,ElementRef } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { Events,IonTabs} from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { MenuService } from 'src/app/services/MenuService';
import { FeedsPage } from '../feeds.page'
import { ThemeService } from 'src/app/services/theme.service';
import { UtilService } from 'src/app/services/utilService';
import { TranslateService } from "@ngx-translate/core";
import { NativeService } from 'src/app/services/NativeService';
import { IonInfiniteScroll } from '@ionic/angular';
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})

export class HomePage implements OnInit {

  @ViewChild(IonContent,{static:true}) content: IonContent;
  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;

  myScrollContainer!: HTMLElement;

  public connectionStatus = 1;
  public postList: any = [];
  public nodeStatus:any={};
  public startIndex = 0;
  public pageNumber = 8;
  public totalData = [];
  public images = {};
  public curPost:any = {};
  public styleObj:any = {width:""};

  public hideComment = true;

  // For comment component
  public postId = null;
  public nodeId = null;
  public channelId = null
  public channelAvatar = null;
  public channelName = null;

  public clientHeight:number = 0;
  public isLoadimage:any ={};

  public isLoadVideoiamge:any = {};
  public videoIamges:any ={};

  constructor(
    private elmRef: ElementRef,
    private feedspage: FeedsPage,
    private tabs: IonTabs,
    private events: Events,
    private zone: NgZone,
    private feedService :FeedService,
    public theme:ThemeService,
    private translate:TranslateService,
    private native:NativeService,
    private menuService: MenuService
  ) {}

  ionViewWillEnter() {
    //this.refreshImage(); 
    this.styleObj.width = (screen.width - 105)+'px';
    this.clientHeight =screen.availHeight-58.5-60;
    this.startIndex = 0;
    this.totalData = this.feedService.getPostList() || [];
    this.connectionStatus = this.feedService.getConnectionStatus();
    if(this.totalData.length - this.pageNumber > this.pageNumber) {
      this.postList = this.totalData.slice(this.startIndex,this.pageNumber);
      this.startIndex++;
      this.infiniteScroll.disabled =false;
    } else {
      this.postList = this.totalData.slice(0,this.totalData.length);
      this.infiniteScroll.disabled =true;
    }
    this.scrollToTop(1);
    this.initnodeStatus(this.postList);

    this.events.subscribe("feeds:updateTitle",()=>{
      if(this.menuService.postDetail!=null){
        this.menuService.hideActionSheet();
        this.menuMore(this.curPost);
      }
    });
   
    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe('feeds:publishPostFinish',()=>{
      this.zone.run(() => {
        this.isLoadimage ={};
        this.isLoadVideoiamge = {};
        this.infiniteScroll.disabled =false;
        this.startIndex = 0;
        this.totalData = this.feedService.getPostList() || [];
        if (this.totalData.length - this.pageNumber > this.pageNumber){
          this.postList = this.totalData.slice(this.startIndex,this.pageNumber);
          this.startIndex++;
          this.infiniteScroll.disabled =false;
         } else {
          this.postList =  this.totalData.slice(0,this.totalData.length);
          this.infiniteScroll.disabled =true;
        }
        this.scrollToTop(1);
        this.isLoadimage ={};
        this.isLoadVideoiamge ={};
        this.refreshImage();
        this.initnodeStatus(this.postList);
      });
    });

    this.events.subscribe("feeds:friendConnectionChanged", (nodeId, status)=>{
      this.zone.run(()=>{
        this.nodeStatus[nodeId] = status;
      });
    });

   this.events.subscribe("feeds:editPostFinish",()=>{
    this.zone.run(()=>{
      this.totalData = this.feedService.getPostList() || [];
      if (this.totalData.length - this.pageNumber > this.pageNumber){
        this.postList = this.totalData.slice(0,(this.startIndex)*this.pageNumber);
        this.infiniteScroll.disabled =false;
       } else {
        this.postList =  this.totalData;
        this.infiniteScroll.disabled =true;
      }
      this.isLoadimage ={};
      this.isLoadVideoiamge ={};
      this.refreshImage();
      this.initnodeStatus(this.postList);

    });
   });

   this.events.subscribe("feeds:deletePostFinish",()=>{
    this.zone.run(()=>{
      this.native.hideLoading();
      this.totalData = this.feedService.getPostList() || [];
      if (this.totalData.length - this.pageNumber > this.pageNumber){
        this.postList = this.totalData.slice(0,(this.startIndex)*this.pageNumber);
        this.infiniteScroll.disabled =false;
       } else {
        this.postList =  this.totalData;
        this.infiniteScroll.disabled =true;
      }
      this.isLoadimage ={};
      this.isLoadVideoiamge ={};
      this.refreshImage();
      this.initnodeStatus(this.postList);

    });
   });

   this.events.subscribe("update:tab",()=>{
 
    this.totalData = this.feedService.getPostList() || [];
    if (this.totalData.length - this.pageNumber > this.pageNumber){
      this.postList = this.totalData.slice(0,(this.startIndex)*this.pageNumber);
      this.infiniteScroll.disabled =false;
     } else {
      this.postList =  this.totalData;
      this.infiniteScroll.disabled =true;
    }
    this.initnodeStatus(this.postList);

   });
   
  }

 ionViewWillLeave(){
    this.events.unsubscribe("feeds:updateTitle");
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:postDataUpdate");
    this.events.unsubscribe("feeds:friendConnectionChanged");
    this.events.unsubscribe("feeds:publishPostFinish");
    this.events.unsubscribe("feeds:editPostFinish");
    this.events.unsubscribe("feeds:deletePostFinish");
    this.isLoadimage ={};
    this.isLoadVideoiamge ={};
    this.curPost={};
}

  ionViewDidLeave() {
    this.events.unsubscribe("update:tab");
  }

  ionViewWillUnload() {
    console.log('即将卸载销毁');
}

  getChannel(nodeId, channelId):any{
    return this.feedService.getChannelFromId(nodeId,channelId);
  }

  getContent(nodeChannelPostId: string){
  }

  getContentText(content: string): string{
    return this.feedService.parsePostContentText(content);
  }

  getContentImg(content: any): string{
    return this.feedService.parsePostContentImg(content);
  }

  getChannelOwnerName(nodeId, channelId): string{
    let channel = this.getChannel(nodeId, channelId) || "";
    if (channel === "") {
      return "";
    } else {
      return UtilService.moreNanme(channel["owner_name"],40);
    }
  }

  ngOnInit() {
    this.myScrollContainer = this.elmRef.nativeElement.querySelector('#my-scroll-container');
  }

  like(nodeId, channelId, postId){
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

  navTo(nodeId, channelId){
    this.native.getNavCtrl().navigateForward(['/channels', nodeId, channelId]);
  }

  navToPostDetail(nodeId, channelId, postId){
    this.native.getNavCtrl().navigateForward(['/postdetail',nodeId, channelId,postId]);
  }

  refresh(){
  }

  showCommentPage(nodeId, channelId, postId){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }
    
    this.native.navigateForward(["comment",nodeId,channelId,postId],"");
  }

  checkMyLike(nodeId: string, channelId: number, postId: number){
    return this.feedService.checkMyLike(nodeId, channelId, postId);
  }

  exploreFeeds(){
    this.tabs.select("search");
    this.feedspage.search();
  }

  parseAvatar(nodeId: string, channelId: number): string{
    let channel = this.getChannel(nodeId, channelId);
    if (channel == null || channel == undefined)
      return "";
    return this.feedService.parseChannelAvatar(channel.avatar);
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
    this.curPost = post;
    let channel = this.getChannel(post.nodeId, post.channel_id);
    if (channel == null || channel == undefined)
      return ;
    let channelName = channel.name;
   

    let isMine = this.checkChannelIsMine(post.nodeId, post.channel_id);
      if(isMine === 0 && post.post_status != 1){
        this.menuService.showHomeMenu(post.nodeId, Number(post.channel_id),channelName,Number(post.id));
      }else{
        this.menuService.showChannelMenu(post.nodeId, Number(post.channel_id),channelName);
      }
  }

  getChannelName(nodeId: string, channelId: number): string{
    let channel = this.getChannel(nodeId, channelId) || "";
    if (channel == "")
       return "";
    return UtilService.moreNanme(channel.name);
  }

  checkServerStatus(nodeId: string){
    return this.feedService.getServerStatusFromId(nodeId);
  }

  initnodeStatus(arr){
    for(let index =0 ;index<arr.length;index++){
      let nodeId = arr[index]['nodeId'];
      let status = this.checkServerStatus(nodeId);
      this.nodeStatus[nodeId] = status;

      let post = arr[index];
      //this.getImage(post.nodeId, post.channel_id, post.id);
      this.feedService.readChannel(post.nodeId+post.channel_id);
    }
  }

  moreName(name:string){
    return UtilService.moreNanme(name);
  }

  loadData(event){
   let sId = setTimeout(() => {
      let arr = [];        
       if(this.totalData.length - this.pageNumber*this.startIndex>this.pageNumber){
        arr = this.totalData.slice(this.startIndex*this.pageNumber,(this.startIndex+1)*this.pageNumber);
        this.startIndex++;
        this.zone.run(()=>{
        this.postList = this.postList.concat(arr);
        });
        this.initnodeStatus(arr);
        this.refreshImage();
        event.target.complete();
       }else{
        arr = this.totalData.slice(this.startIndex*this.pageNumber,this.totalData.length);
        this.zone.run(()=>{
            this.postList = this.postList.concat(arr);
        });
        this.infiniteScroll.disabled =true;
        this.initnodeStatus(arr);
        this.refreshImage();
        event.target.complete();
       }
      clearTimeout(sId);
    }, 500);
  }

  doRefresh(event){
    let sId =  setTimeout(() => {
      this.images = {};
      this.infiniteScroll.disabled =false;
      this.startIndex = 0;
      this.totalData = this.feedService.getPostList() || [];
      if(this.totalData.length - this.pageNumber > this.pageNumber){
        this.postList = this.totalData.slice(this.startIndex,this.pageNumber);
        this.startIndex++;
        this.infiniteScroll.disabled =false;
       }else{
        this.postList = this.totalData.slice(0,this.totalData.length);
        this.infiniteScroll.disabled =true;
      }
      this.initnodeStatus(this.postList);
      this.isLoadimage ={};
      this.isLoadVideoiamge ={};
      this.refreshImage();
      event.target.complete();
      clearTimeout(sId);
    },500);
  }

  getImage(nodeId: string, channelId: number, postId: number){
    let nodeChannelPostId = nodeId + channelId + postId;
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

  scrollToTop(int) {
   let sid = setTimeout(() => {
      this.content.scrollToTop(1);
      clearTimeout(sid)
    }, int);
  }

  pressName(nodeId:string,channelId: number){
    let name ="";
    let channel = this.getChannel(nodeId, channelId) || "";
    if (channel != ""){
      name = channel.name || "";
    }
    if(name != "" && name.length>15){
      this.native.createTip(name);
    }
  }

  pressOwnName(nodeId:string,channelId: number){

    let name ="";
    let channel = this.getChannel(nodeId, channelId) || "";
    if (channel != "") {
         name  =  channel["owner_name"] || "";
    }

    if(name != "" && name.length>40){
      this.native.createTip(name);
    }

  }

  checkChannelIsMine(nodeId:string,channelId:number){
    if (this.feedService.checkChannelIsMine(nodeId,channelId))
      return 0;
    
    return 1;
  }

  showComment(nodeId, channelId, postId) {
    this.postId = postId;
    this.channelId = channelId;
    this.nodeId = nodeId;
    this.channelAvatar = this.parseAvatar(nodeId, channelId);
    this.channelName = this.getChannelName(nodeId, channelId);
    this.hideComment = false;
  }

  hideComponent(event) {
    console.log('Hide comment component?', event);
    this.postId = null;
    this.channelId = null;
    this.nodeId = null;
    this.channelAvatar = null;
    this.channelName = null;
    this.hideComment = true;
  }

  setVisibleareaImage(){
    let postgridList = document.getElementsByClassName("post-grid");
    let postgridNum = document.getElementsByClassName("post-grid").length;

    for(let postgridindex =0;postgridindex<postgridNum;postgridindex++){ 
      let id = postgridList[postgridindex].getAttribute("id") || '';

      //postImg
      this.handlePsotImg(id,postgridindex);

      //video
      this.hanldVideo(id,postgridindex);
   
    }

  
  }

  ionViewDidEnter() {
    this.refreshImage();
  }


  showBigImage(id:any){
    let idStr = id+"postimg";
    let content = document.getElementById(idStr).getAttribute("src") || "";
    if(content!=''){
      this.native.openViewer(content,"common.image","FeedsPage.tabTitle1");
    }
  }


  handlePsotImg(id:string,rowindex:number){
    // 13 存在 12不存在
    let isload = this.isLoadimage[id] || "";
    let rpostimg = document.getElementById(id+"rpostimg");
    let postImage = document.getElementById(id+"postimg");
    try {
      if(id!=''&&isload === ""&&postImage.getBoundingClientRect().bottom>=0&&postImage.getBoundingClientRect().top<=this.clientHeight){
          rpostimg.style.display = "none";
          this.isLoadimage[id] = "11";
         this.feedService.loadPostContentImg(id).then((imagedata)=>{
              let image = imagedata || "";
              if(image!=""){
                this.isLoadimage[id] ="13";
                rpostimg.style.display = "block";
                postImage.setAttribute("src",image);
              }else{
                this.isLoadimage[id] ="12";
                rpostimg.style.display = 'none'; 
              }
            }).catch(()=>{
              rpostimg.style.display = 'none'; 
              console.log("getImageError");
            })
      }else{
        //  let postImageSrc = postImage.getAttribute("src") || "";
        // if(this.isLoadimage[id]==="13"&&postImageSrc!=""){ 
        //   //console.log("====移除==="+rowindex+"-"+postImage.getBoundingClientRect().bottom);
        //   console.log("====移除==="+rowindex+"-"+JSON.stringify(postImage.getBoundingClientRect()));
        //   this.isLoadimage[id] = "";
        //   postImage.removeAttribute("src");
        // }
      }
    } catch (error) {
    
    }
  }

  hanldVideo(id:string,rowindex:number){

    let  isloadVideoImg  = this.isLoadVideoiamge[id] || "";
    let  vgplayer = document.getElementById(id+"vgplayer");
    let  video:any = document.getElementById(id+"video");
    let  source = document.getElementById(id+"source");
    try {
      if(id!=''&&isloadVideoImg===""&&video.getBoundingClientRect().bottom>=0&&video.getBoundingClientRect().top<=this.clientHeight){
        //console.log("========="+rowindex+"==="+video.getBoundingClientRect().top);
        this.isLoadVideoiamge[id] = "11";
        vgplayer.style.display = "none";
        this.feedService.loadVideoPosterImg(id).then((imagedata)=>{
            let image = imagedata || "";
            if(image!=""){
              this.isLoadVideoiamge[id] = "13";
              vgplayer.style.display = "block";
              video.setAttribute("poster",image);
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
              //console.log("========="+rowindex);
              video.style.display='none';
              vgplayer.style.display = 'none'; 
            }
          }).catch(()=>{
            vgplayer.style.display = 'none'; 
            console.log("getImageError");
          });
      }else{
        // let postSrc =  video.getAttribute("poster") || "";
        // if(this.isLoadVideoiamge[id]==="13"&&postSrc!=""){
        //   video.pause();
        //   video.removeAttribute("poster");
        //   source.removeAttribute("src");
        //   this.isLoadVideoiamge[id]="";
        // }
      }
    } catch (error) {
    
    }
  }

  ionScroll(){
    this.native.throttle(this.setVisibleareaImage(),200,this,true);
  }


  refreshImage(){
    let sid = setTimeout(()=>{
        //this.isLoadimage ={};
        //this.isLoadVideoiamge ={};
        this.setVisibleareaImage();
        clearTimeout(sid);
     },0);
  }
}
