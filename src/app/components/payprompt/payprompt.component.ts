import { Component, OnInit, ViewChild,NgZone} from '@angular/core';
import { PopoverController,NavParams} from '@ionic/angular';
import { ThemeService } from 'src/app/services/theme.service';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';

declare let appManager: AppManagerPlugin.AppManager;
@Component({
  selector: 'app-payprompt',
  templateUrl: './payprompt.component.html',
  styleUrls: ['./payprompt.component.scss'],
})
export class PaypromptComponent implements OnInit {
  public elaAddress:string ="";
  private amount : number = 0;
  private memo: string = "";
  private defalutMemo: string = "";
  private title: string = "";
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
    this.defalutMemo = this.navParams.get('defalutMemo');
    this.title = this.navParams.get('title');
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
    this.feedService.pay(this.elaAddress, count, this.memo, ()=>{
      this.native.toast('common.success');
      this.popover.dismiss();
    },(err)=>{
      this.native.toastWarn(err);
      this.popover.dismiss();
    });
  }

  number(text) {
    var numPattern = /^(([1-9]\d*)|\d)(.\d{1,9})?$/;
    return numPattern.test(text);
  }
}
