import { Component, NgZone,ViewChild} from '@angular/core';
import { Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { UtilService } from 'src/app/services/utilService';
import { TranslateService } from "@ngx-translate/core";
import { NativeService } from 'src/app/services/NativeService';
import { IonInfiniteScroll,IonContent} from '@ionic/angular';

@Component({
  selector: 'slides-example',
  templateUrl: './notification.page.html',
  styleUrls: ['./notification.page.scss'],
})
export class NotificationPage {
  @ViewChild(IonContent,{static:true}) content: IonContent;
  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;
  public connectionStatus = 1;
  public avatar:string = ""; 
  public notificationList = [];
  // Optional parameters to pass to the swiper instance. See http://idangero.us/swiper/api/ for valid options.
  slideOpts = {
    initialSlide: 2,
    speed: 400,
    slidesPerView: 3,
  };

  public startIndex = 0;
  public pageNumber = 8;
  public totalData:any = [];
  public isBottom:boolean = false;

  constructor(
    private native:NativeService,
    private zone: NgZone,
    private events: Events,
    public theme:ThemeService,
    private translate:TranslateService,
    private feedService :FeedService) {
    //this.notificationList = this.feedService.getNotificationList();
  }

  ngOnInit(): void {
    
  }
  ionViewWillEnter() {
    
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });
  
    this.initRefresh();
    this.scrollToTop(1);
  }

  initRefresh(){
    this.startIndex = 0;
    this.totalData = this.feedService.getNotificationList() || [];
    if(this.totalData.length - this.pageNumber > this.pageNumber){
      this.notificationList = this.totalData.slice(this.startIndex,this.pageNumber);
      this.startIndex++;
      this.isBottom = false;
      this.infiniteScroll.disabled =false;
     }else{
      this.notificationList = this.totalData.slice(0,this.totalData.length);
      this.isBottom =true;
      this.infiniteScroll.disabled =true;
    }
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:connectionChanged");
  }

  goToServer(){
    this.native.navigateForward(['/menu/servers'],"");
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

  getNotificationContent(notification: any): string{
    /*
    comment,
    likedPost,
    likedComment,
    follow
    */
    let nodeId = notification.details.nodeId;
    let channelId = notification.details.channelId;
    let postId = notification.details.postId;
    let commentId = notification.details.commentId;

    let post = this.feedService.getPostFromId(nodeId, channelId, postId);
    let comment = this.feedService.getCommentFromId(nodeId, channelId, postId, commentId);
    let channel = this.feedService.getChannelFromId(nodeId, channelId);

    switch(notification.behavior){
      case 0: 
      case 2:
        if (comment == undefined) return "";
        return this.getContentText(comment.content);
      case 1:
        if (post == undefined) return "";
        return this.getContentText(post.content);
      case 3:
        if (channel == undefined) return "";
        return channel.name;

      default:
        return "";
    }
  }

  deleteNotification(notification: any){
    this.feedService.deleteNotification(notification);

    let index = this.notificationList.indexOf(notification);
    this.notificationList.splice(index,1);
  }
  navTo(notification: any){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }
    
    let nodeId = notification.details.nodeId;
    let channelId = notification.details.channelId;
    let postId = notification.details.postId;
    this.feedService.setNotificationReadStatus(notification, 0);
    notification.readStatus = 0;
    switch(notification.behavior){
      case 0: 
      case 1:
      case 2:
        this.navToPostDetail(nodeId, channelId, postId);
        break;
      case 3:
        this.navToChannel(nodeId, channelId);
    }

  }
  navToChannel(nodeId, channelId){
    this.native.navigateForward(['/channels', nodeId, channelId],"");
  }

  navToPostDetail(nodeId, channelId, postId){
    this.native.navigateForward(['/postdetail',nodeId, channelId,postId],"");
  }

  getContentText(content: string): string{
    return this.feedService.parsePostContentText(content);
  }

  moreName(name:string){
     return UtilService.moreNanme(name);
  }

  delete(notification:any){
    this.feedService.deleteNotification(notification);
    //let index = this.notificationList.indexOf(notification);
    //this.notificationList.splice(index,1);
    
  }

  doRefresh(event:any){
    let sId =  setTimeout(() => {
      this.initRefresh();
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
        this.notificationList =  this.notificationList.concat(arr);
        });
        event.target.complete();
       }else{
        arr = this.totalData.slice(this.startIndex*this.pageNumber,this.totalData.length);
        this.zone.run(()=>{
          this.notificationList =  this.notificationList.concat(arr);
        });
        this.isBottom = true;
        this.infiniteScroll.disabled =true;
        event.target.complete();
       }
      clearTimeout(sId);
    }, 500);
  }

  scrollToTop(int) {
    let sid = setTimeout(() => {
       this.content.scrollToTop(1);
       clearTimeout(sid)
     }, int);
  }

  pressName(channelName:string){
    let name =channelName || "";
    if(name != "" && name.length>15){
      this.native.createTip(name);
    }
   }
}
