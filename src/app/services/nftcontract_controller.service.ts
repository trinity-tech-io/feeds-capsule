import { Injectable } from '@angular/core';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import { NFTContractParsarService } from 'src/app/services/nftcontract_parsar.service';
import { NFTContractStickerService } from 'src/app/services/nftcontract_sticker.service';
import { Events } from 'src/app/services/events.service';

import Web3 from 'web3';

@Injectable()
export class NFTContractControllerService {
    constructor(
      private event: Events,
      private walletConnectControllerService: WalletConnectControllerService,
      private nftContractParsarService: NFTContractParsarService,
      private nftContractStickerService: NFTContractStickerService) {
      this.init();
      this.initSubscribeEvent();
    }

    init(){
      this.nftContractStickerService.init();
      this.nftContractParsarService.init();
    }

    initSubscribeEvent(){
      this.event.subscribe(FeedsEvent.PublishType.walletConnected,()=>{
        this.init();
      });
      this.event.subscribe(FeedsEvent.PublishType.walletDisconnected,()=>{
        this.init();
      });
    }

    getSticker(){
      return this.nftContractStickerService.getSticker();
    }

    getPasar(){
      return this.nftContractParsarService.getPasarContract();
    }
}
