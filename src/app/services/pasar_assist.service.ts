import { Injectable } from '@angular/core';
import { Logger } from './logger';
import { Config } from './config';
import { HttpService } from 'src/app/services/HttpService';
import { DataHelper } from 'src/app/services/DataHelper';

const TAG: string = 'PasarAssistService';
@Injectable()
export class PasarAssistService {
  constructor(private httpService: HttpService,
    private dataHelper: DataHelper) {
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
          url = Config.PASAR_ASSIST_MAINNET_SERVER + 'listPasarOrder'
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
    return this.listPasarOrderFromService(1, 10, null, blockNumber, true);
  }

  firstSync(blockNumber: number): Promise<any> {
    return this.listPasarOrderFromService(1, 10, FeedsData.OrderState.SALEING, blockNumber, true);
  }

}
