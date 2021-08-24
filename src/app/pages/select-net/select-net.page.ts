import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { DataHelper } from 'src/app/services/DataHelper';
import { PopupProvider } from 'src/app/services/popup';
import { PopoverController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { GlobalService } from 'src/app/services/global.service';
import { FeedService } from 'src/app/services/FeedService';

@Component({
  selector: 'app-select-net',
  templateUrl: './select-net.page.html',
  styleUrls: ['./select-net.page.scss'],
})
export class SelectNetPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public availableNetworkTemplates: string[] = [
    "MainNet", // All operations use main nets for all chains
    "TestNet", // All operations use a test net for all chains
  ];
  public selectedNetwork: any = "MainNet";
  public popover: any = null;
  constructor(
    private translate: TranslateService,
    public theme: ThemeService,
    private titleBarService: TitleBarService,
    private dataHelper: DataHelper,
    public popupProvider: PopupProvider,
    private popoverController: PopoverController,
    private splashScreen: SplashScreen,
    private globalService: GlobalService,
    private feedService: FeedService
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
    this.selectedNetwork = this.dataHelper.getDevelopNet();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('SettingsPage.choose-network'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  selectItem(selectedNetwork:string){
    if (this.selectedNetwork != selectedNetwork) {
      this.selectedNetwork = selectedNetwork;
      this.dataHelper.setDevelopNet(this.selectedNetwork);

      this.globalService.changeNet(this.selectedNetwork);
      this.openAlert();
    }
  }

  openAlert() {
    this.popover = this.popupProvider.ionicAlert(
      this,
      'common.restartApp',
      'common.restartAppDesc',
      this.confirm,
      'tskth.svg',
      'common.ok',
    );
  }

  confirm(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      this.popover = null;

      that.feedService.resetConnectionStatus();
      that.feedService.destroyCarrier();
      that.globalService.restartApp();
    }
  }
}
