import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'page-content',
  templateUrl: './content.html',
  styleUrls: ['./content.scss']
})

export class FeedContentPage implements OnInit {
  feedEvents: any;

  constructor(
    private serv: FeedService,
    private acRoute: ActivatedRoute,
    private navCtrl: NavController) {

    acRoute.params.subscribe((data)=>{
      console.log(JSON.stringify(data));
      let nodeId = data.nodeId;
      let topic = data.feedName;
      let lastSeqno = Number(data.lastSeqno);

      if (lastSeqno == NaN) lastSeqno=0;
      console.log("fff =>"+"nodeId:"+nodeId+";"+"topic:"+topic+"seqno:"+lastSeqno);
      this.feedEvents = serv.getFeedEvents(nodeId, topic, lastSeqno+1);
    })
    
  }

  ngOnInit() {
  }

  navigateBack() {
    this.navCtrl.pop();
  }
}
