import { Injectable } from '@angular/core';
import { DataHelper } from './DataHelper';
import { ConnectionService } from 'src/app/services/ConnectionService';
import { SerializeDataService } from 'src/app/services/SerializeDataService';
import { UtilService } from './utilService';
import { FeedsUtil } from './feeds_util.service';
import { Events } from 'src/app/services/events.service';
import { StorageService } from 'src/app/services/StorageService';
import { Logger } from './logger';
import { connectivity } from '@elastosfoundation/elastos-connectivity-sdk-cordova';
import { StandardAuthService } from 'src/app/services/StandardAuthService';
import { Config } from './config';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';

const TAG = 'API-FeedsService';

@Injectable()
export class FeedsServiceApi {
  constructor(
    private dataHelper: DataHelper,
    private connectionService: ConnectionService,
    private serializeDataService: SerializeDataService,
    private feedsUtil: FeedsUtil,
    private events: Events,
    private storeService: StorageService,
    private standardAuthService: StandardAuthService,
    private native: NativeService,
    private translate: TranslateService
  ) {
  }

  createChannel(
    nodeId: string,
    name: string,
    introduction: string,
    avatar: any,
  ) {
    if (!this.hasAccessToken(nodeId)) return;
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    //TODO 2.0
    let tipMethods = 'NA';
    //TODO 2.0
    let proof = 'NA';
    this.connectionService.createChannel(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      name,
      introduction,
      avatar,
      accessToken,
      tipMethods,
      proof,
    );
  }

  publishPost(nodeId: string, channelId: string, content: any, tempId: string) {
    if (!this.hasAccessToken(nodeId)) return;

    this.prepareTempPost(nodeId, channelId, tempId, content);
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    let contentHash = UtilService.SHA256(content);
    this.connectionService.publishPost(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      channelId,
      content,
      accessToken,
      tempId,
    );
  }

  declarePost(
    nodeId: string,
    channelId:string,
    content: any,
    withNotify: boolean,
    tempId: string,
    transDataChannel: FeedsData.TransDataChannel,
    imageData: string,
    videoData: string,
  ) {
    if (!this.hasAccessToken(nodeId)) return;

    //TODO 2.0
    let thumbnails = this.serializeDataService.encodeData('');

    //TODO 2.0
    let hashId = 'NA';

    //TODO 2.0
    let proof = 'NA';

    //TODO 2.0
    let originPostUrl = 'NA';

    this.prepareTempMediaPost(
      nodeId,
      channelId,
      tempId,
      0,
      content,
      transDataChannel,
      videoData,
      imageData,
    );
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.declarePost(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      channelId,
      content,
      withNotify,
      accessToken,
      tempId,
      thumbnails,
      hashId,
      proof,
      originPostUrl,
    );

    this.events.publish(FeedsEvent.PublishType.updateTab, true);
  }

  notifyPost(
    nodeId: string,
    channelId: string,
    postId: string,
    tempId: string,
  ) {
    if (!this.hasAccessToken(nodeId)) return;
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.notifyPost(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      channelId,
      postId,
      accessToken,
      tempId,
    );
  }

  postComment(
    nodeId: string,
    channelId: number,
    postId: number,
    commentId: number,
    content: any,
  ) {
    if (!this.hasAccessToken(nodeId)) return;
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.postComment(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      channelId,
      postId,
      commentId,
      content,
      accessToken,
    );
  }

  postLike(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
  ) {
    if (!this.hasAccessToken(nodeId)) return;
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.postLike(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      channelId,
      postId,
      commentId,
      accessToken,
    );
    if (!this.connectionService.checkServerConnection(nodeId)) {
      return;
    }
    this.doPostLikeFinish(nodeId, channelId, postId, commentId);
  }

  postUnlike(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
  ) {
    if (!this.hasAccessToken(nodeId)) return;
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.postUnlike(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      channelId,
      postId,
      commentId,
      accessToken,
    );
    if (!this.connectionService.checkServerConnection(nodeId)) {
      return;
    }
    this.doPostUnLikeFinish(nodeId, channelId, postId, commentId);
  }

