import { Injectable } from '@angular/core';
import { Events } from 'src/app/services/events.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';
import { Logger } from './logger';
import { FileHelperService } from 'src/app/services/FileHelperService';
import { PasarAssistService } from 'src/app/services/pasar_assist.service';
import _ from 'lodash';
import { type } from 'os';

const TAG = 'NFTContractHelperService';
// export const enum SortType {
//   CREATE_TIME,
//   UPDATE_TIME,
// }

// export type ContractItem = {
//   saleOrderId: string,
//   tokenId: string,
//   asset: string,
//   name: string,
//   description: string,
//   fixedAmount: string,
//   kind: string,
//   type: string,
//   royalties: string,
//   quantity: string,
//   curQuantity:string,
//   thumbnail: string,
//   sellerAddr: string,
//   createTime: number,
//   saleStatus: string,
//   creator: string,
// }

// export type OpenOrderResult = {
//   tokenUri: string,
//   tokenId: string,
//   saleOrderId: string,
//   price: string,
//   tokenNum: string,
//   sellerAddr: string,
//   index: string,
//   createTime: number,
//   royalties: string,
//   creator: string,
// }

export type ChangedItem = {
}
@Injectable()
export class NFTContractHelperService {
  private refreshCount = 8;
  // private displayedPasarItemMap: { [orderId: string]: FeedsData.PasarItem } = {};
  private isSyncingFlags: boolean[] = [false];
  private isSyncingIndex: number = 0;
  private openOrder: FeedsData.OrderInfo[] = [];
  private isSyncing: boolean = false;
  private refreshManually: boolean = false;
  private refreshedCount: number = 0;
  private openOrderCount: number = Number.MAX_SAFE_INTEGER;
  constructor(
    private nftContractControllerService: NFTContractControllerService,
    private event: Events,
    private dataHelper: DataHelper,
    private ipfsService: IPFSService,
    private nftPersistenceHelper: NFTPersistenceHelper,
    private fileHelperService: FileHelperService,
    private pasarAssistService: PasarAssistService
  ) {
  }

