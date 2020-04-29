import { Component, OnInit , NgZone} from '@angular/core';
import { FeedService } from 'src/app/services/FeedService';
import { NavController , Events } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from 'src/app/services/NativeService';
import { ActionSheetController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'page-about-feed',
  templateUrl: './about.html',
  styleUrls: ['./about.scss']
})

export class FeedAboutPage implements OnInit {
  private description: string;
  private connectStatus = 1;
  private id;
  private name;
  private owner_name;
  private subscribers;
  private introduction;
  private isSubscribed;

  private nodeId;
  // private subscribeStatusMap: any;

  constructor(
    private events: Events,
    private zone: NgZone,
    private navCtrl: NavController,
    private feedService: FeedService,
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private router: Router,
    private actionSheetController:ActionSheetController) {
    this.connectStatus = this.feedService.getConnectionStatus();
    // this.subscribeStatusMap = this.feedService.getSubscribeStatusMap();  

    acRoute.params.subscribe((data)=>{
      this.nodeId = data.nodeId;
      this.id = data.id;
      let channel = this.feedService.getChannelFromId(this.nodeId,this.id); 
      this.name = channel.name;
      this.owner_name = channel.owner_name;
      this.subscribers = channel.subscribers;
      this.introduction = channel.introduction;
      this.isSubscribed = channel.isSubscribed;
    })

    this.events.subscribe('feeds:connectionChanged', connectionStatus => {
      this.zone.run(() => {
          this.connectStatus = connectionStatus;
      });
    });
    this.events.subscribe('feeds:subscribeFinish', (nodeId, channeldId, name)=> {
      this.native.toast(name + " subscribed");
      this.zone.run(() => {
        this.isSubscribed = !this.isSubscribed;
        // this.subscribeStatusMap = this.feedService.getSubscribeStatusMap();
      });
    });

    this.events.subscribe('feeds:unsubscribeFinish', (nodeId, channelId, name) => {
      this.native.toast(name + " unsubscribed");
      this.zone.run(() => {
        this.isSubscribed = !this.isSubscribed;
        // this.subscribeStatusMap = this.feedService.getSubscribeStatusMap();
      });
    });
  }

  ngOnInit() {
  }

  navigateBackPage() {
    this.navCtrl.pop();
  }

  subscribe(){
    // this.feedService.subscribe(nodeId, topic);
    this.feedService.subscribeChannel(this.nodeId, Number(this.id));
  }

  async unsubscribe(){
    const actionSheet = await this.actionSheetController.create({
      buttons: [{
        text: 'Unsubscribe @'+this.name+"?",
        icon: 'trash',
        handler: () => {
          this.feedService.unsubscribeChannel(this.nodeId,Number(this.id));
        }
      },{
        text: 'Cancel',
        icon: 'close',
        handler: () => {
        }
      }]
    });
    await actionSheet.present();
  }

  navigatePage(){
    this.router.navigate(['/menu/servers/server-info', this.feedService.queryServerDID(this.nodeId)]);
  }
}
