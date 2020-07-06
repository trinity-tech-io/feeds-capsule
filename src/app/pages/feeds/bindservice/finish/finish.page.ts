import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from 'src/app/services/NativeService';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-finish',
  templateUrl: './finish.page.html',
  styleUrls: ['./finish.page.scss'],
})
export class FinishPage implements OnInit {
  private title = "Binding server";
  private nodeId = "";
  constructor(
    private native: NativeService,
    private router: Router,
    private navCtrl: NavController,
    private feedService:FeedService,
    private acRoute: ActivatedRoute
    ) {

      acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
      });
    }
  ionViewDidEnter() {
    titleBarManager.setTitle(this.title);
    this.native.setTitleBarBackKeyShown(false);
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

  finish(){
    this.navCtrl.pop();
  }
}
