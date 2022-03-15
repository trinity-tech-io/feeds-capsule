import { Injectable } from '@angular/core';
import { HiveService } from 'src/app/services/HiveService';
import { Logger } from './logger';
import { UtilService } from './utilService';
import { DataHelper } from './DataHelper';
import { QueryHasResultCondition, FindExecutable, AndCondition, InsertExecutable, UpdateExecutable, DeleteExecutable, UpdateResult, UpdateOptions, DeleteOptions, FileDownloadExecutable } from "@dchagastelles/elastos-hive-js-sdk";
import { VideoService } from './video.service';
import { Events } from 'src/app/services/events.service';
import { Config } from 'src/app/services/config';
import { JSONObject } from '@elastosfoundation/did-js-sdk/typings';
import { InsertResult } from '@dchagastelles/elastos-hive-js-sdk/typings/restclient/database/insertresult';

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

  public static readonly SCRIPT_CREATE_COMMENT = "script_create_comment";
  public static readonly SCRIPT_UPDATE_COMMENT = "script_update_comment";
  public static readonly SCRIPT_FIND_COMMENT = "script_find_comment";
  public static readonly SCRIPT_DELETE_COMMENT = "script_delete_comment";
  public static readonly SCRIPT_FIND_COMMENT_BY_POSTID = "script_find_comment_by_postid";
  public static readonly SCRIPT_FIND_COMMENT_BY_COMMENTID = "script_find_comment_by_commentid";

  public static readonly SCRIPT_CREATE_LIKE = "script_add_like";
  public static readonly SCRIPT_REMOVE_LIKE = "script_remove_like";
  public static readonly SCRIPT_FIND_LIKE_BY_ID = "script_find_like_by_id";

  public static readonly SCRIPT_FIND_SUBSCRIPTION_BY_ID = "script_find_subscription_by_id";

  constructor(
    private hiveService: HiveService,
    private dataHelper: DataHelper,
    private events: Events,
  ) {
    eventBus = events;
  }

  registeScripting(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        //channel
        await this.registerGetChannelScripting();

        //post
        this.registerGetAllPostScripting();
        this.registerGetSomeTimePostScripting();
        this.registerGetSpecifiedPostScripting();

        //subscription
        await this.registerSubscriptions();
        await this.registerFindSubscriptionByIdScripting();

        //comment
        await this.registerCreateCommentScripting();
        await this.registerFindCommentScriptingByCommentId();
        await this.registerFindCommentScriptingByPostId();
        await this.registerUpdateCommentScripting();
        await this.registerDeleteCommentScripting();

        //like
        await this.registerCreateLikeScripting();
        await this.registerFindLikeByIdScripting();
        await this.registerRemoveLikeScripting();
        resolve('FINISH');
      } catch (error) {
        Logger.error(error);
      }
    });
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

        // const channelId = UtilService.generateChannelId(signinDid);
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
        const postId = UtilService.generatePostId(signinDid);
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
        const commentId = UtilService.generateCommentId(signinDid);
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
        Logger.log(TAG, 'Insert channel db result', insertResult)
        resolve(doc)
      } catch (error) {
        Logger.error(TAG, 'Insert channel db error', error)
        reject(error)
      }
    })
  }

  //API
  //Channel
  //Update
  updateDataToChannelDB(channelId: string, newName: string, newIntro: string, newAvatar: string, newType: string, newMemo: string,
    newTippingAddress: string, newNft: string): Promise<UpdateResult> {
    return new Promise(async (resolve, reject) => {
      const channel = this.dataHelper.getChannel(channelId.toString())
      const updated_at = new Date().getTime().toString()
      const doc = {
        "channel_id": channelId,
        "name": newName,
        "intro": newIntro,
        "avatar": newAvatar,
        "created_at": channel.created_at,
        "updated_at": updated_at,
        "type": newType,
        "tipping_address": newTippingAddress,
        "nft": newNft,
        "memo": newMemo,
      }
      const option = new UpdateOptions(false, true)
      try {
        const updateResult = this.hiveService.updateOneDBData(HiveVaultApi.TABLE_CHANNELS, channel, doc, option)
        Logger.log(TAG, 'update channel result', updateResult)
        resolve(updateResult)
      } catch (error) {
        Logger.error(TAG, 'updateDataToChannelDB error', error)
        reject(error)
      }
    })
  }

  //API
  //Post
  //insert
  insertDataToPostDB(postId: string, channelId: string, type: string, tag: string, content: string, memo: string, createdAt: number, updateAt: number, status: number): Promise<InsertResult> {
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
        const insertResult = this.hiveService.insertDBData(HiveVaultApi.TABLE_POSTS, doc)
        Logger.log(TAG, 'insert postData result', insertResult)
        resolve(insertResult)
      } catch (error) {
        Logger.error(TAG, 'insertDataToPostDB error', error)
        reject(error)
      }
    })
  }

  //API
  //Post
  //Update
  updateDataToPostDB(postId: string, channelId: string, newType: string, newTag: string, newContent: string, newMemo: string, newStatus: number): Promise<UpdateResult> {
    return new Promise(async (resolve, reject) => {
      const key = this.dataHelper.getKey("", Number(channelId), Number(postId), 0)
      const post = this.dataHelper.getPost(key)
      const updated_at = new Date().getTime().toString()
      const doc =
      {
        "channel_id": channelId,
        "post_id": postId,
        "created_at": post.created_at,
        "updated_at": updated_at,
        "content": newContent,
        "status": newStatus,
        "memo": newMemo,
        "type": newType,
        "tag": newTag
      }
      const option = new UpdateOptions(false, true)
      try {
        const updateResult = this.hiveService.updateOneDBData(HiveVaultApi.TABLE_POSTS, post, doc, option)
        Logger.log(TAG, 'update post result', updateResult)
        resolve(updateResult)
      } catch (error) {
        Logger.error(TAG, 'updateDataToPostDB error', error)
        reject(error)
      }
    })
  }

  //API
  //Post
  //Delete
  deleteDataFromPostDB(collectName: string, channelId: string, postId: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const key = this.dataHelper.getKey("", Number(channelId), Number(postId), 0)
      const post = this.dataHelper.getPost(key)
      try {
        this.hiveService.deleateOneDBData(HiveVaultApi.TABLE_POSTS, post)
        Logger.log(TAG, 'delete post result success')
        resolve()
      } catch (error) {
        Logger.error(TAG, 'deleteDataFromPostDB error', error)
        reject(error)
      }
    })
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
  private registerGetAllPostScripting(): Promise<void> {
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
  private registerGetSomeTimePostScripting() {
    let executablefilter = { "channel_id": "$params.channel_id", "post_id": "$params.post_id", "update_at": { "$gt": "$params.start", "$lt": "$params.end" } }
    let options = { "projection": { "_id": false }, "limit": 100 }
    let conditionfilter = { "channel_id": "$params.channel_id", "user_did": "$caller_did" }
    let queryCondition = new QueryHasResultCondition("verify_user_permission", HiveVaultApi.TABLE_SUBSCRIPTIONS, conditionfilter, null)
    let findExe = new FindExecutable("find_message", HiveVaultApi.TABLE_POSTS, executablefilter, options).setOutput(true)
    console.log("registerGetSomeTimePostScripting ====== ")
    return this.hiveService.registerScript(HiveVaultApi.SCRIPT_SOMETIME_POST, findExe, queryCondition, false, false)
  }

  // 注册订阅
  private registerSubscriptions(): Promise<void> {
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

  // 查询channel下所有 Post内容
  callGetAllPostScripting(channelId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let userDid = (await this.dataHelper.getSigninData()).did
        let appid = Config.APPLICATION_DID
        let result = await this.hiveService.callScript(HiveVaultApi.SCRIPT_ALLPOST, { "channel_id": channelId }, userDid, appid)
        console.log("callChannel result ======= ", result)
        resolve(result)
      } catch (error) {
        Logger.error(TAG, 'callGetAllPostScripting error:', error)
        reject(error)
      }
    })
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
        resolve(result)
      } catch (error) {
        Logger.error(TAG, 'callGetSpecifiedPostScripting error:', error)
        reject(error)
      }
    })
  }

  //获得订阅的channel列表
  async getHomePostContent() {

    const channelIds = await this.getSubscriptChannelId()
    // 获得订阅的post
    console.log("channelIds ===== ", channelIds)
    channelIds.forEach(async (item) => {
      console.log("item ===== ", item)
      const channelId = item["channel_id"].toString()
      console.log("channelId ===== ", channelId)
      /*
      {"find_message": {"items": [{"channel_id": "304", "post_id": "d9b9b6d8ff80d1641e48e5b3fe8f51ac5874219f72a556f35d6e55d50d2d1a3e", "created_at": 1646792481412, "updated_at": 1646792481412, "content": "{\"version\":\"2.0\",\"text\":\"\u6d4b\u8bd5\u4e00\u4e0b\u8fd9\u4e2a\",\"data\":[]}", "status": 0, "memo": "", "type": "0", "tag": "Feeds-createpost", "created": {"$date": 1646792482693}, "modified": {"$date": 1646792482693}}]}}
      */
      await this.callGetAllPostScripting(channelId)
    })
  }

  getSubscriptChannelId(): Promise<JSONObject[]> {
    return this.listSubscriptDB()
  }

  listSubscriptDB(): Promise<JSONObject[]> {
    const query = {}
    return this.hiveService.findPostDB(HiveVaultApi.TABLE_SUBSCRIPTIONS, query)
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

  //Registe find comment script for post
  private registerFindCommentScriptingByPostId() {
    let conditionFilter = {
      "channel_id": "$params.channel_id",
      "user_did": "$caller_did"
    };
    const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultApi.TABLE_SUBSCRIPTIONS, conditionFilter, null);

    const executableFilter = {
      "channel_id": "$params.channel_id",
      "post_id": "$params.post_id",
    };

    let options = { "projection": { "_id": false }, "limit": 100 };
    const executable = new FindExecutable("find_message", HiveVaultApi.TABLE_COMMENTS, executableFilter, options).setOutput(true)

    return this.hiveService.registerScript(HiveVaultApi.SCRIPT_FIND_COMMENT_BY_POSTID, executable, condition, false);
  }

  //Registe find comment script for comment
  private registerFindCommentScriptingByCommentId() {
    let conditionFilter = {
      "channel_id": "$params.channel_id",
      "user_did": "$caller_did"
    };
    const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultApi.TABLE_SUBSCRIPTIONS, conditionFilter, null);

    const executableFilter = {
      "channel_id": "$params.channel_id",
      "post_id": "$params.post_id",
      "comment_id": "$params.comment_id"
    };

    let options = { "projection": { "_id": false }, "limit": 100 };
    const executable = new FindExecutable("find_message", HiveVaultApi.TABLE_COMMENTS, executableFilter, options).setOutput(true)

    return this.hiveService.registerScript(HiveVaultApi.SCRIPT_FIND_COMMENT_BY_COMMENTID, executable, condition, false);
  }

  //Registe create comment script
  private registerCreateCommentScripting() {
    let conditionfilter = {
      "channel_id": "$params.channel_id",
      "user_did": "$caller_did"
    };
    const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultApi.TABLE_SUBSCRIPTIONS, conditionfilter, null);

    let executablefilter = {
      "comment_id": "$params.comment_id",
      "channel_id": "$params.channel_id",
      "post_id": "$params.post_id",
      "refcomment_id": "$params.refcomment_id",
      "content": "$params.content",
      "status": 0,
      "created_at": "$params.created_at",
      "updated_at": "$params.created_at",
      "creater_did": "$caller_did"
    }

    let options = {
      "projection":
      {
        "_id": false
      }
    };
    const executable = new InsertExecutable("database_update", HiveVaultApi.TABLE_COMMENTS, executablefilter, options).setOutput(true)

    return this.hiveService.registerScript(HiveVaultApi.SCRIPT_CREATE_COMMENT, executable, condition, false);
  }

  //Update comment
  private registerUpdateCommentScripting() {
    let conditionfilter = {
      "channel_id": "$params.channel_id",
      "post_id": "$params.post_id",
      "comment_id": "$params.comment_id",
      "creater_did": "$caller_did"
    };
    const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultApi.TABLE_COMMENTS, conditionfilter, null);

    const filter = {
      "channel_id": "$params.channel_id",
      "post_id": "$params.post_id",
      "comment_id": "$params.comment_id"
    };
    const update = {
      "status": FeedsData.PostCommentStatus.edited,
      "content": "$params.content",
      "updated_at": "$params.updated_at",
      "creater_did": "$caller_did"
    };

    let options = { "projection": { "_id": false }, "limit": 100 };
    const executable = new UpdateExecutable("database_update", HiveVaultApi.TABLE_COMMENTS, filter, update, options).setOutput(true)

    return this.hiveService.registerScript(HiveVaultApi.SCRIPT_UPDATE_COMMENT, executable, condition, false);
  }

  //Delete comment
  private registerDeleteCommentScripting() {
    let conditionfilter = {
      "channel_id": "$params.channel_id",
      "post_id": "$params.post_id",
      "comment_id": "$params.comment_id",
      "creater_did": "$caller_did"
    };
    const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultApi.TABLE_COMMENTS, conditionfilter, null);

    const filter = {
      "channel_id": "$params.channel_id",
      "post_id": "$params.post_id",
      "comment_id": "$params.comment_id"
    };
    const update = {
      "status": FeedsData.PostCommentStatus.deleted
    };

    let options = { "projection": { "_id": false }, "limit": 100 };
    const executable = new UpdateExecutable("database_update", HiveVaultApi.TABLE_COMMENTS, filter, update, options).setOutput(true)

    return this.hiveService.registerScript(HiveVaultApi.SCRIPT_DELETE_COMMENT, executable, condition, false);
  }

  private callGetCommentByPostIdScripting(channelId: string, postId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const params = {
          "channel_id": channelId,
          "post_id": postId
        }
        const result = await this.callScript(HiveVaultApi.SCRIPT_FIND_COMMENT_BY_POSTID, params);
        console.log("Get comment from scripting by post id , result is ", result);
        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'Get comment from scripting by post id error:', error);
        reject(error);
      }
    });
  }

  private callGetCommentByCommentIdScripting(channelId: string, postId: string, commentId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const params = {
          "channel_id": channelId,
          "post_id": postId,
          "comment_id": commentId
        }
        const result = await this.callScript(HiveVaultApi.SCRIPT_FIND_COMMENT_BY_COMMENTID, params);
        console.log("Get comment from scripting by comment id , result is", result);
        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'Get comment from scripting by comment id error:', error);
        reject(error);
      }
    });
  }

  private callUpdateComment(channelId: string, postId: string, commentId: string, content: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const params = {
          "channel_id": channelId,
          "post_id": postId,
          "comment_id": commentId,
          "content": content,
          "updated_at": UtilService.getCurrentTimeNum()
        }
        const result = await this.callScript(HiveVaultApi.SCRIPT_UPDATE_COMMENT, params);
        console.log("Get comment from scripting by comment id , result is", result);
        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'Get comment from scripting by comment id error:', error);
        reject(error);
      }
    });
  }

  private callDeleteComment(channelId: string, postId: string, commentId: string,): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const params = {
          "channel_id": channelId,
          "post_id": postId,
          "comment_id": commentId
        }
        const result = await this.callScript(HiveVaultApi.SCRIPT_DELETE_COMMENT, params);
        console.log("Delete comment from scripting , result is", result);
        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'Delete comment from scripting , error:', error);
        reject(error);
      }
    });
  }

  private callCreateComment(commentId: string, channelId: string, postId: string, refcommentId: string, content: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const params = {
          "comment_id": commentId,
          "channel_id": channelId,
          "post_id": postId,
          "refcomment_id": refcommentId,
          "content": content,
          "created_at": UtilService.getCurrentTimeNum()
        }
        const result = await this.callScript(HiveVaultApi.SCRIPT_CREATE_COMMENT, params);
        console.log("Create comment from scripting , result is", result);
        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'Create comment from scripting , error:', error);
        reject(error);
      }
    });
  }

  getComment(channelId: string, postId: string): Promise<any> {
    return this.callGetCommentByPostIdScripting(channelId, postId);
  }

  createComment(channelId: string, postId: string, refcommentId: string, content: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const signinDid = (await this.dataHelper.getSigninData()).did;
        const commentId = UtilService.generateCommentId(signinDid);
        const result = await this.callCreateComment(commentId, channelId, postId, refcommentId, content);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  updateComment(channelId: string, postId: string, commentId: string, content: string): Promise<any> {
    return this.callUpdateComment(channelId, postId, commentId, content);
  }

  deleteComment(channelId: string, postId: string, commentId: string): Promise<any> {
    return this.callDeleteComment(channelId, postId, commentId);
  }

  private callScript(scriptName: string, params: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const userDid = (await this.dataHelper.getSigninData()).did;
        const appid = Config.APPLICATION_DID;

        let result = await this.hiveService.callScript(scriptName, params, userDid, appid);
        console.log("callScript result ======= ", result);
        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'callScript error:', error);
        reject(error);
      }
    });
  }

  ////Like////
  //Registe find like script
  private registerFindLikeByIdScripting() {
    let conditionFilter = {
      "channel_id": "$params.channel_id",
      "user_did": "$caller_did"
    };
    const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultApi.TABLE_SUBSCRIPTIONS, conditionFilter, null);

    const executableFilter = {
      "channel_id": "$params.channel_id",
      "post_id": "$params.post_id",
      "comment_id": "$params.comment_id",
    };

    let options = { "projection": { "_id": false }, "limit": 100 };
    const executable = new FindExecutable("find_message", HiveVaultApi.TABLE_LIKES, executableFilter, options).setOutput(true)
    return this.hiveService.registerScript(HiveVaultApi.SCRIPT_FIND_LIKE_BY_ID, executable, condition, false);
  }

  //Registe create like script
  private registerCreateLikeScripting() {
    let conditionfilter = {
      "channel_id": "$params.channel_id",
      "user_did": "$caller_did"
    };
    const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultApi.TABLE_SUBSCRIPTIONS, conditionfilter, null);

    let executablefilter = {
      "channel_id": "$params.channel_id",
      "post_id": "$params.post_id",
      "comment_id": "$params.comment_id",
      "created_at": "$params.created_at",
      "creater_did": "$caller_did"
    }

    let options = {
      "projection":
      {
        "_id": false
      }
    };
    const executable = new InsertExecutable("database_insert", HiveVaultApi.TABLE_LIKES, executablefilter, options).setOutput(true)
    return this.hiveService.registerScript(HiveVaultApi.SCRIPT_CREATE_LIKE, executable, condition, false);
  }

  //Remove like
  private registerRemoveLikeScripting() {
    let conditionfilter = {
      "channel_id": "$params.channel_id",
      "post_id": "$params.post_id",
      "comment_id": "$params.comment_id",
      "creater_did": "$caller_did"
    };
    const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultApi.TABLE_LIKES, conditionfilter, null);

    const filter = {
      "channel_id": "$params.channel_id",
      "post_id": "$params.post_id",
      "comment_id": "$params.comment_id"
    };
    const executable = new DeleteExecutable("database_delete", HiveVaultApi.TABLE_COMMENTS, filter).setOutput(true);
    return this.hiveService.registerScript(HiveVaultApi.SCRIPT_REMOVE_LIKE, executable, condition, false);
  }

  private callAddLike(channelId: string, postId: string, commentId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const createdAt = UtilService.getCurrentTimeNum();
        const params = {
          "channel_id": channelId,
          "post_id": postId,
          "comment_id": commentId,
          "created_at": createdAt
        }
        const result = await this.callScript(HiveVaultApi.SCRIPT_CREATE_LIKE, params);
        console.log("Add like from scripting , result is", result);
        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'Add like from scripting , error:', error);
        reject(error);
      }
    });
  }

  private callRemoveLike(channelId: string, postId: string, commentId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const params = {
          "channel_id": channelId,
          "post_id": postId,
          "comment_id": commentId,
        }
        const result = await this.callScript(HiveVaultApi.SCRIPT_REMOVE_LIKE, params);
        console.log("Remove like from scripting , result is", result);
        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'Remove like from scripting , error:', error);
        reject(error);
      }
    });
  }

  private callFindLikeById(channelId: string, postId: string, commentId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const params = {
          "channel_id": channelId,
          "post_id": postId,
          "comment_id": commentId,
        }
        const result = await this.callScript(HiveVaultApi.SCRIPT_FIND_LIKE_BY_ID, params);
        console.log("Remove like from scripting , result is", result);
        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'Remove like from scripting , error:', error);
        reject(error);
      }
    });
  }

  addLike(channelId: string, postId: string, commentId: string): Promise<any> {
    return this.callAddLike(channelId, postId, commentId);
  }

  removeLike(channelId: string, postId: string, commentId: string): Promise<any> {
    return this.callRemoveLike(channelId, postId, commentId);
  }

  findLikeById(channelId: string, postId: string, commentId: string): Promise<any> {
    return this.callFindLikeById(channelId, postId, commentId);
  }

  ////Find subscriptions scripting
  private registerFindSubscriptionByIdScripting() {
    const executableFilter = {
      "channel_id": "$params.channel_id"
    };

    let options = { "projection": { "_id": false }, "limit": 100 };
    const executable = new FindExecutable("find_message", HiveVaultApi.TABLE_LIKES, executableFilter, options).setOutput(true)
    return this.hiveService.registerScript(HiveVaultApi.SCRIPT_FIND_SUBSCRIPTION_BY_ID, executable, null, false);
  }

  private callFindSubscriptionById(channelId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const params = {
          "channel_id": channelId,
        }
        const result = await this.callScript(HiveVaultApi.SCRIPT_FIND_SUBSCRIPTION_BY_ID, params);
        console.log("Find subscription from scripting , result is", result);
        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'Find subscription from scripting , error:', error);
        reject(error);
      }
    });
  }

  getSubscriptionByChannelId(channelId: string): Promise<any> {
    return this.callFindSubscriptionById(channelId);
  }

  uploadMediaData(data: any): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const randomDataId = UtilService.getCurrentTimeNum();
        const remoteName = 'feeds/data/' + randomDataId;
        await this.hiveService.uploadCustomeAvatar(remoteName, data);

        const scriptName = "getFeedsData" + randomDataId;
        this.registerFileDownloadScripting(scriptName, remoteName);
        resolve('SUCCESS');
      } catch (error) {
        reject(error);
      }
    });
  }

  registerFileDownloadScripting(scriptName: string, remoteName: string): Promise<void> {
    const executable = new FileDownloadExecutable(remoteName).setOutput(true);
    return this.hiveService.registerScript(HiveVaultApi.SCRIPT_CHANNEL, executable, null, false);
  }

  async downloadEssAvatar() {
    try {
      // 检测本地是否存在
      let userDid = (await this.dataHelper.getSigninData()).did
      const loadKey = userDid + "_ess_avatar"
      let essavatar = await this.dataHelper.loadUserAvatar(loadKey)
      if (essavatar) {
        return
      }
      const result = await this.hiveService.downloadEssAvatarTransactionId()
      const transaction_id = result["download"]["transaction_id"]
      let self = this
      let dataBuffer = await this.hiveService.downloadScripting(transaction_id)

      const savekey = userDid + "_ess_avatar"
      const rawImage = await rawImageToBase64DataUrl(dataBuffer)
      self.dataHelper.saveUserAvatar(savekey, rawImage)
    }
    catch (error) {
      Logger.error(TAG, "Download Ess Avatar error: ", error);
    }
  }

  async downloadCustomeAvatar(remotePath: string) {
    try {
      // 检测本地是否存在
      let userDid = (await this.dataHelper.getSigninData()).did
      let avatar = await this.dataHelper.loadUserAvatar(userDid);

      if (avatar) {
        return
      }


      let self = this
      let imgstr = ''
      try {
        var dataBuffer = await this.hiveService.downloadFile(remotePath)
        // dataBuffer = dataBuffer.slice(1, -1)
        imgstr = dataBuffer.toString()
        self.dataHelper.saveUserAvatar(userDid, imgstr)
      } catch (error) {
        Logger.error(TAG, 'Download custom avatar error: ', JSON.stringify(error))
      }
    } catch (error) {
      Logger.error(TAG, 'Download error', error)
    }
  }
}