  loadMoreData(saleStatus: string, sortType: FeedsData.SortType, startPage: number): Promise<FeedsData.NFTItem[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const list = await this.loadData(startPage, sortType);
        resolve(list);
      } catch (error) {
        Logger.error('Load more data error', error);
        reject(error);
      }
    });
  }

  // refreshPasarList(sortType: SortType): Promise<FeedsData.NFTItem[]> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       this.syncOpenOrder();
  //       const list = await this.loadData(0, sortType);
  //       resolve(list);
  //     } catch (error) {
  //       Logger.error('Refresh PasarList error', error);
  //       reject(error);
  //     }
  //   });
  // }

  // refreshPasarListWaitRefreshCount(sortType: SortType): Promise<FeedsData.NFTItem[]> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       this.syncOpenOrderForDisplay(async () => {
  //         const list = await this.loadData(0, sortType);
  //         resolve(list);
  //         return;
  //       });
  //     } catch (error) {
  //       Logger.error('Refresh PasarList error', error);
  //       reject(error);
  //     }
  //   });
  // }

  loadMoreDataFromContract(saleStatus: string, sortType: FeedsData.SortType, count: number, startPage: number): Promise<FeedsData.NFTItem[]> {
    return new Promise(async (resolve, reject) => {
      if (startPage * this.refreshCount >= count) {
        resolve([]);
        return;
      }

      const requestDevNet = this.dataHelper.getDevelopNet();
      let start = count - 1 - (startPage * this.refreshCount);
      let end = count - 1 - ((startPage + 1) * this.refreshCount);
      if (end < 0)
        end = -1;
      try {
        let list: FeedsData.NFTItem[] = [];
        for (let index = start - 1; index > end; index--) {
          const orderInfo = await this.getOpenOrderByIndex(index);
          const tokenInfo = await this.getTokenInfo(String(orderInfo.tokenId), true);
          const tokenJson = await this.getTokenJson(tokenInfo.tokenUri);
          const item = this.createItemFromOrderInfo(orderInfo, tokenInfo, tokenJson, saleStatus);
          this.dataHelper.updatePasarItem(String(orderInfo.orderId), item, index, 0, FeedsData.SyncMode.REFRESH, requestDevNet);
          list.push(item);
        }
        // this.nftPersistenceHelper.setPasarList(list);
        resolve(this.sortData(list, sortType));
      } catch (error) {
        reject(error);
      }
    });
  }

  loadData(startPage: number, sortType: FeedsData.SortType): Promise<FeedsData.NFTItem[]> {
    return new Promise(async (resolve, reject) => {
      try {
        let list: FeedsData.NFTItem[] = [];
        let pasarItemList: FeedsData.NFTItem[] = [];
        if (this.refreshManually) {
          // pasarItemList = this.dataHelper.getDisplayedPasarItemList() || [];
          const list: FeedsData.NFTItem[] = await this.loadMoreDataFromContract('onSale', sortType, this.openOrderCount, startPage);
          resolve(list);
          return;
        }

        pasarItemList = this.dataHelper.getPasarItemList() || [];
        pasarItemList = this.sortData(pasarItemList, sortType);
        const count = pasarItemList.length || 0;
        const start = startPage * this.refreshCount;
        const end = (startPage + 1) * this.refreshCount;

        if (count <= start) {
          resolve(list);
          return;
        }

        if (count > end) {
          list = pasarItemList.slice(start, end);
          resolve(list);
          return;
        }

        list = pasarItemList.slice(start, count);
        resolve(list);

      } catch (error) {
        reject(error);
      }
    });
  }

  refreshPasarListFromContract(saleStatus: string, sortType: FeedsData.SortType, openOrderCountCallback: (openOrderCount: number) => void, callback: (changedItem: ChangedItem) => void): Promise<FeedsData.NFTItem[]> {
    return new Promise(async (resolve, reject) => {
      try {
        this.refreshManually = true;
        let count = await this.nftContractControllerService.getPasar().getOpenOrderCount() || 0;
        this.openOrderCount = count;
        openOrderCountCallback(count);

        if (!count || count == 0) {
          resolve([]);
          return;
        }

        const requestDevNet = this.dataHelper.getDevelopNet();
        let list: FeedsData.NFTItem[] = [];
        for (let index = count - 1; index >= count - 1 - this.refreshCount; index--) {
          const orderInfo = await this.getOpenOrderByIndex(index);
          const tokenInfo = await this.getTokenInfo(String(orderInfo.tokenId), true);
          const tokenJson = await this.getTokenJson(tokenInfo.tokenUri);
          const item: FeedsData.NFTItem = this.createItemFromOrderInfo(orderInfo, tokenInfo, tokenJson, saleStatus);

          this.dataHelper.updatePasarItem(String(orderInfo.orderId), item, index, 0, FeedsData.SyncMode.APP, requestDevNet);
          // let openOrderResult = await this.getOpenOrderResultByIndex(index);
          // let contractItem = await this.handleFeedsUrl(openOrderResult, saleStatus);
          list.push(item);
        }
        resolve(this.sortData(list, sortType));
      } catch (error) {
        reject(error);
      }
    });
  }

  refreshPasarListFromAssist(sortType: FeedsData.SortType): Promise<FeedsData.NFTItem[]> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.refreshPasarOrderFromAssist(1);
        const list = await this.loadData(0, sortType);
        resolve(this.sortData(list, sortType));
      } catch (error) {
        reject(error);
      }
    });
  }

  loadMorePasarListFromAssist(sortType: FeedsData.SortType, startPage: number): Promise<FeedsData.NFTItem[]> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.loadMorePasarOrderFromAssist(startPage);
        const list = await this.loadData(startPage, sortType);
        resolve(this.sortData(list, sortType));
      } catch (error) {
        reject(error);
      }
    });
  }

  sortData(list: FeedsData.NFTItem[], sortType: FeedsData.SortType): FeedsData.NFTItem[] {
    return _.sortBy(list, (item: FeedsData.NFTItem) => {
      switch (sortType) {
        case FeedsData.SortType.TIME_ORDER_LATEST:
          return -Number(item.orderCreateTime);
        case FeedsData.SortType.TIME_ORDER_OLDEST:
          return Number(item.orderCreateTime);
        case FeedsData.SortType.PRICE_HIGHEST:
          return -Number(item.fixedAmount);
        case FeedsData.SortType.PRICE_CHEAPEST:
          return Number(item.fixedAmount);
        default:
          break;
      }
    });
  }

  refreshPasarOrderFromAssist(pageNumber: number): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const requestCancelDevNet = this.dataHelper.getDevelopNet();
        const canceledResult = await this.pasarAssistService.refreshPasarOrder(pageNumber, 8, FeedsData.OrderState.CANCELED, null);
        this.parseAssistResult(canceledResult, FeedsData.SyncMode.REFRESH, requestCancelDevNet);

        const requestFilledDevNet = this.dataHelper.getDevelopNet();
        const filledResult = await this.pasarAssistService.refreshPasarOrder(pageNumber, 8, FeedsData.OrderState.SOLD, null);
        this.parseAssistResult(filledResult, FeedsData.SyncMode.REFRESH, requestFilledDevNet);

        const requestDevNet = this.dataHelper.getDevelopNet();
        const result = await this.pasarAssistService.refreshPasarOrder(pageNumber, 8, FeedsData.OrderState.SALEING, null);
        let refreshBlockNum = this.parseAssistResult(result, FeedsData.SyncMode.REFRESH, requestDevNet);

        this.dataHelper.setRefreshLastBlockNumber(refreshBlockNum);
        resolve('FINISH');
      } catch (error) {
        reject(error);
      }
    });
  }

  loadMorePasarOrderFromAssist(pageNumber: number): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const lastBlockNumber = this.dataHelper.getLastPasarBlockNum();
        const refreshLastBlockNumber = this.dataHelper.getRefreshLastBlockNumber();
        if (lastBlockNumber < refreshLastBlockNumber)
          await this.refreshPasarOrderFromAssist(pageNumber);

        resolve('FINISH');
      } catch (error) {
        reject(error);
      }
    });
  }

  // getOpenOrderResultByIndex(index: any): Promise<OpenOrderResult> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       let openOrder = await this.nftContractControllerService
  //         .getPasar()
  //         .getOpenOrderByIndex(index);
  //       let tokenId = openOrder[3];
  //       let saleOrderId = openOrder[0];
  //       let tokenNum = openOrder[4];
  //       let price = openOrder[5];
  //       let sellerAddr = openOrder[7];

  //       let tokenInfo = await this.nftContractControllerService
  //         .getSticker()
  //         .tokenInfo(tokenId);
  //       let creator = tokenInfo[4];//原创者
  //       let tokenUri = tokenInfo[3];
  //       let royalties = tokenInfo[5] || null;
  //       let createTime = Number.parseInt(tokenInfo[7]);

  //       let result: OpenOrderResult = {
  //         tokenUri,
  //         tokenId,
  //         saleOrderId,
  //         price,
  //         tokenNum,
  //         sellerAddr,
  //         index,
  //         createTime,
  //         royalties,
  //         creator,
  //       }
  //       resolve(result);
  //     } catch (err) {
  //       reject(err);
  //     }
  //   });
  // }

  // handleFeedsUrl(openOrderResult: OpenOrderResult, saleStatus: string): Promise<ContractItem> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       let feedsUri = openOrderResult.tokenUri;
  //       feedsUri = feedsUri.replace('feeds:json:', '');
  //       let result = await this.ipfsService.nftGet(this.ipfsService.getNFTGetUrl() + feedsUri);

  //       let thumbnail = result['thumbnail'] || '';
  //       if (thumbnail === '') {
  //         thumbnail = result['image'];
  //       }

  //       let item: ContractItem = {
  //         saleOrderId: openOrderResult.saleOrderId,
  //         tokenId: openOrderResult.tokenId,
  //         asset: result['image'],
  //         name: result['name'],
  //         description: result['description'],
  //         fixedAmount: openOrderResult.price,
  //         kind: result['kind'],
  //         type: result['type'] || 'single',
  //         royalties: openOrderResult.royalties,
  //         quantity: openOrderResult.tokenNum,
  //         curQuantity: openOrderResult.tokenNum,
  //         thumbnail: thumbnail,
  //         sellerAddr: openOrderResult.sellerAddr,
  //         createTime: openOrderResult.createTime * 1000,
  //         saleStatus: saleStatus,
  //         creator: openOrderResult.creator
  //       }
  //       resolve(item);
  //     } catch (err) {
  //       reject(err);
  //     }
  //   });
  // }

  getOrderInfo(orderId: string): Promise<FeedsData.OrderInfo> {
    return new Promise(async (resolve, reject) => {
      try {
        let order = await this.nftContractControllerService
          .getPasar()
          .getOrderById(orderId);
        let orderInfo = this.transOrderInfo(order);
        Logger.log("Get order from contract", order);
        resolve(orderInfo);
      } catch (error) {
        reject(error);
      }
    });
  }

  getTokenInfo(tokenId: string, forceRemote: boolean): Promise<FeedsData.TokenInfo> {
    return new Promise(async (resolve, reject) => {
      try {
        if (forceRemote) {
          let tokenInfo = await this.getTokenInfoFromContract(tokenId);
          resolve(tokenInfo);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  getTokenInfoFromContract(tokenId: string): Promise<FeedsData.TokenInfo> {
    return new Promise(async (resolve, reject) => {
      try {
        let token = await this.nftContractControllerService
          .getSticker()
          .tokenInfo(tokenId);
        let tokenInfo = this.transTokenInfo(token);
        Logger.log("Get token info", tokenInfo);
        resolve(tokenInfo);
      } catch (error) {
        reject(error);
      }
    });
  }

  getOpenOrderByIndex(index: number): Promise<FeedsData.OrderInfo> {
    return new Promise(async (resolve, reject) => {
      try {
        const openOrder = await this.nftContractControllerService
          .getPasar()
          .getOpenOrderByIndex(index);
        const order: FeedsData.OrderInfo = this.transOrderInfo(openOrder);
        resolve(order);
      } catch (error) {
        Logger.error('Get open order by index error', error);
        reject(error);
      }
    });
  }

  getTokenIdOfOwnerByIndex(address: string, index: number): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        const tokenId: number = await this.nftContractControllerService
          .getSticker()
          .tokenIdOfOwnerByIndex(address, index);
        resolve(tokenId);
      } catch (error) {
        Logger.error('Get tokenId of Owner by index error.', error);
        reject(error);
      }
    });
  }

  assembleOrderTokenJsonInfo(orderInfo: FeedsData.OrderInfo, tokenInfo: FeedsData.TokenInfo, tokenJson: FeedsData.TokenJson): Promise<FeedsData.OrderTokenJsonInfo> {
    return new Promise(async (resolve, reject) => {
      try {
        const orderTokenJson: FeedsData.OrderTokenJsonInfo = {
          orderInfo: orderInfo,
          tokenInfo: tokenInfo,
          tokenJson: tokenJson
        }
        resolve(orderTokenJson);
      } catch (error) {
        reject(error);
      }
    });
  }

  transOrderInfo(order: any): FeedsData.OrderInfo {
    const orderInfo: FeedsData.OrderInfo = {
      orderId: order[0],
      orderType: order[1],
      orderState: order[2],
      tokenId: order[3],
      amount: order[4],
      price: order[5],
      endTime: order[6],
      sellerAddr: order[7],
      buyerAddr: order[8],
      bids: order[9],
      lastBidder: order[10],
      lastBid: order[11],
      filled: order[12],
      royaltyOwner: order[13],
      royaltyFee: order[14],
      createTime: order[15],
      updateTime: order[16]
    }
    return orderInfo;
  }

  transTokenInfo(token: any): FeedsData.TokenInfo {
    const tokenInfo: FeedsData.TokenInfo = {
      tokenId: token[0],
      tokenIndex: token[1],
      tokenSupply: token[2],
      tokenUri: token[3],
      royaltyOwner: token[4],
      royaltyFee: token[5],
      createTime: token[6],
      updateTime: token[7]
    }
    return tokenInfo;
  }

  transTokenJson(httpResult: any): FeedsData.TokenJson {
    const tokenJson: FeedsData.TokenJson = {
      description: httpResult.description,
      image: httpResult.image,
      kind: httpResult.kind,
      name: httpResult.name,
      size: httpResult.size,
      thumbnail: httpResult.thumbnail,
      type: httpResult.type,
      version: httpResult.version
    }
    return tokenJson;
  }

  parseTokenUri(tokenUri: string): string {
    if (!tokenUri.startsWith('feeds:json:'))
      return tokenUri;
    return tokenUri.replace('feeds:json:', '');
  }

  parseTokenImageUri(tokenImgUri: string) {
    const uri = tokenImgUri.replace("feeds:imgage", "");
    const finaluri = uri.replace("feeds:image", "");
    return finaluri;
  }

  getTokenJsonFromIpfs(uri: string): Promise<FeedsData.TokenJson> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.ipfsService
          .nftGet(this.ipfsService.getNFTGetUrl() + uri);
        const tokenJson = this.transTokenJson(result);
        Logger.log("Get token Json from IPFS", tokenJson);

        await this.fileHelperService.writeTokenJsonFileData(uri, JSON.stringify(tokenJson));
        resolve(tokenJson);
      } catch (error) {
        Logger.log("Get Token Json from IPFS error", error);
        reject(error);
      }
    });
  }

  getTokenJson(tokenUri: string): Promise<FeedsData.TokenJson> {
    return new Promise(async (resolve, reject) => {
      try {
        //tokenUri: feeds:json:xxx
        const uri = this.parseTokenUri(tokenUri);
        let tokenJson = await this.fileHelperService.getTokenJsonData(uri);
        if (!tokenJson) {
          tokenJson = await this.getTokenJsonFromIpfs(uri);
        }

        resolve(tokenJson);
      } catch (error) {
        Logger.error('Get Token Json error', error);
        reject(error);
      }
    });
  }

  getSellerOpenByIndex(sellerAddr: string, index: number): Promise<FeedsData.OrderInfo> {
    return new Promise(async (resolve, reject) => {
      try {
        let sellerOrder = await this.nftContractControllerService
          .getPasar()
          .getSellerOpenByIndex(sellerAddr, index);
        let orderInfo = this.transOrderInfo(sellerOrder);
        Logger.log(TAG, "Get seller open order", orderInfo);
        resolve(orderInfo);
      } catch (error) {
        Logger.error("Get seller open order error", error);
        reject(error);
      }
    });
  }

  getNotSaleTokenCount(accountAddress: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        const notSaleOrderCount: string = await this.nftContractControllerService
          .getSticker()
          .tokenCountOfOwner(accountAddress);
        const count = parseInt(notSaleOrderCount);
        Logger.log(TAG, 'Get owner token count', count);
        resolve(count);
      } catch (error) {
        Logger.error(TAG, 'Get owner token count error.', error);
        reject(error);
      }
    });
  }

  getSaleOrderCount(accountAddress: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        const sellerInfo = await this.nftContractControllerService
          .getPasar()
          .getSellerByAddr(accountAddress);
        const orderCount = sellerInfo[3];
        const count = parseInt(orderCount);
        Logger.log(TAG, 'Get seller order count', count);
        resolve(count);
      } catch (error) {
        Logger.error(TAG, 'Get seller order count error.', error);
        reject(error);
      }
    });
  }

  syncTokenInfo(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const tokenSupply = await this.nftContractControllerService.getSticker().totalSupply();
        for (let index = 0; index < tokenSupply; index++) {
          const tokenIdAndJson = await this.getTokenJsonFromTokenIndex(index);

          const tokenId = tokenIdAndJson.tokenId;
          const tokenJson = tokenIdAndJson.tokenJson;
          //TODO
        }
      } catch (error) {
        Logger.error(TAG, 'Sync token info error.', error);
        reject(error);
      }
    });
  }

  getTokenJsonFromTokenIndex(index: number): Promise<FeedsData.TokenIdAndTokenJson> {
    return new Promise(async (resolve, reject) => {
      try {
        const tokenId = await this.nftContractControllerService.getSticker().tokenIdByIndex(String(index));
        const tokenJson = await this.getTokenJsonFromTokenId(tokenId);
        resolve({ tokenId: tokenId, tokenJson: tokenJson });
      } catch (error) {
        Logger.error('Get Token Json From Token index', error);
        reject(error);
      }
    });
  }

  getTokenJsonFromTokenId(tokenId: string): Promise<FeedsData.TokenJson> {
    return new Promise(async (resolve, reject) => {
      try {
        const tokenInfo = await this.getTokenInfo(tokenId, true);
        const tokenJson = await this.getTokenJson(tokenInfo.tokenUri);
        resolve(tokenJson);
      } catch (error) {
        Logger.error('Get Token Json From TokenId', error);
        reject(error);
      }
    });
  }

  interruptSyncing() {
    this.isSyncingFlags[this.isSyncingIndex] = false;
  }

  syncOpenOrderFromAssist() {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.isSyncing == true) {
          resolve('FINISH');
          return;
        }
        this.isSyncing = true;

        const lastBlockNumber = this.dataHelper.getLastPasarBlockNum();
        const newBlockNumber = await this.doSyncOpenOrderFromAssist(lastBlockNumber);

        this.dataHelper.setFirstSyncOrderStatus(true);
        this.dataHelper.setRefreshLastBlockNumber(newBlockNumber);
        resolve('FINISH');
      } catch (error) {
        Logger.error('Sync open order', error);
        reject(error);
      } finally {
        this.isSyncing = false;
      }
    });
  }

  doSyncOpenOrderFromAssist(lastBlockNumber: number): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        let curBlockNum = lastBlockNumber;
        let result = null;
        const requestDevNet = this.dataHelper.getDevelopNet();
        if (this.dataHelper.getFirstSyncOrderStatus())
          result = await this.pasarAssistService.syncOrder(curBlockNum);
        else
          result = await this.pasarAssistService.firstSync(curBlockNum);

        if (!result) {
          reject('Result is null');
          return;
        }

        if (requestDevNet != this.dataHelper.getDevelopNet()) {
          reject('Net diffrent');
          return;
        }

        curBlockNum = this.parseAssistResult(result, FeedsData.SyncMode.SYNC, requestDevNet);

        if (curBlockNum == lastBlockNumber) {
          resolve(curBlockNum);
          return;
        }

        const newBlockNum = await this.doSyncOpenOrderFromAssist(curBlockNum);

        if (newBlockNum == curBlockNum) {
          resolve(newBlockNum);
          return;
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  syncOpenOrder(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.isSyncing == true) {
          resolve('FINISH');
          return;
        }
        this.isSyncing = true;
        const openOrderCount = await this.nftContractControllerService.getPasar().getOpenOrderCount();
        for (let index = openOrderCount - 1; index >= 0; index--) {
          this.assemblyPasarItem(index);
        }
        resolve('FINISH');
      } catch (error) {
        Logger.error('Sync open order', error);
        reject(error);
      } finally {
        this.isSyncing = false;
      }
    });
  }

  parseAssistResult(result: any, syncMode: FeedsData.SyncMode, requestDevNet: string): number {
    let curBlockNum = 0;
    let array = result.data.result;
    for (let index = 0; index < array.length; index++) {
      const item = array[index];

      if (item.orderState == FeedsData.OrderState.CANCELED || item.orderState == FeedsData.OrderState.SOLD) {
        this.dataHelper.deletePasarItem(item.orderId);
      } else {
        const pasarItem = this.createItemFromPasarAssist(item, 'onSale', 'buy', syncMode);
        this.savePasarItem(String(pasarItem.item.saleOrderId), pasarItem.item, 0, item.blockNumber, syncMode, requestDevNet);
      }

      if (curBlockNum < item.blockNumber)
        curBlockNum = item.blockNumber;
    }
    return curBlockNum;
  }

  checkSyncMode(orderId: string): boolean {
    const originPasarItem = this.dataHelper.getPasarItem(orderId);
    if (!originPasarItem) {
      return false;
    }

    if (originPasarItem.syncMode == FeedsData.SyncMode.SYNC) {
      return true;
    }

    return false;
  }

  transPasarItemFromAssistPasar(result: Object) {
  }

  async assemblyPasarItem(index: number): Promise<FeedsData.NFTItem> {
    return new Promise(async (resolve, reject) => {
      try {
        const requestDevNet = this.dataHelper.getDevelopNet();
        const orderInfo = await this.getOpenOrderByIndex(index);
        const tokenInfo = await this.getTokenInfo(String(orderInfo.tokenId), true);
        const tokenJson = await this.getTokenJson(tokenInfo.tokenUri);
        const item = this.createItemFromOrderInfo(orderInfo, tokenInfo, tokenJson, "onSale");
        if (orderInfo.orderState == FeedsData.OrderState.SALEING) {
          this.savePasarItem(String(orderInfo.orderId), item, index, Number.MAX_SAFE_INTEGER, FeedsData.SyncMode.NONE, requestDevNet);
        }
        resolve(item);
      } catch (error) {
        Logger.error(TAG, 'AssemblyPasarItem error', error);
        reject(error);
      }
    });
  }

  // async getNFTItemFromContract(tokenId: string): Promise<FeedsData.NFTItem> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const requestDevNet = this.dataHelper.getDevelopNet();

  //       // const orderInfo = await this.getOpenOrderByIndex(index);
  //       const tokenInfo = await this.getTokenInfo(tokenId, true);
  //       const tokenJson = await this.getTokenJson(tokenInfo.tokenUri);
  //       const orderInfo = await this.getOrderInfo();
  //       const item = this.createItemFromOrderInfo(orderInfo, tokenInfo, tokenJson, "onSale");
  //       if (orderInfo.orderState == FeedsData.OrderState.SALEING) {
  //         this.savePasarItem(String(orderInfo.orderId), item, index, Number.MAX_SAFE_INTEGER, FeedsData.SyncMode.NONE, requestDevNet);
  //       }
  //       resolve(item);
  //     } catch (error) {
  //       Logger.error(TAG, 'AssemblyPasarItem error', error);
  //       reject(error);
  //     }
  //   });
  // }

  // syncOpenOrderForDisplay(callback: (count: number, openOrderCount: number) => void): Promise<string> {
  //   this.interruptSyncing();
  //   this.isSyncingIndex = this.isSyncingIndex + 1;
  //   const isSyncingIndex = this.isSyncingIndex;
  //   // this.isSyncingIndex = this.isSyncingIndex + 1;
  //   // const curSyncingIndex = this.isSyncingIndex;
  //   this.isSyncingFlags[isSyncingIndex] = true;
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       let syncCount = 0;
  //       let isCallbacked = false;
  //       this.prepareRefresh();

  //       const openOrderCount = await this.nftContractControllerService.getPasar().getOpenOrderCount();
  //       for (let index = openOrderCount - 1; index >= 0; index--) {
  //         const orderInfo = await this.getOpenOrderByIndex(index);
  //         const tokenInfo = await this.getTokenInfo(String(orderInfo.tokenId), true);
  //         const tokenJson = await this.getTokenJson(tokenInfo.tokenUri);
  //         if (orderInfo.orderState == FeedsData.OrderState.SALEING) {
  //           const item = this.createItemFromOrderInfo(orderInfo, tokenInfo, tokenJson, "onSale");
  //           if (!this.isSyncingFlags[isSyncingIndex]) {
  //             break;
  //           }
  //           syncCount = syncCount + 1;
  //           this.refreshedCount = syncCount;
  //           this.dataHelper.addDisplayedPasarItem(index, String(orderInfo.orderId), item);
  //           if (!isCallbacked && syncCount > this.refreshCount) {
  //             isCallbacked = true;
  //             callback(syncCount, openOrderCount);
  //           }
  //         }
  //       }
  //       this.setPasarItemMap();
  //       resolve('FINISH');
  //     } catch (error) {
  //       Logger.error('Sync open order', error);
  //       reject(error);
  //     } finally {

  //     }
  //   });
  // }

  /**
   *
   * @param orderInfo
   * @param tokenInfo
   * @param tokenJson
   * @param moreMenuType "onSale"/"created"
   */
  createItem(orderInfo: FeedsData.OrderInfo, tokenInfo: FeedsData.TokenInfo,
    tokenJson: FeedsData.TokenJson, moreMenuType: string, showType: string = 'buy'): FeedsData.NFTItem {

    let createAddress: string = "";
    let orderId: string = "-1";
    let tokenId: string = "-1";
    let image: string = "";
    let name: string = "";
    let description: string = "";
    let price: string = "0";
    let kind: string = "";
    let type: string = "";
    let royalties: string = "0";
    let quantity: number = 0;
    let curQuantity: number = 0;
    let thumbnail: string = "";
    let sellerAddr: string = "";
    let createTime: number = 0;

    let amount = 0;
    let bids = "0";
    let buyerAddr = "0x0000000000000000000000000000000000000000";
    let endTime = 0;
    let filled = 0;
    let lastBid = "0";
    let lastBidder = "0x0000000000000000000000000000000000000000";
    let orderState = 0;
    let orderType = 0;
    let orderCreateTime = 0;
    let orderUpdateTime = 0;
    let tokenCreateTime = 0;
    let tokenUpdateTime = 0

    if (orderInfo != null) {
      sellerAddr = orderInfo.sellerAddr;
      tokenId = orderInfo.tokenId;
      orderId = orderInfo.orderId;
      price = orderInfo.price;
      curQuantity = orderInfo.amount;

      amount = orderInfo.amount;
      bids = orderInfo.bids;
      buyerAddr = orderInfo.buyerAddr;
      endTime = orderInfo.endTime;
      filled = orderInfo.filled;
      lastBid = orderInfo.lastBid;
      lastBidder = orderInfo.lastBidder;
      orderState = orderInfo.orderState;
      orderType = orderInfo.orderType;
      orderCreateTime = orderInfo.createTime;
      orderUpdateTime = orderInfo.updateTime;

    } else {
      tokenId = tokenInfo.tokenId;

      sellerAddr = "";
      curQuantity = 1;
      price = null;
      orderId = null;
    }

    tokenCreateTime = tokenInfo.createTime;
    tokenUpdateTime = tokenInfo.updateTime;

    createAddress = tokenInfo.royaltyOwner;
    createTime = tokenInfo.createTime * 1000;
    quantity = tokenInfo.tokenSupply;
    royalties = tokenInfo.royaltyFee;

    type = tokenJson.type || 'single';
    thumbnail = tokenJson.thumbnail || '';
    if (thumbnail === '')
      thumbnail = tokenJson.image;
    image = tokenJson.image;
    name = tokenJson.name;
    description = tokenJson.description;
    kind = tokenJson.kind;

    const item: FeedsData.NFTItem = {
      creator: createAddress,
      saleOrderId: orderId,
      tokenId: tokenId,
      asset: image,
      name: name,
      description: description,
      fixedAmount: price,
      kind: kind,
      type: type,
      royalties: royalties,
      quantity: quantity,
      curQuantity: curQuantity,
      thumbnail: thumbnail,
      sellerAddr: sellerAddr,
      // createTime: createTime,

      amount: amount,
      bids: bids,
      buyerAddr: buyerAddr,
      endTime: endTime,
      filled: filled,
      lastBid: lastBid,
      lastBidder: lastBidder,
      orderState: orderState,
      orderType: orderType,
      orderCreateTime: orderCreateTime,
      orderUpdateTime: orderUpdateTime,
      tokenCreateTime: tokenCreateTime,
      tokenUpdateTime: tokenUpdateTime,

      moreMenuType: moreMenuType,
      showType: showType

    }
    return item;
  }

  createItemFromOrderInfo(orderInfo: FeedsData.OrderInfo, tokenInfo: FeedsData.TokenInfo,
    tokenJson: FeedsData.TokenJson, moreMenuType: string): FeedsData.NFTItem {
    return this.createItem(orderInfo, tokenInfo, tokenJson, moreMenuType);
  }

  creteItemFormTokenId(tokenInfo: FeedsData.TokenInfo, tokenJson: FeedsData.TokenJson,
    moreMenuType: string): FeedsData.NFTItem {
    return this.createItem(null, tokenInfo, tokenJson, moreMenuType);
  }

  getSellerCollectibleFromContract(sellerAddr: string, index: number): Promise<FeedsData.NFTItem> {
    return new Promise(async (resolve, reject) => {
      try {
        const orderInfo: FeedsData.OrderInfo = await this.getSellerOpenByIndex(sellerAddr, index);
        let tokenInfo = await this.getTokenInfo(String(orderInfo.tokenId), true);
        let tokenJson = await this.getTokenJson(tokenInfo.tokenUri);
        const item = this.createItemFromOrderInfo(orderInfo, tokenInfo, tokenJson, "onSale");
        resolve(item);
      } catch (error) {
        Logger.error("Get seller collectibles error", error);
        reject(error);
      }
    });
  }

  getSellerNFTItembyIndexFromContract(index: number): Promise<FeedsData.NFTItem> {
    return new Promise(async (resolve, reject) => {
      try {
        const orderInfo: FeedsData.OrderInfo = await this.getSellerOrderByIndex(index);
        let tokenInfo: FeedsData.TokenInfo = await this.getTokenInfo(String(orderInfo.tokenId), true);
        let tokenJson: FeedsData.TokenJson = await this.getTokenJson(tokenInfo.tokenUri);
        const item = this.createItemFromOrderInfo(orderInfo, tokenInfo, tokenJson, "onSale");
        const requestDevNet = this.dataHelper.getDevelopNet();
        if (orderInfo.orderState == FeedsData.OrderState.SALEING) {
          this.savePasarItem(String(orderInfo.orderId), item, index, Number.MAX_SAFE_INTEGER, FeedsData.SyncMode.NONE, requestDevNet);
        }
        resolve(item);
      } catch (error) {
        Logger.error("Get seller collectibles error", error);
        reject(error);
      }
    });
  }

  getSellerOrderByIndex(index: number): Promise<FeedsData.OrderInfo> {
    return new Promise(async (resolve, reject) => {
      try {
        let sellerOrder = await this.nftContractControllerService
          .getPasar()
          .getSellerOrderByIndex(index);
        let orderInfo = this.transOrderInfo(sellerOrder);
        Logger.log(TAG, "Get seller open order", orderInfo);
        resolve(orderInfo);
      } catch (error) {
        Logger.error("Get seller open order error", error);
        reject(error);
      }
    });
  }

  async getNotSellerCollectiblesFromContract(accAddress: string, index: number): Promise<FeedsData.NFTItem> {
    return new Promise(async (resolve, reject) => {
      try {
        const tokenId = await this.getTokenIdOfOwnerByIndex(accAddress, index);
        const tokenInfo = await this.getTokenInfo(String(tokenId), true);
        const tokenJson = await this.getTokenJson(tokenInfo.tokenUri);
        const item = this.creteItemFormTokenId(tokenInfo, tokenJson, "created");
        resolve(item);
      } catch (error) {
        Logger.error("Get seller collectibles error", error);
        reject(error);
      }
    });
  }

  savePasarItem(orderId: string, item: FeedsData.NFTItem, index: number, blockNum: number, syncMode: FeedsData.SyncMode, requestDevNet: string) {
    this.dataHelper.updatePasarItem(orderId, item, index, blockNum, syncMode, requestDevNet);
  }

  // setPasarItemMap() {
  //   this.dataHelper.storeDisplayedPasarMapToPasarMap();
  // }

  checkOpenOrderChange(orderInfo: FeedsData.OrderInfo, index: number): boolean {
    const realPasarItem = this.dataHelper.getPasarItem(String(orderInfo.orderId));
    const isDiff = this.diffOrderInfo(orderInfo, index, realPasarItem);
    return isDiff;
  }

  diffOrderInfo(newOrder: FeedsData.OrderInfo, index: number, pasarItem: FeedsData.PasarItem): boolean {
    if (!pasarItem || !pasarItem.item)
      return true;

    if (newOrder.sellerAddr == pasarItem.item.sellerAddr &&
      newOrder.tokenId == pasarItem.item.tokenId &&
      newOrder.orderId == pasarItem.item.saleOrderId &&
      newOrder.price == pasarItem.item.fixedAmount &&
      newOrder.amount == pasarItem.item.curQuantity &&
      index == pasarItem.index)
      return false;

    return true;
  }

  prepareRefresh() {
    // this.dataHelper.initDisplayedPasarItem();
    this.refreshManually = true;
    this.refreshedCount = 0;
    this.openOrderCount = Number.MAX_SAFE_INTEGER;
  }

  getOpenOrderCount() {
    return this.openOrderCount;
  }

  getRefreshedCount() {
    return this.refreshCount;
  }

  /*
  asset: "feeds:imgage:QmPSGCsxbGQTkvRUZB1uJaSLxgCQ6zPAe4LnyWReEmuAht"
  blockNumber: 7425993
  createTime: "1627983840"
  description: "sample nft"
  event: "OrderFilled"
  kind: "jpg"
  name: "wide view"
  orderId: "4"
  price: "100000000000000000"
  quantity: "1"
  royalties: "10"
  seller: "0x93b76C16e8A2c61a3149dF3AdCbE604be1F4137b"
  thumbnail: "feeds:imgage:Qme9wrCcxBb7LdE51tb1gLvgJwHzUv1TXxJFVMaATi9iGJ"
  tokenId: "64319248790340379337339904838288666036431059110727357413256114725063300641391"
  type: "image"
  updateTime: "1628138635"
   */
  createItemFromPasarAssist(assistPasarItem: any, moreMenuType: string, showType: string, syncMode: FeedsData.SyncMode) {

    const nftItem: FeedsData.NFTItem = {
      creator: assistPasarItem.royaltyOwner,
      saleOrderId: assistPasarItem.orderId,
      tokenId: assistPasarItem.tokenId,
      asset: assistPasarItem.asset,
      name: assistPasarItem.name,
      description: assistPasarItem.description,
      fixedAmount: assistPasarItem.price,
      kind: assistPasarItem.kind,
      type: assistPasarItem.type,
      royalties: assistPasarItem.royalties,
      quantity: assistPasarItem.quantity,
      curQuantity: assistPasarItem.quantity,
      thumbnail: assistPasarItem.thumbnail,
      sellerAddr: assistPasarItem.sellerAddr,
      // createTime: assistPasarItem.createTime,
      // updateTime: assistPasarItem.updateTime

      amount: assistPasarItem.amount,
      bids: assistPasarItem.bids,
      buyerAddr: assistPasarItem.buyerAddr,
      endTime: assistPasarItem.endTime,
      filled: assistPasarItem.filled,
      lastBid: assistPasarItem.lastBid,
      lastBidder: assistPasarItem.lastBidder,
      orderState: assistPasarItem.orderState,
      orderType: assistPasarItem.orderType,
      orderCreateTime: assistPasarItem.createTime,
      orderUpdateTime: assistPasarItem.updateTime,
      tokenCreateTime: assistPasarItem.tokenCreateTime,
      tokenUpdateTime: assistPasarItem.tokenUpdateTime,

      moreMenuType: moreMenuType,
      showType: showType
    }
    const item: FeedsData.PasarItem = {
      index: 0,
      blockNumber: assistPasarItem.blockNumber,
      item: nftItem,
      syncMode: syncMode
    }
    return item;
  }

  //API
  changePrice(orderId: string, newPrice: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let accountAddress = this.nftContractControllerService.getAccountAddress();

      let price = this.nftContractControllerService
        .transToWei(newPrice)
        .toString();
      let changeStatus = '';

      try {
        changeStatus = await this.nftContractControllerService
          .getPasar()
          .changeOrderPrice(accountAddress, orderId, price);
        if (!changeStatus) {
          reject('Error');
          return;
        }
        this.handleChangePriceResult(orderId, price);
        resolve('Success');
      } catch (error) {
        reject(error);
      }
    });

  }

  //API
  buyOrder(item: FeedsData.NFTItem, quantity: string) {
    return new Promise(async (resolve, reject) => {
      let accountAddress = this.nftContractControllerService.getAccountAddress();
      // let price = this.fixedPrice;
      let purchaseStatus = '';
      try {
        purchaseStatus = await this.nftContractControllerService
          .getPasar()
          .buyOrder(accountAddress, item.saleOrderId, item.fixedAmount);

        if (!purchaseStatus) {
          reject('Error');
          return;
        }
        this.handleBuyResult(item, quantity);
        resolve('Success');
      } catch (error) {
        reject(error);
      }
    });
  }

  //API
  sellOrder() {

  }

  //API
  createOrder() {

  }

  //API
  cancelOrder() {

  }

  handleChangePriceResult(orderId: string, price: string) {
    let createAddress = this.nftContractControllerService.getAccountAddress();
    let olist = this.nftPersistenceHelper.getCollectiblesList(createAddress);

    let nftItemIndex = _.findIndex(olist, (item: FeedsData.NFTItem) => {
      return item.saleOrderId === orderId;
    });

    if (nftItemIndex != -1) {
      olist[nftItemIndex].fixedAmount = price;
      this.nftPersistenceHelper.setCollectiblesMap(createAddress, olist);
    }
    this.dataHelper.updatePasarItemPrice(orderId, price);
    this.event.publish(FeedsEvent.PublishType.nftUpdatePrice, price);
  }

  handleBuyResult(curItem: FeedsData.NFTItem, quantity: string) {
    this.dataHelper.deletePasarItem(curItem.saleOrderId);
    let createAddress = this.nftContractControllerService.getAccountAddress();

    let olist = this.nftPersistenceHelper.getCollectiblesList(createAddress);

    olist = _.filter(olist, item => {
      return item.saleOrderId != curItem.saleOrderId;
    });

    let index = _.findIndex(olist, (item: any) => {
      return item.tokenId === curItem.tokenId && item.moreMenuType === "created";
    });

    if (index === -1) {
      let cItem: any = _.cloneDeep(curItem);
      cItem.fixedAmount = null;
      cItem.sellerAddr = "";
      cItem['moreMenuType'] = 'created';
      olist.push(cItem);
      this.nftPersistenceHelper.setCollectiblesMap(createAddress, olist);
      return;
    }
    let totalNum = (parseInt(olist[index].curQuantity) + parseInt(quantity)).toString();
    olist[index].quantity = totalNum;
    olist[index].curQuantity = totalNum;
    this.nftPersistenceHelper.setCollectiblesMap(createAddress, olist);

  }

  async resolveBuySaleNFTFromPost(orderInfo: FeedsData.OrderInfo): Promise<FeedsData.NFTItem> {
    return new Promise(async (resolve, reject) => {
      try {
        const tokenInfo = await this.getTokenInfo(String(orderInfo.tokenId), true);
        const tokenJson = await this.getTokenJson(tokenInfo.tokenUri);
        const item: FeedsData.NFTItem = this.createItemFromOrderInfo(orderInfo, tokenInfo, tokenJson, 'onSale');
        resolve(item);
      } catch (error) {
        Logger.error(error);
        reject(error);
      }
    });
  }

  async resolveBuyNFTFromPost(post: any): Promise<FeedsData.OrderStateAndNFTItem> {
    return new Promise(async (resolve, reject) => {
      try {
        let nftOrderId = post.content.nftOrderId || '';
        const orderInfo = await this.getOrderInfo(nftOrderId);
        const orderState:any = orderInfo.orderState;
        switch (parseInt(orderState)) {
          case FeedsData.OrderState.SALEING:
            const item = await this.resolveBuySaleNFTFromPost(orderInfo);
            resolve({ state: FeedsData.OrderState.SALEING, item: item });
            break;
          case FeedsData.OrderState.SOLD:
            resolve({ state: FeedsData.OrderState.SOLD, item: null });
            break;
          case FeedsData.OrderState.CANCELED:
            resolve({ state: FeedsData.OrderState.CANCELED, item: null });
            break;
          default:
            break;
        }
      } catch (error) {
        Logger.error('Handle buy error', error);
        resolve(error);
      }
    });
  }
}
