import { Component, OnInit, NgZone } from '@angular/core';
import { Events, Platform } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { CarrierService } from 'src/app/services/CarrierService';
import { FeedService } from 'src/app/services/FeedService';

// enum ConnState {
//     connected = 1,
//     disconnected = 0
// };

// class Friend {
//     constructor(
//         public userId: string,
//         public name: string,
//         public status: ConnState) {}
// }

@Component({
    selector: 'page-servers',
    templateUrl: './servers.html',
    styleUrls: ['./servers.scss'],
})

export class ServersPage implements OnInit {
    // private status = ConnState.connected;
    private status = "disconnect";

    // fakeServers:FeedService.Friend[] = [
    //     new Friend('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', '',   ConnState.connected),
    //     new Friend('3x4xVSJmtvty1tM8vzcz2pzW2WG7TmNavbnz9ka1EtZy', 'Tom', ConnState.disconnected)
    // ]

    serverList:any;

    constructor(
        private event: Events,
        private platform: Platform,
        private zone: NgZone,
        private native: NativeService,
        private feedService: FeedService,
        private carrierService: CarrierService) {
            // if (this.platform.is("desktop")) {
            //     this.serverList = feedService.getServerList();
            // }
    }

    ngOnInit() {
        this.serverList = this.feedService.getServerList();
        this.status = this.feedService.getConnectionStatus();

        this.event.subscribe('feeds:updateServerList', serverList => {
            this.zone.run(() => {
                this.serverList = serverList;
            });
        });

        this.event.subscribe('feeds:connectionChanged', connectionStatus => {
            this.zone.run(() => {
                this.status = connectionStatus;
            });
        });
    }

    checkConnectionStatus(state){
        // if(state == ConnState.disconnected){
        //     this.status = "disconnect";
        // }else{
        //     this.status = "";
        // }
    }

    ngOnDestroy() {
    }

    ionViewDidEnter() {
        // this.serverList= [];
        // if (this.platform.is("desktop")) { //for test
        //     for (let i = 0; i < this.fakeServers.length; i++) {
        //         this.serverList.push(this.fakeServers[i]);
        //     }
        //     return;
        // }

        // this.carrierService.getFriends((data) => {
        //     let servers = data.friends;
        //     if (typeof servers == "string") {
        //         servers = JSON.parse(servers);
        //     }

        //     for (var id in servers) {
        //         let friend = new Friend(
        //             servers[id].userInfo.userId,
        //             servers[id].userInfo.name,
        //             servers[id].status
        //         );
        //         this.serverList.push(friend);
        //     }
        // },
        // null);
    }

    navToServerInfo() {
        this.native.go('/menu/servers/server-info');
    }

    // isFriendConnected(friend) {
    //     this.serverList = this.feedService.getServerList();
    // }
}