interface Mime {
  mime: string;
  pattern: (number | undefined)[];
}

const imageMimes: Mime[] = [
  {
    mime: 'image/png',
    pattern: [0x89, 0x50, 0x4e, 0x47]
  },
  {
    mime: 'image/jpeg',
    pattern: [0xff, 0xd8, 0xff]
  },
  {
    mime: 'image/gif',
    pattern: [0x47, 0x49, 0x46, 0x38]
  },
  {
    mime: 'image/webp',
    pattern: [0x52, 0x49, 0x46, 0x46, undefined, undefined, undefined, undefined, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50],
  }
];

/**
 * Encodes a raw binary picture data into a base64 string.
 * Ex: âPNG   IHDR... ---> "iVe89...."
 */
export function rawImageToBase64(rawImageData: Buffer): string {
  if (!rawImageData)
    return null

  return Buffer.from(rawImageData).toString("base64")
}

/**
 * Converts a base64 encoded raw binary picture data into its original raw binary buffer.
 * Ex: "iVe89...." ---> âPNG   IHDR...
 */
export function base64ImageToBuffer(base64Picture: string): Buffer {
  return Buffer.from(base64Picture, "base64")
}

/**
 * Converts a raw binary picture data to a base64 data url usable on UI.
 * Ex: âPNG   IHDR... ---> "data:image/png;base64,iVe89...."
 */
