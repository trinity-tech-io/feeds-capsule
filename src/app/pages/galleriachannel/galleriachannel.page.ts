import { Component, OnInit, ViewChild } from '@angular/core';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-galleriachannel',
  templateUrl: './galleriachannel.page.html',
  styleUrls: ['./galleriachannel.page.scss'],
})
export class GalleriachannelPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  constructor(
    private translate: TranslateService,
    private titleBarService: TitleBarService,
  ) { }

  ngOnInit() {

  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('FeedspreferencesPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewWillEnter() {
    this.initTitle();
  }

  ionViewWillLeave() {

  }


  createPanel(){

  }


  removePanel(){

  }

}
