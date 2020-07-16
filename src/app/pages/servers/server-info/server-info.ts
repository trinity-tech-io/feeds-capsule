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
  private buttonDisabled: boolean = true;
  private friendRequest = 'Feeds/0.1';
  private carrierAddress: string;

  private address: string = '';
  // state: number = 0;
  // private connectStatus:any;
  // private serversStatus:any;
  private serverStatus:number = 1;
  private clientNumber:number = 0;
  private nodeId:string = "";

  private isBindServer: boolean = false ;
  private didString: string;
  // private attrs;
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
    // this.didString="did:elastos:ixxxxxxxxxxxxxxxxxxx"

    // feeds:serverConnectionChanged
    this.events.subscribe('feeds:serverConnectionChanged', serversStatus => {
      this.zone.run(() => {
          if (this.address == ""){
            this.serverStatus = this.feedService.getServerStatusFromId(this.nodeId);
          }
      });
  });

    this.acRoute.params.subscribe(data => {
      this.address = data.address;
      if (this.address != null &&
        this.address != undefined &&
        this.address != ''){
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
            server = this.feedService.getBindingServer();

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
          this.introduction = server.introduction;
          this.feedsUrl = server.feedsUrl;
        }
          
    });
  }

  ionViewDidEnter() {
    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

  ionViewWillUnload(){
    this.events.unsubscribe("feeds:updateTitle");
  }


  initTitle(){
    titleBarManager.setTitle(this.translate.instant('ServerInfoPage.serverInfo'));
  }


  navigateBackPage() {
    this.native.pop();
  }

  async presentLoading() {
    const loading = await this.loadingController.create({
      message: 'Please wait...',
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
      alert("Feed url maybe error.")
    }

  }


  resolveDid(){
    this.feedService.resolveDidDocument(this.address,null,
      (server)=>{
        this.zone.run(()=>{
          this.buttonDisabled = false;
          this.name = server.name;
          this.owner = server.owner;
          this.introduction = server.introduction;
          this.didString = server.did;
          this.carrierAddress = server.carrierAddress;
          this.feedsUrl = server.feedsUrl;
        });
      },(err)=>{
        this.buttonDisabled = true;
      }
    );
  }

  addFeedSource() {
    this.feedService.addServer(this.carrierAddress,this.friendRequest,
      this.name, this.owner, this.introduction, 
      this.didString, this.feedsUrl, ()=>{
        this.native.pop();
      },(err)=>{

      });
  }

  async deleteFeedSource(){
    const actionSheet = await this.actionSheetController.create({
      buttons: [{
        text: 'Delete this Feed Source?',
        icon: 'trash',
        handler: () => {
          this.feedService.deleteFeedSource(this.nodeId);
        }
      },{
        text: 'Cancel',
        icon: 'close',
        handler: () => {
        }
      }]
    });
    await actionSheet.present();
    
  }

  async removeFeedSource(){
    const actionSheet = await this.actionSheetController.create({
      buttons: [{
        text: 'Remove this Feed Source?',
        icon: 'trash',
        handler: () => {
          this.feedService.removeFeedSource(this.nodeId);
          alert("remove server");
        }
      },{
        text: 'Cancel',
        icon: 'close',
        handler: () => {
        }
      }]
    });
    await actionSheet.present(); 
  }
}
