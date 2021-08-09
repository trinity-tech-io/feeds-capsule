import { Injectable } from '@angular/core';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { IPFSService } from 'src/app/services/ipfs.service';
import { NFTContractParsarService } from 'src/app/services/nftcontract_parsar.service';
import { NFTContractStickerService } from 'src/app/services/nftcontract_sticker.service';
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';


@Injectable()
export class GlobalService {
  constructor(
    private splashScreen: SplashScreen,
    private ipfsService: IPFSService,
    private nftContractParsarService: NFTContractParsarService,
    private nftContractStickerService: NFTContractStickerService,
    private nftPersistenceHelper: NFTPersistenceHelper,
    private dataHelper: DataHelper,
    private nftContractControllerService: NFTContractControllerService,
    private walletConnectControllerService: WalletConnectControllerService
  ) {
  }

  async changeNet(net: string) {
    if (net == 'MainNet') {
      this.ipfsService.setTESTMode(false);
      this.nftContractParsarService.setTestMode(false);
      this.nftContractStickerService.setTestMode(false);
      this.nftPersistenceHelper.setDevelopMode(false);
      this.walletConnectControllerService.setTestMode(false);
      console.log('Change to mainnet');
    } else {
      this.ipfsService.setTESTMode(true);
      this.nftContractParsarService.setTestMode(true);
      this.nftContractStickerService.setTestMode(true);
      this.nftPersistenceHelper.setDevelopMode(true);
      this.walletConnectControllerService.setTestMode(true);
      console.log('Change to testnet');
    }

    this.walletConnectControllerService.destroyWalletConnect();
    await this.walletConnectControllerService.initWalletConnectProvider();
    this.nftContractControllerService.init();
  }

  restartApp() {
    this.splashScreen.show();
    window.location.href = "/";
  }
}
