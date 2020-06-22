import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events } from '@ionic/angular';
import { Router } from '@angular/router';
import { FeedService } from 'src/app/services/FeedService';

@Component({
  selector: 'app-myfeeds',
  templateUrl: './myfeeds.component.html',
  styleUrls: ['./myfeeds.component.scss'],
})
export class MyfeedsComponent implements OnInit {
  private channels: any;
  constructor(
    private events: Events,
    private zone: NgZone,
    private router: Router,
    private feedService: FeedService) {

    this.channels = this.feedService.refreshMyChannels();
    
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

    this.events.subscribe('feeds:channelsDataUpdate', () =>{
      this.channels = this.feedService.getMyChannelList();
    });
  }

  ngOnInit() {}

  createNewFeed(){

    this.router.navigate(['/createnewfeed']);
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

  navTo(nodeId, channelId){
    this.router.navigate(['/feeds/tabs/home/channels', nodeId, channelId]);

  }

  bindServer(){
    // this.router.navigate(['/bindservice/scanqrcode']);
  }
}
