import { Component, OnInit, NgZone } from '@angular/core';
import { Events } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { HttpService } from 'src/app/services/HttpService';
import { ApiUrl } from 'src/app/services/ApiUrl';
import * as _ from 'lodash';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
@Component({
  selector: 'app-discoverfeeds',
  templateUrl: './discoverfeeds.page.html',
  styleUrls: ['./discoverfeeds.page.scss'],
})
export class DiscoverfeedsPage implements OnInit {
  public serverList = [];
  public feedList = [];
  public connectionStatus = 1;
  public pageNum:number = 6;
  public pageSize:number = 1;
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
    console.log("======="+JSON.stringify(this.serverList));
    this.initData();

    // this.httpService.ajaxGet(ApiUrl.listPage+"?pageNum="+this.pageNum+"&pageSize="+this.pageSize).then((result)=>{
    //   if(result["code"] === 200){
    //     this.feedList = result["data"]["result"] || [];
    //  }
    // });
  }

  ionViewDidEnter(){
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("DiscoverfeedsPage.title"));
  }

  clickItem(item:any){

  }

  initData(){
    this.httpService.ajaxGet(ApiUrl.listAll).then((result)=>{
      if(result["code"] === 200){
         this.feedList = result["data"] || [];
      }
    });
  }

  doRefresh(event:any){
    let sId =  setTimeout(() => {
      this.initData();
      event.target.complete();
      clearTimeout(sId);
    },200);
  }

  handleStatus(did:string){
   
    if(!_.find(this.serverList,{did:did})) {
        return "DiscoverfeedsPage.notadded"
    }
    return "DiscoverfeedsPage.added";
  }

}
