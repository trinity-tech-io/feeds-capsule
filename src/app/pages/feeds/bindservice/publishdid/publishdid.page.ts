import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { FeedService } from 'src/app/services/FeedService';

@Component({
  selector: 'app-publishdid',
  templateUrl: './publishdid.page.html',
  styleUrls: ['./publishdid.page.scss'],
})
export class PublishdidPage implements OnInit {
  private payload: string;
  private nodeId = "";
  private did = "";
  constructor(
    private acRoute: ActivatedRoute,
    private router: Router,
    private feedService:FeedService,
    private navCtrl: NavController
    ) {
      acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
        this.did = data.did;
        this.payload = data.payload;
      });
    }

  ngOnInit() {
  }

  publishDid(){
    // this.navCtrl.pop().then(()=>{
    //   this.router.navigate(['/bindservice/issuecredential']);
    // });

    this.feedService.publishDid(this.payload, 
      (response)=>{
        if (response.result && response.result.txid) {
          this.navCtrl.pop().then(()=>{
            this.router.navigate(['/bindservice/issuecredential',this.nodeId, this.did]);
          });
        }
      },
      (err)=>{
        alert("error");
      });
  }

  issueCredential(){
    this.navCtrl.pop().then(()=>{
      this.router.navigate(['/bindservice/issuecredential',this.nodeId, this.did]);
    });
  }

  abort(){
    this.navCtrl.pop();
  }

}
