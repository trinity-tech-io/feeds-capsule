import { Injectable } from '@angular/core';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import Web3 from 'web3';
import { Config } from './config';

const TAG: string = 'NFTDiamondService';

@Injectable()
export class NFTContractDiamondService {
  private diamondAbi = require('../../assets/contracts/diamondABI.json');
  private diamondAddr: string = Config.DIAMOND_ADDRESS;
  private diamondContract: any;
  private web3: Web3;
  constructor(
    private walletConnectControllerService: WalletConnectControllerService,
  ) {
    this.init();
  }

  init() {
    this.web3 = this.walletConnectControllerService.getWeb3();
    if (!this.web3) return;
    if(this.diamondAddr === ""){
      this.diamondContract = "";
      return;
    }
    this.diamondContract = new this.web3.eth.Contract(
      this.diamondAbi,
      this.diamondAddr,
    );
  }

  setTestMode(testMode: boolean) {
    if (testMode) {
      this.diamondAddr = Config.DIAMOND_TEST_ADDRESS;
      return;
    }
    this.diamondAddr = Config.DIAMOND_ADDRESS;
  }

  getDiamond() {
    return this;
  }

  getDiamondAddress() {
    return this.diamondAddr;
  }

  async getDiamondBalance(userAddress: string) {
    if(this.diamondContract=== ""){
      return '0';
    }
    try {
      const info = await this.diamondContract.methods.balanceOf(userAddress).call();
      if(info === '0'){
        return '0';
      }
      let balance = this.web3.utils.fromWei(info, 'ether');
      return balance;
    } catch (error) {
      return '0';
    }
  }
}
