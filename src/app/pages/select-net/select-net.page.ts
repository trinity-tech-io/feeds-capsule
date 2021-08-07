import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
@Component({
  selector: 'app-select-net',
  templateUrl: './select-net.page.html',
  styleUrls: ['./select-net.page.scss'],
})
export class SelectNetPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public availableNetworkTemplates: string[] = [
    "MainNet", // All operations use main nets for all chains
    "TestNet", // All operations use a test net for all chains
  ];
  public selectedNetwork:any = "MainNet";
  constructor(
    private translate: TranslateService,
    public theme: ThemeService,
    private titleBarService: TitleBarService,
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
  }

  initTitle() {

    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('SettingsPage.choose-network'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  selectItem(selectedNetwork:string){
    this.selectedNetwork = selectedNetwork
  }
}
