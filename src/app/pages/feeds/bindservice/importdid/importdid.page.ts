import { Component, OnInit, NgZone } from '@angular/core';
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
    private zone: NgZone,
    private events: Events,
    private acRoute: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController,
    private feedService:FeedService,
    ) {
      acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
      });

      // this.events.subscribe('feeds:did_imported', (nodeId, did, payload) => {
      //   this.navCtrl.pop().then(()=>{
      //     this.router.navigate(['/bindservice/publishdid/',nodeId, did, payload]);
      //   });
      // });

      this.events.subscribe('feeds:resolveDidError', (nodeId, did, payload) => {
        this.zone.run(() => {
          this.navCtrl.pop().then(()=>{
            this.router.navigate(['/bindservice/publishdid/',nodeId, did, payload]);
          });
        });
      });

      this.events.subscribe('feeds:resolveDidSucess', (nodeId, did) => {
        this.zone.run(() => {
          this.navCtrl.pop().then(()=>{
            this.router.navigate(['/bindservice/issuecredential', nodeId, did]);
          });
        });
      });


      
    }

  ngOnInit() {
  }

  createNewDid(){
    this.feedService.createDidRequest(this.nodeId);
  }

  importDid(){
    this.router.navigate(['/bindservice/importmnemonic', this.nodeId]);
  }

  abort(){
    this.navCtrl.pop();
  }

}
