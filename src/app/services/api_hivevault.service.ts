import { Injectable } from '@angular/core';
import { HiveService } from 'src/app/services/HiveService';
import { Logger } from './logger';
import { UtilService } from './utilService';
import { DataHelper } from './DataHelper';
import { QueryHasResultCondition, FindExecutable, AndCondition, InsertExecutable } from "@dchagastelles/elastos-hive-js-sdk";
import { VideoService } from './video.service';
import { Events } from 'src/app/services/events.service';
import { Config } from 'src/app/services/config';

const TAG = 'API-HiveVault';
let eventBus: Events = null;

@Injectable()
export class HiveVaultApi {
  public static readonly TABLE_CHANNELS = "channels";
  public static readonly TABLE_POSTS = "posts";
  public static readonly TABLE_SUBSCRIPTIONS = "subscriptions";
  public static readonly TABLE_COMMENTS = "comments";
  public static readonly TABLE_LIKES = "likes";

  public static readonly SCRIPT_ALLPOST = "script_allpost_name";
  public static readonly SCRIPT_SPECIFIED_POST = "script_specified_post_name";
  public static readonly SCRIPT_SOMETIME_POST = "script_sometime_post_name";
  public static readonly SCRIPT_CHANNEL = "script_channel_name";
  public static readonly SCRIPT_COMMENT = "script_comment_name";
  public static readonly SCRIPT_SUBSCRIPTION = "script_subscriptions_name";

  constructor(
    private hiveService: HiveService,
    private dataHelper: DataHelper,
    private events: Events,
  ) {    
    eventBus = events;
  }

