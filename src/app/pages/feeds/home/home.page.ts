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
   
    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe('feeds:publishPostFinish',()=>{
      this.zone.run(() => {
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
        this.initnodeStatus(this.postList);
      });
    });

    this.events.subscribe("feeds:friendConnectionChanged", (nodeId, status)=>{
      this.zone.run(()=>{
        this.nodeStatus[nodeId] = status;
      });
    });
  }

 ionViewWillLeave(){
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:postDataUpdate");
    this.events.unsubscribe("feeds:friendConnectionChanged");
    this.events.unsubscribe("feeds:publishPostFinish");
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

  menuMore(nodeId: string , channelId: number){
    let channel = this.getChannel(nodeId, channelId);
    if (channel == null || channel == undefined)
      return ;
    let channelName = channel.name;
    this.menuService.showChannelMenu(nodeId, channelId, channelName);
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
      this.getImage(post.nodeId, post.channel_id, post.id);
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
        event.target.complete();
       }else{
        arr = this.totalData.slice(this.startIndex*this.pageNumber,this.totalData.length);
        this.zone.run(()=>{
            this.postList = this.postList.concat(arr);
        });
        this.infiniteScroll.disabled =true;
        this.initnodeStatus(arr);
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
}
