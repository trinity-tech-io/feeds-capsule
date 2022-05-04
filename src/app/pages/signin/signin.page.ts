import { Component, OnInit, ViewChild } from '@angular/core';
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
import { DataHelper } from 'src/app/services/DataHelper';
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
    private feedService: FeedService,
    public loadingController: LoadingController,
    public theme: ThemeService,
    public appService: AppService,
    private titleBarService: TitleBarService,
    private languageService: LanguageService,
    private dataHelper: DataHelper
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
    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }
    connectivity.setActiveConnector(null).then(() => {
      this.doSignin();
    }).catch((err)=>{
    });
  }

  async doSignin() {
    try {
      this.feedService.signIn().then(isSuccess => {
        if (isSuccess) {
          //此处切换成galleriahive 页面
          this.native.setRootRouter('galleriahive');
          return;
        }
      }).catch((err)=>{
        this.native.toastWarn(err);
      });
    } catch (error) {
    }
  }
}
