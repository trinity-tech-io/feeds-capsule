import { Component, NgZone } from '@angular/core';
import { ModalController, PopoverController } from '@ionic/angular';
import { ThemeService } from '../../services/theme.service';
import { Logger } from 'src/app/services/logger';
import { Subscription } from 'rxjs';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner/ngx';
import { NativeService } from 'src/app/services/NativeService';
import QrScanner from 'qr-scanner';
import { AlertdialogComponent } from 'src/app/components/alertdialog/alertdialog.component';
QrScanner.WORKER_PATH = "./assets/qr-scanner-worker.min.js"
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
  popover: any = null;
  constructor(
    private popoverController: PopoverController,
    private zone: NgZone,
    private qrScanner: QRScanner,
    public native: NativeService,
    private modalController: ModalController,
    public theme: ThemeService) {
      //默认为false
      this.light = false;
  }

  ionViewWillEnter(){
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
    //document.body.classList.add("transparentBody");
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
    //document.body.classList.remove("transparentBody");
    document.querySelector("my-app").classList.remove("scanHide");
    let ionPopover = document.querySelector("ion-popover") || null;
    if(ionPopover != null ){
      ionPopover.classList.remove("scanHide");
    }
   });
}

  ionViewWillLeave() {
    this.zone.run(async () => {
       this.stopScanning();
       await this.hideCamera();
    });
  }

  ionViewDidLeave() {
    let sid = setTimeout(()=>{
      document.body.removeAttribute("style");
      clearTimeout(sid);
      sid = null;
    },200);
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

  async outerRightIconClicked(){
    await this.scanFromLibrary()
  }

    /**
     * Initiates a QR code scanning from a picture chosen from the library by the user.
     */
  async scanFromLibrary() {
      if (this.popover != null) {
        await this.popover.dismiss();
        this.popover = null;
      }
      Logger.log(TAG, "Stopping camera, getting ready to pick a picture from the gallery.");
      await this.hideCamera();
      this.stopScanning();

      let sid = setTimeout(() => {
          Logger.log("Scanner", "Opening gallery to pick a picture");
          // Ask user to pick a picture from the library
          navigator.camera.getPicture(async (data)=>{
              Logger.log("Scanner", "Got gallery data");
              if (data) {
                 await this.native.showLoading("common.waitMoment");
                  this.zone.run(() => {
                      try {
                          const image = new Image();
                          image.onload = async() => {
                              Logger.log("Scanner", "Loaded image size:", image.width, image.height);

                              let code: string;
                              try {
                                  // why?
                                  // We create worker manually.
                                  // if use 'QrScanner.scanImage(image)', it will create BarcodeDetector engine in some devices, and it can't get the qr code.
                                  let worker: Worker = new Worker(QrScanner.WORKER_PATH)
                                  code = await QrScanner.scanImage(image, null, worker);
                              }
                              catch (err) {
                                  //debugger;
                                  Logger.error("Scanner", err);
                                  code = null;
                                  this.native.hideLoading();
                              }
                              Logger.log("Scanner", "Read qr code:", code);

                              if (code != null) {
                                  // A QR code could be found in the picture
                                  this.native.hideLoading();
                                  this.scannedText = code as string;
                                  this.modalController.dismiss({
                                    'scannedText': this.scannedText,
                                  });
                              } else {
                                  this.native.hideLoading();
                                  void this.scanDialog('common.sorry', 'ScanPage.noQrErr');

                              }
                          }

                          image.src = "data:image/png;base64,"+data; // base64 string

                          // Free the memory
                          navigator.camera.cleanup(()=>{}, (err)=>{});
                      }
                      catch (e) {
                          void this.scanDialog('common.sorry', 'ScanPage.scanErr');
                          this.native.hideLoading();
                          Logger.warn("Scanner", "Error while loading the picture as PNG:", e);
                      }
                  });
              }
          }
          , (err)=>{
              // 'No Image Selected': User canceled.
              if (err === 'No Image Selected') {
                  this.zone.run(() => {
                      this.startScanningProcess();
                  });
              } else {
                  Logger.error("Scanner", err);
                  void this.scanDialog('common.sorry', 'ScanPage.galleryErr');
              }
          }, {
              targetWidth: 1200, // Reduce picture size to avoid memory problems - keep it large enough for QR code readabilitiy
              targetHeight: 1200,
              destinationType: 0, // Return as base64 data string
              sourceType: 0, // Pick from photo library
              encodingType: 1 // Return as PNG base64 data
          });
          clearTimeout(sid);
      }, 100);
  }

  async scanDialog(des1: string,des2: string){
     await this.showalertdialog(
      this,
      des1,
      des2,
      this.ok,
      'finish.svg',
      'common.ok',
    );
  }

  async ok(that: any) {
      if (this.popover != null) {
        await this.popover.dismiss();
        this.popover = null;
        that.zone.run(() => {
        that.startScanningProcess();
        });
      }
  }

  async showalertdialog(
    that: any,
    title: string,
    message: string,
    okFunction: any,
    imgageName: string,
    okText?: string,
  ) {
    this.popover = await this.popoverController.create({
      mode: 'ios',
      cssClass: 'ConfirmdialogComponent',
      component: AlertdialogComponent,
      backdropDismiss: false,
      componentProps: {
        that: that,
        title: title,
        message: message,
        okText: okText,
        okFunction: okFunction,
        imgageName: imgageName,
      },
    });

    this.popover.onWillDismiss().then(() => {
      if (this.popover != null) {
        this.popover = null;
        document.body.removeAttribute("style");
      }
    });
    await this.popover.present();

    return this.popover;
  }
}
