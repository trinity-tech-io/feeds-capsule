import { Injectable } from '@angular/core';
import { HiveService } from 'src/app/services/HiveService';
import { Logger } from './logger';
import { DataHelper } from './DataHelper';
import { PostHelperService } from 'src/app/services/post_helper.service';
import { HiveVaultHelper } from 'src/app/services/hivevault_helper.service';
import { en } from 'src/assets/i18n/en';

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

  queryChannelInfo(targetDid: string, channelId: string): Promise<any> {
    return this.hiveVaultHelper.queryChannelInfo(targetDid, channelId);
  }

  /** Post */
  publishPost(channelId: string, tag: string, content: string) {
    return this.hiveVaultHelper.publishPost(channelId, tag, content);
  }

  updatePost(postId: string, channelId: string, newType: string, newTag: string, newContent: string) {
    return this.hiveVaultHelper.updatePost(postId, channelId, newType, newTag, newContent, '');
  }

  deletePost(postId: string, channelId: string) {
    return this.hiveVaultHelper.deletePost(postId, channelId);
  }

  queryPostByChannelId(targetDid: string, channelId: string) {
    return this.hiveVaultHelper.queryPostByChannelId(targetDid, channelId);
  }

  queryPostByRangeOfTime(targetDid: string, channelId: string, star: number, end: number) {
    return this.hiveVaultHelper.queryPostRangeOfTimeScripting(targetDid, channelId, star, end)
  } 
  queryPostById(targetDid: string, channelId: string, postId: string) {
    return this.hiveVaultHelper.queryPostById(targetDid, channelId, postId);
  }

  /** Suscription */
  subscribeChannel(targetDid: string, channelId: string, displayName: string): Promise<any> {
    return this.hiveVaultHelper.subscribeChannel(targetDid, channelId, displayName);
  }

  unSubscribeChannel(targetDid: string, channelId: string) {
    return this.hiveVaultHelper.unsubscribeChannel(targetDid, channelId);
  }

  querySubscrptionInfoByChannelId(targetDid: string, channelId: string) {
    return this.hiveVaultHelper.querySubscriptionInfoByChannelId(targetDid, channelId);
  }

  querySubscriptionInfoByUserDID(targetDid: string, userDid: string) {
    return this.hiveVaultHelper.querySubscriptionByUserDID(targetDid, userDid);
  }

  /** Comment */
  createComment(targetDid: string, channelId: string, postId: string, refcommentId: string, content: string): Promise<any> {
    return this.hiveVaultHelper.createComment(targetDid, channelId, postId, refcommentId, content);
  }

  updateComment(targetDid: string, channelId: string, postId: string, commentId: string, content: string): Promise<any> {
    return this.hiveVaultHelper.updateComment(targetDid, channelId, postId, commentId, content);
  }

  deleteComment(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
    return this.hiveVaultHelper.deleteComment(targetDid, channelId, postId, commentId);
  }

  queryCommentByPostId(targetDid: string, channelId: string, postId: string) {
    return this.hiveVaultHelper.queryCommentByPostId(targetDid, channelId, postId);
  }

  queryCommentByID(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
    return this.hiveVaultHelper.queryCommentByID(targetDid, channelId, postId, commentId);
  }

  /** Like */
  queryLikeByChannel(targetDid: string, channelId: string): Promise<any> {
    return this.hiveVaultHelper.queryLikeByChannel(targetDid, channelId);
  }

  queryLikeById(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
    return this.hiveVaultHelper.queryLikeById(targetDid, channelId, postId, commentId);
  }

  queryLikeByPost(targetDid: string, channelId: string, postId: string): Promise<any> {
    return this.hiveVaultHelper.queryLikeByPost(targetDid, channelId, postId);
  }

  addLike(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
    return this.hiveVaultHelper.addLike(targetDid, channelId, postId, commentId);
  }

  removeLike(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
    return this.hiveVaultHelper.removeLike(targetDid, channelId, postId, commentId);
  }

  /** Download data */
  downloadScripting(targetDid: string, avatarHiveURL: string): Promise<any> {
    return this.hiveVaultHelper.downloadScripting(targetDid, avatarHiveURL)
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