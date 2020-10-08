import { Component, OnInit, NgZone,ViewChild} from '@angular/core';
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

  constructor(
    private popoverController:PopoverController,
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
    let server = this.feedService.getServerbyNodeId(this.nodeId)||undefined;
    
    if (server == undefined ||server.elaAddress == undefined || server.elaAddress == ""){
      this.native.toast('common.noElaAddress');
      return;
    }

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
    }else{
      this.postList = this.totalData.slice(0,this.totalData.length);
      this.infiniteScroll.disabled =true;
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
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
    
    this.styleObj.width = (screen.width - 105)+'px';
    //this.startIndex = 0;
    this.init();
    //this.scrollToTop(1);
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


  doRefresh(event:any){
    let sId =  setTimeout(() => {
      this.images = {};
      this.startIndex = 0;
      this.init();
      this.initStatus(this.postList);
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
        this.initStatus(arr);
        this.postList = this.postList.concat(arr);
       });
       event.target.complete();
      }else{
       arr = this.totalData.slice(this.startIndex*this.pageNumber,this.totalData.length);
       this.zone.run(()=>{
          this.initStatus(arr);
          this.postList =  this.postList.concat(arr);
       });
       this.infiniteScroll.disabled =true;
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

}
