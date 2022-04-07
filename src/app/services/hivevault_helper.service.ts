import { Injectable } from '@angular/core';
import { HiveService } from 'src/app/services/HiveService';
import { Logger } from './logger';
import { UtilService } from './utilService';
import { DataHelper } from './DataHelper';
import { QueryHasResultCondition, FindExecutable, AndCondition, InsertExecutable, UpdateExecutable, DeleteExecutable, UpdateResult, UpdateOptions, InsertResult, FileDownloadExecutable } from "@elastosfoundation/hive-js-sdk";
import { Config } from 'src/app/services/config';
import { rawImageToBase64DataUrl } from 'src/app/services/picture.helpers';
import { base64ImageToBuffer } from 'src/app/services/picture.helpers';
import SparkMD5 from 'spark-md5';
import { FileHelperService } from 'src/app/services/FileHelperService';
import { trace } from 'console';
import { R3TargetBinder } from '@angular/compiler';
import { JSONObject } from '@elastosfoundation/did-js-sdk/typings';

const TAG = 'HiveVaultHelper';

@Injectable()
export class HiveVaultHelper {
    public static readonly TABLE_CHANNELS = "channels";
    public static readonly TABLE_POSTS = "posts";
    public static readonly TABLE_SUBSCRIPTIONS = "subscriptions";
    public static readonly TABLE_COMMENTS = "comments";
    public static readonly TABLE_LIKES = "likes";

    // public static readonly SCRIPT_ALLPOST = "script_allpost_name";
    public static readonly SCRIPT_SPECIFIED_POST = "script_specified_post_name";
    public static readonly SCRIPT_SOMETIME_POST = "script_sometime_post_name";
    public static readonly SCRIPT_CHANNEL = "script_channel_name";
    public static readonly SCRIPT_COMMENT = "script_comment_name";
    public static readonly SCRIPT_SUBSCRIPTION = "script_subscriptions_name";

    public static readonly SCRIPT_QUERY_POST_BY_CHANNEL = "script_query_post_by_channel";//all
    public static readonly SCRIPT_QUERY_CHANNEL_INFO = "script_query_channel_info";

    public static readonly SCRIPT_SUBSCRIBE_CHANNEL = "script_subscribe_channel";
    public static readonly SCRIPT_UNSUBSCRIBE_CHANNEL = "script_unsubscribe_channel";
    public static readonly SCRIPT_QUERY_SUBSCRIPTION_BY_CHANNELID = "script_query_subscription_by_channelid";
    public static readonly SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID = "script_query_subscription_by_userdid";

    public static readonly SCRIPT_CREATE_COMMENT = "script_create_comment";
    public static readonly SCRIPT_UPDATE_COMMENT = "script_update_comment";
    public static readonly SCRIPT_QUERY_COMMENT = "script_query_comment";
    public static readonly SCRIPT_DELETE_COMMENT = "script_delete_comment";
    public static readonly SCRIPT_QUERY_COMMENT_BY_POSTID = "script_query_comment_by_postid";
    public static readonly SCRIPT_QUERY_COMMENT_BY_COMMENTID = "script_query_comment_by_commentid";

    public static readonly SCRIPT_CREATE_LIKE = "script_add_like";
    public static readonly SCRIPT_REMOVE_LIKE = "script_remove_like";
    public static readonly SCRIPT_QUERY_LIKE_BY_ID = "script_query_like_by_id";
    public static readonly SCRIPT_QUERY_LIKE_BY_POST = "script_query_like_by_post";
    public static readonly SCRIPT_QUERY_LIKE_BY_CHANNEL = "script_query_like_by_channel";

    constructor(
        private hiveService: HiveService,
        private dataHelper: DataHelper,
        private fileHelperService: FileHelperService
    ) {
    }

    registeScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                //channel
                await this.registerQueryChannelInfoScripting();

                //post
                await this.registerQueryPostByChannelIdScripting();
                await this.registerQueryPostRangeOfTimeScripting();
                await this.registerQueryPostByIdScripting();

                //subscription
                await this.registerSubscribeScripting();
                await this.registerQuerySubscriptionInfoByChannelIdScripting();
                await this.registerQuerySubscriptionInfoByUserDIDScripting();
                await this.registerUnsubscribeScripting();

                //comment
                await this.registerCreateCommentScripting();
                await this.registerFindCommentByIdScripting();
                await this.registerQueryCommentByPostIdScripting();
                await this.registerUpdateCommentScripting();
                await this.registerDeleteCommentScripting();

