import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'src/app/services/events.service';
import { ThemeService } from 'src/app/services/theme.service';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from 'src/app/services/NativeService';
import { IntentService } from 'src/app/services/IntentService';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

import * as _ from 'lodash';

@Component({
  selector: 'app-editserverinfo',
  templateUrl: './editserverinfo.page.html',
  styleUrls: ['./editserverinfo.page.scss'],
})
export class EditserverinfoPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public connectionStatus = 1;
  public name: string = '';
  public introduction: string = '';
  public elaAddress: string = '';
  public nodeId: string = '';
  public did: string = '';
  public oldServerInfo: any = {};

  constructor(
    private feedService: FeedService,
    public activatedRoute: ActivatedRoute,
    public theme: ThemeService,
    private translate: TranslateService,
    private events: Events,
    private native: NativeService,
    private zone: NgZone,
    private intentService: IntentService,
    private titleBarService: TitleBarService,
  ) {}

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(data => {
      this.oldServerInfo = data;
      let item = _.cloneDeep(data);
      let signInData = this.feedService.getSignInData() || {};
      this.name = signInData['name'] || '';
      this.introduction = item['introduction'] || '';
      this.elaAddress = item['elaAddress'] || '';
      this.nodeId = item['nodeId'] || '';
      this.did = item['did'] || '';
    });
  }

  ionViewWillEnter() {
    this.initTitle();

    this.connectionStatus = this.feedService.getConnectionStatus();
    this.events.subscribe(FeedsEvent.PublishType.connectionChanged, status => {
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });
    this.events.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      this.initTitle();
    });

    this.events.subscribe(FeedsEvent.PublishType.updateCredentialFinish, () => {
      this.zone.run(() => {
        this.native.hideLoading();
        this.native.pop();
      });
    });
  }

  ionViewDidEnter() {}

  ionViewWillLeave() {
    this.native.hideLoading();
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.updateCredentialFinish);
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('EditserverinfoPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  async clickScan() {
    let scannedContent = (await this.intentService.scanQRCode()) || '';
    if (scannedContent != '' && scannedContent.indexOf('elastos:') > -1) {
      this.elaAddress = scannedContent.replace('elastos:', '');
    } else {
      this.elaAddress = scannedContent;
    }
  }

  cancel() {
    this.native.pop();
  }

  confirm() {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (this.feedService.getServerStatusFromId(this.nodeId) != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (this.checkParms()) {
      this.native
        .showLoading('common.waitMoment', isDismiss => {})
        .then(() => {
          this.feedService.doUpdateCredential(
            this.nodeId,
            this.did,
            this.name,
            this.introduction,
            this.elaAddress,
            () => {
              this.native.hideLoading();
            },
            () => {
              this.native.hideLoading();
            },
          );
        });
    }
  }

  checkParms() {
    if (this.name === '') {
      this.native.toast_trans('IssuecredentialPage.serverName');
      return false;
    }

    if (this.introduction === '') {
      this.native.toast_trans('IssuecredentialPage.serverDes');
      return false;
    }

    // if(this.elaAddress === ""){
    //   this.native.toast_trans('IssuecredentialPage.elaaddress');
    //   return false;
    // }

    if (
      this.oldServerInfo['elaAddress'] === this.elaAddress &&
      this.oldServerInfo['name'] === this.name &&
      this.oldServerInfo['introduction'] === this.introduction
    ) {
      this.native.toast_trans('common.nochanges');
      return false;
    }
    return true;
  }
}
