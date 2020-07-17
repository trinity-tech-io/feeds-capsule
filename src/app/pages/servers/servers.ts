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
    private myFeedSource = null;
    private serverList:any;
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
        // titleBarManager.setTitle("Feed source");
        // this.native.setTitleBarBackKeyShown(true);

        this.serverList = this.feedService.getServerList();

        let bindingServer = this.feedService.getBindingServer();
        // let = bindingServer {"name":"No name provided","owner":"WangRan","introduction":"No intro provided","did":"did:elastos:iaD4tCkC5X3Jix34fsToEk1xqRWmy1y5Yv","carrierAddress":"dawpLfp7iKrzpKoTdFXeCrQ8omK7njNDK3zy3xx1TP11AgADgfeC","nodeId":"HeRcumsP5Cnp1nCgxjqR7TEMhDdNQbnwc5X2Db5nSTHM","feedsUrl":"feeds://did:elastos:iaD4tCkC5X3Jix34fsToEk1xqRWmy1y5Yv"}
        if (bindingServer != null && bindingServer != undefined)
            this.myFeedSource = bindingServer;

        this.serversStatus = this.feedService.getServersStatus();

        this.serverStatisticsMap = this.feedService.getServerStatisticsMap();
        
        for (let index = 0; index < this.serverList.length; index++) {
            // const element = ;
            this.feedService.getStatistics(this.serverList[index].userId);
        }

        // this.connectStatus = this.feedService.getConnectionStatus();

        this.events.subscribe('feeds:updateServerList', serverList => {
            this.zone.run(() => {
                this.serverList = serverList;
            });
        });

        // this.events.subscribe('feeds:connectionChanged', connectionStatus => {
        //     this.zone.run(() => {
        //         this.connectStatus = connectionStatus;
        //     });
        // });

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



    ngOnDestroy() {
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
        titleBarManager.setTitle(this.translate.instant('ServersPage.feedSources'));
      }

    navToServerInfo(nodeId: string, isOwner: boolean) {
        // this.native.go(['/menu/servers/server-info',userId]);
        this.router.navigate(['/menu/servers/server-info', "", nodeId, isOwner]);
    }

    signin(nodeId: string){
        this.feedService.signinChallengeRequest(nodeId,true);
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
        this.router.navigate(['/bindservice/scanqrcode']);
    }

    exploreFeedSource(){
        this.navCtrl.navigateForward(['/menu/servers/add-server']);
    }

}
