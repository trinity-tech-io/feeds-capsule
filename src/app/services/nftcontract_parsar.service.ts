import { Injectable } from '@angular/core';
import { reject } from 'lodash';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import Web3 from 'web3';
import { Config } from './config';
import { Logger } from './logger';

const TAG: string = 'NFTPasarService';
const SUCCESS = 'success';
const FAIL = '';
const EstimateGasError = 'EstimateGasError';
const TIMEOUT = 'timeout';

type TXData = {
  from: string;
  gasPrice: string;
  gas: number;
  value: any;
}
@Injectable()
export class NFTContractParsarService {
  private pasarAbi = require('../../assets/contracts/pasarABI.json');
  private pasarAddr: string = Config.PASAR_ADDRESS;
  private pasarContract: any;
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
    this.pasarContract = new this.web3.eth.Contract(
      this.pasarAbi,
      this.pasarAddr,
    );
  }

  setTestMode(testMode: boolean) {
    if (testMode) {
      this.pasarAddr = Config.PASAR_TEST_ADDRESS;
      return;
    }

    this.pasarAddr = Config.PASAR_ADDRESS;
  }

  getPasar() {
    return this;
  }

  getPasarAddress() {
    return this.pasarAddr;
  }

  async getSellerByAddr(sellerAddress) {
    if (!this.pasarContract) return [];
    //return seller info
    return await this.pasarContract.methods
      .getSellerByAddr(sellerAddress)
      .call();
  }

  async getOrderById(nftOrderId) {
    if (!this.pasarContract) return [];
    //return order
    return await this.pasarContract.methods.getOrderById(nftOrderId).call();
  }

  async getTokenAddress() {
    if (!this.pasarContract) return '';
    //return token address
    return await this.pasarContract.methods.getTokenAddress().call();
  }

  async getOpenOrderCount() {
    if (!this.pasarContract) return 0;
    return await this.pasarContract.methods.getOpenOrderCount().call();
  }

  async getOpenOrderByIndex(index) {
    if (!this.pasarContract) return 0;
    return await this.pasarContract.methods.getOpenOrderByIndex(index).call();
  }

  async getBuyerCount() {
    if (!this.pasarContract) return 0;
    return await this.pasarContract.methods.getBuyerCount().call();
  }

  async getBuyerByIndex(index) {
    if (!this.pasarContract) return [];
    return await this.pasarContract.methods.getBuyerByIndex(index).call();
  }

  async getSellerCount() {
    if (!this.pasarContract) return 0;
    return await this.pasarContract.methods.getSellerCount().call();
  }

  async getSellerByIndex(index) {
    if (!this.pasarContract) return [];
    return await this.pasarContract.methods.getSellerByIndex(index).call();
  }

  async getSellerOpenByIndex(address, index) {
    if (!this.pasarContract) return [];
    return await this.pasarContract.methods
      .getSellerOpenByIndex(address, index)
      .call();
  }

  async getSellerOrderByIndex(index) {
    if (!this.pasarContract) return [];
    let accountAddress = this.walletConnectControllerService.getAccountAddress();
    return await this.pasarContract.methods
      .getSellerOrderByIndex(accountAddress, index)
      .call();
  }

  async getBuyerOrderByIndex(address, index) {
    if (!this.pasarContract) return [];
    return await this.pasarContract.methods
      .getBuyerOrderByIndex(address, index)
      .call();
  }

  createOrderForSale(tokenId: string, quantity: string, price: string,didUri :string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        Logger.log(TAG, 'Create order for sale, params', tokenId, quantity, price, didUri);
        let accountAddress = this.walletConnectControllerService.getAccountAddress();
        let seller = await this.getSellerByAddr(accountAddress);
        let lastOrderIndex = seller[2] - 1;

        const orderdata = this.pasarContract.methods
          .createOrderForSale(tokenId, quantity, price,didUri)
          .encodeABI();
        let transactionParams = await this.createTxParams(orderdata, 0);

        Logger.log(TAG,
          'Calling createOrderForSale smart contract through wallet connect',
          orderdata,
          transactionParams,
        );

        this.pasarContract.methods
          .createOrderForSale(tokenId, quantity, price,didUri)
          .send(transactionParams)
          .on('transactionHash', hash => {
            Logger.log(TAG, 'CreateOrderForSale, transactionHash is', hash);
            //TODO
          })
          .on('receipt', receipt => {
            Logger.log(TAG, 'CreateOrderForSale, receipt is', receipt);
          })
          .on('confirmation', (confirmationNumber, receipt) => {
            Logger.log(TAG,
              'CreateOrderForSale, confirmation is',
              confirmationNumber,
              receipt,
            );
          })
          .on('error', (error, receipt) => {
            resolve(-1);
            Logger.error(TAG, 'CreateOrderForSale, error is', error, receipt);
          });

        this.checkSellerOrderState(accountAddress, lastOrderIndex, newIndex => {
          Logger.log(TAG, 'checkSellerOrderState finish final');
          resolve(newIndex);
        });
      } catch (error) {
        Logger.error(TAG, 'Create order error', error);
        reject(error);
      }
    });
  }

  checkSellerOrderState(
    accountAddress,
    lastOrderIndex,
    callback: (newIndex: number) => void,
  ) {
    this.checkSellOrderNum = 0;
    this.checkSellerOrderStateInterval = setInterval(async () => {
      if (!this.checkSellerOrderStateInterval) return;
      let seller = await this.getSellerByAddr(accountAddress);
      let newIndex = seller[2] - 1;
      if (newIndex != lastOrderIndex) {
        clearInterval(this.checkSellerOrderStateInterval);
        callback(newIndex);
        this.checkSellerOrderStateInterval = null;
        Logger.log(TAG, 'Check Seller Order State finish, new index is ', newIndex);
      }

      this.checkSellOrderNum++;
      if (this.checkSellOrderNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_SELL_ORDER) {
        clearInterval(this.checkSellerOrderStateInterval);
        this.checkSellerOrderStateInterval = null;
        Logger.log(TAG, 'Exit check seller order state by self');
      }
    }, Config.CHECK_STATUS_INTERVAL_TIME);
  }

  cancelCreateOrderProcess() {
    if (!this.checkSellerOrderStateInterval) return;
    clearInterval(this.checkSellerOrderStateInterval);
  }

  changeOrderPrice(accountAddress, orderId, price): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        Logger.log(TAG, 'Change order price, params is', accountAddress, orderId, price);
        let seller = await this.getSellerByAddr(accountAddress);
        let lastOrderIndex = seller[2] - 1;
        let originOrder = await this.getSellerOrderByIndex(lastOrderIndex);
        let oldPrice = originOrder[5];

        Logger.log(TAG, 'Origin order is ', originOrder, 'price is', oldPrice);
        const orderdata = this.pasarContract.methods
          .changeOrderPrice(orderId, price)
          .encodeABI();
        let transactionParams = await this.createTxParams(orderdata, 0);

        Logger.log(TAG,
          'Calling changeOrderPrice smart contract through wallet connect',
          orderdata,
          transactionParams,
        );

        this.pasarContract.methods
          .changeOrderPrice(orderId, price)
          .send(transactionParams)
          .on('transactionHash', hash => {
            Logger.log(TAG, 'ChangeOrderPrice, transactionHash is', hash);
            resolve(SUCCESS);
          })
          .on('receipt', receipt => {
            Logger.log(TAG, 'ChangeOrderPrice, receipt is', receipt);
          })
          .on('confirmation', (confirmationNumber, receipt) => {
            Logger.log(TAG,
              'ChangeOrderPrice, confirmation is',
              confirmationNumber,
              receipt,
            );
          })
          .on('error', (error, receipt) => {
            resolve(FAIL);
            Logger.error(TAG, 'ChangeOrderPrice, error is', error, receipt);
          })
          .on('OrderPriceChanged', (orderId, oldPrice, price) => {
            Logger.log(TAG,
              'ChangeOrderPrice, OrderPriceChanged',
              orderId, oldPrice, price
            );
          })
          ;

        this.checkPrice(lastOrderIndex, oldPrice, newPrice => {
          resolve(SUCCESS);
        });
      } catch (error) {
        Logger.error(TAG, 'Change Order price error', error);
        reject(error);
      }
    });
  }

  checkPrice(lastOrderIndex, price, callback: (newPrice: number) => void) {
    this.checkPriceNum = 0;
    this.checkPriceInterval = setInterval(async () => {
      if (!this.checkPriceInterval) return;
      let newOrder = await this.getSellerOrderByIndex(lastOrderIndex);
      let newPrice = newOrder[5];
      if (newPrice != price) {
        Logger.log(TAG, 'Check price finish, new price is', newPrice);
        clearInterval(this.checkPriceInterval);
        callback(newPrice);
        this.checkPriceInterval = null;
      }

      this.checkPriceNum++;
      if (this.checkPriceNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_CHANGE_PRICE) {
        clearInterval(this.checkPriceInterval);
        this.checkPriceInterval = null;
        Logger.log(TAG, 'Exit check order price by self');
      }
    }, Config.CHECK_STATUS_INTERVAL_TIME);
  }

  cancelChangePriceProcess() {
    if (!this.checkPriceInterval) return;
    clearInterval(this.checkPriceInterval);
  }

  buyOrder(accountAddress: string, orderId: string, price: string,
    didUri: string, eventCallback: (eventName: string, result: FeedsData.ContractEventResult) => void): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        Logger.log(TAG, 'Buy Order params', accountAddress, orderId, price, didUri);
        let buyer = await this.getBuyerByAddr(accountAddress);
        let lastIndex = buyer[2] - 1;

        const orderdata = this.pasarContract.methods
          .buyOrder(orderId,didUri)
          .encodeABI();
        let transactionParams = await this.createTxParams(orderdata, price);

        Logger.log(TAG,
          'Calling buyOrder smart contract through wallet connect',
          orderdata,
          transactionParams,
        );

        this.pasarContract.methods
          .buyOrder(orderId,didUri)
          .send(transactionParams)
          .on('transactionHash', hash => {
            Logger.log(TAG, 'BuyOrder, transactionHash is', hash);
            const hashResult: FeedsData.ContractEventResult = {
              hash: hash
            }
            eventCallback(FeedsData.ContractEvent.TRANSACTION_HASH, hashResult);
          })
          .on('receipt', receipt => {
            Logger.log(TAG, 'BuyOrder, receipt is', receipt);
            const receiptResult: FeedsData.ContractEventResult = {
              receipt: receipt
            }
            eventCallback(FeedsData.ContractEvent.RECEIPT, receiptResult);
          })
          .on('confirmation', (confirmationNumber, receipt) => {
            Logger.log(TAG, 'BuyOrder, confirmation is', confirmationNumber, receipt);
            const confirmationResult: FeedsData.ConfirmationResult = {
              confirmationNumber: confirmationNumber,
              receipt: receipt
            }
            eventCallback(FeedsData.ContractEvent.CONFIRMATION, confirmationResult);
          })
          .on('error', (error, receipt) => {
            resolve(FAIL);
            Logger.error(TAG, 'BuyOrder, error is', error, receipt);
            const errorResult: FeedsData.ErrorResult = {
              error: error,
              receipt: receipt
            }
            eventCallback(FeedsData.ContractEvent.ERROR, errorResult);
          });

        this.checkBuyerOrderState(accountAddress, lastIndex, (result: number | string) => {
          if (result == TIMEOUT)
            resolve(TIMEOUT);
          resolve(SUCCESS);
        });
      } catch (error) {
        Logger.error(TAG, 'Buy Order price error', error);
        reject(error);
      }
    });
  }

  checkBuyerOrderState(accountAddress: string, lastOrderIndex: number, callback: (newIndex: number) => void): Promise<number | string> {
    return new Promise(async (resolve, reject) => {
      try {
        this.checkBuyOrderStateNum = 0;
        this.checkBuyerOrderStateInterval = setInterval(async () => {
          if (!this.checkBuyerOrderStateInterval) return;
          let buyer = await this.getBuyerByAddr(accountAddress);
          Logger.log(TAG, 'Buyer info is', buyer);

          let newIndex = buyer[2] - 1;
          if (newIndex != lastOrderIndex) {
            clearInterval(this.checkBuyerOrderStateInterval);
            callback(newIndex);
            resolve(newIndex);
            this.checkBuyerOrderStateInterval = null;
            Logger.log(TAG, 'CheckBuyerOrderState , new index is ', newIndex);
          }

          this.checkBuyOrderStateNum++;
          if (this.checkBuyOrderStateNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_BUY_ORDER) {
            clearInterval(this.checkBuyerOrderStateInterval);
            this.checkBuyerOrderStateInterval = null;
            resolve(TIMEOUT);
            Logger.log(TAG, 'Exit check buy order state by self');
          }
        }, Config.CHECK_STATUS_INTERVAL_TIME);
      } catch (error) {
        reject(error);
      }
    });
  }

  cancelBuyOrderProcess() {
    if (!this.checkBuyerOrderStateInterval) return;
    clearInterval(this.checkBuyerOrderStateInterval);
  }

  cancelOrder(orderId): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        Logger.log(TAG, 'Cancel order, params', orderId);

        const orderdata = this.pasarContract.methods
          .cancelOrder(orderId)
          .encodeABI();
        let transactionParams = await this.createTxParams(orderdata, 0);

        Logger.log(TAG,
          'Calling cancelOrder smart contract through wallet connect',
          orderdata,
          transactionParams,
        );

        let order = await this.getOrderById(orderId);
        let originOrderState = order[2];
        Logger.log(TAG, 'Origin order is', order);

        this.pasarContract.methods
          .cancelOrder(orderId)
          .send(transactionParams)
          .on('transactionHash', hash => {
            Logger.log(TAG, 'transactionHash', hash);
            resolve(SUCCESS);
          })
          .on('receipt', receipt => {
            Logger.log(TAG, 'receipt', receipt);
          })
          .on('confirmation', (confirmationNumber, receipt) => {
            Logger.log(TAG, 'confirmation', confirmationNumber, receipt);
          })
          .on('error', (error, receipt) => {
            resolve(FAIL);
            Logger.error(TAG, 'Cancel order error', error, receipt);
          });

        this.checkOrderState(orderId, originOrderState, newOrderState => {
          resolve(SUCCESS);
        });
      } catch (error) {
        Logger.error(TAG, 'Cancel order error', error);
        reject(error);
      }
    });
  }

  checkOrderState(
    orderId,
    originOrderState,
    callback: (newOrderState: number) => void,
  ) {
    this.checkOrderStateNum = 0;
    this.checkOrderStateInterval = setInterval(async () => {
      if (!this.checkOrderStateInterval) return;

      let order = await this.getOrderById(orderId);
      let newOrderState = order[2];

      if (newOrderState != originOrderState) {
        clearInterval(this.checkOrderStateInterval);
        callback(newOrderState);
        this.checkOrderStateInterval = null;
        Logger.log(TAG,
          'Check order state finish, new order state is ',
          newOrderState,
        );
      }

      this.checkOrderStateNum++;
      if (this.checkOrderStateNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_CANCEL_ORDER) {
        clearInterval(this.checkOrderStateInterval);
        this.checkOrderStateInterval = null;
        Logger.log(TAG, 'Exit check order state by self');
      }
    }, Config.CHECK_STATUS_INTERVAL_TIME);
  }

  cancelCancelOrderProcess() {
    if (!this.checkOrderStateInterval) return;
    clearInterval(this.checkOrderStateInterval);
  }

  async getBuyerByAddr(address) {
    Logger.log(TAG, 'Get buyer address', address);
    return await this.pasarContract.methods.getBuyerByAddr(address).call();
  }

  getAddress() {
    return this.pasarAddr;
  }

  createTxParams(data, price): Promise<TXData> {
    return new Promise(async (resolve, reject) => {
      try {
        let accountAddress = this.walletConnectControllerService.getAccountAddress();
        let txGas = 0;

        const txData = {
          from: this.walletConnectControllerService.getAccountAddress(),
          to: this.pasarAddr,
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
