import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { Events } from '@ionic/angular';

@Component({
  selector: 'app-importdid',
  templateUrl: './importdid.page.html',
  styleUrls: ['./importdid.page.scss'],
})
export class ImportdidPage implements OnInit {
  private nodeId = "";
  constructor(
    private events: Events,
    private acRoute: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController,
    private feedService:FeedService,
    ) {
      acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
        console.log(this.nodeId);
      });

      this.events.subscribe('feeds:did_imported', (nodeId, did, payload) => {
        console.log("nodeId ==>" + nodeId);
        console.log("did ==>" + did);
        console.log("payload ==>" + payload);

        this.navCtrl.pop().then(()=>{
          this.router.navigate(['/bindservice/publishdid/',nodeId, did, payload]);
        });
      });


    }

  ngOnInit() {
  }

  createNewDid(){

    // this.navCtrl.pop().then(()=>{
    //   this.router.navigate(['/bindservice/publishdid/']);
    // });

    this.feedService.createDidRequest(this.nodeId);
  }

  importDid(){
    //TODO
    alert("TODO");
  }

  abort(){
    this.navCtrl.pop();
  }

}
