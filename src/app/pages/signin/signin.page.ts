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
    });
  }

  doSignin() {
    this.zone.run(() => {
      this.native.showLoading('common.waitMoment', isDismiss => {}, 2000);
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

  public async testGetCredentials() {
    let didAccess = new DID.DIDAccess();
    try {
      let presentation = await didAccess.getCredentials({
        claims: {
          name: true,
          avatar: {
            required: false,
            reason: 'For test',
          },
          email: {
            required: false,
            reason: 'For test',
          },
          gender: {
            required: false,
            reason: 'For test',
          },
          telephone: {
            required: false,
            reason: 'For test',
          },
          nation: {
            required: false,
            reason: 'For test',
          },
          nickname: {
            required: false,
            reason: 'For test',
          },
          description: {
            required: false,
            reason: 'For test',
          },
          interests: {
            required: false,
            reason: 'For test',
          },
        },
      });

      if (presentation) {
        console.log('Got credentials:', presentation);
        alert(JSON.stringify(presentation));
      } else {
        alert(
          'Empty presentation returned, something wrong happened, or operation was cancelled',
        );
      }
    } catch (error) {
      alert('error ' + JSON.stringify(error));
    }
  }
}
