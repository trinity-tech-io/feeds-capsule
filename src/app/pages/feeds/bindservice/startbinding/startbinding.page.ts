import { Component, OnInit, NgZone } from '@angular/core';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { FeedService } from 'src/app/services/FeedService';
import { Events } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-startbinding',
  templateUrl: './startbinding.page.html',
  styleUrls: ['./startbinding.page.scss'],
})
export class StartbindingPage implements OnInit {
  private title = "02/06";
  public nonce = "";
  private nodeId: string;
  private carrierAddress: string;
  private did:string = "";
  public feedsUrl: string ="";
  private isProcess = false;
  constructor(
    private zone: NgZone,
    private native: NativeService,
    private events: Events,
    private acRoute: ActivatedRoute,
    private feedService:FeedService,
    private navCtrl: NavController,
    public  theme:ThemeService
  ) {
    acRoute.params.subscribe((data)=>{
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
      // if(this.feedService.getFriendConnection(this.nodeId) == 1){
      //   this.native.showLoading(this.translate.instant("StartbindingPage.Connectingserver"));
      // }
    });

    

  }

  ngOnInit() {

  }

  ionViewWillEnter() {
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);

    this.events.subscribe('feeds:owner_declared', (nodeId, phase, did, payload) => {
      if (!this.isProcess){
        this.isProcess = true;
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
        this.isProcess = true;
      }
      
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
      });
    });

    
    this.events.subscribe('feeds:resolveDidSucess', (nodeId, did) => {
      this.zone.run(() => {
          this.native.navigateForward(['/bindservice/issuecredential', nodeId, did],{
            replaceUrl: true
          });
      });
    });
  }

  initTitle(){
    titleBarManager.setTitle(this.title);
  }

  ionViewWillUnload(){
    this.events.unsubscribe("feeds:owner_declared");
    this.events.unsubscribe("feeds:issue_credential");
    this.events.unsubscribe("feeds:friendConnectionChanged");
    this.events.unsubscribe("feeds:resolveDidError");
    this.events.unsubscribe("feeds:resolveDidSucess");
  }

  confirm(){
    this.feedService.declareOwnerRequest(this.nodeId, this.carrierAddress, this.nonce);
  }

  abort(){
    this.navCtrl.pop();
  }
}
