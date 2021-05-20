import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { Events } from 'src/app/services/events.service';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { PaypromptComponent } from 'src/app/components/payprompt/payprompt.component'
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

@Component({
  selector: 'app-donation',
  templateUrl: './donation.page.html',
  styleUrls: ['./donation.page.scss'],
})
export class DonationPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public isShowPrompt: boolean = false;
  public connectionStatus = 1;
  public elaAddress = "EYWDcCyp6czaqAKGiq4b7exhWJfVpbG2D9";
  public popover:any;
  constructor(
    public theme:ThemeService,
    private popoverController:PopoverController,
    private zone: NgZone,
    private native: NativeService,
    private translate:TranslateService,
    private events: Events,
    private feedService:FeedService,
    private titleBarService: TitleBarService
    ) {}

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();

    this.connectionStatus = this.feedService.getConnectionStatus();
    this.events.subscribe(FeedsEvent.PublishType.connectionChanged,(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });
  }

  ionViewDidEnter(){
  }

  initTitle(){
    this.titleBarService.setTitle(this.titleBar, this.translate.instant("DonationPage.donation"));
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewWillLeave(){
    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    this.events.publish(FeedsEvent.PublishType.addConnectionChanged);
  }

  donation(){
    this.showPayPrompt(this.elaAddress);
  }

  async showPayPrompt(elaAddress:string) {
    this.isShowPrompt = true;
    this.popover = await this.popoverController.create({
      mode: 'ios',
      cssClass: 'PaypromptComponent',
      component: PaypromptComponent,
      backdropDismiss: false,
      componentProps: {
        "title": this.translate.instant("DonationPage.donation"),
        "elaAddress": elaAddress,
        "defalutMemo": this.translate.instant("DonationPage.defaultMemo")
      }
    });
    this.popover.onWillDismiss().then(() => {
      this.isShowPrompt = false;
      this.popover = null;
    });
    return await this.popover.present();
  }

  clickAddress(){
    this.native.copyClipboard(this.elaAddress).then(()=>{
        this.native.toast_trans("common.copysucceeded");
    }).catch(()=>{

    });
  }
}
