import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { Events } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from 'src/app/services/theme.service';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-importdid',
  templateUrl: './importdid.page.html',
  styleUrls: ['./importdid.page.scss'],
})
export class ImportdidPage implements OnInit {
  public connectionStatus = 1;
  public title = "03/06";
  public nodeId = "";
  constructor(
    private native: NativeService,
    private zone: NgZone,
    private events: Events,
    private acRoute: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController,
    private feedService:FeedService,
    private translate:TranslateService,
    public  theme:ThemeService
    ) {
    }

    ngOnInit() {
      this.acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
      });
    }

    ionViewWillEnter() {
      this.connectionStatus = this.feedService.getConnectionStatus();
      this.events.subscribe('feeds:connectionChanged',(status)=>{
        this.zone.run(() => {
          this.connectionStatus = status;
          if (this.connectionStatus == 1){
            this.native.hideLoading();
          }
        });
      });

      this.events.subscribe('feeds:resolveDidError', (nodeId, did, payload) => {
        this.zone.run(() => {
            this.native.navigateForward(['/bindservice/publishdid/',nodeId, did, payload],{
              replaceUrl: true
            });
            this.native.hideLoading();
        });
      });

      this.events.subscribe('feeds:resolveDidSucess', (nodeId, did) => {
        this.zone.run(() => {
            this.native.getNavCtrl().navigateForward(['/bindservice/issuecredential', nodeId, did],{
              replaceUrl: true
            });
            this.native.hideLoading();
        });
      });

      this.events.subscribe('rpcResponse:error',()=>{
        this.zone.run(() => {
          this.native.hideLoading();
        });
      });
    }
  
    ionViewDidEnter() {
      this.initTitle();
      this.native.setTitleBarBackKeyShown(true);
    }

    ionViewWillLeave(){
      this.native.hideLoading();
      this.events.unsubscribe("feeds:connectionChanged");
      this.events.unsubscribe('feeds:resolveDidError');
      this.events.unsubscribe('feeds:resolveDidSucess');
      this.events.unsubscribe("rpcResponse:error");
    }
  
  
    initTitle(){
      titleBarManager.setTitle(this.title);
    }
  
  createNewDid(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.native.showLoading("common.waitMoment",5*60*1000).then(()=>{
      this.feedService.createDidRequest(this.nodeId);
    });
    
  }

  // importDid(){
  //   this.native.getNavCtrl().navigateForward(['/bindservice/importmnemonic', this.nodeId]);
  // }
}
