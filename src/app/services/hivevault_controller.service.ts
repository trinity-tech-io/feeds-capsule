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
    private eventBus: Events,
  ) {
  }

  publishPost(channelId: string, postText: string, imagesBase64: string[], videoData: FeedsData.videoData, tag: string, type: string = 'public', status: number = FeedsData.PostCommentStatus.available, memo: string = '', proof: string = '', createdAt: number, updatedAt: number): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const content = await this.progressMediaData(postText, imagesBase64, videoData)
        const contentStr = JSON.stringify(content);

        const signinDid = (await this.dataHelper.getSigninData()).did;

        const postId = UtilService.generatePostId(signinDid, channelId, contentStr);

        const queryPostResult = await this.hiveVaultApi.queryPostById(signinDid, channelId, postId);
        const resultList = HiveVaultResultParse.parsePostResult(signinDid, queryPostResult);

        let result = null;
        if (!resultList || resultList.length == 0) {
          result = await this.hiveVaultApi.publishPost(postId, channelId, tag, contentStr, type, status, memo, proof, createdAt, updatedAt);
          Logger.log(TAG, "Publish new post , result is", result);
        } else {
          result = await this.hiveVaultApi.updatePost(postId, channelId, type, tag, contentStr, status, updatedAt, memo, proof);
          Logger.log(TAG, "Update post , result is", result);
        }

        if (!result) {
          const errorMsg = 'Publish new post error';
          Logger.error(TAG, errorMsg);
          reject(errorMsg)
          return;
        }
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Publish post error', error);
        reject(error);
      }
    });
  }

  public updatePost(originPost: FeedsData.PostV3, newContent: FeedsData.postContentV3, newType: string = 'public', newTag: string, newStatus: number = FeedsData.PostCommentStatus.edited, newMemo: string = '', newProof: string = ''): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const newUpdateAt = UtilService.getCurrentTimeNum();
        const result = await this.hiveVaultApi.updatePost(originPost.postId, originPost.channelId, newType, newTag, JSON.stringify(newContent), newStatus, newUpdateAt, newMemo, newProof);
        if (!result) {
          const errorMsg = 'Update post error';
          Logger.error(TAG, errorMsg);
          reject(errorMsg);
        }
        resolve('SUCCESS');
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
    try {
      await this.hiveVaultApi.createAllCollections()
    } catch (error) {
      // ignore
    }
    await this.hiveVaultApi.registeScripting()
  }

  createChannel(channelName: string, intro: string, avatarAddress: string, tippingAddress: string = '', type: string = 'public', nft: string = '', memo: string = '', category: string = '', proof: string = ''): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        //check local store
        const targetDid = (await this.dataHelper.getSigninData()).did;
        const channelId = UtilService.generateChannelId(targetDid, channelName);

        // 处理avatar
        const avatarHiveURL = await this.hiveVaultApi.uploadMediaDataWithString(avatarAddress);
        const insertResult = await this.hiveVaultApi.createChannel(channelName, intro, avatarHiveURL, tippingAddress, type, nft, memo, category, proof)
        resolve('SUCESS');
      } catch (error) {
        reject(error)
      }
    });
  }

  async updateChannel(channelId: string, channelName: string, intro: string, avatarAddress: string, tippingAddress: string = '', type: string = 'public', nft: string = '', proof: string = '', category: string = '', memo: string = ''): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // 处理avatar
        const signinDid = (await this.dataHelper.getSigninData()).did;
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
        }

        if (tippingAddress) {
          finalTippingAddress = tippingAddress;
        }

        if (channelName) {
          finalName = channelName;
        }

        if (intro) {
          finalIntro = intro;
        }

        if (type) {
          finalType = type;
        }

        if (nft) {
          finalNft = nft;
        }

        if (memo) {
          finalMemo = memo;
        }

        if (proof) {
          finalProof = proof;
        }
        const result = await this.hiveVaultApi.updateChannel(channelId, finalName, finalIntro, avatarHiveURL, finalType, finalMemo, finalTippingAddress, finalNft);

        if (!result) {
          resolve(null);
          return;
        }

        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Update channel error', error);
        reject(error)
      }
    });
  }

  subscribeChannel(targetDid: string, channelId: string, userDisplayName: string = ''): Promise<string> {
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
        if (!result) {
          const errorMsg = 'Subscribe channel error, destDid is' + targetDid + 'channelId is' + channelId;
          Logger.error(TAG, errorMsg);
          reject(errorMsg);
        }

        resolve("SUCCESS");
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

  createComment(destDid: string, channelId: string, postId: string, refcommentId: string, content: any): Promise<FeedsData.CommentV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.createComment(destDid, channelId, postId, refcommentId, content);
        Logger.log('createComment result', result);

        if (!result) {
          resolve(null);
          return;
        }
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


        resolve(comment);
      } catch (error) {
        Logger.error(TAG, 'Create comment error', error);
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
        const likeId = UtilService.generateLikeId(postId, commentId, createrDid);

        const result = await this.hiveVaultApi.querySelfLikeById(destDid, channelId, likeId);
        const likeList = await this.handleLikeResult(destDid, result) || [];

        let like = likeList[0];
        let updatedAt = 0;
        let createdAt = 0;

        if (like) {
          const updateResult = await this.hiveVaultApi.updateLike(destDid, likeId, FeedsData.PostCommentStatus.available);
          createdAt = like.createdAt;
          updatedAt = updateResult.updatedAt;
        } else {
          const addResult = await this.hiveVaultApi.addLike(destDid, likeId, channelId, postId, commentId);
          createdAt = addResult.createdAt;
          updatedAt = createdAt;
        }

        Logger.log('like result', result);
        if (result) {
          const like: FeedsData.LikeV3 = {
            likeId: likeId,

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

  handleChannelResult(targetDid: string, result: any): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!result) {
          resolve([]);
          return;
        }

        const channelList = HiveVaultResultParse.parseChannelResult(targetDid, result);
        if (!channelList || channelList.length == 0) {
          resolve([]);
          return;
        }

        resolve(channelList);
      } catch (error) {
        Logger.error(TAG, 'Handle comment result error', error);
        reject(error);
      }
    });
  }

  handleCommentResult(targetDid: string, result: any): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!result) {
          resolve([]);
          return;
        }

        const commentList = HiveVaultResultParse.parseCommentResult(targetDid, result);
        if (!commentList || commentList.length == 0) {
          resolve([]);
          return;
        }

        resolve(commentList);
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

        const likeList = HiveVaultResultParse.parseLikeResult(destDid, result);
        if (!likeList || likeList.length == 0) {
          resolve([]);
          return;
        }
        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'Handle like result error', error);
        reject(error);
      }
    });
  }




  backupSubscribedChannel(targetDid: string, channelId: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.hiveVaultApi.backupSubscribedChannel(targetDid, channelId);
        resolve('FINISH');
      } catch (error) {
        Logger.error(TAG, 'Backup subscribed channel error', error);
        reject(error);
      }
    });
  }
}
