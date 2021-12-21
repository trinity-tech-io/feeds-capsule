import { Injectable } from '@angular/core';
import { Logger } from './logger';
import { Config } from './config';
import { HttpService } from 'src/app/services/HttpService';
import { DataHelper } from 'src/app/services/DataHelper';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { ApiUrl } from './ApiUrl';

const TAG: string = 'PasarAssistService';
@Injectable()
export class PasarAssistService {
  private baseAssistUrl = ApiUrl.ASSIST_SERVER;
  constructor(private httpService: HttpService,
    private dataHelper: DataHelper,
    private nftContractControllerService: NFTContractControllerService) {
  }

  setBaseAssistUrl(url: string) {
    this.baseAssistUrl = url;
  }

  getBaseAssistUrl() {
    return this.baseAssistUrl;
  }

  /**
   *
   * @param pageNum 页码 从1开始 选填 默认1
   * @param pageSize 每页条目 大于0 选填 默认10
   * @param orderState 订单类型： FeedsData.OrderState
   * @param blockNumber 返回本高度之后的数据 选填
   * @param isAsc sort排序方式: 默认按BlockNumber降序， 传 asc表示按BlockNumber升序
   */
  listPasarOrderFromService(pageNum: number, pageSize: number, orderState: FeedsData.OrderState, blockNumber: number, isAsc: boolean): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let url = '';
        if (this.dataHelper.getDevelopNet() == 'MainNet')
          url = this.baseAssistUrl + 'pasar/api/v1/listPasarOrder'
        else
          url = Config.PASAR_ASSIST_TESTNET_SERVER + 'listPasarOrder'

        url = url + '?pageNum=' + pageNum;
        if (blockNumber != null && blockNumber != undefined) {
          url = url + '&blockNumber=' + blockNumber;
        }

        if (pageSize)
          url = url + '&pageSize=' + pageSize;
        if (orderState)
          url = url + '&orderState=' + orderState;
        if (isAsc)
          url = url + '&sort=asc'

        const result = await this.httpService.httpGet(url);

        const resultCode = result.code;
        if (resultCode != 200)
          reject('Receive result response code is' + resultCode);

        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'List Pasar Order From Service error', error);
        reject(error)
      }
    });
  }

  refreshPasarOrder(pageNum: number, pageSize: number, orderState: FeedsData.OrderState, blockNumber: number): Promise<Object> {
    return this.listPasarOrderFromService(pageNum, pageSize, orderState, blockNumber, false);
  }

  syncPasarOrder(pageNum: number, pageSize: number, blockNumber: number): Promise<Object> {
    return this.listPasarOrderFromService(pageNum, pageSize, null, blockNumber, true);
  }

  syncOrder(blockNumber: number): Promise<any> {
    return this.listPasarOrderFromService(1, 50, null, blockNumber, true);
  }

  firstSync(blockNumber: number): Promise<any> {
    return this.listPasarOrderFromService(1, 50, FeedsData.OrderState.SALEING, blockNumber, true);
  }

  listOwnSticker() {
    return new Promise(async (resolve, reject) => {
      try {
        let url = '';
        if (this.dataHelper.getDevelopNet() == 'MainNet')
          url = this.baseAssistUrl + 'sticker/api/v1/query'
        else
          url = Config.BASE_PASAR_ASSIST_TESTNET_SERVER + 'sticker/api/v1/query'

        const accountAddress = this.nftContractControllerService.getAccountAddress();
        if (accountAddress == '') {
          const error = 'Account address is null';
          Logger.warn(TAG, error);
          reject(error);
          return;
        }

        url = url + '?owner=' + accountAddress;

        const result = await this.httpService.httpGet(url);

        const resultCode = result.code;
        if (resultCode != 200)
          reject('Receive result response code is' + resultCode);

        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'List own sticker From Service error', error);
        reject(error)
      }
    });
  }


  getDidFromAddress(address: string): Promise<FeedsData.DidObj> {
    // https://test.trinity-feeds.app/pasar/api/v1/getDidByAddress?address=0x6eCf29BB1A924396CbA252724a3F462753218B43
    return new Promise(async (resolve, reject) => {
      try {
        let url = '';
        if (this.dataHelper.getDevelopNet() == 'MainNet')
          url = this.baseAssistUrl + 'pasar/api/v1/getDidByAddress'
        else
          url = Config.BASE_PASAR_ASSIST_TESTNET_SERVER + 'pasar/api/v1/getDidByAddress'

        if (!address || address == '') {
          const error = 'Address is null';
          Logger.warn(TAG, error);
          reject(error);
          return;
        }

        url = url + '?address=' + address;

        const result = await this.httpService.httpGet(url);

        const resultCode = result.code;
        if (resultCode != 200)
          reject('Receive result response code is' + resultCode);

        const data = result.data;
        if (!data) {
          resolve(null);
          return;
        }

        const didObj = this.parseDidResult(data);
        if (!didObj) {
          const error = 'Did is null';
          Logger.error(TAG, 'Get did from assist error', error);
          reject(error);
        }
        resolve(didObj);
      } catch (error) {
        Logger.error(TAG, 'Get did from assist error', error);
        reject(error)
      }
    });
  }

  /*
  {
    "code": 200,
    "message": "success",
    "data": {
      "_id": "619799e2ed34d379379c9ee7",
      "address": "0x6eCf29BB1A924396CbA252724a3F462753218B43",
      "did": {
        "version": "1",
        "did": "did:elastos:imZgAo9W38Vzo1pJQfHp6NJp9LZsrnRPRr"
      }
    }
  }
  
   */
  parseDidResult(data: any): FeedsData.DidObj {
    if (!data || !data.did) {
      return null;
    }

    let didObj: FeedsData.DidObj = {
      version: data.did.version,
      did: data.did.did
    }

    return didObj;
  }
}
