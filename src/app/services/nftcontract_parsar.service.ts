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
      this.pasarContract = new this.web3.eth.Contract(this.pasarAbi,this.pasarAddr);
    }

    async getSellerByAddr(sellerAddress){
      //return seller info
      return await this.pasarContract.methods.getSellerByAddr(sellerAddress).call();
    }

    async getOrderById(nftOrderId){
      //return order
      return await this.pasarContract.methods.getOrderById(nftOrderId).call()
    }

    async getTokenAddress(){
      //return token address
      return await this.pasarContract.methods.getTokenAddress().call();
    }

    createOrderForSale(tokenId,quantity,price){
      //TODO
      return this.pasarContract.methods.createOrderForSale(tokenId,quantity,price).encodeABI();
    }

    changeOrderPrice(orderId, price){
      //TODO
      return this.pasarContract.methods.changeOrderPrice(orderId,price).encodeABI();
    }

    async getOpenOrderCount(){
      return await this.pasarContract.methods.getOpenOrderCount().call();
    }

    async getOpenOrderByIndex(index){
      return await this.pasarContract.methods.getOpenOrderByIndex(index).call();
    }

    buyOrder(orderId){
      //TODO
      return this.pasarContract.methods.buyOrder(orderId).encodeABI();
    }

    async getBuyerCount(){
      return await this.pasarContract.methods.getBuyerCount().call();
    }

    async getBuyerByIndex(index){
      return await this.pasarContract.methods.getBuyerByIndex(index).call();
    }

    async getSellerCount(){
      return await this.pasarContract.methods.getSellerCount().call();
    }

    async getSellerByIndex(index){
      return await this.pasarContract.methods.getSellerByIndex(index).call();
    }

    async getSellerOpenByIndex(address, index){
      return await this.pasarContract.methods.getSellerOpenByIndex(address,index).call();
    }

    async getBuyerOrderByIndex(address, index){
      return await this.pasarContract.methods.getBuyerOrderByIndex(address,index).call();
    }

    cancelOrder(orderId){
      //TODO
      return this.pasarContract.methods.cancelOrder(orderId).encodeABI();
    }

}