  getMyChannels(
    nodeId: string,
    field: Communication.field,
    upper_bound: number,
    lower_bound: number,
    max_counts: number,
  ) {
    if (!this.hasAccessToken(nodeId)) return;
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.getMyChannels(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      field,
      upper_bound,
      lower_bound,
      max_counts,
      accessToken,
    );
  }

  getChannels(
    nodeId: string,
    field: Communication.field,
    upper_bound: number,
    lower_bound: number,
    max_counts: number,
    memo: any = ''
  ) {
    if (!this.hasAccessToken(nodeId)) return;
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.getChannels(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      field,
      upper_bound,
      lower_bound,
      max_counts,
      accessToken,
      memo,
    );
  }

  getChannelDetail(nodeId: string, id: string) {
    if (!this.hasAccessToken(nodeId)) return;
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.getChannelDetail(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      id,
      accessToken,
    );
  }

  getSubscribedChannels(
    nodeId: string,
    field: Communication.field,
    upper_bound: number,
    lower_bound: number,
    max_counts: number,
  ) {
    if (!this.hasAccessToken(nodeId)) return;
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.getSubscribedChannels(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      field,
      upper_bound,
      lower_bound,
      max_counts,
      accessToken,
    );
  }

  getPost(
    nodeId: string,
    channel_id: string,
    by: Communication.field,
    upper_bound: number,
    lower_bound: number,
    max_counts: number,
    memo: any,
  ) {
    if (!this.hasAccessToken(nodeId)) return;
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.getPost(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      channel_id,
      by,
      upper_bound,
      lower_bound,
      max_counts,
      memo,
      accessToken,
    );
  }

  getComments(
    nodeId: string,
    channel_id: string,
    post_id: string,
    by: Communication.field,
    upper_bound: number,
    lower_bound: number,
    max_counts: number,
    isShowOfflineToast: boolean,
    memo: any = ''
  ) {
    if (!this.hasAccessToken(nodeId)) return;
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.getComments(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      channel_id,
      post_id,
      by,
      upper_bound,
      lower_bound,
      max_counts,
      isShowOfflineToast,
      accessToken,
      memo
    );
  }

  getStatistics(nodeId: string) {
    if (!this.hasAccessToken(nodeId)) return;
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.getStatistics(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      accessToken,
    );
  }

  subscribeChannel(nodeId: string, id: string) {
    if (!this.hasAccessToken(nodeId)) return;

    let proof: string = 'NA';
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.subscribeChannel(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      id,
      proof,
      accessToken,
    );

    if (!this.connectionService.checkServerConnection(nodeId)) {
      return;
    }

    this.doSubscribeChannelFinish(nodeId, id);
  }

  unsubscribeChannel(nodeId: string, id: string) {
    if (!this.hasAccessToken(nodeId)) return;

    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.unsubscribeChannel(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      id,
      accessToken,
    );

    if (!this.connectionService.checkServerConnection(nodeId)) {
      return;
    }

    this.doUnsubscribeChannelFinish(nodeId, id);
  }

  editFeedInfo(
    nodeId: string,
    channelId: number,
    name: string,
    desc: string,
    avatar: any,
  ) {
    if (!this.hasAccessToken(nodeId)) return;

    let avatarBin = this.serializeDataService.encodeData(avatar);
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    //TODO 2.0
    let tipMethods = 'NA';
    //TODO 2.0
    let proof = 'NA';
    this.connectionService.editFeedInfo(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      channelId,
      name,
      desc,
      avatarBin,
      accessToken,
      tipMethods,
      proof,
    );
  }

  editPost(nodeId: string, channelId: string, postId: string, content: any) {
    if (!this.hasAccessToken(nodeId)) return;

    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.editPost(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      channelId,
      postId,
      content,
      accessToken,
    );
  }

