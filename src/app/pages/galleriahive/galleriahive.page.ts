import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'src/app/services/events.service';
import { NativeService } from 'src/app/services/NativeService';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';

@Component({
  selector: 'app-galleriahive',
  templateUrl: './galleriahive.page.html',
  styleUrls: ['./galleriahive.page.scss'],
})
export class GalleriahivePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public buttonDisabled = true
  public description = ''
  public title = ''
  constructor(
    public titleBarService: TitleBarService,
    private translate: TranslateService,
    private events: Events,
    private native: NativeService,
    private hiveVaultController: HiveVaultController
  ) {
    this.title = this.translate.instant('GalleriahivePage.title');
    this.description = this.translate.instant('GalleriahivePage.description');
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.events.subscribe(FeedsEvent.PublishType.authEssentialSuccess, async () => {
      this.title = this.translate.instant('GalleriahivePage.titleSuccess');
      this.description = this.translate.instant('GalleriahivePage.synchronizingData');
      await this.hiveVaultController.syncSelfChannel();
      await this.hiveVaultController.syncAllPost();
      await this.hiveVaultController.syncAllLikeData();
      await this.hiveVaultController.syncAllComments();
      this.description = this.translate.instant('GalleriahivePage.synchronizingComplete');
      this.buttonDisabled = false;
    })
  }

  openHomePage() {
    this.native.setRootRouter('/tabs/home');
  }
}
