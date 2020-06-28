import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { Events } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-issuecredential',
  templateUrl: './issuecredential.page.html',
  styleUrls: ['./issuecredential.page.scss'],
})
export class IssuecredentialPage implements OnInit {
  private nodeId = "";
  private did = "";
  constructor(
    private zone: NgZone,
    private events: Events,
    private acRoute: ActivatedRoute,
    private feedService:FeedService,
    private router: Router,
    private navCtrl: NavController
    ) {
      acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
        this.did = data.did;
      });

      this.events.subscribe('feeds:issue_credential', () => {
        this.zone.run(() => {
          this.navCtrl.pop().then(()=>{
            this.router.navigate(['/bindservice/finish/',this.nodeId]);
          });
        });
      });
    }

  ngOnInit() {
  }
  issueCredential(){
    this.feedService.issueCredential(this.nodeId,this.did);
  }

  abort(){
    this.navCtrl.pop();
  }
}

