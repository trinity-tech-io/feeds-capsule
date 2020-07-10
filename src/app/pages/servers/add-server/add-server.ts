import { Component, OnInit, NgZone } from '@angular/core';
import { Events, Platform, LoadingController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { CarrierService } from 'src/app/services/CarrierService';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { AppService } from 'src/app/services/AppService';
import { PopupProvider } from 'src/app/services/popup';
import { TranslateService } from "@ngx-translate/core";
@Component({
  selector: 'page-add-server',
  templateUrl: 'add-server.html',
  styleUrls: ['add-server.scss'],
})

export class AddServerPage implements OnInit {
  private connectStatus = 1;
  private address: string = '';
  
  private buttonDisabled = false;
  
  private name: string;
  private owner: string;
  private introduction: string;
  private did: string;
  private feedsUrl: string;

  constructor(
    private router: Router,
    private events: Events,
    private zone: NgZone,
    private acRoute: ActivatedRoute,
    private platform: Platform,
    private native: NativeService,
    private feedService: FeedService,
    private appService: AppService,
    private popup: PopupProvider,
    private loadingController: LoadingController,
    private carrier: CarrierService,
    private translate:TranslateService) {
      this.connectStatus = this.feedService.getConnectionStatus();
      // this.acRoute.params.subscribe(data => {
      //   this.address = data.address;
      //   if (this.address == null ||
      //     this.address == undefined||
      //     this.address == '')
      //     return;
      //     this.zone.run(()=>{
      //       this.presentLoading();
      //     });
      //   this.queryServer();
      // });

      this.events.subscribe('feeds:connectionChanged', connectionStatus => {
        this.zone.run(() => {
            this.connectStatus = connectionStatus;
        });
      });

      this.events.subscribe('feeds:updateServerList', ()=>{
        this.zone.run(() => {
          this.native.pop();
        });
      });
  }

  ngOnInit() {}

  navToBack() {
    this.native.pop();
  }



  scanCode(){
    this.native.pop();
    this.appService.scanAddress();
  }

  alertError(error: string){
    alert (error);
  }
  
  // onChange(){
  //   this.queryServer();
  // }

  confirm(){
    if (this.address.length > 53&&
      this.address.startsWith('feeds://') && 
      this.address.indexOf("did:elastos:")
    ){
      this.router.navigate(['/menu/servers/server-info', this.address,""]);
    }else{
      alert(this.translate.instant('AddServerPage.tipMsg'));
    }
  }



}
