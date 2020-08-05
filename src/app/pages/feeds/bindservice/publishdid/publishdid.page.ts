import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from 'src/app/services/theme.service';
import { Events } from '@ionic/angular';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-publishdid',
  templateUrl: './publishdid.page.html',
  styleUrls: ['./publishdid.page.scss'],
})
export class PublishdidPage implements OnInit {
  private title = "04/06";
  private payload: string="";
  private nodeId = "";
  private did = "";
  constructor(
    private zone: NgZone,
    private acRoute: ActivatedRoute,
    private router: Router,
    private native: NativeService,
    private feedService:FeedService,
    private translate:TranslateService,
    public theme:ThemeService, 
    ) {
    
    }

    ngOnInit() {
      this.acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
        this.did = data.did;
        this.payload = data.payload;
      });
    }

    ionViewDidEnter() {
      this.initTitle();
      this.native.setTitleBarBackKeyShown(true);
    }
  
    ionViewWillLeave(){
     
    }
  
  
    initTitle(){
      titleBarManager.setTitle(this.translate.instant(this.title));
    }

    publishDid(){

    this.feedService.publishDid(this.payload, 
      (response)=>{
        if (response.result && response.result.txid) {
          this.zone.run(() => {
              this.native.navigateForward(['/bindservice/issuecredential',this.nodeId, this.did],{
                replaceUrl: true
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
        this.native.navigateForward(['/bindservice/issuecredential',this.nodeId, this.did],{
          replaceUrl: true
        });
    });
  }
}
