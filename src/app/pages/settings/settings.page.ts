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
import _, { isNil } from 'lodash';
import { FileHelperService } from 'src/app/services/FileHelperService';
import { HiveService } from 'src/app/services/HiveService';
import { StandardAuthService } from 'src/app/services/StandardAuthService';
import { Claims, DIDDocument, JWTParserBuilder, Logger, DID as JSDID} from '@elastosfoundation/did-js-sdk';
// import { FilesService, VaultSubscriptionService } from "@elastosfoundation/elastos-hive-js-sdk";
import { FilesService, ScriptingService, VaultSubscriptionService, VaultServices, QueryHasResultCondition, InsertExecutable} from "@dchagastelles/elastos-hive-js-sdk";
import { Console } from 'console';
import { HttpService } from 'src/app/services/HttpService';

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
  private isListGrid: boolean = false;
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
    private fileHelperService: FileHelperService,
    private hiveService: HiveService,
    private standardAuthService: StandardAuthService,
    private httpService: HttpService,
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
    this.loadIpfsShowNmae();
    this.pasarListGrid = this.feedService.getPasarListGrid();
    this.curApiProviderName = this.dataHelper.getApiProvider();
    this.languageName = this.getCurlanguageName();
    this.hideDeletedPosts = this.feedService.getHideDeletedPosts();
    this.hideDeletedComments = this.feedService.getHideDeletedComments();
    this.hideOfflineFeeds = this.feedService.getHideOfflineFeeds();
    this.developerMode = this.feedService.getDeveloperMode();
    this.initTitle();
  }

  loadIpfsShowNmae() {
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
    if(this.isListGrid){
      this.events.publish(FeedsEvent.PublishType.pasarListGrid);
    }
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

  async navIPFSProvider() {
      this.getAvatar()
    // this.native.getNavCtrl().navigateForward(['/select-ipfs-net']);
  }

  async getAvatar() {
    let appinstanceDocument = await this.standardAuthService.getInstanceDIDDoc()
    let userDid =  (await this.dataHelper.getSigninData()).did
    const resolverUrl = "https://api.elastos.io/eid"
    let context = await this.hiveService.creat(appinstanceDocument, userDid, resolverUrl)
    console.log("appinstanceDocument === ", appinstanceDocument)
    // userdid : "did:elastos:ikHP389FhssAADnUwM3RFF415F1wviZ8CC"
    const userDID =  JSDID.from(userDid)
    console.log("userDID === ", userDID)
    const userDiddocument = await userDID.resolve()
    console.log("userDiddocument === ", userDiddocument)
    const ccount = userDiddocument.getCredentialCount()
    const avatarDid = userDid + "#avatar"
    console.log("avatarDid == ", avatarDid)
    const cre = userDiddocument.getCredential(avatarDid)
    const sub = cre.getSubject()
    const pro = sub.getProperty("avatar")
    const data: string = pro["data"]
    const type = pro["type"]
    console.log("data ==== ", data)
    console.log("type ==== ", type)

    const serviceDid = userDid + "#hivevault"
    const service = userDiddocument.getService(serviceDid)
    const provider = service.getServiceEndpoint() + ":443" 
    console.log("service ==== ", service)
    console.log("provider ==== ", provider)
    const prefix = "hive://"
    const param = data.substr(prefix.length)
    const parts = param.split("/")
    // TODO 验证parts是否大于2个 ，否则 抛出异常
    console.log("parts === ", parts)
    const dids = parts[0].split("@")
    // TODO 验证dids是否等于2个 ，否则 抛出异常
    const star = data.length - (prefix.length + parts[0].length + 1)
    const values = parts[1].split("?")
    console.log("values === ", values)
    // TODO 验证values是否等于2个 ，否则 抛出异常
    const scriptName = values[0]
    const paramStr = values[1]
    console.log("paramStr ==== ", paramStr)

    const scriptParam = JSON.parse(paramStr.substr(7))
    console.log("scriptParam ==== ", scriptParam)

    // 创建
    const tarDID = dids[0]
    const tarAppDID = dids[1]
    const vaultSubscription: VaultSubscriptionService = new VaultSubscriptionService(context, provider)
    const vault = new VaultServices(context, provider)
    const scriptingService = vault.getScriptingService()
    const result = await scriptingService.callScript(scriptName, param, tarDID, tarAppDID)
    console.log("result ==== ", result)
    const t = result["download"]["transaction_id"]
    console.log("t ==== ", t)
    const transaction_id = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb3dfaWQiOiI2MWI5N2YyYTJjMGVkYTIwY2M3OGJjYjYiLCJ0YXJnZXRfZGlkIjoiZGlkOmVsYXN0b3M6aWtIUDM4OUZoc3NBQURuVXdNM1JGRjQxNUYxd3ZpWjhDQyIsInRhcmdldF9hcHBfZGlkIjoiZGlkOmVsYXN0b3M6aWcxbnF5eUpod1RjdGRMeURGYlpvbVNiWlNqeU1OMXVvciJ9.PAPcjCyCeraNySMCY-Un-uinQtt1j6uoxtR9PIpMv0Q"
    const downresult = await scriptingService.downloadFile(transaction_id)
  }

  navDeveloper() {
    this.native.getNavCtrl().navigateForward(['/developer']);
  }

  navWhiteList(){
    this.native.getNavCtrl().navigateForward(['/whitelist']);
  }

  setPasarListGrid() {
    this.zone.run(() => {
      this.pasarListGrid = !this.pasarListGrid;
    });
    this.feedService.setPasarListGrid(this.pasarListGrid);
    this.feedService.setData('feeds.pasarListGrid', this.pasarListGrid);
    this.isListGrid = true;
  }
}
