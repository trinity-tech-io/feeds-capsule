import { Injectable } from '@angular/core';
import { HiveVaultApi } from 'src/app/services/hivevault_api.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { Events } from 'src/app/services/events.service';
import { PostHelperService } from 'src/app/services/post_helper.service';
import { UtilService } from 'src/app/services/utilService';
import { Logger } from './logger';
import { HiveVaultResultParse } from './hivevault_resultparse.service';

import { FileHelperService } from './FileHelperService';
import _ from 'lodash';

const TAG = 'HiveVaultController';

@Injectable()
export class HiveVaultController {
  public static CREATEALLCollECTION = "feeds_createALLCollections" // 本地标识是否创建了Collection
  constructor(private hiveVaultApi: HiveVaultApi,
    private dataHelper: DataHelper,
    private postHelperService: PostHelperService,
    private fileHelperService: FileHelperService,
    private eventBus: Events
  ) {
  }

  syncAllPost(): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const subscribedChannels = await this.dataHelper.getSubscribedChannelV3List();
        if (subscribedChannels.length === 0) {
          resolve([]);
          return;
        }

        let postList = [];
        for (let index = 0; index < subscribedChannels.length; index++) {
          const subscribedChannel = subscribedChannels[index];
          const channelId = subscribedChannel.channelId
          const destDid = subscribedChannel.destDid

          // const localPost = await this.dataHelper.getPostV3ById(destDid, postId)
          const posts = await this.getPostListByChannel(destDid, channelId);
          postList.push(posts);
        }
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'Get all subscribed channel post error', error);
        reject(error);
      }
    });
  }

  syncAllComments(): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        let commentList = [];
        const subscribedChannels = await this.dataHelper.getSubscribedChannelV3List();
        if (!subscribedChannels) {
          resolve(commentList);
          return;
        }

        for (let index = 0; index < subscribedChannels.length; index++) {
          const subscribedChannel = subscribedChannels[index];
          const destDid = subscribedChannel.destDid;
          const channelId = subscribedChannel.channelId;

          const comments = await this.queryCommentByChannel(destDid, channelId);
          commentList.push(comments);
        }
        resolve(commentList);
      } catch (error) {
        Logger.error(TAG, 'Sync all comment error', error);
        reject(error);
      }
    });
  }

  syncPostFromChannel(destDid: string, channelId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const selfDid = (await this.dataHelper.getSigninData()).did;
        let postList = [];
        if (destDid == selfDid) {
          console.log("=====dest======" + destDid);
          const posts = await this.syncSelfPostsByChannel(channelId);
          postList.push(posts);
        } else {
          console.log("=====dest11======" + destDid);
          const posts = await this.getPostListByChannel(destDid, channelId);
          postList.push(posts);
        }
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'Sync post from channel error', error);
        reject(error);
      }
    });
  }

  syncCommentFromPost(destDid: string, channelId: string, postId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryCommentByPostId(destDid, channelId, postId);
        const commentList = HiveVaultResultParse.parseCommentResult(destDid, result);
        for (let commentIndex = 0; commentIndex < commentList.length; commentIndex++) {
          let item = commentList[commentIndex];
          let comment = await this.dataHelper.getCommentV3ById(postId, item.commentId) || '';
          if (comment === '') {
            await this.dataHelper.addCommentV3(item);
          } else {
            await this.dataHelper.updateCommentV3(item);
          }
        }
        resolve(commentList);
      } catch (error) {
        Logger.error(TAG, 'Sync comment from post error', error);
        reject(error);
      }
    });
  }

  syncLikeDataFromChannel(destDid: string, channelId: string): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryLikeByChannel(destDid, channelId);
        const likeList = this.handleLikeResult(destDid, result);
        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'Sync comment from post error', error);
        reject(error);
      }
    });
  }

  syncAllLikeData(): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const subscribedChannels = await this.dataHelper.getSubscribedChannelV3List();
        let likeList = [];
        for (let index = 0; index < subscribedChannels.length; index++) {
          const subscribedChannel = subscribedChannels[index];

          const destDid = subscribedChannel.destDid;
          const channelId = subscribedChannel.channelId;

          const likes = await this.syncLikeDataFromChannel(destDid, channelId);
          likeList.push(likes);
        }

        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'Sync all like data error', error);
        reject(error);
      }
    });
  }

  syncAllChannelInfo(): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const subscribedChannels = await this.dataHelper.getSubscribedChannelV3List();
        let channelList = [];
        for (let index = 0; index < subscribedChannels.length; index++) {
          const subscribedChannel = subscribedChannels[index];
          const destDid = subscribedChannel.destDid;
          const channelId = subscribedChannel.channelId;

          const channel = await this.getChannelInfoById(destDid, channelId) || null;
          if (channel != null) {
            channelList.push(channel);
          }
        }

        resolve(channelList);
      } catch (error) {
        Logger.error(TAG, 'Sync all like data error', error);
        reject(error);
      }
    });
  }

  syncAllSubscriptionData() {
    return new Promise(async (resolve, reject) => {
      try {
        const subscribedChannels = await this.dataHelper.getSubscribedChannelV3List();
        let subscribedChannelList = [];
        for (let index = 0; index < subscribedChannels.length; index++) {
          const subscribedChannel = subscribedChannels[index];
          const destDid = subscribedChannel.destDid;
          const channelId = subscribedChannel.channelId;

          const channel = await this.getSubscriptionChannelById(destDid, channelId);
          subscribedChannelList.push(channel);
        }

        resolve(subscribedChannelList);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  getSubscriptionChannelById(targetDid: string, channelId: string): Promise<FeedsData.SubscribedChannelV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.querySubscrptionInfoByChannelId(targetDid, channelId);
        Logger.log(TAG, 'Query subscription info result is', result);
        if (result) {
          const subscriptions = HiveVaultResultParse.parseSubscriptionResult(targetDid, result);

          if (!subscriptions || subscriptions.length == 0) {
            resolve(null);
            return;
          }

          const subscribedChannel: FeedsData.SubscribedChannelV3 = await this.dataHelper.getSubscribedChannelV3ByKey(targetDid, channelId);

          if (!subscribedChannel) {
            this.dataHelper.addSubscribedChannelV3(subscriptions[0]);
          }

          resolve(subscribedChannel);
        } else {
          resolve(null);
        }
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  async queryPostByRangeOfTime(targetDid: string, channelId: string, star: number, end: number) {
    const result = await this.hiveVaultApi.queryPostByRangeOfTime(targetDid, channelId, star, end)
    const rangeOfTimePostList = HiveVaultResultParse.parsePostResult(targetDid, result.find_message.items);
    console.log("rangeOfTimePostList >>>>>>>>>>>> ", rangeOfTimePostList)
  }

  async queryPostByPostId(targetDid: string, channelId: string, postId: string): Promise<FeedsData.PostV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryPostById(targetDid, channelId, postId);
        Logger.log(TAG, 'Query post by id result is', result);
        if (result) {
          const posts = HiveVaultResultParse.parsePostResult(targetDid, result.find_message.items);

          const localPost = await this.dataHelper.getPostV3ById(targetDid, postId);
          if (!localPost) {
            this.dataHelper.addPostV3(posts[0]);
          } else {
            this.dataHelper.updatePostV3(posts[0]);
          }

          resolve(posts[0]);
        } else {
          resolve(null);
        }
      } catch (error) {
        Logger.error(TAG, error);
        reject(error)
      }
    });
  }

  getPostListByChannel(targetDid: string, channelId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryPostByChannelId(targetDid, channelId);
        Logger.log(TAG, 'Get post from channel result is', result);
        if (result) {
          const postList = HiveVaultResultParse.parsePostResult(targetDid, result.find_message.items);
          for (let postIndex = 0; postIndex < postList.length; postIndex++) {
            let postId = postList[postIndex].postId;
            let post: FeedsData.PostV3 = await this.dataHelper.getPostV3ById(targetDid, postId) || null;
            if (!post) {
              await this.dataHelper.addPostV3(postList[postIndex]);
            } else {
              await this.dataHelper.updatePostV3(postList[postIndex]);
            }
          }
          resolve(postList);
        } else {
          const errorMsg = 'Get post from channel error';
          Logger.error(TAG, errorMsg);
          reject(errorMsg);
        }
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  syncPostById() {

  }

  async downloadScripting(targetDid: string, mediaPath: string) {
    return this.hiveVaultApi.downloadScripting(targetDid, mediaPath)
  }

  getChannelInfoById(targetDid: string, channelId: string): Promise<FeedsData.ChannelV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryChannelInfo(targetDid, channelId)
        const channelList = HiveVaultResultParse.parseChannelResult(targetDid, result['find_message']['items']);
        let channel: FeedsData.ChannelV3 = channelList[0] || null;
        if (channel != null) {
          let newChannel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(channel.destDid, channel.channelId) || null;
          if (newChannel === null) {
            await this.dataHelper.addChannelV3(channel);
          } else {
            await this.dataHelper.updateChannelV3(channel);
          }
        }
        resolve(channel);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  queryCommentByChannel(targetDid: string, channelId: string): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryCommentByChannel(targetDid, channelId);
        Logger.log(TAG, 'Query comment from channel, result is', result);

        const commentsResult = await this.handleCommentResult(targetDid, result);
        resolve(commentsResult);
      } catch (error) {
        Logger.error(TAG, 'Query comment by channel error', error);
        reject(error);
      }
    });
  }

  publishPost(channelId: string, postText: string, imagesBase64: string[], videoData: FeedsData.videoData, tag: string, type: string = 'public', status: number = FeedsData.PostCommentStatus.available, memo: string = '', proof: string = ''): Promise<FeedsData.PostV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const content = await this.progressMediaData(postText, imagesBase64, videoData)
        const result = await this.hiveVaultApi.publishPost(channelId, tag, JSON.stringify(content), type, status, memo, proof)
        Logger.log(TAG, "Publish new post , result is", result);

        if (result) {
          let postV3: FeedsData.PostV3 = {
            destDid: result.targetDid,
            postId: result.postId,
            channelId: channelId,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            content: content,
            status: FeedsData.PostCommentStatus.available,
            type: type,
            tag: tag,
            proof: proof,
            memo: memo
          }

          await this.dataHelper.addPostV3(postV3);
          resolve(postV3);
        } else {
          const errorMsg = 'Publish new post error';
          Logger.error(TAG, errorMsg);
          reject(errorMsg)
        }
      } catch (error) {
        Logger.error(TAG, 'Publish post error', error);
        reject(error);
      }
    });
  }

  public updatePost(originPost: FeedsData.PostV3, newContent: FeedsData.postContentV3, newType: string = 'public', newTag: string, newStatus: number = FeedsData.PostCommentStatus.edited, newMemo: string = '', newProof: string = ''): Promise<FeedsData.PostV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const newUpdateAt = UtilService.getCurrentTimeNum();
        const result = await this.hiveVaultApi.updatePost(originPost.postId, originPost.channelId, newType, newTag, JSON.stringify(newContent), newStatus, newUpdateAt, newMemo, newProof);
        if (result) {
          let postV3: FeedsData.PostV3 = {
            destDid: originPost.destDid,
            postId: originPost.postId,
            channelId: originPost.channelId,
            createdAt: originPost.createdAt,
            updatedAt: newUpdateAt,
            content: newContent,
            status: newStatus,
            type: newType,
            tag: newTag,
            proof: newProof,
            memo: newMemo
          };

          await this.dataHelper.updatePostV3(postV3);
          resolve(postV3);
        } else {
          resolve(null);
        }
      } catch (error) {
        Logger.error(TAG, 'Update post error', error);
        reject(error);
      }
    })
  }

  private async progressMediaData(newPostText: string, newImagesBase64: string[], newVideoData: FeedsData.videoData) {
    const mediaData = await this.postHelperService.prepareMediaDataV3(newImagesBase64, newVideoData);
    let mediaType = FeedsData.MediaType.noMeida;
    if (newImagesBase64.length > 0 && newImagesBase64[0] != null && newImagesBase64[0] != '') {
      mediaType = FeedsData.MediaType.containsImg
    } else if (newVideoData) {
      mediaType = FeedsData.MediaType.containsVideo
    }
    const content = this.postHelperService.preparePublishPostContentV3(newPostText, mediaData, mediaType);

    return content
  }

  async createCollectionAndRregisteScript(callerDid: string) {
    let isCreateAllCollections = localStorage.getItem(callerDid + HiveVaultController.CREATEALLCollECTION) || ''
    if (isCreateAllCollections === '') {
      try {
        await this.hiveVaultApi.createAllCollections()
        await this.hiveVaultApi.registeScripting()
        localStorage.setItem(callerDid + HiveVaultController.CREATEALLCollECTION, "true")
      } catch (error) {
        await this.hiveVaultApi.registeScripting()
        localStorage.setItem(callerDid + HiveVaultController.CREATEALLCollECTION, "true")
      }
    }
  }

  createChannel(channelName: string, intro: string, avatarAddress: string, tippingAddress: string = '', type: string = 'public', nft: string = '', memo: string = '', category: string = '', proof: string = ''): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        //check local store
        const targetDid = (await this.dataHelper.getSigninData()).did;
        const channelId = UtilService.generateChannelId(targetDid, channelName);
        const localChannel = await this.dataHelper.getChannelV3ById(targetDid, channelId);
        if (localChannel) {
          Logger.error(TAG, 'Channel already exist');
          reject('Already exist')
        }

        // 处理avatar
        const avatarHiveURL = await this.hiveVaultApi.uploadMediaDataWithString(avatarAddress);
        const insertResult = await this.hiveVaultApi.createChannel(channelName, intro, avatarHiveURL, tippingAddress, type, nft, memo, category, proof)
        //add cache
        let fileName = avatarHiveURL.split('@')[0];
        await this.fileHelperService.saveV3Data(fileName, avatarAddress);
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
          category: category,
          proof: proof,
          memo: memo,
        }

        await this.dataHelper.addChannelV3(channelV3);
        resolve(channelV3.channelId)
      } catch (error) {
        reject(error)
      }
    });
  }

  async updateChannel(channelId: string, channelName: string, intro: string, avatarAddress: string, tippingAddress: string = '', type: string = 'public', nft: string = '', proof: string = '', category: string = '', memo: string = ''): Promise<FeedsData.ChannelV3> {
    return new Promise(async (resolve, reject) => {
      try {
        // 处理avatar
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
        let finalProof = '';

        if (avatarAddress) {
          avatarHiveURL = await this.hiveVaultApi.uploadMediaDataWithString(avatarAddress);
          //add cache
          let fileName = avatarHiveURL.split('@')[0];
          await this.fileHelperService.saveV3Data(fileName, avatarAddress);
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

        if (proof) {
          finalProof = proof;
        } else {
          finalProof = originChannel.proof;
        }
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
          proof: finalProof,
          memo: finalMemo,
        }

        if (result) {
          await this.dataHelper.updateChannelV3(channelV3);
          resolve(channelV3);
        } else {
          reject('Update channel error');
        }

      } catch (error) {
        Logger.error(TAG, 'Update channel error', error);
        reject(error)
      }
    });
  }

  subscribeChannel(targetDid: string, channelId: string, userDisplayName: string = ''): Promise<FeedsData.SubscribedChannelV3> {
    return new Promise(async (resolve, reject) => {
      try {
        let userName = '';
        if (userDisplayName == '') {
          const signinData = await this.dataHelper.getSigninData();
          userName = signinData.name;
        } else {
          userName = userDisplayName;
        }
        const updatedAt = UtilService.getCurrentTimeNum();
        const result = await this.hiveVaultApi.subscribeChannel(targetDid, channelId, userName, updatedAt);
        if (result) {
          let subscribedChannel: FeedsData.SubscribedChannelV3 = {
            destDid: targetDid,
            channelId: channelId
          }
          const localResult = await this.dataHelper.getSubscribedChannelV3ByKey(targetDid, channelId);
          if (!localResult) {
            await this.dataHelper.addSubscribedChannelV3(subscribedChannel);
          }

          resolve(subscribedChannel);
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

  updateSubscriptionChannel(targetDid: string, channelId: string, status: number): Promise<{ updatedAt: number }> {
    return this.hiveVaultApi.updateSubscription(targetDid, channelId, status);
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
        if (rawImage === undefined || rawImage === null) {
          resolve(null)
          return
        }
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

  syncSelfChannel(): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const did = (await this.dataHelper.getSigninData()).did;
        const channelsResult = await this.hiveVaultApi.querySelfChannels();
        Logger.log(TAG, 'Query self channels result', channelsResult);
        if (channelsResult) {
          const parseResult = HiveVaultResultParse.parseChannelResult(did, channelsResult);
          console.log('parseResult', parseResult);
          for (let channelIndex = 0; channelIndex < parseResult.length; channelIndex++) {
            let item = parseResult[channelIndex];
            let channel = await this.dataHelper.getChannelV3ById(item.destDid, item.channelId) || null;
            if (channel === null) {
              await this.dataHelper.addChannelV3(item);
            } else {
              await this.dataHelper.updateChannelV3(item);
            }
            await this.getSubscriptionChannelById(item.destDid, item.channelId);
          }
          resolve(parseResult);
        } else {
          resolve([]);
        }
      } catch (error) {
        Logger.error(TAG, 'Sync self channel', error);
        resolve([]);

      }
    });
  }

  syncSelfPosts(): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const did = (await this.dataHelper.getSigninData()).did;
        const postResult = await this.hiveVaultApi.querySelfPosts();
        Logger.log('Query self posts result', postResult);

        if (postResult) {
          const parseResult = HiveVaultResultParse.parsePostResult(did, postResult);
          await this.dataHelper.updatePostsV3(parseResult);
          console.log('parseResult', parseResult);
          resolve(parseResult);
        } else {
          reject('Sync self posts error');
        }
      } catch (error) {
        Logger.error(TAG, 'Sync self post', error);
        reject(error);
      }
    });
  }

  private syncSelfPostsByChannel(channelId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const did = (await this.dataHelper.getSigninData()).did;
        const postResult = await this.hiveVaultApi.querySelfPostsByChannel(channelId);
        Logger.log('Query self post result', postResult);
        if (postResult) {
          const parseResult = HiveVaultResultParse.parsePostResult(did, postResult);
          for (let postIndex = 0; postIndex < parseResult.length; postIndex++) {
            let item: FeedsData.PostV3 = parseResult[postIndex];
            let post: FeedsData.PostV3 = await this.dataHelper.getPostV3ById(item.destDid, item.postId) || null;
            if (!post) {
              await this.dataHelper.addPostV3(item);
            } else {
              await this.dataHelper.updatePostV3(item);
            }
          }
          console.log('parseResult', parseResult);
          resolve(parseResult);
        } else {
          reject('Sync self posts by channel error');
        }

      } catch (error) {
        Logger.error(TAG, 'Sync self post by channel', error);
        reject([]);
      }
    });
  }

  createComment(destDid: string, channelId: string, postId: string, refcommentId: string, content: any): Promise<FeedsData.CommentV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.createComment(destDid, channelId, postId, refcommentId, content);
        Logger.log('createComment result', result);

        if (result) {
          const comment: FeedsData.CommentV3 = {
            destDid: destDid,
            commentId: result.commentId,

            channelId: channelId,
            postId: postId,
            refcommentId: refcommentId,
            content: content,
            status: FeedsData.PostCommentStatus.available,
            updatedAt: result.createdAt,
            createdAt: result.createdAt,
            proof: '',
            memo: '',

            createrDid: result.createrDid
          }

          this.dataHelper.addCommentV3(comment);
          resolve(comment);
        } else {
          reject('Create comment error');
        }
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

        Logger.log('Query comment by id result is', commentResult);
        if (commentResult) {
          const comments = HiveVaultResultParse.parseCommentResult(destDid, commentResult);
          console.log('getCommentsByPost parseResult', comments);

          //TODO
          //1.query
          //2.if null add else update ,toast warn
          for (let commentIndex = 0; commentIndex < comments.length; commentIndex++) {
            let item = comments[commentIndex];
            let comment = await this.dataHelper.getCommentV3ById(postId, item.commentId) || '';
            if (comment === '') {
              await this.dataHelper.addCommentV3(item);
            } else {
              await this.dataHelper.updateCommentV3(item);
            }
          }
          resolve(comments);
        } else {
          reject('Query comment by post error');
        }
      } catch (error) {
        Logger.error(TAG, 'Query comments by post error', error);
        reject(error);
      }
    });
  }

  like(destDid: string, channelId: string, postId: string, commentId: string): Promise<FeedsData.LikeV3> {
    return new Promise(async (resolve, reject) => {
      try {
        //TODO
        //1.query
        //2.if null add else update ,toast warn
        const createrDid = (await this.dataHelper.getSigninData()).did;
        const result = await this.hiveVaultApi.queryLikeByUser(destDid, channelId, postId, commentId, createrDid);
        const likeList = await this.handleLikeResult(destDid, result);

        let like = likeList[0];
        let updatedAt = 0;
        let createdAt = 0;

        if (like) {
          const updateResult = await this.hiveVaultApi.updateLike(destDid, channelId, postId, commentId, FeedsData.PostCommentStatus.available);
          createdAt = like.createdAt;
          updatedAt = updateResult.updatedAt;
        } else {
          const addResult = await this.hiveVaultApi.addLike(destDid, channelId, postId, commentId);
          createdAt = addResult.createdAt;
          updatedAt = createdAt;
        }

        Logger.log('like result', result);

        if (result) {
          const like: FeedsData.LikeV3 = {
            destDid: destDid,
            postId: postId,
            commentId: commentId,

            channelId: channelId,
            createdAt: createdAt,
            createrDid: createrDid,
            proof: '',
            memo: '',

            updatedAt: updatedAt,
            status: FeedsData.PostCommentStatus.available
          }

          const localResult = await this.dataHelper.getLikeV3ByUser(postId, commentId, createrDid);
          if (localResult) {
            await this.dataHelper.updateLikeV3(like);
          } else {
            await this.dataHelper.addLikeV3(like);
          }
          resolve(like);

        } else {
          reject('Like error');
        }
      } catch (error) {
        Logger.error(TAG, 'Like error', error);
        reject(error);
      }
    });
  }

  removeLike(destDid: string, channelId: string, postId: string, commentId: string): Promise<FeedsData.LikeV3> {
    return new Promise(async (resolve, reject) => {
      try {

        const createrDid = (await this.dataHelper.getSigninData()).did;
        const like = await this.dataHelper.getLikeV3ByUser(postId, commentId, createrDid);
        if (!like) {
          resolve(null);
          return;
        }

        const result = await this.updateLike(destDid, channelId, postId, commentId, FeedsData.PostCommentStatus.deleted);

        Logger.log('Remove like result', result);
        if (result) {
          like.updatedAt = result.updatedAt;
          like.status = FeedsData.PostCommentStatus.deleted;
          await this.dataHelper.updateLikeV3(like);
          resolve(like);
        } else {
          const errorMsg = 'Remove like error';
          reject(errorMsg);
        }

      } catch (error) {
        Logger.error(TAG, 'Remove like data error', error);
        reject(error);
      }
    });
  }

  updateLike(targetDid: string, channelId: string, postId: string, commentId: string, status: FeedsData.PostCommentStatus): Promise<{ updatedAt: number }> {
    return this.hiveVaultApi.updateLike(targetDid, channelId, postId, commentId, status);
  }

  unSubscribeChannel(destDid: string, channelId: string): Promise<FeedsData.SubscribedChannelV3> {
    return new Promise(async (resolve, reject) => {
      try {

        const result = await this.hiveVaultApi.unSubscribeChannel(destDid, channelId);
        console.log('unSubscribeChannel result', result);

        if (result) {
          const subscribedChannel: FeedsData.SubscribedChannelV3 = {
            destDid: destDid,
            channelId: channelId
          }
          //1.query
          //2.remove
          await this.dataHelper.removeSubscribedChannelV3(subscribedChannel);
          resolve(subscribedChannel);
        } else {
          const errorMsg = 'Unsubscribe channel error';
          Logger.error(TAG, errorMsg);
          reject(errorMsg);
        }
      } catch (error) {
        Logger.error(TAG, 'Unsubscribe channel error', error);
        reject([]);
      }
    });

  }

  deleteCollection(collectionName: string): Promise<void> {
    return this.hiveVaultApi.deleteCollection(collectionName)
  }

  deleteAllCollections(): Promise<string> {
    Logger.log(TAG, "deleteAllCollections");
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.deleteAllCollections();
        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'deleteAllCollections data error', error);
        reject(error);
      }
    });
  }

  deletePost(post: FeedsData.PostV3): Promise<FeedsData.PostV3> {
    Logger.log(TAG, "Delete post", post);
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.deletePost(post.postId, post.channelId);;
        if (result) {
          post.updatedAt = result.updatedAt;
          post.status = result.status;

          await this.dataHelper.deletePostV3(post);
          resolve(post);
        } else {
          const errorMsg = 'Delete post error';
          Logger.error(TAG, errorMsg);
          reject(errorMsg);
        }
      } catch (error) {
        Logger.error(TAG, 'deletePost data error', error);
        reject(error);
      }
    });
  }

  updateComment(originComment: FeedsData.CommentV3, content: string): Promise<FeedsData.CommentV3> {
    Logger.log(TAG, "updateComment", originComment, content);
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.updateComment(originComment.destDid, originComment.channelId, originComment.postId, originComment.commentId, content);
        Logger.log(TAG, 'Update comment result', result);
        if (result) {
          const comment: FeedsData.CommentV3 = {
            destDid: originComment.destDid,
            commentId: originComment.commentId,

            channelId: originComment.channelId,
            postId: originComment.postId,
            refcommentId: originComment.refcommentId,
            content: content,
            status: FeedsData.PostCommentStatus.edited,
            updatedAt: result.updatedAt,
            createdAt: originComment.createdAt,
            proof: '',
            memo: originComment.memo,

            createrDid: originComment.createrDid
          }

          this.dataHelper.updateCommentV3(comment);
          resolve(comment);
        } else {
          reject('Update comment error');
        }
      } catch (error) {
        Logger.error(TAG, 'Update comment data error', error);
        reject(error);
      }
    });
  }

  deleteComment(comment: FeedsData.CommentV3): Promise<FeedsData.CommentV3> {
    Logger.log(TAG, "Delete comment", comment);
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.deleteComment(comment.destDid, comment.channelId, comment.postId, comment.commentId);
        Logger.log(TAG, "Delete comment result", result);

        if (result) {
          comment.status = FeedsData.PostCommentStatus.deleted;
          await this.dataHelper.deleteCommentV3(comment);
          resolve(comment);
        } else {
          Logger.error(TAG, 'Delete comment data error');
          reject('Delete comment error');
        }
      } catch (error) {
        Logger.error(TAG, 'Delete comment data error', error);
        reject(error);
      }
    });
  }

  //TODO
  backupSubscriptions() {
  }

  restoreSubscriptions() {
  }

  handleCommentResult(targetDid: string, result: any): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!result) {
          reject('Query comment error, result null');
          return;
        }

        const commentList = HiveVaultResultParse.parseCommentResult(targetDid, result);

        if (!commentList || commentList.length == 0) {
          resolve([]);
          return;
        }

        let commentsResult = [];
        for (let index = 0; index < commentList.length; index++) {
          const comment = commentList[index];
          const localComment = await this.dataHelper.getCommentV3ById(comment.postId, comment.commentId);

          if (!localComment) {
            this.dataHelper.addCommentV3(comment);
          } else {
            this.dataHelper.updateCommentV3(comment);
          }
          commentsResult.push(comment);
        }
        resolve(commentsResult);
      } catch (error) {
        Logger.error(TAG, 'Handle comment result error', error);
        reject(error);
      }
    });
  }

  handleLikeResult(destDid: string, result: any): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!result) {
          const errorMsg = 'Handle like result error ,result null';
          reject(errorMsg);
          return;
        }

        const likesResult = HiveVaultResultParse.parseLikeResult(destDid, result);
        if (!likesResult || likesResult.length == 0) {
          resolve([]);
          return;
        }

        let likeList = [];
        for (let index = 0; index < likesResult.length; index++) {
          const element = likesResult[index];
          const localLike = await this.dataHelper.getLikeV3ByUser(element.postId, element.commentId, element.createrDid);
          if (localLike) {
            await this.dataHelper.updateLikeV3(element);
          } else {
            await this.dataHelper.addLikeV3(element);
          }
          likeList.push(element);
        }
        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'Handle like result error', error);
        reject(error);
      }
    });
  }

  getLikeById(destDid: string, channelId: string, postId: string, commentId: string): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryLikeById(destDid, channelId, postId, commentId);
        Logger.log(TAG, 'Get like by id result', result);
        const likeList = await this.handleLikeResult(destDid, result);
        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'Get like by id error', error);
        reject(error);
      }
    });
  }

  getCommentByID(destDid: string, channelId: string, postId: string, commentId: string): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryCommentByID(destDid, channelId, postId, commentId);
        Logger.log(TAG, 'Get comment by id result', result)

        if (result) {
          const commentList = HiveVaultResultParse.parseCommentResult(destDid, result);
          await this.dataHelper.updateCommentsV3(commentList);
          resolve(commentList);
        } else {
          Logger.error(TAG, 'Get comment by id error');
          reject('Get comment by id error');
        }
      } catch (error) {
        Logger.error(TAG, 'Get comment by id data error', error);
        reject(error);
      }
    });
  }

  removePostListByChannel(targetDid: string, channelId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryPostByChannelId(targetDid, channelId);
        Logger.log(TAG, 'Get post from channel result is', result);
        if (result) {
          const postList = HiveVaultResultParse.parsePostResult(targetDid, result.find_message.items);
          for (let postIndex = 0; postIndex < postList.length; postIndex++) {
            let postId = postList[postIndex].postId;
            await this.dataHelper.deletePostData(postId);
          }
          resolve(postList);
        } else {
          const errorMsg = 'remove post from channel error';
          Logger.error(TAG, errorMsg);
          reject(errorMsg);
        }
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  getDisplayName(targetDid: string, channelId: string, userDid: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const displayName = this.dataHelper.getUserDisplayName(targetDid, channelId, userDid);
        if (displayName) {
          resolve(displayName);
          return;
        }

        const result = await this.hiveVaultApi.queryUserDisplayName(targetDid, channelId, userDid);
        Logger.log(TAG, 'Get subscription result is ', result);
        if (result) {
          const subscriptions = HiveVaultResultParse.parseSubscriptionResult(targetDid, result);
          if (subscriptions && subscriptions[0]) {
            const displayName = subscriptions[0].displayName;
            this.dataHelper.cacheUserDisplayName(targetDid, channelId, userDid, displayName);
            resolve(displayName);
            return;
          } else {
            const errorMsg = 'Get subscription error';
            Logger.error(TAG, errorMsg);
            reject(errorMsg);
          }
        } else {
          resolve('UNKNOW');
        }
      } catch (error) {
        Logger.error(TAG, 'Get subscription error', error);
        reject(error);
      }
    });
  }

  getCommentList(postId: string, refCommentId: string): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const commentList = this.dataHelper.getcachedCommentList(postId, refCommentId) || [];

        if (commentList && commentList.length > 0) {
          resolve(commentList);
          return;
        }
        const list = await this.dataHelper.getCommentsV3ByRefId(postId, refCommentId);
        if (list && list.length > 0) {
          this.dataHelper.cacheCommentList(postId, refCommentId, list);
          resolve(list);
        } else {
          //TODO sync data from remote
          resolve([]);
        }
      } catch (error) {
        Logger.error(TAG, 'Get local comment list error', error);
        reject(error);
      }
    });
  }

  getLikeStatus(postId: string, commentId: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        let likedStatus = this.dataHelper.getCachedLikeStatus(postId, commentId);
        console.log("===============likedStatus0", likedStatus);
        if (likedStatus) {
          console.log("===============likedStatus1", likedStatus);
          resolve(likedStatus);
          return;
        }
        const list = await this.dataHelper.getSelfLikeV3(postId, commentId) || '';

        if (list && list.status === FeedsData.PostCommentStatus.available) {
          likedStatus = true;
        } else {
          likedStatus = false;
          //TODO sync data from remote //TODO modify local like sql table ,add status
        }
        this.dataHelper.cacheLikeStatus(postId, commentId, likedStatus);
        resolve(likedStatus);
      } catch (error) {
        Logger.error(TAG, 'Get local like list error', error);
        reject(error);
      }
    });
  }

  getLikeNum(postId: string, commentId: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        let likedNum = this.dataHelper.getCachedLikeNum(postId, commentId);
        if (likedNum) {
          resolve(likedNum);
          return;
        }

        const num = await this.dataHelper.getLikeNum(postId, commentId);
        this.dataHelper.cacheLikeNum(postId, commentId, num);
        //TODO sync data from remote //TODO modify local like sql table ,add status
        resolve(num);
      } catch (error) {
        Logger.error(TAG, 'Get local like number list error', error);
        reject(error);
      }
    });
  }

  getSelfChannel(): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const did = (await this.dataHelper.getSigninData()).did;
        const channelsResult = await this.hiveVaultApi.querySelfChannels();
        Logger.log(TAG, 'Query self channels result', channelsResult);
        if (channelsResult) {
          const parseResult = HiveVaultResultParse.parseChannelResult(did, channelsResult);
          console.log('parseResult', parseResult);
          resolve(parseResult);
        } else {
          reject([]);
        }
      } catch (error) {
        Logger.error(TAG, 'Sync self channel', error);
        reject([]);
      }
    });
  }

  prepareConnection(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.hiveVaultApi.prepareConnection();
        this.eventBus.publish(FeedsEvent.PublishType.authEssentialSuccess);
        resolve('FINISH');
      } catch (error) {
        Logger.error(TAG, 'Prepare Connection error', error);
      }
    });
  }

  checkPostIsLast(destDid: string, channelId: string): FeedsData.PostV3 {
    const post = this.dataHelper.getLastPost(destDid, channelId);
    if (!post) {
      return null;
    }

    //TODO sync post by time
    // this.hiveVaultApi.queryPostByRangeOfTime()
    return post;
  }
}
