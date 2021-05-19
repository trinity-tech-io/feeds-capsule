import { Injectable, ViewChild } from '@angular/core';
import { Platform } from '@ionic/angular';
import { theme } from "@elastosfoundation/elastos-connectivity-sdk-cordova";
//import { TitleBarService } from 'src/app/services/TitleBarService';
//import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  //@ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public darkMode = false;

  constructor(private platform: Platform) {
    this.platform.ready().then(() => {
      this.getTheme();
    });
  }

  getTheme() {
    //TODO
    // appManager.getPreference("ui.darkmode", (value) => {
    //   this.darkMode = value;
    //   this.setTheme(this.darkMode);
    // });
  }

  setTheme(dark) {
    this.darkMode = dark;
    if (this.darkMode) {
      // Set dark mode globally
      document.body.classList.add("dark");

      // Set dark mode to native header
      //this.titleBarService.setBackgroundColor(this.titleBar, "#191a2f");
      //this.titleBarService.setForegroundMode(this.titleBar, FeedsData.TitleBarForegroundMode.LIGHT);
    } else {
      // Remove dark mode globally
      document.body.classList.remove("dark");

      // Remove dark mode to native header
      //this.titleBarService.setBackgroundColor(this.titleBar, "#f8f8ff");
      //this.titleBarService.setForegroundMode(this.titleBar, FeedsData.TitleBarForegroundMode.DARK);
    }
  }
}
