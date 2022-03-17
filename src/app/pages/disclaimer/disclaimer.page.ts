import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

@Component({
  selector: 'app-disclaimer',
  templateUrl: './disclaimer.page.html',
  styleUrls: ['./disclaimer.page.scss'],
})
export class DisclaimerPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public styleObj: any = { 'margin-top': '' };

  constructor(
    private native: NativeService,
    private translate: TranslateService,
    public theme: ThemeService,
    private titleBarService: TitleBarService,
  ) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.initTitle();
    // this.styleObj['height'] = screen.height - 245 + 'px';
    this.initTitle();
  }

  ionViewDidEnter() {}

  private initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('DisclaimerPage.title'),
    );
    this.titleBarService.setTitleBarBlankButton(this.titleBar);
  }

  ionViewWillLeave() {}

  // deny the disclaimer
  deny() {
    // navigator['app'].exitApp();
    if (window.cordova && window.cordova.plugins) {
      (window.cordova.plugins as any).exit();
    }
  }

  // accept the disclaimer
  accept() {
    localStorage.setItem('org.elastos.dapp.feeds.disclaimer', '11');
    this.init();
  }

  init() {
    this.native.navigateForward('learnmore', {});
  }
}
