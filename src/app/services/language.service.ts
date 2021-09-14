import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'src/app/services/events.service';

@Injectable()
export class LanguageService {
  public languages = [
    {
      name: 'English',
      code: 'en',
      //   icon: '/assets/icon/english.jpg',
    },
    {
      name: '中文（简体）',
      code: 'zh',
      //   icon: '/assets/icon/chinese.png',
    },
  ];

  public loading: any = null;
  private curLang = '';

  constructor(
    private translate: TranslateService,
    private events: Events
  ) {}

  initTranslateConfig() {
    let defaltLang = this.getSystemLanguage() || '';
    this.translate.addLangs(['zh', 'en']);
    this.curLang = localStorage.getItem('io.trinity.feeds.language') || '';

    if (this.curLang != '') {
      this.setCurLang(this.curLang);
      return;
    }

    this.setCurLang(defaltLang);
    // TODO
    // appManager.getLocale((defaultLang: string, currentLang: string, systemLang: string)=>{
    //   this.setCurLang(currentLang);
    // });
  }

  setCurLang(currentLang: string) {
    if (currentLang != 'zh') {
      currentLang = 'en';
    }
    localStorage.setItem('io.trinity.feeds.language', currentLang);
    this.curLang = currentLang;
    this.translate.setDefaultLang(currentLang);
    this.translate.use(currentLang);
  }

  getCurLang() {
    if (this.curLang != 'zh') {
      this.curLang = 'en';
    }
    return this.curLang;
  }

  getSystemLanguage(): string {
    return this.translate.getBrowserLang();
  }
}
