import { Injectable } from '@angular/core';
import { Events } from 'src/app/services/events.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';
import { Logger } from './logger';
import _ from 'lodash';

const TAG = 'NFTContractHelperService';
export const enum SortType {
  CREATE_TIME,
  UPDATE_TIME,
}

export type ContractItem = {
  saleOrderId: string,
  tokenId: string,
  asset: string,
  name: string,
  description: string,
  fixedAmount: string,
  kind: string,
  type: string,
  royalties: string,
  quantity: string,
  curQuantity:string,
  thumbnail: string,
  sellerAddr: string,
  createTime: number,
  saleStatus: string,
}

export type OpenOrderResult = {
  tokenUri: string,
  tokenId: string,
  saleOrderId: string,
  price: string,
  tokenNum: string,
  sellerAddr: string,
  index: string,
  createTime: number,
  royalties: string
}

export type ChangedItem = {
}
@Injectable()
export class NFTContractHelperService {
  private refreshCount = 7;
  constructor(
    private nftContractControllerService: NFTContractControllerService,
    private event: Events,
    private dataHelper: DataHelper,
    private ipfsService: IPFSService,
    private nftPersistenceHelper: NFTPersistenceHelper
  ) {
  }

  loadMoreData(saleStatus: string, sortType: SortType, count: number, startPage: number): Promise<ContractItem[]> {
    return new Promise(async (resolve, reject) => {
      if (startPage * this.refreshCount >= count) {
        resolve([]);
        return;
      }

      let start = count - 1 - (startPage * this.refreshCount);
      let end = count - 1 - ((startPage + 1) * this.refreshCount);
      if (end < 0)
        end = -1;
      try {
        let list = [];
        for (let index = start - 1; index > end; index--) {
          let openOrderResult = await this.getOpenOrderResultByIndex(index);
          let contractItem = await this.handleFeedsUrl(openOrderResult, saleStatus);

          list.push(contractItem);
        }
        // this.nftPersistenceHelper.setPasarList(list);
        resolve(this.sortData(list, sortType));
      } catch (error) {
        reject(error);
      }
    });
  }

  refreshPasarList(saleStatus: string, sortType: SortType, openOrderCountCallback: (openOrderCount: number) => void, callback: (changedItem: ChangedItem) => void): Promise<ContractItem[]> {
    return new Promise(async (resolve, reject) => {
      try {

        let count = await this.nftContractControllerService.getPasar().getOpenOrderCount() || 0;
        openOrderCountCallback(count);

        if (!count || count == 0) {
          resolve([]);
          return;
        }

        let list = [];
        for (let index = count - 1; index >= count - 1 - this.refreshCount; index--) {
          let openOrderResult = await this.getOpenOrderResultByIndex(index);
          let contractItem = await this.handleFeedsUrl(openOrderResult, saleStatus);

          list.push(contractItem);
        }

        // this.nftPersistenceHelper.setPasarList(list);
        resolve(this.sortData(list, sortType));
      } catch (error) {
        reject(error);
      }
    });
  }

  sortData(list: ContractItem[], sortType: SortType): ContractItem[] {
    return _.sortBy(list, (item: any) => {
      return -Number(item.createTime);
    });
  }

  getOpenOrderResultByIndex(index: any): Promise<OpenOrderResult> {
    return new Promise(async (resolve, reject) => {
      try {
        let openOrder = await this.nftContractControllerService
          .getPasar()
          .getOpenOrderByIndex(index);
        let tokenId = openOrder[3];
        let saleOrderId = openOrder[0];
        let tokenNum = openOrder[4];
        let price = openOrder[5];
        let sellerAddr = openOrder[7];

        let tokenInfo = await this.nftContractControllerService
          .getSticker()
          .tokenInfo(tokenId);
        let tokenUri = tokenInfo[3];
        let royalties = tokenInfo[5] || null;
        let createTime = Number.parseInt(tokenInfo[7]);

        let result: OpenOrderResult = {
          tokenUri,
          tokenId,
          saleOrderId,
          price,
          tokenNum,
          sellerAddr,
          index,
          createTime,
          royalties
        }
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }

  handleFeedsUrl(openOrderResult: OpenOrderResult, saleStatus: string): Promise<ContractItem> {
    return new Promise(async (resolve, reject) => {
      try {
        let feedsUri = openOrderResult.tokenUri;
        feedsUri = feedsUri.replace('feeds:json:', '');
        let result = await this.ipfsService.nftGet(this.ipfsService.getNFTGetUrl() + feedsUri);

        let thumbnail = result['thumbnail'] || '';
        if (thumbnail === '') {
          thumbnail = result['image'];
        }

        let item: ContractItem = {
          saleOrderId: openOrderResult.saleOrderId,
          tokenId: openOrderResult.tokenId,
          asset: result['image'],
          name: result['name'],
          description: result['description'],
          fixedAmount: openOrderResult.price,
          kind: result['kind'],
          type: result['type'] || 'single',
          royalties: openOrderResult.royalties,
          quantity: openOrderResult.tokenNum,
          curQuantity: openOrderResult.tokenNum,
          thumbnail: thumbnail,
          sellerAddr: openOrderResult.sellerAddr,
          createTime: openOrderResult.createTime * 1000,
          saleStatus: saleStatus
        }
        resolve(item);
      } catch (err) {
        reject(err);
      }
    });
  }

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

  getTokenInfo(tokenId: string): Promise<FeedsData.TokenInfo> {
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
    const uri = tokenUri.replace('feeds:json:', '');
    return uri;
  }

  parseTokenImageUri(tokenImgUri: string) {
    const uri = tokenImgUri.replace("feeds:imgage", "");
    const finaluri = uri.replace("feeds:image", "");
    return finaluri;
  }

  getTokenJson(tokenUri: string): Promise<FeedsData.TokenJson> {
    return new Promise(async (resolve, reject) => {
      try {
        //tokenUri: feeds:json:xxx
        const uri = this.parseTokenUri(tokenUri);
        const result = await this.ipfsService
          .nftGet(this.ipfsService.getNFTGetUrl() + uri);
        const tokenJson = this.transTokenJson(result);
        Logger.log("Get token Json", tokenJson);
        resolve(tokenJson);
      } catch (error) {
        Logger.log("Get Token Json error", error);
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
}
