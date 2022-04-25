import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { DataHelper } from 'src/app/services/DataHelper';
import { Logger, LogLevel } from 'src/app/services/logger';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { PopupProvider } from 'src/app/services/popup';
import { GlobalService } from 'src/app/services/global.service';

@Component({
  selector: 'app-developer',
  templateUrl: './developer.page.html',
  styleUrls: ['./developer.page.scss'],
})
export class DeveloperPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public openLog: boolean = false;
  public selectedNetwork: any = "MainNet";
  public popover: any = null;
  constructor(
    private translate: TranslateService,
    public theme: ThemeService,
    private titleBarService: TitleBarService,
    private native: NativeService,
    private zone: NgZone,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController,
    public popupProvider: PopupProvider,
    private globalService: GlobalService
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
    this.selectedNetwork = this.dataHelper.getDevelopNet();
    this.openLog = this.dataHelper.getDevelopLogMode();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('SettingsPage.developer-setting'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  navToConfigureNetwork() {
    //select-net
    this.native.navigateForward(['/select-net'], {})
  }

  toggleLogMode() {
    this.zone.run(() => {
      this.openLog = !this.openLog;
    });
    this.dataHelper.setDevelopLogMode(this.openLog);
    if (this.openLog)
      Logger.setLogLevel(LogLevel.DEBUG);
    else
      Logger.setLogLevel(LogLevel.WARN);
  }

  interfaceTest() {
    this.native.navigateForward(['/hive-interface-test'], {})
  }


  cleanData() {
    this.popover = this.popupProvider.ionicConfirm(
      this,
      'SearchPage.confirmTitle',
      '是否删除所有收藏品',
      this.cancel,
      this.confirm,
      '',
    );
  }

  cancel(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  async confirm(that: any) {
    if (this.popover != null) {
       await this.popover.dismiss();
       this.popover = null;
    }

    that.deleteAllCollections(that);
  }

  async deleteAllCollections(that: any){
   await that.native.showLoading("common.waitMoment");
   try {
   let reslut  = await that.hiveVaultController.deleteAllCollections();
   if(reslut === "true"){
        await that.dataHelper.removeData("feeds.initHive");
        await that.dataHelper.removeData("feeds.syncHiveData");
        const signinData = await this.dataHelper.getSigninData();
        let userDid = signinData.did
        localStorage.removeItem(userDid + HiveVaultController.CREATEALLCollECTION);
        that.native.hideLoading();
        alert("sucess");
   }else{
     that.native.hideLoading();
    alert("fail");
   }
   } catch (error) {
     that.native.hideLoading();
     alert("====error==="+JSON.stringify(error));
   }
  }
}
