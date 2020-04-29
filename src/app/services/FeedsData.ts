declare namespace FeedsData{
    type AllFeed = {
        nodeId: string,
        avatar: string,
        topic: string,
        desc: string,
        subscribeState: string
    }

    const enum MethodType {
        subscribe = "subscribe",
        unsubscribe = "unsubscribe",
        exploreTopics = "explore_topics",
        listSubscribed = "list_subscribed_topics",
        fetchUnreceived = "fetch_unreceived",
      
        createTopic = "create_topic",
        postEvent = "post_event",
        listOwnedTopics = "list_owned_topics",
      
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
      
        add_node_publisher = "add_node_publisher",
        remove_node_publisher = "remove_node_publisher",
      
        query_channel_creation_permission = "query_channel_creation_permission",
      
      
      
        enable_notification = "enable_notification",
        //PUSH Notification
        newPost = "new_post",
        newComment = "new_comment",
        newLikes = "new_likes",
    }
}