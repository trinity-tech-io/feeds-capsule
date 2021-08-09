import { Injectable } from '@angular/core';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { LogUtils } from 'src/app/services/LogUtils';
import { DataHelper } from 'src/app/services/DataHelper';
import { Events } from 'src/app/services/events.service';

import Web3 from 'web3';
import { Config } from './config';

@Injectable()
export class WalletConnectControllerService {
  private uri = Config.CONTRACT_URI;
  private rpc: any = Config.CONTRACT_RPC;
  // private infuraId: "0dd3ab5ca24946938c6d411a1637cc59";
  private accountAddress = '';
  private walletConnectProvider: WalletConnectProvider;
  private walletConnectWeb3: Web3;
  constructor(
    private logUtils: LogUtils,
    private dataHelper: DataHelper,
    private events: Events,
  ) {
    this.initWalletConnectProvider();
    this.disconnect();
  }

  public async connect() {
    return this.setupWalletConnectProvider();
  }

  public async initWalletConnectProvider() {
    //  Create WalletConnect Provider
    console.log("RPC", this.rpc);
    this.walletConnectProvider = new WalletConnectProvider({
      rpc: this.rpc,
      infuraId: '0dd3ab5ca24946938c6d411a1637cc59',
      bridge: 'https://walletconnect.elastos.net/v1',
      qrcodeModalOptions: {
        mobileLinks: ['metamask'],
      },
    });

    console.log('Connected?', this.walletConnectProvider.connected);
    // Subscribe to accounts change
    this.walletConnectProvider.on('accountsChanged', (accounts: string[]) => {
      console.log('accountsChanged', accounts);
    });

    // Subscribe to chainId change
    this.walletConnectProvider.on('chainChanged', (chainId: number) => {
      console.log('chainChanged', chainId);
    });

    // Subscribe to session disconnection
    this.walletConnectProvider.on(
      'disconnect',
      (code: number, reason: string) => {
        console.log('disconnect', code, reason);
      },
    );

    // Subscribe to session disconnection
    this.walletConnectProvider.on('error', (code: number, reason: string) => {
      console.error('error', code, reason);
    });

    console.log(this.accountAddress);
    if (this.accountAddress == '')
      this.anonymousInitWeb3();
  }

  private async setupWalletConnectProvider() {
    if (
      this.walletConnectProvider == null ||
      this.walletConnectProvider == undefined
    ) {
      await this.initWalletConnectProvider();
    }

    //  Enable session (triggers QR Code modal)
    console.log('Connecting to wallet connect');
    try {
      let enabled = await this.walletConnectProvider.enable();
      console.log(
        'CONNECTED to wallet connect',
        enabled,
        this.walletConnectProvider,
      );
      this.initWeb3();
    } catch (err) {
      //Work around
      this.destroyWalletConnect();
      console.log('CONNECT error to wallet connect', err);
    }
  }

  async initWeb3() {
    console.log('initWeb3');
    this.walletConnectWeb3 = new Web3(this.walletConnectProvider as any);
    this.accountAddress = await this.parseAccountAddress();
    this.dataHelper.saveWalletAccountAddress(this.accountAddress);

    this.events.publish(FeedsEvent.PublishType.walletConnected);
    this.events.publish(FeedsEvent.PublishType.walletConnectedRefreshPage);
    this.events.publish(FeedsEvent.PublishType.walletConnectedRefreshSM);

    return this.walletConnectWeb3;
  }

  public getWeb3() {
    return this.walletConnectWeb3;
  }

  private async parseAccountAddress() {
    const accounts = await this.walletConnectWeb3.eth.getAccounts();
    return accounts[0];
  }

  public getAccountAddress() {
    console.log('this.accountAddress = ' + this.accountAddress);
    return this.accountAddress;
  }

  public async disconnect() {
    if (this.walletConnectProvider) {
      console.log('Disconnecting from wallet connect');
      try {
        await this.walletConnectProvider.disconnect();
        // await (await this.walletConnectProvider.getWalletConnector()).killSession();
      } catch (error) {
        console.log('Disconnect wallet error', error);
      } finally {
        console.log('Disconnected from wallet connect');
        this.destroyWalletConnect();
      }
    } else {
      console.log('Not connected to wallet connect');
    }
  }

  destroyWalletConnect() {
    this.walletConnectProvider = null;
    this.accountAddress = '';
    this.walletConnectWeb3 = null;
    this.dataHelper.saveWalletAccountAddress(this.accountAddress);
    this.events.publish(FeedsEvent.PublishType.walletDisconnected);
    this.events.publish(FeedsEvent.PublishType.walletDisconnectedRefreshSM);
    this.events.publish(FeedsEvent.PublishType.walletDisconnectedRefreshPage);
  }

  anonymousInitWeb3() {
    if (this.walletConnectWeb3 != null && typeof this.walletConnectWeb3 !== 'undefined') {
      this.walletConnectWeb3 = new Web3(this.walletConnectWeb3.currentProvider);
    } else {
      this.walletConnectWeb3 = new Web3(
        new Web3.providers.HttpProvider(this.uri, { agent: {} }),
      );
      console.log('Web3 version is ' + this.walletConnectWeb3.version);
    }
  }

  setTestMode(mode: boolean) {
    if (mode) {
      this.rpc = Config.CONTRACT_TEST_RPC;
      this.uri = Config.CONTRACT_TEST_URI;
      return;
    }

    this.uri = Config.CONTRACT_URI;
    this.rpc = Config.CONTRACT_RPC;
  }
}
