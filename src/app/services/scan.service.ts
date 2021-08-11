import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  BarcodeScanner,
  BarcodeScannerOptions,
  BarcodeScanResult,
} from '@ionic-native/barcode-scanner/ngx';
import { Logger } from './logger';
const TAG: string = 'ScanService';
@Injectable()
export class ScanService {
  constructor(
    private barcodeScanner: BarcodeScanner,
    private translate: TranslateService,
  ) {}

  scanBarcode(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const options: BarcodeScannerOptions = {
        preferFrontCamera: false,
        showFlipCameraButton: false,
        showTorchButton: false,
        torchOn: false,
        prompt: this.translate.instant('common.scannerPrompt'),
        resultDisplayDuration: 0,
        formats: 'EAN_13,EAN_8,QR_CODE,PDF_417 ',
        orientation: 'portrait',
      };

      let result: BarcodeScanResult = await this.barcodeScanner.scan(options);
      resolve(result.text);
    });
  }

  createBarcode(input: string) {
    this.barcodeScanner
      .encode(this.barcodeScanner.Encode.TEXT_TYPE, input)
      .then(
        encodedData => {
        },
        err => {
          Logger.error(TAG, 'Create barcode error' + err);
        },
      );
  }
}
