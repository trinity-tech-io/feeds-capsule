import { Injectable } from '@angular/core';
import { Logger } from './logger';
import { Config } from './config';
import { HttpService } from 'src/app/services/HttpService';

const TAG: string = 'PasarAssistService';
@Injectable()
export class PasarAssistService {
  constructor(private httpService: HttpService) {
  }

  /**
   * 
   * @param pageNum 页码 从1开始 选填 默认1
   * @param pageSize 每页条目 大于0 选填 默认10
   * @param orderType 订单类型： OrderForSale, OrderCanceled, OrderFilled
   * @param blockNumber 返回本高度之后的数据 选填
   * @param isAsc sort排序方式: 默认按BlockNumber降序， 传 asc表示按BlockNumber升序
   */
  listPasarOrderFromService(pageNum: number, pageSize: number, orderType: FeedsData.OrderType, blockNumber: number, isAsc: boolean): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let url = Config.PASAR_ASSIST_TEST_SERVER + 'listPasarOrder'
          + '?pageNum=' + pageNum;
        if (blockNumber != null && blockNumber != undefined) {
          console.log('blockNumber', blockNumber);
          url = url + '&blockNumber=' + blockNumber;
        }

        if (pageSize)
          url = url + '&pageSize=' + pageSize;
        if (orderType)
          url = url + '&event=' + orderType;
        if (isAsc)
          url = url + '&sort=asc'

        console.log('Request url', url);
        const result = await this.httpService.httpGet(url);
        console.log('Receive result', result);

        const resultCode = result.code;
        if (resultCode != 200)
          reject('Receive result response code is' + resultCode);

        console.log('result', result);
        console.log('result', result.code);
        console.log('result', result.data);
        console.log('result', result.data.total);
        console.log('result', result.data.result);
        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'List Pasar Order From Service error', error);
        reject(error)
      }
    });
  }

  refreshPasarOrder(pageNum: number, pageSize: number, orderType: FeedsData.OrderType, blockNumber: number): Promise<Object> {
    return this.listPasarOrderFromService(pageNum, pageSize, orderType, blockNumber, false);
  }

  syncPasarOrder(pageNum: number, pageSize: number, blockNumber: number): Promise<Object> {
    return this.listPasarOrderFromService(pageNum, pageSize, null, blockNumber, true);
  }

  syncOrder(blockNumber: number): Promise<any> {
    return this.listPasarOrderFromService(1, 10, null, blockNumber, true);
  }

  firstSync(blockNumber: number): Promise<any> {
    console.log('firstSync');
    return this.listPasarOrderFromService(1, 10, FeedsData.OrderType.SALE, blockNumber, true);
  }

}
