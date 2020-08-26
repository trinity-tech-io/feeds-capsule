import { Component, OnInit,Input} from '@angular/core';
import { IonTabs} from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { UtilService } from 'src/app/services/utilService';
import { NativeService } from 'src/app/services/NativeService';
import { MenuService } from 'src/app/services/MenuService';
import { TranslateService } from "@ngx-translate/core";
import { FeedsPage } from 'src/app/pages/feeds/feeds.page'



@Component({
  selector: 'app-likes',
  templateUrl: './likes.component.html',
  styleUrls: ['./likes.component.scss'],
})
export class LikesComponent implements OnInit {
  private images = {};
  @Input() likeList:any =[];
  @Input() nodeStatus:any = {};
  constructor(
    private feedspage: FeedsPage,
    private tabs: IonTabs,
    private feedService :FeedService,
    public theme:ThemeService,
    private translate:TranslateService,
    private native:NativeService,
    private menuService: MenuService) {
     
  }

  ngOnInit() {
  
  
  }

  channelName(nodeId, channelId){
     let channel = this.getChannel(nodeId,channelId) || "";
     if(channel === ""){
         return "";
     }else{
       return UtilService.moreNanme(channel["name"]);
     }
  }

  channelOwnerName(nodeId, channelId){
    let channel = this.getChannel(nodeId,channelId) || "";
    if(channel === ""){
        return "";
    }else{
      return UtilService.moreNanme(channel["owner_name"]);
    }
  }

  getChannel(nodeId, channelId):any{
    return this.feedService.getChannelFromId(nodeId,channelId)||"";
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
    alert("TODO")
  }

  getContentText(content: string): string{
    return this.feedService.parsePostContentText(content);
  }

  getContentImg(content: any): string{
    return this.feedService.parsePostContentImg(content);
  }

  navTo(nodeId, channelId){
    this.native.getNavCtrl().navigateForward(['/channels', nodeId, channelId]);
  }

  navToPostDetail(nodeId, channelId, postId){
    this.native.getNavCtrl().navigateForward(['/postdetail',nodeId, channelId,postId]);
  }

  showCommentPage(nodeId, channelId, postId){
    this.native.navigateForward(["/comment",nodeId,channelId,postId],"");
  }

  checkMyLike(nodeId: string, channelId: number, postId: number){
    return this.feedService.checkMyLike(nodeId, channelId, postId);
  }

  parseAvatar(nodeId: string, channelId: number): string{
    return this.feedService.parseChannelAvatar(this.getChannel(nodeId, channelId).avatar || "");
  }

  exploreFeeds(){
    this.tabs.select("search");
    this.feedspage.search();
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
        return obj.content +this.translate.instant('HomePage.onedayAgo');
      }
      if(obj.content === 2){
        return this.translate.instant('common.yesterday');
      }
      return obj.content +this.translate.instant('HomePage.daysAgo');
    }
    return  obj.content;
  }

  menuMore(nodeId: string , channelId: number){
    let channelName = this.getChannel(nodeId, channelId).name;
    this.menuService.showChannelMenu(nodeId, channelId, channelName);
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

  pressName(nodeId:string,channelId:string){

    let channel = this.getChannel(nodeId,channelId) || "";
    if(channel != ""){
      let name =channel["name"] || "";
      if(name != "" && name.length>15){
        this.native.createTip(name);
      }
    }
  }

  pressOwerName(nodeId:string,channelId:string){
    
    let channel = this.getChannel(nodeId,channelId) || "";
    if(channel != ""){
      let name =channel["owner_name"] || "";
      if(name != "" && name.length>15){
        this.native.createTip(name);
      }
    }
  }

}
