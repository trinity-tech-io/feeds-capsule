declare namespace FeedsEvent{
    const enum PublishType{
        ////////
        carrierReady = "carrier:ready",
        carrierConnectionChanged = "carrier:connectionChanged",
        carrierFriendConnection = "carrier:friendConnection",
        carrierFriendInfo = "carrier:friendInfo",
        carrierFriendList = "carrier:friendList",
        carrierFriendAdded = "carrier:friendAdded",
        carrierFriendRemoved = "carrier:friendRemoved",
        carrierFriendMessage = "carrier:friendMessage",
        carrierFriendBinaryMessage = "carrier:friendBinaryMessage",
        carrierSessionRequest = "carrier:sessionRequest",

        ////////
        networkStatusChanged = "feeds:networkStatusChanged",

        ////////
        rpcRequestError = "rpcRequest:error",
        rpcResponseError = "rpcResponse:error",
        rpcRequestSuccess = "rpcRequest:success",

        jrpcReceiveMessage = "jrpc:receiveMessage",
        jwtReceiveJWTMessage = "jwt:receiveJWTMessage",

        transportReceiveMessage = "transport:receiveMessage",
        transportReceiveJWTMessage = "transport:receiveJWTMessage",

        ////////
        clearHomeEvent = "feeds:clearHomeEvent",
        hideDeletedPosts = "feeds:hideDeletedPosts",
        createpost = "feeds:createpost",

        tipdialogCancel = "tipdialog-cancel",
        tipdialogConfirm = "tipdialog-confirm",

        search = "feeds:search",

        updateTab = "update:tab",
        addBinaryEvevnt = "addBinaryEvevnt",
        tabSendPost = "feeds:tabsendpost",
        hideOfflineFeeds = "feeds:hideOfflineFeeds",
        hideUnFollowFeeds = "feeds:hideUnFollowFeeds",

        addFeedStatusChanged = "addFeed:statusChanged",
        openRightMenu = "feeds:openRightMenu",
        editChannel = "feeds:editChannel",
        editServer = "feeds:editServer",
        editImages = "feeds:editImages",
        updateTitle = "feeds:updateTitle",
        unfollowFeedsFinish = "feeds:unfollowFeedsFinish",
        login_finish = "feeds:login_finish",
        owner_declared = "feeds:owner_declared",
        updateCredentialFinish = "feeds:updateCredentialFinish",
        did_imported = "feeds:did_imported",
        setBinaryFinish = "feeds:setBinaryFinish",
        getBinaryFinish = "feeds:getBinaryFinish",
        resolveDidSucess = "feeds:resolveDidSucess",
        resolveDidError = "feeds:resolveDidError",
        issue_credential = "feeds:issue_credential",
        signinSuccess = "feeds:signinSuccess",

        ////////
        streamOnStateChangedCallback = "stream:onStateChangedCallback",
        streamError = "stream:error",
        streamGetBinarySuccess = "stream:getBinarySuccess",
        streamGetBinaryResponse = "stream:getBinaryResponse",
        streamSetBinaryResponse = "stream:setBinaryResponse",
        streamSetBinarySuccess = "stream:setBinarySuccess",
        streamProgress = "stream:progress",
        streamClosed = "stream:closed",
        streamSetBinaryError = "stream:setBinaryError",
        streamGetBinaryError = "stream:getBinaryError",

        ////////
        ownFeedListChanged = "feeds:ownFeedListChanged  ",
        createTopicSuccess = "feeds:createTopicSuccess",
        postEventSuccess = "feeds:postEventSuccess",
        allFeedsListChanged= "feeds:allFeedsListChanged",
        subscribeFinish = "feeds:subscribeFinish",
        unsubscribeFinish = "feeds:unsubscribeFinish",
        updateServerList = "feeds:updateServerList",
        connectionChanged="feeds:connectionChanged",

        commentDataUpdate = "feeds:commentDataUpdate",
        getCommentFinish = "feeds:getCommentFinish",

        myChannelsDataUpdate = "feeds:myChannelsDataUpdate",
        subscribedDataUpdate = "feeds:subscribedChannelsDataUpdate",
        channelsDataUpdate = "feeds:channelsDataUpdate",

        refreshMyChannel = "feeds:refreshMyChannel",
        loadMoreMyChannel = "feeds:loadMoreMyChannel",
        serverConnectionChanged = "feeds:serverConnectionChanged",

        serverStatisticsChanged = "feeds:serverStatisticsChanged",

        refreshPost = "feeds:refreshPost",
        loadMorePost = "feeds:loadMorePost",

        refreshChannels = "feeds:refreshChannels",
        loadMoreChannels = "feeds:loadMoreChannels",

        refreshSubscribedChannels = "feeds:refreshSubscribedChannels",
        loadMoreSubscribedChannels = "feeds:loadMoreSubscribedChannels",

        updataCommentLike = "feeds:updataCommentLike",

        updateLikeList = "feeds:updateLikeList",

        signInServerListChanged = "feeds:signInServerListChanged",

        friendConnectionChanged = "feeds:friendConnectionChanged",
        publishPostSuccess = "feeds:publishPostSuccess",

        bindServerFinish = "feeds:bindServerFinish",
        removeFeedSourceFinish = "feeds:removeFeedSourceFinish",

        refreshPage = "feeds:refreshPage",
        UpdateNotification = "feeds:UpdateNotification",
        refreshPostDetail = "feeds:refreshPostDetail",

        editFeedInfoFinish = "feeds:editFeedInfoFinish",

        editPostFinish = "feeds:editPostFinish",
        editPostSuccess = "feeds:editPostSuccess",
        editCommentFinish = "feeds:editCommentFinish",
        deletePostFinish = "feeds:deletePostFinish",
        deleteCommentFinish = "feeds:deleteCommentFinish",

        declarePostSuccess = "feeds:declarePostSuccess",
        notifyPostSuccess = "feeds:notifyPostSuccess",

        // addFeedFinish = "feeds:addFeedFinish",

        publishPostFinish = "feeds:publishPostFinish",
        postDataUpdate = "feeds:postDataUpdate",
    }
}