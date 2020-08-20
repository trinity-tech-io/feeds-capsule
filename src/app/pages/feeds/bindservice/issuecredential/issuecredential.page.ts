import { Component, OnInit, NgZone } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { Events } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from 'src/app/services/theme.service';
import { ServerpromptComponent } from 'src/app/components/serverprompt/serverprompt.component';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-issuecredential',
  templateUrl: './issuecredential.page.html',
  styleUrls: ['./issuecredential.page.scss'],
})
export class IssuecredentialPage implements OnInit {
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
    ) {
     
    }

    ngOnInit() {
      this.acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
        this.did = data.did;
      });
    }

    ionViewWillEnter(){
      this.connectionStatus = this.feedService.getConnectionStatus();
      this.events.subscribe('feeds:connectionChanged',(status)=>{
        this.zone.run(() => {
          this.connectionStatus = status;
          if (this.connectionStatus == 1){
            this.native.hideLoading();
          }
        });
      });

      this.events.subscribe('feeds:issue_credential', () => {
        this.zone.run(() => {
          this.native.navigateForward(['/bindservice/finish/',this.nodeId],{
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
      this.events.unsubscribe('feeds:issue_credential');
      this.events.unsubscribe("rpcResponse:error");
      if(this.popover!=null){
         this.popover.dismiss();
      }
    }
  
  
    initTitle(){
      titleBarManager.setTitle(this.translate.instant(this.title));
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

