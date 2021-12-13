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
  private checkBurnInterval: NodeJS.Timer;
  private checkTransferInterval: NodeJS.Timer;

  private checkTokenNum: number = 0;
  private checkApprovedNum: number = 0;
  private checkBurnNum: number = 0;
  private checkTransferNum: number = 0;
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
    didUri: string
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        Logger.log(TAG, 'Mint params ', tokenId, supply, uri, royalty,didUri);
        const mintdata = this.stickerContract.methods
          .mint(tokenId, supply, uri, royalty,didUri)
          .encodeABI();
        let transactionParams = await this.createTxParams(mintdata);

        Logger.log(TAG,
          'Calling smart contract through wallet connect',
          mintdata,
          transactionParams,
        );
        this.stickerContract.methods
          .mint(tokenId, supply, uri, royalty,didUri)
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

  async totalSupply() {
    return await this.stickerContract.methods
      .totalSupply()
      .call();
  }

  async tokenIdByIndex(index: string) {
    return await this.stickerContract.methods
      .tokenIdByIndex(index)
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
      if (info[0] != '0' && info[2] != '0') {
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

  async burnNfs(
    tokenId: string,
    burnValue: string
  ): Promise<any>{
    return new Promise(async (resolve, reject) => {
          try {
            Logger.log(TAG, 'burn params ', tokenId,burnValue);
            const burndata = this.stickerContract.methods
              .burn(tokenId,burnValue)
              .encodeABI();
            let beforeBurnBalance = parseInt(await this.balanceOf(tokenId));
            let transactionParams = await this.createTxParams(burndata);
            Logger.log(TAG,
              'Calling smart contract through wallet connect',
              burndata,
              transactionParams,
            );
            this.stickerContract.methods
              .burn(tokenId,burnValue)
              .send(transactionParams)
              .on('transactionHash', hash => {
              Logger.log(TAG, 'Burn process, transactionHash is', hash);
              })
              .on('receipt', receipt => {
                Logger.log(TAG, 'Burn process, receipt is', receipt);
              })
              .on('confirmation', (confirmationNumber, receipt) => {
                Logger.log(TAG,
                  'Burn process, confirmation is',
                  confirmationNumber,
                  receipt,
                );
              })
              .on('error', (error, receipt) => {
                Logger.error(TAG, 'Burn process, error is', error, receipt);
              });
              this.checkBurnState(beforeBurnBalance,parseInt(burnValue),tokenId,()=>{
                 resolve(null);
              });
          } catch (error) {
            Logger.error(TAG, 'burn error', error);
            reject(error);
          }
    });
  }

  cancelBurnProcess(){
    if (!this.checkBurnInterval) return;
    clearInterval(this.checkBurnInterval);
  }

  checkBurnState(beforeBurnBalance:number,burnValue:number,tokenId:string,callback: (tokenInfo: any) => void){
     this.checkBurnInterval = setInterval(async () => {
      this.checkBurnNum=0;
      if (!this.checkBurnInterval) return;
      let afterBurnBalance = parseInt(await this.balanceOf(tokenId));
      if(beforeBurnBalance - afterBurnBalance === burnValue){
        clearInterval(this.checkBurnInterval);
        callback("sucess");
        this.checkBurnInterval = null;
        return;
      }

      this.checkBurnNum++;
      if (this.checkBurnNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_MINT) {
        clearInterval(this.checkBurnInterval);
        this.checkBurnInterval = null;
      }
     },Config.CHECK_STATUS_INTERVAL_TIME);
  }

 async balanceOf(tokenId:string){
  let accountAddress = this.walletConnectControllerService.getAccountAddress();
  return await this.stickerContract.methods.balanceOf(accountAddress, tokenId).call();
  }

 async safeTransferFrom(
    creatorAddress: string,
    sellerAddress: string,
    tokenId: string,
    transferValue: string
  ): Promise<any>{
    return new Promise(async (resolve, reject) => {
          try {
            Logger.log(TAG, 'safeTransferFrom ',creatorAddress,sellerAddress,tokenId,transferValue);
            const safeTransferFromdata = this.stickerContract.methods
              .safeTransferFrom(creatorAddress,sellerAddress,tokenId,transferValue)
              .encodeABI();
            let beforeTransferBalance = parseInt(await this.balanceOf(tokenId));
            let transactionParams = await this.createTxParams(safeTransferFromdata);
            Logger.log(TAG,
              'Calling smart contract through wallet connect',
              safeTransferFromdata,
              transactionParams,
            );
            this.stickerContract.methods
              .safeTransferFrom(creatorAddress,sellerAddress,tokenId,transferValue)
              .send(transactionParams)
              .on('transactionHash', hash => {
              Logger.log(TAG, 'Burn process, transactionHash is', hash);
              })
              .on('receipt', receipt => {
                Logger.log(TAG, 'Burn process, receipt is', receipt);
              })
              .on('confirmation', (confirmationNumber, receipt) => {
                Logger.log(TAG,
                  'Burn process, confirmation is',
                  confirmationNumber,
                  receipt,
                );
              })
              .on('error', (error, receipt) => {
                Logger.error(TAG, 'Burn process, error is', error, receipt);
              });
              this.checkTransferState(beforeTransferBalance,parseInt(transferValue),tokenId,()=>{
                 resolve(null);
              });
          } catch (error) {
            Logger.error(TAG, 'burn error', error);
            reject(error);
          }
    });
  }

  checkTransferState(beforeTransferBalance:number,transferValue:number,tokenId:string,callback: (tokenInfo: any) => void){
    this.checkTransferInterval = setInterval(async () => {
     this.checkTransferNum=0;
     if (!this.checkTransferInterval) return;
     let afterTransferBalance = parseInt(await this.balanceOf(tokenId));
     if(beforeTransferBalance - afterTransferBalance === transferValue){
       clearInterval(this.checkTransferInterval);
       callback("sucess");
       this.checkTransferInterval = null;
       return;
     }

     this.checkTransferNum++;
     if (this.checkTransferNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_MINT) {
       clearInterval(this.checkBurnInterval);
       this.checkTransferInterval = null;
     }
    },Config.CHECK_STATUS_INTERVAL_TIME);
 }

 cancelTransferProcess(){
  if (!this.checkTransferInterval) return;
  clearInterval(this.checkTransferInterval);
 }

 async tokenExtraInfo(tokenId: string) {
  return await this.stickerContract.methods
    .tokenExtraInfo(tokenId)
    .call();
}

async safeTransferFromWithMemo(
  creatorAddress: string,
  sellerAddress: string,
  tokenId: string,
  transferValue: string,
  transferMemo: string
): Promise<any>{
  return new Promise(async (resolve, reject) => {
        try {
          Logger.log(TAG, 'safeTransferFromWithMemo ',creatorAddress,sellerAddress,tokenId,transferValue,transferMemo);
          const safeTransferFromdata = this.stickerContract.methods
            .safeTransferFromWithMemo(creatorAddress,sellerAddress,tokenId,transferValue,transferMemo)
            .encodeABI();
          let beforeTransferBalance = parseInt(await this.balanceOf(tokenId));
          let transactionParams = await this.createTxParams(safeTransferFromdata);
          Logger.log(TAG,
            'Calling smart contract through wallet connect',
            safeTransferFromdata,
            transactionParams,
          );
          this.stickerContract.methods
            .safeTransferFromWithMemo(creatorAddress,sellerAddress,tokenId,transferValue,transferMemo)
            .send(transactionParams)
            .on('transactionHash', hash => {
            Logger.log(TAG, 'safeTransferFromWithMemo, transactionHash is', hash);
            })
            .on('receipt', receipt => {
              Logger.log(TAG, 'safeTransferFromWithMemo, receipt is', receipt);
            })
            .on('confirmation', (confirmationNumber, receipt) => {
              Logger.log(TAG,
                'safeTransferFromWithMemo, confirmation is',
                confirmationNumber,
                receipt,
              );
            })
            .on('error', (error, receipt) => {
              Logger.error(TAG, 'safeBatchTransferFromWithMemo, error is', error, receipt);
            });
            this.checkTransferState(beforeTransferBalance,parseInt(transferValue),tokenId,()=>{
               resolve(null);
            });
        } catch (error) {
          Logger.error(TAG, 'safeTransferFromWithMemo', error);
          reject(error);
        }
  });
}

}
