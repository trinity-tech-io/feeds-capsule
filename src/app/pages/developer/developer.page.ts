import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { FeedService } from 'src/app/services/FeedService';
import { LogUtils, LogLevel } from 'src/app/services/LogUtils';
import { DataHelper } from 'src/app/services/DataHelper';

@Component({
  selector: 'app-developer',
  templateUrl: './developer.page.html',
  styleUrls: ['./developer.page.scss'],
})
export class DeveloperPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  private openLog: boolean = false;
  constructor(
    private translate: TranslateService,
    public theme: ThemeService,
    private titleBarService: TitleBarService,
    private native: NativeService,
    private feedService: FeedService,
    private zone: NgZone,
    private logUtils: LogUtils,
    private dataHelper: DataHelper
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
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

  navToConfigureNetwork(){
    //select-net
    this.native.navigateForward(['/select-net'],{})
  }

  toggleLogMode() {
    this.zone.run(() => {
      this.openLog = !this.openLog;
    });
    this.dataHelper.setDevelopLogMode(this.openLog);
    if (this.openLog) {
      this.logUtils.setLogLevel(LogLevel.DEBUG);
    } else {
      this.logUtils.setLogLevel(LogLevel.WARN);
    }
  }
}