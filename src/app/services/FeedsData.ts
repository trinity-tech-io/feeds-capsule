declare namespace FeedsData {
  const enum SubscribedChannelType {
    ALL_CHANNEL,
    OTHER_CHANNEL,
    MY_CHANNEL
  }

  const enum CallbackMethod {
    SyncFeedsServiceData = 'SyncFeedsServiceData'
  }

  const enum TitleBarForegroundMode {
    /** Title bar title and icons use a light (white) color. Use this on a dark background color. */
    LIGHT = 0,
    /** Title bar title and icons use a dark (dark gray) color. Use this on a light background color. */
    DARK = 1,
  }

  const enum TitleBarIconSlot {
    /** Icon on title bar's left edge. */
    OUTER_LEFT = 0,
    /** Icon between the outer left icon and the title. */
    INNER_LEFT = 1,
    /** Icon between the title and the outer right icon. */
    INNER_RIGHT = 2,
    /** Icon on title bar's right edge. */
    OUTER_RIGHT = 3,
  }

  const enum ContractEvent {
    TRANSACTION_HASH = 'transactionHash',
    RECEIPT = 'receipt',
    CONFIRMATION = 'confirmation',
    ERROR = 'error'
  }

  type ContractEventResult = TransactionHashResult | ReceiptResult | ConfirmationResult | ErrorResult;

  type TransactionHashResult = {
    hash: string
  }

  type ReceiptResult = {
    receipt: string
  }

  type ConfirmationResult = {
    confirmationNumber: string,
    receipt: string
  }

  type ErrorResult = {
    error: string,
    receipt: string
  }

  const enum SearchType {
    TOKEN_ID,
    ROYALTY_ADDRESS,
    OWNER_ADDRESS,
    NAME,
    DESCRIPTION,
    DEFAULT
  }

  const enum SortType {
    TIME_ORDER_LATEST,
    TIME_ORDER_OLDEST,
    PRICE_HIGHEST,
    PRICE_CHEAPEST
  }

  const enum MediaType {
    noMeida = 0,
    containsImg = 1,
    containsVideo = 2,
  }

  const enum PostCommentStatus {
    available = 0,
    deleted = 1,
    edited = 2,
    sending = 11,
    error = 12,
  }

  const enum ConnState {
    connected = 0,
    disconnected = 1,
  }

  const enum EditState {
    NoChange,
    TextChange,
    TextImageChange,
    TextVideoChange,
  }

  const enum SessionError {
    UnknownError = -101,
    UnimplementedError = -102,
    NotFoundError = -103,
    InvalidArgument = -104,
    PointerReleasedError = -105,
    DevUUIDError = -106,
    FileNotExistsError = -107,
    CreateDirectoryError = -108,
    SizeOverflowError = -109,
    StdSystemError = -110,
    OutOfMemoryError = -111,
    DidNotReady = -120,
    InvalidAccessToken = -121,
    NotAuthorizedError = -122,
    CarrierSessionInitFailed = -130,
    CarrierSessionConnectFailed = -131,
    CarrierSessionCreateFailed = -132,
    CarrierSessionAddStreamFailed = -133,
    CarrierSessionTimeoutError = -134,
    CarrierSessionReplyFailed = -135,
    CarrierSessionStartFailed = -136,
    CarrierSessionBadStatus = -137,
    CarrierSessionDataNotEnough = -138,
    CarrierSessionUnsuppertedVersion = -139,
    CarrierSessionReleasedError = -140,
    CarrierSessionSendFailed = -141,
    CarrierSessionErrorExists = -142,
    MassDataUnknownReqFailed = -150,
    MassDataUnmarshalReqFailed = -151,
    MassDataMarshalRespFailed = -152,
    MassDataUnsupportedVersion = -153,
    MassDataUnsupportedAlgo = -154,

    OFFLINE = -200,
    STREAM_STATE_DEACTIVATED = -205,
    STREAM_STATE_CLOSED = -206,
    STREAM_STATE_ERROR = -207,

    WRITE_DATA_ERROR = -301,

    SESSION_CREATE_TIMEOUT = -300,
    SESSION_NEW_SESSION_ERROR = -311,
    SESSION_ADD_STREAM_ERROR = -312,
    SESSION_REQUEST_ERROR = -313,
    SESSION_START_ERROR = -314,
  }

  const enum TransDataChannel {
    MESSAGE,
    SESSION,
  }

  const enum StreamState {
    NOTINIT = -1,
    /** Raw stream. */
    RAW = 0,
    /** Initialized stream. */
    INITIALIZED = 1,
    /** The underlying transport is ready for the stream to start. */
    TRANSPORT_READY = 2,
    /** The stream is trying to connect the remote. */
    CONNECTING = 3,
    /** The stream connected with remove peer. */
    CONNECTED = 4,
    /** The stream is deactived. */
    DEACTIVATED = 5,
    /** The stream closed gracefully. */
    CLOSED = 6,
    /** The stream is on error, cannot to continue. */
    ERROR = 7,
    UNKNOW = 8,
  }

  const enum OrderState {
    NONE,
    SALEING,
    SOLD,
    CANCELED
  }

  // const enum OrderType {
  //   SALE = 'OrderForSale',
  //   CANCELED = 'OrderCanceled',
  //   FILLED = 'OrderFilled'
  // }

  const enum SyncMode {
    NONE,
    SYNC,
    REFRESH,
    APP,
  }

  type StandardAuthResult = {
    jwtToken: string;
    serverName: string;
    serverDescription: string;
    elaAddress: string;
  };

  type Content = {
    version: string;
    text: string;
    mediaType: MediaType;
    videoThumbKey: VideoThumbKey;
    imgThumbKeys: ImageThumbKey[];
    nftTokenId: number;
    nftOrderId: number;
    nftImageType: string,
    mediaDatas: mediaData[]
  };

  type ImgThumb = {
    index: number;
    imgThumb: any;
    imgSize: number;
  };

  type ImageThumbKey = {
    index: number;
    imgThumbKey: string;
    imgSize: number;
  };
  type VideoThumb = {
    videoThumb: string;
    duration: number;
    videoSize: number;
  };

  type VideoThumbKey = {
    videoThumbKey: string;
    duration: number;
    videoSize: number;
  };

  type AllFeed = {
    nodeId: string;
    avatar: string;
    topic: string;
    desc: string;
    subscribeState: string;
  };

  type AccessToken = {
    token: string;
    isExpire: boolean;
  };

  type SessionMemoData = {
    feedId: string;
    postId: string;
    commentId: number;
    tempId: string;
  };

  type TempData = {
    nodeId: string;
    feedId: string;
    tempPostId: string;
    tempCommentId: number;
    dataHash: string;
    status: SendingStatus;
    transDataChannel: TransDataChannel;
    videoData: string;
    imageData: string;
    postId: string;
    commentId: number;
    content: any;
  };

  const enum SendingStatus {
    normal,
    needDeclearPost,
    needPushData,
    needNotifyPost,
  }

  const enum MethodType {
    declare_post = 'declare_post',
    notify_post = 'notify_post',

    create_channel = 'create_channel',
    publish_post = 'publish_post',
    post_comment = 'post_comment',
    post_like = 'post_like',
    get_my_channels = 'get_my_channels',
    get_channels = 'get_channels',
    get_channel_detail = 'get_channel_detail',
    get_subscribed_channels = 'get_subscribed_channels',
    get_posts = 'get_posts',
    get_comments = 'get_comments',
    get_statistics = 'get_statistics',
    subscribe_channel = 'subscribe_channel',
    unsubscribe_channel = 'unsubscribe_channel',

    query_channel_creation_permission = 'query_channel_creation_permission',

    negotiateLogin = 'negotiate_login',
    confirmLogin = 'confirm_login',

    post_unlike = 'post_unlike',

    updateFeedInfo = 'update_feedinfo',

    editPost = 'edit_post',
    deletePost = 'delete_post',

    editComment = 'edit_comment',
    deleteComment = 'delete_comment',

    getServerVersion = 'get_service_version',

    updateCredential = 'update_credential',
    enable_notification = 'enable_notification',

    getBinary = 'get_binary',
    setBinary = 'set_binary',

    standard_sign_in = 'standard_sign_in',
    standard_did_auth = 'standard_did_auth',
    get_multi_comments = 'get_multi_comments',

    get_multi_subscribers_count = 'get_multi_subscribers_count',
    get_multi_likes_and_comments_count = 'get_multi_likes_and_comments_count',

    //PUSH Notification
    newPostNotification = 'new_post',
    newCommentNotification = 'new_comment',
    newLikesNotification = 'new_like',
    newSubscriptionNotification = 'new_subscription',
    feedInfoUpdateNotification = 'feedinfo_update',
    postUpdateNotification = 'post_update',
    commentUpdateNotification = 'comment_update',
  }

  const enum FriendState {
    NONE_STATE,
    IS_FRIEND,
    IS_ADDED,
  }

  const enum FollowFeedStatus {
    NONE,
    ADD_FRIEND_READY,
    ADD_FRIEND_FINISH,
    ADD_FRIEND_ERROR,
    FRIEND_ONLINE,
    FRIEND_OFFLINE,
    SIGNIN_READY,
    SIGNIN_FINISH,
    SIGNIN_ERROR,
    FOLLOW_FEED_READY,
    FOLLOW_FEED_FINISH,
    FOLLOW_FEED_ERROR,
    FINISH,
    ERROR,
    DISCONNECTED,
  }

  type FeedUrl = {
    did: string;
    carrierAddress: string;
    feedId: string;
    feedName: string;
    feedUrl: string;
    serverUrl: string;
  };

  type ToBeAddedFeed = {
    nodeId: string;
    did: string;
    carrierAddress: string;
    feedId: string;
    feedName: string;
    feedUrl: string;
    serverUrl: string;
    status: FollowFeedStatus;
    friendState: FriendState;
    avatar: string;
    follower: number;
    ownerName: string;
    feedDes: string;
  };

  const enum PersistenceKey {
    ///new Add
    channelsMapV3 = 'channelsMapV3',
    subscribedChannelsV3Map = 'subscribedChannelsV3Map',
    postsMapV3 = 'postsMapV3',
    commentsMapV3 = 'commentsMapV3',
    likeMapV3 = 'likeMapV3',


    ///////////////////////////////
    signInData = 'signInData',
    lastSignInData = 'lastSignInData',

    signInRawData = 'signInRawData',

    subscribedChannelsMap = 'subscribedChannelsMap',
    channelsMap = 'channelsMap',
    myChannelsMap = 'myChannelsMap',
    unreadMap = 'unreadMap',
    postMap = 'postMap',
    lastPostUpdateMap = 'lastPostUpdateMap',
    commentsMap = 'commentsMap',
    serverStatisticsMap = 'serverStatisticsMap',
    serversStatus = 'serversStatus',
    subscribeStatusMap = 'subscribeStatusMap',
    likeMap = 'likeMap',

    accessTokenMap = 'accessTokenMap',
    credential = 'credential',

    bindingServer = 'bindingServer',

    serverMap = 'serverMap',

    notificationList = 'notificationList',

    likeCommentMap = 'likeCommentMap',

    lastCommentUpdateMap = 'lastCommentUpdateMap',

    lastMultiLikesAndCommentsCountUpdateMap = 'lastMultiLikesAndCommentsCountUpdateMap',
    lastSubscribedFeedsUpdateMap = 'lastSubscribedFeedsUpdateMap',
    serverVersions = 'serverVersions',
    isSignOut = 'isSignOut',

    syncPostStatusMap = 'syncPostStatusMap',
    syncCommentStatusMap = 'syncCommentStatusMap',

    tempIdDataList = 'tempIdDataList',
    tempDataMap = 'tempDataMap',

    walletAccountAddress = 'walletAccountAddress',

    pasarItemMap = 'pasarItemMap',
    firstSyncOrderFinish = 'firstSyncOrderFinish',

    sortType = 'feeds:sortType',

    didMapper = 'feeds: didMapper',

    userDidUriMap = 'feeds:userDidUriMap',
    pasarItemList = 'pasarItemList',
    RefreshLastBlockNumber = 'RefreshLastBlockNumber'
  }

  type ServerVersion = {
    nodeId: string;
    versionName: string;
    versionCode: number;
  };

  type Likes = {
    nodeId: string;
    channelId: string;
    postId: string;
    commentId: number;
  };

  type BindURLData = {
    did: string;
    carrierAddress: string;
    nonce: string;
  };

  type Notification = {
    id: string;
    userName: string;
    behavior: Behavior;
    behaviorText: string;
    details: Details;
    time: number;
    readStatus: number;
  };

  type Details = {
    nodeId: string;
    channelId: string;
    postId: string;
    commentId: number;
  };

  type SignResult = {
    signingdid: string;
    publickey: string;
    signature: string;
  };

  type SignIntentResponse = {
    result: SignResult;
  };

  type PostUpdateTime = {
    nodeId: string;
    channelId: string;
    time: number;
  };

  type FeedUpdateTime = {
    nodeId: string;
    time: number;
  };

  type CommentUpdateTime = {
    nodeId: string;
    channelId: string;
    postId: string;
    time: number;
  };

  type LikesAndCommentsCountUpdateTime = {
    nodeId: string;
    time: number;
  };

  type ServerStatus = {
    nodeId: string;
    did: string;
    status: ConnState;
  };
  type NodeChannelPostComment = {
    [channelId: number]: ChannelPostComment;
  };
  type ChannelPostComment = {
    [postId: number]: PostComment;
  };
  type PostComment = {
    [commentId: number]: Comment;
  };

  type MyChannel = {
    nodeId: string;
    channelId: number;
  };

  type Channels = {
    channel_id: string;
    created_at: number;
    updated_at: number;
    name: string;
    introduction: string;
    avatar: string;
    memo: string;
    type: string;// private  public  group  friends

    // 旧
    nodeId: string;
    id: string;
    // name: string;
    // introduction: string;
    owner_name: string;
    owner_did: string;
    subscribers: number;
    last_update: number;
    last_post: any;
    // avatar: any;
    isSubscribed: boolean;
  };

  type Comment = {
    nodeId: string;
    channel_id: string;
    post_id: string;
    id: number;
    comment_id: number | 0;
    user_name: string;
    content: any;
    likes: number;
    created_at: number;
    updated_at: number;
    status: FeedsData.PostCommentStatus;
    user_did: string;
  };

  type LikedComment = {
    nodeId: string;
    channel_id: string;
    post_id: string;
    id: number;
  };

  type ChannelPost = {
    [postId: number]: Post;
  };

  type Post = {
    // post_id: string;
    // channel_id: number;
    // created_at: number;
    // update_at: number;
    // content: FeedsData.Content;
    // status: number; // 2除删已 1改修已 0通普
    // memo: number;
    // type: number;
    // tag: number;

    // 旧
    nodeId: string;
    channel_id: string;
    id: string;
    content: FeedsData.Content;
    comments: number;
    likes: number;
    created_at: number;
    updated_at: number;
    post_status: FeedsData.PostCommentStatus;
  };

  type PostKey = {
    created_at: number;
  };

  type ServerStatistics = {
    did: string;
    connecting_clients: number;
    total_clients: number;
  };

  type Server = {
    name: string;
    owner: string;
    introduction: string;
    did: string;
    carrierAddress: string;
    nodeId: string;
    feedsUrl: string;
    elaAddress: string;
  };

  type SyncPostStatus = {
    nodeId: string;
    feedsId: string;
    isSyncFinish: boolean;
    lastUpdate: number;
  };

  type SyncCommentStatus = {
    nodeId: string;
    feedsId: string;
    postId: string;
    isSyncFinish: boolean;
    lastUpdate: number;
  };

  const enum RequestAction {
    defaultAction,
    refreshPostDetail,
  }

  const enum Behavior {
    comment,
    likedPost,
    likedComment,
    follow,
  }

  type OrderInfo = {
    orderId: string;
    orderType: number;
    orderState: number;
    tokenId: string;
    amount: number;
    price: string;
    endTime: number;
    sellerAddr: string;
    buyerAddr: string;
    bids: string;
    lastBidder: string;
    lastBid: string;
    filled: number;
    royaltyOwner: string;
    royaltyFee: string;
    createTime: number;
    updateTime: number;
  }

  type TokenInfo = {
    tokenId: string;
    tokenIndex: number;
    tokenSupply: number;
    tokenUri: string;
    royaltyOwner: string;
    royaltyFee: string;
    createTime: number;
    updateTime: number;
    didUri: string
  }

  type TokenJson = TokenJsonV1;

  type TokenJsonV1 = {
    description: string;
    image: string;
    kind: string;
    name: string;
    size: string;
    thumbnail: string;
    type: string;
    version: string;
    adult: boolean
  }

  type TokenJsonV2 = {
    version: string;
    name: string;
    description: string;
    type: string;
    data: any;
    adult: boolean
  }

  type ImageJsonData = {
    thumbnail: string;
    image: string;
    kind: string;
    size: string;
  }

  type VideoJsonData = {
    kind: string,
    video: string,
    size: string,
    thumbnail: string,
    duration: number,
    width: number,
    height: number
  }

  type OrderTokenJsonInfo = {
    orderInfo: OrderInfo;
    tokenInfo: TokenInfo;
    tokenJson: TokenJson;
  }

  type NFTItem = {
    version: string,
    creator: string,
    saleOrderId: string,
    tokenId: string,
    asset: string,
    name: string,
    description: string,
    fixedAmount: string,
    kind: string,
    type: string,
    royalties: string,
    quantity: number,
    curQuantity: number,
    thumbnail: string,
    sellerAddr: string,
    // createTime: number,

    amount: number,
    bids: string,
    buyerAddr: string,
    endTime: number,
    filled: number,
    lastBid: string,
    lastBidder: string,
    orderState: number,
    orderType: number,
    orderCreateTime: number,
    orderUpdateTime: number,
    tokenCreateTime: number,
    tokenUpdateTime: number,
    originAssetSize: string,

    moreMenuType: string,
    showType: string,

    orderSellerDidObj: DidObj,
    orderBuyerDidObj: DidObj,
    tokenCreatorDid: DidObj

    adult: boolean,

    priceNumber: number,
    data: any
  }

  type DidObj = {
    version: string,
    did: string
  }

  type DIDUriObj = {
    didUri: string,
    didObj: DidObj
  }

  type TokenIdAndTokenJson = {
    tokenId: number;
    tokenJson: TokenJson;
  }

  type PasarItem = {
    index: number,
    blockNumber: number,
    item: NFTItem,
    syncMode: SyncMode
  }

  type WhiteItem = {
    index: number,
    name: string,
    description: string,
    address: string,
    social: [],
    avatar: string
  }

  type OrderStateAndNFTItem = {
    state: OrderState,
    item: NFTItem
  }


  type StikerItem = {
    tokenId: string,
    blockNumber: number,
    timestamp: number,
    value: string,
    holder: string,
    tokenIndex: string,
    quantity: string,
    royalties: string,
    royaltyOwner: string,
    createTime: number
    tokenIdHex: string,
    name: string,
    description: string,
    kind: string,
    type: string,
    thumbnail: string,
    asset: string
  }

  type SignInData = {
    did: string,
    name: string,
    avatar: Avatar,
    email: string,
    telephone: string,
    location: string,
    nickname: string,
    description: string,
    expiresTS: number
  }

  type Avatar = {
    contentType: string,
    data: string,
    type?: string
  }

  // {
  //   "version": "2.0",
  //   "text": "xxx",
  //   "data": [
  //     {
  //       "type": "image/video/audio"
  //       "image": "imageCid",
  //       "mime": "jpg",
  //       "size": 123,
  //       "thumbnail": "thumbnailCid"
  //     }
  //   ]
  // }
  type postHiveContent = {
    version: "2.0",
    text: string,
    data: string
  }

  type postContent = {
    version: "2.0",
    text: string,
    data: mediaData[]
  }

  type mediaData = {
    kind: string,           //"image/video/audio"
    originMediaCid: string,
    type: string,           //"image/jpg",
    size: number,           //origin file size
    thumbnailCid: string    //"thumbnailCid"
    duration: number,
    imageIndex: number,
    additionalInfo: any,
    memo: any
  }

  type originMediaData = {
    size: number,
    type: string,
    cid: string
  }

  type videoData = {
    video: string,
    thumbnail: string,
    duration: number
  }

  type FeedsVideo = {
    kind: string,
    video: string,
    size: string,
    thumbnail: string,
    duration: string,
    width: string,
    height: string,
  }

  type FeedsAudio = {
    kind: string,
    audio: string,
    size: string,
    thumbnail: string,
    duration: string,
  }

  type ChannelCollections = {
    version: string,
    tokenId: string,
    nodeId: string,
    did: string,
    name: string,
    description: string,
    ownerName: string,
    ownerDid: string,
    curQuantity: string,
    avatar: GalleriaAvatar,
    type: string,
    status: string, /*0 未上架 1 已上架*/
    panelId: string,
    userAddr: string,
    diaBalance: string,
    entry: GalleriaEntry
  }

  type GalleriaAvatar = {
    image: string,
    size: number,
    kind: string,
    thumbnail: string
  }

  type GalleriaEntry = {
    url: string,
    location: string,
    version: string
  }



  ////new data type
  type ChannelV3 = {
    destDid: string,
    channelId: string,

    createdAt: number,
    updatedAt: number,
    name: string,
    intro: string,
    avatar: string,
    type: string,
    tipping_address: string,
    nft: string,
    category: string,
    proof: string,
    memo: string,
  }

  type PostV3 = {
    destDid: string,
    postId: string,

    channelId: string,
    createdAt: number,
    updatedAt: number,
    content: postContentV3,
    status: PostCommentStatus,
    type: string,
    tag: string,
    proof: string,
    memo: string
  }

  // 新添加
  type originMediaDataV3 = {
    size: number,
    type: string,
    medaPath: string
  }
  // 新添加
  type mediaDataV3 = {
    kind: string,           //"image/video/audio"
    originMediaPath: string,
    type: string,           //"image/jpg",
    size: number,           //origin file size
    thumbnailPath: string    //"thumbnailCid"
    duration: number,
    imageIndex: number,
    additionalInfo: any,
    memo: any
  }

  // 新添加
  type postContentV3 = {
    version: "3.0",
    content: string,
    mediaData: mediaDataV3[],// 已经上传的到hive(size/type/scriptName@path)
    mediaType: MediaType
  }

  type CommentV3 = {
    destDid: string,
    commentId: string,

    channelId: string,
    postId: string,
    refcommentId: string,
    content: string,
    status: PostCommentStatus
    updatedAt: number,
    createdAt: number,
    proof: string,
    memo: string,

    createrDid: string
  }

  type LikeV3 = {
    likeId: string,

    destDid: string,
    postId: string,
    commentId: string,

    channelId: string,
    createdAt: number,
    createrDid: string,
    proof: string,
    memo: string

    updatedAt: number,
    status: FeedsData.PostCommentStatus.available | FeedsData.PostCommentStatus.deleted
  }

  type SubscriptionV3 = {// subscription hivenode表模型
    destDid: string,
    channelId: string,

    userDid: string,
    createdAt: number,
    displayName: string,

    updatedAt: number,
    status: FeedsData.PostCommentStatus.available | FeedsData.PostCommentStatus.deleted
  }

  type SubscribedChannelV3 = {// 本地存储订阅列表模型
    destDid: string,// 订阅channel的创建者的did
    channelId: string
  }

}
