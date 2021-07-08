// import {Injectable} from '@angular/core';
// import Web3 from "web3";
// @Injectable()
// export class Web3Service{
//     private createAddress = "0xf36dA13891027Fd074bCE86E1669E5364F85613A";
//     private sellerAddress = "0xf36dA13891027Fd074bCE86E1669E5364F85613A";
//     private web3:any;
//     private stickerContract:any;
//     private pasarContract:any;
//     private stickerAddr:string = "0x6F2477C1439676337b02D51C3b0c327942751C9d";
//     private pasarAddr:string = "0xBF362056dE83F2449180929a736a8cD02367b7c2";
//     constructor(){
//        this.init();
//     }

//    async init(){
//      await this.initWeb3Js();
//      this.initSticker();
//      this.initPasar();
//    }

//    initSticker(){
//     let stickerAbi = this.getStickerAbi();
//     this.stickerContract = new this.web3.eth.Contract(stickerAbi,this.stickerAddr);
//    }

//    getSticker(){
//     return this.stickerContract;
//    }

//    initPasar(){
//     let pasarAbi = this.getPasarAbi();
//     this.pasarContract = new this.web3.eth.Contract(pasarAbi,this.pasarAddr);
//    }

//    getPasar(){
//     return this.pasarContract;
//    }

//    getStickerAddr(){
//       return this.stickerAddr;
//    }

//    getStickerAbi(){
//      let stickerAbi = require("../../assets/contracts/stickerABI.json");
//      return stickerAbi;
//     }

//     getPasarAbi(){
//       let pasarAbi = require("../../assets/contracts/pasarABI.json");
//       return pasarAbi;
//     }

//     getPasarAddr(){
//       return this.pasarAddr;
//     }

//    async initWeb3Js(){
//         if (typeof this.web3 !== 'undefined') {
//             this.web3 = new Web3(this.web3.currentProvider);
//           } else {
//             // set the provider you want from Web3.providers
//             this.web3 = new Web3(new Web3.providers.HttpProvider("https://api-testnet.elastos.io/eth",{agent:{}}));
//             let version = this.web3.version;
//             console.log("===version==="+version);
//           }
//    }

//   async getWeb3Js(){
//      return this.web3;
//   }


//   async getAccount(privateKey:any){
//     try {
//       if (!this.web3) {
//         console.error("Web3 not initialized");
//         return;
//       }
//       if (!privateKey.startsWith("0x")) {
//         privateKey = `0x${privateKey}`;
//       }
//       const acc = this.web3.eth.accounts.privateKeyToAccount(privateKey);
//       return acc;
//     } catch (err) {
//       console.error(String(err));
//       return;
//     }
//   }

//   async sendTxWaitForReceipt(tx:any,acc:any){
//     try {
//       if (!this.web3) {
//         console.error("Web3 not initialized");
//       }

//       if (!tx.gasPrice) {
//         tx.gasPrice = await this.web3.eth.getGasPrice();
//       }

//       if (!tx.gas) {
//             tx.gas = Math.round(parseInt(await this.web3.eth.estimateGas(tx))*3);
//       }
//       const signedTx = await acc.signTransaction(tx);
//       const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
//       return receipt;
//     } catch (err) {
//       //console.error(String(err));
//       return "";
//     }
//   }

//   getToWei(price:string){
//     let wei  = this.web3.utils.toWei(price, 'ether');
//     return wei;
//   }

//   getFromWei(price:string)
//   {
//      let eth = this.web3.utils.fromWei(price, 'ether');
//      return eth;
//   }

//  async getBalance(address:any){
//    let balance =  await this.web3.eth.getBalance(address)
//    return balance;
//  }

//  getSellerAddress(){
//    return this.sellerAddress;
//  }

//  getCreateAddress(){
//    return this.createAddress;
//  }

// }