  deletePost(nodeId: string, channelId: number, postId: number) {
    if (!this.hasAccessToken(nodeId)) return;

    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.deletePost(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      channelId,
      postId,
      accessToken,
    );
  }

  editComment(
    nodeId: string,
    channelId: number,
    postId: number,
    commentId: number,
    commentById: number,
    content: any,
  ) {
    if (!this.hasAccessToken(nodeId)) return;

    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.editComment(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      channelId,
      postId,
      commentId,
      commentById,
      content,
      accessToken,
    );
  }

  deleteComment(
    nodeId: string,
    channelId: number,
    postId: number,
    commentId: number,
  ) {
    if (!this.hasAccessToken(nodeId)) return;

    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.deleteComment(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      channelId,
      postId,
      commentId,
      accessToken,
    );
  }

  updateCredential(nodeId: string, credential: string) {
    if (!this.hasAccessToken(nodeId)) return;

    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.updateCredential(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      credential,
      accessToken,
    );
  }

  enableNotification(nodeId: string) {
    if (!this.hasAccessToken(nodeId)) return;

    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.enableNotification(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      accessToken,
    );
  }

  setBinaryFromMsg(
    nodeId: string,
    key: string,
    content: any,
    feedId: string,
    postId: string,
    commentId: number,
    tempId: string,
  ) {
    if (!this.hasAccessToken(nodeId)) return;

    this.storeService.set(key, content);
    let memo = {
      feedId: feedId,
      postId: postId,
      commentId: commentId,
      tempId: tempId,
    };
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.setBinary(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      key,
      content,
      accessToken,
      memo,
    );
  }

  getBinaryFromMsg(nodeId: string, key: string) {
    if (!this.hasAccessToken(nodeId)) return;
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.getBinary(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      key,
      accessToken,
    );
  }

  standardDidAuth(nodeId: string, verifiablePresentation: string) {
    const localSignInData = this.dataHelper.getLocalSignInData();
    this.connectionService.standardDidAuth(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      verifiablePresentation,
      localSignInData.name,
    );
  }

  getMultiComments(
    nodeId: string,
    channelId: string,
    postId: string,
    by: Communication.field,
    upperBound: number,
    lowerBound: number,
    maxCounts: number,
  ) {
    if (!this.hasAccessToken(nodeId)) return;
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.getMultiComments(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      channelId,
      postId,
      by,
      upperBound,
      lowerBound,
      maxCounts,
      accessToken,
    );
  }

  getMultiSubscribersCount(nodeId: string, channelId: number) {
    if (!this.hasAccessToken(nodeId)) return;
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.getMultiSubscribers(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      channelId,
      accessToken,
    );
  }

  getMultiLikesAndCommentsCount(
    nodeId: string,
    channelId: number,
    postId: number,
    by: Communication.field,
    upperBound: number,
    lowerBound: number,
    maxCount: number,
  ) {
    if (!this.hasAccessToken(nodeId)) return;
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    this.connectionService.getMultiLikesAndCommentsCount(
      this.getServerNameByNodeId(nodeId),
      nodeId,
      channelId,
      postId,
      by,
      upperBound,
      lowerBound,
      maxCount,
      accessToken,
    );
  }

  standardSignIn(nodeId: string) {
    Logger.log(TAG, 'Start getting instance did, nodeId: ', nodeId);

    let connectors = connectivity.getAvailableConnectors();
    Logger.log(TAG, 'Get available connectors', connectors);

    this.standardAuthService.getInstanceDIDDoc().then(didDocument => {
      Logger.log(TAG, 'Standard sign in, nodeId is ', nodeId, ' didDocument is ', didDocument);
      this.connectionService.standardSignIn(
        this.getServerNameByNodeId(nodeId),
        nodeId,
        didDocument,
      );
    });
  }

