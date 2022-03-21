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
  createChannel(channelName: string, intro: string, avatarAddress: string, tippingAddress: string = '', type: string = 'public', nft: string = ''): Promise<any> {
    return this.hiveVaultHelper.createChannel(channelName, intro, avatarAddress, tippingAddress, type, nft);
  }

  updateChannel(channelId: string, newName: string, newIntro: string, newAvatar: string, newType: string, newMemo: string,
    newTippingAddress: string, newNft: string) {
    return this.hiveVaultHelper.updateChannel(channelId, newName, newIntro, newAvatar, newType, newMemo, newTippingAddress, newNft);
  }

  queryChannelInfo(destDid: string, channelId: string) {
    return this.hiveVaultHelper.queryChannelInfo(destDid, channelId);
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

  queryPostByChannelId(destDid: string, channelId: string) {
    return this.hiveVaultHelper.queryPostByChannelId(destDid, channelId);
  }

  queryPostById(destDid: string, channelId: string, postId: string) {
    return this.hiveVaultHelper.queryPostById(destDid, channelId, postId);
  }

  /** Suscription */
  subscribeChannel(destDid: string, channelId: string, displayName: string) {
    return this.hiveVaultHelper.subscribeChannel(destDid, channelId, displayName);
  }

  unSubscribeChannel(destDid: string, channelId: string) {
    return this.hiveVaultHelper.unsubscribeChannel(destDid, channelId);
  }

  querySubscrptionInfoByChannelId(destDid: string, channelId: string) {
    return this.hiveVaultHelper.querySubscriptionInfoByChannelId(destDid, channelId);
  }

  querySubscriptionInfoByUserDID(destDid: string, userDid: string) {
    return this.hiveVaultHelper.querySubscriptionByUserDID(destDid, userDid);
  }

  /** Comment */
  createComment(destDid: string, channelId: string, postId: string, refcommentId: string, content: string): Promise<any> {
    return this.hiveVaultHelper.createComment(destDid, channelId, postId, refcommentId, content);
  }

  updateComment(destDid: string, channelId: string, postId: string, commentId: string, content: string): Promise<any> {
    return this.hiveVaultHelper.updateComment(destDid, channelId, postId, commentId, content);
  }

  deleteComment(destDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
    return this.hiveVaultHelper.deleteComment(destDid, channelId, postId, commentId);
  }

  queryCommentByPostId(destDid: string, channelId: string, postId: string) {
    return this.hiveVaultHelper.queryCommentByPostId(destDid, channelId, postId);
  }

  queryCommentByID(destDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
    return this.hiveVaultHelper.queryCommentByID(destDid, channelId, postId, commentId);
  }

  /** Like */
  queryLikeByChannel(destDid: string, channelId: string): Promise<any> {
    return this.hiveVaultHelper.queryLikeByChannel(destDid, channelId);
  }

  queryLikeById(destDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
    return this.hiveVaultHelper.queryLikeById(destDid, channelId, postId, commentId);
  }

  queryLikeByPost(destDid: string, channelId: string, postId: string): Promise<any> {
    return this.hiveVaultHelper.queryLikeByPost(destDid, channelId, postId);
  }

  addLike(destDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
    return this.hiveVaultHelper.addLike(destDid, channelId, postId, commentId);
  }

  removeLike(userDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
    return this.hiveVaultHelper.removeLike(userDid, channelId, postId, commentId);
  }


  /** Download data */
  downloadScripting(destDid: string, avatarHiveURL: string): Promise<any> {
    return this.hiveVaultHelper.downloadScripting(destDid, avatarHiveURL)
  }

  downloadCustomeAvatar(remoteHiveUrlPath: string): Promise<any> {
    return this.hiveVaultHelper.downloadCustomeAvatar(remoteHiveUrlPath);
  }

  downloadEssAvatar(): Promise<any> {
    return this.hiveVaultHelper.downloadEssAvatar();
  }

  uploadMediaData(data: any): Promise<string> {
    return this.hiveVaultHelper.uploadMediaData(data);
  }
}