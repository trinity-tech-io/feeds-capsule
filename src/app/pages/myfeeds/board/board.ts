import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events } from '@ionic/angular';
import { Router } from '@angular/router'
import { ActivatedRoute } from '@angular/router';
import { FeedService } from 'src/app/services/FeedService';
import { PopupProvider } from 'src/app/services/popup';
import { NativeService } from 'src/app/services/NativeService';
import { PopoverController } from '@ionic/angular';
import { PopovercomponentPage } from '../../../components/popovercomponent/popovercomponent.page';



@Component({
  selector: 'page-feed-board',
  templateUrl: './board.html',
  styleUrls: ['./board.scss'],
})
export class FeedBoardPage implements OnInit {
  private isArchive: boolean;
  private connectStatus = 1;
  // private myEvents: any ;
  private nodeId: string;
  private id: number;
  // private topic: string;
  private title: string;
  private newEvent: string = "";
  private posts: any=[];
  constructor(
    private popoverController: PopoverController,
    private events: Events,
    private feedService: FeedService,
    private router: Router,
    private zone: NgZone,
    private acRoute: ActivatedRoute,
    private popup: PopupProvider,
    private navCtrl: NavController,
    private native: NativeService) {
      this.connectStatus = this.feedService.getConnectionStatus();
      this.newEvent = "";
      
      acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
        this.id = data.id;
        this.title = data.name;
        
        // this.posts = this.feedService.refreshLocalPost("",this.id);
      });

      this.events.subscribe('feeds:connectionChanged', connectionStatus => {
        this.zone.run(() => {
            this.connectStatus = connectionStatus;
        });
      });

      this.events.subscribe('feeds:postEventSuccess', () => {
        this.zone.run(() => {
            this.native.toast("Post event success");
            this.newEvent = "";
            // this.myEvents = this.feedService.getMyFeedEvents(this.nodeId,this.topic);
            // this.posts = this.feedService.refreshLocalPost("",this.id);

        });
      });

      this.events.subscribe('feeds:refreshPost',(list)=>{
        this.zone.run(() => {
          this.posts = list;
        });
      });

      this.events.subscribe('feeds:updataPostLike',(nodeId, channelId, postId, likes)=>{
        this.zone.run(() => {
          for (let index = 0; index < this.posts.length; index++) {
            if (this.posts[index].postId == postId){
              this.posts[index].likes = likes;
            }
  
              
          }
        });
      });

      this.events.subscribe('feeds:updataComment',(nodeId, channelId, postId,comment)=>{
        this.zone.run(() => {
          for (let index = 0; index < this.posts.length; index++) {
            if (this.posts[index].postId == postId){
              this.posts[index].comment = comment;
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

  async openPopOverComponent() {
    this.popoverController.create(
      {
        component:PopovercomponentPage,
        componentProps: {nodeId:this.nodeId,id:this.id},
        cssClass: 'bottom-sheet-popover'
      }).then((popoverElement)=>{
        popoverElement.present();
      })
    }

  doRefresh(event) {
    // this.feedService.refreshLocalPost("",this.id);
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  loadData(event) {
    // this.feedService.loadMoreLocalPost("",this.id);
    setTimeout(() => {
      event.target.complete();
    }, 500);
  }

  like(channelId: number,postId: number){
    this.feedService.postLike(this.nodeId,channelId,postId,0);
  }

  navTo(channelId: number, postId: number){
    this.router.navigate(['/detail/',this.nodeId,channelId,postId]);
  }

  showCommentPage(event, channelId: number, postId: number){

  }
}
