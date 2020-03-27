import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events } from '@ionic/angular';
import { Router } from '@angular/router'
import { ActivatedRoute } from '@angular/router';
import { FeedService } from 'src/app/services/FeedService';
import { PopupProvider } from 'src/app/services/popup';
import { NativeService } from 'src/app/services/NativeService';


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
    private native: NativeService) {
      this.connectStatus = this.feedService.getConnectionStatus();
      this.newEvent = "";
      
      acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
        this.topic = data.topic;
        this.title = this.topic;

        
        this.isArchive = this.feedService.getArcstatus(this.nodeId, this.topic);

        // if () {
        //   document.getElementById("neweventblock").style.display = 'none';
        // }else{
        //   document.getElementById("neweventblock").style.display = 'block';
        // }
        // this.zone.run(() => {
        //   this.isArchive = data.archive;
        // });
        // console.log(this.isArchive);
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

  createNewEvent(){
    if (this.nodeId=="" || this.topic=="" || this.newEvent == ""){
      alert("Invalid params");
      return ;
    }
    this.popup.ionicConfirm("Prompt","The event '"+ this.newEvent+ "' will be created","ok","cancel").then((data)=>{
      if (data){
        
        this.feedService.postEvent(this.nodeId, this.topic, this.newEvent);
      }
    })
  }
}
