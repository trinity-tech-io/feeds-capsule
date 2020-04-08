// import { Injectable } from '@angular/core';
// import { Events } from '@ionic/angular';
// import { CarrierService } from 'src/app/services/CarrierService';
// import { JsonRPCService } from 'src/app/services/JsonRPCService';


// @Injectable()
// export class TransportService {
//     private autoId: number;
//     constructor(
//         private carrierService: CarrierService,
//         private events: Events,
//         private jsonRPC: JsonRPCService) {
//         this.autoId = 0;
//         this.events.subscribe('carrier:friendMessage', event => {
//             // this.handleResult(event.from, event.message);
            
//             this.events.publish('transport:receiveMessage',event);
//           });
//     }

//     transportMsg(nodeId: string, message: string, success: any, error: any){
        
//         this.carrierService.sendMessage(
//             nodeId,
//             message,
//             success,
//             error
//         )
//     }

//     transport(nodeId: string, method: string, param: any, success: any, error: any){
//         let message = this.jsonRPC.request(method, param,this.autoId++)
//         this.carrierService.sendMessage(
//             nodeId,
//             message,
//             success,
//             error
//         )
//     }
// }
