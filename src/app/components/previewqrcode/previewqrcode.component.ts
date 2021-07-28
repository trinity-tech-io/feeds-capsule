import { Component, OnInit } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
@Component({
  selector: 'app-previewqrcode',
  templateUrl: './previewqrcode.component.html',
  styleUrls: ['./previewqrcode.component.scss'],
})
export class PreviewqrcodeComponent implements OnInit {
  public qrCodeString: string = '';
  public qrCodewidth: number = 0;
  public styleObj: any = { 'margin-top': '' };
  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
  ) {
    this.qrCodewidth = screen.width - 55;
    this.styleObj['margin-top'] =
      (screen.height - this.qrCodewidth - 113.4) / 2 + 'px';
  }

  ngOnInit() {
    this.qrCodeString = this.navParams.get('qrCodeString') || '';
  }

  hidePreviewQrcode() {
    this.modalController.dismiss();
  }

  ionViewDidLeave() {
    this.modalController.dismiss();
  }
}
