import { Component, OnInit, NgZone } from '@angular/core';
import { Events, Platform } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { CarrierService } from 'src/app/services/CarrierService';

enum ConnState {
    disconnected = 0,
    connected = 1
};

class Friend {
    constructor(
        public userid: string,
        public name: string,
        public state: ConnState) {}
}

@Component({
    selector: 'page-servers',
    templateUrl: './servers.html',
    styleUrls: ['./servers.scss'],
})

export class ServersPage implements OnInit {
    private state = ConnState.disconnected;

    fakeServers = [
        new Friend('J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo', '',   ConnState.connected),
        new Friend('3x4xVSJmtvty1tM8vzcz2pzW2WG7TmNavbnz9ka1EtZy', 'Tom', ConnState.disconnected)
    ]

    serverList = [];

    constructor(
        private event: Events,
        private platform: Platform,
        private zone: NgZone,
        private native: NativeService,
        private carrierService: CarrierService) {
    }

    ngOnInit() {
        this.event.subscribe('carrier:connectionChanged', msg => {
            this.zone.run(() => {
                this.state = msg.status;
            });
        });

        /*
        this.event.subscribe('carrier:friendConnection', msg => {
            const index = this.getFriendIndexById(msg.friendId);
            if (index !== -1) {
                this.zone.run(() => {
                    this.friendList[index].status = msg.status;
                });
            }
        });
        */

        this.event.subscribe('carrier:friendAdded', msg => {
            let server: any;
            if (this.platform.is("desktop")) {
                server = new Friend('100', 'New Contact', ConnState.disconnected);
            } else {
                server = new Friend(
                    msg.friendInfo.userInfo.userid,
                    msg.friendInfo.userInfo.name,
                    msg.friendInfo.status);
            }

            this.zone.run(() => {
                this.serverList.push(server);
            });
        });

        /*
        this.event.subscribe('carrier:friendRemoved', msg => {
            this.deleteFriend(msg.friendId);
        });
        */
    }

    ngOnDestroy() {
        // this.carrierService.destroyCarrier();
    }

    ionViewDidEnter() {
        this.serverList = [];

        if (this.platform.is("desktop")) { //for test
            for (var server in this.fakeServers) {
                this.serverList.push(server);
            }
            return;
        }

        this.carrierService.getFriends((data) => {
            let servers = data.friends;
            if (typeof servers == "string") {
                servers = JSON.parse(servers);
            }

            for (var id in servers) {
                let friend = new Friend(
                    servers[id].userInfo.userid,
                    servers[id].userInfo.name,
                    servers[id].state
                );

                this.serverList.push(friend);
            }
        },
        null);
    }

    navToServerInfo() {
        this.native.go('/menu/servers/server-info');
    }

    isFriendConnected(friend: Friend) {
        return friend.state == ConnState.connected;
    }
}
