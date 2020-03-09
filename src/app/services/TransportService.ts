import { Injectable } from '@angular/core';
import { CarrierService } from 'src/app/services/CarrierService';

@Injectable()
export class TransportService {
    constructor(private carrierService: CarrierService) {
    }

    transportMsg(nodeId: string, message: string, success: any, error: any){
        this.carrierService.sendMessage(
            nodeId,
            message,
            success,
            error
        )
    }
}
