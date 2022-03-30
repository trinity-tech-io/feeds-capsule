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
    private fileHelperService: FileHelperService,
  ) {
  }

  //获得订阅的channel列表
  async getHomePostContent(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const subscribedChannels = await this.dataHelper.getSubscribedChannelV3List();
        console.log("=====subscribedChannels=======", subscribedChannels);
        for (let index = 0; index < subscribedChannels.length; index++) {
          const item = subscribedChannels[index];

          const channelId = item.channelId
          const destDid = item.destDid

          console.log("=====getHomePostContent=======   ", channelId, destDid);
          const posts = await this.getPostListByChannel(destDid, channelId);
          console.log('subscribedPost============', posts);

          for (let index = 0; index < posts.length; index++) {
            const post: FeedsData.PostV3 = posts[index];
            await this.dataHelper.addPostV3(post);
          }
        }
        resolve('FINISH');
      } catch (error) {
        Logger.error(TAG, 'Get all subscribed channel post error', error);
        reject(error);
      }

    });

    //提前加载：TODO
  }

  getPostListByChannel(targetDid: string, channelId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        //目前暂时获取全部post，后续优化
        const result = await this.hiveVaultApi.queryPostByChannelId(targetDid, channelId);
        const postList = HiveVaultResultParse.parsePostResult(targetDid, result.find_message.items);
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }


  async downloadScripting(targetDid: string, mediaPath: string) {
    return this.hiveVaultApi.downloadScripting(targetDid, mediaPath)
  }

  async getChannelInfoById(targetDid: string, channelId: string): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryChannelInfo(targetDid, channelId)
        const channelInfoList = HiveVaultResultParse.parseChannelResult(targetDid, result['find_message']['items']);

        for (let index = 0; index < channelInfoList.length; index++) {
          const channel = channelInfoList[index];
          this.dataHelper.addChannelV3(channel);
        }
        resolve(channelInfoList);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  getCommentByChannel() {
  }

  publishPost(channelId: string, postText: string, imagesBase64: string[], videoData: FeedsData.videoData, tag: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const mediaData = await this.postHelperService.prepareMediaDataV3(imagesBase64, videoData);
        let medaType = FeedsData.MediaType.noMeida;
        if ( imagesBase64.length > 0 && imagesBase64[0] != null && imagesBase64[0] != '' ) {
          medaType = FeedsData.MediaType.containsImg
        } else if (videoData) {
          medaType = FeedsData.MediaType.containsVideo
        }
        const content = this.postHelperService.preparePublishPostContentV3(postText, mediaData, medaType);

        const result = await this.hiveVaultApi.publishPost(channelId, tag, JSON.stringify(content))

        // this.dataHelper.addPostV3();
        resolve(result);
        return
      } catch (error) {
        Logger.error(TAG, 'Publish post error', error);
        reject(error);
      }
    });
  }

  async createCollectionAndRregisteScript(callerDid: string) {
    let isCreateAllCollections = localStorage.getItem(callerDid + HiveVaultController.CREATEALLCollECTION) || ''
    if (isCreateAllCollections === '') {
      try {
        await this.hiveVaultApi.createAllCollections()
        await this.hiveVaultApi.registeScripting()
      } catch (error) {
        localStorage.setItem(callerDid + HiveVaultController.CREATEALLCollECTION, "true")
      }
    }
  }

  createChannel(channelName: string, intro: string, avatarAddress: string, tippingAddress: string = '', type: string = 'public', nft: string = ''): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // 处理avatar
        const avatarHiveURL = await this.hiveVaultApi.uploadMediaData(avatarAddress)
        const insertResult = await this.hiveVaultApi.createChannel(channelName, intro, avatarHiveURL, tippingAddress, type, nft)

        //TODO add category、proof、memo
        let channelV3: FeedsData.ChannelV3 = {
          destDid: insertResult.destDid,
          channelId: insertResult.channelId,
          createdAt: insertResult.createdAt,
          updatedAt: insertResult.updatedAt,
          name: channelName,
          intro: intro,
          avatar: avatarHiveURL, // 存储图片
          type: type,
          tipping_address: tippingAddress,
          nft: nft,
          category: '',
          proof: '',
          memo: '',
        }
        //console.log("create channelId ==== ", channelId)
        await this.dataHelper.updateChannelV3(channelV3);
        resolve(channelV3.channelId)
      } catch (error) {
        reject(error)
      }
    });
  }

  async updateChannel(channelId: string, channelName: string, intro: string, avatarAddress: string, tippingAddress: string = '', type: string = 'public', nft: string = '', memo: string = ''): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // 处理avatar
        //TODO add category
        const signinDid = (await this.dataHelper.getSigninData()).did;
        const originChannel = await this.dataHelper.getChannelV3ById(signinDid, channelId);
        const updatedAt = UtilService.getCurrentTimeNum();
        let avatarHiveURL = '';
        let finalTippingAddress = '';
        let finalName = '';
        let finalIntro = '';
        let finalType = '';
        let finalNft = '';
        let finalCategory = '';
        let finalMemo = '';

        if (avatarAddress) {
          avatarHiveURL = await this.hiveVaultApi.uploadMediaData(avatarAddress);
        } else {
          avatarHiveURL = originChannel.avatar;
        }

        if (tippingAddress) {
          finalTippingAddress = tippingAddress;
        } else {
          finalTippingAddress = originChannel.tipping_address || '';
        }

        if (channelName) {
          finalName = channelName;
        } else {
          finalName = originChannel.name;
        }

        if (intro) {
          finalIntro = intro;
        } else {
          finalIntro = originChannel.intro;
        }

        if (type) {
          finalType = type;
        } else {
          finalType = originChannel.type;
        }

        if (nft) {
          finalNft = nft;
        } else {
          finalNft = originChannel.nft;
        }

        if (memo) {
          finalMemo = memo;
        } else {
          finalMemo = originChannel.memo;
        }

        const proof = '';

        const result = await this.hiveVaultApi.updateChannel(channelId, finalName, finalIntro, avatarHiveURL, finalType, finalMemo, finalTippingAddress, finalNft);

        let channelV3: FeedsData.ChannelV3 = {
          destDid: signinDid,
          channelId: channelId,
          createdAt: originChannel.createdAt,
          updatedAt: updatedAt,
          name: finalName,
          intro: finalIntro,
          avatar: avatarHiveURL, // 存储图片
          type: finalType,
          tipping_address: finalTippingAddress,
          nft: finalNft,
          category: finalCategory,
          proof: proof,
          memo: finalMemo,
        }

        await this.dataHelper.updateChannelV3(channelV3);
        resolve('FINISH');
      } catch (error) {
        Logger.error(TAG, 'Update channel error', error);
        reject(error)
      }
    });
  }

  subscribeChannel(targetDid: string, channelId: string, userDisplayName: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {

        const result = await this.hiveVaultApi.subscribeChannel(targetDid, channelId, userDisplayName);
        await this.dataHelper.addSubscribedChannelV3(targetDid, channelId) // 存储这个

        if (result) {
          resolve('SUCCESS');
        } else {
          const errorMsg = 'Subscribe channel error, destDid is' + targetDid + 'channelId is' + channelId;
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
          var dataBuffer = await this.hiveVaultApi.downloadCustomeAvatar(remotePath)
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
        const rawImage = await this.hiveVaultApi.downloadEssAvatar();
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

  getV3Data(destDid: string, remotePath: string, fileName: string, type: string, isDownload?: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        isDownload = isDownload || '';
        const result = await this.fileHelperService.getV3Data(fileName, type);
        if (result && result != '') {
          resolve(result);
          return;
        }

        if (result == '' && isDownload != '') {
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
        const parseResult = HiveVaultResultParse.parseChannelResult(channelsResult, did);
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

  createComment(destDid: string, channelId: string, postId: string, refcommentId: string, content: any): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.createComment(destDid, channelId, postId, refcommentId, content);
        console.log('createComment result', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create comment error', error);
        reject(error);
      }
    });
  }

  getCommentsByPost(destDid: string, channelId: string, postId: string): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const commentResult = await this.hiveVaultApi.queryCommentByPostId(destDid, channelId, postId);
        const parseResult = HiveVaultResultParse.parseCommentResult(destDid, commentResult);

        //TODO
        // this.dataHelper.updateCommentV3()
        console.log('getCommentsByPost parseResult', parseResult);
        resolve(parseResult);
      } catch (error) {
        Logger.error(TAG, 'Get comments by post error', error);
        reject(error);
      }
    });
  }

  like(destDid: string, channelId: string, postId: string, commentId: string): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.addLike(destDid, channelId, postId, commentId);
        console.log('like result', result);

        //TODO
        // this.dataHelper.addLikeV3();
        console.log('like result is', result);
        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'Like error', error);
        reject(error);
      }
    });
  }

  removeLike(destDid: string, channelId: string, postId: string, commentId: string): Promise<any>  {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.removeLike(destDid, channelId, postId, commentId);
        console.log('remove like result', result);
        resolve(result);
        //TODO
        // this.dataHelper.removeLikeV3();
      } catch (error) {
        Logger.error(TAG, 'Remove like data error', error);
        reject(error);
      }
    });
  }

  getLike(destDid: string, channelId: string): Promise<any>  {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryLikeByChannel(destDid, channelId);
        console.log('get like result', result);

        //TODO
        // this.dataHelper.removeLikeV3();
      } catch (error) {
        Logger.error(TAG, 'Get like data error', error);
        reject(error);
      }
    });
  }

  getLikeByPost(destDid: string, channelId: string, postId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryLikeByPost(destDid, channelId, postId);
        console.log('getLikeByPost result', result);
        resolve(result);
        //TODO
      } catch (error) {
        Logger.error(TAG, 'getLikeByPost data error', error);
        reject([]);
      }
    });
  }

  unSubscribeChannel(destDid: string, channelId: string): Promise<any> {

    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.unSubscribeChannel(destDid, channelId);
        console.log('getLikeByPost result', result);
        resolve(result);
        //TODO
      } catch (error) {
        Logger.error(TAG, 'getLikeByPost data error', error);
        reject([]);
      }
    });

  }

  updatePost(postId: string, channelId: string, newType: string, newTag: string, newContent: string) {
    return this.hiveVaultApi.updatePost(postId, channelId, newType, newTag, newContent);
  }

  deletePost(postId: string, channelId: string) {
    return this.hiveVaultApi.deletePost(postId, channelId);
  }

  updateComment(destDid: string, channelId: string, postId: string, commentId: string, content: string): Promise<any> {
    return this.hiveVaultApi.updateComment(destDid, channelId, postId, commentId, content);
  }

  deleteComment(targetDid: string, channelId: string, postId: string, commentId: string){
    console.log("===deleteComment==",targetDid,channelId,postId,commentId);
    return this.hiveVaultApi.deleteComment(targetDid, channelId, postId, commentId);
  }

}