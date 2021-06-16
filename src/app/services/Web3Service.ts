import {Injectable} from '@angular/core';
import Web3 from "web3";
@Injectable()
export class Web3Service{
    private web3:any;
    private stickerAddr:string = "0x694EBA9AF996b9daB7E4B601faDa8B70b85FBb35";
    private pasarAddr:string = "0x4E5fe6d2ec4EC0e07e48D7C652aefE04dAE23214"
    constructor(){
       this.initWeb3Js();
    }

    getStickerAddr(){
      return this.stickerAddr;
    }

    getStickerAbi(){
     let stickerAbi = require("../../assets/contracts/stickerABI.json");
     return stickerAbi;
    }

    getPasarAbi(){
      let pasarAbi = require("../../assets/contracts/pasarABI.json");
      return pasarAbi;
    }

    getPasarAddr(){
      return this.pasarAddr;
    }

   async initWeb3Js(){
        if (typeof this.web3 !== 'undefined') {
            this.web3 = new Web3(this.web3.currentProvider);
          } else {
            // set the provider you want from Web3.providers
            this.web3 = new Web3(new Web3.providers.HttpProvider("https://api-testnet.elastos.io/eth",{agent:{}}));
            let version = this.web3.version;
            console.log("===version==="+version);
          }
   }

   initContract(web3:any,contractABI:any,contractAddr:any){
    const contract = new web3.eth.Contract(contractABI,contractAddr);
    return contract;
   }

  async getWeb3Js(){
     return this.web3;
  }


  async getAccount(web3:any,privateKey:any){
    try {
      if (!web3) {
        console.error("Web3 not initialized");
        return;
      }
      if (!privateKey.startsWith("0x")) {
        privateKey = `0x${privateKey}`;
      }
      const acc = web3.eth.accounts.privateKeyToAccount(privateKey);
      return acc;
    } catch (err) {
      console.error(String(err));
      return;
    }
  }

  async sendTxWaitForReceipt(web3:any,tx:any,acc:any){
    try {
      if (!web3) {
        console.error("Web3 not initialized");
      }

      if (!tx.gasPrice) {
        tx.gasPrice = await web3.eth.getGasPrice();
        console.log("======tx======"+JSON.stringify(tx));
      }

      if (!tx.gas) {
            tx.gas = Math.round(parseInt(await web3.eth.estimateGas(tx))*3);
      }
      console.log("======tx2======"+JSON.stringify(tx));
      const signedTx = await acc.signTransaction(tx);
      console.log("======signedTx======"+signedTx);
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      console.log("===receipt==="+JSON.stringify(receipt));
      return receipt;
    } catch (err) {
      //console.error(String(err));
      return "";
    }
  }
}