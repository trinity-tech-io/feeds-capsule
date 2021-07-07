import { Injectable } from '@angular/core';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import Web3 from 'web3';

@Injectable()
export class NFTContractStickerService {
    private stickerAddr:string = "0x6F2477C1439676337b02D51C3b0c327942751C9d";
    private stickerAbi = require("../../assets/contracts/stickerABI.json");
    private web3: Web3;
    private stickerContract: any;

    constructor(private walletConnectControllerService: WalletConnectControllerService) {
      this.init();
    }

    init(){
      this.web3 = this.walletConnectControllerService.getWeb3();
      if (!this.web3)
        return ;
      this.stickerContract = new this.web3.eth.Contract(this.stickerAbi,this.stickerAddr);
    }

    setApprovalForAll(address: string, approved: boolean){
      //TODO write
      return this.stickerContract.methods.setApprovalForAll(address, approved).encodeABI();
    }

    async tokenInfo(tokenId){
      if (!this.stickerContract)
        return [];
      return await this.stickerContract.methods.tokenInfo(tokenId).call();
    }

    async mint(tokenId, supply, uri, royalty){
      //TODO write

      let accountAddress = this.walletConnectControllerService.getAccountAddress();
      // this.stickerContract.methods.mint(tokenId,supply,uri,royalty).encodeABI();

      let gasPrice = await this.web3.eth.getGasPrice();
      console.log("Gas price:", gasPrice);
  
      console.log("Sending transaction with account address:", accountAddress);
      let transactionParams = {
          from: accountAddress,
          gasPrice: gasPrice,
          gas: 5000000,
          value: 0
      };
  
      console.log("Calling smart contract through wallet connect", accountAddress, tokenId, uri);
      this.stickerContract.methods.mint(accountAddress, tokenId, uri).send(transactionParams)
          .on('transactionHash', (hash) => {
            console.log("transactionHash", hash);
          })
          .on('receipt', (receipt) => {
            console.log("receipt", receipt);
          })
          .on('confirmation', (confirmationNumber, receipt) => {
            console.log("confirmation", confirmationNumber, receipt);
          })
          .on('error', (error, receipt) => {
            console.error("mint error===");
            console.error("error", error);
          });
    }
    
    async tokenIdOfOwnerByIndex(address, index){
      return await this.stickerContract.methods.tokenIdOfOwnerByIndex(address,index).call();
    }

    async tokenCountOfOwner(address){
      return await this.stickerContract.methods.tokenCountOfOwner(address).call();
    }
}
