import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Events } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';
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
    private feedService:FeedService) {
    }

    ngOnInit(){
      this.acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
      });
    }

    ionViewWillEnter() {
      this.initTitle();
      this.native.setTitleBarBackKeyShown(true);
    }

    ionViewDidEnter() {
      this.connectionStatus = this.feedService.getConnectionStatus();
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

    if (!this.feedService.checkBindingServerVersion(()=>{
      this.feedService.hideAlertPopover();
    })) return;

    this.native.navigateForward(['/createnewfeed'],{
      replaceUrl: true
    });
  }

  returnMain(){
    this.native.pop();
  }
}
