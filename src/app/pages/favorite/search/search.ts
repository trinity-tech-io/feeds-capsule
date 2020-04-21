import { Component, OnInit, NgZone} from '@angular/core';
import { NavController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { Events } from '@ionic/angular';
import { Router } from '@angular/router';
import { PopupProvider } from 'src/app/services/popup';
import { NativeService } from 'src/app/services/NativeService';
import { ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'page-search',
  templateUrl: './search.html',
  styleUrls: ['./search.scss']
})

export class SearchFeedPage implements OnInit {
  private feedList: FeedsData.AllFeed[];
  private connectStatus = 1;
  constructor(
    private feedService: FeedService,
    private navCtrl: NavController,
    private events: Events,
    private zone: NgZone,
    private router: Router,
    private popup: PopupProvider,
    private native: NativeService,
    private actionSheetController:ActionSheetController) {

    this.connectStatus = this.feedService.getConnectionStatus();

    feedService.doExploreTopics();
    this.feedList = feedService.getAllFeeds();

    this.events.subscribe('feeds:allFeedsListChanged', (feedList) => {
      this.zone.run(() => {
        this.feedList = feedList;
      });
    });
    this.events.subscribe('feeds:connectionChanged', connectionStatus => {
      this.zone.run(() => {
          this.connectStatus = connectionStatus;
      });
    });

    this.events.subscribe('feeds:subscribeFinish', topic => {
      this.native.toast(topic + " subscribed");
      // this.zone.run(() => {
      //   this.feedList = feedService.getAllFeeds();
      // });
    });

    this.events.subscribe('feeds:unsubscribeFinish', topic => {
      this.native.toast(topic + " unsubscribed");
      // this.zone.run(() => {
      //   this.feedList = feedService.getAllFeeds();
      // });
    });
  }

  ngOnInit() {
  }

  public navigateToDetailPage(nodeId: string, topic: string) {
    this.router.navigate(['/favorite/search/about/', nodeId, topic]);
  }

  navigateBackPage() {
    this.navCtrl.pop();
  }

  subscribe(nodeId: string, topic: string){
    // this.popup.ionicConfirm("Prompt","Are you sure to subscribe from "+topic+", and Receive new message push？","ok","cancel").then((data)=>{
    //   if (data){
    //     this.feedService.subscribe(nodeId, topic);
    //   }
    // });
    this.feedService.subscribe(nodeId, topic);
  }

  async unsubscribe(nodeId: string, topic: string){
    // this.popup.ionicConfirm("Prompt","Are you sure to unsubscribe from "+topic+"?","ok","cancel").then((data)=>{
    //   if (data){
    //     this.feedService.unSubscribe(nodeId, topic);
    //   }
    // });
    const actionSheet = await this.actionSheetController.create({
      // header: 'Albums',
      buttons: [{
        text: 'Unsubscribe @'+topic+"?",
        // role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.feedService.unSubscribe(nodeId, topic);
        }
      },{
        text: 'Cancel',
        icon: 'close',
        // role: 'cancel',
        handler: () => {
        }
      }]
    });
    await actionSheet.present();
  }

  getItems(events){
    if(events.target.value == ""){
      this.feedList = this.feedService.getAllFeeds();
    }
    this.feedList = this.feedList.filter(
      feed=>feed.topic.toLowerCase().indexOf(events.target.value.toLowerCase()) > -1
      );
  }

  doRefresh(event) {
    console.log('Begin async operation');

    setTimeout(() => {
      console.log('Async operation has ended');
      event.target.complete();
    }, 2000);
  }

  loadData(event) {
    setTimeout(() => {
      console.log('Done');
      event.target.complete();

      // App logic to determine if all data is loaded
      // and disable the infinite scroll
      // if (data.length == 1000) {
      //   event.target.disabled = true;
      // }
    }, 500);
  }
}
