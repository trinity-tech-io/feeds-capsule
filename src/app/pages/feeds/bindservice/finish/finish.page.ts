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
  private connectionStatus = 1;
  private title = "06/06";
  private nodeId = "";
  constructor(
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private events: Events,
    private zone: NgZone,
    private feedService:FeedService) {
    }

    ngOnInit(){
      this.connectionStatus = this.feedService.getConnectionStatus();
      this.acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
      });
    }

    ionViewDidEnter() {
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
      this.native.navigateForward(['/createnewfeed'],{
        replaceUrl: true
      });
  }

  returnMain(){
    this.native.pop();
  }
}