  registeScripting() {
    this.registerGetAllPostScripting()
    this.registerGetChannelScripting()
    this.registerGetCommentScripting()
    this.registerSubscriptions()
    // this.registerGetSpecifiedPostScripting()
    // this.registerGetSomeTimePostScripting()
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
        const cId = localStorage.getItem(signinDid + HiveService.postId) || ''
        console.log("cId ====== ", cId)
        const channelId = cId !== '' ? Number(cId) + 1 : 0

        // const channelId = UtilService.SHA256(signinDid + createdAt + 'channel');
        const memo = '';
        console.log("Number(channelId)  ====== ", channelId)
        const doc = await this.insertDataToChannelDB(channelId.toString(), channelName, intro, avatarAddress, memo, createdAt, updatedAt, type, tippingAddress, nft);
        localStorage.setItem(signinDid + HiveService.postId, channelId.toString())
        this.handleResult(
          "create_channel", channelId, signinDid, channelName, 0, doc
        );
        resolve(channelId.toString());
      } catch (error) {
        Logger.error(error);
        reject()
      }
    });
  }

  handleResult(
    method: string,
    channel_id: number,
    userDid: string,
    channleName: string,
    post_id: any,
    request: any,
  ) {
    switch (method) {
      // 在这里存到了本地
      case FeedsData.MethodType.create_channel:
        this.handleCreateChannelResult(channel_id, userDid, post_id, channleName, request);
        break;
    }
  }
  handleCreateChannelResult(
    channel_id: number,
    userDid: string,
    post_id: any,
    channleName: string,
    request: any
  ) {
    // let channel_id = result.channel_id;
    let created_at = request.created_at;
    let updated_at = request.updated_at;
    let name = request.name;
    let introduction = request.intro;
    let avatar = request.avatar;
    let memo = request.memo;
    let type = request.type;

    let channelId = channel_id
    // let channelName = channleName
    let channelIntro = request.intro
    console.log("channelId ===== ", channelId)
    // let avatar = this.serializeDataService.decodeData(avatarBin);
    let nodeChannelId = userDid + HiveVaultApi.TABLE_CHANNELS

    let channel: FeedsData.Channels = {
      channel_id: channel_id,
      created_at: created_at,
      updated_at: updated_at,
      name: name,
      introduction: introduction,
      avatar: avatar,
      memo: memo,
      type: type,

      nodeId: nodeChannelId,
      id: 0,
      // name: channelName,
      // introduction: channelIntro,
      owner_name: "",
      owner_did: "",
      subscribers: 0,
      last_update: new Date().getTime(),
      last_post: '', 
      // avatar: avatar,
      isSubscribed: false,
    };
    this.dataHelper.updateChannel(channelId.toString(), channel)
    console.log("userDid + HiveService.postId" + userDid + HiveService.postId + channelId.toString());
    localStorage.setItem(userDid + HiveService.postId, channelId.toString())

    let createTopicSuccessData: FeedsEvent.CreateTopicSuccessData = {
      nodeId: userDid,
      channelId: channelId,
    };

    eventBus.publish(
      FeedsEvent.PublishType.createTopicSuccess,
      createTopicSuccessData,
    );

    eventBus.publish(FeedsEvent.PublishType.channelsDataUpdate);
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
    createdAt: number, updatedAt: number, type: string, tippingAddress: string, nft: string): Promise<any> {
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
        const insertResult = this.hiveService.insertDBData(HiveVaultApi.TABLE_CHANNELS, doc);
        Logger.log(TAG, 'Insert channel db result', insertResult);
        //TODO resolve result
        resolve(doc);
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
    let conditionfilter = { "channel_id": "$params.channel_id", "user_did": "$caller_did" }
    const executable = new FindExecutable("find_message", HiveVaultApi.TABLE_CHANNELS, executablefilter, options).setOutput(true)
    const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultApi.SCRIPT_SUBSCRIPTION, conditionfilter, null)
    console.log("registerGetChannelScripting ====== ")
    return this.hiveService.registerScript(HiveVaultApi.SCRIPT_CHANNEL, executable, condition, false)
  }
  //  查询指定post内容
  //API
  //Post
  //Register Get
  registerGetSpecifiedPostScripting(): Promise<void> {
    let executablefilter = { "channel_id": "$params.channel_id", "post_id": "$params.post_id" }
    let options = { "projection": { "_id": false }, "limit": 100 }
    let conditionfilter1 = { "channel_id": "$params.channel_id", "user_did": "$caller_did" }
    let conditionfilter2 = { "channel_id": "$params.channel_id", "post_id": "$params.post_id", "type": "public" }
    let queryCondition1 = new QueryHasResultCondition("subscription_permission", HiveVaultApi.TABLE_SUBSCRIPTIONS, conditionfilter1, null)
    let queryCondition2 = new QueryHasResultCondition("post_permission", HiveVaultApi.TABLE_POSTS, conditionfilter2, null)
    let andCondition = new AndCondition("verify_user_permission", [queryCondition1, queryCondition2])
    let findExe = new FindExecutable("find_message", HiveVaultApi.TABLE_POSTS, executablefilter, options).setOutput(true)
    console.log("registerGetPostScripting ====== ")
    return this.hiveService.registerScript(HiveVaultApi.SCRIPT_SPECIFIED_POST, findExe, andCondition, false, false)
  }

  // 查询channel下所有post
  //API
  //Post
  //Register Get
  registerGetAllPostScripting(): Promise<void> {
    let executablefilter = { "channel_id": "$params.channel_id" }
    let options = { "projection": { "_id": false }, "limit": 100 }
    let conditionfilter = { "channel_id": "$params.channel_id", "user_did": "$caller_did" }
    let queryCondition = new QueryHasResultCondition("verify_user_permission", HiveVaultApi.TABLE_SUBSCRIPTIONS, conditionfilter, null)
    let findExe = new FindExecutable("find_message", HiveVaultApi.TABLE_POSTS, executablefilter, options).setOutput(true)
    console.log("registerGetAllPostScripting ====== ")
    return this.hiveService.registerScript(HiveVaultApi.SCRIPT_ALLPOST, findExe, queryCondition, false, false)
  }

  // 查询时间段的内容
  //API
  //Post
  //Register Get
  registerGetSomeTimePostScripting() {
    let executablefilter = { "channel_id": "$params.channel_id", "post_id": "$params.post_id", "update_at": { "$gt": "$params.start", "$lt": "$params.end" } }
    let options = { "projection": { "_id": false }, "limit": 100 }
    let conditionfilter = { "channel_id": "$params.channel_id", "user_did": "$caller_did" }
    let queryCondition = new QueryHasResultCondition("verify_user_permission", HiveVaultApi.TABLE_SUBSCRIPTIONS, conditionfilter, null)
    let findExe = new FindExecutable("find_message", HiveVaultApi.TABLE_POSTS, executablefilter, options).setOutput(true)
    console.log("registerGetSomeTimePostScripting ====== ")
    return this.hiveService.registerScript(HiveVaultApi.SCRIPT_SOMETIME_POST, findExe, queryCondition, false, false)
  }

  // 注册订阅
  registerSubscriptions(): Promise<void> {
    // let document = { "channel_id": "$params.channel_id", "user_did": "$caller_did", "display_name": "$params.display_name" }
    let document = { "channel_id": "$params.channel_id", "user_did": "$caller_did", "created_at": "$params.created_at", "display_name": "$params.display_name" }
    let options = { "projection": { "_id": false } }
    let conditionfilter = { "channel_id": "$params.channel_id", "type": "public" }
    console.log("registerSubscriptions ====== ")
    // 此nama与订阅频道无关，可随意取，保持在vault中唯一即可
    return this.hiveService.registerScript(HiveVaultApi.SCRIPT_SUBSCRIPTION, new InsertExecutable("database_insert", HiveVaultApi.TABLE_SUBSCRIPTIONS, document, options), new QueryHasResultCondition("verify_user_permission", HiveVaultApi.TABLE_CHANNELS, conditionfilter, null))
  }

  //订阅者调用
  callSubscription(channelId: string, channelName: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let userDid = (await this.dataHelper.getSigninData()).did
        let appid = Config.APPLICATION_DID
        console.log("appid ===== ", appid)
        console.log("userDid ===== ", userDid)
        const timeStamp = new Date().getTime().toString()
        const doc = { "channel_id": channelId, "display_name": channelName, "created_at": timeStamp, "user_did": userDid }
        const result = await this.hiveService.callScript(HiveVaultApi.SCRIPT_SUBSCRIPTION, doc, userDid, appid)
        resolve(result)
      } catch (error) {
        Logger.error(TAG, 'callSubscription error:', error)
        reject(error)
      }
    })
  }

   //获得订阅的channel列表
  async getHomePostContent() {

    const channelIds = await this.getSubscriptChannelId()
    // 获得订阅的post
  }

  getSubscriptChannelId(): Promise<void> {
    return this.listSubscriptDB()
  }

  listSubscriptDB(): Promise<void> {
    const query = {}
    return this.hiveService.findPostDB(HiveVaultApi.TABLE_SUBSCRIPTIONS, query)
  }

  // 查询指定的post
  //API
  //Post
  //Call Get
  callGetSpecifiedPostScripting(channelId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let userDid = (await this.dataHelper.getSigninData()).did
        let appid = Config.APPLICATION_DID
        console.log("appid ===== ", appid)
        console.log("userDid ===== ", userDid)
        let result = await this.hiveService.callScript(HiveVaultApi.SCRIPT_SPECIFIED_POST, { "channel_id": channelId }, userDid, appid)
        console.log("callChannel result ======= ", result)
        resolve()
      } catch (error) {
        Logger.error(TAG, 'call Post error:', error)
        reject(error)
      }
    })
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
