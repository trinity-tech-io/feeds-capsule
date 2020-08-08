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
  private   connectionStatus = 1;
  private buttonDisabled: boolean = true;
  private friendRequest = 'Feeds/0.1';
  private carrierAddress: string;

  private address: string = '';
  private isOwner: string = "false";
  private serverStatus:number = 1;
  private clientNumber:number = 0;
  private nodeId:string = "";

  private isBindServer: boolean = false ;
  private didString: string;
  private name: string;
  private owner: string;
  private introduction: string;
  private feedsUrl: string;

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
      this.isOwner = data.isOwner ;
      this.address = data.address;
      if (this.address == null && this.address == undefined)
        this.address = ""

      if (this.address != ''){
          this.zone.run(()=>{
            this.presentLoading();
          });
          this.queryServer();
        }else{
          let server:any ;
          let bindingServer = this.feedService.getBindingServer();
          this.nodeId = data.nodeId;
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
          this.name = server.name;
          this.owner = server.owner;
          this.introduction = server.introduction ||  this.translate.instant('common.nodescriptionyet');
          this.feedsUrl = server.feedsUrl;
        }

    });
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

    this.events.subscribe('feeds:removeFeedSourceFinish',  () => {
      this.zone.run(() => { 
        this.native.navigateForward('/menu/servers',""); 
      });
    });

    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });
    
  }

  ionViewDidEnter(){
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

  ionViewWillLeave(){
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
      this.native.toastdanger("ServerInfoPage.Feedurlmaybeerror");
      this.navigateBackPage();
    }

  }


  resolveDid(){
    this.feedService.resolveDidDocument(this.address,null,
      (server)=>{
        this.zone.run(()=>{
          this.buttonDisabled = false;
          this.name = server.name;
          this.owner = server.owner;
          this.introduction = server.introduction || this.translate.instant('common.nodescriptionyet');
          this.didString = server.did;
          this.carrierAddress = server.carrierAddress;
          this.feedsUrl = server.feedsUrl;
        });
      },(err)=>{
        this.native.toastdanger("ServerInfoPage.error");
        this.buttonDisabled = true;
        this.navigateBackPage();
      }
    );
  }

  addFeedSource() {
    if(this.connectionStatus != 0){
      this.native.toastWarn(this.translate.instant('common.connectionError'));
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
      this.native.toastWarn(this.translate.instant('common.connectionError'));
      return;
    }

    const actionSheet = await this.actionSheetController.create({
      buttons: [{
        text: this.translate.instant("ServerInfoPage.DeletethisFeedSource"),
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.feedService.deleteFeedSource(this.nodeId);
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
      this.native.toastWarn(this.translate.instant('common.connectionError'));
      return;
    }

    const actionSheet = await this.actionSheetController.create({
      buttons: [{
        text: this.translate.instant("ServerInfoPage.RemovethisFeedSource"),
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.feedService.removeFeedSource(this.nodeId);
          this.native.toast_trans("ServerInfoPage.removeserver"); 
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
}
