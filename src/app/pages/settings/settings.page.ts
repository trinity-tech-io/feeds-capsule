import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../services/theme.service';
import { NativeService } from '../../services/NativeService';
import { PopupProvider } from '../../services/popup';
import { StorageService } from '../../services/StorageService';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { LanguageService } from 'src/app/services/language.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { DataHelper } from 'src/app/services/DataHelper';
import _ from 'lodash';

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
  public curIPFSApiProviderName = 'ipfs0.trinity-feeds.app';
  public curAssistApiProviderName = '';
  private isListGrid: boolean = false;
  public isShowAdult: boolean = true;
  private isClickAdult: boolean = false;
  private isHideDeletedPosts: boolean = false;
  constructor(
    private languageService: LanguageService,
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
    private dataHelper: DataHelper
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
    this.loadIpfsShowName();
    //this.loadAssistShowName();
    this.pasarListGrid = this.dataHelper.getPasarListGrid();
    this.curApiProviderName = this.dataHelper.getApiProvider();
    this.languageName = this.getCurlanguageName();
    this.hideDeletedPosts = this.dataHelper.getHideDeletedPosts();
    this.hideDeletedComments = this.dataHelper.getHideDeletedComments();
    this.hideOfflineFeeds = this.dataHelper.getHideOfflineFeeds();
    this.developerMode = this.dataHelper.getDeveloperMode();
    this.isShowAdult = this.dataHelper.getAdultStatus();
    this.initTitle();
  }

  loadIpfsShowName() {
    let localIPFSApiProviderName = localStorage.getItem("selectedIpfsNetwork");
    if (localIPFSApiProviderName === 'https://ipfs0.trinity-feeds.app/') {
      this.curIPFSApiProviderName = 'ipfs0.trinity-feeds.app'
    }
    else if (localIPFSApiProviderName === 'https://ipfs1.trinity-feeds.app/') {
      this.curIPFSApiProviderName = 'ipfs1.trinity-feeds.app'
    }
    else {
      this.curIPFSApiProviderName = 'ipfs2.trinity-feeds.app'
    }
  }

  loadAssistShowName() {
    let selectedAssistPasarNetwork = localStorage.getItem("selectedAssistPasarNetwork");
    if (selectedAssistPasarNetwork === 'https://assist0.trinity-feeds.app/') {
      this.curAssistApiProviderName = 'assist0.trinity-feeds.app'
    }
    else if (selectedAssistPasarNetwork === 'https://assist1.trinity-feeds.app/') {
      this.curAssistApiProviderName = 'assist1.trinity-feeds.app'
    }
    else {
      this.curAssistApiProviderName = 'assist2.trinity-feeds.app'
    }
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
    if (this.isListGrid) {
      this.events.publish(FeedsEvent.PublishType.pasarListGrid);
      this.isListGrid = false;
    }

    if (this.isClickAdult) {
      this.events.publish(FeedsEvent.PublishType.hideAdult);
      this.isClickAdult = false;
    }

    if(this.isHideDeletedPosts){
      this.events.publish(FeedsEvent.PublishType.hideDeletedPosts);
      this.isHideDeletedPosts = false;
    }
  }

  toggleHideDeletedPosts() {
    this.isHideDeletedPosts = true;
    this.zone.run(() => {
      this.hideDeletedPosts = !this.hideDeletedPosts;
    });
    this.dataHelper.setHideDeletedPosts(this.hideDeletedPosts);
    this.dataHelper.saveData('feeds.hideDeletedPosts', this.hideDeletedPosts);
  }

  toggleHideDeletedComments() {
    this.zone.run(() => {
      this.hideDeletedComments = !this.hideDeletedComments;
    });
    this.dataHelper.setHideDeletedComments(this.hideDeletedComments);
    this.dataHelper.saveData(
      'feeds.hideDeletedComments',
      this.hideDeletedComments,
    );
  }

  toggleHideOfflineFeeds() {
    this.hideOfflineFeeds = !this.hideOfflineFeeds;
    this.dataHelper.setHideOfflineFeeds(this.hideOfflineFeeds);
    this.events.publish(FeedsEvent.PublishType.hideOfflineFeeds);
    this.dataHelper.saveData('feeds.hideOfflineFeeds', this.hideOfflineFeeds);
  }

  toggleDeveloperMode() {
    this.zone.run(() => {
      this.developerMode = !this.developerMode;
    });
    this.dataHelper.setDeveloperMode(this.developerMode);
    this.dataHelper.saveData('feeds.developerMode', this.developerMode);
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

    this.storageService
      .clearAll()
      .then(() => {
        localStorage.clear();
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

  navWhiteList() {
    this.native.getNavCtrl().navigateForward(['/whitelist']);
  }

  navDataStorage() {
    this.native.getNavCtrl().navigateForward(['/datastorage']);
  }

  navMigrationData() {
    this.native.getNavCtrl().navigateForward(['/migrationdata']);
  }

  setPasarListGrid() {
    this.zone.run(() => {
      this.pasarListGrid = !this.pasarListGrid;
    });
    this.dataHelper.setPasarListGrid(this.pasarListGrid);
    this.dataHelper.saveData('feeds.pasarListGrid', this.pasarListGrid);
    this.isListGrid = true;
  }

  navAssistPasarProvider() {
    this.native.getNavCtrl().navigateForward(['/assistpasar']);
  }

  toggleHideAdult() {
    this.zone.run(() => {
      this.isShowAdult = !this.isShowAdult;
    });
    this.isClickAdult = true;
    this.dataHelper.changeAdultStatus(this.isShowAdult);
    this.dataHelper.saveData('feeds.hideAdult', this.isShowAdult);
  }
}
