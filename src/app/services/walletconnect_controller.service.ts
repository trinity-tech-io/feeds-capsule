import { Injectable } from '@angular/core';
import WalletConnectProvider from "@walletconnect/web3-provider";
import { LogUtils } from "src/app/services/LogUtils";
import { DataHelper } from "src/app/services/DataHelper";

import Web3 from 'web3';

@Injectable()
export class WalletConnectControllerService {
    private rpc = {
      21: "https://api-testnet.elastos.io/eth",
    }
    private infuraId: "0dd3ab5ca24946938c6d411a1637cc59";
    private accountAddress = "";
    private walletConnectProvider: WalletConnectProvider;
    private walletConnectWeb3: Web3;
    constructor(
      private logUtils: LogUtils,
      private dataHelper: DataHelper) {
      this.initWalletConnectProvider();
    }

    public async connect(){
        return this.setupWalletConnectProvider();
    }

    private async initWalletConnectProvider(){
      this.accountAddress = await this.dataHelper.loadWalletAccountAddress();
      //  Create WalletConnect Provider
      this.walletConnectProvider = new WalletConnectProvider({
        rpc: this.rpc,
        infuraId: "0dd3ab5ca24946938c6d411a1637cc59",
        
        qrcodeModalOptions: {
          mobileLinks: [
            "metamask",
          ],
        },
      });

      console.log("Connected?", this.walletConnectProvider.connected);
      // Subscribe to accounts change
      this.walletConnectProvider.on("accountsChanged", (accounts: string[]) => {
        console.log("accountsChanged", accounts);
      });

      // Subscribe to chainId change
      this.walletConnectProvider.on("chainChanged", (chainId: number) => {
        console.log("chainChanged", chainId);
      });

      // Subscribe to session disconnection
      this.walletConnectProvider.on("disconnect", (code: number, reason: string) => {
        console.log("disconnect", code, reason);
      });

      // Subscribe to session disconnection
      this.walletConnectProvider.on("error", (code: number, reason: string) => {
        console.error("error", code, reason);
      });

      if (this.accountAddress != ""){
        const connect = await this.walletConnectProvider.getWalletConnector()
        this.accountAddress = connect.accounts[0]
        this.dataHelper.saveWalletAccountAddress(this.accountAddress);
        await this.initWeb3();
      }
    }


    private async setupWalletConnectProvider(){
      if (this.walletConnectProvider == null || this.walletConnectProvider == undefined){
        await this.initWalletConnectProvider();
      }

      //  Enable session (triggers QR Code modal)
      console.log("Connecting to wallet connect");
      try{
        let enabled = await this.walletConnectProvider.enable();
        console.log("CONNECTED to wallet connect", enabled, this.walletConnectProvider);
        this.initWeb3();
      }catch(err){
        //Work around 
        this.destroyWalletConnect();
        console.log("CONNECT error to wallet connect", err);
      }
    }

    async initWeb3(){
      this.walletConnectWeb3 = new Web3(this.walletConnectProvider as any); 
      this.accountAddress = await this.parseAccountAddress();
      this.dataHelper.saveWalletAccountAddress(this.accountAddress);
      return this.walletConnectWeb3;
    }

    public getWeb3(){
      return this.walletConnectWeb3;
    }

    private async parseAccountAddress(){
      const accounts = await this.walletConnectWeb3.eth.getAccounts();
      return accounts[0];
    }

    public getAccountAddress(){
      console.log("this.accountAddress = "+this.accountAddress);
      return this.accountAddress;
    }

    public async disconnect(){
      if (this.walletConnectProvider) {
        console.log("Disconnecting from wallet connect");
        try{
          await this.walletConnectProvider.disconnect();
          // await (await this.walletConnectProvider.getWalletConnector()).killSession();
        }catch(error){
          console.log("Disconnect wallet error", error);
        }
        console.log("Disconnected from wallet connect");
        this.destroyWalletConnect();
      }
      else {
        console.log("Not connected to wallet connect");
      }
    }

    destroyWalletConnect(){
      this.walletConnectProvider = null;
      this.accountAddress = "";
      this.dataHelper.saveWalletAccountAddress(this.accountAddress);
    }
}
