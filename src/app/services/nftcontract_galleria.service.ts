import { Injectable } from '@angular/core';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import Web3 from 'web3';
import { Config } from './config';
import { Logger } from './logger';

const TAG: string = 'NFTGalleriaService';
const SUCCESS = 'success';
const FAIL = '';
const EstimateGasError = 'EstimateGasError';

type TXData = {
  from: string;
  gasPrice: string;
  gas: number;
  value: any;
}
@Injectable()
export class NFTContractGalleriaService {
  private galleriaAbi = require('../../assets/contracts/galleriaABI.json');
  private galleriaAddr: string = Config.GallERIA_ADDRESS;
  private galleriaContract: any;
  private web3: Web3;
  private checkSellerOrderStateInterval: NodeJS.Timer;
  private checkPriceInterval: NodeJS.Timer;
  private checkBuyerOrderStateInterval: NodeJS.Timer;
  private checkOrderStateInterval: NodeJS.Timer;

  private checkSellOrderNum: number = 0;
  private checkPriceNum: number = 0;
  private checkBuyOrderStateNum: number = 0;
  private checkOrderStateNum: number = 0;

  constructor(
    private walletConnectControllerService: WalletConnectControllerService,
  ) {
    this.init();
  }

  init() {
    this.web3 = this.walletConnectControllerService.getWeb3();
    if (!this.web3) return;
    this.galleriaContract = new this.web3.eth.Contract(
      this.galleriaAbi,
      this.galleriaAddr,
    );
  }

  setTestMode(testMode: boolean) {
    if (testMode) {
      this.galleriaAddr = Config.GallERIA_TEST_ADDRESS;
      return;
    }

    this.galleriaAddr = Config.GallERIA_ADDRESS;
  }

  getGalleria() {
    return this;
  }

  getGalleriaAddress() {
    return this.galleriaAddr;
  }



  createTxParams(data, price): Promise<TXData> {
    return new Promise(async (resolve, reject) => {
      try {
        let accountAddress = this.walletConnectControllerService.getAccountAddress();
        let txGas = 0;

        const txData = {
          from: this.walletConnectControllerService.getAccountAddress(),
          to: this.galleriaAddr,
          value: price,
          data: data,
        };
        Logger.log(TAG, 'Create Tx , Params ', txData);

        await this.web3.eth.estimateGas(txData, (error, gas) => {
          txGas = gas;
          Logger.log(TAG, 'EstimateGas finish ,gas is', txGas, ', error is', error);
        });

        if (!txGas || txGas == 0) {
          Logger.error(TAG, EstimateGasError);
          reject(EstimateGasError);
          return;
        }
        Logger.log(TAG, 'Finnal gas is', txGas);
        let gasPrice = await this.web3.eth.getGasPrice();

        let txResult: TXData = {
          from: accountAddress,
          // to: stickerAddr,
          gasPrice: gasPrice,
          gas: Math.round(txGas * 3),
          value: price,
        };
        resolve(txResult);

      } catch (error) {
        Logger.error(TAG, 'EstimateGas error', error);
        reject(EstimateGasError);
      }
    });
  }
}
