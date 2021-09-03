import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
@Component({
  selector: 'app-guidemac',
  templateUrl: './guidemac.page.html',
  styleUrls: ['./guidemac.page.scss'],
})
export class GuidemacPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  constructor(
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    public theme: ThemeService) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('GuidemacPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewWillLeave(){

  }

}
