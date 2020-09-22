import { Component, OnInit, NgZone } from '@angular/core';
import { Events} from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { HttpService } from 'src/app/services/HttpService';
import { ActionSheetController } from '@ionic/angular';
import { TranslateService } from "@ngx-translate/core";
import * as _ from 'lodash';
import { ApiUrl } from 'src/app/services/ApiUrl';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
@Component({
  selector: 'app-discoverfeedsinfo',
  templateUrl: './discoverfeedsinfo.page.html',
  styleUrls: ['./discoverfeedsinfo.page.scss'],
})
export class DiscoverfeedsinfoPage implements OnInit { 
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
public elaAddress: string = "";
public isPublic:string ="";
public serverInfo:any = {};
public actionSheet:any = null;
constructor(
  private actionSheetController:ActionSheetController,
  private events: Events,
  private zone: NgZone,
  private native: NativeService,
  private acRoute: ActivatedRoute,
  private feedService: FeedService,
  public theme:ThemeService,
  private translate:TranslateService,
  public httpService:HttpService) {}

ngOnInit() {

  this.acRoute.queryParams.subscribe((data) => {
    this.serverInfo = _.cloneDeep(data)["params"];
    this.feedsUrl = this.serverInfo['url'] || "";
  });

}

initData(){
    this.queryServer();
}

ionViewWillEnter() {
  this.initData();
  this.connectionStatus = this.feedService.getConnectionStatus();
  this.events.subscribe('feeds:connectionChanged',(status)=>{
    this.zone.run(() => {
      this.connectionStatus = status;
    });
  });

  this.events.subscribe("feeds:updateServerList",()=>{
    this.zone.run(() => {
    //this.native.navigateForward('discoverfeeds',""); 
      this.getNodeId();
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

}

ionViewDidEnter(){
  this.initTitle();
  this.native.setTitleBarBackKeyShown(true);
}

ionViewWillLeave(){
  this.native.hideLoading();
  this.events.unsubscribe("feeds:updateServerList");
  this.events.unsubscribe("feeds:serverConnectionChanged");
  this.events.unsubscribe("feeds:updateTitle");
}

initTitle(){
  titleBarManager.setTitle(this.translate.instant('ServerInfoPage.title'));
}

navigateBackPage() {
  this.native.pop();
}

queryServer(){
 this.resolveDid();
}


resolveDid(){
  this.feedService.resolveDidDocument(this.serverInfo['url'],null,
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
      //this.native.navigateForward('discoverfeeds',""); 
    },(err)=>{
      this.native.pop();
    });
}

async removeFeedSource(){
  if(this.connectionStatus !== 0){
    this.native.toastWarn('common.connectionError');
    return;
  }

  this.actionSheet = await this.actionSheetController.create({
    cssClass:'editPost',
    buttons: [{
      text: this.translate.instant("ServerInfoPage.RemovethisFeedSource"),
      role: 'destructive',
      icon: 'trash',
      handler: () => {
        this.native.showLoading('common.waitMoment');
        this.feedService.removeFeedSource(this.nodeId).then(() => {
          this.native.toast("ServerInfoPage.removeserver"); 
          this.native.hideLoading();
          this.navigateBackPage();
        });
      }
    },{
      text: this.translate.instant("ServerInfoPage.cancel"),
      icon: 'close',
      handler: () => {
      }
    }]
  });
  this.actionSheet.onWillDismiss().then(()=>{
    if(this.actionSheet !=null){
      this.actionSheet  = null;
    }
});
  await this.actionSheet.present();
}

async deleteFeedSource(){
  if(this.connectionStatus != 0){
    this.native.toastWarn('common.connectionError');
    return;
  }

  this.actionSheet = await this.actionSheetController.create({
    cssClass:'editPost',
    buttons: [{
      text: this.translate.instant("ServerInfoPage.DeletethisFeedSource"),
      role: 'destructive',
      icon: 'trash',
      handler: () => {
        this.native.showLoading('common.waitMoment');
        this.feedService.deleteFeedSource(this.nodeId).then(() => {
          this.native.toast("ServerInfoPage.removeserver"); 
          this.native.hideLoading();
          this.navigateBackPage();
        });
      }
    }, {
      text: this.translate.instant("ServerInfoPage.cancel"),
      icon: 'close',
      handler: () => {
      }
    }]
  });

  this.actionSheet.onWillDismiss().then(()=>{
    if(this.actionSheet !=null){
      this.actionSheet  = null;
    }
});

  await this.actionSheet.present();

}


getNodeId(){
  let serverList = this.feedService.getServerList() || [];
  let bindingServerList = this.feedService.getBindingServer();
  
  let bindingServer = _.find(bindingServerList,{did:this.serverInfo['did']}) || {};
  console.log("===bindingServer=="+JSON.stringify(bindingServer));
  let bindingnodeId = bindingServer["nodeId"] || "";
  if(bindingnodeId!=""){
      this.nodeId = bindingnodeId;
      this.isBindServer =true;
  }else{
    this.isBindServer = false;
    let server = _.find(serverList,{did:this.serverInfo['did']}) || {};
     this.nodeId = server["nodeId"] || "";
  }

  
}

}



