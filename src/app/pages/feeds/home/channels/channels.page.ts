import { Component, OnInit, NgZone } from '@angular/core';
import { Events} from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { UtilService } from 'src/app/services/utilService';
import { MenuService } from 'src/app/services/MenuService';
import { TranslateService } from "@ngx-translate/core";



declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-channels',
  templateUrl: './channels.page.html',
  styleUrls: ['./channels.page.scss'],
})
export class ChannelsPage implements OnInit {
  public nodeStatus = {};
  private connectionStatus = 1;
  private channelAvatar = "";
  private channelName = "";
  private channelOwner = "";
  private channelDesc = "";
  private channelSubscribes = 0;
  private postList = [];

  private nodeId;
  private channelId;

  private followStatus = false;
  constructor(
    private zone: NgZone,
    private events: Events,
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private feedService: FeedService,
    public theme:ThemeService,
    private translate:TranslateService,
    private menuService: MenuService) {

   
  }

  subscribe(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }
    
    this.feedService.subscribeChannel(this.nodeId, Number(this.channelId));
  }

  tip(){
    this.native.toast_trans('common.commingSoon');
  }

  async unsubscribe(){
    this.menuService.showUnsubscribeMenu(this.nodeId, Number(this.channelId), this.channelName);
  }

  ngOnInit() {
    this.acRoute.params.subscribe((data)=>{
      this.nodeId = data.nodeId;
      this.channelId = data.channelId;
    });
  }

  init(){
    this.connectionStatus = this.feedService.getConnectionStatus();
    let channel = this.feedService.getChannelFromId(this.nodeId, this.channelId);
    this.checkFollowStatus(this.nodeId,this.channelId);
    if (channel == null || channel == undefined)
      return ;
      
    this.channelName = channel.name;
    this.channelOwner = this.feedService.indexText(channel.owner_name,25,25);
    this.channelDesc = channel.introduction;
    this.channelSubscribes = channel.subscribers;
    this.channelAvatar = this.feedService.parseChannelAvatar(channel.avatar);

    this.postList = this.feedService.getPostListFromChannel(this.nodeId, this.channelId);
    for(let index = 0;index<this.postList.length;index++){
           let nodeId = this.postList[index]['nodeId'];
           this.initnodeStatus(nodeId);
    }
  }

  ionViewWillEnter() {
    this.init();
    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });

    this.events.subscribe('feeds:refreshPage',()=>{
      this.zone.run(() => {
        this.postList = this.feedService.getPostListFromChannel(this.nodeId, this.channelId);
        for(let index = 0;index<this.postList.length;index++){
          let nodeId = this.postList[index]['nodeId'];
          this.initnodeStatus(nodeId);
   }
      });
    });

    this.events.subscribe('feeds:postDataUpdate',()=>{
      this.zone.run(() => {
        
        this.postList = this.feedService.getPostListFromChannel(this.nodeId, this.channelId);
        for(let index = 0;index<this.postList.length;index++){
          let nodeId = this.postList[index]['nodeId'];
          this.initnodeStatus(nodeId);
        }

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
        this.native.setRootRouter(['/tabs/home']);
      });
    });
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:updateTitle");
    this.events.unsubscribe("feeds:refreshPage");
    this.events.unsubscribe("feeds:postDataUpdate");
    this.events.unsubscribe("feeds:subscribeFinish");
    this.events.unsubscribe("feeds:unsubscribeFinish");
  }

  ionViewDidEnter() {
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("ChannelsPage.feeds"));
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
    this.native.getNavCtrl().navigateForward(['/channels', nodeId, channelId]);
  }

  navToPostDetail(nodeId, channelId, postId){
    this.native.getNavCtrl().navigateForward(['/postdetail',nodeId, channelId,postId]);
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

  menuMore(){
    this.menuService.showChannelMenu(this.nodeId, Number(this.channelId), this.channelName);
  }

  checkServerStatus(nodeId: string){
    return this.feedService.getServerStatusFromId(nodeId);
  }

  initnodeStatus(nodeId:string){
            let status = this.checkServerStatus(nodeId);
            this.nodeStatus[nodeId] = status;
  }
  
}
