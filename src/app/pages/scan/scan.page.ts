import { Component, NgZone,ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../services/theme.service';
import { Logger } from 'src/app/services/logger';
import { Subscription } from 'rxjs';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner/ngx';
import { NativeService } from 'src/app/services/NativeService';
// import QrScanner from 'qr-scanner';
// QrScanner.WORKER_PATH = "./assets/qr-scanner-worker.min.js"
let TAG: string = 'ScanPage';
@Component({
  selector: 'app-scan',
  templateUrl: './scan.page.html',
  styleUrls: ['./scan.page.scss'],
})
export class ScanPage{
  isCameraShown = false;
  contentWasScanned = false;
  scannedText = "";
  scanSub: Subscription = null;
  public lightThemeType: number = 1;
  light: boolean;//判断闪光灯
  frontCamera: boolean;//判断摄像头
  constructor(
    private translate: TranslateService,
    private zone: NgZone,
    private qrScanner: QRScanner,
    public native: NativeService,
    private modalController: ModalController,
    public theme: ThemeService) {
      //默认为false
      this.light = false;
      this.frontCamera = false;
  }

  ionViewWillEnter(){
   this.initTitle();
  }

  initTitle() {

  }

  ionViewDidEnter(){
    //页面可见时才执行
    Logger.log(TAG, "Starting scanning process");
    this.startScanningProcess();
  }

 startScanningProcess() {
    this.qrScanner.prepare().then(async (status: QRScannerStatus) => {
        Logger.log(TAG, "Scanner prepared")
        if (status.authorized) {
            // Camera permission was granted. Start scanning
            Logger.log(TAG,"Scanner authorized")

            // Show camera preview
            Logger.log(TAG,"Showing camera preview")
            await this.showCamera();
            // Start scanning and listening to scan results
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            this.scanSub = this.qrScanner.scan().subscribe(async (text: string) => {
                Logger.log(TAG, "Scanned data: ", text)
                this.scannedText = text;

                this.zone.run(() => {
                    this.contentWasScanned = true;
                });

                //await this.hideCamera();
                //this.stopScanning();
                this.modalController.dismiss({
                  'scannedText': this.scannedText,
                  'contentWasScanned':this.contentWasScanned
                });
            });
            // Wait for user to scan something, then the observable callback will be called
        } else if (status.denied) {
            // Camera permission was permanently denied
            Logger.log(TAG, "Access to QRScanner plugin was permanently denied")
        } else {
            // Permission was denied, but not permanently. You can ask for permission again at a later time.
            Logger.log(TAG, "Access to QRScanner plugin is currently denied")
        }
    }).catch((e: any) => console.error("Scanner", 'Unexpected error: ', e, e));
}



  /**
   * 闪光灯控制，默认关闭
   */
  toggleLight() {
    if (this.light) {
      this.qrScanner.disableLight();
    } else {
      this.qrScanner.enableLight();
    }
    this.light = !this.light;
  }

  async showCamera() {
    // Make sure to make ion-app and ion-content transparent to see the camera preview
    document.body.classList.add("transparentBody");
    await this.qrScanner.show();
    document.querySelector("my-app").classList.add("scanHide");
    let ionPopover = document.querySelector("ion-popover") || null;
    if(ionPopover != null ){
      ionPopover.classList.add("scanHide");
    }
    this.isCameraShown = true; // Will display controls

}
async hideCamera() {
  window.document.querySelector('ion-app').classList.remove('transparentBody')
  await this.qrScanner.hide();
  await this.qrScanner.destroy();

  this.zone.run(() => {
    this.isCameraShown = false;
    document.body.classList.remove("transparentBody");
    document.querySelector("my-app").classList.remove("scanHide");
    let ionPopover = document.querySelector("ion-popover") || null;
    if(ionPopover != null ){
      ionPopover.classList.remove("scanHide");
    }
   });
}

  ionViewWillLeave() {
    this.zone.run(() => {
        console.log("Scanner", "Scan view is leaving")
        this.stopScanning();
        this.hideCamera();
    });
  }

  ionViewDidLeave() {
    document.body.removeAttribute("style");
  }

  stopScanning() {
    if (this.scanSub) {
        this.scanSub.unsubscribe();
        this.scanSub = null;
    }
  }

 async outerLeftIconClicked(){
   await this.modalController.dismiss({
      'scannedText':"" ,
      'contentWasScanned':false
    });
 }

 outerRightIconClicked(){

 }
}
