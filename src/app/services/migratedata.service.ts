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
    private hiveService: HiveService,
    private events: Events
  ) {
    this.bindServer = this.initBindServerData();
  }

  initBindServerData(): FeedsData.Server {
    return this.dataHelper.getBindingServer();
  }

  //API
  syncData(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const channelIds = await this.syncChannelData();
    });
  }

  //API
  syncChannelData(): Promise<number[]> {
    return new Promise(async (resolve, reject) => {
      console.log('Do syncChannelData ============ ');
      this.handleChannelData();
      this.getChannelData();
    });
  }

  //API
  syncPostData(channelId: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      console.log('Do syncPostData ============ ');
      await this.handlePostData();
      this.getPostData(channelId);
    });
  }

  //API
  syncCommentData(channelId: string, postId: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      console.log('Do syncCommentData ============ ');
      await this.handleCommentData();
      this.getCommentData(channelId, postId);
    });
  }

  //Inner method
  private getChannelData() {
    try {
      const memo = { callbackMethod: FeedsData.CallbackMethod.SyncFeedsServiceData };
      this.feedsServiceApi.getChannels(this.bindServer.nodeId, Communication.field.id, 0, 0, 0, memo);
    } catch (error) {
      Logger.error(TAG, error);
    }
  }

  //Inner method
  private getPostData(channelId: string) {
    try {
      const memo = { callbackMethod: FeedsData.CallbackMethod.SyncFeedsServiceData };
      this.feedsServiceApi.getPost(this.bindServer.nodeId, channelId, Communication.field.id, 0, 0, 0, memo);
    } catch (error) {
      Logger.error(TAG, error);
    }
  }

  //Inner method
  private getCommentData(channelId: string, postId: string) {
    try {
      const memo = { callbackMethod: FeedsData.CallbackMethod.SyncFeedsServiceData };
      this.feedsServiceApi.getComments(this.bindServer.nodeId, channelId, postId, Communication.field.id, 0, 0, 0, false, memo);
    } catch (error) {
      Logger.error(TAG, error);
    }
  }

  //Inner method
  private handleChannelData(): Promise<FeedsData.Channels> {
    return new Promise((resolve, reject) => {
      this.events.subscribe(FeedsEvent.PublishType.migrateDataToHive, async (response) => {
        console.log('migrateDataToHive----');
        console.log(response);
        if (response && response.method && response.result && response.result.channels && response.method == "get_channels") {
          const channels = response.result.channels;
          await this.saveChannelDataToHive(channels);
        } else {
          //nochannel or error
        }

        this.events.unsubscribe(FeedsEvent.PublishType.migrateDataToHive);

        //遍历
        // for (let index = 0; index < array.length; index++) {
        //   const element = array[index];
        //   //发送数据到Hive
        //   this.HiveService.postChannleInfo();
        // }
      });
    });
  }

  //Inner method
  private handlePostData(): Promise<FeedsData.Channels> {
    return new Promise((resolve, reject) => {
      this.events.subscribe(FeedsEvent.PublishType.migrateDataToHive, (result) => {
        console.log('migrateDataToHive----');
        console.log(result);
        this.events.unsubscribe(FeedsEvent.PublishType.migrateDataToHive);
        this.savePostDataToHive();
        //遍历
        // for (let index = 0; index < array.length; index++) {
        //   const element = array[index];
        //   //发送数据到Hive
        //   this.HiveService.postChannleInfo();
        // }
      });
    });
  }

  //Inner method
  private handleCommentData(): Promise<FeedsData.Channels> {
    return new Promise((resolve, reject) => {
      this.events.subscribe(FeedsEvent.PublishType.migrateDataToHive, (result) => {
        console.log('migrateDataToHive----');
        console.log(result);
        this.events.unsubscribe(FeedsEvent.PublishType.migrateDataToHive);
        this.saveCommentDataToHive();
        //遍历
        // for (let index = 0; index < array.length; index++) {
        //   const element = array[index];
        //   //发送数据到Hive
        //   this.HiveService.postChannleInfo();
        // }
      });
    });
  }

  //Inner method
  //channel
  /*
  avatar: Uint8Array(28) [187, 97, 115, 115, 101, 116, 115, 47, 105, 109, 97, 103, 101, 115, 47, 112, 114, 111, 102, 105, 108, 101, 45, 49, 46, 115, 118, 103]
  id: 1
  introduction: "Test1"
  last_update: 1646187685
  name: "test"
  owner_did: "did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D"
  owner_name: "WangRan"
  proof: "NA"
  status: 0
  subscribers: 1
  tip_methods: "NA"
  */
  private saveChannelDataToHive(channels): Promise<string> {
    return new Promise(async (resolve, reject) => {
      await this.hiveService.createCollection('channel');
      for (let index = 0; index < channels.length; index++) {
        const channel = channels[index];
        //发送数据到Hive
        // this.hiveService.postChannleInfo();
      }
    });
  }

  //Inner method
  private savePostDataToHive(): Promise<string> {
    return new Promise((resolve, reject) => {
      //遍历
      // for (let index = 0; index < array.length; index++) {
      //   const element = array[index];
      //   //发送数据到Hive
      //   this.HiveService.postChannleInfo();
      // }
    });
  }

  //Inner method
  private saveCommentDataToHive(): Promise<string> {
    return new Promise((resolve, reject) => {
      //遍历
      // for (let index = 0; index < array.length; index++) {
      //   const element = array[index];
      //   //发送数据到Hive
      //   this.HiveService.postChannleInfo();
      // }
    });
  }
}
