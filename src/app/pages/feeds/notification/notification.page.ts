import { Component, NgZone,ViewChild} from '@angular/core';
import { ActionSheetController} from '@ionic/angular';
import { Events } from 'src/app/services/events.service';
import { FeedService, Avatar } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { UtilService } from 'src/app/services/utilService';
import { TranslateService } from "@ngx-translate/core";
import { NativeService } from 'src/app/services/NativeService';
import { IonInfiniteScroll,IonContent} from '@ionic/angular';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TitleBarService } from 'src/app/services/TitleBarService';

@Component({
  selector: 'slides-example',
  templateUrl: './notification.page.html',
  styleUrls: ['./notification.page.scss'],
})
export class NotificationPage {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonContent,{static:true}) content: IonContent;
  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;

  public connectionStatus = 1;
  public avatar: Avatar;
  public notificationList = [];

  public startIndex = 0;
  public pageNumber = 8;
  public totalData:any = [];
  public notificationMenu:any = null;
  public notification:any = {};

  constructor(
    private native:NativeService,
    private zone: NgZone,
    private events: Events,
    public theme: ThemeService,
    private translate: TranslateService,
    private feedService: FeedService,
    private viewHelper: ViewHelper,
    private titleBarService: TitleBarService,
    private actionSheetController:ActionSheetController) {
    //this.notificationList = this.feedService.getNotificationList();
  }

  ngOnInit(): void {

  }
  ionViewWillEnter() {
    this.initTitleBar();
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.events.subscribe(FeedsEvent.PublishType.updateTitle,()=>{
      if(this.notificationMenu!=null){
          this.notificationMenu.dismiss();
          this.showNotificationMenu(this.notification);
      }
    });
    this.events.subscribe(FeedsEvent.PublishType.connectionChanged,(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.initRefresh();
    this.scrollToTop(1);
  }

  initTitleBar(){
    let title = this.translate.instant("FeedsPage.tabTitle3");
    this.titleBarService.setTitle(this.titleBar, title);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  initRefresh(){
    this.startIndex = 0;
    this.totalData = this.feedService.getNotificationList() || [];
    if(this.totalData.length - this.pageNumber > this.pageNumber){
      this.notificationList = this.totalData.slice(this.startIndex,this.pageNumber);
      this.startIndex++;
      this.infiniteScroll.disabled =false;
     }else{
      this.notificationList = this.totalData.slice(0,this.totalData.length);
      this.infiniteScroll.disabled =true;
    }
  }

  ionViewWillLeave(){
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
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
    this.feedService.deleteNotification(notification).then(()=>{
      this.initRefresh();
    });
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
      this.viewHelper.createTip(name);
    }
  }

  moremenu(notification:any){
    this.showNotificationMenu(notification);
  }

  async showNotificationMenu(notification:any){
    this.notification = notification;
    this.notificationMenu = await this.actionSheetController.create({
      cssClass: 'editPost',
      buttons: [
      {
          text: this.translate.instant("NotificationPage.deleteNotification"),
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.delete(notification);
          }
      },
      {
          text: this.translate.instant("common.cancel"),
          role: 'cancel',
          icon: 'close-circle',
          handler: () => {
              if(this.notificationMenu!=null){
                  this.notificationMenu.dismiss();
              }
          }
      }
  ]
    });

    this.notificationMenu.onWillDismiss().then(()=>{
      if(this.notificationMenu!=null){
          this.notificationMenu  = null;
      }

   });
  await this.notificationMenu.present();
  }
}
