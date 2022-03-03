import { Component, OnInit, ViewChild } from '@angular/core';
import { GlobalService } from 'src/app/services/global.service';
import { FeedService } from 'src/app/services/FeedService';
import { PopupProvider } from 'src/app/services/popup';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { ThemeService } from 'src/app/services/theme.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { MigrateDataService } from 'src/app/services/migratedata.service';

@Component({
  selector: 'app-migrationdata',
  templateUrl: './migrationdata.page.html',
  styleUrls: ['./migrationdata.page.scss'],
})
export class MigrationdataPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public popover: any = null;
  constructor(
    private translate: TranslateService,
    public popupProvider: PopupProvider,
    private globalService: GlobalService,
    private feedService: FeedService,
    private titleBarService: TitleBarService,
    public theme: ThemeService,
    private dataHelper: DataHelper,
    private migrateDataService: MigrateDataService) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('common.migrateFeedsServiceData'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  cleanPasarData() {
    this.openAlert();
  }

  openAlert() {
    this.popover = this.popupProvider.ionicConfirm(
      this,
      'common.migrateFeedsServiceData',
      'common.migrateFeedsServiceData',
      this.cancel,
      this.confirm,
      './assets/images/tskth.svg',
      'common.ok',
      'common.cancel',
    );
  }

  confirm(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      this.popover = null;
    }

    that.migrateDataService.syncData();
  }

  cancel(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      this.popover = null;
    }
  }
}
