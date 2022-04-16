import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { GlobalService } from 'src/app/services/global.service';
import { Events } from 'src/app/services/events.service';
import { ApiUrl } from 'src/app/services/ApiUrl';
import { NativeService } from 'src/app/services/NativeService';


@Component({
  selector: 'app-select-ipfs-net',
  templateUrl: './select-ipfs-net.page.html',
  styleUrls: ['./select-ipfs-net.page.scss'],
})
export class SelectIpfsNetPage implements OnInit {

  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public availableIpfsNetworkTemplates: any = [
    {
      key: 'https://ipfs0.trinity-feeds.app/',
      name: 'ipfs0.trinity-feeds.app',
      description:'SettingsPage.ipfs0-provider-des',
    },
    {
      key: 'https://ipfs1.trinity-feeds.app/',
      name: 'ipfs1.trinity-feeds.app',
      description:'SettingsPage.ipfs1-provider-des',
    },
    {
      key: 'https://ipfs2.trinity-feeds.app/',
      name: 'ipfs2.trinity-feeds.app',
      description:'SettingsPage.ipfs2-provider-des',
    }
  ];
  public selectedIpfsNetwork: any = '';

  constructor(
    public translate: TranslateService,
    public theme: ThemeService,
    private titleBarService: TitleBarService,
    private globalService: GlobalService,
    private native: NativeService
  ) {

  }

  ngOnInit() {
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant("IPFS API"),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewWillEnter() {
    this.selectedIpfsNetwork = localStorage.getItem("selectedIpfsNetwork");
    this.initTitle();
  }

  ionViewWillLeave() {
    this.native.handleTabsEvents()
  }

  selectIpfs(selectedIpfsNetwork: any) {
    this.selectedIpfsNetwork = selectedIpfsNetwork.key;
    localStorage.setItem("selectedIpfsNetwork",this.selectedIpfsNetwork);
    ApiUrl.setIpfs(selectedIpfsNetwork.key)
    this.globalService.refreshBaseNFTIPSFUrl();
  }
}
