import { Injectable } from '@angular/core';
import { HiveService } from 'src/app/services/HiveService';
import { Logger } from './logger';
import { DataHelper } from './DataHelper';
import { PostHelperService } from 'src/app/services/post_helper.service';
import { HiveVaultHelper } from 'src/app/services/hivevault_helper.service';

const TAG = 'API-HiveVault';

@Injectable()
export class HiveVaultApi {
  constructor(
    private hiveService: HiveService,
    private dataHelper: DataHelper,
    private postHelperService: PostHelperService,
    private hiveVaultHelper: HiveVaultHelper
  ) {
  }

  registeScripting(): Promise<string> {
    return this.hiveVaultHelper.registeScripting();
  }

  createAllCollections(): Promise<string> {
    return this.hiveVaultHelper.createAllCollections();
  }

  /** Channel */
  createChannel(channelName: string, intro: string, avatarAddress: string, tippingAddress: string = '', type: string = 'public', nft: string = '', category: string = '', proof: string = ''): Promise<any> {
    return this.hiveVaultHelper.createChannel(channelName, intro, avatarAddress, tippingAddress, type, nft);
  }

  updateChannel(channelId: string, newName: string, newIntro: string, newAvatar: string, newType: string, newMemo: string,
    newTippingAddress: string, newNft: string) {
    return this.hiveVaultHelper.updateChannel(channelId, newName, newIntro, newAvatar, newType, newMemo, newTippingAddress, newNft);
  }

  queryChannelInfo(channelId: string, targetDid: string): Promise<any> {
    return this.hiveVaultHelper.queryChannelInfo(channelId, targetDid);
  }

  /** Post */
  publishPost(channelId: string, tag: string, content: string) {
    return this.hiveVaultHelper.publishPost(channelId, tag, content);
  }

  updatePost(postId: string, channelId: string, newType: string, newTag: string, newContent: string) {
    return this.hiveVaultHelper.updatePost(postId, channelId, newType, newTag, newContent, '', FeedsData.PostCommentStatus.edited);
  }

  deletePost(postId: string) {
    return this.hiveVaultHelper.deletePost(postId);
  }

  queryPostByChannelId(channelId: string, targetDid: string) {
    return this.hiveVaultHelper.queryPostByChannelId(channelId, targetDid);
  }

  queryPostById(channelId: string, postId: string, targetDid: string) {
    return this.hiveVaultHelper.queryPostById(channelId, postId, targetDid);
  }

  /** Suscription */
  subscribeChannel(channelId: string, displayName: string, targetDid: string): Promise<any> {
    return this.hiveVaultHelper.subscribeChannel(channelId, displayName, targetDid);
  }

  unSubscribeChannel(channelId: string, targetDid: string) {
    return this.hiveVaultHelper.unsubscribeChannel(channelId, targetDid);
  }

  querySubscrptionInfoByChannelId(channelId: string, targetDid: string) {
    return this.hiveVaultHelper.querySubscriptionInfoByChannelId(channelId, targetDid);
  }

  querySubscriptionInfoByUserDID(userDid: string, targetDid: string) {
    return this.hiveVaultHelper.querySubscriptionByUserDID(userDid, targetDid);
  }

  /** Comment */
  createComment(channelId: string, postId: string, refcommentId: string, content: string, targetDid: string): Promise<any> {
    return this.hiveVaultHelper.createComment(channelId, postId, refcommentId, content, targetDid);
  }

  updateComment(channelId: string, postId: string, commentId: string, content: string, targetDid: string): Promise<any> {
    return this.hiveVaultHelper.updateComment(channelId, postId, commentId, content, targetDid);
  }

  deleteComment(channelId: string, postId: string, commentId: string, targetDid: string): Promise<any> {
    return this.hiveVaultHelper.deleteComment(channelId, postId, commentId, targetDid);
  }

  queryCommentByPostId(channelId: string, postId: string, targetDid: string) {
    return this.hiveVaultHelper.queryCommentByPostId(channelId, postId, targetDid);
  }

  queryCommentByID(channelId: string, postId: string, commentId: string, targetDid: string): Promise<any> {
    return this.hiveVaultHelper.queryCommentByID(channelId, postId, commentId, targetDid);
  }

  /** Like */
  queryLikeByChannel(channelId: string, targetDid: string): Promise<any> {
    return this.hiveVaultHelper.queryLikeByChannel(channelId, targetDid);
  }

  queryLikeById(channelId: string, postId: string, commentId: string, targetDid: string): Promise<any> {
    return this.hiveVaultHelper.queryLikeById(channelId, postId, commentId, targetDid);
  }

  queryLikeByPost(channelId: string, postId: string, targetDid: string): Promise<any> {
    return this.hiveVaultHelper.queryLikeByPost(channelId, postId, targetDid);
  }

  addLike(channelId: string, postId: string, commentId: string, targetDid: string): Promise<any> {
    return this.hiveVaultHelper.addLike(channelId, postId, commentId, targetDid);
  }

  removeLike(channelId: string, postId: string, commentId: string, targetDid: string): Promise<any> {
    return this.hiveVaultHelper.removeLike(channelId, postId, commentId, targetDid);
  }

  /** Download data */
  downloadScripting(avatarHiveURL: string, targetDid: string): Promise<any> {
    return this.hiveVaultHelper.downloadScripting(avatarHiveURL, targetDid)
  }

  downloadCustomeAvatar(remoteHiveUrlPath: string): Promise<any> {
    return this.hiveVaultHelper.downloadFile(remoteHiveUrlPath);
  }

  downloadEssAvatar(): Promise<any> {
    return this.hiveVaultHelper.downloadEssAvatar();
  }

  uploadMediaData(data: any): Promise<string> {
    return this.hiveVaultHelper.uploadMediaData(data);
  }

  /** selfData */
  querySelfChannels(): Promise<any> {
    return this.hiveVaultHelper.querySelfChannels();
  }

  querySelfPosts(): Promise<any> {
    return this.hiveVaultHelper.querySelfPosts();
  }

}