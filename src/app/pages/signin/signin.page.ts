import { Component, OnInit, NgZone } from '@angular/core';
import { FeedService, Avatar } from 'src/app/services/FeedService';
import { CarrierService } from 'src/app/services/CarrierService';
import { Events, LoadingController } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from 'src/app/services/theme.service';
import { AppService } from '../../services/AppService';
declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
})
export class SigninPage implements OnInit {
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
    public appService:AppService) { }

  ngOnInit() {

  }

  initTile(){
    titleBarManager.setTitle(this.translate.instant("SigninPage.signIn"));
  }

  ionViewWillEnter() {
    this.initTile();
    this.native.setTitleBarBackKeyShown(false);
    appManager.setVisible("show");

    this.event.subscribe("feeds:updateTitle",()=>{
      this.initTile();
    });
  }

  ionViewDidEnter(){
  }

  ionViewWillLeave(){
    this.event.unsubscribe("feeds:updateTitle");
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
