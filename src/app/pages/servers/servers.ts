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
    private connectStatus = 1;
    serverList:any;

    constructor(
        private event: Events,
        private platform: Platform,
        private zone: NgZone,
        private native: NativeService,
        private feedService: FeedService,
        private router: Router) {
           
    }

    ngOnInit() {
        this.serverList = this.feedService.getServerList();
        this.connectStatus = this.feedService.getConnectionStatus();

        this.event.subscribe('feeds:updateServerList', serverList => {
            this.zone.run(() => {
                this.serverList = serverList;
            });
        });

        this.event.subscribe('feeds:connectionChanged', connectionStatus => {
            this.zone.run(() => {
                this.connectStatus = connectionStatus;
            });
        });

        this.event.subscribe('feeds:friendConnection',(list)=>{
            this.zone.run(() => {
                this.serverList = list;
            });
        })
    }



    ngOnDestroy() {
    }

    ionViewDidEnter() {
    }

    navToServerInfo(userId: string) {
        // this.native.go(['/menu/servers/server-info',userId]);
        this.router.navigate(['/menu/servers/server-info', userId]);
    }
}
