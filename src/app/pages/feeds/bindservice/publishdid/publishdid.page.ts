import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { Events } from '@ionic/angular';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-publishdid',
  templateUrl: './publishdid.page.html',
  styleUrls: ['./publishdid.page.scss'],
})
export class PublishdidPage implements OnInit {
  private title = "PublishdidPage.bindingServer";
  private payload: string;
  private nodeId = "";
  private did = "";
  constructor(
    private zone: NgZone,
    private acRoute: ActivatedRoute,
    private router: Router,
    private native: NativeService,
    private feedService:FeedService,
    private navCtrl: NavController,
    private translate:TranslateService,
    private events: Events,
    ) {
      acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
        this.did = data.did;
        this.payload = data.payload;
      });
    }

    ionViewDidEnter() {
      this.events.subscribe("feeds:updateTitle",()=>{
        this.initTitle();
      });
      this.initTitle();
      this.native.setTitleBarBackKeyShown(true);
    }
  
    ionViewWillUnload(){
      this.events.unsubscribe("feeds:updateTitle");
    }
  
  
    initTitle(){
      titleBarManager.setTitle(this.translate.instant(this.title));
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
          this.zone.run(() => {
            this.navCtrl.pop().then(()=>{
              this.router.navigate(['/bindservice/issuecredential',this.nodeId, this.did]);
            });
          });
        }
      },
      (err)=>{
        alert("error");
      });
  }

  issueCredential(){
    this.zone.run(() => {
      this.navCtrl.pop().then(()=>{
        this.router.navigate(['/bindservice/issuecredential',this.nodeId, this.did]);
      });
    });
  }

  abort(){
    this.navCtrl.pop();
  }

}
