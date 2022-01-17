import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { FeedService } from 'src/app/services/FeedService';
import { LoadingController } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { AppService } from '../../services/AppService';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import {
  connectivity,
  DID,
} from '@elastosfoundation/elastos-connectivity-sdk-cordova';
import { localization } from '@elastosfoundation/elastos-connectivity-sdk-cordova';
import { LanguageService } from 'src/app/services/language.service';
import { Logger } from 'src/app/services/logger';
import { DataHelper } from 'src/app/services/DataHelper';
import { IPFSService } from 'src/app/services/ipfs.service';
const TAG: string = 'SigninPage';
@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
})
export class SigninPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public signedIn: boolean = false;
  public did: string = '';
  public userName: string = '';
  public emailAddress: string = '';
  public lightThemeType: number = 2;
  constructor(
    private native: NativeService,
    private zone: NgZone,
    private feedService: FeedService,
    public loadingController: LoadingController,
    public theme: ThemeService,
    public appService: AppService,
    private titleBarService: TitleBarService,
    private languageService: LanguageService,
    private dataHelper: DataHelper,
    private ipfsService: IPFSService
  ) {}

  ngOnInit() {}

  init() {}

  initTile() {
    this.titleBarService.setTitle(
      this.titleBar,
      null
    );
    this.titleBarService.setTitleBarBlankButton(this.titleBar);
  }

  ionViewWillEnter() {
    localization.setLanguage(this.languageService.getCurLang());
    this.initTile();
  }

  ionViewDidEnter() {}

  ionViewWillLeave() {}

  learnMore() {
    this.native.navigateForward('learnmore', {
      queryParams: { showBack: 'back' },
    });
  }

  signIn() {
    connectivity.setActiveConnector(null).then(() => {
      this.doSignin();
    }).catch((err)=>{
    });
  }

  doSignin() {
    this.zone.run(async () => {
    await  this.native.showLoading('common.waitMoment', isDismiss => {}, 2000);
    });
    this.feedService.signIn().then(isSuccess => {
      if (isSuccess) {
        //add first bind FeedService logic
        this.native.hideLoading();
        let isFirstBindFeedService =
          localStorage.getItem(
            'org.elastos.dapp.feeds.isFirstBindFeedService',
          ) || '';
        let bindingServer = this.feedService.getBindingServer() || null;
        if (isFirstBindFeedService === '' && bindingServer === null) {
          this.native.navigateForward('bindservice/learnpublisheraccount', {});
          return;
        }
        this.native.setRootRouter('/tabs/home');
        return;
      }
    });
  }
}
