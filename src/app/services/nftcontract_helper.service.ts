import { Injectable } from '@angular/core';
import { Events } from 'src/app/services/events.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';
import { Logger } from './logger';
import { FileHelperService } from 'src/app/services/FileHelperService';
import _ from 'lodash';

const TAG = 'NFTContractHelperService';
export const enum SortType {
  CREATE_TIME,
  UPDATE_TIME,
}

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
  private refreshCount = 7;
  constructor(
    private nftContractControllerService: NFTContractControllerService,
    private event: Events,
    private dataHelper: DataHelper,
    private ipfsService: IPFSService,
    private nftPersistenceHelper: NFTPersistenceHelper,
    private fileHelperService: FileHelperService
  ) {
  }

  loadMoreData(saleStatus: string, sortType: SortType, count: number, startPage: number): Promise<FeedsData.NFTItem[]> {
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
        let list: FeedsData.NFTItem[] = [];
        for (let index = start - 1; index > end; index--) {
          const orderInfo = await this.getOpenOrderByIndex(index);
          const tokenInfo = await this.getTokenInfo(String(orderInfo.tokenId));
          const tokenJson = await this.getTokenJson(tokenInfo.tokenUri);

          const item = await this.createItemFromOrderInfo(orderInfo, tokenInfo, tokenJson, saleStatus);
          // let openOrderResult = await this.getOpenOrderResultByIndex(index);
          // let contractItem = await this.handleFeedsUrl(openOrderResult, saleStatus);

          list.push(item);
        }
        // this.nftPersistenceHelper.setPasarList(list);
        resolve(this.sortData(list, sortType));
      } catch (error) {
        reject(error);
      }
    });
  }

  refreshPasarList(saleStatus: string, sortType: SortType, openOrderCountCallback: (openOrderCount: number) => void, callback: (changedItem: ChangedItem) => void): Promise<FeedsData.NFTItem[]> {
    return new Promise(async (resolve, reject) => {
      try {

        let count = await this.nftContractControllerService.getPasar().getOpenOrderCount() || 0;
        openOrderCountCallback(count);

        if (!count || count == 0) {
          resolve([]);
          return;
        }

        let list: FeedsData.NFTItem[] = [];
        for (let index = count - 1; index >= count - 1 - this.refreshCount; index--) {
          const orderInfo = await this.getOpenOrderByIndex(index);

          console.log("orderInfo", orderInfo);
          const tokenInfo = await this.getTokenInfo(String(orderInfo.tokenId));
          console.log("tokenInfo", tokenInfo);
          const tokenJson = await this.getTokenJson(tokenInfo.tokenUri);
          console.log("tokenJson", tokenJson);
          const item: FeedsData.NFTItem = this.createItemFromOrderInfo(orderInfo, tokenInfo, tokenJson, saleStatus);
          console.log("item", item);
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

  sortData(list: FeedsData.NFTItem[], sortType: SortType): FeedsData.NFTItem[] {
    return _.sortBy(list, (item: any) => {
      return -Number(item.createTime);
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
        console.log("getTokenJson", tokenJson);
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

          console.log("tokenId", tokenId);
          console.log("tokenJson", tokenJson);
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
        console.log("tokenId", tokenId);
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
        const tokenInfo = await this.getTokenInfo(tokenId);
        console.log("token", tokenInfo);
        const tokenJson = await this.getTokenJson(tokenInfo.tokenUri);
        resolve(tokenJson);
      } catch (error) {
        Logger.error('Get Token Json From TokenId', error);
        reject(error);
      }
    });
  }

  syncOpenOrder() {
    return new Promise(async (resolve, reject) => {
      try {
        const openOrderCount = await this.nftContractControllerService.getPasar().getOpenOrderCount();
        console.log("openOrderCount", openOrderCount);
        for (let index = 0; index < openOrderCount; index++) {
          const order = await this.getOpenOrderByIndex(index);
          //TODO
          console.log("openOrder", index, order.tokenId);
        }
      } catch (error) {
        Logger.error('Sync open order', error);
        reject(error);
      }
    });
  }

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
    let orderId: number = -1;
    let tokenId: number = -1;
    let image: string = "";
    let name: string = "";
    let description: string = "";
    let price: number = 0;
    let kind: string = "";
    let type: string = "";
    let royalties: number = 0;
    let quantity: number = 0;
    let curQuantity: number = 0;
    let thumbnail: string = "";
    let sellerAddr: string = "";
    let createTime: number = 0;

    if (orderInfo != null) {
      sellerAddr = orderInfo.sellerAddr;
      tokenId = orderInfo.tokenId;
      orderId = orderInfo.orderId;
      price = orderInfo.price;
      curQuantity = orderInfo.amount;
    } else {
      tokenId = tokenInfo.tokenId;

      sellerAddr = tokenInfo.royaltyOwner;
      curQuantity = 1;
      price = null;
      orderId = null;
    }

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

    return {
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
      createTime: createTime,
      moreMenuType: moreMenuType,
      showType: showType
    };
  }

  createItemFromOrderInfo(orderInfo: FeedsData.OrderInfo, tokenInfo: FeedsData.TokenInfo,
    tokenJson: FeedsData.TokenJson, moreMenuType: string): FeedsData.NFTItem {
    return this.createItem(orderInfo, tokenInfo, tokenJson, moreMenuType);
  }

  creteItemFormTokenId(tokenInfo: FeedsData.TokenInfo, tokenJson: FeedsData.TokenJson,
    moreMenuType: string): FeedsData.NFTItem {
    return this.createItem(null, tokenInfo, tokenJson, moreMenuType);
  }


  async getSellerCollectibleFromContract(sellerAddr: string, index: number): Promise<FeedsData.NFTItem> {
    return new Promise(async (resolve, reject) => {
      try {
        const orderInfo: FeedsData.OrderInfo = await this.getSellerOpenByIndex(sellerAddr, index);
        let tokenInfo = await this.getTokenInfo(String(orderInfo.tokenId));
        let tokenJson = await this.getTokenJson(tokenInfo.tokenUri);
        const item = this.createItemFromOrderInfo(orderInfo, tokenInfo, tokenJson, "onSale");
        resolve(item);
      } catch (error) {
        Logger.error("Get seller collectibles error", error);
        reject(error);
      }
    });
  }

  async getNotSellerCollectiblesFromContract(accAddress: string, index: number): Promise<FeedsData.NFTItem> {
    return new Promise(async (resolve, reject) => {
      try {
        const tokenId = await this.getTokenIdOfOwnerByIndex(accAddress, index);
        const tokenInfo = await this.getTokenInfo(String(tokenId));
        const tokenJson = await this.getTokenJson(tokenInfo.tokenUri);
        const item = this.creteItemFormTokenId(tokenInfo, tokenJson, "created");
        resolve(item);
      } catch (error) {
        Logger.error("Get seller collectibles error", error);
        reject(error);
      }
    });
  }

  forTest() {
    return new Promise(async (resolve, reject) => {
      try {
        const tokenIdAndJson = await this.getTokenJsonFromTokenIndex(1399);

        const fileEntry = await this.fileHelperService.writeTokenJsonFileData(String(tokenIdAndJson.tokenId), JSON.stringify(tokenIdAndJson.tokenJson));
        console.log("TEST", fileEntry.name);


        await this.fileHelperService.getTokenJsonData(fileEntry.name);
      } catch (error) {
        Logger.error('TEST', error);
        reject(error);
      }
    });
  }
}
