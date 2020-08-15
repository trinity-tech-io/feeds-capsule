import { Component, NgZone } from '@angular/core';
import { Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { UtilService } from 'src/app/services/utilService';
import { TranslateService } from "@ngx-translate/core";
import { NativeService } from 'src/app/services/NativeService';

@Component({
  selector: 'slides-example',
  templateUrl: './notification.page.html',
  styleUrls: ['./notification.page.scss'],
})
export class NotificationPage {
  private connectionStatus = 1;
  public avatar:string = ""; 
  private notificationList = [];
  // Optional parameters to pass to the swiper instance. See http://idangero.us/swiper/api/ for valid options.
  slideOpts = {
    initialSlide: 2,
    speed: 400,
    slidesPerView: 3,
  };
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

    this.notificationList = this.feedService.getNotificationList();
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

    if(obj.type === 'yesterday'){
      return this.translate.instant('common.yesterday');
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
}
