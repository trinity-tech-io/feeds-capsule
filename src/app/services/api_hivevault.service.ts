import { Injectable } from '@angular/core';
import { HiveService } from 'src/app/services/HiveService';
import { Logger } from './logger';
import { UtilService } from './utilService';
import { DataHelper } from './DataHelper';
import { QueryHasResultCondition, FindExecutable, AndCondition, InsertExecutable } from "@dchagastelles/elastos-hive-js-sdk";
import { VideoService } from './video.service';

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
    this.registerGetCommentScripting()
    this.registerGetPostScripting()
    this.registerGetAllPostScripting()
    this.registerGetChannelScripting()
    this.registerGetCommentScripting()
    this.registerGetPostScripting()
    this.registerGetSomeTimePostScripting()
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
        resolve("true")
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

  // 查询channel信息
  registerGetChannelScripting(): Promise<void> {
    let executablefilter = { "channel_id": "$params.channel_id" }
    let options = { "projection": { "_id": false }, "limit": 100 }
    let userDid = (await this.dataHelper.getSigninData()).did
    let conditionfilter = { "channel_id": "$params.channel_id", "user_did": "$caller_did" }
    const timeStamp = new Date().getTime().toString()
    const executable = new FindExecutable("find_message", HiveService.CHANNEL, executablefilter, options).setOutput(true)
    const condition = new QueryHasResultCondition("verify_user_permission", HiveService.SUBSCRIPTION, conditionfilter, null)
    console.log("registerGetChannelScripting ====== ")
    return this.hiveService.registerChannel(timeStamp, executable, condition, false)
  }
  //  查询指定post内容
  //API
  //Post
  //Register Get
  registerGetPostScripting(): Promise<void> {
    let executablefilter = { "channel_id": "$params.channel_id", "post_id": "$params.post_id" }
    let options = { "projection": { "_id": false }, "limit": 100 }
    let conditionfilter1 = { "channel_id": "$params.channel_id", "user_did": "$caller_did" }
    let conditionfilter2 = { "channel_id": "$params.channel_id", "post_id": "$params.post_id", "type": "public" }
    let timeStamp = new Date().getTime().toString()
    let queryCondition1 = new QueryHasResultCondition("subscription_permission", HiveService.SUBSCRIPTION, conditionfilter1, null)
    let queryCondition2 = new QueryHasResultCondition("post_permission", HiveService.POST, conditionfilter2, null)
    let andCondition = new AndCondition("verify_user_permission", [queryCondition1, queryCondition2])
    let findExe = new FindExecutable("find_message", HiveService.POST, executablefilter, options).setOutput(true)
    console.log("registerGetPostScripting ====== ")
    return this.hiveService.registerPost(timeStamp, findExe, andCondition, false, false)
  }

  // 查询channel下所有post
  //API
  //Post
  //Register Get
  registerGetAllPostScripting(): Promise<void> {
    let executablefilter = { "channel_id": "$params.channel_id" }
    let options = { "projection": { "_id": false }, "limit": 100 }
    let conditionfilter = { "channel_id": "$params.channel_id", "user_did": "$caller_did" }
    let timeStamp = new Date().getTime().toString()
    let queryCondition = new QueryHasResultCondition("verify_user_permission", HiveService.SUBSCRIPTION, conditionfilter, null)
    let findExe = new FindExecutable("find_message", HiveService.POST, executablefilter, options).setOutput(true)
    console.log("registerGetAllPostScripting ====== ")
    return this.hiveService.registerAllPost(timeStamp, findExe, queryCondition, false, false)
  }

  // 查询时间段的内容
  //API
  //Post
  //Register Get
  registerGetSomeTimePostScripting() {
    let executablefilter = { "channel_id": "$params.channel_id", "post_id": "$params.post_id", "update_at": { "$gt": "$params.start", "$lt": "$params.end" } }
    let options = { "projection": { "_id": false }, "limit": 100 }
    let conditionfilter = { "channel_id": "$params.channel_id", "user_did": "$caller_did" }
    let timeStamp = new Date().getTime().toString()
    let queryCondition = new QueryHasResultCondition("verify_user_permission", HiveService.SUBSCRIPTION, conditionfilter, null)
    let findExe = new FindExecutable("find_message", HiveService.POST, executablefilter, options).setOutput(true)
    console.log("registerGetSomeTimePostScripting ====== ")
    return this.hiveService.registerSomeTimePost(timeStamp, findExe, queryCondition, false, false)
  }

  // 注册订阅
  registerSubscriptions(): Promise<void> {
    let document = { "channel_id": "$params.channel_id", "user_did": "$caller_did", "created_at": "$params.created_at", "display_name": "$params.display_name" }
    let options = { "projection": { "_id": false } }
    let conditionfilter = { "channel_id": "$params.channel_id", "type": "public" }
    console.log("registerSubscriptions ====== ")
    let timeStamp = new Date().getTime().toString()
    // 此nama与订阅频道无关，可随意取，保持在vault中唯一即可，此处为确定唯一使用时间戳
    return this.hiveService.registerSubscriptions(timeStamp, new InsertExecutable("database_insert", HiveService.SUBSCRIPTION, document, options), new QueryHasResultCondition("verify_user_permission", HiveService.CHANNEL, conditionfilter, null))
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
