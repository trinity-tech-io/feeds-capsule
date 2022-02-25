import { Injectable } from '@angular/core';
import { Logger } from './logger';
import { DataHelper } from 'src/app/services/DataHelper';

@Injectable()
export class FeedsUtil {
  constructor(private dataHelper: DataHelper) {
  }

  public getKey(
    nodeId: string,
    channelId: number,
    postId: number,
    commentId: number,
  ): string {
    return this.dataHelper.getKey(nodeId, channelId, postId, commentId);
  }

  public getChannelId(
    nodeId: string,
    channelId: number) {
    return this.getKey(nodeId, channelId, 0, 0);
  }

  public getPostId(
    nodeId: string,
    channelId: number,
    postId: number): string {
    return this.getKey(nodeId, channelId, postId, 0);
  }

  public getTextKey(
    nodeId: string,
    channelId: number,
    postId: number,
    commentId: number,
    index: number,
  ) {
    this.getKey(nodeId, channelId, postId, commentId) + '-text-' + index;
  }

  public getImageKey(
    nodeId: string,
    channelId: number,
    postId: number,
    commentId: number,
    index: number,
  ) {
    return this.getKey(nodeId, channelId, postId, commentId) + '-img-' + index;
  }

  public getImageThumbnailKey(
    nodeId: string,
    channelId: number,
    postId: number,
    commentId: number,
    index: number,
  ) {
    return (
      this.getKey(nodeId, channelId, postId, commentId) +
      '-img-thumbnail-' +
      index
    );
  }

  public getVideoKey(
    nodeId: string,
    channelId: number,
    postId: number,
    commentId: number,
    index: number,
  ) {
    return (
      this.getKey(nodeId, channelId, postId, commentId) + '-video-' + index
    );
  }

  public getVideoThumbKey(
    nodeId: string,
    channelId: number,
    postId: number,
    commentId: number,
    index: number,
  ) {
    return (
      this.getKey(nodeId, channelId, postId, commentId) +
      '-video-thumbnail-' +
      index
    );
  }
}
