import { Component, OnInit, ViewChild} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
@Component({
  selector: 'app-guideubuntu',
  templateUrl: './guideubuntu.page.html',
  styleUrls: ['./guideubuntu.page.scss'],
})
export class GuideubuntuPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  constructor(
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    public theme: ThemeService
  ) { }

  ngOnInit() {

  }

  ionViewWillEnter() {
    this.initTitle();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('GuideubuntuPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewWillLeave(){

  }

}