  ////
  hasAccessToken(nodeId: string): boolean {
    let accessToken = this.dataHelper.getAccessToken(nodeId) || null;
    if (this.checkExp(accessToken)) {
      this.signinChallengeRequest(nodeId, true);
      return false;
    } else {
      return true;
    }
  }

  checkExp(mAccessToken: FeedsData.AccessToken): boolean {
    let accessToken = mAccessToken || null;
    if (accessToken == null || accessToken == undefined) {
      return true;
    }

    let isExpire = accessToken.isExpire;
    if (isExpire) {
      return true;
    }

    return false;
  }

  signinChallengeRequest(nodeId: string, requiredCredential: boolean) {
    Logger.log(TAG, 'Start signin server, nodeId is', nodeId);
    const localSignInData = this.dataHelper.getLocalSignInData();
    if (this.getServerVersionCodeByNodeId(nodeId) < Config.newAuthVersion) {
      this.connectionService.signinChallengeRequest(
        this.getServerNameByNodeId(nodeId),
        nodeId,
        requiredCredential,
        localSignInData.did,
      );
      return;
    }

    this.standardSignIn(nodeId);
  }

  getServerVersionCodeByNodeId(nodeId: string): number {
    return this.dataHelper.getServerVersionCode(nodeId);
  }

  getServerbyNodeId(nodeId: string): FeedsData.Server {
    return this.dataHelper.getServer(nodeId);
  }

  getServerNameByNodeId(nodeId: string): string {
    let serverName = this.translate.instant('common.unknown');
    let server = this.getServerbyNodeId(nodeId);
    if (server != undefined) {
      serverName = server.name;
    }

    return serverName;
  }

  prepareTempPost(
    nodeId: string,
    feedId: string,
    tempId: string,
    contentText: string,
  ) {

    let content = this.parseContent(nodeId, feedId, tempId, 0, contentText);
    let post: FeedsData.Post = {
      nodeId: nodeId,
      channel_id: feedId,
      id: tempId,
      content: content,
      comments: 0,
      likes: 0,
      created_at: UtilService.getCurrentTimeNum(),
      updated_at: UtilService.getCurrentTimeNum(),
      post_status: FeedsData.PostCommentStatus.sending,
    };

    let key = this.feedsUtil.getPostId(nodeId, feedId, tempId);
    this.dataHelper.updatePost(key, post);

    let contentHash = UtilService.SHA256(JSON.stringify(content).toString());
    let tempData = this.dataHelper.generateTempData(
      nodeId,
      feedId,
      "0",
      0,
      contentHash,
      FeedsData.SendingStatus.normal,
      FeedsData.TransDataChannel.MESSAGE,
      '',
      '',
      tempId,
      0,
      content,
    );
    this.dataHelper.updateTempData(key, tempData);
  }


  parseContent(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
    content: any,
  ): FeedsData.Content {
    let contentObj = this.native.parseJSON(content) || '';
    if (contentObj.version != undefined && contentObj.version === '1.0') {
      return this.parseContentV1(
        nodeId,
        channelId,
        postId,
        commentId,
        contentObj,
      );
    } else if (contentObj.version === '2.0') {
      return this.parseContentV2(
        nodeId,
        channelId,
        postId,
        commentId,
        contentObj
      );
    } else {
      return this.parseContentV0(
        nodeId,
        channelId,
        postId,
        commentId,
        contentObj,
      );
    }
  }

