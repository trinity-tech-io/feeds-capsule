import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../services/theme.service';
import { NativeService } from '../../services/NativeService';
import { FeedService } from '../../services/FeedService';
import { PopupProvider } from '../../services/popup';
import { StorageService } from '../../services/StorageService';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { LanguageService } from 'src/app/services/language.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { DataHelper } from 'src/app/services/DataHelper';
import _ from 'lodash';
import { ApiUrl } from 'src/app/services/ApiUrl';
import { UtilService } from 'src/app/services/utilService';
import { FileHelperService } from 'src/app/services/FileHelperService';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public developerMode: boolean = false;
  public hideDeletedPosts: boolean = false;
  public hideDeletedComments: boolean = false;
  public hideOfflineFeeds: boolean = true;
  public popover: any = null;
  public languageName: string = null;
  public curApiProviderName = 'elastos.io';
  public pasarListGrid: boolean = false;
  public isHideDeveloperMode: boolean = false;
  public curIPFSApiProviderName = ApiUrl.IPFS_SERVER;

  constructor(
    private languageService: LanguageService,
    private feedService: FeedService,
    private events: Events,
    private native: NativeService,
    private translate: TranslateService,
    public theme: ThemeService,
    public popupProvider: PopupProvider,
    public storageService: StorageService,
    private popoverController: PopoverController,
    private zone: NgZone,
    private titleBarService: TitleBarService,
    private ipfsService: IPFSService,
    private dataHelper: DataHelper,
    private fileHelperService: FileHelperService
  ) { }

  ngOnInit() { }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('app.settings'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewWillEnter() {
    this.curIPFSApiProviderName = localStorage.getItem("selectedIpfsNetwork");
    this.pasarListGrid = this.feedService.getPasarListGrid();
    this.curApiProviderName = this.dataHelper.getApiProvider();
    this.languageName = this.getCurlanguageName();
    this.hideDeletedPosts = this.feedService.getHideDeletedPosts();
    this.hideDeletedComments = this.feedService.getHideDeletedComments();
    this.hideOfflineFeeds = this.feedService.getHideOfflineFeeds();
    this.developerMode = this.feedService.getDeveloperMode();
    this.initTitle();
  }

  getCurlanguageName() {
    let curCode = this.languageService.getCurLang();
    let languageList = this.languageService.languages;
    let curlanguage = _.find(languageList, item => {
      return item.code === curCode;
    });
    return curlanguage['name'];
  }

  ionViewDidEnter() { }

  ionViewWillLeave() {
    if (this.popover != null) {
      this.popoverController.dismiss();
    }
    this.events.publish(FeedsEvent.PublishType.search);
  }

  toggleHideDeletedPosts() {
    this.zone.run(() => {
      this.hideDeletedPosts = !this.hideDeletedPosts;
    });
    this.feedService.setHideDeletedPosts(this.hideDeletedPosts);
    this.events.publish(FeedsEvent.PublishType.hideDeletedPosts);
    this.feedService.setData('feeds.hideDeletedPosts', this.hideDeletedPosts);
  }

  toggleHideDeletedComments() {
    this.zone.run(() => {
      this.hideDeletedComments = !this.hideDeletedComments;
    });
    this.feedService.setHideDeletedComments(this.hideDeletedComments);
    this.feedService.setData(
      'feeds.hideDeletedComments',
      this.hideDeletedComments,
    );
  }

  toggleHideOfflineFeeds() {
    this.hideOfflineFeeds = !this.hideOfflineFeeds;
    this.feedService.setHideOfflineFeeds(this.hideOfflineFeeds);
    this.events.publish(FeedsEvent.PublishType.hideOfflineFeeds);
    this.feedService.setData('feeds.hideOfflineFeeds', this.hideOfflineFeeds);
  }

  toggleDeveloperMode() {
    this.zone.run(() => {
      this.developerMode = !this.developerMode;
    });
    this.feedService.setDeveloperMode(this.developerMode);
    this.feedService.setData('feeds.developerMode', this.developerMode);
    this.events.publish(FeedsEvent.PublishType.search);
    if (this.developerMode) {
      this.ipfsService.setTESTMode(true);
    } else {
      this.ipfsService.setTESTMode(false);
    }
  }

  cleanData() {
    this.popover = this.popupProvider.ionicConfirm(
      this,
      'SearchPage.confirmTitle',
      'SettingsPage.des',
      this.cancel,
      this.confirm,
      '',
    );
  }

  cancel(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  confirm(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }

    that.removeData();
  }

  removeData() {
    this.feedService.removeAllServerFriends();
    this.storageService
      .clearAll()
      .then(() => {
        localStorage.clear();
        this.feedService.resetConnectionStatus();
        this.feedService.destroyCarrier();
        this.titleBarService.hideRight(this.titleBar);
        this.native.setRootRouter('disclaimer');
        this.native.toast('SettingsPage.des1');
      })
      .catch(err => { });
  }

  navToSelectLanguage() {
    this.native.getNavCtrl().navigateForward(['/language']);
  }

  setDarkMode() {
    this.zone.run(() => {
      this.theme.darkMode = !this.theme.darkMode;
      this.theme.setTheme(this.theme.darkMode);
    });
  }

  navElastosApiProvider() {
    this.native.getNavCtrl().navigateForward(['/elastosapiprovider']);
  }

  navIPFSProvider() {
    this.native.getNavCtrl().navigateForward(['/select-ipfs-net']);
  }

  navDeveloper() {
    this.native.getNavCtrl().navigateForward(['/developer']);
  }

  setPasarListGrid() {
    this.zone.run(() => {
      this.pasarListGrid = !this.pasarListGrid;
    });
    this.feedService.setPasarListGrid(this.pasarListGrid);
    this.events.publish(FeedsEvent.PublishType.pasarListGrid);
    this.feedService.setData('feeds.pasarListGrid', this.pasarListGrid);
  }
}
