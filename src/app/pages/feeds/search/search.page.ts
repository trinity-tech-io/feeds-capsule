import { Component, OnInit, NgZone} from '@angular/core';
import { NavController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { Events } from '@ionic/angular';
import { Router } from '@angular/router';
import { PopupProvider } from 'src/app/services/popup';
import { NativeService } from 'src/app/services/NativeService';
import { ActionSheetController } from '@ionic/angular';


@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})
export class SearchPage implements OnInit {
  private channelList;
  private connectStatus = 1;
  // private subscribeStatusMap: any;
  constructor(
    private feedService: FeedService,
    private navCtrl: NavController,
    private events: Events,
    private zone: NgZone,
    private router: Router,
    private popup: PopupProvider,
    private native: NativeService,
    private actionSheetController:ActionSheetController) {
    
    // this.subscribeStatusMap = this.feedService.getSubscribeStatusMap();  
    this.connectStatus = this.feedService.getConnectionStatus();
    this.channelList = this.feedService.refreshLocalChannels();
    // this.feedService.refreshChannels();
    feedService.doExploreTopics();

    this.events.subscribe('feeds:connectionChanged', connectionStatus => {
      this.zone.run(() => {
          this.connectStatus = connectionStatus;
      });
    });

    this.events.subscribe('feeds:subscribeFinish', (nodeId, channelId, name)=> {
      this.native.toast(name + " subscribed");
      this.zone.run(() => {
        this.channelList = this.feedService.refreshLocalChannels();
      });
    });

    this.events.subscribe('feeds:unsubscribeFinish', (nodeId, channelId, name) => {
      this.native.toast(name + " unsubscribed");
      this.zone.run(() => {
        this.channelList = this.feedService.refreshLocalChannels();
      });
    });

    this.events.subscribe('feeds:refreshChannels', list =>{
      this.channelList = list;
    });

    this.events.subscribe('feeds:channelsDataUpdate', () =>{
      this.channelList = this.feedService.getChannelsList();
    });
    
  }

  ngOnInit() {
  }

  public navigateToDetailPage(nodeId: string, name: string, id: number) {
    this.router.navigate(['/favorite/search/about/', nodeId, name, id]);
  }

  navigateBackPage() {
    this.navCtrl.pop();
  }

  subscribe(nodeId: string, id: number){
    this.feedService.subscribeChannel(nodeId, id);
  }

  async unsubscribe(nodeId: string, name: string, id: number){
    const actionSheet = await this.actionSheetController.create({
      // header: 'Albums',
      buttons: [{
        text: 'Unsubscribe @'+name+"?",
        // role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.feedService.unsubscribeChannel(nodeId,id);
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
      this.channelList = this.feedService.refreshLocalChannels();
    }
    this.channelList = this.channelList.filter(
      channel=>channel.name.toLowerCase().indexOf(events.target.value.toLowerCase()) > -1
      );
  }

  doRefresh(event) {
    this.feedService.refreshChannels();
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  loadData(event) {
    setTimeout(() => {
      event.target.complete();
    }, 500);
  }
}