  parseContentV2(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
    contentObj: any,
  ): FeedsData.Content {
    let mVersion = contentObj.version || '';
    let mText = contentObj.text || '';
    let videoThumb = contentObj.videoThumbnail || '';
    let mMediaType = FeedsData.MediaType.noMeida;
    let nftTokenId = contentObj.nftTokenId || '';
    let nftOrderId = contentObj.nftOrderId || '';
    let nftImageType = contentObj.nftImageType || '';
    let mMediaDatas: FeedsData.mediaData[] = [];
    mVersion = contentObj.version
    mText = contentObj.text

    nftTokenId = contentObj.nftTokenId;
    nftOrderId = contentObj.nftOrderId;
    nftImageType = contentObj.nftImageType;

    // {"version":"1.0","text":"testText","imageThumbnail":[{"index":0,"imgThumb":"this.imgUrl"}],"videoThumbnail":"this.posterImg"}
    const mediaDatas = contentObj.data;

    for (let index = 0; index < mediaDatas.length; index++) {
      const element = mediaDatas[index];

      const duration = element.duration;
      const kind = element.kind;
      const type = element.type;
      const thumbnailCid = element.thumbnailCid;
      const originMediaCid = element.originMediaCid;
      const size = element.size;
      const memo = element.memo;
      const additionalInfo = element.additionalInfo;
      const imageIndex = element.imageIndex;

      if (kind == 'image') {
        mMediaType = FeedsData.MediaType.containsImg;
      } else if (kind == 'video') {
        mMediaType = FeedsData.MediaType.containsVideo
      } else {
        mMediaType = FeedsData.MediaType.noMeida
      }

      const mData: FeedsData.mediaData = {
        kind: kind,
        originMediaCid: originMediaCid,
        type: type,
        size: size,
        imageIndex: index,
        thumbnailCid: thumbnailCid,
        duration: duration,
        additionalInfo: additionalInfo,
        memo: memo
      }
      mMediaDatas.push(mData);
    }

    const content: FeedsData.Content = {
      version: mVersion,
      text: mText,
      mediaType: mMediaType,
      videoThumbKey: null,
      imgThumbKeys: null,
      nftTokenId: nftTokenId,
      nftOrderId: nftOrderId,
      nftImageType: nftImageType,
      mediaDatas: mMediaDatas
    };

    return content;
  }


  parseContentV1(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
    contentObj: any,
  ): FeedsData.Content {
    // {"version":"1.0","text":"testText","imageThumbnail":[{"index":0,"imgThumb":"this.imgUrl"}],"videoThumbnail":"this.posterImg"}
    let mVersion = contentObj.version || '';
    let mText = contentObj.text || '';
    let videoThumb = contentObj.videoThumbnail || '';
    let mMediaType = FeedsData.MediaType.noMeida;
    let nftTokenId = contentObj.nftTokenId || '';
    let nftOrderId = contentObj.nftOrderId || '';
    let nftImageType = contentObj.nftImageType || '';

    let videoThumbKeyObj: FeedsData.VideoThumbKey = undefined;
    if (videoThumb != '') {
      let mDuration = videoThumb.duration;
      let size = videoThumb.videoSize || 0;
      let mVideoThumbKey = this.feedsUtil.getVideoThumbKey(
        nodeId,
        channelId,
        postId,
        commentId,
        0,
      );
      this.storeService.set(mVideoThumbKey, videoThumb.videoThumb);
      mMediaType = FeedsData.MediaType.containsVideo;

      videoThumbKeyObj = {
        videoThumbKey: mVideoThumbKey,
        duration: mDuration,
        videoSize: size,
      };
    }

    let imageThumbs = contentObj.imageThumbnail || '';
    let imgThumbKeys: FeedsData.ImageThumbKey[] = [];
    if (imageThumbs != '') {
      for (let index = 0; index < imageThumbs.length; index++) {
        let imageThumb: FeedsData.ImgThumb = imageThumbs[index];
        let thumbIndex = imageThumb.index;
        let image = imageThumb.imgThumb;
        let size = imageThumb.imgSize;
        let key = this.feedsUtil.getImageThumbnailKey(
          nodeId,
          channelId,
          postId,
          commentId,
          thumbIndex,
        );
        this.storeService.set(key, image);

        imgThumbKeys[index] = {
          index: thumbIndex,
          imgThumbKey: key,
          imgSize: size,
        };
      }
      mMediaType = FeedsData.MediaType.containsImg;
    }

    let content: FeedsData.Content = {
      version: mVersion,
      text: mText,
      mediaType: mMediaType,
      videoThumbKey: videoThumbKeyObj,
      imgThumbKeys: imgThumbKeys,
      nftTokenId: nftTokenId,
      nftOrderId: nftOrderId,
      nftImageType: nftImageType,
      mediaDatas: null
    };

    return content;
  }

