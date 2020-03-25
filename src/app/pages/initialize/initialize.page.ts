import { Component, OnInit, NgZone } from '@angular/core';
import { Events } from '@ionic/angular';
import { NativeService } from '../../services/NativeService';
import { CarrierService } from '../../services/CarrierService';
import { StorageService } from '../../services/StorageService';
import { PopupProvider } from '../../services/popup';

declare let appManager: AppManagerPlugin.AppManager;

@Component({
    selector: 'app-initialize',
    templateUrl: './initialize.page.html',
    styleUrls: ['./initialize.page.scss'],
})

export class InitializePage implements OnInit {
    constructor(
            private native: NativeService,
            private events: Events,
            private zone: NgZone,
            private store:StorageService,
            private carrierService: CarrierService,
            private popup: PopupProvider
            ) {
    }
    
    inittest(){         //for test
        this.native.showLoading("Connecting to carrier").then(() => {
            this.initializeApp();
        });
    }

    ngOnInit() {
        // this.native.showLoading("Connecting to carrier").then(() => {
        //     this.initializeApp();
        // });
    }

    ionViewDidEnter() {
        appManager.setVisible("show", ()=>{}, (err)=>{});
    }

    initializeApp() {
        this.carrierService.init();

        if (this.carrierService.isReady()) {
            this.native.hideLoading();
            this.native.setRootRouter("/favorite");
            return;
        }

        this.events.subscribe('carrier:ready', () => {
            this.zone.run(() => {
                this.native.hideLoading();
                this.native.setRootRouter("/favorite");
            });
        });
    }

    testset(){
        let str = '{"jsonrpc":"2.0","error":{"code":-32602,"message":"Operation Not Authorized"},"id":"11"}';

        console.log(str.indexOf("error") != -1 );  // true

    }

    testget(){
        // this.popup.ionicAlert("title","sbtitle","okok");
        this.popup.ionicConfirm("title","msg","okok","ccc").then((data) => {
            if (data) {
                alert("cccccccccc");

            }else{
                alert("dddd");
            }
        });
        // this.popup.ionicPrompt("title","msg","opt","okok","ccc");
    }

    testclean(){
        this.store.remove("serversMap");
        this.store.remove("favoriteFeedsMap");
        this.store.remove("allFeedsMap");
        this.store.remove("eventsMap");
        this.store.remove("myFeedsMap");
        this.store.remove("myEventMap");
    }

    destroy(){
        this.carrierService.destroyCarrier();
    }
}
