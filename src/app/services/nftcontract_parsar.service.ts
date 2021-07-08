import { Injectable } from '@angular/core';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import Web3 from "web3";


@Injectable()
export class NFTContractParsarService {
    private pasarAbi = require("../../assets/contracts/pasarABI.json");
    private pasarAddr:string = "0xBF362056dE83F2449180929a736a8cD02367b7c2";
    private pasarContract: any;
    private web3: Web3;
    private checkSellerOrderStateInterval: NodeJS.Timer;
    private checkPriceInterval: NodeJS.Timer;
    private checkBuyerOrderStateInterval: NodeJS.Timer;

    constructor(private walletConnectControllerService: WalletConnectControllerService) {
      this.init();
    }

    init(){
      this.web3 = this.walletConnectControllerService.getWeb3();
      if (!this.web3)
        return ;
      this.pasarContract = new this.web3.eth.Contract(this.pasarAbi,this.pasarAddr);
    }

    getPasar(){
      return this;
    }

    async getSellerByAddr(sellerAddress){
      if(!this.pasarContract)
        return [];
      //return seller info
      return await this.pasarContract.methods.getSellerByAddr(sellerAddress).call();
    }

    async getOrderById(nftOrderId){
      if(!this.pasarContract)
        return [];
      //return order
      return await this.pasarContract.methods.getOrderById(nftOrderId).call()
    }

    async getTokenAddress(){
      if(!this.pasarContract)
        return "";
      //return token address
      return await this.pasarContract.methods.getTokenAddress().call();
    }

    async getOpenOrderCount(){
      if(!this.pasarContract)
        return 0;
      return await this.pasarContract.methods.getOpenOrderCount().call();
    }

    async getOpenOrderByIndex(index){
      if(!this.pasarContract)
        return 0;
      return await this.pasarContract.methods.getOpenOrderByIndex(index).call();
    }

    async getBuyerCount(){
      if(!this.pasarContract)
        return 0;
      return await this.pasarContract.methods.getBuyerCount().call();
    }

    async getBuyerByIndex(index){
      if(!this.pasarContract)
        return [];
      return await this.pasarContract.methods.getBuyerByIndex(index).call();
    }

    async getSellerCount(){
      if(!this.pasarContract)
        return 0;
      return await this.pasarContract.methods.getSellerCount().call();
    }

    async getSellerByIndex(index){
      if(!this.pasarContract)
        return [];
      return await this.pasarContract.methods.getSellerByIndex(index).call();
    }

    async getSellerOpenByIndex(address, index){
      if(!this.pasarContract)
        return [];
      return await this.pasarContract.methods.getSellerOpenByIndex(address,index).call();
    }

    async getBuyerOrderByIndex(address, index){
      if(!this.pasarContract)
        return [];
      return await this.pasarContract.methods.getBuyerOrderByIndex(address,index).call();
    }

    createOrderForSale(accountAddress, tokenId, quantity, price): Promise<any>{
      return new Promise(async (resolve, reject) => {
        console.log("CreateOrderForSale params",tokenId,quantity,price);
        let seller = await this.getSellerByAddr(accountAddress);
        let lastOrderIndex = seller[2] - 1 ;

        const orderdata = this.pasarContract.methods.createOrderForSale(tokenId,quantity,price).encodeABI();
        let transactionParams = await this.createTxParams(orderdata);
    
        console.log("Calling createOrderForSale smart contract through wallet connect", orderdata, transactionParams);


        this.pasarContract.methods.createOrderForSale(tokenId,quantity,price)
          .send(transactionParams)
              .on('transactionHash', (hash) => {
                resolve(hash);
                console.log("transactionHash", hash);
              })
              .on('receipt', (receipt) => {
                resolve(receipt);
                console.log("receipt", receipt);
              })
              .on('confirmation', (confirmationNumber, receipt) => {
                resolve(receipt);
                console.log("confirmation", confirmationNumber, receipt);
              })
              .on('error', (error, receipt) => {
                reject(error);
                console.error("error", error, receipt);
              });

        this.checkSellerOrderState(accountAddress, lastOrderIndex, (newIndex)=>{
          resolve(newIndex);
        });
      });
    }

    checkSellerOrderState(accountAddress, lastOrderIndex, callback: (newIndex: number)=>void){
      this.checkSellerOrderStateInterval = setInterval(async () => {
        if (!this.checkSellerOrderStateInterval)
          return ;
        let seller = await this.getSellerByAddr(accountAddress);
        console.log("Seller info is", seller);

        let newIndex = seller[2]-1;
        if ( newIndex > lastOrderIndex){
          clearInterval(this.checkSellerOrderStateInterval);
          callback(newIndex);
          this.checkSellerOrderStateInterval = null;
        }
      }, 5000);
    }

    cancelCreateOrderProcess(){
      if (!this.checkSellerOrderStateInterval)
        return
      clearInterval(this.checkSellerOrderStateInterval);
    }