export async function rawImageToBase64DataUrl(rawImageData: Buffer): Promise<string> {
  if (!rawImageData)
    return null;

  let mimeType = await pictureMimeType(rawImageData)
  if (!mimeType) {
    Logger.warn("picturehelper", "Unable to extract mime type from picture buffer. rawImageToBase64DataUrl() returns null picture.")
    return null
  }

  return "data:" + mimeType + ";base64," + rawImageToBase64(rawImageData)
}

/**
 * Returns a 1x1 px fully transparent picture, encoded as base64 data url.
 * Use https://png-pixel.com/ to generate.
 */
export function transparentPixelIconDataUrl(): string {
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
}

function isMime(bytes: Uint8Array, mime: Mime): boolean {
  return mime.pattern.every((p, i) => !p || bytes[i] === p)
}

/**
 * @param rawOrBase64ImageData Raw picture buffer, or base64 encoded raw picture (not a base64 data url)
 */
export function pictureMimeType(rawOrBase64ImageData: Buffer | string): Promise<string> {
  if (typeof rawOrBase64ImageData === "string")
    rawOrBase64ImageData = base64ImageToBuffer(rawOrBase64ImageData)

  const numBytesNeeded = Math.max(...imageMimes.map(m => m.pattern.length))
  const blob = new Blob([rawOrBase64ImageData.slice(0, numBytesNeeded)]) // Read the needed bytes of the file

  const fileReader = new FileReader()
  let p = new Promise<string>((resolve) => {
    fileReader.onloadend = e => {
      if (!e || !fileReader.result) {
        resolve(null)
        return
      }

      const bytes = new Uint8Array(fileReader.result as ArrayBuffer)

      const mime = imageMimes.find(mime => isMime(bytes, mime))

      if (!mime)
        resolve(null)
      else
        resolve(mime.mime)
    };
  });

  fileReader.readAsArrayBuffer(blob)

  return p
}