import { Component, OnInit, ViewChild } from '@angular/core';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'page-about',
  templateUrl: './about.html',
  styleUrls: ['./about.scss'],
})
export class AboutPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public version = '2.1.2';
  public currentLanguage = '';

  constructor(
    private native: NativeService,
    private translate: TranslateService,
    public theme: ThemeService,
    private titleBarService: TitleBarService,
    private languageService: LanguageService
  ) { }

  ngOnInit() { }

  ionViewWillEnter() {
    this.initTitle();
  }

  ionViewDidEnter() { }

  initTitle() {
    this.currentLanguage = this.languageService.getCurLang();
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('AboutPage.about'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  gotoWebsite() {
    this.native.openUrl('https://trinity-feeds.app');
  }

  showDisclaimer() {
    this.native.openUrl('https://trinity-feeds.app/disclaimer');
  }

  showHelp() {
    if (this.currentLanguage === 'zh') {
      this.native.openUrl(
        'https://github.com/elastos-trinity/feeds-manual-docs/blob/master/Feeds_Manual_zh.md',
      );
    } else {
      this.native.openUrl(
        'https://github.com/elastos-trinity/feeds-manual-docs/blob/master/Feeds_Manual_en.md',
      );
    }
  }

  gotoTelegram() {
    this.native.openUrl('https://t.me/feedscapsule');
  }

  copyEmailAddress() {
    this.native
      .copyClipboard('feeds@trinity-tech.io')
      .then(() => {
        this.native.toast_trans('common.copysucceeded');
      })
      .catch(() => { });
  }

  ionViewWillLeave() {
  }

  showNftDisclaimer() {
    this.native.openUrl('https://trinity-feeds.app/disclaimer-nft');
  }
}
