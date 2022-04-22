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
  public title = '';
  public isShowTryButton: boolean = false;
  public trybuttonDisabled: boolean = false;
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
        } catch(error) {
        }
        await this.initScript();
     });
    })
  }

  ionViewWillLeave() {
    this.events.unsubscribe(FeedsEvent.PublishType.authEssentialSuccess);
  }

  async initScript() {
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
      if (error["code"] === 404) {
        localStorage.removeItem(userDid + HiveVaultController.CREATEALLCollECTION);
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
   try {

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
    this.isShowTryButton = false;
    this.buttonDisabled = false;

  } catch (error) {
    if (error["code"] === 404) {
        this.isShowTryButton = true;
    }
  }
  }


  openHomePage() {
    this.dataHelper.saveData("feeds.initHive", "1");
    this.native.setRootRouter('/tabs/home');
  }

  async TryButton() {
    this.isShowTryButton = false;
    this.trybuttonDisabled = true;
    try {
      await this.native.showLoading("common.waitMoment");
      let reslut  = await this.hiveVaultController.deleteAllCollections();
      if(reslut === "true"){
           await this.dataHelper.removeData("feeds.initHive");
           const signinData = await this.dataHelper.getSigninData();
           let userDid = signinData.did
           localStorage.removeItem(userDid + HiveVaultController.CREATEALLCollECTION);
           this.native.hideLoading();
           await this.initScript();

      }else{
        this.isShowTryButton = true;
        this.trybuttonDisabled = false;
        this.native.hideLoading();
        alert("fail");
      }
    } catch (error) {
      this.isShowTryButton = true;
      this.trybuttonDisabled = false;
    }

  }

}
