import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FeedService } from 'src/app/services/FeedService';
import { Events } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from "@ngx-translate/core";
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-startbinding',
  templateUrl: './startbinding.page.html',
  styleUrls: ['./startbinding.page.scss'],
})
export class StartbindingPage implements OnInit {
  public connectionStatus = 1;
  public title = "02/06";
  public nonce = "";
  public nodeId: string="";
  public carrierAddress: string="";
  public did:string = "";
  public feedsUrl: string ="";
  // private isProcess = false;
  constructor(
    private zone: NgZone,
    private native: NativeService,
    private events: Events,
    private acRoute: ActivatedRoute,
    private feedService:FeedService,
    public  theme:ThemeService,
    private translate:TranslateService) {
  
  
  }

  ngOnInit() {
    this.acRoute.params.subscribe((data)=>{
      this.nodeId = data.nodeId;

      let nonce = data.nonce || "";
      let did = data.did || "";
      this.feedsUrl = data.feedsUrl || "";

      if (nonce!=""){
        this.nonce = nonce ;
      }else{
        this.nonce = this.feedService.generateNonce();
      }
      
      if(did!=""){
        this.did = did;
      }

      this.carrierAddress = data.address;
    });

  }

  ionViewWillEnter() {
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
        if (this.connectionStatus == 1){
          this.native.hideLoading();
        }
      });
    });
    
    this.events.subscribe('feeds:owner_declared', (nodeId, phase, did, payload) => {
      switch(phase){
        case "owner_declared":
          this.zone.run(() => {
              this.native.navigateForward(['/bindservice/importdid/',nodeId],{
                replaceUrl: true
              });
          });
          break;

        case "credential_issued":
          this.zone.run(() => {
              this.feedService.restoreBindingServerCache(this.did, nodeId, ()=>{
                this.feedService.finishBinding(nodeId);
              },()=>{  
                this.feedService.finishBinding(nodeId);
              });
          });
          break;
      }

      this.native.hideLoading();
    });
    
    this.events.subscribe('feeds:issue_credential', () => {
      this.zone.run(() => {
          this.native.getNavCtrl().navigateForward(['/bindservice/finish/',this.nodeId],{
            replaceUrl: true
          });
      });
    });
    
    this.events.subscribe("feeds:friendConnectionChanged", (nodeId, status)=>{
      if(this.nodeId == nodeId && status == 0)
      this.native.hideLoading();
    });

    // this.native.showLoading("Connecting server").then(() => {
    // });

    this.events.subscribe('feeds:resolveDidError', (nodeId, did, payload) => {
      this.zone.run(() => {
          this.native.navigateForward(['/bindservice/publishdid/',nodeId, did, payload],{
            replaceUrl: true
          });
          this.native.hideLoading();
      });
    });

    
    this.events.subscribe('feeds:resolveDidSucess', (nodeId, did) => {
      this.zone.run(() => {
          this.native.navigateForward(['/bindservice/issuecredential', nodeId, did],{
            replaceUrl: true
          });
          this.native.hideLoading();
      });
    });

    this.events.subscribe('rpcResponse:error',()=>{
      this.zone.run(() => {
        this.native.hideLoading();
      });
    });
  }

  initTitle(){
    titleBarManager.setTitle(this.title);
  }

  ionViewDidEnter() {
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

  ionViewWillLeave(){
    this.native.hideLoading();
    this.feedService.cleanDeclareOwner();
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:owner_declared");
    this.events.unsubscribe("feeds:issue_credential");
    this.events.unsubscribe("feeds:friendConnectionChanged");
    this.events.unsubscribe("feeds:resolveDidError");
    this.events.unsubscribe("feeds:resolveDidSucess");
    this.events.unsubscribe("rpcResponse:error");
  }

  confirm(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }
    
    this.native.showLoading("loading",5*60*1000).then(()=>{
      this.feedService.startDeclareOwner(this.nodeId, this.carrierAddress, this.nonce);
    });
  }

  abort(){
    this.native.pop();
    this.native.hideLoading();
  }


}
