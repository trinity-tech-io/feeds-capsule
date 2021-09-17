import { Injectable } from '@angular/core';
import { ScanService } from 'src/app/services/scan.service';
import { Logger } from './logger';
import { NgZone } from '@angular/core';
import { NativeService } from '../services/NativeService';
import { LanguageService } from 'src/app/services/language.service';
import { ThemeService } from './../services/theme.service';
import { DataHelper } from './../services/DataHelper';
import { CarrierService } from './CarrierService';
import { Events } from 'src/app/services/events.service';
import { TranslateService } from '@ngx-translate/core';
import { UtilService } from 'src/app/services/utilService';

let TAG: string = 'IntentService';
declare let intentManager: IntentPlugin.IntentManager;

@Injectable()
export class IntentService {
  constructor(private scanService: ScanService,
    private zone: NgZone,
    private native: NativeService,
    private languageService: LanguageService,
    public theme: ThemeService,
    private dataHelper: DataHelper,
    private carrierService: CarrierService,
    private events: Events,
    private translate: TranslateService) { }

  scanQRCode(): Promise<string> {
    return this.scanService.scanBarcode();
  }

  share(title: string, content: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      console.log(TAG, "Shared title is ", title, " &url is", content);
      try {
        let res = await intentManager.sendIntent('share', {
          title: this.translate.instant(title),
          url: content,
        });

        if (res) {
          resolve(res);
          return;
        }
        let error: string = 'Share error, result is ' + JSON.stringify(res);
        Logger.error(TAG, error);
        reject(error);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  private credaccess(params: any): Promise<any> {
    let url = 'https://did.elastos.net/credaccess';
    Logger.log(TAG, 'Call intent credaccess result is params', params, url);
    return intentManager.sendIntent(
      url,
      params,
    );
  }

  credaccessWithParams(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let params = {
        claims: {
          name: true,
          avatar: {
            required: false,
            reason: 'For profile picture',
          },
          email: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
          gender: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
          telephone: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
          nation: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
          nickname: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
          description: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
          interests: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
        },
      };

      try {
        let response = await this.credaccess(params);
        if (response && response.result && response.result.presentation) {
          let data = response.result;
          resolve(data);
          return;
        }
        let error = 'Credaccess error response is ' + JSON.stringify(response);
        Logger.error(TAG, error);
        reject(error);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  credaccessWithoutParams(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let params = {};

      try {
        let response = await this.credaccess(params);
        if (response && response.result && response.result.presentation) {
          let presentation = response.result.presentation;
          resolve(presentation);
          return;
        }
        let error = 'Credaccess error response is ' + JSON.stringify(response);
        Logger.error(TAG, error);
        reject(error);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  didtransaction(payload: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let params = {
        didrequest: JSON.parse(payload),
      };
      let url = 'https://did.elastos.net/didtransaction';
      try {
        Logger.log(TAG, 'Call intent didtransaction result is params', params, url);
        let response = await intentManager.sendIntent(
          url,
          params,
        );
        Logger.log(TAG, 'Call intent didtransaction result is ', response);
        if (response) {
          resolve(response);
          return;
        }

        let error =
          'DIDtransaction error response is ' + JSON.stringify(response);
        Logger.error(TAG, error);
        reject(error);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  credissue(
    did: string,
    serverName: string,
    serverDesc: string,
    elaAddress: string,
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let params = {
        identifier: 'credential', // unique identifier for this credential
        types: ['BasicProfileCredential'], // Additional credential types (strings) such as BasicProfileCredential.
        subjectdid: did, // DID targeted by the created credential. Only that did will be able to import the credential.
        properties: {
          name: serverName,
          description: serverDesc,
          elaAddress: elaAddress,
        },
        expirationdate: new Date(2024, 10, 10).toISOString(),
      };

      try {
        let response = await intentManager.sendIntent(
          'https://did.elastos.net/credissue',
          params,
        );
        if (response && response.result && response.result.credential) {
          let credential = response.result.credential;
          resolve(credential);
          return;
        }

        let error = 'Credissue error response is ' + JSON.stringify(response);
        Logger.error(TAG, error);
        reject(error);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  pay(receiver: string, amount: number, memo: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let params = {
        receiver: receiver,
        amount: amount,
        memo: memo,
      };

      try {
        let response = await intentManager.sendIntent(
          'https://wallet.elastos.net/pay',
          params,
        );
        if (response) {
          resolve(response);
          return;
        }

        let error = 'Pay error response is ' + JSON.stringify(response);
        Logger.error(TAG, error);
        reject(error);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  promptpublishdid(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let params = {};

      try {
        let response = await intentManager.sendIntent(
          'https://did.elastos.net/promptpublishdid',
          params,
        );
        if (response) {
          resolve(response);
          return;
        }

        let error = 'Pay error response is ' + JSON.stringify(response);
        Logger.error(TAG, error);
        reject(error);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  addIntentListener(callback: (intentResult: IntentPlugin.ReceivedIntent) => void) {
    intentManager.addIntentListener(callback);
  }

  async dispatchIntent(receivedIntent: IntentPlugin.ReceivedIntent) {
    console.log(TAG, "Intent received, now dispatching to listeners", receivedIntent);
    const action = receivedIntent.action;
    const params = receivedIntent.params
    switch (action) {
      case 'addsource':
        this.zone.run(async () => {
          this.native
            .getNavCtrl()
            .navigateForward([
              '/menu/servers/server-info',
              receivedIntent.params.source,
              '0',
              false,
            ]);
        });
        break;

      case 'https://feeds.trinity-feeds.app/feeds':
        let isDisclaimer =
          localStorage.getItem('org.elastos.dapp.feeds.disclaimer') || '';
        if (!isDisclaimer) {
          console.log(TAG, "Not disclaimer");
          this.native.setRootRouter('disclaimer');
          return;
        }

        const signinData = await this.dataHelper.getSigninData();
        if (!signinData) {
          console.log(TAG, "Not signin");
          this.native.setRootRouter(['/signin']);
          return;
        }
        console.log(TAG, "Intent params", params);

        const address = params.address;
        const channelId = params.channelId;
        const postId = params.postId || 0;

        const serverNodeId = await this.carrierService.getIdFromAddress(address, () => { });
        const serverList = await this.dataHelper.getServerList();
        const isContain = serverList.some(server => server.nodeId == serverNodeId);

        const nodeChannelId = this.dataHelper.getKey(serverNodeId, channelId, 0, 0,);
        const channel = this.dataHelper.getChannel(nodeChannelId);

        if (!isContain) {
          //https://feeds.trinity-feeds.app/feeds/?address=Km3wsaD9zMGnYW7otewZhZKpgXVnYZGms2ihiGrpsUhASNMx1ZKj&channelId=1&postId=1&channelName=xb2&ownerName=Wangran&channelDesc=xb2 live&serverDid=did:elastos:iZ6NDBjZQG8XM8d1jENWQ8HW1ojfdHPqW8&ownerDid=did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D
          const ownerName = decodeURIComponent(params.ownerName);
          const channelName = decodeURIComponent(params.channelName);
          const channelDesc = decodeURIComponent(params.channelDesc);
          const ownerDid = decodeURIComponent(params.ownerDid);
          const serverDid = decodeURIComponent(params.serverDid);
          const feeds = {
            description: channelDesc,
            did: serverDid,
            feedsAvatar: "assets/images/profile-2.svg",
            feedsUrlHash: "",
            followers: 0,
            name: channelName,
            nodeId: serverNodeId,
            ownerDid: ownerDid,
            ownerName: ownerName,
            url: 'feeds://' + serverDid + "/" + address + "/" + channelId
          }
          this.native.go('discoverfeedinfo', {
            params: feeds,
          });
          return;
        }

        const isSubscribed = channel.isSubscribed || false;

        if (isSubscribed && parseInt(postId) != 0) {
          this.native.getNavCtrl().navigateForward(['/postdetail', serverNodeId, channelId, postId]);
          return;
        }

        if (parseInt(channelId) != 0) {
          this.native.getNavCtrl().navigateForward(['/channels', serverNodeId, channelId]);
          return;
        }

        this.native.setRootRouter(['/tabs/home']);
        break;
    }
  }

  onMessageReceived(msg: IntentPlugin.ReceivedIntent) {
    Logger.log(TAG, 'Received intent ', msg);
    var params: any = msg.params;
    if (typeof params == 'string') {
      try {
        params = JSON.parse(params);
      } catch (e) {
      }
    }

    if (msg.action === 'currentLocaleChanged') {
      this.zone.run(() => {
        this.setCurLang(params.data);
      });
    }

    //TO be check
    if (
      msg.action === 'preferenceChanged' &&
      params.data.key === 'ui.darkmode'
    ) {
      this.zone.run(() => {
        this.theme.setTheme(params.data.value);
      });
    }
  }

  setCurLang(currentLang: string) {
    this.languageService.setCurLang(currentLang);
  }

  createShareLink(nodeId: string, channelId: number, postId: number): string {
    const server = this.dataHelper.getServer(nodeId);

    const address = server.carrierAddress;
    const serverDid = server.did;

    const key = this.dataHelper.getKey(nodeId, channelId, 0, 0);
    const channel = this.dataHelper.getChannel(key);

    const ownerName = channel.owner_name;
    const ownerDid = channel.owner_did;
    const channelName = channel.name;
    const channelDesc = channel.introduction;

    let url = "https://feeds.trinity-feeds.app/feeds/"
      + "?address=" + address
      + "&channelId=" + channelId
      + "&channelDesc=" + encodeURIComponent(channelDesc)
      + "&ownerName=" + encodeURIComponent(ownerName)
      + "&serverDid=" + encodeURIComponent(serverDid)
      + "&channelName=" + encodeURIComponent(channelName)
      + "&ownerDid=" + encodeURIComponent(ownerDid)
      + "&postId=" + postId

    console.log(TAG, "Shared link url is " + url);
    return url;
  }

  createSharePostTitle(nodeId: string, channelId: number, postId: number): string {
    const key = this.dataHelper.getKey(nodeId, channelId, postId, 0);
    const post = this.dataHelper.getPost(key);

    console.log("post.content", post.content);

    const content = post.content || '';
    let text: string = content.text || '';

    if (text.replace(/(^[\s\n\t]+|[\s\n\t]+$)/g, "") == '')
      return this.translate.instant("common.sharesharingPost");

    let brief: string = UtilService.briefText(text, 15);
    return brief + this.translate.instant("common.shareReadMore");
  }

  createShareChannelTitle(nodeId: string, channelId: number): string {
    const key = this.dataHelper.getKey(nodeId, channelId, 0, 0);
    const channel = this.dataHelper.getChannel(key);

    const channelName = channel.name || '';

    if (channelName != '')
      return this.translate.instant("common.shareSharingChannel1") + channelName + this.translate.instant("common.shareSharingChannel2");

    return this.translate.instant("common.shareSharingChannel");
  }
}
