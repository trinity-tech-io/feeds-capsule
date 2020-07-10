import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { Events } from '@ionic/angular';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-finish',
  templateUrl: './finish.page.html',
  styleUrls: ['./finish.page.scss'],
})
export class FinishPage implements OnInit {
  private title = "FinishPage.bindingServer";
  private nodeId = "";
  constructor(
    private native: NativeService,
    private router: Router,
    private navCtrl: NavController,
    private feedService:FeedService,
    private acRoute: ActivatedRoute,
    private translate:TranslateService,
    private events: Events,
    ) {

      acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
      });
    }
    ionViewDidEnter() {
      this.events.subscribe("feeds:updateTitle",()=>{
        this.initTitle();
      });
      this.initTitle();
      this.native.setTitleBarBackKeyShown(false);
    }
  
    ionViewWillUnload(){
      this.events.unsubscribe("feeds:updateTitle");
    }
  
  
    initTitle(){
      titleBarManager.setTitle(this.translate.instant(this.title));
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
