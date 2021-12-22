import { Injectable } from '@angular/core';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import { NFTContractParsarService } from 'src/app/services/nftcontract_parsar.service';
import { NFTContractStickerService } from 'src/app/services/nftcontract_sticker.service';
import { NFTContractGalleriaService } from 'src/app/services/nftcontract_galleria.service';
import { NFTContractDiamondService } from './nftcontract_diamond.service';
import { Events } from 'src/app/services/events.service';
import { UtilService } from './utilService';

@Injectable()
export class NFTContractControllerService {
  constructor(
    private event: Events,
    private walletConnectControllerService: WalletConnectControllerService,
    private nftContractParsarService: NFTContractParsarService,
    private nftContractStickerService: NFTContractStickerService,
    private nftContractGalleriaService: NFTContractGalleriaService,
    private nftContractDiamondService: NFTContractDiamondService
  ) {
    this.init();
    this.initSubscribeEvent();
  }

  init() {
    this.nftContractStickerService.init();
    this.nftContractParsarService.init();
    this.nftContractDiamondService.init();
    this.nftContractGalleriaService.init();
    this.nftContractDiamondService.init();
  }

  initSubscribeEvent() {
    this.event.subscribe(FeedsEvent.PublishType.walletConnected, () => {
      this.init();
    });
    this.event.subscribe(FeedsEvent.PublishType.walletDisconnected, () => {
      this.init();
    });

    this.event.subscribe(FeedsEvent.PublishType.walletAccountChanged, () => {
      this.init();
    });
  }

  getSticker(): NFTContractStickerService {
    return this.nftContractStickerService.getSticker();
  }

  getPasar(): NFTContractParsarService {
    return this.nftContractParsarService.getPasar();
  }

  getGalleria(): NFTContractGalleriaService {
    return this.nftContractGalleriaService.getGalleria();
  }

  getDiamond(): NFTContractDiamondService {
    return this.nftContractDiamondService.getDiamond();
  }

  getAccountAddress() {
    return this.walletConnectControllerService.getAccountAddress();
  }

  transFromWei(price: string) {
    let eth = this.walletConnectControllerService
      .getWeb3()
      .utils.fromWei(price, 'ether');
    return eth;
  }

  transToWei(price: string) {
    let wei = this.walletConnectControllerService
      .getWeb3()
      .utils.toWei(price, 'ether');
    return wei;
  }

  isTokenId(tokenId: string) {
    let isHex = this.walletConnectControllerService
      .getWeb3().utils.isHexStrict(tokenId);
    if (isHex) {
      if (tokenId.length === 66) {
        return tokenId;
      }
    }

    try {
      let hexString = "0x" + UtilService.dec2hex(tokenId);
      let isHex = this.walletConnectControllerService
        .getWeb3().utils.isHexStrict(hexString);
      if (isHex) {
        if (hexString.length === 66) {
          return hexString;
        } else {
          return "";
        }
      } else {
        return "";
      }
    } catch (error) {
      return "";
    }
  }

  isAddress(address: string) {
    return this.walletConnectControllerService
      .getWeb3()
      .utils.isAddress(address);
  }
}
