import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { DataHelper } from 'src/app/services/DataHelper';
import { PopupProvider } from 'src/app/services/popup';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { GlobalService } from 'src/app/services/global.service';
import { FeedService } from 'src/app/services/FeedService';
import { Events } from 'src/app/services/events.service';
import { ApiUrl } from 'src/app/services/ApiUrl';
import { IPFSService } from 'src/app/services/ipfs.service';
import { Config } from 'src/app/services/config';

@Component({
  selector: 'app-select-ipfs-net',
  templateUrl: './select-ipfs-net.page.html',
  styleUrls: ['./select-ipfs-net.page.scss'],
})
export class SelectIpfsNetPage implements OnInit {

  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public availableIpfsNetworkTemplates: string[] = [
    "https://ipfs0.trinity-feeds.app/",
    "https://ipfs1.trinity-feeds.app/", 
    "https://ipfs2.trinity-feeds.app/", 
  ];

  public selectedIpfsNetwork: any = '';

  constructor(
    public translate: TranslateService,
    public theme: ThemeService,
    private titleBarService: TitleBarService,
    private events: Events,
    private ipfsServe: IPFSService
  ) { 
     this.selectedIpfsNetwork = localStorage.getItem("selectedIpfsNetwork");
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
    this.events.publish(FeedsEvent.PublishType.search);
    this.events.publish(FeedsEvent.PublishType.notification);
    this.events.publish(FeedsEvent.PublishType.addProflieEvent);
  }

  selectIpfs(selectedIpfsNetwork: string) {
    this.selectedIpfsNetwork = selectedIpfsNetwork;
    localStorage.setItem("selectedIpfsNetwork", selectedIpfsNetwork);
    ApiUrl.setIpfs(selectedIpfsNetwork)
    this.initTitle();
    this.events.publish(FeedsEvent.PublishType.updateTitle);
  }
}
