import { Injectable } from '@angular/core';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { DataHelper } from 'src/app/services/DataHelper';
import { Events } from 'src/app/services/events.service';

import Web3 from 'web3';
import { Config } from './config';
import { Logger } from './logger';

const TAG: string = 'WalletConnectController';
@Injectable()
export class WalletConnectControllerService {
  private uri = Config.CONTRACT_URI;
  private rpc: any = Config.CONTRACT_RPC;
  // private infuraId: "0dd3ab5ca24946938c6d411a1637cc59";
  private accountAddress = '';
  private walletConnectProvider: WalletConnectProvider;
  private walletConnectWeb3: Web3;
  constructor(
    private dataHelper: DataHelper,
    private events: Events,
  ) {
    // this.initWalletConnectProvider();
    // this.disconnect();
  }

  public async connect() {
    return this.setupWalletConnectProvider();
  }

  public async initWalletConnectProvider() {
    //  Create WalletConnect Provider
    Logger.log(TAG, "RPC", this.rpc);
    this.walletConnectProvider = new WalletConnectProvider({
      rpc: this.rpc,
      infuraId: '0dd3ab5ca24946938c6d411a1637cc59',
      bridge: 'https://walletconnect.elastos.net/v1',
      qrcodeModalOptions: {
        mobileLinks: ['metamask'],
      },
    });

    Logger.log(TAG, 'Connected?', this.walletConnectProvider.connected);
    // Subscribe to accounts change
    this.walletConnectProvider.on('accountsChanged', (accounts: string[]) => {
      Logger.log(TAG, 'accountsChanged', accounts);
    });

    // Subscribe to chainId change
    this.walletConnectProvider.on('chainChanged', (chainId: number) => {
      Logger.log(TAG, 'chainChanged', chainId);
    });

    // Subscribe to session disconnection
    this.walletConnectProvider.on(
      'disconnect',
      (code: number, reason: string) => {
        Logger.log(TAG, 'disconnect', code, reason);
      },
    );

    // Subscribe to session disconnection
    this.walletConnectProvider.on('error', (code: number, reason: string) => {
      Logger.error(TAG, 'error', code, reason);
    });

    Logger.log(TAG, 'Current account address is', this.accountAddress);
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
    Logger.log(TAG, 'Connecting to wallet connect');
    try {
      let enabled = await this.walletConnectProvider.enable();
      Logger.log(TAG,
        'CONNECTED to wallet connect',
        enabled,
        this.walletConnectProvider,
      );
      this.initWeb3();
    } catch (err) {
      //Work around
      this.destroyWalletConnect();
      Logger.log(TAG, 'CONNECT error to wallet connect', err);
    }
  }

  async initWeb3() {
    Logger.log(TAG, 'Init web3, walletConnet provider is', this.walletConnectProvider);
    this.walletConnectWeb3 = new Web3(this.walletConnectProvider as any);
    // this.accountAddress = await this.parseAccountAddress();
    // Logger.log(TAG, 'Account address', this.accountAddress);
    // this.dataHelper.saveWalletAccountAddress(this.accountAddress);

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
    return this.accountAddress;
  }

  public async disconnect() {
    if (this.walletConnectProvider) {
      Logger.log(TAG, 'Disconnecting from wallet connect');
      try {
        await this.walletConnectProvider.disconnect();
        // await (await this.walletConnectProvider.getWalletConnector()).killSession();
      } catch (error) {
        Logger.log(TAG, 'Disconnect wallet error', error);
      } finally {
        Logger.log(TAG, 'Disconnected from wallet connect');
        this.destroyWalletConnect();
      }
    } else {
      Logger.log(TAG, 'Not connected to wallet connect');
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
      Logger.log(TAG, 'Web3 version is ', this.walletConnectWeb3.version, ', uri is', this.uri);
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
