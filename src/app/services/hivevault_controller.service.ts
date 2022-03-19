import { Injectable } from '@angular/core';
import { HiveVaultApi } from 'src/app/services/hivevault_api.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { Events } from 'src/app/services/events.service';

const TAG = 'HiveVaultController';
let eventBus: Events = null;

@Injectable()
export class HiveVaultController {
  constructor(private hiveVaultApi: HiveVaultApi,
    private dataHelper: DataHelper) {
  }

  //获得订阅的channel列表
  async getHomePostContent() {
    const subscribedChannels = await this.dataHelper.getSubscribedChannelV3List();
    subscribedChannels.forEach(async (item: FeedsData.SubscribedChannelV3) => {
      const destDid = item.destDid;
      const channelId = item.channelId;

      const result = await this.hiveVaultApi.queryPostByChannelId(destDid, channelId);
      const posts = this.handlePostResult(result);
      posts.forEach(post => {
        this.dataHelper.addPostV3(post);
      });
    });
  }

  handlePostResult(result: any): FeedsData.PostV3[] {
    return;
  }

  getPostList() {
    const postList = this.dataHelper.getPostV3List();
  }
}