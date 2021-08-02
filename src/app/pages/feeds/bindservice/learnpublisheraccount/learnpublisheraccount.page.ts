import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NativeService } from '../../../../services/NativeService';
import { FeedService } from '../../../../services/FeedService';
import { ThemeService } from '../../../../services/theme.service';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

@Component({
  selector: 'app-learnpublisheraccount',
  templateUrl: './learnpublisheraccount.page.html',
  styleUrls: ['./learnpublisheraccount.page.scss'],
})
export class LearnpublisheraccountPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public lightThemeType: number = 2;
  constructor(
    private native: NativeService,
    private events: Events,
    private translate: TranslateService,
    private feedService: FeedService,
    private titleBarService: TitleBarService,
    public theme: ThemeService,
  ) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.initTile();
    this.addEvent();
  }

  ionViewWillLeave() {
    this.removeEvent();
  }

  initTile() {
    this.titleBarService.setTitle(
      this.titleBar,
      //this.translate.instant('LearnmorePage.title'),
      null
    );
    this.titleBarService.setTitleBarBlankButton(this.titleBar);
  }

  addEvent() {}

  removeEvent() {}

  learnMore() {
    this.feedService.setBindPublisherAccountType('new');
    this.native.navigateForward(['bindservice/introduce'], '');
  }

  createNewPublisherAccount() {
    this.feedService.setBindPublisherAccountType('new');
    this.native.navigateForward(['bindservice/scanqrcode'], {
      replaceUrl: true,
    });
  }

  bindExistingPublisherAccount() {
    this.feedService.setBindPublisherAccountType('exit');
    this.native.navigateForward(['bindservice/scanqrcode'], {
      replaceUrl: true,
    });
  }

  continueWithoutPublisherAccount() {
    let isFirstBindFeedService =
      localStorage.getItem('org.elastos.dapp.feeds.isFirstBindFeedService') ||
      '';
    if (isFirstBindFeedService === '') {
      localStorage.setItem(
        'org.elastos.dapp.feeds.isFirstBindFeedService',
        '1',
      );
      //this.appService.addright();
      this.native.setRootRouter(['/tabs/home']);
      return;
    }

    this.native.navigateForward(['walletteach'], {
      replaceUrl: true,
    });
  }
}
