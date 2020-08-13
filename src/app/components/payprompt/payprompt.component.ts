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
  }

  cancel(){
     if(this.popover!=null){
       this.popover.dismiss();
     }
  }

  confirm(){
    if (this.amount <= 0){
      this.native.toast_trans('IssuecredentialPage.serverName');
      return 
    }
      
    this.feedService.pay(this.elaAddress, this.amount, this.memo, ()=>{
      this.native.toast('common.success');
      this.popover.dismiss();
    },(err)=>{
      this.native.toastWarn(err);
      this.popover.dismiss();
    });
  }

}
