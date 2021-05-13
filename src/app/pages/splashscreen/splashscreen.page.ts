import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from 'src/app/services/theme.service';
import { AppService } from '../../services/AppService';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

@Component({
  selector: 'app-splashscreen',
  templateUrl: './splashscreen.page.html',
  styleUrls: ['./splashscreen.page.scss'],
})
export class SplashscreenPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public styleObj:any={"margin-top":""};
  constructor(
    private modalCtrl: ModalController,
    private translate:TranslateService,
    private appService: AppService,
    public theme:ThemeService,
    private titleBarService: TitleBarService) { }

  ngOnInit() {
        
  }

  ionViewWillEnter() {
    this.styleObj["margin-top"]= (screen.height - 300)/2 +"px";   
    this.titleBarService.setTitle(this.titleBar, this.translate.instant('common.feeds'));
    this.titleBarService.setTitleBarBlankButton(this.titleBar);
  }

  ionViewDidEnter() {
    // appManager.setVisible('show');
    this.hanldSplashEnd();
  }

  hanldSplashEnd(){
    let sid = setTimeout(() => {
     clearTimeout(sid);
     this.modalCtrl.dismiss();
     this.appService.initializeApp();
   }, 1500);
 }

}
