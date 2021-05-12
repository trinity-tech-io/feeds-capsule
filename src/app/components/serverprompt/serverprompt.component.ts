import { Component, OnInit, ViewChild,NgZone} from '@angular/core';
import { PopoverController,NavParams} from '@ionic/angular';
import { ThemeService } from 'src/app/services/theme.service';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { IntentService } from 'src/app/services/IntentService';

@Component({
  selector: 'app-serverprompt',
  templateUrl: './serverprompt.component.html',
  styleUrls: ['./serverprompt.component.scss'],
})
export class ServerpromptComponent implements OnInit {
  public did:string = ""
  public nodeId:string = "";
  public serverName:string = "";
  public serverDes:string ="";
  public elaAddress:string ="";
  constructor( 
    private native:NativeService, 
    private feedService:FeedService,
    private navParams: NavParams,
    private popover: PopoverController,  
    private intentService: IntentService,
    public theme: ThemeService,
    public  zone:NgZone) { 

  }

  ngOnInit() {
    this.did = this.navParams.get('did')||"";
    this.nodeId = this.navParams.get('nodeId')||"";
  }

  cancel(){
     if(this.popover!=null){
       this.popover.dismiss();
     }
  }

  async clickScan(){
    let scannedContent = await this.intentService.scanQRCode() || "";
    if(scannedContent != ""&& scannedContent.indexOf("elastos:")>-1){
      this.elaAddress = scannedContent.replace("elastos:","");
    }else{
      this.elaAddress = scannedContent;
    }
  }

  confirm(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }
    
    if (this.serverName == ""){
      this.native.toast_trans('IssuecredentialPage.inputName');
      return;
    }
      
    if (this.serverDes == ""){
      this.native.toast_trans('IssuecredentialPage.inputServerDes');
      return;
    }

    // if (this.elaAddress == ""){
    //   this.native.toast_trans('IssuecredentialPage.inputElaAddress');
    //   return;
    // }

    this.popover.dismiss();
    this.native.showLoading("common.waitMoment",(isDismiss)=>{
    },5*60*1000).then(()=>{
      this.feedService.doIssueCredential(this.nodeId,this.did, this.serverName, this.serverDes,this.elaAddress,()=>{
      }, ()=>{
        this.native.toastWarn('common.issuecredentialError');
        this.native.hideLoading();
      });
    });
    
  }

}