                // //like
                await this.registerCreateLikeScripting();
                await this.registerQueryLikeByIdScripting();
                await this.registerRemoveLikeScripting();
                await this.registerQueryLikeByChannelScripting();
                await this.registerQueryLikeByPostScripting();
                resolve('FINISH');
            } catch (error) {
                Logger.error(error);
            }
        });
    }

    private createCollection(collectName: string): Promise<void> {
        return this.hiveService.createCollection(collectName);
    }

    createAllCollections(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                await this.createCollection(HiveVaultHelper.TABLE_CHANNELS);
                await this.createCollection(HiveVaultHelper.TABLE_POSTS);
                await this.createCollection(HiveVaultHelper.TABLE_SUBSCRIPTIONS);
                await this.createCollection(HiveVaultHelper.TABLE_COMMENTS);
                await this.createCollection(HiveVaultHelper.TABLE_LIKES);
                resolve("true")
            } catch (error) {
                Logger.error(TAG, 'create Collections error', error);
                reject(error)
            }
        });
    }

    /** create channel start */
    private insertDataToChannelDB(channelId: string, name: string, intro: string, avatar: string, memo: string,
        createdAt: number, updatedAt: number, type: string, tippingAddress: string, nft: string, category: string, proof: string): Promise<any> {
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
                "category": category,
                "proof": proof
            }

            try {
                const insertResult = this.hiveService.insertDBData(HiveVaultHelper.TABLE_CHANNELS, doc);
                Logger.log(TAG, 'Insert channel db result', insertResult)
                resolve(doc)
            } catch (error) {
                Logger.error(TAG, 'Insert channel db error', error)
                reject(error)
            }
        })
    }

    private insertChannelData(channelName: string, intro: string, avatarAddress: string, tippingAddress: string, type: string, nft: string, memo: string, category: string, proof: string): Promise<{ [x: string]: string | number | boolean }> {
        return new Promise(async (resolve, reject) => {
            try {
                const signinDid = (await this.dataHelper.getSigninData()).did;
                const createdAt = UtilService.getCurrentTimeNum();
                const updatedAt = UtilService.getCurrentTimeNum();
                const channelId = UtilService.generateChannelId(signinDid, channelName);
                let result = await this.insertDataToChannelDB(channelId.toString(), channelName, intro, avatarAddress, memo, createdAt, updatedAt, type, tippingAddress, nft, category, proof);
                if (result) {
                    const insertResult = {
                        destDid: signinDid,
                        channelId: channelId,
                        createdAt: createdAt,
                        updatedAt: updatedAt
                    }
                    resolve(insertResult);
                }
                else
                    reject('Insert channel data error');
            } catch (error) {
                Logger.error(error);
                reject()
            }
        });
    }

    createChannel(channelName: string, intro: string, avatarAddress: string, tippingAddress: string = '', type: string = 'public', nft: string = '', memo: string = '', category: string = '', proof: string = '') {
        return this.insertChannelData(channelName, intro, avatarAddress, tippingAddress, type, nft, memo, category, proof);
    }
    /** create channel end */

    /** update channel start */
    private updateDataToChannelDB(channelId: string, newName: string, newIntro: string, newAvatar: string, newType: string, newMemo: string,
        newTippingAddress: string, newNft: string, updatedAt: number): Promise<UpdateResult> {
        return new Promise(async (resolve, reject) => {
            try {
                const doc =
                {
                    "name": newName,
                    "intro": newIntro,
                    "avatar": newAvatar,
                    "updated_at": updatedAt,
                    "type": newType,
                    "tipping_address": newTippingAddress,
                    "nft": newNft,
                    "memo": newMemo,
                }
                const option = new UpdateOptions(false, true)
                let filter = { "channel_id": channelId };
                let update = { "$set": doc };

                const updateResult = this.hiveService.updateOneDBData(HiveVaultHelper.TABLE_CHANNELS, filter, update, option);
                Logger.log(TAG, 'update channel result', updateResult)
                resolve(updateResult)
            } catch (error) {
                Logger.error(TAG, 'updateDataToChannelDB error', error)
                reject(error)
            }
        })
    }

    private updateChannelData(channelId: string, newName: string, newIntro: string, newAvatar: string, newType: string, newMemo: string,
        newTippingAddress: string, newNft: string) {
        const updatedAt = UtilService.getCurrentTimeNum();
        return this.updateDataToChannelDB(channelId, newName, newIntro, newAvatar, newType, newMemo, newTippingAddress, newNft, updatedAt);
    }

    updateChannel(channelId: string, newName: string, newIntro: string, newAvatar: string, newType: string, newMemo: string,
        newTippingAddress: string, newNft: string) {
        return this.updateChannelData(channelId, newName, newIntro, newAvatar, newType, newMemo, newTippingAddress, newNft);
    }
    /** update channel end */

    /** query channel info start*/
    private registerQueryChannelInfoScripting(): Promise<void> {
        let executablefilter = { "channel_id": "$params.channel_id", "type": "public" }
        let options = { "projection": { "_id": false }, "limit": 100 }
        const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_CHANNELS, executablefilter, options).setOutput(true)
        return this.hiveService.registerScript(HiveVaultHelper.SCRIPT_QUERY_CHANNEL_INFO, executable, null, false)
    }

    private callQueryChannelInfo(targetDid: string, channelId: string) {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_CHANNEL_INFO, { "channel_id": channelId })
                console.log("callChannel result ======= ", result)
                resolve(result)
            } catch (error) {
                Logger.error(TAG, 'callGetAllPostScripting error:', error)
                reject(error)
            }
        })
    }

    queryChannelInfo(targetDid: string, channelId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                console.log()
                const result = await this.callQueryChannelInfo(targetDid, channelId);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Query channnel info error', error);
                reject(error);
            }
        });
    }
    /** query channel info end*/

    /** publish post start */
    private insertDataToPostDB(postId: string, channelId: string, type: string, tag: string, content: string, memo: string, createdAt: number, updateAt: number, status: number, proof: string = ''): Promise<InsertResult> {
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
                "tag": tag,
                "proof": proof
            }

            try {
                const insertResult = this.hiveService.insertDBData(HiveVaultHelper.TABLE_POSTS, doc)
                Logger.log(TAG, 'insert postData result', insertResult)
                resolve(insertResult)
            } catch (error) {
                Logger.error(TAG, 'insertDataToPostDB error', error)
                reject(error)
            }
        })
    }

    private insertPostData(channelId: string, tag: string, content: string, type: string, status: number, memo: string, proof: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const signinDid = (await this.dataHelper.getSigninData()).did;

                const createdAt = UtilService.getCurrentTimeNum();
                const updatedAt = UtilService.getCurrentTimeNum();
                const postId = UtilService.generatePostId(signinDid, channelId, content);

                await this.insertDataToPostDB(postId, channelId, type, tag, content, memo, createdAt, updatedAt, status, proof);
                let postV3: FeedsData.PostV3 = {
                    destDid: signinDid,
                    postId: postId,
                    channelId: channelId,
                    createdAt: createdAt,
                    updatedAt: updatedAt,
                    content:JSON.parse(content),
                    status: FeedsData.PostCommentStatus.available,
                    type: type,
                    tag: tag,
                    proof: proof,
                    memo: memo
                }
                resolve(postV3);
            } catch (error) {
                Logger.error(error);
                reject()
            }
        });
    }

    publishPost(channelId: string, tag: string, content: string, type: string = 'public', status: number = FeedsData.PostCommentStatus.available, memo: string, proof: string): Promise<any> {
        return this.insertPostData(channelId, tag, content, type, status, memo, proof);
    }
    /** publish post end */

    /** update post start */
    private updateDataToPostDB(postId: string, channelId: string, updatedAt: number, newType: string, newTag: string, newContent: string, newStatus: number = FeedsData.PostCommentStatus.edited, newMemo: string, newProof: string,): Promise<UpdateResult> {
        return new Promise(async (resolve, reject) => {
            const doc =
            {
                "updated_at": updatedAt,
                "content": newContent,
                "status": newStatus,
                "memo": newMemo,
                "type": newType,
                "tag": newTag,
                "proof": newProof
            }
            const option = new UpdateOptions(false, true)
            let filter = { "channel_id": channelId, "post_id": postId };
            let update = { "$set": doc };
            try {
                const updateResult = this.hiveService.updateOneDBData(HiveVaultHelper.TABLE_POSTS, filter, update, option);
                Logger.log(TAG, 'update post result', updateResult);
                resolve(updateResult);
            } catch (error) {
                Logger.error(TAG, 'updateDataToPostDB error', error)
                reject(error);
            }
        });
    }

    private updatePostData(postId: string, channelId: string, newType: string, newTag: string, newContent: string, newStatus: number, newUpdateAt: number, newMemo: string, newProof: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = this.updateDataToPostDB(postId, channelId, newUpdateAt, newType, newTag, newContent, newStatus, newMemo, newProof)
                Logger.log(TAG, 'update post result', result)
                resolve(result)
            } catch (error) {
                Logger.error(TAG, 'updatePostData error', error)
                reject(error)
            }
        })
    }

    updatePost(postId: string, channelId: string, newType: string, newTag: string, newContent: string, newStatus: number, newUpdateAt: number, newMemo: string, newProof: string): Promise<any> {
        return this.updatePostData(postId, channelId, newType, newTag, newContent, newStatus, newUpdateAt, newMemo, newProof);
    }
    /** update post end */

    /** delete post , Not use now */
    private deleteDataFromPostDB(postId: string, channelId: string, updatedAt: number): Promise<any> {
        return new Promise(async (resolve, reject) => {
            const doc =
            {
                "updated_at": updatedAt,
                "status": FeedsData.PostCommentStatus.deleted,
            }
            const option = new UpdateOptions(false, true)
            let filter = { "channel_id": channelId, "post_id": postId };
            let update = { "$set": doc };
            try {
                const result = await this.hiveService.updateOneDBData(HiveVaultHelper.TABLE_POSTS, filter, update, option);
                Logger.log(TAG, 'Delete post result', result);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Delete data from postDB error', error);
                reject(error);
            }
        });
    }

    /** delete post start */
    private deletePostData(postId: string, channelId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const updatedAt = UtilService.getCurrentTimeNum();
                const result = await this.deleteDataFromPostDB(postId, channelId, updatedAt);
                Logger.log(TAG, 'delete post result success')
                resolve(result)
            }
            catch (error) {
                Logger.error(TAG, 'deletePostData error', error)
                reject(error)
            }
        });
    }

    deletePost(postId: string, channelId: string): Promise<any> {
        return this.deletePostData(postId, channelId);
    }
    /** delete post end */

    /** query post data by id start*/
    private registerQueryPostByIdScripting(): Promise<void> {
        let executablefilter = { "channel_id": "$params.channel_id", "post_id": "$params.post_id" }
        let options = { "projection": { "_id": false }, "limit": 100 }
        let conditionfilter1 = { "channel_id": "$params.channel_id", "user_did": "$caller_did" }
        let conditionfilter2 = { "channel_id": "$params.channel_id", "post_id": "$params.post_id", "type": "public" }
        let queryCondition1 = new QueryHasResultCondition("subscription_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionfilter1, null)
        let queryCondition2 = new QueryHasResultCondition("post_permission", HiveVaultHelper.TABLE_POSTS, conditionfilter2, null)
        let andCondition = new AndCondition("verify_user_permission", [queryCondition1, queryCondition2])
        let findExe = new FindExecutable("find_message", HiveVaultHelper.TABLE_POSTS, executablefilter, options).setOutput(true)
        return this.hiveService.registerScript(HiveVaultHelper.SCRIPT_SPECIFIED_POST, findExe, andCondition, false, false)
    }

    private callQueryPostById(targetDid: string, channelId: string, postId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const doc = { "channel_id": channelId, "post_id": postId }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_SPECIFIED_POST, doc)
                resolve(result)
            } catch (error) {
                Logger.error(TAG, 'callQueryPostById error:', error)
                reject(error)
            }
        });
    }

    queryPostById(targetDid: string, channelId: string, postId: string) {
        return this.callQueryPostById(targetDid, channelId, postId);
    }
    /** query post data by id end*/

    /** query post data by channel id start */
    private registerQueryPostByChannelIdScripting(): Promise<void> {
        let executablefilter = { "channel_id": "$params.channel_id" }
        let options = { "projection": { "_id": false }, "limit": 100 }
        let conditionfilter = { "channel_id": "$params.channel_id", "user_did": "$caller_did" }
        let queryCondition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionfilter, null)
        let findExe = new FindExecutable("find_message", HiveVaultHelper.TABLE_POSTS, executablefilter, options).setOutput(true)
        return this.hiveService.registerScript(HiveVaultHelper.SCRIPT_QUERY_POST_BY_CHANNEL, findExe, queryCondition, false, false)
    }

    private callQueryPostByChannelId(targetDid: string, channelId: string) {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_POST_BY_CHANNEL, { "channel_id": channelId })
                resolve(result)
            } catch (error) {
                Logger.error(TAG, 'callQueryPostByChannelId error:', error)
                reject(error)
            }
        })
    }

    queryPostByChannelId(targetDid: string, channelId: string): Promise<any> {
        return this.callQueryPostByChannelId(targetDid, channelId);
    }
    /** query post data by channel id end */

    /** query post data range of time start */
    private registerQueryPostRangeOfTimeScripting() {
        let executablefilter =
            { "channel_id": "$params.channel_id", "updated_at": { $gt: "$params.start", $lt: "$params.end" } }
        let options = { "projection": { "_id": false }, "limit": 100 }
        let conditionfilter = { "channel_id": "$params.channel_id", "user_did": "$caller_did" }
        let queryCondition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionfilter, null)
        let findExe = new FindExecutable("find_message", HiveVaultHelper.TABLE_POSTS, executablefilter, options).setOutput(true)
        return this.hiveService.registerScript(HiveVaultHelper.SCRIPT_SOMETIME_POST, findExe, queryCondition, false, false)
    }

    private callQueryPostRangeOfTimeScripting(targetDid: string, channelId: string, start: number, end: number) {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_SOMETIME_POST, { "channel_id": channelId, "start": start, "end": end })
                resolve(result)
            } catch (error) {
                Logger.error(TAG, 'callQueryPostByChannelId error:', error)
                reject(error)
            }
        })
    }

    queryPostRangeOfTimeScripting(targetDid: string, channelId: string, start: number, end: number): Promise<any> {
        return this.callQueryPostRangeOfTimeScripting(targetDid, channelId, start, end);
    }
    /** query post data range of time end */

    /** subscribe channel start */
    private registerSubscribeScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const type = 'public';    //Currently only public channels are found for subscription
                let conditionfilter = {
                    "channel_id": "$params.channel_id",
                    "type": type
                };
                const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_CHANNELS, conditionfilter, null);

                let document = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did",
                    "created_at": "$params.created_at",
                    "display_name": "$params.display_name"
                }
                let options = { "projection": { "_id": false } };

                const executable = new InsertExecutable("database_insert", HiveVaultHelper.TABLE_SUBSCRIPTIONS, document, options);
                await this.hiveService.registerScript(HiveVaultHelper.SCRIPT_SUBSCRIBE_CHANNEL, executable, condition);
                resolve('SUCCESS');
            } catch (error) {
                Logger.error(error);
                reject(error);
            }
        });
    }

    private callSubscribeScripting(targetDid: string, channelId: string, userDisplayName: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                    "created_at": UtilService.getCurrentTimeNum(),
                    "display_name": userDisplayName
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_SUBSCRIBE_CHANNEL, params);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'callSubscription error:', error)
                reject(error)
            }
        })
    }

    subscribeChannel(targetDid: string, channelId: string, displayName: string): Promise<any> {
        return this.callSubscribeScripting(targetDid, channelId, displayName);
    }
    /** subscribe channel end */

    /** unsubscribe channel start */
    private registerUnsubscribeScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const filter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did"
                }

                const executable = new DeleteExecutable("database_delete", HiveVaultHelper.TABLE_SUBSCRIPTIONS, filter);
                await this.hiveService.registerScript(HiveVaultHelper.SCRIPT_UNSUBSCRIBE_CHANNEL, executable, null);
                resolve('SUCCESS');
            } catch (error) {
                Logger.error(error);
                reject(error);
            }
        });
    }

    private callUnsubscribeScripting(targetDid: string, channelId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_UNSUBSCRIBE_CHANNEL, params);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'callSubscription error:', error)
                reject(error)
            }
        })
    }

    unsubscribeChannel(targetDid: string, channelId: string): Promise<any> {
        return this.callUnsubscribeScripting(targetDid, channelId);
    }
    /** unsubscribe channel end */

    /** query subscription info by channelId start */
    private registerQuerySubscriptionInfoByChannelIdScripting() {
        const executableFilter = {
            "channel_id": "$params.channel_id"
        };

        let options = { "projection": { "_id": false }, "limit": 100 };
        const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_SUBSCRIPTIONS, executableFilter, options).setOutput(true)
        return this.hiveService.registerScript(HiveVaultHelper.SCRIPT_QUERY_SUBSCRIPTION_BY_CHANNELID, executable, null, false);
    }

    private callQuerySubscriptionInfoByChannelId(targetDid: string, channelId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_SUBSCRIPTION_BY_CHANNELID, params);
                console.log("Query subscription from scripting , result is", result);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Query subscription from scripting , error:', error);
                reject(error);
            }
        });
    }

    querySubscriptionInfoByChannelId(targetDid: string, channelId: string): Promise<any> {
        return this.callQuerySubscriptionInfoByChannelId(targetDid, channelId);
    }
    /** query subscription info by channelId end */

    /** query subscription info by userDid start */
    private registerQuerySubscriptionInfoByUserDIDScripting() {
        const executableFilter = {
            "user_did": "$params.user_did"
        };

        let options = { "projection": { "_id": false }, "limit": 100 };
        const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_SUBSCRIPTIONS, executableFilter, options).setOutput(true)
        return this.hiveService.registerScript(HiveVaultHelper.SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID, executable, null, false);
    }

    private callQuerySubscriptionByUserDID(targetDid: string, userDid: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "user_did": userDid
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID, params);
                console.log("Find subscription from scripting , result is", result);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Find subscription from scripting , error:', error);
                reject(error);
            }
        });
    }

    querySubscriptionByUserDID(targetDid: string, userDid: string): Promise<any> {
        return this.callQuerySubscriptionByUserDID(targetDid, userDid);
    }
    /** query subscription info by userDid end */

    /** query comment by postId start */
    private registerQueryCommentByPostIdScripting() {
        let conditionFilter = {
            "channel_id": "$params.channel_id",
            "user_did": "$caller_did"
        };
        const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionFilter, null);

        const executableFilter = {
            "channel_id": "$params.channel_id",
            "post_id": "$params.post_id",
        };

        let options = { "projection": { "_id": false }, "limit": 100 };
        const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_COMMENTS, executableFilter, options).setOutput(true)

        return this.hiveService.registerScript(HiveVaultHelper.SCRIPT_QUERY_COMMENT_BY_POSTID, executable, condition, false);
    }

    private callQueryCommentByPostIdScripting(targetDid: string, channelId: string, postId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                    "post_id": postId
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_COMMENT_BY_POSTID, params);
                console.log("Get comment from scripting by post id , result is ", result);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Get comment from scripting by post id error:', error);
                reject(error);
            }
        });
    }

    queryCommentByPostId(targetDid: string, channelId: string, postId: string): Promise<any> {
        return this.callQueryCommentByPostIdScripting(targetDid, channelId, postId);
    }
    /** query comment by postId end */

    /** query comment by id start */
    private registerFindCommentByIdScripting() {
        let conditionFilter = {
            "channel_id": "$params.channel_id",
            "user_did": "$caller_did"
        };
        const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionFilter, null);

        const executableFilter = {
            "channel_id": "$params.channel_id",
            "post_id": "$params.post_id",
            "comment_id": "$params.comment_id"
        };

        let options = { "projection": { "_id": false }, "limit": 100 };
        const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_COMMENTS, executableFilter, options).setOutput(true)

        return this.hiveService.registerScript(HiveVaultHelper.SCRIPT_QUERY_COMMENT_BY_COMMENTID, executable, condition, false);
    }

    private callQueryCommentByID(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                    "post_id": postId,
                    "comment_id": commentId
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_COMMENT_BY_COMMENTID, params);
                console.log("Get comment from scripting by comment id , result is", result);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Get comment from scripting by comment id error:', error);
                reject(error);
            }
        });
    }

    queryCommentByID(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
        return this.callQueryCommentByID(targetDid, channelId, postId, commentId);
    }
    /** query comment by id end */

    /** query comment by channel start */
    private registerQueryCommentByChannelScripting() {
        let conditionFilter = {
            "channel_id": "$params.channel_id",
            "user_did": "$caller_did"
        };
        const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionFilter, null);

        const executableFilter = {
            "channel_id": "$params.channel_id"
        };

        let options = { "projection": { "_id": false }, "limit": 100 };
        const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_COMMENTS, executableFilter, options).setOutput(true)

        return this.hiveService.registerScript(HiveVaultHelper.SCRIPT_QUERY_COMMENT_BY_COMMENTID, executable, condition, false);
    }

    private callQueryCommentByChannel(targetDid: string, channelId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_COMMENT_BY_COMMENTID, params);
                console.log("Get comment from scripting by channel id , result is", result);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Get comment from scripting by channel id error:', error);
                reject(error);
            }
        });
    }

    queryCommentByChannel(targetDid: string, channelId: string): Promise<any> {
        return this.callQueryCommentByChannel(targetDid, channelId);
    }
    /** query comment by channel end */

    /** create comment start */
    private registerCreateCommentScripting() {
        let conditionfilter = {
            "channel_id": "$params.channel_id",
            "user_did": "$caller_did"
        };
        const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionfilter, null);

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
        const executable = new InsertExecutable("database_update", HiveVaultHelper.TABLE_COMMENTS, executablefilter, options).setOutput(true)

        return this.hiveService.registerScript(HiveVaultHelper.SCRIPT_CREATE_COMMENT, executable, condition, false);
    }

    private callCreateComment(targetDid: string, commentId: string, channelId: string, postId: string, refcommentId: string, content: string) {
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
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_CREATE_COMMENT, params);
                console.log("Create comment from scripting , result is", result);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Create comment from scripting , error:', error);
                reject(error);
            }
        });
    }

    createComment(targetDid: string, channelId: string, postId: string, refcommentId: string, content: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const signinDid = (await this.dataHelper.getSigninData()).did;
                const commentId = UtilService.generateCommentId(signinDid, postId, refcommentId, content);
                const result = await this.callCreateComment(targetDid, commentId, channelId, postId, refcommentId, content);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    /** create comment end */

    /** update comment start */
    private registerUpdateCommentScripting() {
        let conditionfilter = {
            "channel_id": "$params.channel_id",
            "post_id": "$params.post_id",
            "comment_id": "$params.comment_id",
            "creater_did": "$caller_did"
        };
        const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_COMMENTS, conditionfilter, null);

        const filter = {
            "channel_id": "$params.channel_id",
            "post_id": "$params.post_id",
            "comment_id": "$params.comment_id"
        };

        let set = {
            "status": FeedsData.PostCommentStatus.edited,
            "content": "$params.content",
            "updated_at": `$params.updated_at`,
            "creater_did": "$caller_did"
        };
        let update = { "$set": set };
        let options = { "bypass_document_validation": false, "upsert": true };

        const executable = new UpdateExecutable("database_update", HiveVaultHelper.TABLE_COMMENTS, filter, update, options).setOutput(true)
        return this.hiveService.registerScript(HiveVaultHelper.SCRIPT_UPDATE_COMMENT, executable, condition, false);
    }

    private callUpdateComment(targetDid: string, channelId: string, postId: string, commentId: string, content: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                    "post_id": postId,
                    "comment_id": commentId,
                    "content": content,
                    "updated_at": UtilService.getCurrentTimeNum()
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_UPDATE_COMMENT, params);
                console.log("Get comment from scripting by comment id , result is", result);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Get comment from scripting by comment id error:', error);
                reject(error);
            }
        });
    }

    updateComment(targetDid: string, channelId: string, postId: string, commentId: string, content: string): Promise<any> {
        return this.callUpdateComment(targetDid, channelId, postId, commentId, content);
    }
    /** update comment end */

    /** delte comment start */
    private registerDeleteCommentScripting() {
        let conditionfilter = {
            "channel_id": "$params.channel_id",
            "post_id": "$params.post_id",
            "comment_id": "$params.comment_id",
            "creater_did": "$caller_did"
        };
        const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_COMMENTS, conditionfilter, null);

        const filter = {
            "channel_id": "$params.channel_id",
            "post_id": "$params.post_id",
            "comment_id": "$params.comment_id"
        };

        let set = {
            "status": FeedsData.PostCommentStatus.deleted,
        };
        let update = { "$set": set };
        let options = { "bypass_document_validation": false, "upsert": true };

        const executable = new UpdateExecutable("database_update", HiveVaultHelper.TABLE_COMMENTS, filter, update, options).setOutput(true)
        return this.hiveService.registerScript(HiveVaultHelper.SCRIPT_DELETE_COMMENT, executable, condition, false);
    }

    private callDeleteComment(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                    "post_id": postId,
                    "comment_id": commentId
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_DELETE_COMMENT, params);
                console.log("Delete comment from scripting , result is", result);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Delete comment from scripting , error:', error);
                reject(error);
            }
        });
    }

    deleteComment(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
        return this.callDeleteComment(targetDid, channelId, postId, commentId);
    }
    /** delte comment end */

    /** query like by id start */
    private registerQueryLikeByIdScripting() {
        let conditionFilter = {
            "channel_id": "$params.channel_id",
            "user_did": "$caller_did"
        };
        const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionFilter, null);

        const executableFilter = {
            "channel_id": "$params.channel_id",
            "post_id": "$params.post_id",
            "comment_id": "$params.comment_id",
        };

        let options = { "projection": { "_id": false }, "limit": 100 };
        const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_LIKES, executableFilter, options).setOutput(true)
        return this.hiveService.registerScript(HiveVaultHelper.SCRIPT_QUERY_LIKE_BY_ID, executable, condition, false);
    }

    private callQueryLikeById(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                    "post_id": postId,
                    "comment_id": commentId,
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_LIKE_BY_ID, params);
                console.log("Remove like from scripting , result is", result);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Remove like from scripting , error:', error);
                reject(error);
            }
        });
    }

    queryLikeById(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
        return this.callQueryLikeById(targetDid, channelId, postId, commentId);
    }
    /** query like by id end */

    /** query like by channel start */
    private registerQueryLikeByChannelScripting() {
        let conditionFilter = {
            "channel_id": "$params.channel_id",
            "user_did": "$caller_did"
        };
        const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionFilter, null);

        const executableFilter = {
            "channel_id": "$params.channel_id"
        };

        let options = { "projection": { "_id": false }, "limit": 100 };
        const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_LIKES, executableFilter, options).setOutput(true)
        return this.hiveService.registerScript(HiveVaultHelper.SCRIPT_QUERY_LIKE_BY_CHANNEL, executable, condition, false);
    }

    private callQueryLikeByChannel(targetDid: string, channelId: string) {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_LIKE_BY_CHANNEL, params);
                console.log("Remove like from scripting , result is", result);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Remove like from scripting , error:', error);
                reject(error);
            }
        });
    }

    queryLikeByChannel(targetDid: string, channelId: string): Promise<any> {
        return this.callQueryLikeByChannel(targetDid, channelId);
    }
    /** query like by channel end */

    /** query like by post start */
    private registerQueryLikeByPostScripting() {
        let conditionFilter = {
            "channel_id": "$params.channel_id",
            "user_did": "$caller_did"
        };
        const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionFilter, null);

        const executableFilter = {
            "channel_id": "$params.channel_id",
            "post_id": "$params.post_id"
        };

        let options = { "projection": { "_id": false }, "limit": 100 };
        const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_LIKES, executableFilter, options).setOutput(true)
        return this.hiveService.registerScript(HiveVaultHelper.SCRIPT_QUERY_LIKE_BY_POST, executable, condition, false);
    }

    private callQueryLikeByPost(targetDid: string, channelId: string, postId: string) {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                    "post_id": postId
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_LIKE_BY_POST, params);
                console.log("Remove like from scripting , result is", result);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Remove like from scripting , error:', error);
                reject(error);
            }
        });
    }

    queryLikeByPost(targetDid: string, channelId: string, postId: string): Promise<any> {
        return this.callQueryLikeByPost(targetDid, channelId, postId);
    }
    /** query like by post end */

    /** add like start */
    private registerCreateLikeScripting() {
        let conditionfilter = {
            "channel_id": "$params.channel_id",
            "user_did": "$caller_did"
        };
        const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionfilter, null);

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
        const executable = new InsertExecutable("database_insert", HiveVaultHelper.TABLE_LIKES, executablefilter, options).setOutput(true)
        return this.hiveService.registerScript(HiveVaultHelper.SCRIPT_CREATE_LIKE, executable, condition, false);
    }

    private callAddLike(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const createdAt = UtilService.getCurrentTimeNum();
                const params = {
                    "channel_id": channelId,
                    "post_id": postId,
                    "comment_id": commentId,
                    "created_at": createdAt
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_CREATE_LIKE, params);
                console.log("Add like from scripting , result is", result);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Add like from scripting , error:', error);
                reject(error);
            }
        });
    }

    addLike(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
        return this.callAddLike(targetDid, channelId, postId, commentId);
    }
    /** add like end */

    /** remove like start */
    private registerRemoveLikeScripting() {
        let conditionfilter = {
            "channel_id": "$params.channel_id",
            "post_id": "$params.post_id",
            "comment_id": "$params.comment_id",
            "creater_did": "$caller_did"
        };
        const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_LIKES, conditionfilter, null);

        const filter = {
            "channel_id": "$params.channel_id",
            "post_id": "$params.post_id",
            "comment_id": "$params.comment_id"
        };
        const executable = new DeleteExecutable("database_delete", HiveVaultHelper.TABLE_LIKES, filter).setOutput(true);
        return this.hiveService.registerScript(HiveVaultHelper.SCRIPT_REMOVE_LIKE, executable, condition, false);
    }

    private callRemoveLike(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                    "post_id": postId,
                    "comment_id": commentId,
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_REMOVE_LIKE, params);
                console.log("Remove like from scripting , result is", result);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Remove like from scripting , error:', error);
                reject(error);
            }
        });
    }

    removeLike(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
        return this.callRemoveLike(targetDid, channelId, postId, commentId);
    }
    /** remove like end */

    /** download essential avatar start */
    private downloadEssAvatarData(): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.hiveService.downloadEssAvatarTransactionId()
                const transaction_id = result["download"]["transaction_id"]
                let dataBuffer = await this.hiveService.downloadScripting(transaction_id)
                console.log("downloadEssAvatarData  dataBuffer ===== ", dataBuffer)
                const rawImage = await rawImageToBase64DataUrl(dataBuffer)
                resolve(rawImage);
            }
            catch (error) {
                Logger.error(TAG, "Download Ess Avatar error: ", error);
                reject(error)
            }
        });
    }

    downloadEssAvatar(): Promise<any> {
        return this.downloadEssAvatarData()
    }
    /** download essential avatar end */

    uploadMediaDataWithString(data: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const hash = SparkMD5.hash(data);

                const remoteName = 'feeds/data/' + hash;
                await this.hiveService.uploadScriptWithString(remoteName, data);
                const scriptName = hash
                await this.registerFileDownloadScripting(scriptName);
                let avatarHiveURL = scriptName + "@" + remoteName //
                Logger.log(TAG, "Generated avatar url:", avatarHiveURL);
                resolve(avatarHiveURL);
            } catch (error) {
                console.log("uploadMediaData error:", error)
                reject(error);
            }
        });
    }

    uploadMediaDataWithBuffer(bufferData: Buffer): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const dataBase64 = bufferData.toString()
                const hash = SparkMD5.hash(dataBase64);
                console.log("dataBase64 ======= ", dataBase64)
                const remoteName = 'feeds/data/' + hash;
                await this.hiveService.uploadScriptWithBuffer(remoteName, bufferData);
                const scriptName = hash
                await this.registerFileDownloadScripting(scriptName);
                let avatarHiveURL = scriptName + "@" + remoteName //
                Logger.log(TAG, "Generated avatar url:", avatarHiveURL);
                resolve(avatarHiveURL)
            } catch (error) {
                console.log("uploadMediaData error:", error)
                reject(error);
            }
        });
    }

    downloadFile(remotePath: string) {
        return this.hiveService.downloadFile(remotePath)
    }

    /** helper */
    private registerFileDownloadScripting(scriptName: string): Promise<void> {
        const executable = new FileDownloadExecutable(scriptName).setOutput(true);
        return this.hiveService.registerScript(scriptName, executable, null, false);
    }

    downloadScripting(targetDid: string, avatarHiveURL: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const transaction_id = await this.downloadScriptingTransactionID(targetDid, avatarHiveURL);
                const data = await this.downloadScriptingDataWithString(transaction_id);
                // const rawImage = await rawImageToBase64DataUrl(dataBuffer)

                resolve(data);
            } catch (error) {
                Logger.error(TAG, 'download file from scripting error', error);
                reject(error);
            }
        });
    }

    // avatarHiveURL = scriptName@remoteName
    private async downloadScriptingTransactionID(targetDid: string, avatarHiveURL: string) {
        const params = avatarHiveURL.split("@")
        const scriptName = params[0]
        const remoteName = params[1]
        const result = await this.callScript(targetDid, scriptName, { "path": remoteName })
        const transaction_id = result[scriptName]["transaction_id"]
        return transaction_id
    }

    private async downloadScriptingDataWithString(transactionID: string) {
        let dataBuffer = await this.hiveService.downloadScripting(transactionID)
        let jsonString = dataBuffer.toString();
        return jsonString
    }

    private async downloadScriptingDataWithBuffer(transactionID: string) {
        let dataBuffer = await this.hiveService.downloadScripting(transactionID)
        // let jsonString = dataBuffer.toString();
        return dataBuffer
    }

    private callScript(targetDid: string, scriptName: string, params: any): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const appid = Config.APPLICATION_DID;
                Logger.log('Call script params is targetDid:', targetDid, 'scriptName:', scriptName, 'params:', params);
                // let callerDid = (await this.dataHelper.getSigninData()).did;
                let result = await this.hiveService.callScript(scriptName, params, targetDid, appid)
                Logger.log('Call script result is', result);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'callScript error:', error);
                reject(error);
            }
        });
    }

    /** query self channels start */
    private queryChannelsFromDB(): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const filter = {};
                const result = this.hiveService.queryDBData(HiveVaultHelper.TABLE_CHANNELS, filter);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Query channels from DB', error);
                reject(error);
            }
        });
    }

    querySelfChannels(): Promise<any> {
        return this.queryChannelsFromDB();
    }
    /** query self channels end */

    /** query slef post start */
    private queryPostsFromDB(): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const filter = {};
                const result = this.hiveService.queryDBData(HiveVaultHelper.TABLE_POSTS, filter);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Query post from DB', error);
                reject(error);
            }
        });
    }

    querySelfPosts(): Promise<any> {
        return this.queryPostsFromDB();
    }
    /** query slef post end */

    /** query slef post by channel start */
    private queryPostsByChannelFromDB(channelId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const filter = { 'channel_id': channelId };
                const result = this.hiveService.queryDBData(HiveVaultHelper.TABLE_POSTS, filter);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Query post by channel from DB', error);
                reject(error);
            }
        });
    }

    querySelfPostsByChannel(channelId: string): Promise<any> {
        return this.queryPostsByChannelFromDB(channelId);
    }
    /** query slef post by channel end */
}