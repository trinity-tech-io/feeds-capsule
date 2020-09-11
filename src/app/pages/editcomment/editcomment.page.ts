import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from '../../services/NativeService';
import { ThemeService } from '../../services/theme.service';
import { TranslateService } from "@ngx-translate/core";
import * as _ from 'lodash';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
@Component({
  selector: 'app-editcomment',
  templateUrl: './editcomment.page.html',
  styleUrls: ['./editcomment.page.scss'],
})
export class EditcommentPage implements OnInit{ 
public connectionStatus = 1;
public nodeStatus:any={};
public channelAvatar = "";
public channelName = "";
public subscribers:string = "";
public newComment: string="";
public oldNewComment: string="";
public nodeId: string ="";
public channelId: number= 0;
public postId: number = 0;
public commentById:Number = 0;
public commentId:Number = 0;
constructor(
  private events: Events,
  private native: NativeService,
  private acRoute: ActivatedRoute,
  private navCtrl: NavController,
  private zone: NgZone,
  private feedService: FeedService,
  public theme:ThemeService,
  private translate:TranslateService) { }

ngOnInit() {
  this.acRoute.queryParams.subscribe((data)=>{
    let item = _.cloneDeep(data);
    this.nodeId = item.nodeId;
    this.channelId = item.channelId;
    this.postId = item.postId;
    this.commentById = item.commentById;
    this.commentId = item.commentId;
  });
}

ionViewWillEnter() {
  this.connectionStatus = this.feedService.getConnectionStatus();
  let channel = this.feedService.getChannelFromId(this.nodeId,this.channelId) || {};
  this.channelName = channel["name"] || "";
  this.subscribers = channel["subscribers"] || "";
  this.channelAvatar = this.feedService.parseChannelAvatar(channel["avatar"]) || "";

  this.getContent();


  this.events.subscribe('feeds:connectionChanged',(status)=>{
    this.zone.run(() => {
      this.connectionStatus = status;
    });
  });

  this.events.subscribe("feeds:updateTitle",()=>{
    this.initTitle();
  });

  this.events.subscribe('rpcRequest:error', () => {
    this.zone.run(() => {
       this.native.hideLoading();
    });
  });

  this.events.subscribe('rpcResponse:error', () => {
    this.zone.run(() => {
      this.native.hideLoading();
    });
  });

 this.events.subscribe('editCommentFinish', () => {
  this.zone.run(() => {
    this.navCtrl.pop().then(()=>{
      this.native.hideLoading();
    });
  });
 });

 this.events.subscribe("feeds:friendConnectionChanged", (nodeId, status)=>{
  this.zone.run(()=>{
    this.nodeStatus[nodeId] = status;
  });
 });

  this.initnodeStatus();
}

ionViewDidEnter(){
  this.initTitle();
  this.native.setTitleBarBackKeyShown(true);
}

ionViewWillLeave(){
  this.events.unsubscribe("feeds:connectionChanged");
  this.events.unsubscribe("feeds:updateTitle");
  this.events.unsubscribe("rpcRequest:error");
  this.events.unsubscribe("rpcResponse:error");
  this.events.unsubscribe("editCommentFinish");
}

initTitle(){
  titleBarManager.setTitle(this.translate.instant("CommentPage.newComment"));
}

publishComment(){
  let newComment = this.native.iGetInnerText(this.newComment) || "";
  if(newComment===""){
    this.native.toast_trans('CommentPage.enterComments');
    return false;
  }

  if(this.newComment === this.oldNewComment){
    this.native.toast_trans("common.nochanges");
    return false;
  }

  this.native.showLoading("common.waitMoment").then(()=>{
         this.editComment();
  }).catch(()=>{
       this.native.hideLoading();
  });

}

editComment(){
   this.feedService.editComment(this.nodeId,Number(this.channelId),Number(this.postId),Number(this.commentId),Number(this.commentById),this.newComment);
}

checkServerStatus(nodeId: string){
  return this.feedService.getServerStatusFromId(nodeId);
}

initnodeStatus(){
   let status = this.checkServerStatus(this.nodeId);
  this.nodeStatus[this.nodeId] = status;
}

pressName(channelName:string){
  this.native.createTip(channelName);
}

getContent(){
  let post = this.feedService.getPostFromId(this.nodeId, this.channelId, this.postId);
  let postContent = post.content;
  this.newComment = this.feedService.parsePostContentText(postContent) || "";
  this.oldNewComment = this.feedService.parsePostContentText(postContent) || "";
}

}

