import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../services/theme.service';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { FeedService } from '../../services/FeedService';
import { NativeService } from '../../services/NativeService';
import { PopupProvider } from '../../services/popup';
import { CarrierService } from '../../services/CarrierService';
import { IntentService } from 'src/app/services/IntentService';
import { TitleBarService } from 'src/app/services/TitleBarService';
@Component({
  selector: 'app-guideubuntu',
  templateUrl: './guideubuntu.page.html',
  styleUrls: ['./guideubuntu.page.scss'],
})
export class GuideubuntuPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public popover: any = null;
  public carrierAddress: string;
  public nonce: string = '0';
  constructor(
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private feedService: FeedService,
    private native: NativeService,
    private intentService: IntentService,
    private carrier: CarrierService,
    private zone: NgZone,
    public popupProvider: PopupProvider,
    public theme: ThemeService
  ) { }

  ngOnInit() {

  }

  ionViewWillEnter() {
    this.initTitle();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('GuideubuntuPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewWillLeave(){

  }

  scanCode(){
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }
    this.checkDid('scanService');
  }

 async checkDid(clickType: string) {
    await this.native.showLoading('common.waitMoment');
    let signInData = this.feedService.getSignInData() || {};
    let did = signInData['did'];
    this.feedService.checkDIDDocument(did).then(isOnSideChain => {
      if (!isOnSideChain) {
        //show one button dialog
        //if click this button
        //call feedService.promptpublishdid() function
        this.native.hideLoading();
        this.openAlert();
        return;
      }
      this.handleJump(clickType);
    });
  }

  openAlert() {
    this.popover = this.popupProvider.ionicAlert(
      this,
      '',
      'common.didnotrelease',
      this.confirm,
      'tskth.svg',
    );
  }

  confirm(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      that.feedService.promptpublishdid();
    }
  }

  handleJump(clickType: string) {
    if (clickType === 'scanService') {
      this.scanAddress();
      return;
    }
  }

  async scanAddress() {
    try {
      this.native.hideLoading();
      let scanObj =  await this.popupProvider.scan() || {};
      let scanData = scanObj["data"] || {};
      let res  = scanData["scannedText"] || "";
      this.handleAddress(res);
    } catch (error) {}
  }

  handleAddress(scanResult: string) {
    scanResult = scanResult || "";
    if(scanResult === ""){
      return;
    }
    if (
      !scanResult.startsWith('feeds://') &&
      !scanResult.startsWith('feeds_raw://')
    ) {
      alert(this.translate.instant('AddServerPage.tipMsg'));
      return;
    }

    let result = this.feedService.parseBindServerUrl(scanResult);
    this.carrierAddress = result.carrierAddress;
    this.nonce = result.nonce;
    let did = result.did;
    this.carrier.getIdFromAddress(
      this.carrierAddress,
      userId => {
        this.addFriends(
          this.carrierAddress,
          userId,
          this.nonce,
          did,
          scanResult,
        );
      },
      err => {},
    );
  }

  addFriends(
    address: string,
    nodeId: string,
    nonce: string,
    did: string,
    scanResult: string,
  ) {
    this.carrier.isValidAddress(
      address,
      (isValid: boolean) => {
        if (!isValid) {
          let errMsg =
            this.translate.instant('common.addressinvalid') + ': ' + address;
          this.native.toast(errMsg);
          return;
        }
        this.carrier.addFriend(
          address,
          'hi',
          () => {
            this.zone.run(() => {
              let feedUrl = '-1';
              if (nonce == undefined) nonce = '';
              if (nonce == '0') feedUrl = scanResult;
              this.native.navigateForward(
                [
                  '/bindservice/startbinding/',
                  nodeId,
                  nonce,
                  address,
                  did,
                  feedUrl,
                ],
                {
                  replaceUrl: true,
                },
              );
            });
          },
          err => {},
        );
      },
      error => {
      },
    );
  }

}
