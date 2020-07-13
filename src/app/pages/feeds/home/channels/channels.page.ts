import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events, PopoverController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { FeedService } from '../../../../services/FeedService';
import { NativeService } from '../../../../services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { UtilService } from 'src/app/services/utilService';
import { TranslateService } from "@ngx-translate/core";
import { Router } from '@angular/router'
import { CommentComponent } from '../../../../components/comment/comment.component'
import { ActionSheetController } from '@ionic/angular';

declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-channels',
  templateUrl: './channels.page.html',
  styleUrls: ['./channels.page.scss'],
})
export class ChannelsPage implements OnInit {
  private channelAvatar;
  private channelName;
  private channelOwner;
  private channelDesc;
  private channelSubscribes;
  private postList;

  private nodeId;
  private channelId;

  private followStatus = false;
  constructor(
    private navCtrl: NavController,
    private popoverController: PopoverController,
    private router: Router,
    private zone: NgZone,
    private events: Events,
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private feedService: FeedService,
    private actionSheetController:ActionSheetController,
    public theme:ThemeService,
    private translate:TranslateService
  ) {

    acRoute.params.subscribe((data)=>{
      this.nodeId = data.nodeId;
      this.channelId = data.channelId;

      let channel = this.feedService.getChannelFromId(this.nodeId, this.channelId);
      
      this.checkFollowStatus(this.nodeId,this.channelId);

      this.channelName = channel.name;
      // this.channelOwner = channel.owner_name;
      this.channelOwner = this.feedService.indexText(channel.owner_name,25,25);
      this.channelDesc = channel.introduction;
      this.channelSubscribes = channel.subscribers;
      this.channelAvatar = this.feedService.parseChannelAvatar(channel.avatar);

      this.postList = this.feedService.getPostListFromChannel(this.nodeId, this.channelId);
      // this.posts = this.feedService.refreshLocalPost("",this.id);
    });

    this.events.subscribe('feeds:postDataUpdate',()=>{
      this.zone.run(() => {
        
        this.postList = this.feedService.getPostListFromChannel(this.nodeId, this.channelId);

      });
    });

    this.events.subscribe('feeds:subscribeFinish', (nodeId, channelId, name)=> {
      this.zone.run(() => {
        this.checkFollowStatus(this.nodeId,this.channelId);
      });
    });

    this.events.subscribe('feeds:unsubscribeFinish', (nodeId, channelId, name) => {
      this.zone.run(() => {
        this.checkFollowStatus(this.nodeId,this.channelId);
      });
    });
  }

  subscribe(){
    this.feedService.subscribeChannel(this.nodeId, Number(this.channelId));
  }

  async unsubscribe(){
    const actionSheet = await this.actionSheetController.create({
      buttons: [{
        text: 'Unsubscribe @'+this.channelName+"?",
        icon: 'trash',
        handler: () => {
          this.feedService.unsubscribeChannel(this.nodeId,Number(this.channelId));
        }
      },{
        text: 'Cancel',
        icon: 'close',
        handler: () => {
        }
      }]
    });
    await actionSheet.present();
  }

  ngOnInit() {
    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

  ionViewWillUnload(){
    this.events.unsubscribe("feeds:updateTitle");
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("ChannelsPage.feeds"));
  }

  like(nodeId, channelId, postId){
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
    return this.feedService.getChannelFromId(nodeId,channelId);
  }

  getContentText(content: string): string{
    return this.feedService.parsePostContentText(content);
  }

  getContentImg(content: any): string{
    return this.feedService.parsePostContentImg(content);
  }

  getChannelOwnerName(nodeId, channelId){
    let ownerName:string = this.getChannel(nodeId, channelId).owner_name
    return this.feedService.indexText(ownerName,25,25);
  }

  navTo(nodeId, channelId){
    this.router.navigate(['/channels', nodeId, channelId]);
  }

  navToPostDetail(nodeId, channelId, postId){
    this.router.navigate(['/postdetail',nodeId, channelId,postId]);
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
    if(obj.type==='m'){
      return obj.content+this.translate.instant('HomePage.minutesAgo');
    }
    if(obj.type==='h'){
      return obj.content+this.translate.instant('HomePage.hoursAgo');
    }
    return  obj.content;
  }

  menuMore(){
    alert("more");
  }
}
