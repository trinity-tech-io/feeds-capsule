import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { PopoverController, NavParams } from '@ionic/angular';
import { ThemeService } from '../../services/theme.service';
import { FeedService } from '../../services/FeedService';
import { NativeService } from '../../services/NativeService';
import { PopupProvider } from 'src/app/services/popup';
import { DataHelper } from 'src/app/services/DataHelper';

@Component({
  selector: 'app-serverprompt',
  templateUrl: './serverprompt.component.html',
  styleUrls: ['./serverprompt.component.scss'],
})
export class ServerpromptComponent implements OnInit {
  public did: string = '';
  public nodeId: string = '';
  public serverName: string = '';
  public serverDes: string = '';
  public elaAddress: string = '';
  constructor(
    private native: NativeService,
    private feedService: FeedService,
    private navParams: NavParams,
    private popover: PopoverController,
    private popupProvider: PopupProvider,
    private dataHelper: DataHelper,
    public theme: ThemeService,
    public zone: NgZone,
  ) {}

  ngOnInit() {
    this.did = this.navParams.get('did') || '';
    this.nodeId = this.navParams.get('nodeId') || '';
  }

  cancel() {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  async clickScan() {
    let scanObj =  await this.popupProvider.scan() || {};
    let scanData = scanObj["data"] || {};
    let scannedContent = scanData["scannedText"] || "";
    if (scannedContent != '' && scannedContent.indexOf('elastos:') > -1) {
      this.elaAddress = scannedContent.replace('elastos:', '');
    } else {
      this.elaAddress = scannedContent;
    }
  }

  confirm() {
    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (this.serverName == '') {
      this.native.toast_trans('IssuecredentialPage.inputName');
      return;
    }

    if (this.serverDes == '') {
      this.native.toast_trans('IssuecredentialPage.inputServerDes');
      return;
    }

    this.popover.dismiss();
    this.native
      .showLoading('common.waitMoment', isDismiss => {}, 5 * 60 * 1000)
      .then(() => {
        this.feedService.doIssueCredential(
          this.nodeId,
          this.did,
          this.serverName,
          this.serverDes,
          this.elaAddress,
          () => {},
          () => {
            this.native.toastWarn('common.issuecredentialError');
            this.native.hideLoading();
          },
        );
      });
  }
}
