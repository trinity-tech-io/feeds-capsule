import { Component, OnInit, NgZone } from '@angular/core';
import { Events,LoadingController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { ActionSheetController } from '@ionic/angular';
import { TranslateService } from "@ngx-translate/core";
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
class Attribute {
  constructor(
    public iconName: string,
    public attrName: string,
    public attrValue: string) {}
}

@Component({
  selector: 'page-server-info',
  templateUrl: 'server-info.html',
  styleUrls: ['server-info.scss'],
})

export class ServerInfoPage implements OnInit {
  public  connectionStatus = 1;
  public  buttonDisabled: boolean = true;
  public  friendRequest = 'Feeds/0.1';
  public  carrierAddress: string;

  public address: string = '';
  public  isOwner: string = "false";
  public  serverStatus:number = 1;
  public clientNumber:number = 0;
  public  nodeId:string = "";

  public isBindServer: boolean = false ;
  public didString: string ="";
  public name: string ="";
  public owner: string ="";
  public introduction: string ="";
  public feedsUrl: string = null;
  public  elaAddress: string = "";
  constructor(
    private actionSheetController:ActionSheetController,
    private events: Events,
    private loadingController: LoadingController,
    private zone: NgZone,
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private feedService: FeedService,
    public theme:ThemeService,
    private translate:TranslateService) {}

  ngOnInit() {
    this.acRoute.params.subscribe(data => {
      this.isOwner = data.isOwner || "";
      this.address = data.address || "";
      this.nodeId = data.nodeId||"";
      this.initData();
    });
  }

  initData(){
    if (this.address != ''){
      this.zone.run(()=>{
        this.presentLoading();
      });
      this.queryServer();
    }else{
      let server:any ;
      let bindingServer = this.feedService.getBindingServer();
      
      if (bindingServer != null &&
        bindingServer !=undefined &&
        this.nodeId == bindingServer.nodeId){
        server = this.feedService.getServerbyNodeId(this.nodeId);

        this.isBindServer = true;
      }else{
        server = this.feedService.getServerbyNodeId(this.nodeId);
        this.isBindServer = false;
      }

      this.serverStatus = this.feedService.getServerStatusFromId(this.nodeId);
      this.clientNumber = this.feedService.getServerStatisticsNumber(this.nodeId);

      if (server == undefined){
        return ;
      }

      this.didString = server.did;
      this.name = server.name ||  this.translate.instant('DIDdata.NotprovidedfromDIDDocument');
      this.owner = server.owner;
      this.introduction = server.introduction ||  this.translate.instant('DIDdata.NotprovidedfromDIDDocument');
      this.feedsUrl = server.feedsUrl || "";
      this.elaAddress = server.elaAddress || this.translate.instant('DIDdata.Notprovided');
    }
  }

  ionViewWillEnter() {
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe("feeds:updateServerList",()=>{
      this.zone.run(() => {
      this.native.navigateForward('/menu/servers',""); 
      });
    });
  
    this.events.subscribe('feeds:serverConnectionChanged', serversStatus => {
      this.zone.run(() => {
          if (this.address == ""){
            this.serverStatus = this.feedService.getServerStatusFromId(this.nodeId);
          }
      });
    });

    this.events.subscribe('feeds:serverConnectionChanged', serversStatus => {
      this.zone.run(() => {
          if (this.address == ""){
            this.serverStatus = this.feedService.getServerStatusFromId(this.nodeId);
          }
      });
    });

    this.events.subscribe('feeds:login_finish',  () => {
      this.zone.run(() => { 
        this.initData();
        this.native.hideLoading();
      });
    });

    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });

    this.events.subscribe("feeds:removeFeedSourceFinish",()=>{
      // this.initTitle();
      this.native.hideLoading();
    });
    
    
  }

  ionViewDidEnter(){
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

  ionViewWillLeave(){
    this.native.hideLoading();
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:updateServerList");
    this.events.unsubscribe("feeds:serverConnectionChanged");
    this.events.unsubscribe("feeds:removeFeedSourceFinish");
    this.events.unsubscribe("feeds:updateTitle");
  }






  initTitle(){
    titleBarManager.setTitle(this.translate.instant('ServerInfoPage.title'));
  }


  navigateBackPage() {
    this.native.pop();
  }

  async presentLoading() {
    const loading = await this.loadingController.create({
      message: this.translate.instant("ServerInfoPage.Pleasewait"),
      duration: 2000
    });
    await loading.present();

    const { role, data } = await loading.onDidDismiss();
  }

  queryServer(){
    if (this.address.length > 53&&
      this.address.startsWith('feeds://') &&
      this.address.indexOf("did:elastos:")
    ) this.resolveDid();
    else{
      this.native.toastWarn("ServerInfoPage.Feedurlmaybeerror");
      this.navigateBackPage();
    }

  }


  resolveDid(){
    this.feedService.resolveDidDocument(this.address,null,
      (server)=>{
        this.zone.run(()=>{
          this.buttonDisabled = false;
          this.name = server.name || this.translate.instant('DIDdata.NotprovidedfromDIDDocument');
          this.owner = server.owner;
          this.introduction = server.introduction || this.translate.instant('DIDdata.NotprovidedfromDIDDocument');
          this.didString = server.did;
          this.carrierAddress = server.carrierAddress;
          this.feedsUrl = server.feedsUrl || "";
        });
      },(err)=>{
        this.native.toastWarn("ServerInfoPage.error");
        this.buttonDisabled = true;
        this.navigateBackPage();
      }
    );
  }

  addFeedSource() {
    if(this.connectionStatus != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.feedService.addServer(this.carrierAddress,this.friendRequest,
      this.name, this.owner, this.introduction,
      this.didString, this.feedsUrl, ()=>{
        this.native.navigateForward('/menu/servers',""); 
      },(err)=>{
        this.native.pop();
      });
  }

  async deleteFeedSource(){
    if(this.connectionStatus != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    const actionSheet = await this.actionSheetController.create({
      buttons: [{
        text: this.translate.instant("ServerInfoPage.DeletethisFeedSource"),
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.native.showLoading('common.waitMoment');
          this.feedService.deleteFeedSource(this.nodeId).then;
        }
      },{
        text: this.translate.instant("ServerInfoPage.cancel"),
        icon: 'close',
        handler: () => {
        }
      }]
    });
    await actionSheet.present();

  }

  async removeFeedSource(){
    if(this.connectionStatus != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    const actionSheet = await this.actionSheetController.create({
      buttons: [{
        text: this.translate.instant("ServerInfoPage.RemovethisFeedSource"),
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.native.showLoading('common.waitMoment');
          this.feedService.removeFeedSource(this.nodeId).then(()=>{
            this.native.toast_trans("ServerInfoPage.removeserver"); 
            this.native.hideLoading();
          });
        }
      },{
        text: this.translate.instant("ServerInfoPage.cancel"),
        icon: 'close',
        handler: () => {
        }
      }]
    });
    await actionSheet.present();
  }

  clickEdit(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.native.go(
      "/editserverinfo", 
      { 
        "address":this.address,
        "name":this.name,
        "introduction":this.introduction,
        "elaAddress":this.elaAddress,
        "nodeId":this.nodeId,
        "did":this.didString,
      }
    )
  }

  checkIsMine(){
    let bindServerDid = this.feedService.getBindingServer().did||'';
    if (this.didString == bindServerDid)
      return 0;

    return 1;
  }
}
