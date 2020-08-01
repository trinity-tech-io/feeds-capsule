import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { PopupProvider } from 'src/app/services/popup';
import { Router } from '@angular/router';

@Component({
  selector: 'page-myfeeds',
  templateUrl: './myfeeds.html',
  styleUrls: ['./myfeeds.scss']
})

export class MyfeedsPage implements OnInit {
  private connectStatus = 1;
  private myfeeds: any;
  private channels: any;

  constructor(
    public feedService: FeedService,
    public navCtrl: NavController,
    private events: Events,
    private router: Router,
    private zone: NgZone,
    private popup: PopupProvider) {
    
    this.connectStatus = this.feedService.getConnectionStatus();
    // this.myfeeds = feedService.getMyFeeds();
    this.channels = this.feedService.refreshMyChannels();
    this.events.subscribe('feeds:ownFeedListChanged', (feedList) => {
      this.zone.run(() => {
        this.myfeeds = feedList;
      });
    });

    this.events.subscribe('feeds:connectionChanged', connectionStatus => {
      this.zone.run(() => {
          this.connectStatus = connectionStatus;
      });
    });
    
    this.events.subscribe('feeds:createTopicSuccess',()=>{
      this.zone.run(() => {
        this.channels = this.feedService.getMyChannelList();
      });
    });

    this.events.subscribe('feeds:refreshMyChannel',(list) => {
      this.zone.run(() => {
        this.channels = list;
      });
    });
  }

  ngOnInit() {
  }

  public navigateToBoardPage(nodeId: string, id: number, name: string) {
    this.router.navigate(['/menu/myfeeds/board/', nodeId, id, name]);
  }

  archive(nodeId: string, topic: string , slide: any) {
    slide.close();

    this.popup.ionicConfirm("Prompt","Whether to archive "+topic,"ok","cancel").then((data)=>{
      if (data){
        // this.feedService.updateMyFeedArchiveStatus(nodeId,topic,true);
      }
    });
  }

  unarchive(nodeId: string, topic: string , slide: any){
    slide.close();
    this.popup.ionicConfirm("Prompt","Whether to unarchive "+topic,"ok","cancel").then((data)=>{
      if (data){
        // this.feedService.updateMyFeedArchiveStatus(nodeId,topic,false);
      }
    });

  }

  doRefresh(event) {
    this.feedService.refreshMyChannels();
    this.events.subscribe('feeds:refreshMyChannel',(list) => {
      this.zone.run(() => {
        this.channels = list;
      });
    });
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  loadData(event) {
    this.feedService.loadMoreMyChannels();
    setTimeout(() => {
      event.target.complete();
    }, 500);
  }
}
