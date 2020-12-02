declare namespace FeedsData{
    const enum MediaType{
        noMeida = 0 ,
        containsImg = 1 ,
        containsVideo = 2
    }

    const enum PostCommentStatus {
        available = 0,
        deleted = 1,
        edited = 2,
    }

    const enum ConnState {
        connected = 0,
        disconnected = 1
    }

    const enum EditState{
        NoChange,
        TextChange,
        TextImageChange,
        TextVideoChange,
    }
    const enum SessionError {
        UnknownError                     = -101,
        UnimplementedError               = -102,
        NotFoundError                    = -103,
        InvalidArgument                  = -104,
        PointerReleasedError             = -105,
        DevUUIDError                     = -106,
        FileNotExistsError               = -107,
        CreateDirectoryError             = -108,
        SizeOverflowError                = -109,
        StdSystemError                   = -110,
        OutOfMemoryError                 = -111,
        DidNotReady                      = -120,
        InvalidAccessToken               = -121,
        NotAuthorizedError               = -122,
        CarrierSessionInitFailed         = -130,
        CarrierSessionConnectFailed      = -131,
        CarrierSessionCreateFailed       = -132,
        CarrierSessionAddStreamFailed    = -133,
        CarrierSessionTimeoutError       = -134,
        CarrierSessionReplyFailed        = -135,
        CarrierSessionStartFailed        = -136,
        CarrierSessionBadStatus          = -137,
        CarrierSessionDataNotEnough      = -138,
        CarrierSessionUnsuppertedVersion = -139,
        CarrierSessionReleasedError      = -140,
        CarrierSessionSendFailed         = -141,
        CarrierSessionErrorExists        = -142,
        MassDataUnknownReqFailed         = -150,
        MassDataUnmarshalReqFailed       = -151,
        MassDataMarshalRespFailed        = -152,
        MassDataUnsupportedVersion       = -153,
        MassDataUnsupportedAlgo          = -154,

        OFFLINE                          = -200,
        STREAM_STATE_DEACTIVATED         = -205,
        STREAM_STATE_CLOSED              = -206,
        STREAM_STATE_ERROR               = -207,
        
        WRITE_DATA_ERROR                 = -301,

        SESSION_CREATE_TIMEOUT           = -300,
        SESSION_NEW_SESSION_ERROR        = -311,
        SESSION_ADD_STREAM_ERROR         = -312,
        SESSION_REQUEST_ERROR            = -313,
        SESSION_START_ERROR              = -314,
        
    }
    const enum TransDataChannel {
        MESSAGE,
        SESSION
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
        UNKNOW = 8
    }

    type Content = {
        version         :   string,
        text            :   string,
        mediaType       :   MediaType,
        videoThumbKey   :   VideoThumbKey,
        imgThumbKeys    :   ImageThumbKey[]
    }

    type ImgThumb = {
        index   : number,
        imgThumb: any,
        imgSize    : number
    }

    type ImageThumbKey = {
        index       :   number,
        imgThumbKey :   string,
        imgSize   :   number
    }
    type VideoThumb = {
        videoThumb      :   string,
        duration        :   number,
        videoSize       :   number
    }

    type VideoThumbKey = {
        videoThumbKey   :   string,
        duration        :   number,
        videoSize       :   number
    }

    type AllFeed = {
        nodeId: string,
        avatar: string,
        topic: string,
        desc: string,
        subscribeState: string
    }

    type AccessToken = {
        token: string ;
        exp: number ;
        isExpire: boolean;
    }

    const enum MethodType {
        declare_post = "declare_post",
        notify_post = "notify_post",
        
        create_channel = "create_channel",
        publish_post = "publish_post",
        post_comment = "post_comment",
        post_like = "post_like",
        get_my_channels = "get_my_channels",
        get_my_channels_metadata = "get_my_channels_metadata",
        get_channels = "get_channels",
        get_channel_detail = "get_channel_detail",
        get_subscribed_channels = "get_subscribed_channels",
        get_posts = "get_posts",
        get_comments = "get_comments",
        get_statistics = "get_statistics",
        subscribe_channel = "subscribe_channel",
        unsubscribe_channel = "unsubscribe_channel",
      
        // add_node_publisher = "add_node_publisher",
        // remove_node_publisher = "remove_node_publisher",
      
        query_channel_creation_permission = "query_channel_creation_permission",
      
      
        negotiateLogin = "negotiate_login",
        confirmLogin = "confirm_login",

        post_unlike = "post_unlike",

        updateFeedInfo = "update_feedinfo",
      
        editPost = "edit_post",
        deletePost = "delete_post",

        editComment = "edit_comment",
        deleteComment = "delete_comment",

        getServerVersion = "get_service_version",

        updateCredential = "update_credential",
        enable_notification = "enable_notification",

        getBinary = "get_binary",
        setBinary = "set_binary",

        standard_sign_in = "standard_sign_in",
        standard_did_auth = "standard_did_auth",

        //PUSH Notification
        newPostNotification = "new_post",
        newCommentNotification = "new_comment",
        newLikesNotification = "new_like",
        newSubscriptionNotification = "new_subscription",
        feedInfoUpdateNotification = "feedinfo_update",
        postUpdateNotification="post_update",
        commentUpdateNotification="comment_update",
    }
}