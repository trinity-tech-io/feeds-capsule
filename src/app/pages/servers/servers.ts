import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events, Platform } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';
import { Router } from '@angular/router';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from "@ngx-translate/core";
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
    selector: 'page-servers',
    templateUrl: './servers.html',
    styleUrls: ['./servers.scss'],
})

export class ServersPage implements OnInit {
    private connectionStatus = 1;
    private myFeedSource = null;
    private serverList:any = [];
    private serversStatus: any;
    private serverStatisticsMap: any;

    constructor(
        private navCtrl: NavController,
        private events: Events,
        private platform: Platform,
        private zone: NgZone,
        private native: NativeService,
        private feedService: FeedService,
        private router: Router,
        public theme:ThemeService,
        private translate:TranslateService ) {
    }

    ngOnInit() {
    }

    addSubscribe(){
        this.events.subscribe('feeds:connectionChanged',(status)=>{
            this.zone.run(() => {
                this.connectionStatus = status;
            });
        });

        this.events.subscribe('feeds:serverConnectionChanged', serversStatus => {
            this.zone.run(() => {
                this.serversStatus = serversStatus;
            });
        });

        this.events.subscribe('feeds:serverStatisticsChanged', serverStatisticsMap =>{
            this.zone.run(() => {
                this.serverStatisticsMap = serverStatisticsMap;
            });
        });

        this.events.subscribe('feeds:login_finish',(nodeId)=>{
            this.zone.run(() => {
                this.checkSignIn(nodeId);
            });
        });


        this.events.subscribe('feeds:bindServerFinish',()=>{
            this.zone.run(() => {
                let bindingServer = this.feedService.getBindingServer();

                if (bindingServer != null && bindingServer != undefined)
                    this.myFeedSource = bindingServer;
        
                this.serversStatus = this.feedService.getServersStatus();
        
                this.serverStatisticsMap = this.feedService.getServerStatisticsMap();
            });
        });
    }

    removeSubscribe(){
        this.events.unsubscribe("feeds:connectionChanged");
        this.events.unsubscribe("feeds:serverConnectionChanged");
        this.events.unsubscribe("feeds:serverStatisticsChanged");
        this.events.unsubscribe("feeds:login_finish");
        this.events.unsubscribe("feeds:bindServerFinish");
    }

    initData(){
        this.serverList = this.feedService.getServerList();
        let bindingServer = this.feedService.getBindingServer();
        if (bindingServer != null && bindingServer != undefined){
            this.myFeedSource = this.feedService.getServerbyNodeId(bindingServer.nodeId);
        }else{
            this.myFeedSource = null;
        }
        this.serversStatus = this.feedService.getServersStatus();
        this.serverStatisticsMap = this.feedService.getServerStatisticsMap();
        for (let index = 0; index < this.serverList.length; index++) {
            if (this.serverList[index] != undefined)
                this.feedService.getStatistics(this.serverList[index].nodeId);
        }
    }

    ngOnDestroy() {
    }

    ionViewWillEnter(){
        this.connectionStatus = this.feedService.getConnectionStatus();
        this.initData();
        this.events.subscribe("feeds:updateTitle",()=>{
          this.initTitle();
        });
        this.addSubscribe();
      }

      ionViewDidEnter() {
        this.initTitle();
        this.native.setTitleBarBackKeyShown(true);
      }
    
      ionViewWillLeave(){
        this.removeSubscribe();
        this.events.unsubscribe("feeds:updateTitle");
      }
    
    
      initTitle(){
        titleBarManager.setTitle(this.translate.instant('ServersPage.feedSources'));
      }

    navToServerInfo(nodeId: string, isOwner: boolean) {
        this.native.navigateForward(['/menu/servers/server-info',nodeId, isOwner],"");
    }

    checkSignIn(nodeId: string):boolean{
        return this.feedService.checkSignInServerStatus(nodeId);
    }

    checkConnectClient(nodeId: string){
        if (this.serverStatisticsMap == null ||
            this.serverStatisticsMap == undefined ||
            this.serverStatisticsMap[nodeId] == undefined)
            return 0;
        
        return this.serverStatisticsMap[nodeId].connecting_clients;
    }

    checkServerStatus(nodeId: string){
        return this.feedService.getServerStatusFromId(nodeId);
    }

    bindFeedSource(){
        if(this.feedService.getConnectionStatus() != 0){
            this.native.toastWarn(this.translate.instant('common.connectionError'));
            return;
        }
      
        this.native.navigateForward(['/bindservice/scanqrcode'],"");
    }

    exploreFeedSource(){
        if(this.feedService.getConnectionStatus() != 0){
            this.native.toastWarn(this.translate.instant('common.connectionError'));
            return;
        }
        
        this.native.navigateForward(['/menu/servers/add-server'],"");
    }

}
