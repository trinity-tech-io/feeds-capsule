import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-newevent',
  templateUrl: './newevent.page.html',
  styleUrls: ['./newevent.page.scss'],
})
export class NeweventPage implements OnInit {

  constructor(
    private acRoute: ActivatedRoute,
    private navCtrl: NavController) {
    acRoute.params.subscribe((data)=>{
      // console.log(JSON.stringify(data));
      // let nodeId = data.nodeId;
      // let topic = data.feedName;
      // console.log("fff =>"+"nodeId:"+nodeId+";"+"topic:"+topic);
      // this.feedEvents = feedService.getFeedEvents(nodeId+topic);
      // feedService.updatefavoriteUnreadState(nodeId,topic,0);

      // // this.feedEvents = serv.getFeedEvents(nodeId, topic, lastSeqno+1);
      // // feedService.fetchFeedEvents(nodeId, topic);

      alert(JSON.stringify(data));
      console.log(JSON.stringify(data));
    });
  }

  ngOnInit() {
  }

  navigateBack() {
    this.navCtrl.pop();
  }
}
