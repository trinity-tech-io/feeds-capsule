import { Injectable } from '@angular/core';
import { StatusBar } from '@ionic-native/status-bar/ngx';


import {
  ThemeDetection,
  ThemeDetectionResponse,
} from '@ionic-native/theme-detection';
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  public darkMode = true;
  constructor(
    private statusBar: StatusBar) {
  }

  getTheme() {
    // let isDrakMode =
    //   localStorage.getItem('org.elastos.dapp.feeds.isDrakMode') || '';
    // if (isDrakMode === '') {
    //   this.getSystemMode();
    //   return;
    // }
    // this.setTheme(JSON.parse(isDrakMode));
    this.setTheme(true);
  }

  getSystemMode() {
    ThemeDetection.isAvailable()
      .then((res: ThemeDetectionResponse) => {
        if (res.value) {
          ThemeDetection.isDarkModeEnabled()
            .then((darkModeRes: ThemeDetectionResponse) => {
              if (darkModeRes.value) {
                this.darkMode = true;
                this.setTheme(this.darkMode);
              } else {
                this.darkMode = false;
                this.setTheme(this.darkMode);
              }
            })
            .catch(() => {
              this.darkMode = false;
              this.setTheme(this.darkMode);
            });
        } else {
          this.darkMode = false;
          this.setTheme(this.darkMode);
        }
      })
      .catch((error: any) => {
        this.darkMode = false;
        this.setTheme(this.darkMode);
      });
  }

  setTheme(dark: boolean) {
    this.darkMode = dark;
    if (this.darkMode) {
      // Set dark mode globally
      document.body.classList.add('dark');
      this.statusBar.styleLightContent();
      this.statusBar.backgroundColorByHexString("#ff161C24");
    } else {
      // Remove dark mode globally
      this.statusBar.backgroundColorByHexString("#ffffffff");
      this.statusBar.styleDefault()
      document.body.classList.remove('dark');
    }

    localStorage.setItem(
      'org.elastos.dapp.feeds.isDrakMode',
      JSON.stringify(this.darkMode),
    );
  }
}
