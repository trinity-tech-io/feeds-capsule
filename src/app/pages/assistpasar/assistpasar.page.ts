import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { GlobalService } from 'src/app/services/global.service';
import { Events } from 'src/app/services/events.service';
import { ApiUrl } from 'src/app/services/ApiUrl';

@Component({
  selector: 'app-assistpasar',
  templateUrl: './assistpasar.page.html',
  styleUrls: ['./assistpasar.page.scss'],
})
export class AssistpasarPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public availableAssistPasarNetworkTemplates: any = [
    {
      key: 'https://assist0.trinity-feeds.app/',
      name: 'assist0.trinity-feeds.app',
      description: 'AssistpasarPage.assistProviderDes',
    },
    {
      key: 'https://assist1.trinity-feeds.app/',
      name: 'assist1.trinity-feeds.app',
      description:'AssistpasarPage.assistProviderDes',
    },
    {
      key: 'https://assist2.trinity-feeds.app/',
      name: 'assist2.trinity-feeds.app',
      description:'AssistpasarPage.assistProviderDes',
    }
  ];
  public selectedAssistPasarNetwork: string = 'https://assist0.trinity-feeds.app/';
  constructor(
    public translate: TranslateService,
    public theme: ThemeService,
    private titleBarService: TitleBarService,
    private events: Events,
    private globalService: GlobalService,
  ) { }

  ngOnInit() {
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant("AssistpasarPage.title"),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewWillEnter() {
    this.selectedAssistPasarNetwork = localStorage.getItem("selectedAssistPasarNetwork");
    this.initTitle();
  }

  ionViewWillLeave() {
    this.events.publish(FeedsEvent.PublishType.search);
    this.events.publish(FeedsEvent.PublishType.notification);
    this.events.publish(FeedsEvent.PublishType.addProflieEvent);
  }

  selectAssistPasar(assistPasar:any){
    this.selectedAssistPasarNetwork = assistPasar.key;
    localStorage.setItem("selectedAssistPasarNetwork",this.selectedAssistPasarNetwork);
    ApiUrl.setAssist(this.selectedAssistPasarNetwork);
    this.globalService.refreshBaseAssistUrl();
  }

}
