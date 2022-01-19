import { Injectable } from '@angular/core';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { IPFSService } from 'src/app/services/ipfs.service';
import { NFTContractParsarService } from 'src/app/services/nftcontract_parsar.service';
import { NFTContractStickerService } from 'src/app/services/nftcontract_sticker.service';
import { NFTContractDiamondService } from 'src/app/services/nftcontract_diamond.service';
import { NFTContractGalleriaService } from 'src/app/services/nftcontract_galleria.service';
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import { Logger } from './logger';
import { Config } from './config';
import { ApiUrl } from './ApiUrl';
import { PasarAssistService } from 'src/app/services/pasar_assist.service';
import { DataHelper } from './DataHelper';

const TAG: string = 'GlobalService';
@Injectable()
export class GlobalService {
  constructor(
    private splashScreen: SplashScreen,
    private ipfsService: IPFSService,
    private nftContractParsarService: NFTContractParsarService,
    private nftContractStickerService: NFTContractStickerService,
    private nftContractGalleriaService: NFTContractGalleriaService,
    private nftContractDiamondService: NFTContractDiamondService,
    private nftPersistenceHelper: NFTPersistenceHelper,
    private nftContractControllerService: NFTContractControllerService,
    private walletConnectControllerService: WalletConnectControllerService,
    private pasarAssistService: PasarAssistService,
    private dataHelper: DataHelper
  ) {
  }

  async changeNet(net: string) {
    if (net == 'MainNet') {
      this.ipfsService.setTESTMode(false);
      this.nftContractParsarService.setTestMode(false);
      this.nftContractGalleriaService.setTestMode(false);
      this.nftContractDiamondService.setTestMode(false);
      this.nftContractStickerService.setTestMode(false);
      this.nftContractDiamondService.setTestMode(false);
      this.nftPersistenceHelper.setDevelopMode(false);
      this.walletConnectControllerService.setTestMode(false);
      Logger.log(TAG, 'Change to mainnet');
    } else {
      this.ipfsService.setTESTMode(true);
      this.nftContractParsarService.setTestMode(true);
      this.nftContractGalleriaService.setTestMode(true);
      this.nftContractDiamondService.setTestMode(true);
      this.nftContractStickerService.setTestMode(true);
      this.nftContractDiamondService.setTestMode(true);
      this.nftPersistenceHelper.setDevelopMode(true);
      this.walletConnectControllerService.setTestMode(true);
      Logger.log(TAG, 'Change to testnet');
    }

    this.walletConnectControllerService.setBridge(Config.BRIDGE);
    await this.walletConnectControllerService.destroyWalletConnect();
    // await this.walletConnectControllerService.initWalletConnectProvider();
    this.nftContractControllerService.init();
  }

  restartApp() {
    this.dataHelper.setPublishedActivePanelList([]);
    this.splashScreen.show();
    window.location.href = "/";
  }

  refreshBaseNFTIPSFUrl() {
    this.ipfsService.setBaseNFTIPFSUrl(ApiUrl.IPFS_SERVER);
  }

  refreshBaseAssistUrl() {
   this.pasarAssistService.setBaseAssistUrl(ApiUrl.ASSIST_SERVER);
  }
}
