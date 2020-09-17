import { Component, OnInit, NgZone,ViewChild} from '@angular/core';
import { Events } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { HttpService } from 'src/app/services/HttpService';
import { ApiUrl } from 'src/app/services/ApiUrl';
import { IonInfiniteScroll } from '@ionic/angular';
import * as _ from 'lodash';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
@Component({
  selector: 'app-discoverfeeds',
  templateUrl: './discoverfeeds.page.html',
  styleUrls: ['./discoverfeeds.page.scss'],
})
export class DiscoverfeedsPage implements OnInit {
  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;
  public serverList = [];
  public feedList = [];
  public connectionStatus = 1;
  public pageNum:number = 1;
  public pageSize:number = 10;
  public myFeedSource:any = {};
  public serverStatisticsMap: any ={};
  public curServer:any ={};
  public ownerDid:string ="";
  public totalNum:number = 0;
  constructor(
    private zone: NgZone,
    private native: NativeService,
    private translate: TranslateService,
    private events: Events,
    private feedService: FeedService,
    public theme: ThemeService,
    public httpService:HttpService) { }
    
  ngOnInit() {
    
  }
  ionViewWillEnter() {

    this.events.subscribe('feeds:serverStatisticsChanged', serverStatisticsMap =>{
      this.zone.run(() => {
          this.serverStatisticsMap = serverStatisticsMap || "";
      });
  });
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });

    this.serverList = this.feedService.getServerList();
    this.initData("",false);

    this.httpService.ajaxGet(ApiUrl.listPage+"?pageNum="+this.pageNum+"&pageSize="+this.pageSize).then((result)=>{
      if(result["code"] === 200){
        this.feedList = result["data"]["result"] || [];
     }
    });
  }

  ionViewDidEnter(){
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:updateTitle");
    this.events.unsubscribe("feeds:serverStatisticsChanged");
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("DiscoverfeedsPage.title"));
  }

  clickItem(item:any){
    let address = item["url"] || "";
    if (address.length < 54 ||
      !address.startsWith('feeds://')||
      !address.indexOf("did:elastos:")){
        this.native.toastWarn("AddServerPage.tipMsg");
        return;
    }

   let server = _.find(this.serverList,{did:item['did']});
   if(!server){
      this.native.go("discoverfeedsinfo",{
      params:item
      });
      return;
   }
   this.navToServerInfo(server.nodeId,false);
  }

  initData(events:any,isLoading:boolean=true){
    this.myFeedSource = "";
    this.httpService.ajaxGet(ApiUrl.listPage+"?pageNum="+this.pageNum+"&pageSize="+this.pageSize,isLoading).then((result)=>{
      this.initOwnerServe();
      if(events!=""){
        events.target.complete();
      }
      if(result["code"] === 200){
         this.totalNum = result["data"]["total"];
         this.feedList = result["data"]["result"] || [];
      }
    }).catch((err)=>{
      if(events!=""){
        events.target.complete();
      }
     
    });
  }

  initOwnerServe(){
    this.myFeedSource = this.feedService.getBindingServer() || "";
    if(this.myFeedSource!=''){
      this.curServer = this.feedService.getServerbyNodeId(this.myFeedSource.nodeId);
      this.ownerDid = this.curServer["did"];
      this.serverStatisticsMap = this.feedService.getServerStatisticsMap();
    }
  }

  doRefresh(event:any){
      this.pageNum = 1;
      this.initData(event,false);
  }

  handleStatus(did:string){
   
    if(!_.find(this.serverList,{did:did})) {
        return "DiscoverfeedsPage.notadded"
    }
    return "DiscoverfeedsPage.added";
  }

  navToServerInfo(nodeId: string, isOwner: boolean) {
    this.native.navigateForward(['/menu/servers/server-info',nodeId, isOwner],"");
}

checkServerStatus(nodeId: string){
  return this.feedService.getServerStatusFromId(nodeId);
}

checkConnectClient(nodeId: string){
  if (this.serverStatisticsMap == "" ||
      this.serverStatisticsMap[nodeId] == undefined)
      return 0;
  
  return this.serverStatisticsMap[nodeId].connecting_clients;
}

loadData(events:any){
  this.pageNum =this.pageNum+1;
   this.httpService.ajaxGet(ApiUrl.listPage+"?pageNum="+this.pageNum+"&pageSize="+this.pageSize,false).then((result)=>{
    if(result["code"] === 200){
       this.totalNum = result["data"]["total"];
       let arr = result["data"]["result"] || [];
       this.feedList = this.feedList.concat(arr);
    }
    if(this.feedList.length>=this.totalNum){
      this.infiniteScroll.disabled =true;
    }else{
      this.infiniteScroll.disabled =false;
    }
    events.target.complete();
  }).catch((err)=>{
      events.target.complete();
  });
 }
}
