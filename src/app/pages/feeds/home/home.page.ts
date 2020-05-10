import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events } from '@ionic/angular';
import { FeedService } from '../../../services/FeedService';
import { Router } from '@angular/router'
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})


export class HomePage implements OnInit {
  private postList: any;
  constructor(
    private events: Events,
    private zone: NgZone,
    private feedService :FeedService,
    private router: Router) {
    this.postList = feedService.getPostList();

    this.events.subscribe('feeds:updatePost',(list)=>{
      this.zone.run(() => {
        this.postList = list;
      });
    });
  }

  
  getChannel(nodeId, channelId):any{
    return this.feedService.getChannelFromId(nodeId,channelId);
  }

  getChannelName(nodeId, channelId){
    return this.getChannel(nodeId, channelId).name;
  }

  ngOnInit() {
    // titleBarManager.setTitle("My Timeline");
    // titleBarManager.setBackgroundColor("#FFFFFF");
    // titleBarManager.setForegroundMode(TitleBarPlugin.TitleBarForegroundMode.DARK);
    // titleBarManager.setNavigationMode(TitleBarPlugin.TitleBarNavigationMode.HOME);
    
    // titleBarManager.setupMenuItems([{key: 'registerApp', iconPath: '/assets/images/register.png', title: 'Register Capsule'}], null);
  }

  like(nodeId, channelId, postId){
    this.feedService.postLike(nodeId,Number(channelId),Number(postId),null);
  }
 
  comment(){
    alert("TODO")
  }

  navTo(nodeId, channelId){
    this.router.navigate(['/feeds/tabs/home/channels', nodeId, channelId]);
  }

  navToPostDetail(nodeId, channelId, postId){
    this.router.navigate(['/feeds/tabs/home/postdetail',nodeId, channelId,postId]);
  }


}
