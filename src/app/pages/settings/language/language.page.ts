import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { LanguageService } from 'src/app/services/language.service';
import { Events } from 'src/app/services/events.service';
import { NativeService } from 'src/app/services/NativeService';

@Component({
  selector: 'app-language',
  templateUrl: './language.page.html',
  styleUrls: ['./language.page.scss'],
})
export class LanguagePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public languageList = [];
  public currentLang = '';
  constructor(
    public translate: TranslateService,
    public theme: ThemeService,
    private titleBarService: TitleBarService,
    private languageService: LanguageService,
    private events: Events,
    private native: NativeService
  ) {
    this.currentLang = this.languageService.getCurLang();
    this.languageList = this.languageService.languages;
  }

  ngOnInit() {}

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('SettingsPage.language-setting'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewWillEnter() {
    this.initTitle();
  }
  ionViewWillLeave() {
    this.native.handleTabsEvents()
  }
  selectLanguage(language: any) {
    this.languageService.setCurLang(language.code);
    this.currentLang = language.code;
    this.initTitle();
    this.events.publish(FeedsEvent.PublishType.updateTitle);
  }
}
