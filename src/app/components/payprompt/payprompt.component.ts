import { Component, OnInit,NgZone} from '@angular/core';
import { PopoverController,NavParams} from '@ionic/angular';
import { ThemeService } from 'src/app/services/theme.service';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';

@Component({
  selector: 'app-payprompt',
  templateUrl: './payprompt.component.html',
  styleUrls: ['./payprompt.component.scss'],
})
export class PaypromptComponent implements OnInit {
  public elaAddress:string ="";
  public amount:any = "";
  public memo: string = "";
  public defalutMemo: string = "";
  public title: string = "";
  public disableMemo:boolean = false;
  constructor(
    private native:NativeService,
    private feedService:FeedService,
    private navParams: NavParams,
    private popover: PopoverController,
    public theme: ThemeService,
    public  zone:NgZone) {

  }

  ngOnInit() {
    this.elaAddress = this.navParams.get('elaAddress');
    this.memo = this.defalutMemo = this.navParams.get('defalutMemo');
    this.title = this.navParams.get('title');

    if (this.defalutMemo != ""){
      this.disableMemo = true;
    }
  }

  cancel(){
     if(this.popover!=null){
       this.popover.dismiss();
     }
  }

  confirm(){
    let count = this.amount;
    if (!this.number(count)) {
        this.native.toastWarn('common.amountError');
        return;
    }

    if (count <= 0) {
        this.native.toast_trans('common.amountError');
        return;
    }

    if (this.memo == "")
      this.memo = this.defalutMemo;

    this.feedService.pay(this.elaAddress, count, this.memo, (res)=>{
      let result = res["result"];
      let txId = result["txid"] || "";
      if(txId===''){
        this.native.toastWarn('common.fail');
        return;
      }

      this.native.toast('common.success');
      this.popover.dismiss();
    },(err)=>{
      this.native.toastWarn("common.unknownError");
      this.popover.dismiss();
    });
  }

  number(text) {
    var numPattern = /^(([1-9]\d*)|\d)(.\d{1,9})?$/;
    return numPattern.test(text);
  }
}
