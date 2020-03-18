import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router'
import { ActivatedRoute } from '@angular/router';
import { FeedService } from 'src/app/services/FeedService';

@Component({
  selector: 'page-feed-board',
  templateUrl: './board.html',
  styleUrls: ['./board.scss'],
})
export class FeedBoardPage implements OnInit {
  private myEvents: any ;
  private nodeId: string;
  private topic: string;
  constructor(
    private feedService: FeedService,
    private router: Router,
    private acRoute: ActivatedRoute,
    private navCtrl: NavController) {
      
      acRoute.params.subscribe((data)=>{
        //TODO
        // this.myEvents = this.feedService.getMyFeedEvents(data.nodeId,data.topic);
        alert("BOARD =>"+JSON.stringify(data));
        console.log(JSON.stringify(data));

        this.nodeId = data.nodeId;
        this.topic = data.topic;

        this.myEvents = this.feedService.getMyFeedEvents(this.nodeId,this.topic);

        console.log(JSON.stringify(this.myEvents));
        alert(JSON.stringify(this.myEvents));
      });

      
    }

  // messages = [
  //   {
  //     timestamp: '12:00, December 10, 2019',
  //     message:
  //       `Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
  //       The key difference between the applications available here and what you will find in any other app store is
  //       Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
  //       the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`
  //   },
  //   {
  //     timestamp: '15:00, December 10, 2019',
  //     message:
  //       `Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
  //       The key difference between the applications available here and what you will find in any other app store is
  //       Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
  //       the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`
  //   },
  //   {
  //     timestamp: '15:00, December 12, 2019',
  //     message:
  //       `Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
  //       The key difference between the applications available here and what you will find in any other app store is
  //       Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
  //       the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`
  //   },
  //   {
  //     timestamp: '15:00, December 14, 2019',
  //     message:
  //       `Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
  //       The key difference between the applications available here and what you will find in any other app store is
  //       Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
  //       the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`
  //   }
  // ];

  ngOnInit() {
  }

  newEvent(){
    this.router.navigate(['/menu/myfeeds/newevent/',this.nodeId, this.topic]);
  }
  navigateBack() {
    this.navCtrl.pop();
  }
}
