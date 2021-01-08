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
  selector: 'app-discoverfeed',
  templateUrl: './discoverfeed.page.html',
  styleUrls: ['./discoverfeed.page.scss'],
})
// let obj = {
//   "did":this.serverInfo['did'],
//   "name":this.name,
//   "description":this.des,
//   "url":this.feedsUrl,
//   "feedsUrlHash":feedsUrlHash,
//   "feedsAvatar":this.channelAvatar,
//   "followers":followers,
//   "ownerName":this.serverInfo["owner"]
// };

// channel
// {
// 	"nodeId": "CqYSEtXU21KsQQMx9D8y3Rpoe6559NE384Qj6j95V1pJ",
// 	"id": 5,
// 	"name": "test19",
// 	"introduction": "test19",
// 	"owner_name": "test",
// 	"owner_did": "did:elastos:imZgAo9W38Vzo1pJQfHp6NJp9LZsrnRPRr",
// 	"subscribers": 0,
// 	"last_update": 1608534192000,
// 	"last_post": "",
// 	"avatar": "assets/images/profile-1.svg",
// 	"isSubscribed": false
// }
export class DiscoverfeedPage implements OnInit {

  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;
  public channelList = [];
  public feedList = [];
  public connectionStatus = 1;
  public pageNum:number = 1;
  public pageSize:number = 10;
  public myFeedSource:any = {};
  public serverStatisticsMap: any ={};
  public curServer:any ={};
  public ownerDid:string ="";
  public totalNum:number = 0;
  public isLoading:boolean =true;
  constructor(
    private zone: NgZone,
    private native: NativeService,
    private translate: TranslateService,
    private events: Events,
    private feedService: FeedService,
    public theme: ThemeService,
    public httpService:HttpService) { }

  ngOnInit() {
    this.pageNum =1;
    this.initData("",true);
  }
  ionViewWillEnter() {
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);

    this.channelList = this.feedService.getChannelsList();
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
  }

  ionViewDidEnter(){
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:updateTitle");
    this.events.unsubscribe("feeds:serverStatisticsChanged");
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("DiscoverfeedPage.title"));
  }

  clickItem(item:any){
  let nodeId = item["nodeId"];
  let feedUrl = item["url"];
  console.log("feedUrl"+JSON.stringify(feedUrl.split("/")));
  let channelId = feedUrl.split("/")[4];
  let channel:any = _.find(this.channelList,(item:any)=>{
     return (item["nodeId"]==nodeId&&item["id"]==channelId)
  });
  if(!channel.isSubscribed){
    this.native.go("discoverfeedinfo",{
     params:item
    });
  }else{
    if(item["feedsAvatar"].indexOf("data:image")>-1){
      this.feedService.setSelsectIndex(0);
      this.feedService.setProfileIamge(item["feedsAvatar"]);
     }else if(item["feedsAvatar"].indexOf("assets/images")>-1){
      let index = item["feedsAvatar"].substring(item["feedsAvatar"].length-5,item["feedsAvatar"].length-4);
      this.feedService.setSelsectIndex(index);
      this.feedService.setProfileIamge(item["feedsAvatar"]);
     }

    this.feedService.setChannelInfo(
      {
        "nodeId":nodeId,
        "channelId":channelId,
        "name":item["name"],
        "des":item["description"]
      });
     this.native.navigateForward(['/feedinfo'],"");
    }
  }
  initData(events:any,isLoading:boolean=true){
    this.isLoading =true;
    this.myFeedSource = "";
    this.httpService.ajaxGet(ApiUrl.listPage+"?pageNum="+this.pageNum+"&pageSize="+this.pageSize,isLoading).then((result)=>{
      if(events!=""){
        events.target.complete();
      }
      if(result["code"] === 200){
        this.isLoading =false;
         this.totalNum = result["data"]["total"];
         this.feedList = result["data"]["result"] || [];
         this.infiniteScroll.disabled =false;
      }
    }).catch((err)=>{
      this.isLoading =false;
      this.infiniteScroll.disabled =false;
      if(events!=""){
        events.target.complete();
      }

    });
  }

  doRefresh(event:any){
      this.pageNum = 1;
      this.initData(event,false);
  }

  handleStatus(item:any){
     let nodeId = item["nodeId"];
     let feedUrl = item["url"];
     console.log("feedUrl"+JSON.stringify(feedUrl.split("/")));
     let channelId = feedUrl.split("/")[4];
     console.log("nodeId"+nodeId);
     console.log("channelId"+channelId);
     let channel:any = _.find(this.channelList,(item:any)=>{
        return (item["nodeId"]==nodeId&&item["id"]==channelId)
     });
    if(!channel.isSubscribed){
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
