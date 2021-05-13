import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Events } from 'src/app/services/events.service';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

@Component({
  selector: 'app-finish',
  templateUrl: './finish.page.html',
  styleUrls: ['./finish.page.scss'],
})
export class FinishPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public connectionStatus = 1;
  public title = "06/06";
  public nodeId = "";
  constructor(
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private events: Events,
    private zone: NgZone,
    private feedService: FeedService,
    private titleBarService: TitleBarService) {
    }

    ngOnInit(){
      this.acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
      });
    }

    ionViewWillEnter() {
      this.initTitle();
    }

    ionViewDidEnter() {
      this.connectionStatus = this.feedService.getConnectionStatus();
      this.events.subscribe(FeedsEvent.PublishType.connectionChanged,(status)=>{
        this.zone.run(() => {
          this.connectionStatus = status;
        });
      });
    }

    ionViewWillLeave(){
      this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    }


    initTitle(){
      this.titleBarService.setTitle(this.titleBar, this.title);
      this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
      this.titleBarService.setTitleBarMoreMemu(this.titleBar);
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
    // this.native.pop();
    this.native.setRootRouter(['/tabs/home']);
  }
}
