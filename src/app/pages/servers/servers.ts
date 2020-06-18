import { Component, OnInit, NgZone } from '@angular/core';
import { Events, Platform } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';
import { Router } from '@angular/router';

@Component({
    selector: 'page-servers',
    templateUrl: './servers.html',
    styleUrls: ['./servers.scss'],
})

export class ServersPage implements OnInit {
    // private connectStatus = 1;
    private serverList:any;
    private serversStatus: any;
    private serverStatisticsMap: any;

    constructor(
        private events: Events,
        private platform: Platform,
        private zone: NgZone,
        private native: NativeService,
        private feedService: FeedService,
        private router: Router) {
           
    }

    ngOnInit() {
        this.serverList = this.feedService.getServerList();

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
    }



    ngOnDestroy() {
    }

    ionViewDidEnter() {
    }

    navToServerInfo(did: string) {
        // this.native.go(['/menu/servers/server-info',userId]);
        this.router.navigate(['/menu/servers/server-info', did]);
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
            console.log("checkConnectClient = 0");
            return 0;
        
        return this.serverStatisticsMap[nodeId].connecting_clients;
    }
}
