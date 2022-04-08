import { Injectable } from '@angular/core';
import { HiveVaultApi } from 'src/app/services/hivevault_api.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { Events } from 'src/app/services/events.service';
import { PostHelperService } from 'src/app/services/post_helper.service';
import { UtilService } from 'src/app/services/utilService';
import { Logger } from './logger';
import { HiveVaultResultParse } from './hivevault_resultparse.service';

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
        if (subscribedChannels.length === 0) {
          this.dataHelper.setPostMapV3({});
          await this.dataHelper.saveData(FeedsData.PersistenceKey.postsMapV3, {});
          resolve('FINISH');
        }
        let postMapV3 = {};
        for (let index = 0; index < subscribedChannels.length; index++) {
          const item = subscribedChannels[index];

          const channelId = item.channelId
          const destDid = item.destDid

          const posts = await this.getPostListByChannel(destDid, channelId);

          for (let index = 0; index < posts.length; index++) {
            const post: FeedsData.PostV3 = posts[index];
            const key = UtilService.getKey(post.destDid, post.postId);
            postMapV3[key] = post;
            //await this.dataHelper.addPostV3(post);
          }
          this.dataHelper.setPostMapV3(postMapV3);
          await this.dataHelper.saveData(FeedsData.PersistenceKey.postsMapV3, postMapV3);
        }
        resolve('FINISH');
      } catch (error) {
        Logger.error(TAG, 'Get all subscribed channel post error', error);
        reject(error);
      }

    });
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
        const subscribedChannels = await this.dataHelper.getSubscribedChannelV3List();
        if (!subscribedChannels) {
          resolve([]);
          return;
        }

        for (let index = 0; index < subscribedChannels.length; index++) {
          const subscribedChannel = subscribedChannels[index];
          const destDid = subscribedChannel.destDid;
          const channelId = subscribedChannel.channelId;

          await this.queryCommentByChannel(destDid, channelId);
        }
      } catch (error) {
        Logger.error(TAG, 'Sync all comment error', error);
        reject(error);
      }
    });
  }

  syncAllLikes(): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
    });
  }

  syncPostFromChannel(destDid: string, channelId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const selfDid = (await this.dataHelper.getSigninData()).did;
        let postList = [];
        if (destDid == selfDid) {
          const posts = await this.syncSelfPostsByChannel(channelId);
          postList.push(posts);
        } else {
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

        await this.dataHelper.addCommentsV3(commentList);
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
        const likeList = HiveVaultResultParse.parseLikeResult(destDid, result);

        await this.dataHelper.addLikesV3(likeList);
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

          const channel = await this.getChannelInfoById(destDid, channelId);
          channelList.push(channel);
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

          const channel = await this.getSubscriptionInfoByChannel(destDid, channelId);
          subscribedChannelList.push(channel);
        }

        resolve(subscribedChannelList);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  getSubscriptionInfoByChannel(targetDid: string, channelId: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.querySubscrptionInfoByChannelId(targetDid, channelId);
        const subscriptionList = HiveVaultResultParse.parseSubscriptionResult(targetDid, result);

        this.dataHelper.addSubscriptionsV3Data(subscriptionList);
        resolve(subscriptionList);
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

  async queryPostByPostId(targetDid: string, channelId: string, postId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      const result = await this.hiveVaultApi.queryPostById(targetDid, channelId, postId)
      const posts = HiveVaultResultParse.parsePostResult(targetDid, result.find_message.items);

      this.dataHelper.addPostsV3(posts);
    });
  }

  getPostListByChannel(targetDid: string, channelId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryPostByChannelId(targetDid, channelId);
        Logger.log(TAG, 'Get post from channel result is', result);
        if (result) {
          const postList = HiveVaultResultParse.parsePostResult(targetDid, result.find_message.items);
          this.dataHelper.updatePostsV3(postList);
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

  getChannelInfoById(targetDid: string, channelId: string): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryChannelInfo(targetDid, channelId)
        const channelList = HiveVaultResultParse.parseChannelResult(targetDid, result['find_message']['items']);

        this.dataHelper.addChannelsV3(channelList)
        resolve(channelList);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  queryCommentByChannel(targetDid: string, channelId: string): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = this.hiveVaultApi.queryCommentByChannel(targetDid, channelId);
        Logger.log(TAG, 'Query comment from channel, result is', result);
        if (result) {
          const commentList = HiveVaultResultParse.parseCommentResult(targetDid, result);

          this.dataHelper.updateCommentsV3(commentList);
          resolve(commentList);
        } else {
          const errorMsg = 'Query comment from channel error';
          Logger.error(TAG, errorMsg);
        }
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
      } catch (error) {
        await this.hiveVaultApi.registeScripting()
        localStorage.setItem(callerDid + HiveVaultController.CREATEALLCollECTION, "true")
      }
    }
  }

  createChannel(channelName: string, intro: string, avatarAddress: string, tippingAddress: string = '', type: string = 'public', nft: string = '', memo: string = '', category: string = '', proof: string = ''): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
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
        //console.log("create channelId ==== ", channelId)
        await this.dataHelper.updateChannelV3(channelV3);
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

  subscribeChannel(targetDid: string, channelId: string, userDisplayName: string): Promise<{ targetDid: string, channelId: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.subscribeChannel(targetDid, channelId, userDisplayName);
        if (result) {
          await this.dataHelper.addSubscribedChannelV3(targetDid, channelId);
          const result = await this.dataHelper.getSubscribedChannelV3List();
          console.log("result ===== ", result)
          resolve({ targetDid: targetDid, channelId: channelId });
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

  syncSelfChannel(): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const did = (await this.dataHelper.getSigninData()).did;
        const channelsResult = await this.hiveVaultApi.querySelfChannels();
        Logger.log(TAG, 'Query self channels result', channelsResult);
        if (channelsResult) {
          const parseResult = HiveVaultResultParse.parseChannelResult(did, channelsResult);
          console.log('parseResult', parseResult);
          await this.dataHelper.updateChannelsV3(parseResult);
          resolve(parseResult);
        } else {
          reject('Sync self channels error');
        }
      } catch (error) {
        Logger.error(TAG, 'Sync self channel', error);
        reject(error);
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
          await this.dataHelper.addPostsV3(parseResult);
          console.log('parseResult', parseResult);
          resolve(parseResult);
        } else {
          reject('Sync self posts by channel error');
        }

      } catch (error) {
        Logger.error(TAG, 'Sync self post by channel', error);
        reject(error);
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
          const parseResult = HiveVaultResultParse.parseCommentResult(destDid, commentResult);
          console.log('getCommentsByPost parseResult', parseResult);

          this.dataHelper.updateCommentsV3(parseResult);
          resolve(parseResult);
        } else {
          reject('Query comment by post error');
        }
      } catch (error) {
        Logger.error(TAG, 'Query comments by post error', error);
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

  removeLike(destDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
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

  getLike(destDid: string, channelId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryLikeByChannel(destDid, channelId);
        console.log('get like result', result);
        resolve(result);
        //TODO
        // this.dataHelper.removeLikeV3();
      } catch (error) {
        reject([]);
        Logger.error(TAG, 'Get like data error', error);
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

  getLikeById(destDid: string, channelId: string, postId: string, commentId: string): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryLikeById(destDid, channelId, postId, commentId);
        Logger.log(TAG, 'Get like by id result', result);

        if (result) {
          const likeList = HiveVaultResultParse.parseLikeResult(destDid, result);
          await this.dataHelper.updateLikesV3(likeList);
          resolve(likeList);
        } else {
          Logger.error(TAG, 'Get like by id error');
          reject('Get like by id error');
        }
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

}