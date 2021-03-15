import { Component,OnInit,Input,Output,EventEmitter} from '@angular/core';
import { QRCodeComponent } from 'angularx-qrcode';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-sharemenu',
  templateUrl: './sharemenu.component.html',
  styleUrls: ['./sharemenu.component.scss'],
})
export class SharemenuComponent implements OnInit {
  @Input() nodeId:string = "";
  @Input() feedId:string = "";
  @Input() isShowTitle:boolean = false;
  @Input() isShowQrcode:boolean = false;
  @Input() isShowUnfollow:boolean = false;
  @Input() feedName:string = null;
  @Input() qrCodeString:string = null;
  @Output() hideShareMenu = new EventEmitter();

  constructor(
    public theme: ThemeService){ }

  ngOnInit() {

  }

  clickItem(buttonType:string){
    this.hideShareMenu.emit({"buttonType":buttonType,"nodeId":this.nodeId,"feedId":this.feedId});
  }

}
