import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'src/app/services/events.service';
import { NativeService } from 'src/app/services/NativeService';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { FeedsSqliteHelper } from 'src/app/services/sqlite_helper.service';

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
    private hiveVaultController: HiveVaultController,
    private dataHelper: DataHelper,
    private sqliteHelper: FeedsSqliteHelper,
    private zone: NgZone,
  ) {
    this.title = this.translate.instant('GalleriahivePage.title');
    this.description = this.translate.instant('GalleriahivePage.description');
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.events.subscribe(FeedsEvent.PublishType.authEssentialSuccess, async () => {
      this.zone.run(async () => {
        this.title = this.translate.instant('GalleriahivePage.titleSuccess');
        this.description = this.translate.instant('GalleriahivePage.synchronizingData');

        try {
          await this.hiveVaultController.downloadEssAvatar()
          await this.hiveVaultController.downloadCustomeAvatar("custome")
        } catch {
        }

        const signinData = await this.dataHelper.getSigninData();
        let userDid = signinData.did


        this.description = this.translate.instant('GalleriahivePage.preparingData');
        this.sqliteHelper.createTables();
        let regist_scripting = false
        try {
          let result = await this.hiveVaultController.queryFeedsScripting()
          regist_scripting = result[0]["regist_scripting"]
        }
        catch (error) {
          let errString = JSON.stringify(error)
          let err = JSON.parse(errString)
          let errorCode = err["code"]
          if (errorCode === 404) {
            regist_scripting = true
          }
        }
        if (regist_scripting) {
          try {
            this.description = this.translate.instant('GalleriahivePage.creatingScripting');
            await this.hiveVaultController.createCollectionAndRregisteScript(userDid)
            await this.hiveVaultController.creatFeedsScripting()
          } catch (error) {
            console.log(error)
          }
        }

        this.description = this.translate.instant('GalleriahivePage.synchronizingChannelData');
        await this.hiveVaultController.queryBackupSubscribedChannel();

        await this.hiveVaultController.syncAllChannelInfo();

        this.description = this.translate.instant('GalleriahivePage.synchronizingPostData');
        await this.hiveVaultController.syncAllPost();

        this.description = this.translate.instant('GalleriahivePage.synchronizingCommentData');
        await this.hiveVaultController.syncAllComments();

        this.description = this.translate.instant('GalleriahivePage.synchronizingOtherData');
        await this.hiveVaultController.syncAllLikeData();

        this.description = this.translate.instant('GalleriahivePage.synchronizingComplete');
        this.buttonDisabled = false;
      });
    })
  }

  ionViewWillLeave() {
    this.events.unsubscribe(FeedsEvent.PublishType.authEssentialSuccess);
  }

  openHomePage() {
    this.dataHelper.saveData("feeds.initHive", "1");
    this.native.setRootRouter('/tabs/home');
  }
}
