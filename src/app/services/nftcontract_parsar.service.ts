import { Injectable } from '@angular/core';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import Web3 from "web3";


@Injectable()
export class NFTContractParsarService {
    private pasarAbi = require("../../assets/contracts/pasarABI.json");
    private pasarAddr:string = "0xBF362056dE83F2449180929a736a8cD02367b7c2";
    private pasarContract: any;
    private web3: Web3;
    constructor(private walletConnectControllerService: WalletConnectControllerService) {
      this.init();
    }

    init(){
      this.web3 = this.walletConnectControllerService.getWeb3();
      if (!this.web3)
        return ;
      this.pasarContract = new this.web3.eth.Contract(this.pasarAbi,this.pasarAddr);
    }

    getPasarContract(){
      return this.pasarContract;
    }

    protected async getSellerByAddr(sellerAddress){
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

    createOrderForSale(tokenId,quantity,price){
      //TODO write
      return this.pasarContract.methods.createOrderForSale(tokenId,quantity,price).encodeABI();
    }

    changeOrderPrice(orderId, price){
      //TODO write
      return this.pasarContract.methods.changeOrderPrice(orderId,price).encodeABI();
    }
    
    buyOrder(orderId){
      //TODO write
      return this.pasarContract.methods.buyOrder(orderId).encodeABI();
    }

    cancelOrder(orderId){
      //TODO write
      return this.pasarContract.methods.cancelOrder(orderId).encodeABI();
    }

    async getBuyerByAddr(address){
      return await this.pasarContract.methods.getBuyerByAddr(address).call()
    }
}
