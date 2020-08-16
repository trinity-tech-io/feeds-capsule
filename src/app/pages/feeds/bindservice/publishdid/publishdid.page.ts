import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, Events } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from 'src/app/services/theme.service';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-publishdid',
  templateUrl: './publishdid.page.html',
  styleUrls: ['./publishdid.page.scss'],
})
export class PublishdidPage implements OnInit {
  private connectionStatus = 1;
  private title = "04/06";
  private payload: string="";
  private nodeId = "";
  private did = "";
  constructor(
    private events: Events,
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

    ionViewWillEnter() {
      this.connectionStatus = this.feedService.getConnectionStatus();
      this.events.subscribe('feeds:connectionChanged',(status)=>{
        this.zone.run(() => {
          this.connectionStatus = status;
        });
      });
    }
    
    ionViewDidEnter() {
      this.initTitle();
      this.native.setTitleBarBackKeyShown(true);
    }
  
    ionViewWillLeave(){
      this.events.unsubscribe("feeds:connectionChanged");
    }
  
  
    initTitle(){
      titleBarManager.setTitle(this.translate.instant(this.title));
    }

    publishDid(){

    this.feedService.publishDid(this.payload, 
      (res)=>{
        this.zone.run(() => {
             //{"action":"didtransaction","result":{"txid":null},"from":"org.elastos.trinity.dapp.wallet"}
            let result = res["result"];
            let txId = result["txid"] || "";
            if(txId===''){
              return;
            } 
            this.native.navigateForward(['/bindservice/issuecredential',this.nodeId, this.did],{
              replaceUrl: true
          });
        });
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
