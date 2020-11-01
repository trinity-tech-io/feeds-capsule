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

    type Content = {
        version         :   string,
        text            :   string,
        mediaType       :   MediaType,
        videoThumbKey   :   VideoThumbKey,
        imgThumbKeys    :   ImageThumbKey[]
    }

    type ImgThumb = {
        index: number,
        imgThumb: any
    }

    type ImageThumbKey = {
        index       :   number,
        imgThumbKey :   string
    }
    type VideoThumb = {
        videoThumb      :   string,
        duration        :   number
    }

    type VideoThumbKey = {
        videoThumbKey   :   string,
        duration        :   number
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