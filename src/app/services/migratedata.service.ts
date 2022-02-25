import { Injectable } from '@angular/core';
import { FeedService } from 'src/app/services/FeedService';
import { DataHelper } from 'src/app/services/DataHelper';
import { Events } from 'src/app/services/events.service';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';

const TAG = 'MigrateDataService';

@Injectable()
export class MigrateDataService {
  private bindServer: FeedsData.Server;
  public constructor(
    private feedsService: FeedService,
    private dataHelper: DataHelper,
    private feedsServiceApi: FeedsServiceApi
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
      this.feedsServiceApi.getChannels(this.bindServer.nodeId, Communication.field.id, 0, 0, 0);

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