  parseContentV0(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
    contentObj: any,
  ): FeedsData.Content {
    // {"text":"test","img":""}
    let text = this.parsePostContentText(contentObj) || '';
    let img = this.parsePostContentImg(contentObj) || '';
    let imgThumbKeys: FeedsData.ImageThumbKey[] = [];
    let mMediaType = FeedsData.MediaType.noMeida;
    if (img != '') {
      let key = this.feedsUtil.getImageThumbnailKey(
        nodeId,
        channelId,
        postId,
        commentId,
        0,
      );
      let size = img.length || 0;
      this.storeService.set(key, img);

      imgThumbKeys[0] = {
        index: 0,
        imgThumbKey: key,
        imgSize: size,
      };
      mMediaType = FeedsData.MediaType.containsImg;
    }

    let content: FeedsData.Content = {
      version: '0',
      text: text,
      mediaType: mMediaType,
      videoThumbKey: undefined,
      imgThumbKeys: imgThumbKeys,
      nftTokenId: null,
      nftOrderId: null,
      nftImageType: null,
      mediaDatas: null,
    };

    return content;
  }

  parsePostContentText(content: any): string {
    let contentObj = this.native.parseJSON(content) || '';

    if (contentObj.text != undefined) return contentObj.text;

    if (typeof contentObj != 'string') return '';

    return contentObj;
  }

  parsePostContentImg(content: any): string {
    let contentObj = this.native.parseJSON(content) || '';

    if (contentObj.img != undefined) return contentObj.img;

    if (typeof contentObj != 'string') return '';

    return contentObj;
  }

  prepareTempMediaPost(
    nodeId: string,
    feedId: string,
    tempId: string,
    commentId: number,
    contentReal: any,
    transDataChannel: FeedsData.TransDataChannel,
    videoData: string,
    imageData: string,
  ) {
    let content = this.parseContent(nodeId, feedId, tempId, 0, contentReal);
    let post: FeedsData.Post = {
      nodeId: nodeId,
      channel_id: feedId,
      id: tempId,
      content: content,
      comments: 0,
      likes: 0,
      created_at: UtilService.getCurrentTimeNum(),
      updated_at: UtilService.getCurrentTimeNum(),
      post_status: FeedsData.PostCommentStatus.sending,
    };

    let key = this.feedsUtil.getPostId(nodeId, feedId, tempId);

    this.dataHelper.updatePost(key, post);

    let contentHash = UtilService.SHA256(contentReal);
    let tempData = this.dataHelper.generateTempData(
      nodeId,
      feedId,
      "0",
      0,
      contentHash,
      FeedsData.SendingStatus.needDeclearPost,
      transDataChannel,
      videoData,
      imageData,
      tempId,
      0,
      contentReal,
    );
    this.dataHelper.updateTempData(key, tempData);
  }

  doPostLikeFinish(
    nodeId: string,
    channel_id: string,
    post_id: string,
    comment_id: number,
  ) {
    let key = this.feedsUtil.getPostId(nodeId, channel_id, post_id);
    if (comment_id == 0) {
      let likesObj = this.dataHelper.generateLikes(
        nodeId,
        channel_id,
        post_id,
        0,
      );
      this.dataHelper.updateLikesWithoutSave(key, likesObj);

      let originPost = this.dataHelper.getPost(key);
      originPost.likes = originPost.likes + 1;
      this.dataHelper.updatePostWithoutSave(key, originPost);

      this.events.publish(
        FeedsEvent.PublishType.updateLikeList,
        this.dataHelper.getLikedPostList(),
      );
      this.events.publish(FeedsEvent.PublishType.postDataUpdate);
    } else {
      let commentKey = this.feedsUtil.getKey(
        nodeId,
        channel_id,
        post_id,
        comment_id,
      );
      let likedComment = this.dataHelper.generatedLikedComment(
        nodeId,
        channel_id,
        post_id,
        comment_id,
      );
      this.dataHelper.updateLikedComment(commentKey, likedComment);

      let originComment = this.dataHelper.getComment(
        nodeId,
        channel_id,
        post_id,
        comment_id,
      );
      originComment.likes = originComment.likes + 1;
      this.dataHelper.updateComment(
        nodeId,
        channel_id,
        post_id,
        comment_id,
        originComment,
      );

      this.events.publish(FeedsEvent.PublishType.commentDataUpdate);
    }
  }