    changeOrderPrice(accountAddress, orderId, price): Promise<any>{
      return new Promise(async (resolve, reject) => {
        console.log("ChangeOrderPrice",orderId,price);

        let seller = await this.getSellerByAddr(accountAddress);
        console.log("Seller info ", seller);

        let lastOrderIndex = seller[2] - 1 ;
        let order = await this.getSellerByIndex(lastOrderIndex);
        console.log("Check order info ", order);

        let oldPrice = 0;//TODO change price

        const orderdata = this.pasarContract.methods.changeOrderPrice(orderId,price).encodeABI();
        let transactionParams = await this.createTxParams(orderdata);
    
        console.log("Calling changeOrderPrice smart contract through wallet connect", orderdata, transactionParams);

        this.pasarContract.methods.changeOrderPrice(orderId,price)
          .send(transactionParams)
              .on('transactionHash', (hash) => {
                resolve(hash);
                console.log("transactionHash", hash);
              })
              .on('receipt', (receipt) => {
                resolve(receipt);
                console.log("receipt", receipt);
              })
              .on('confirmation', (confirmationNumber, receipt) => {
                resolve(receipt);
                console.log("confirmation", confirmationNumber, receipt);
              })
              .on('error', (error, receipt) => {
                reject(error);
                console.error("error", error, receipt);
              });

        this.checkPrice(lastOrderIndex, oldPrice, (newPrice)=>{
          resolve(newPrice)
        });
      });
    }

    checkPrice(lastOrderIndex, price, callback: (newPrice: number)=>void){
      this.checkPriceInterval = setInterval(async () => {
        if (!this.checkPriceInterval)
          return ;
        let order = await this.getSellerByIndex(lastOrderIndex);
        console.log("CheckPrice , order info is", order);
        let newPrice = 0//TODO

        if ( newPrice != price){
          clearInterval(this.checkPriceInterval);
          callback(newPrice);
          this.checkPriceInterval = null;
        }
      }, 5000);
    }

    cancelChangePriceProcess(){
      if (!this.checkPriceInterval)
        return
      clearInterval(this.checkPriceInterval);
    }
    
    buyOrder(accountAddress, orderId): Promise<any>{
      return new Promise(async (resolve, reject) => {
        console.log("BuyOrder params",orderId);

        let buyer = await this.getBuyerByAddr(accountAddress);
        console.log("Buyer info ", buyer);
        let lastIndex = buyer[2] - 1;

        const orderdata = this.pasarContract.methods.buyOrder(orderId).encodeABI();
        let transactionParams = await this.createTxParams(orderdata);
    
        console.log("Calling buyOrder smart contract through wallet connect", orderdata, transactionParams);

        this.pasarContract.methods.buyOrder(orderId)
          .send(transactionParams)
              .on('transactionHash', (hash) => {
                resolve(hash);
                console.log("transactionHash", hash);
              })
              .on('receipt', (receipt) => {
                resolve(receipt);
                console.log("receipt", receipt);
              })
              .on('confirmation', (confirmationNumber, receipt) => {
                resolve(receipt);
                console.log("confirmation", confirmationNumber, receipt);
              })
              .on('error', (error, receipt) => {
                reject(error);
                console.error("error", error, receipt);
              });

        this.checkBuyerOrderState(accountAddress, lastIndex, ()=>{

        });
      });
    }

    checkBuyerOrderState(accountAddress, lastOrderIndex, callback: (newIndex: number)=>void){
      this.checkBuyerOrderStateInterval = setInterval(async () => {
        if (!this.checkBuyerOrderStateInterval)
          return ;
        let buyer = await this.getBuyerByAddr(accountAddress);
        console.log("Buyer info is", buyer);

        let newIndex = buyer[2]-1;
        if ( newIndex > lastOrderIndex){
          clearInterval(this.checkBuyerOrderStateInterval);
          callback(newIndex);
          this.checkBuyerOrderStateInterval = null;
        }
      }, 5000);
    }

    cancelBuyOrderProcess(){
      if (!this.checkBuyerOrderStateInterval)
        return
      clearInterval(this.checkBuyerOrderStateInterval);
    }

    cancelOrder(orderId){
      return new Promise(async (resolve, reject) => {
        console.log("CancelOrder params",orderId);

        const orderdata = this.pasarContract.methods.cancelOrder(orderId).encodeABI();
        let transactionParams = await this.createTxParams(orderdata);
    
        console.log("Calling cancelOrder smart contract through wallet connect", orderdata, transactionParams);


        this.pasarContract.methods.cancelOrder(orderId)
          .send(transactionParams)
              .on('transactionHash', (hash) => {
                resolve(hash);
                console.log("transactionHash", hash);
              })
              .on('receipt', (receipt) => {
                resolve(receipt);
                console.log("receipt", receipt);
              })
              .on('confirmation', (confirmationNumber, receipt) => {
                resolve(receipt);
                console.log("confirmation", confirmationNumber, receipt);
              })
              .on('error', (error, receipt) => {
                reject(error);
                console.error("error", error, receipt);
              });
      });
    }

    async getBuyerByAddr(address){
      return await this.pasarContract.methods.getBuyerByAddr(address).call()
    }

    getAddress(){
      return this.pasarAddr;
    }

    async createTxParams(data){
      let accountAddress = this.walletConnectControllerService.getAccountAddress();
      let gas = 500000;

      const txData = {
        from: this.walletConnectControllerService.getAccountAddress(),
        to: this.pasarAddr,
        value: 0,
        data: data
      };
      console.log("CreateTxParams is ",txData);
      try{
        let gas = await this.web3.eth.estimateGas(txData,(error,gas)=>{
          console.log("===gas error===",error);
          console.log("===gas gas===",gas);
        })
      }catch(error){
        console.log("error", error);
      }
      
      console.log("===gas ===",gas);
      let gasPrice = await this.web3.eth.getGasPrice();
      return {
        from: accountAddress,
        // to: stickerAddr,
        gasPrice: gasPrice,
        gas: Math.round(gas*3),
        value: 0
      };
    }
}
