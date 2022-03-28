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
  listPasarOrderFromService(pageNum: number, pageSize: number, orderState: FeedsData.OrderState, blockNumber: number,
    isAsc: boolean, endBlockNumber: number, sortType: FeedsData.SortType, safeMode: boolean): Promise<any> {
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

        if (endBlockNumber != null && endBlockNumber != undefined) {
          url = url + '&endBlockNumber=' + endBlockNumber;
        }

        if (sortType != null && sortType != undefined) {
          switch (sortType) {
            case FeedsData.SortType.PRICE_HIGHEST:
              url = url + '&sortType=price';
              break;
            case FeedsData.SortType.PRICE_CHEAPEST:
              url = url + '&sortType=price&sort=asc';
              break;
            case FeedsData.SortType.TIME_ORDER_LATEST:
              url = url + '&sortType=createTime';
              break;
            case FeedsData.SortType.TIME_ORDER_OLDEST:
              url = url + '&sortType=createTime&sort=asc';
              break;
            default:
              break;
          }
        }

        if (pageSize)
          url = url + '&pageSize=' + pageSize;
        if (orderState)
          url = url + '&orderState=' + orderState;

        if (safeMode)
          url = url + '&adult=false';


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

  //https://test.trinity-feeds.app/pasar/api/v1/searchSaleOrders?searchType=description&key=%E6%99%AF%20%E6%95%8F
  searchPasarOrder(searchType: FeedsData.SearchType, key: string, saveMode: boolean, sortType: FeedsData.SortType) {
    return new Promise(async (resolve, reject) => {
      try {
        let url = '';
        if (this.dataHelper.getDevelopNet() == 'MainNet')
          url = this.baseAssistUrl + 'pasar/api/v1/searchSaleOrders'
        else
          url = Config.PASAR_ASSIST_TESTNET_SERVER + 'searchSaleOrders'

        url = url + '?key=' + key;
        if (sortType != null && sortType != undefined) {
          switch (sortType) {
            case FeedsData.SortType.PRICE_HIGHEST:
              url = url + '&sortType=price';
              break;
            case FeedsData.SortType.PRICE_CHEAPEST:
              url = url + '&sortType=price&sort=asc';
              break;
            case FeedsData.SortType.TIME_ORDER_LATEST:
              url = url + '&sortType=createTime';
              break;
            case FeedsData.SortType.TIME_ORDER_OLDEST:
              url = url + '&sortType=createTime&sort=asc';
              break;
            default:
              break;
          }
        }
        switch (searchType) {
          case FeedsData.SearchType.NAME:
            url = url + '&searchType=name';
            break;
          case FeedsData.SearchType.ROYALTY_ADDRESS:
            url = url + '&searchType=royaltyAddress';
            break;
          case FeedsData.SearchType.OWNER_ADDRESS:
            url = url + '&searchType=ownerAddress';
            break;
          case FeedsData.SearchType.TOKEN_ID:
            url = url + '&searchType=tokenId';
            break;
          case FeedsData.SearchType.DESCRIPTION:
            url = url + '&searchType=description';
            break;
          default:
            break;
        }

        if (!saveMode) {
           url = url + '&adult=false';
        }
        const result = await this.httpService.httpGet(url);


        const resultCode = result.code;
        if (resultCode != 200)
          reject('Receive result response code is' + resultCode);

        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'Search Pasar Order From Service error', error);
        reject(error)
      }
    });
  }

  //contain sticker & pasar data
  queryOwnerCollectibles(ownerAddress: string) {
    return new Promise(async (resolve, reject) => {
      try {
        let url = '';
        if (this.dataHelper.getDevelopNet() == 'MainNet')
          url = this.baseAssistUrl + 'sticker/api/v1/query'
        else
          url = Config.BASE_PASAR_ASSIST_TESTNET_SERVER + 'sticker/api/v1/query'

        url = url + '?owner=' + ownerAddress;

        const result = await this.httpService.httpGet(url);

        const resultCode = result.code;
        if (resultCode != 200)
          reject('Receive result response code is' + resultCode);

        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'Query owner Collectibles From Service error', error);
        reject(error)
      }
    });
  }

  refreshPasarOrder(pageNum: number, pageSize: number, orderState: FeedsData.OrderState, blockNumber: number,
    isAsc: boolean, endBlockBumber: number, sortType: FeedsData.SortType, safeMode: boolean): Promise<Object> {
    return this.listPasarOrderFromService(pageNum, pageSize, orderState, blockNumber, isAsc, endBlockBumber, sortType, safeMode);
  }

  listOwnSticker(type: string) {
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

        url = url + '?owner=' + accountAddress + type;

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

  searchStickers(tokenId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let url = '';
        if (this.dataHelper.getDevelopNet() == 'MainNet')
          url = this.baseAssistUrl + 'sticker/api/v1/search'
        else
          url = Config.STICKER_ASSIST_TESTNET_SERVER + 'search'

        url = url + '?key=' + tokenId;
        const result = await this.httpService.httpGet(url);

        const resultCode = result.code;
        if (resultCode != 200)
          reject(null);

        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'search Stickers From Service error', error);
        reject(null)
      }
    });
  }

  /**
  *
  * @param pageNum 页码 从1开始 选填 默认1
  * @param pageSize 每页条目 大于0 选填 默认10
  */
  listGalleriaPanelsFromService(pageNum: number, pageSize: number): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let url = '';
        if (this.dataHelper.getDevelopNet() == 'MainNet')
          url = this.baseAssistUrl + 'galleria/api/v1/listPanels'
        else
          url = Config.GALLERIA_ASSIST_TESTNET_SERVER + 'listPanels'

        url = url + '?pageNum=' + pageNum;
        if (pageSize)
          url = url + '&pageSize=' + pageSize;

        const result = await this.httpService.httpGet(url) || null;
        if(result === null){
          reject(null);
          return;
        }
        const resultCode = result.code;
        if (resultCode != 200)
          reject(null);

        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'List Pasar Order From Service error', error);
        reject(null)
      }
    });
  }

  getPanel(tokenId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let url = '';
        if (this.dataHelper.getDevelopNet() == 'MainNet')
          url = this.baseAssistUrl + 'galleria/api/v1/getPanel'
        else
          url = Config.GALLERIA_ASSIST_TESTNET_SERVER + 'getPanel'

        url = url + '?tokenId=' + tokenId;
        const result = await this.httpService.httpGet(url);

        const resultCode = result.code;
        if (resultCode != 200)
          reject(null);

        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'getPanel From Service error', error);
        reject(null)
      }
    });
  }
}

