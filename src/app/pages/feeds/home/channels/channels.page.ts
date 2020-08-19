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
import { PopoverController,IonInfiniteScroll} from '@ionic/angular';


declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-channels',
  templateUrl: './channels.page.html',
  styleUrls: ['./channels.page.scss'],
})
export class ChannelsPage implements OnInit {
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

  public isBottom:boolean = false;
  public startIndex:number = 0;
  public pageNumber:number = 5;
  public totalData:any = [];
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
    let channel = this.feedService.getChannelFromId(this.nodeId, this.channelId);
    this.checkFollowStatus(this.nodeId,this.channelId);
    if (channel == null || channel == undefined)
      return ;
      
    this.channelName = channel.name;
    this.channelOwner = this.feedService.indexText(channel.owner_name,25,25);
    this.channelDesc = channel.introduction;
    this.channelSubscribes = channel.subscribers;
    this.channelAvatar = this.feedService.parseChannelAvatar(channel.avatar);

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
      this.postList = this.totalData.slice(this.startIndex,this.pageNumber);
      this.startIndex++;
      this.isBottom = false;
      this.infiniteScroll.disabled =false;
    }else{
      this.postList = this.totalData.slice(0,this.totalData.length);
      this.isBottom =true;
      this.infiniteScroll.disabled =true;
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
      return UtilService.moreNanme(channel["owner_name"]);
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
  
  async showPayPrompt(elaAddress:string) {
    this.isShowPrompt = true;
    this.popover = await this.popoverController.create({
      mode: 'ios',
      cssClass: 'genericPopup',
      component: PaypromptComponent,
      componentProps: {
        "title": this.translate.instant("ChannelsPage.tip"),
        "elaAddress":elaAddress,
        "defalutMemo":""
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
       this.isBottom = true;
       this.infiniteScroll.disabled =true;
       event.target.complete();
       clearTimeout(sId);
      }
    },500);
  }
}
