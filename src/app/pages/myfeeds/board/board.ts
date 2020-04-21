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
  private myEvents: any ;
  private nodeId: string;
  private topic: string;
  private title: string;
  private newEvent: string = "";
  constructor(
    private events: Events,
    private feedService: FeedService,
    private router: Router,
    private zone: NgZone,
    private acRoute: ActivatedRoute,
    private popup: PopupProvider,
    private navCtrl: NavController,
    private native: NativeService,
    private popover: PopoverController) {
      this.connectStatus = this.feedService.getConnectionStatus();
      this.newEvent = "";
      
      acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
        this.topic = data.topic;
        this.title = this.topic;
        this.isArchive = this.feedService.getArcstatus(this.nodeId, this.topic);
        this.myEvents = this.feedService.getMyFeedEvents(this.nodeId,this.topic);
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
            this.myEvents = this.feedService.getMyFeedEvents(this.nodeId,this.topic);
        });
      });
      
    }

  ngOnInit() {
  }

  navigateBack() {
    this.navCtrl.pop();
  }

  async openPopOverComponent() {
    this.popover.create(
      {
        component:PopovercomponentPage,
        componentProps: {nodeId:this.nodeId,topic:this.topic},
        cssClass: 'bottom-sheet-popover'
      }).then((popoverElement)=>{
        popoverElement.present();
      })
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
