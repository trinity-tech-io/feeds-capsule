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
}
