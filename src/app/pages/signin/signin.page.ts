import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { FeedService, Avatar } from 'src/app/services/FeedService';
import { CarrierService } from 'src/app/services/CarrierService';
import { LoadingController } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from 'src/app/services/theme.service';
import { AppService } from '../../services/AppService';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
})
export class SigninPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public signedIn: boolean = false;
  public did: string = "";
  public userName: string = "";
  public emailAddress: string = "";
  constructor(
    private events: Events,
    private native: NativeService,
    private zone: NgZone,
    private feedService: FeedService,
    public loadingController: LoadingController,
    private carrierService:CarrierService,
    private translate:TranslateService,
    private event:Events,
    public theme:ThemeService,
    public appService:AppService,
    private titleBarService: TitleBarService) { }

  ngOnInit() {

  }

  initTile(){
    this.titleBarService.setTitle(this.titleBar, this.translate.instant("SigninPage.signIn"));
  }

  ionViewWillEnter() {
    this.initTile();
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, false);
    // appManager.setVisible("show");

    this.event.subscribe(FeedsEvent.PublishType.updateTitle,()=>{
      this.initTile();
    });
  }

  ionViewDidEnter(){
  }

  ionViewWillLeave(){
    this.event.unsubscribe(FeedsEvent.PublishType.updateTitle);
  }

  learnMore(slide) {
    slide.slideNext();
  }

  signIn(){
    this.zone.run(()=>{
      this.native.showLoading('common.waitMoment',2000);
    });
    this.feedService.signIn().then((isSuccess)=>{
      if (isSuccess){
        this.appService.addright();
        this.native.hideLoading();
        this.native.setRootRouter('/tabs/home');
        return;
      }
    });
  }
}
