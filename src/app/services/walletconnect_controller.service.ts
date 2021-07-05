import { Injectable } from '@angular/core';
import WalletConnectProvider from "@walletconnect/web3-provider";
import { LogUtils } from "src/app/services/LogUtils";

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
    constructor(private logUtils: LogUtils) {
    }

    public async connect(){
        this.setupWalletConnectProvider();
    }

  private async setupWalletConnectProvider() {
    //  Create WalletConnect Provider
    this.walletConnectProvider = new WalletConnectProvider({
      rpc: this.rpc,
      infuraId: this.infuraId,
      
      qrcodeModalOptions: {
        mobileLinks: [
          "metamask",
        ],
      },
    });

    console.log("Connected?", this.walletConnectProvider.connected);

    // Subscribe to accounts change
    this.walletConnectProvider.on("accountsChanged", (accounts: string[]) => {
      console.log(accounts);
    });

    // Subscribe to chainId change
    this.walletConnectProvider.on("chainChanged", (chainId: number) => {
      console.log(chainId);
    });

    // Subscribe to session disconnection
    this.walletConnectProvider.on("disconnect", (code: number, reason: string) => {
      console.log(code, reason);
    });

    // Subscribe to session disconnection
    this.walletConnectProvider.on("error", (code: number, reason: string) => {
      console.error(code, reason);
    });

    //  Enable session (triggers QR Code modal)
    console.log("Connecting to wallet connect");
    let enabled = await this.walletConnectProvider.enable();
    console.log("CONNECTED to wallet connect", enabled, this.walletConnectProvider);
    
    this.accountAddress = await this.parseAccountAddress();

    console.log("account address is "+this.accountAddress);
    this.walletConnectWeb3 = new Web3(this.walletConnectProvider as any); // HACK
  }

  private async parseAccountAddress(){
    const accounts = await this.walletConnectWeb3.eth.getAccounts();
    console.log(accounts);
    return accounts[0];
  }

  public getAccountAddress(){
    return this.accountAddress;
  }

  public async disconnect(){
    if (this.walletConnectProvider) {
      console.log("Disconnecting from wallet connect");
      //await this.walletConnectProvider.disconnect();
      await (await this.walletConnectProvider.getWalletConnector()).killSession();
      console.log("Disconnected from wallet connect");
      this.walletConnectProvider = null;
      this.accountAddress = "";
    }
    else {
      console.log("Not connected to wallet connect");
    }
  }
}
