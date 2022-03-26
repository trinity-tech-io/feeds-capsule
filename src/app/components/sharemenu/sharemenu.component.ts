import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-sharemenu',
  templateUrl: './sharemenu.component.html',
  styleUrls: ['./sharemenu.component.scss'],
})
export class SharemenuComponent implements OnInit {
  @Input() destDid: string = '';
  @Input() channelId: string = '';
  @Input() isShowTitle: boolean = false;
  @Input() isShowQrcode: boolean = false;
  @Input() isShowUnfollow: boolean = false;
  @Input() isShowInfo: boolean = false;
  @Input() isPreferences: boolean = false;
  @Input() channelName: string = null;
  @Input() qrCodeString: string = null;
  @Output() hideShareMenu = new EventEmitter();

  constructor(public theme: ThemeService) {}

  ngOnInit() {}

  clickItem(buttonType: string) {
    this.hideShareMenu.emit({
      buttonType: buttonType,
      destDid: this.destDid,
      channelId: this.channelId,
    });
  }
}
