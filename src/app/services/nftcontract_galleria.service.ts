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
  private checkCreatePanelInterval: NodeJS.Timer;
  private checkRemovePanelInterval:  NodeJS.Timer;
  private checkCreatePanelNum: number = 0;
  private checkRemovePanelNum: number = 0;
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

  async createPanel(
    tokenId: string,
    showAmount: string,
    didUriCreator: string
    ): Promise<any> {
    return new Promise(async (resolve, reject) => {
        try {
        Logger.log(TAG, 'createPanel params ', tokenId, showAmount,didUriCreator);
        const createPaneldata = this.galleriaContract.methods
          .createPanel(tokenId,showAmount,didUriCreator)
          .encodeABI();

        let transactionParams = await this.createTxParams(createPaneldata,"100000000000000000");

          Logger.log(TAG,
            'Calling smart contract through wallet connect',
            createPaneldata,
            transactionParams,
          );

          this.galleriaContract.methods
          .createPanel(tokenId,showAmount,didUriCreator)
          .send(transactionParams)
          .on('transactionHash', hash => {
            Logger.log(TAG, 'createPanel process, transactionHash is', hash);
          })
          .on('receipt', receipt => {
            Logger.log(TAG, 'createPanel process, receipt is', receipt);
          })
          .on('confirmation', (confirmationNumber, receipt) => {
            Logger.log(TAG,
              'createPanel process, confirmation is',
              confirmationNumber,
              receipt,
            );
          })
          .on('error', (error, receipt) => {
            Logger.error(TAG, 'createPanel process, error is', error, receipt);
          });

          this.checkCreatePanelState(tokenId, info => {
            Logger.log(TAG, 'createPanel success, token info is', info);
            resolve(info);
          });

        }catch(error){
          Logger.error(TAG, 'createPanel error', error);
          reject(error);
        }
      });

  }

  cancelCreatePanelProcess() {
    if (!this.checkCreatePanelInterval) return;
    clearInterval(this.checkCreatePanelInterval);
  }

  cancelRemovePanelProcess() {
    if (!this.checkRemovePanelInterval) return;
    clearInterval(this.checkRemovePanelInterval);
  }

  checkCreatePanelState(tokenId:string, callback: (tokenInfo: any) => void) {
    try{
      this.checkCreatePanelNum = 0;
      let owerAddress: string = this.walletConnectControllerService.getAccountAddress();
      this.checkCreatePanelInterval = setInterval(async () => {
        if (!this.checkCreatePanelInterval) return;
        let info = await this.getUserActivePanelByToken(owerAddress,tokenId);
        if (info[1] === '1') {
          Logger.log(TAG, 'Check createPanel state finish', info);
          clearInterval(this.checkCreatePanelInterval);
          callback(info);
          this.checkCreatePanelInterval = null;
        }

        this.checkCreatePanelNum++;
        if (this.checkCreatePanelNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_MINT) {
          clearInterval(this.checkCreatePanelInterval);
          this.checkCreatePanelInterval = null;
          Logger.log(TAG, 'Exit check token state by self');
        }
      }, Config.CHECK_STATUS_INTERVAL_TIME);
    }catch(error){
      clearInterval(this.checkCreatePanelInterval);
      this.checkCreatePanelInterval = null;
      callback(null);
    }

  }

  async getUserActivePanelByToken(address:string,tokenId:string) {
      let userActivePane = await this.galleriaContract.methods.getUserActivePanelByToken(address,tokenId).call();
      return userActivePane;
  }


  async removePanel(
    panelId: string
    ): Promise<any> {
    return new Promise(async (resolve, reject) => {
        try {
        Logger.log(TAG, 'removePanel params ', panelId,typeof(panelId));
        const removePaneldata = this.galleriaContract.methods
          .removePanel(panelId)
          .encodeABI();

        let transactionParams = await this.createTxParams(removePaneldata,0);

          Logger.log(TAG,
            'Calling smart contract through wallet connect',
            removePaneldata,
            transactionParams,
          );

          this.galleriaContract.methods
          .removePanel(panelId)
          .send(transactionParams)
          .on('transactionHash', hash => {
            Logger.log(TAG, 'removePanel process, transactionHash is', hash);
          })
          .on('receipt', receipt => {
            Logger.log(TAG, 'removePanel process, receipt is', receipt);
          })
          .on('confirmation', (confirmationNumber, receipt) => {
            Logger.log(TAG,
              'removePanel process, confirmation is',
              confirmationNumber,
              receipt,
            );
          })
          .on('error', (error, receipt) => {
            Logger.error(TAG, 'removePanel process, error is', error, receipt);
            // this.checkRemovePanelInterval = null;
            // clearInterval(this.checkRemovePanelInterval);
            reject(error);
          });

          this.checkRemovePanelState(panelId, info => {
            Logger.log(TAG, 'removePanel success, token info is', info);
            resolve(info);
          });

        }catch(error){
          Logger.error(TAG, 'createPanel error', error);
          reject(error);
        }
      });

  }

  checkRemovePanelState(panelId: string, callback: (tokenInfo: any) => void) {
    this.checkRemovePanelNum = 0;
    this.checkRemovePanelInterval = setInterval(async () => {
      if (!this.checkRemovePanelInterval){
        // Logger.log(TAG, 'Check removePanel state finish', "test");
        // clearInterval(this.checkRemovePanelInterval);
        // callback(null);
        return;
      }
      let info = await this.getPanelById(panelId);
      if (info[1] === '2') {
        Logger.log(TAG, 'Check removePanel state finish', info);
        clearInterval(this.checkRemovePanelInterval);
        callback(info);
        this.checkRemovePanelInterval = null;
      }

      this.checkRemovePanelNum++;
      if (this.checkRemovePanelNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_MINT) {
        clearInterval(this.checkRemovePanelInterval);
        this.checkRemovePanelInterval = null;
        callback(null);
        Logger.log(TAG, 'Exit check token state by self');
      }
    }, Config.CHECK_STATUS_INTERVAL_TIME);
  }

  async getPanelById(panelId :string){
     let paneInfo = await this.galleriaContract.methods.getPanelById(panelId).call();
     return paneInfo;
  }

  createTxParams(data:any, price:any): Promise<TXData> {
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

 async getActivePanelCount() {
    let activePanelCount = await this.galleriaContract.methods.getActivePanelCount().call();
    activePanelCount = parseInt(activePanelCount);
    return activePanelCount;
  }

 async getActivePanelByIndex(activePanelByIndex:number) {
  let activePanelItem = await this.galleriaContract.methods.getActivePanelByIndex(activePanelByIndex).call();
  return activePanelItem;
 }
}
