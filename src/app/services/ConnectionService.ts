import { Injectable } from '@angular/core';
import { Events } from 'src/app/services/events.service';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { JsonRPCService } from 'src/app/services/JsonRPCService';
import { SerializeDataService } from 'src/app/services/SerializeDataService';
import { FormatInfoService } from 'src/app/services/FormatInfoService';

@Injectable()
export class ConnectionService {
  public friendConnectionMap: { [nodeId: string]: FeedsData.ConnState };

  constructor(
    private events: Events,
    private native: NativeService,
    private translate: TranslateService,
    private jsonRPCService: JsonRPCService,
    private serializeDataService: SerializeDataService,
    private formatInfoService: FormatInfoService,
  ) { }

  request() { }

  createChannel(
    serverName: string,
    nodeId: string,
    name: string,
    introduction: string,
    avatar: any,
    accessToken: FeedsData.AccessToken,
    tipMethods: string,
    proof: string,
  ) {
    if (accessToken == null || accessToken == undefined) return;
    let avatarBin = this.serializeDataService.encodeData(avatar);

    let request: Communication.create_channel_request = {
      version: '2.0',
      method: 'create_channel',
      id: -1,
      params: {
        access_token: accessToken.token,
        name: name,
        introduction: introduction,
        avatar: avatarBin,
        tip_methods: tipMethods,
        proof: proof,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
    );
  }

  publishPost(
    serverName: string,
    nodeId: string,
    channelId: string,
    content: any,
    accessToken: FeedsData.AccessToken,
    tempId: string,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let contentBin = this.serializeDataService.encodeData(content);

    let memo = {
      tempId: tempId,
    };
    //TODO 2.0
    let thumbnails = this.serializeDataService.encodeData('');
    //TODO 2.0
    let hashId = 'NA';
    //TODO 2.0
    let proof = 'NA';
    //TODO 2.0
    let originPostUrl = 'NA';
    let request: Communication.publish_post_request = {
      version: '2.0',
      method: 'publish_post',
      id: -1,
      params: {
        access_token: accessToken.token,
        channel_id: Number(channelId),
        content: contentBin,
        thumbnails: thumbnails,
        hash_id: hashId,
        proof: proof,
        origin_post_url: originPostUrl,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      memo,
      request.version,
    );
  }

  //added v1.3.0 server
  // 向服务器发送post
  declarePost(
    serverName: string,
    nodeId: string,
    channelId: string,
    content: any,
    withNotify: boolean,
    accessToken: FeedsData.AccessToken,
    tempId: string,
    thumbnails: any,
    hashId: string,
    proof: string,
    originPostUrl: string,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let contentBin = this.serializeDataService.encodeData(content);

    let request: Communication.declare_post_request = {
      version: '2.0',
      method: 'declare_post',
      id: -1,
      params: {
        access_token: accessToken.token,
        channel_id: Number(channelId),
        content: contentBin,
        with_notify: withNotify,
        thumbnails: thumbnails,
        hash_id: hashId,
        proof: proof,
        origin_post_url: originPostUrl,
      },
    };

    let memo = {
      tempId: tempId,
    };

    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      memo,
      request.version,
    );
  }

  //added v1.3.0 server
  notifyPost(
    serverName: string,
    nodeId: string,
    channelId: string,
    postId: string,
    accessToken: FeedsData.AccessToken,
    tempId: string,
  ) {
    if (accessToken == null || accessToken == undefined) return;
    let memo = {
      tempId: tempId,
    };

    let request: Communication.notify_post_request = {
      version: '1.0',
      method: 'notify_post',
      id: -1,
      params: {
        access_token: accessToken.token,
        channel_id: Number(channelId),
        post_id: Number(postId),
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      memo,
      request.version,
    );
  }

  postComment(
    serverName: string,
    nodeId: string,
    channelId: number,
    postId: number,
    commentId: number,
    content: any,
    accessToken: FeedsData.AccessToken,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let contentBin = this.serializeDataService.encodeData(content);
    //TODO 2.0
    let thumbnails = this.serializeDataService.encodeData('');
    //TODO 2.0
    let hashId = 'NA';
    //TODO 2.0
    let proof = 'NA';
    let request: Communication.post_comment_request = {
      version: '2.0',
      method: 'post_comment',
      id: -1,
      params: {
        access_token: accessToken.token,
        channel_id: channelId,
        post_id: postId,
        comment_id: commentId,
        content: contentBin,
        thumbnails: thumbnails,
        hash_id: hashId,
        proof: proof,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
    );
  }

  postLike(
    serverName: string,
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
    accessToken: FeedsData.AccessToken,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    //TODO 2.0
    let proof = 'NA';
    let request: Communication.post_like_request = {
      version: '2.0',
      method: 'post_like',
      id: -1,
      params: {
        access_token: accessToken.token,
        channel_id: channelId,
        post_id: postId,
        comment_id: commentId,
        proof: proof,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
    );
  }

  postUnlike(
    serverName: string,
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
    accessToken: FeedsData.AccessToken,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let request: Communication.post_unlike_request = {
      version: '1.0',
      method: 'post_unlike',
      id: -1,
      params: {
        access_token: accessToken.token,
        channel_id: channelId,
        post_id: postId,
        comment_id: commentId,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
    );
  }

  getMyChannels(
    serverName: string,
    nodeId: string,
    field: Communication.field,
    upper_bound: number,
    lower_bound: number,
    max_counts: number,
    accessToken: FeedsData.AccessToken,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let request: Communication.get_my_channels_request = {
      version: '1.0',
      method: 'get_my_channels',
      id: -1,
      params: {
        access_token: accessToken.token,
        by: field,
        upper_bound: upper_bound,
        lower_bound: lower_bound,
        max_count: max_counts,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
      false,
    );
  }

  getChannels(
    serverName: string,
    nodeId: string,
    field: Communication.field,
    upper_bound: number,
    lower_bound: number,
    max_counts: number,
    accessToken: FeedsData.AccessToken,
    memo: any = ''
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let request: Communication.get_channels_request = {
      version: '2.0',
      method: 'get_channels',
      id: -1,
      params: {
        access_token: accessToken.token,
        by: field,
        upper_bound: upper_bound,
        lower_bound: lower_bound,
        max_count: max_counts,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      memo,
      request.version,
      false,
    );
  }

  getChannelDetail(
    serverName: string,
    nodeId: string,
    id: string,
    accessToken: FeedsData.AccessToken,
    memo: any = ''
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let request: Communication.get_channel_detail_request = {
      version: '1.0',
      method: 'get_channel_detail',
      id: -1,
      params: {
        access_token: accessToken.token,
        id: id,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      memo,
      request.version,
      false,
    );
  }

  getSubscribedChannels(
    serverName: string,
    nodeId: string,
    field: Communication.field,
    upper_bound: number,
    lower_bound: number,
    max_counts: number,
    accessToken: FeedsData.AccessToken,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let request: Communication.get_subscribed_channels_request = {
      version: '2.0',
      method: 'get_subscribed_channels',
      id: -1,
      params: {
        access_token: accessToken.token,
        by: field,
        upper_bound: upper_bound,
        lower_bound: lower_bound,
        max_count: max_counts,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
      false,
    );
  }

  getPost(
    serverName: string,
    nodeId: string,
    channel_id: string,
    by: Communication.field,
    upper_bound: number,
    lower_bound: number,
    max_counts: number,
    memo: any,
    accessToken: FeedsData.AccessToken,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let request: Communication.get_posts_request = {
      version: '2.0',
      method: 'get_posts',
      id: -1,
      params: {
        access_token: accessToken.token,
        channel_id: Number(channel_id),
        by: by,
        upper_bound: upper_bound,
        lower_bound: lower_bound,
        max_count: max_counts,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      memo,
      request.version,
      false,
    );
  }

  getComments(
    serverName: string,
    nodeId: string,
    channel_id: string,
    post_id: string,
    by: Communication.field,
    upper_bound: number,
    lower_bound: number,
    max_counts: number,
    isShowOfflineToast: boolean,
    accessToken: FeedsData.AccessToken,
    memo: any
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let request: Communication.get_comments_request = {
      version: '2.0',
      method: 'get_comments',
      id: -1,
      params: {
        access_token: accessToken.token,
        channel_id: channel_id,
        post_id: post_id,
        by: by,
        upper_bound: upper_bound,
        lower_bound: lower_bound,
        max_count: max_counts,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      memo,
      request.version,
      isShowOfflineToast,
    );
  }

  getStatistics(
    serverName: string,
    nodeId: string,
    accessToken: FeedsData.AccessToken,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let request: Communication.get_statistics_request = {
      version: '1.0',
      method: 'get_statistics',
      id: -1,
      params: {
        access_token: accessToken.token,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
      false,
    );
  }

  subscribeChannel(
    serverName: string,
    nodeId: string,
    id: string,
    proof: string,
    accessToken: FeedsData.AccessToken,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let request: Communication.subscribe_channel_request = {
      version: '2.0',
      method: 'subscribe_channel',
      id: -1,
      params: {
        access_token: accessToken.token,
        id: id,
        proof: proof,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
    );
  }

  unsubscribeChannel(
    serverName: string,
    nodeId: string,
    id: string,
    accessToken: FeedsData.AccessToken,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let request: Communication.unsubscribe_channel_request = {
      version: '1.0',
      method: 'unsubscribe_channel',
      id: -1,
      params: {
        access_token: accessToken.token,
        id: id,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
    );
  }

  editFeedInfo(
    serverName: string,
    nodeId: string,
    channelId: number,
    name: string,
    desc: string,
    avatarBin: any,
    accessToken: FeedsData.AccessToken,
    tipMethods: string,
    proof: string,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let request: Communication.update_feedinfo_request = {
      version: '2.0',
      method: 'update_feedinfo',
      id: -1,
      params: {
        access_token: accessToken.token,
        id: channelId, //channelId
        name: name,
        introduction: desc,
        avatar: avatarBin,
        tip_methods: tipMethods,
        proof: proof,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
    );
  }

  enableNotification(
    serverName: string,
    nodeId: string,
    accessToken: FeedsData.AccessToken,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let request: Communication.enable_notification_request = {
      version: '1.0',
      method: 'enable_notification',
      id: -1,
      params: {
        access_token: accessToken.token,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
    );
  }

  signinChallengeRequest(
    serverName: string,
    nodeId: string,
    requiredCredential: boolean,
    did: string,
  ) {
    let request: Communication.signin_request_challenge_request = {
      version: '1.0',
      method: 'signin_request_challenge',
      id: -1,
      params: {
        iss: did,
        credential_required: requiredCredential,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
    );
  }

  declareOwnerRequest(
    serverName: string,
    nodeId: string,
    nonce: string,
    did: string,
  ) {
    let request: Communication.declare_owner_request = {
      version: '1.0',
      method: 'declare_owner',
      id: -1,
      params: {
        nonce: nonce,
        owner_did: did,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
      false,
    );
  }

  importDidRequest(
    serverName: string,
    nodeId: string,
    mnemonic: string,
    passphrase: string,
    index: number,
  ) {
    let request: Communication.import_did_request = {
      version: '1.0',
      method: 'import_did',
      id: -1,
      params: {
        mnemonic: mnemonic,
        passphrase: passphrase,
        index: index,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
    );
  }

  createDidRequest(serverName: string, nodeId: string) {
    let request: Communication.create_did_request = {
      version: '1.0',
      method: 'import_did',
      id: -1,
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      null,
      '',
      request.version,
    );
  }

  issueCredentialRequest(
    serverName: string,
    nodeId: string,
    credential: string,
  ) {
    let request: Communication.issue_credential_request = {
      version: '1.0',
      method: 'issue_credential',
      id: -1,
      params: {
        credential: credential,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
    );
  }

  editPost(
    serverName: string,
    nodeId: string,
    channelId: string,
    postId: string,
    content: any,
    accessToken: FeedsData.AccessToken,
  ) {
    if (accessToken == null || accessToken == undefined) return;
    //TODO 2.0
    let thumbnails = this.serializeDataService.encodeData('');
    //TODO 2.0
    let hashId = 'NA';
    //TODO 2.0
    let proof = 'NA';
    //TODO 2.0
    let originPostUrl = 'NA';

    let contentBin = this.serializeDataService.encodeData(content);
    let request: Communication.edit_post_request = {
      version: '2.0',
      method: 'edit_post',
      id: -1,
      params: {
        access_token: accessToken.token,
        channel_id: Number(channelId),
        id: Number(postId),
        content: contentBin,
        thumbnails: thumbnails,
        hash_id: hashId,
        proof: proof,
        origin_post_url: originPostUrl,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
    );
  }

  deletePost(
    serverName: string,
    nodeId: string,
    channelId: number,
    postId: number,
    accessToken: FeedsData.AccessToken,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let request: Communication.delete_post_request = {
      version: '1.0',
      method: 'delete_post',
      id: -1,
      params: {
        access_token: accessToken.token,
        channel_id: channelId,
        id: postId,
      },
    };

    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
    );
  }

  editComment(
    serverName: string,
    nodeId: string,
    channelId: number,
    postId: number,
    commentId: number,
    commentById: number,
    content: any,
    accessToken: FeedsData.AccessToken,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let contentBin = this.serializeDataService.encodeData(content);

    //TODO 2.0
    let thumbnails = this.serializeDataService.encodeData('');
    //TODO 2.0
    let hashId = 'NA';
    //TODO 2.0
    let proof = 'NA';
    let request: Communication.edit_comment_request = {
      version: '2.0',
      method: 'edit_comment',
      id: -1,
      params: {
        access_token: accessToken.token,
        channel_id: channelId, //channel_id
        post_id: postId, //post_id
        id: commentId, //comment_id
        comment_id: commentById, //comment_id | 0
        content: contentBin, //bin
        thumbnails: thumbnails,
        hash_id: hashId,
        proof: proof,
      },
    };

    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
    );
  }

  deleteComment(
    serverName: string,
    nodeId: string,
    channelId: number,
    postId: number,
    commentId: number,
    accessToken: FeedsData.AccessToken,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let request: Communication.delete_comment_request = {
      version: '1.0',
      method: 'delete_comment',
      id: -1,
      params: {
        access_token: accessToken.token,
        channel_id: channelId, //channel_id
        post_id: postId, //post_id
        id: commentId, //comment_id
      },
    };

    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
    );
  }

  getServerVersion(serverName: string, nodeId: string) {
    let request: Communication.get_service_version_request = {
      version: '1.0',
      method: 'get_service_version',
      id: -1,
      params: {
        access_token: '',
      },
    };

    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
    );
  }

  updateCredential(
    serverName: string,
    nodeId: string,
    credential: string,
    accessToken: FeedsData.AccessToken,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let request: Communication.update_credential_request = {
      version: '1.0',
      method: 'update_credential',
      id: -1,
      params: {
        access_token: accessToken.token,
        credential: credential,
      },
    };

    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
    );
  }

  setBinary(
    serverName: string,
    nodeId: string,
    key: string,
    content: any,
    accessToken: FeedsData.AccessToken,
    memo: any,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let contentBin = this.serializeDataService.encodeData(content);
    let request: Communication.set_binary_request = {
      version: '1.0',
      method: 'set_binary',
      id: -1,
      params: {
        access_token: accessToken.token,
        key: key,
        algo: 'None', // "None", "SHA256", "CRC"...
        checksum: '',
        content: contentBin,
      },
    };

    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      memo,
      request.version,
    );
  }

  getBinary(
    serverName: string,
    nodeId: string,
    key: string,
    accessToken: FeedsData.AccessToken,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let request: Communication.get_binary_request = {
      version: '1.0',
      method: 'get_binary',
      id: -1,
      params: {
        access_token: accessToken.token,
        key: key,
      },
    };

    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
    );
  }

  standardSignIn(serverName: string, nodeId: string, didDocument: string) {
    let request: Communication.standard_sign_in_request = {
      version: '1.0',
      method: 'standard_sign_in',
      id: -1,
      params: {
        document: didDocument,
      },
    };

    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
    );
  }

  standardDidAuth(
    serverName: string,
    nodeId: string,
    verifiablePresentation: string,
    name: string,
  ) {
    let request: Communication.standard_did_auth_request = {
      version: '1.0',
      method: 'standard_did_auth',
      id: -1,
      params: {
        user_name: name,
        jwt_vp: verifiablePresentation,
      },
    };

    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
    );
  }

  getMultiComments(
    serverName: string,
    nodeId: string,
    channelId: string,
    postId: string,
    by: Communication.field,
    upperBound: number,
    lowerBound: number,
    maxCounts: number,
    accessToken: FeedsData.AccessToken,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let request: Communication.get_multi_comments_request = {
      version: '2.0',
      method: 'get_multi_comments',
      id: -1,
      params: {
        access_token: accessToken.token,
        channel_id: channelId, //channel_id
        post_id: postId, //post_id
        by: by, //id
        upper_bound: upperBound,
        lower_bound: lowerBound,
        max_count: maxCounts,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
      false,
    );
  }

  getMultiSubscribers(
    serverName: string,
    nodeId: string,
    channelId: number,
    accessToken: FeedsData.AccessToken,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    console.log("Communication.get_multi_subscribers_count_request getMultiSubscribers");
    let request: Communication.get_multi_subscribers_count_request = {
      version: '1.0',
      method: 'get_multi_subscribers_count',
      id: -1,
      params: {
        access_token: accessToken.token,
        channel_id: channelId, // 0
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
      false,
    );
  }

  getMultiLikesAndCommentsCount(
    serverName: string,
    nodeId: string,
    channelId: number,
    postId: number,
    by: Communication.field,
    upperBound: number,
    lowerBound: number,
    maxCount: number,
    accessToken: FeedsData.AccessToken,
  ) {
    if (accessToken == null || accessToken == undefined) return;

    let request: Communication.get_multi_likes_and_comments_count_request = {
      version: '1.0',
      method: 'get_multi_likes_and_comments_count',
      id: -1,
      params: {
        access_token: accessToken.token,
        channel_id: channelId,
        post_id: postId,
        by: by,
        upper_bound: upperBound,
        lower_bound: lowerBound,
        max_count: maxCount,
      },
    };
    this.sendRPCMessage(
      serverName,
      nodeId,
      request.method,
      request.params,
      '',
      request.version,
      false,
    );
  }

  sendRPCMessage(
    serverName: string,
    nodeId: string,
    method: string,
    params: any,
    memo: any,
    version: string,
    isShowOfflineToast: boolean = true,
  ) {
    if (!this.checkServerConnection(nodeId)) {
      //this.events.publish(FeedsEvent.PublishType.rpcRequestError);
      return;
    }
    this.jsonRPCService.request(
      method,
      nodeId,
      params,
      memo,
      version,
      () => { },
      error => {
        //this.events.publish(FeedsEvent.PublishType.rpcRequestError);
      },
    );
  }

  response() { }

  checkServerConnection(nodeId: string): boolean {
    if (
      this.friendConnectionMap == null ||
      this.friendConnectionMap == undefined ||
      this.friendConnectionMap[nodeId] == undefined ||
      this.friendConnectionMap[nodeId] == FeedsData.ConnState.disconnected
    )
      return false;

    return true;
  }

  resetConnectionStatus() {
    let connectionMap = this.friendConnectionMap || {};
    let keys: string[] = Object.keys(connectionMap) || [];
    for (let index = 0; index < keys.length; index++) {
      if (this.friendConnectionMap[keys[index]] == undefined) continue;
      this.friendConnectionMap[keys[index]] = FeedsData.ConnState.disconnected;
    }
  }
}
