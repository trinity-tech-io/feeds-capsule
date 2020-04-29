import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events, PopoverController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { CommentComponent } from '../../../components/comment/comment.component'

@Component({
  selector: 'page-content',
  templateUrl: './content.html',
  styleUrls: ['./content.scss']
})

export class FeedContentPage implements OnInit {
  private connectStatus = 1;
  private feedEvents: any;
  private title: string;
  private nodeId: string;
  private id: number;
  private ownerName: string;
  constructor(
    private popoverController: PopoverController,
    private feedService: FeedService,
    private acRoute: ActivatedRoute,
    private navCtrl: NavController,
    private events: Events,
    private router: Router,
    private zone: NgZone) {
    this.connectStatus = this.feedService.getConnectionStatus();

    acRoute.params.subscribe((data)=>{
      this.nodeId = data.nodeId;
      this.title = data.name;
      this.id = data.id;
      this.ownerName = data.ownerName;

      this.feedEvents = this.feedService.refreshLocalPost(this.nodeId,this.id);
    });

    this.events.subscribe('feeds:eventListChanged', (eventList) => {
      this.zone.run(() => {
        this.feedEvents = eventList;
      });
    });

    this.events.subscribe('feeds:connectionChanged', connectionStatus => {
      this.zone.run(() => {
          this.connectStatus = connectionStatus;
      });
    });

    this.events.subscribe('feeds:refreshPost',list =>{
      this.zone.run(() => {
        this.feedEvents = list;
      });
    });

    this.events.subscribe('feeds:loadMorePost',list =>{
      this.zone.run(() => {
          this.feedEvents = list;
      });
    });
    
    this.events.subscribe('feeds:updataPostLike',(nodeId, channelId, postId, likes)=>{
      this.zone.run(() => {
        for (let index = 0; index < this.feedEvents.length; index++) {
          if (this.feedEvents[index].postId == postId){
            this.feedEvents[index].likes = likes;
          }
        }
      });
    });

    this.events.subscribe('feeds:updataComment',(nodeId, channelId, postId,comment)=>{
      this.zone.run(() => {
        for (let index = 0; index < this.feedEvents.length; index++) {
          if (this.feedEvents[index].postId == postId){
            this.feedEvents[index].comment = comment;
          }
        }
      });
    });
  }

  ngOnInit() {
  }

  navigateBack() {
    this.navCtrl.pop();
  }

  doRefresh(event) {
    this.feedService.refreshPost(this.nodeId,this.id);
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  loadData(event) {
    this.feedService.loadMorePost(this.nodeId,this.id);
    setTimeout(() => {
      event.target.complete();
    }, 500);
  }

  like(channelId: number,postId: number){
    this.feedService.postLike(this.nodeId,channelId,postId,null);
  }

  navTo(channelId: number, postId: number){
    this.router.navigate(['/detail/',this.nodeId,channelId,postId]);
  }

  async showCommentPage(event, channelId: number, postId: number){
    const popover = await this.popoverController.create({
      component: CommentComponent,
      componentProps: {nodeId:this.nodeId,channelId:channelId,postId:postId},
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
}
