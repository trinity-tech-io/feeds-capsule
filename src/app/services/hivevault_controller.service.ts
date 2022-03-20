import { Injectable } from '@angular/core';
import { HiveVaultApi } from 'src/app/services/hivevault_api.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { Events } from 'src/app/services/events.service';
import { PostHelperService } from 'src/app/services/post_helper.service';
import SparkMD5 from 'spark-md5';
import { UtilService } from 'src/app/services/utilService';

const TAG = 'HiveVaultController';
let eventBus: Events = null;

@Injectable()
export class HiveVaultController {
  public static CREATEALLCollECTION = "feeds_createALLCollections" // 本地标识是否创建了Collection
  constructor(private hiveVaultApi: HiveVaultApi,
    private dataHelper: DataHelper,
    private postHelperService: PostHelperService,

  ) {
  }

  //获得订阅的channel列表
  async getHomePostContent() {
    const subscribedChannels = await this.dataHelper.getSubscribedChannelV3List();
    console.log("subscribedChannelV3List ======== ", subscribedChannels)
    subscribedChannels.forEach(async (item: FeedsData.SubscribedChannelV3) => {
      const channelId = item.channelId
      const destDid = item.destDid

      const subscribedPost = await this.hiveVaultApi.queryPostByChannelId(destDid, channelId)
      console.log("subscribedPost ===== ", subscribedPost)
      const items = subscribedPost["find_message"]["items"]

      items.forEach(async item => {
        const contentJson = JSON.parse(item["content"])
        console.log("contentJson === ", contentJson);
        const mediaPath = contentJson['mediaPath']
        const version = contentJson['version']
        const postContent = contentJson['content']
        const mediaType = contentJson['mediaType']

        const mediaData = await this.hiveVaultApi.downloadScripting(destDid, mediaPath)

        let content: FeedsData.postContentV3 = {
          version: version,
          mediaData: mediaData,
          mediaType: mediaType,
          content: postContent,
          mediaPath: mediaData
        }
        // 存储post 
        let post: FeedsData.PostV3 = {
          destDid: destDid,
          postId: item.post_id,
          channelId: item.channel_id,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          content: content,
          status: item.status,
          type: item.type,
          tag: item.tag,
          proof: '',
          memo: item.memo
        }
        await this.dataHelper.addPostV3(post)
      });
      const getPost = await this.dataHelper.getPostV3List()
      console.log("getPost ========== ", getPost)
    })
    //提前加载：TODO
  }

  async publishPost(channelId: string, postText: string, imagesBase64: string[], videoData: FeedsData.videoData, tag: string) {
    console.log("sendPost imagesBase64" + imagesBase64);
    const fileBlob = UtilService.base64ToBlob(imagesBase64[0]);

    // const buff = Buffer.from(imagesBase64, "utf-8");
    console.log("imagesBase64 +" + fileBlob);

    const mediaData = await this.postHelperService.prepareMediaData(imagesBase64, videoData)
    const avatarHiveURL = await this.hiveVaultApi.uploadMediaData(mediaData)

    let mType = FeedsData.MediaType.noMeida;
    if (imagesBase64.length > 0) {
      mType = FeedsData.MediaType.containsImg;
    } else if (videoData.video.length > 0) {
      mType = FeedsData.MediaType.containsVideo;
    }

    const content = await this.postHelperService.preparePublishPostContent(postText, avatarHiveURL, mType);
    
    console.log("sendPost mediaData" + mediaData);
    console.log("sendPost string" + postText);
    console.log("sendPost imagesBase64" + imagesBase64);
    console.log("sendPost videoData" + videoData);
    console.log("sendPost content" + content);

    return await this.hiveVaultApi.publishPost(channelId, tag, JSON.stringify(content))
  }

  async createCollectionAndRregisteScript(callerDid: string) {
    let isCreateAllCollections = localStorage.getItem(callerDid + HiveVaultController.CREATEALLCollECTION) || ''
    if (isCreateAllCollections === '') {
      try {
        await this.hiveVaultApi.createAllCollections()
      } catch (error) {
        localStorage.setItem(callerDid + HiveVaultController.CREATEALLCollECTION, "true")
      }
      await this.hiveVaultApi.registeScripting()
    }
  }

  async createChannel(destDid: string, channelName: string, intro: string, avatarAddress: string, tippingAddress: string = '', type: string = 'public', nft: string = ''): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // 处理avatar
        const avatarHiveURL = await this.hiveVaultApi.uploadMediaData(avatarAddress)
        const doc = await this.hiveVaultApi.createChannel(channelName, intro, avatarHiveURL, tippingAddress, type, nft)
        const channelId = doc['channel_id']
        const createdAt = doc['created_at']
        const updatedAt = doc['updated_at']
        let channelV3: FeedsData.ChannelV3 = {
          destDid: destDid,
          channelId: channelId,
          createdAt: createdAt,
          updatedAt: updatedAt,
          name: channelName,
          intro: intro,
          avatar: avatarAddress, // 存储图片
          type: type,
          tipping_address: tippingAddress,
          nft: nft,
          category: "",
          proof: "",
          memo: doc.memo,
        }
        await this.dataHelper.updateChannelV3(channelV3);
        const channels = await this.dataHelper.loadChannelV3Map()
        console.log("loadChannelV3Map ==== ", channels)
        resolve(channelV3.channelId)
      } catch (error) {
        reject(error)
      }
    });
  }

  async subscribeChannel(destDid: string, channelId: string, userDisplayName: string) {
    const result = await this.hiveVaultApi.subscribeChannel(destDid, channelId, userDisplayName)
    await this.dataHelper.addSubscribedChannelV3(destDid, channelId) // 存储这个
    return result
  }

  handlePostResult(result: any): FeedsData.PostV3[] {
    return;
  }

  getAllPostScripting() {
    // const postList = this.hiveVaultApi();
  }
}