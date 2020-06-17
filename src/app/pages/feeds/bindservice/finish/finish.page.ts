import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-finish',
  templateUrl: './finish.page.html',
  styleUrls: ['./finish.page.scss'],
})
export class FinishPage implements OnInit {
  private nodeId = "";
  constructor(
    private router: Router,
    private navCtrl: NavController,
    private feedService:FeedService,
    private acRoute: ActivatedRoute
    ) {
      acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
        console.log(this.nodeId);
      });
    }

  ngOnInit() {
  }

  createChannel(){
    this.navCtrl.pop().then(()=>{
      this.router.navigate(['/createnewfeed']);
    });
  }

  returnMain(){
    this.navCtrl.pop();
  }

  signIn(){
    this.router.navigate(['/menu/servers']);
    // this.feedService.signinChallengeRequest(this.nodeId,false);
  }
}
