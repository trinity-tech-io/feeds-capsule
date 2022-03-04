import { Injectable } from '@angular/core';
import { HiveService } from 'src/app/services/HiveService';
import { Logger } from './logger';
import { UtilService } from './utilService';
import { DataHelper } from './DataHelper';

const TAG = 'API-HiveVault';

@Injectable()
export class HiveVaultApi {
  public static readonly TABLE_CHANNELS = "channels";
  public static readonly TABLE_POSTS = "posts";
  public static readonly TABLE_SUBSCRIPTIONS = "subscriptions";
  public static readonly TABLE_COMMENTS = "comments";
  public static readonly TABLE_LIKES = "likes";

  constructor(
    private hiveService: HiveService,
    private dataHelper: DataHelper
  ) {
  }

  registeScripting() {
    this.registerGetCommentScripting();
    this.registerGetPostScripting();
  }

  //API
  createCollection(collectName: string): Promise<void> {
    return this.hiveService.createCollection(collectName);
  }

  createAllCollections(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.createCollection(HiveVaultApi.TABLE_CHANNELS);
        await this.createCollection(HiveVaultApi.TABLE_POSTS);
        await this.createCollection(HiveVaultApi.TABLE_SUBSCRIPTIONS);
        await this.createCollection(HiveVaultApi.TABLE_COMMENTS);
        await this.createCollection(HiveVaultApi.TABLE_LIKES);
      } catch (error) {
        Logger.error(TAG, 'create Collections error', error);
        reject(error)
      }
    });
  }

  //tipping_address:
  // {
  //   "tipping_address": [
  //     {
  //       "type": "ELA",
  //       "address": "ELA-address"
  //     },
  //     {
  //       "type": "xxx",
  //       "address": "xxx"
  //     }
  //   ]
  // }
  createChannel(channelName: string, intro: string, avatarAddress: string, tippingAddress: string = '', type: string = 'public', nft: string = ''): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const signinDid = (await this.dataHelper.getSigninData()).did;

        const createdAt = UtilService.getCurrentTimeNum();
        const updatedAt = UtilService.getCurrentTimeNum();
        const channelId = UtilService.SHA256(signinDid + createdAt + 'channel');
        const memo = '';

        await this.insertDataToChannelDB(channelId, channelName, intro, avatarAddress, memo, createdAt, updatedAt, type, tippingAddress, nft);
        resolve(channelId);
      } catch (error) {
        Logger.error(error);
        reject()
      }
    });
  }

  publishPost(channelId: string, tag: string, content: string, type: string = 'public', status: number = FeedsData.PostCommentStatus.available) {
    return new Promise(async (resolve, reject) => {
      try {
        const signinDid = (await this.dataHelper.getSigninData()).did;

        const createdAt = UtilService.getCurrentTimeNum();
        const updatedAt = UtilService.getCurrentTimeNum();
        const postId = UtilService.SHA256(signinDid + createdAt + 'post');
        const memo = '';

        await this.insertDataToPostDB(postId, channelId, type, tag, content, memo, createdAt, updatedAt, status);
        resolve(postId);
      } catch (error) {
        Logger.error(error);
        reject()
      }
    });
  }

  publishComment(channelId: string, postId: string, refcommentId: string, content: string, createrDid: string, status: number = FeedsData.PostCommentStatus.available) {
    return new Promise(async (resolve, reject) => {
      try {
        const signinDid = (await this.dataHelper.getSigninData()).did;

        const createdAt = UtilService.getCurrentTimeNum();
        const updatedAt = UtilService.getCurrentTimeNum();
        const commentId = UtilService.SHA256(signinDid + createdAt + 'comment');
        const memo = '';

        await this.insertDataToCommentDB(commentId, channelId, postId, refcommentId, content, memo, createdAt, updatedAt, status, createrDid);
        resolve(postId);
      } catch (error) {
        Logger.error(error);
        reject()
      }
    });
  }

  //API
  //Channel
  //Insert
  insertDataToChannelDB(channelId: string, name: string, intro: string, avatar: string, memo: string,
    createdAt: number, updatedAt: number, type: string, tippingAddress: string, nft: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const doc = {
        "channel_id": channelId,
        "name": name,
        "intro": intro,
        "avatar": avatar,
        "created_at": createdAt,
        "updated_at": updatedAt,
        "type": type,
        "tipping_address": tippingAddress,
        "nft": nft,
        "memo": memo,
      }

      try {
        const insertResult = this.hiveService.insertDBData(TAG, doc);
        Logger.log(TAG, 'Insert channel db result', insertResult);
        //TODO resolve result
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Insert channel db error', error);
        reject(error)
      }
    });
  }

  //API
  //Channel
  //Update
  updateDataToChannelDB() {

  }

  //API
  //Post
  //insert
  insertDataToPostDB(postId: string, channelId: string, type: string, tag: string, content: string, memo: string, createdAt: number, updateAt: number, status: number): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const doc =
      {
        "channel_id": channelId,
        "post_id": postId,
        "created_at": createdAt,
        "updated_at": updateAt,
        "content": content,
        "status": status,
        "memo": memo,
        "type": type,
        "tag": tag
      }

      try {
        const insertResult = this.hiveService.insertDBData(HiveVaultApi.TABLE_CHANNELS, doc)
        Logger.log(TAG, 'insert postData result', insertResult);
        //TODO resolve result
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'insertDataToPostDB error', error);
        reject(error);
      }
    });
  }

  //API
  //Post
  //Update
  updateDataToPostDB() {
  }

  //API
  //Post
  //Delete
  deleteDataFromPostDB() {
  }

  //API
  //Post
  //Register Get
  registerGetPostScripting() {

  }

  //API
  //Post
  //Call Get
  callGetPostScripting() {

  }

  //API
  //Comment
  //Update
  insertDataToCommentDB(commentId: string, channelId: string, postId: string, refcommentId: string, content: string, memo: any, createdAt: number, updatedAt: number, status: number, createrDid: string) {
    return new Promise(async (resolve, reject) => {

      const doc =
      {
        "comment_id": commentId,
        "channel_id": channelId,
        "post_id": postId,
        "refcomment_id": refcommentId,
        "content": content,
        "status": status,
        "created_at": createdAt,
        "updated_at": updatedAt,
        "memo": memo,
        "creater_did": createrDid
      }

      try {
        const insertResult = this.hiveService.insertDBData(HiveVaultApi.TABLE_CHANNELS, doc)
        Logger.log(TAG, 'insert postData result', insertResult);
        //TODO resolve result
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'insertDataToPostDB error', error);
        reject(error);
      }
    });
  }


  private registerGetCommentScripting() {
  }

  callGetCommentScripting() {
  }

  createComment() {
  }

  updateComment() {
  }

  deleteComment() {
  }

}
