import { Injectable } from '@angular/core';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import Web3 from 'web3';
import { Config } from './config';
import { Logger } from './logger';

const TAG: string = "NFTStickerService";
const EstimateGasError = 'EstimateGasError';
type TXData = {
  from: string;
  gasPrice: string;
  gas: number;
  value: any;
}
@Injectable()
export class NFTContractStickerService {
  private stickerAddress: string = Config.STICKER_ADDRESS;
  private stickerAbi = require('../../assets/contracts/stickerABI.json');
  private web3: Web3;
  private stickerContract: any;
  private checkTokenInterval: NodeJS.Timer;
  private checkApprovedInterval: NodeJS.Timer;

  private checkTokenNum: number = 0;
  private checkApprovedNum: number = 0;
  constructor(
    private walletConnectControllerService: WalletConnectControllerService,
  ) {
    this.init();
  }

  init() {
    this.web3 = this.walletConnectControllerService.getWeb3();
    if (!this.web3) return;
    this.stickerContract = new this.web3.eth.Contract(
      this.stickerAbi,
      this.stickerAddress,
    );
  }

  setTestMode(testMode: boolean) {
    if (testMode) {
      this.stickerAddress = Config.STICKER_TEST_ADDRESS;
      return;
    }
    this.stickerAddress = Config.STICKER_ADDRESS;
  }

  getSticker() {
    return this;
  }

  getStickerAddress() {
    return this.stickerAddress;
  }

  setApprovalForAll(
    accountAddress: string,
    contractAddress: string,
    approved: boolean,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let isApproved = await this.isApprovedForAll(
          accountAddress,
          contractAddress,
        );
        Logger.log(TAG, 'Contract isApproved?', isApproved);
        if (isApproved) {
          resolve(isApproved);
          return;
        }

        const data = this.stickerContract.methods
          .setApprovalForAll(contractAddress, approved)
          .encodeABI();
        let transactionParams = await this.createTxParams(data);
        Logger.log(TAG,
          'Calling setApprovalForAll smart contract through wallet connect',
          data,
          transactionParams,
        );
        this.stickerContract.methods
          .setApprovalForAll(contractAddress, approved)
          .send(transactionParams)
          .on('transactionHash', hash => {
            Logger.log(TAG, 'transactionHash', hash);
            resolve(hash);
          })
          .on('receipt', receipt => {
            Logger.log(TAG, 'receipt', receipt);
            resolve(receipt);
          })
          .on('confirmation', (confirmationNumber, receipt) => {
            Logger.log(TAG, 'confirmation', confirmationNumber, receipt);
            resolve(receipt);
          })
          .on('error', (error, receipt) => {
            Logger.error(TAG, 'Mint error,', error, receipt);
            reject(receipt);
          });

        this.checkApprovedState(accountAddress, contractAddress, isApproved => {
          Logger.log(TAG, 'Set approval success', isApproved);
          resolve(isApproved);
        });
      } catch (error) {
        Logger.error(TAG, 'Set approval error', error);
        reject(error);
      }
    });
  }

  async tokenInfo(tokenId) {
    if (!this.stickerContract) return [];
    return await this.stickerContract.methods.tokenInfo(tokenId).call();
  }

  async mint(
    tokenId: string,
    supply: string,
    uri: string,
    royalty: string,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        Logger.log(TAG, 'Mint params ', tokenId, supply, uri, royalty);
        const mintdata = this.stickerContract.methods
          .mint(tokenId, supply, uri, royalty)
          .encodeABI();
        let transactionParams = await this.createTxParams(mintdata);

        Logger.log(TAG,
          'Calling smart contract through wallet connect',
          mintdata,
          transactionParams,
        );
        this.stickerContract.methods
          .mint(tokenId, supply, uri, royalty)
          .send(transactionParams)
          .on('transactionHash', hash => {
            Logger.log(TAG, 'Mint process, transactionHash is', hash);
          })
          .on('receipt', receipt => {
            Logger.log(TAG, 'Mint process, receipt is', receipt);
          })
          .on('confirmation', (confirmationNumber, receipt) => {
            Logger.log(TAG,
              'Mint process, confirmation is',
              confirmationNumber,
              receipt,
            );
          })
          .on('error', (error, receipt) => {
            Logger.error(TAG, 'Mint process, error is', error, receipt);
          });

        this.checkTokenState(tokenId, info => {
          Logger.log(TAG, 'Mint success, token info is', info);
          resolve(info);
        });
      } catch (error) {
        Logger.error(TAG, 'Mint error', error);
        reject(error);
      }
    });
  }

  async tokenIdOfOwnerByIndex(address, index) {
    return await this.stickerContract.methods
      .tokenIdOfOwnerByIndex(address, index)
      .call();
  }

  async tokenCountOfOwner(address) {
    return await this.stickerContract.methods.tokenCountOfOwner(address).call();
  }

  async createTxParams(data) {
    return new Promise(async (resolve, reject) => {
      try {
        let accountAddress = this.walletConnectControllerService.getAccountAddress();
        let txGas = 0;

        const txData = {
          from: this.walletConnectControllerService.getAccountAddress(),
          to: this.stickerAddress,
          value: 0,
          data: data,
        };
        Logger.log(TAG, 'Create Tx Params is', txData);

        await this.web3.eth.estimateGas(txData, (error, gasResult) => {
          txGas = gasResult;
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
          value: 0,
        };
        resolve(txResult);
      } catch (error) {
        Logger.log(TAG, 'error', error);
        reject(EstimateGasError);
      }
    });
  }

  checkTokenState(tokenId, callback: (tokenInfo: any) => void) {
    this.checkTokenNum = 0;
    this.checkTokenInterval = setInterval(async () => {
      if (!this.checkTokenInterval) return;
      let info = await this.tokenInfo(tokenId);
      if (info[0] != '0') {
        Logger.log(TAG, 'Check token state finish', info);
        clearInterval(this.checkTokenInterval);
        callback(info);
        this.checkTokenInterval = null;
      }

      this.checkTokenNum++;
      if (this.checkTokenNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_MINT) {
        clearInterval(this.checkTokenInterval);
        this.checkTokenInterval = null;
        Logger.log(TAG, 'Exit check token state by self');
      }
    }, Config.CHECK_STATUS_INTERVAL_TIME);
  }

  cancelMintProcess() {
    if (!this.checkTokenInterval) return;
    clearInterval(this.checkTokenInterval);
  }

  async isApprovedForAll(_owner, _operator) {
    if (!this.stickerContract) return false;
    return await this.stickerContract.methods
      .isApprovedForAll(_owner, _operator)
      .call();
  }

  checkApprovedState(
    _owner,
    _operator,
    callback: (isApproved: boolean) => void,
  ) {
    this.checkApprovedNum = 0;
    this.checkApprovedInterval = setInterval(async () => {
      if (!this.checkApprovedInterval) return;
      let isApproved = await this.isApprovedForAll(_owner, _operator);
      if (isApproved) {
        Logger.log(TAG, 'Check Approved finish', isApproved);
        clearInterval(this.checkApprovedInterval);
        callback(isApproved);
        this.checkApprovedInterval = null;
      }

      this.checkApprovedNum++;
      if (this.checkApprovedNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_MINT) {
        clearInterval(this.checkApprovedInterval);
        this.checkApprovedInterval = null;
        Logger.log(TAG, 'Exit check Approved state by self');
      }
    }, Config.CHECK_STATUS_INTERVAL_TIME);
  }

  cancelSetApprovedProcess() {
    if (!this.checkApprovedInterval) return;
    clearInterval(this.checkApprovedInterval);
  }
}
