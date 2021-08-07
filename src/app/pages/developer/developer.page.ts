import { Component, OnInit, ViewChild } from '@angular/core';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
@Component({
  selector: 'app-developer',
  templateUrl: './developer.page.html',
  styleUrls: ['./developer.page.scss'],
})
export class DeveloperPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  constructor(
    private translate: TranslateService,
    public theme: ThemeService,
    private titleBarService: TitleBarService,
    private native: NativeService
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
  }

  initTitle() {

    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('SettingsPage.developer-setting'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  navToConfigureNetwork(){
    //select-net
    this.native.navigateForward(['/select-net'],{})
  }

}
