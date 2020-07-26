import { Component, OnInit, NgZone } from '@angular/core';
import { Events, PopoverController, IonTabs} from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { MenuService } from 'src/app/services/MenuService';
import { Router } from '@angular/router'
import { CommentComponent } from '../../../components/comment/comment.component'
import { FeedsPage } from '../feeds.page'
import { ThemeService } from 'src/app/services/theme.service';
import { UtilService } from 'src/app/services/utilService';
import { TranslateService } from "@ngx-translate/core";
import { NativeService } from 'src/app/services/NativeService';
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})


export class HomePage implements OnInit {
  private postList: any;
  private bigImageUrl: string;
  private bigImage: boolean = false;
  constructor(
    private feedspage: FeedsPage,
    private tabs: IonTabs,
    private popoverController: PopoverController,
    private events: Events,
    private zone: NgZone,
    private feedService :FeedService,
    private router: Router,
    public theme:ThemeService,
    private translate:TranslateService,
    private navtive:NativeService,
    private menuService: MenuService) {
      this.bigImage = false;
      this.postList = feedService.getPostList();
      this.events.subscribe('feeds:refreshPage',()=>{
        this.zone.run(() => {
          this.postList = this.feedService.getPostList();
        });
      });
        

      this.events.subscribe('feeds:postDataUpdate',()=>{
        this.zone.run(() => {
          this.postList = this.feedService.getPostList();
        });
      });
  }

  ionViewWillEnter() {
  
  }

  ionViewWillUnload(){
    this.popoverController.dismiss();
  }

  
  getChannel(nodeId, channelId):any{
    return this.feedService.getChannelFromId(nodeId,channelId);
  }

  getContentText(content: string): string{
    return this.feedService.parsePostContentText(content);
  }

  getContentImg(content: any): string{
    return this.feedService.parsePostContentImg(content);
  }

  getChannelOwnerName(nodeId, channelId): string{
    let channel = this.getChannel(nodeId, channelId);
    if (channel == null || channel == undefined){
      return "";
    }

    let owner: string = channel.owner_name;
    if (owner.length>25){
      return this.feedService.indexText(owner,25,25);
    }
    else{
      return owner;
    }
  }

  ngOnInit() {
  }

  like(nodeId, channelId, postId){
    if (this.checkMyLike(nodeId,channelId,postId)){
      this.feedService.postUnlike(nodeId,Number(channelId),Number(postId),0);
      return ;
    }

    this.feedService.postLike(nodeId,Number(channelId),Number(postId),0);
  }

  navTo(nodeId, channelId){
    this.navtive.getNavCtrl().navigateForward(['/channels', nodeId, channelId]);
  }

  navToPostDetail(nodeId, channelId, postId){
    this.navtive.getNavCtrl().navigateForward(['/postdetail',nodeId, channelId,postId]);
  }

  refresh(){
  }

  async showCommentPage(event, nodeId, channelId, postId){
    const popover = await this.popoverController.create({
      component: CommentComponent,
      componentProps: {nodeId: nodeId, channelId: channelId, postId: postId},
      event:event,
      translucent: true,
      cssClass: 'bottom-sheet-popover'
    });

    popover.onDidDismiss().then((result)=>{
      if(result.data == undefined){
        return;
      }
    });
    return await popover.present();
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

  menuMore(nodeId: string , channelId: number){
    let channel = this.getChannel(nodeId, channelId);
    if (channel == null || channel == undefined)
      return ;
    let channelName = channel.name;
    this.menuService.showChannelMenu(nodeId, channelId, channelName);
  }

  showBigImage(content: any){
    this.bigImage = true;
    this.bigImageUrl =  this.getContentImg(content);
  }

  hideBigImage(){
    this.bigImage = false;
  }

  getChannelName(nodeId: string, channelId: number): string{
    let channel = this.getChannel(nodeId, channelId);
    if (channel == null || channel == undefined)
      return "";
    return channel.name;
  }
}
