import { Component, OnInit, NgZone } from '@angular/core';
import { PopoverController, NavParams } from '@ionic/angular';
import { ThemeService } from 'src/app/services/theme.service';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { PopupProvider } from 'src/app/services/popup';
import { Events } from '../../services/events.service';

@Component({
  selector: 'app-payprompt',
  templateUrl: './payprompt.component.html',
  styleUrls: ['./payprompt.component.scss'],
})
export class PaypromptComponent implements OnInit {
  public elaAddress: string = '';
  public amount: any = '';
  public memo: string = '';
  public defalutMemo: string = '';
  public title: string = '';
  public disableMemo: boolean = false;
  public isAdvancedSetting: boolean = false;
  public nodeId: string = '';
  public channelId: string = null;
  public channelAvatar: string = '';
  public channelName: string = '';
  private confirmdialog: any = null;
  constructor(
    private native: NativeService,
    private feedService: FeedService,
    private navParams: NavParams,
    private popupProvider: PopupProvider,
    private popover: PopoverController,
    private events: Events,
    public theme: ThemeService,
    public zone: NgZone,
  ) {}

  ngOnInit() {
    this.nodeId = this.navParams.get('nodeId') || '';
    if (this.nodeId != '') {
      this.channelId = this.navParams.get('channelId') || "0";
      let channel = this.feedService.getChannelFromId(
        this.nodeId,
        this.channelId,
      );
      this.channelName = channel.name || '';
      this.channelAvatar =
        this.feedService.parseChannelAvatar(channel.avatar) || '';
    }
    this.amount = this.navParams.get('amount') || "";
    this.elaAddress = this.navParams.get('elaAddress');
    this.memo = this.defalutMemo = this.navParams.get('defalutMemo') || "";
    this.title = this.navParams.get('title');

    if (this.defalutMemo != '') {
      this.isAdvancedSetting = true;
    }
  }

ionViewDidEnter() {

  document.querySelector("ion-backdrop").onclick = async ()=>{

    let amount = this.amount || "";
      if(amount != ""){
          return;
      }
    let memo = this.memo || "";
      if( memo != ""){
        return;
      }
      if (this.popover != null) {
        await this.popover.dismiss();
      }
  }

}

 async cancel() {

   let amount = this.amount || "";
   let memo = this.memo || "";

    if(amount != "" || memo != ""){
      //关闭当前对话框
      if (this.popover != null) {
        await this.popover.dismiss();
      }
      await this.showEditedContentPrompt();
      return;
    }

    if (this.popover != null) {
      await this.popover.dismiss();
    }

  }

  confirm() {
    let count = this.amount;
    if (!this.number(count)) {
      this.native.toastWarn('common.amountError');
      return;
    }

    if (count <= 0) {
      this.native.toast_trans('common.amountError');
      return;
    }

    if (this.memo == '') this.memo = this.defalutMemo;

    this.feedService.pay(
      this.elaAddress,
      count,
      this.memo,
      res => {
        let result = res['result'];
        let txId = result['txid'] || '';
        if (txId === '') {
          this.native.toastWarn('common.fail');
          return;
        }

        this.native.toast('common.success');
        this.popover.dismiss();
      },
      err => {
        this.native.toastWarn('common.unknownError');
        this.popover.dismiss();
      },
    );
  }

  number(text) {
    var numPattern = /^(([1-9]\d*)|\d)(.\d{1,9})?$/;
    return numPattern.test(text);
  }

  advancedSettings() {
    this.isAdvancedSetting = !this.isAdvancedSetting;
  }

  async showEditedContentPrompt() {
    this.confirmdialog = await this.popupProvider.showConfirmdialog(
      this,
      'common.confirmDialog',
      'common.editedContentDes',
      this.cancelButton,
      this.okButton,
      './assets/images/finish.svg',
      'common.editedContentDes1',
      "common.editedContentDes2"
     );
  }

 async cancelButton(that: any){
    if (that.confirmdialog != null) {
     await that.confirmdialog.dismiss();
     that.confirmdialog = null;
     that.events.publish(FeedsEvent.PublishType.openPayPrompt,{
       nodeId:that.nodeId,
       channelId:that.channelId,
       elaAddress:that.elaAddress,
       amount :that.amount,
       memo:that.memo
      });
    }
  }

 async okButton(that: any) {
    if (that.confirmdialog != null) {
       await that.confirmdialog.dismiss();
      that.confirmdialog = null;
    }
  }
}
