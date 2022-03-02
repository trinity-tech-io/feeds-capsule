import { Injectable } from '@angular/core';
import { FeedService } from 'src/app/services/FeedService';
import { DataHelper } from 'src/app/services/DataHelper';
import { Events } from 'src/app/services/events.service';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';
import { HiveService } from 'src/app/services/HiveService';
import { Logger } from './logger';

const TAG = 'MigrateDataService';

@Injectable()
export class MigrateDataService {
  private bindServer: FeedsData.Server;
  public constructor(
    private feedsService: FeedService,
    private dataHelper: DataHelper,
    private feedsServiceApi: FeedsServiceApi,
    private HiveService: HiveService,
    private events: Events
  ) {
    this.bindServer = this.initBindServerData();
  }

  initBindServerData(): FeedsData.Server {
    return this.dataHelper.getBindingServer();
  }

  ////
  //API
  syncChannelData(): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log('Do syncChannelData ============ ');
      this.events.subscribe(FeedsEvent.PublishType.migrateDataToHive, (result) => {
        console.log('migrateDataToHive----');
        console.log(result);

        //遍历
        // for (let index = 0; index < array.length; index++) {
        //   const element = array[index];

        //   //发送数据到Hive
        //   this.HiveService.postChannleInfo();
        // }

        // this.events.unsubscribe(FeedsEvent.PublishType.migrateDataToHive);
      });

      try {
        const memo = { callbackMethod: FeedsData.CallbackMethod.SyncFeedsServiceData }
        this.feedsServiceApi.getChannels(this.bindServer.nodeId, Communication.field.id, 0, 0, 0, memo);
      } catch (error) {
        Logger.error(TAG, error);
      }

    });
  }

  syncSubscriptionData(): Promise<string> {
    return new Promise((resolve, reject) => {

    });
  }

  syncPostData(): Promise<string> {
    return new Promise((resolve, reject) => {

    });
  }

  syncCommentData(): Promise<string> {
    return new Promise((resolve, reject) => {

    });
  }

  syncLikeData(): Promise<string> {
    return new Promise((resolve, reject) => {

    });
  }


  ////
  //Inner method
  private getChannelData(): Promise<FeedsData.Channels> {
    return new Promise((resolve, reject) => {


    });
  }

  ////
  //Inner method
  private saveChannelDataToHive(): Promise<string> {
    return new Promise((resolve, reject) => {


    });
  }

}
