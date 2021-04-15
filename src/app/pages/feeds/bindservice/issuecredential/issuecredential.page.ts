import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { Events } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from 'src/app/services/theme.service';
import { ServerpromptComponent } from 'src/app/components/serverprompt/serverprompt.component';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

@Component({
  selector: 'app-issuecredential',
  templateUrl: './issuecredential.page.html',
  styleUrls: ['./issuecredential.page.scss'],
})
export class IssuecredentialPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public isShowPrompt:boolean = false;
  public connectionStatus = 1;
  public title = "05/06";
  public nodeId = "";
  public did = "";
  public popover:any;
  constructor(
    public popoverController:PopoverController,
    private native: NativeService,
    private zone: NgZone,
    private events: Events,
    private acRoute: ActivatedRoute,
    private feedService:FeedService,
    private translate:TranslateService,
    public  theme:ThemeService,
    private titleBarService: TitleBarService
    ) {
     
    }

    ngOnInit() {
      this.acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
        this.did = data.did;
      });
    }

    ionViewWillEnter(){
      this.initTitle();
      this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
      
      this.connectionStatus = this.feedService.getConnectionStatus();
      this.events.subscribe(FeedsEvent.PublishType.connectionChanged,(status)=>{
        this.zone.run(() => {
          this.connectionStatus = status;
          if (this.connectionStatus == 1){
            this.native.hideLoading();
          }
        });
      });

      this.events.subscribe(FeedsEvent.PublishType.issue_credential, () => {
        this.zone.run(() => {
          this.native.navigateForward(['/bindservice/finish/',this.nodeId],{
            replaceUrl: true
          });
          this.native.hideLoading();
        });
      });

      this.events.subscribe(FeedsEvent.PublishType.rpcResponseError,()=>{
        this.zone.run(() => {
          this.native.hideLoading();
        });
      });
    }

    ionViewDidEnter() {
    }

    ionViewWillLeave(){
      this.native.hideLoading();
      this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
      this.events.unsubscribe(FeedsEvent.PublishType.issue_credential);
      this.events.unsubscribe(FeedsEvent.PublishType.rpcResponseError);
      if(this.popover!=null){
         this.popover.dismiss();
      }
    }
  
  
    initTitle(){
      this.titleBarService.setTitle(this.titleBar, this.translate.instant(this.title));
    }
  
  issueCredential(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.showServerPrompt(this.did,this.nodeId);
  }

  async showServerPrompt(did:string,nodeId:string) {
    this.isShowPrompt = true;
    this.popover = await this.popoverController.create({
      mode: 'ios',
      cssClass: 'genericPopup',
      component: ServerpromptComponent,
      componentProps: {
        "did":did,
        "nodeId":nodeId,
      }
    });
    this.popover.onWillDismiss().then(() => {
      this.isShowPrompt = false;
      this.popover = null;
    });
    
    return await this.popover.present();
  }

}

