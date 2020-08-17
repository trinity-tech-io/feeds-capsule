import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Events } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';
import { TranslateService } from "@ngx-translate/core";
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-finish',
  templateUrl: './finish.page.html',
  styleUrls: ['./finish.page.scss'],
})
export class FinishPage implements OnInit {
  public connectionStatus = 1;
  public title = "06/06";
  public nodeId = "";
  constructor(
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private events: Events,
    private zone: NgZone,
    private feedService:FeedService,
    private translate:TranslateService) {
    }

    ngOnInit(){
      this.acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
      });
    }

    ionViewDidEnter() {
      this.connectionStatus = this.feedService.getConnectionStatus();
      this.initTitle();
      this.native.setTitleBarBackKeyShown(true);

      this.events.subscribe('feeds:connectionChanged',(status)=>{
        this.zone.run(() => {
          this.connectionStatus = status;
        });
      });
    }
  
    ionViewWillLeave(){
      this.events.unsubscribe("feeds:connectionChanged");
    }
  
  
    initTitle(){
      titleBarManager.setTitle(this.title);
    }

  createChannel(){
    if(this.connectionStatus != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.native.navigateForward(['/createnewfeed'],{
      replaceUrl: true
    });
  }

  returnMain(){
    this.native.pop();
  }
}
