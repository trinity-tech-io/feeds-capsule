import { Injectable } from '@angular/core';
import { Events } from '@ionic/angular';
import { CarrierService } from 'src/app/services/CarrierService';
import { FeedService } from 'src/app/services/FeedService'
let eventBus = null;

@Injectable()
export class TransportService {
    private signInServerList = [];
    constructor(
        private carrierService: CarrierService,
        private events: Events) {
        eventBus = events;

        this.events.subscribe('feeds:signInServerListChanged', list => {
           this.signInServerList = list;         
        });
        
        this.events.subscribe('carrier:friendMessage', event => {
            if (this.check(event.from))
                eventBus.publish('transport:receiveMessage',event);
            else 
                eventBus.publish('transport:receiveJWTMessage',event);
        });

        this.events.subscribe('carrier:friendBinaryMessage', event => {
            eventBus.publish('transport:receiveMessage',event);
        });
    }

    check(nodeId: string){
        return this.signInServerList.indexOf(nodeId) != -1
    }

    sendStrMessage(nodeId: string, msg: string , onSuccess:()=>void, onError?:(err: string)=>void){
        this.carrierService.sendMessage(
            nodeId,
            msg,
            onSuccess,
            onError
        )
    }

    sendArrayMessage(nodeId: string, msg: any , onSuccess:()=>void, onError?:(err: string)=>void){
        this.carrierService.sendBinaryMessage(
            nodeId,
            msg,
            onSuccess,
            onError
        )
    }
}