  doPostUnLikeFinish(
    nodeId: string,
    channel_id: string,
    post_id: string,
    comment_id: number,
  ) {
    let key = this.feedsUtil.getPostId(nodeId, channel_id, post_id);

    if (comment_id == 0) {
      this.dataHelper.deleteLikes(key);
      let originPost = this.dataHelper.getPost(key);
      let likeNum = originPost.likes;
      if (likeNum > 0) {
        originPost.likes = likeNum - 1;
        this.dataHelper.updatePostWithoutSave(key, originPost);
      }
      this.events.publish(
        FeedsEvent.PublishType.updateLikeList,
        this.dataHelper.getLikedPostList(),
      );
      this.events.publish(FeedsEvent.PublishType.postDataUpdate);
    } else {
      let originComment = this.dataHelper.getComment(
        nodeId,
        channel_id,
        post_id,
        comment_id,
      );
      let likeNum = originComment.likes;
      if (likeNum > 0) {
        originComment.likes = likeNum - 1;
        this.dataHelper.updateComment(
          nodeId,
          channel_id,
          post_id,
          comment_id,
          originComment,
        );
      }
      let commentKey = this.feedsUtil.getKey(
        nodeId,
        channel_id,
        post_id,
        comment_id,
      );
      this.dataHelper.deleteLikedComment(commentKey);
      this.events.publish(FeedsEvent.PublishType.commentDataUpdate);
    }
  }

  doSubscribeChannelFinish(nodeId: string, channelId: string) {
    let nodeChannelId = this.feedsUtil.getChannelId(nodeId, channelId);
    let originChannel = this.dataHelper.getChannel(nodeChannelId);

    const originChannelForHive = originChannel
    if (originChannel == null) return;

    originChannel.isSubscribed = true;

    let subscribeNum = originChannel.subscribers;
    originChannel.subscribers = subscribeNum + 1;

    this.dataHelper.updateChannel(nodeChannelId, originChannel);

    // this.hiveService.updateOne(originChannelForHive, originChannel)
    let subscribeFinishData: FeedsEvent.SubscribeFinishData = {
      nodeId: nodeId,
      channelId: channelId,
    };
    this.events.publish(
      FeedsEvent.PublishType.subscribeFinish,
      subscribeFinishData,
    );
  }

  doUnsubscribeChannelFinish(nodeId: string, channelId: string) {
    let nodeChannelId = this.feedsUtil.getChannelId(nodeId, channelId);
    let originChannel = this.dataHelper.getChannel(nodeChannelId);

    const originChannelForHive = originChannel
    originChannel.isSubscribed = false;
    let subscribeNum = originChannel.subscribers;
    if (subscribeNum > 0) originChannel.subscribers = subscribeNum - 1;
    this.dataHelper.updateChannel(nodeChannelId, originChannel);

    // this.hiveService.updateOne(originChannelForHive, originChannel)
    let unsubscribeData: FeedsEvent.unsubscribeData = {
      nodeId: nodeId,
      channelId: channelId,
      channelName: originChannel.name,
    };
    this.events.publish(FeedsEvent.PublishType.unsubscribeFinish, unsubscribeData);
  }
}
