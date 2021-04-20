import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { IonTabs,Platform} from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { UtilService } from 'src/app/services/utilService';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { FeedsPage } from 'src/app/pages/feeds/feeds.page'
import { AppService } from 'src/app/services/AppService';
import { ViewHelper } from 'src/app/services/viewhelper.service';

@Component({
  selector: 'app-likes',
  templateUrl: './likes.component.html',
  styleUrls: ['./likes.component.scss'],
})
export class LikesComponent implements OnInit {

  @Input() likeList:any =[];
  @Input() nodeStatus:any = {};
  @Input() isLoadVideoiamge:any ={};

  @Input() isImgLoading:any ={};
  @Input() isImgPercentageLoading:any={};
  @Input() imgloadingStyleObj:any={};
  @Input() imgPercent:number = 0;
  @Input() imgRotateNum:any = {};

  @Input() isVideoPercentageLoading:any = {};
  @Input() videoPercent:number = 0;
  @Input() videoRotateNum:any = {};
  @Input() isVideoLoading:any = {};
  @Input() videoloadingStyleObj:any = {};


  @Input() hideDeletedPosts:boolean = false;
  @Output() fromChild = new EventEmitter();
  @Output() commentParams = new EventEmitter();
  @Output() clickImage = new EventEmitter();
  @Output() toPage = new EventEmitter();

  public styleObj:any = {width:""};
  public maxTextSize = 240;
  public isPress:boolean = false;
  public isAndroid:boolean = true;
  constructor(
    private platform: Platform,
    private feedspage: FeedsPage,
    private tabs: IonTabs,
    private feedService :FeedService,
    public theme:ThemeService,
    private translate:TranslateService,
    private native:NativeService,
    public appService:AppService,
    private viewHelper: ViewHelper
  ) {
  }

  ngOnInit() {
    if(this.platform.is('ios')){
      this.isAndroid = true;
    }
    this.styleObj.width = (screen.width - 105)+'px';
  }

  channelName(nodeId, channelId){
     let channel = this.getChannel(nodeId,channelId) || "";
     if(channel === ""){
         return "";
     }else{
       return UtilService.moreNanme(channel["name"]);
     }
  }

  channelOwnerName(nodeId, channelId){
    let channel = this.getChannel(nodeId,channelId) || "";
    if(channel === ""){
        return "";
    }else{
      return UtilService.moreNanme(channel["owner_name"]);
    }
  }

  getChannel(nodeId, channelId):any{
    return this.feedService.getChannelFromId(nodeId,channelId)||"";
  }

  checkServerStatus(nodeId: string){
    return this.feedService.getServerStatusFromId(nodeId);
  }

  like(nodeId:string, channelId:number, postId:number){

    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    if(this.checkServerStatus(nodeId) != 0){
      this.native.toastWarn('common.connectionError1');
      return;
    }

    if (this.checkMyLike(nodeId,channelId,postId)){
      this.feedService.postUnlike(nodeId,Number(channelId),Number(postId),0);
      return ;
    }

    this.feedService.postLike(nodeId,Number(channelId),Number(postId),0);
  }

  getContentText(content: string): string{
    return this.feedService.parsePostContentText(content);
  }

  getContentShortText(post:any): string{
    let   content = post.content;
    let  text = this.feedService.parsePostContentText(content) || "";
    return text.substring(0,180)+"...";
  }


  getPostContentTextSize(content:string){
    let text = this.feedService.parsePostContentText(content);
    let size = UtilService.getSize(text);
    return size;
   }


  navTo(nodeId:string, channelId:number, postId:number){
    this.pauseVideo(nodeId+"-"+channelId+"-"+postId);
    this.toPage.emit({"nodeId":nodeId,"channelId":channelId,"page":"/channels"});
  }

  navToPostDetail(nodeId:string, channelId:number, postId:number,event?:any){
    if(this.isPress){
      this.isPress = false;
      return;
    }
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
    this.pauseVideo(nodeId+"-"+channelId+"-"+postId);
    this.toPage.emit({"nodeId":nodeId,"channelId":channelId,"postId":postId,"page":"/postdetail"});
  }

  checkMyLike(nodeId: string, channelId: number, postId: number){
    return this.feedService.checkMyLike(nodeId, channelId, postId);
  }

  parseAvatar(nodeId: string, channelId: number): string{
    return this.feedService.parseChannelAvatar(this.getChannel(nodeId, channelId).avatar || "");
  }

  exploreFeeds(){
    this.tabs.select("search");
    this.feedspage.search();
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

  menuMore(nodeId: string , channelId: number,postId:number){
    let channelName = this.getChannel(nodeId, channelId).name;
    this.fromChild.emit({"nodeId":nodeId,"channelId":channelId,"channelName":channelName,"postId":postId,"tabType":"mylike"});
  }

  pressName(nodeId:string,channelId:string){

    let channel = this.getChannel(nodeId,channelId) || "";
    if(channel != ""){
      let name =channel["name"] || "";
      if(name != "" && name.length>15){
        this.viewHelper.createTip(name);
      }
    }
  }

  pressOwerName(nodeId:string,channelId:string){

    let channel = this.getChannel(nodeId,channelId) || "";
    if(channel != ""){
      let name =channel["owner_name"] || "";
      if(name != "" && name.length>15){
        this.viewHelper.createTip(name);
      }
    }
  }

  showComment(nodeId:string, channelId:number, postId:number) {

    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    if(this.checkServerStatus(nodeId) != 0){
      this.native.toastWarn('common.connectionError1');
      return;
    }

    this.commentParams.emit({
      nodeId: nodeId,
      channelId: channelId,
      postId: postId,
      onlineStatus:this.nodeStatus[nodeId],
      channelAvatar: this.parseAvatar(nodeId, channelId),
      channelName: this.channelName(nodeId, channelId),
    });
  }

  showBigImage(nodeId:string,channelId:number,postId:number){
    this.clickImage.emit({"nodeId":nodeId,"channelId":channelId,"postId":postId,"tabType":"mylike"});
  }

  pauseVideo(id:string){

    let videoElement:any = document.getElementById(id+'videolike') || "";
    let source:any = document.getElementById(id+'sourcelike') || "";
    if(source!=""){
      videoElement.pause();
      source.removeAttribute('src'); // empty source
      let sid =setTimeout(()=>{
        videoElement.load();
        clearTimeout(sid);
      },10);

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


  handleTotal(post:any){
    let videoThumbKey = post.content["videoThumbKey"] || "";
    let duration = 29;
    if(videoThumbKey != ""){
      duration = videoThumbKey["duration"] || 0;
    }
    return UtilService.timeFilter(duration);
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

  clickDashang(nodeId:string,channelId:number,postId:number){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    let server = this.feedService.getServerbyNodeId(nodeId)|| {};
    let elaAddress = server["elaAddress"] || null;
    if (elaAddress == null){
      this.native.toast('common.noElaAddress');
      return;
    }
    this.pauseVideo(nodeId+"-"+channelId+"-"+postId);
    this.native.showPayPrompt(elaAddress);
  }

}
