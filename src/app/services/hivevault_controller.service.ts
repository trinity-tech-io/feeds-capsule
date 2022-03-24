import { Injectable } from '@angular/core';
import { HiveVaultApi } from 'src/app/services/hivevault_api.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { Events } from 'src/app/services/events.service';
import { PostHelperService } from 'src/app/services/post_helper.service';
import SparkMD5 from 'spark-md5';
import { UtilService } from 'src/app/services/utilService';
import { Logger } from './logger';
import { HiveVaultResultParse } from './hivevault_resultparse.service';
import { Config } from './config';
import { FileHelperService } from './FileHelperService';

const TAG = 'HiveVaultController';
let eventBus: Events = null;

@Injectable()
export class HiveVaultController {
  public static CREATEALLCollECTION = "feeds_createALLCollections" // 本地标识是否创建了Collection
  constructor(private hiveVaultApi: HiveVaultApi,
    private dataHelper: DataHelper,
    private postHelperService: PostHelperService,
    private fileHelperService: FileHelperService
  ) {
  }

  //获得订阅的channel列表
  async getHomePostContent() {
    const subscribedChannels = await this.dataHelper.getSubscribedChannelV3List();
    subscribedChannels.forEach(async (item: FeedsData.SubscribedChannelV3) => {
      const channelId = item.channelId
      const destDid = item.destDid
      const subscribedPost = await this.getPostListByChannel(destDid, channelId)
      console.log("subscribedPost ===== ", subscribedPost)
      // TODO： 在这里存储是否合适
      subscribedPost.forEach(async item => {
        await this.dataHelper.addPostV3(item)
      })
    })
  }

  getPostListByChannel(destDid: string, channelId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        //目前暂时获取全部post，后续优化
        const result = await this.hiveVaultApi.queryPostByChannelId(destDid, channelId);
        const postList = HiveVaultResultParse.parsePostResult(destDid, result);
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }


  async downloadScripting(destDid: string, mediaPath: string) {
    return this.hiveVaultApi.downloadScripting(destDid, mediaPath)
  }

  async getChannelInfoById(destDid: string, channelId: string) {
    const info = await this.hiveVaultApi.queryChannelInfo(destDid, channelId)
    console.log("getChannelInfoById ====== ", info)
    // return new Promise(async (resolve, reject) => {

    // });
  }

  getCommentByChannel() {
  }

  async publishPost(channelId: string, postText: string, imagesBase64: string[], videoData: FeedsData.videoData, tag: string) {
    const mediaData = await this.postHelperService.prepareMediaDataV3(imagesBase64, videoData)
    let medaType = FeedsData.MediaType.noMeida
    if (imagesBase64[0].length > 0) {
      medaType = FeedsData.MediaType.containsImg

    } else if (videoData) {
      medaType = FeedsData.MediaType.containsVideo
    }
    const content = this.postHelperService.preparePublishPostContentV3(postText, mediaData, medaType);

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

  subscribeChannel(destDid: string, channelId: string, userDisplayName: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.subscribeChannel(destDid, channelId, userDisplayName);
        await this.dataHelper.addSubscribedChannelV3(destDid, channelId) // 存储这个

        if (result) {
          resolve('SUCCESS');
        } else {
          const errorMsg = 'Subscribe channel error, destDid is' + destDid + 'channelId is' + channelId;
          Logger.error(TAG, errorMsg);
          reject(errorMsg);
        }
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  downloadCustomeAvatar(remotePath: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        // 检测本地是否存在
        let userDid = (await this.dataHelper.getSigninData()).did
        let avatar = await this.dataHelper.loadUserAvatar(userDid);
        if (avatar) {
          resolve(avatar);
          return;
        }
        let self = this
        let imgstr = ''
        try {
          var dataBuffer = await this.hiveVaultApi.downloadCustomeAvatar(userDid, remotePath)
          // dataBuffer = dataBuffer.slice(1, -1)
          imgstr = dataBuffer.toString()
          self.dataHelper.saveUserAvatar(userDid, imgstr);
          resolve(imgstr);
        } catch (error) {
          Logger.error(TAG, 'Download custom avatar error: ', JSON.stringify(error))
          reject(error);
        }
      } catch (error) {
        Logger.error(TAG, 'downloadCustomeAvatar error', error);
        reject(error);
      }
    });
  }

  downloadEssAvatar(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        // 检测本地是否存在
        let userDid = (await this.dataHelper.getSigninData()).did
        const loadKey = userDid + "_ess_avatar"
        let essavatar = await this.dataHelper.loadUserAvatar(loadKey)
        if (essavatar) {
          resolve(essavatar);
          return
        }
        const rawImage = await this.hiveVaultApi.downloadEssAvatar(userDid);
        const savekey = userDid + "_ess_avatar"
        this.dataHelper.saveUserAvatar(savekey, rawImage)
        resolve(rawImage);
      }
      catch (error) {
        reject(error)
        Logger.error(TAG, "Download Ess Avatar error: ", error);
      }
    });
  }

  handlePostResult(result: any): FeedsData.PostV3[] {
    return;
  }

  getAllPostScripting() {
    // const postList = this.hiveVaultApi();
  }

  getV3Data(destDid: string, remotePath: string, fileName: string, type: string,isDownload?: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        isDownload = isDownload || '';
        const result = await this.fileHelperService.getV3Data(fileName, type);
        if (result && result != '') {
          resolve(result);
          return;
        }

        if(result == '' && isDownload != ''){
          resolve('');
          return;
        }

        if (result == '' && isDownload === '') {
          const downloadResult = await this.hiveVaultApi.downloadScripting(destDid, remotePath);
          await this.fileHelperService.saveV3Data(fileName, downloadResult);
          resolve(downloadResult);
          return;
        }

        resolve('')
      } catch (error) {
        Logger.error(TAG, 'Get data error', error);
        reject(error);
      }
    });
  }

  syncSelfChannel() {
    return new Promise(async (resolve, reject) => {
      try {
        const did = (await this.dataHelper.getSigninData()).did;
        const channelsResult = await this.hiveVaultApi.querySelfChannels();
        console.log('channelsResult', channelsResult);
        const parseResult = HiveVaultResultParse.parseChannelResult(did, channelsResult);
        console.log('parseResult', parseResult);
      } catch (error) {
        Logger.error(TAG, 'Sync self channel', error);
        reject(error);
      }
    });
  }

  syncSelfPost() {
    return new Promise(async (resolve, reject) => {
      try {
        const did = (await this.dataHelper.getSigninData()).did;
        const postResult = await this.hiveVaultApi.querySelfPosts();
        console.log('postResult', postResult);
        const parseResult = HiveVaultResultParse.parsePostResult(did, postResult);
        console.log('parseResult', parseResult);
      } catch (error) {
        Logger.error(TAG, 'Sync self post', error);
        reject(error);
      }
    });
  }
}