import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'src/app/services/events.service';
import { NativeService } from 'src/app/services/NativeService';
import { DataHelper } from 'src/app/services/DataHelper';
import { Logger } from 'src/app/services/logger';
let TAG: string = 'Galleria-Hive';
@Component({
  selector: 'app-galleriahive',
  templateUrl: './galleriahive.page.html',
  styleUrls: ['./galleriahive.page.scss'],
})
export class GalleriahivePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public buttonDisabled = true
  public description = ''
  public title = '';
  public isShowTryButton: boolean = false;
  public trybuttonDisabled: boolean = false;
  constructor(
    public titleBarService: TitleBarService,
    private translate: TranslateService,
    private events: Events,
    private native: NativeService,
    private dataHelper: DataHelper,
    private zone: NgZone,
  ) {
    this.title = this.translate.instant('GalleriahivePage.title');
    this.description = this.translate.instant('GalleriahivePage.description');
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.events.subscribe(FeedsEvent.PublishType.authEssentialSuccess, async () => {
      Logger.log(TAG, "revice authEssentialSuccess event");
      this.zone.run(async () => {
        this.title = this.translate.instant('GalleriahivePage.titleSuccess');
        this.description = this.translate.instant('GalleriahivePage.welcomeHive');
        this.buttonDisabled = false;
      });
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe(FeedsEvent.PublishType.authEssentialSuccess);
  }

  openHomePage() {

    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.dataHelper.loadData("feeds.syncHiveData").
      then((syncHiveData: any) => {
        if (syncHiveData === null) {
          this.dataHelper.saveData("feeds.initHive", "1");
          this.events.publish(FeedsEvent.PublishType.initHiveData);
          let syncHiveData = { status: 0, describe: "GalleriahivePage.preparingData" }
          this.dataHelper.setSyncHiveData(syncHiveData);
          this.native.setRootRouter('/tabs/home');
        } else {
          if (syncHiveData.status === 6) {
            this.dataHelper.setSyncHiveData(syncHiveData);
            this.dataHelper.saveData("feeds.initHive", "1");
            this.native.setRootRouter('/tabs/home');
          } else {
            let syncHiveData = { status: 0, describe: "GalleriahivePage.preparingData" }
            this.dataHelper.setSyncHiveData(syncHiveData);
            this.dataHelper.saveData("feeds.initHive", "1");
            this.events.publish(FeedsEvent.PublishType.initHiveData);
            this.native.setRootRouter('/tabs/home');
          }
        }
      });
  }

}
