declare module Communication{
    type jsonrpc_id = string | number | null
    type create_channel_request = {
        jsonrpc: "2.0"
        method : "create_channel"
        params : {
            name        : string
            introduction: string  
            jwttoken    : string
        } 
        id     : jsonrpc_id
    }
    type create_channel_response = {
        jsonrpc: "2.0"
        result : {
            id: number 
        }
        id     : jsonrpc_id
    }
    
    type publish_post_request = {
        jsonrpc: "2.0"
        method : "publish_post"
        params : {
            channel_id  : number
            content     : any
            jwttoken    : string
        } 
        id     : jsonrpc_id
    }
    type publish_post_response = {
        jsonrpc: "2.0"
        result : {
            id: number
        }
        id     : jsonrpc_id
    }
    
    type post_comment_request = {
        jsonrpc: "2.0"
        method : "post_comment"
        params : {
            channel_id: number
            post_id   : number
            comment_id: number | null
            content   : any
            jwttoken  : string
        } 
        id     : jsonrpc_id
    }
    type post_comment_response = {
        jsonrpc: "2.0"
        result : {
            id: number
        }
        id     : jsonrpc_id
    }
    
    type post_like_request = {
        jsonrpc: "2.0"
        method : "post_like"
        params : {
            channel_id: number
            post_id   : number
            comment_id: number | null
            jwttoken  : string
        } 
        id     : jsonrpc_id
    }
    
    type post_like_response = {
        jsonrpc: "2.0"
        result : null
        id     : jsonrpc_id
    }
    
    const enum field {
        id = 1,
        last_update = 2,
        created_at = 3
    }
    
    type get_my_channels_request = {
        jsonrpc: "2.0"
        method : "get_my_channels"
        params : {
            by         : field
            upper_bound: number | null
            lower_bound: number | null
            max_count : number
            jwttoken   : string
        }
        id     : jsonrpc_id
    }
    type get_my_channels_response = {
        jsonrpc: "2.0"
        result : {
            id          : number
            name        : string
            introduction: string
            subscribers : number
            jwttoken    : string
        }[]
        id     : jsonrpc_id
    }
    
    type get_my_channels_metadata_request = {
        jsonrpc: "2.0"
        method : "get_my_channels_metadata"
        params : {
            by         : field
            upper_bound: number | null
            lower_bound: number | null
            max_count : number
            jwttoken   : string
        }
        id     : jsonrpc_id
    }
    type get_my_channels_metadata_response = {
        jsonrpc: "2.0"
        result : {
            id          : number
            subscribers : number
        }[]
        id     : jsonrpc_id
    }
    
    type get_channels_request = {
        jsonrpc: "2.0"
        method : "get_channels"
        params : {
            by         : field
            upper_bound: number | null
            lower_bound: number | null
            max_count : number
            jwttoken   : string
        }
        id     : jsonrpc_id
    }
    type get_channels_response = {
        jsonrpc: "2.0"
        result : {
            id          : number
            name        : string
            introduction: string
            owner_name  : string
            owner_did   : string 
            subscribers : number
            last_update : number
        }[]
        id     : jsonrpc_id
    }
    
    type get_channel_detail_request = {
        jsonrpc: "2.0"
        method : "get_channel_detail"
        params : {
            id       : number 
            jwttoken : string
        }
        id     : jsonrpc_id
    }
    type get_channel_detail_response = {
        jsonrpc: "2.0"
        result : {
            id          : number
            name        : string
            introduction: string
            owner_name  : string
            owner_did   : string 
            subscribers : number
            last_update : number
        }[]
        id     : jsonrpc_id
    }
    
    type get_subscribed_channels_request = {
        jsonrpc: "2.0"
        method : "get_subscribed_channels"
        params : {
            by         : field
            upper_bound: number | null
            lower_bound: number | null
            max_count : number
            jwttoken   : string
        }
        id     : jsonrpc_id
    }
    type get_subscribed_channels_response = {
        jsonrpc: "2.0"
        result : {
            id          : number
            name        : string
            introduction: string
            owner_name  : string
            owner_did   : string 
            subscribers : number
            last_update : number
        }[]
        id     : jsonrpc_id
    }
    
    type get_posts_request = {
        jsonrpc: "2.0"
        method : "get_posts"
        params : {
            channel_id : number
            by         : field
            upper_bound: number | null 
            lower_bound: number | null
            max_count : number
            jwttoken   : string
        }
        id     : jsonrpc_id
    }
    type get_posts_response = {
        jsonrpc: "2.0"
        result : {
            channel_id : number
            id         : number
            content    : any
            comments   : number
            likes      : number
            created_at : number
        }[]
        id     : jsonrpc_id
    }
    
    type get_comments_request = {
        jsonrpc: "2.0"
        method : "get_comments"
        params : {
            channel_id : number
            post_id    : number
            by         : field
            upper_bound: number | null 
            lower_bound: number | null
            max_count : number
            jwttoken   : string
        }
        id     : jsonrpc_id
    }
    type get_comments_response = {
        jsonrpc: "2.0"
        result : {
            channel_id : number
            post_id    : number
            id         : number
            comment_id : number | null
            content    : any
            likes      : number
            created_at : number
        }[]
        id     : jsonrpc_id
    }
    
    type get_statistics_request = {
        jsonrpc: "2.0"
        method : "get_statistics"
        params : {
            jwttoken   : string
        }
        id     : jsonrpc_id
    }
    type get_statistics_response = {
        jsonrpc: "2.0"
        result : {
            did               : string
            connecting_clients: number
        }
        id     : jsonrpc_id
    }
    
    // access control write rpc
    type subscribe_channel_request = {
        jsonrpc: "2.0"
        method : "subscribe_channel"
        params : {
            id: number
            jwttoken   : string
        }
        id     : jsonrpc_id
    }
    type subscribe_channel_response = {
        jsonrpc: "2.0"
        result : null
        id     : jsonrpc_id
    }
    
    type unsubscribe_channel_request = {
        jsonrpc: "2.0"
        method : "unsubscribe_channel"
        params : {
            id: number
            jwttoken   : string
        }
        id     : jsonrpc_id
    }
    type unsubscribe_channel_response = {
        jsonrpc: "2.0"
        result : null
        id     : jsonrpc_id
    }
    
    type add_node_publisher_request = {
        jsonrpc: "2.0"
        method : "add_node_publisher"
        params : {
            did: string
            jwttoken   : string
        }
        id     : jsonrpc_id
    }
    type add_node_publisher_response = {
        jsonrpc: "2.0"
        result : null
        params: {
            jwttoken   : string
        }
        id     : jsonrpc_id
    }
    
    type remove_node_publisher_request = {
        jsonrpc: "2.0"
        method : "remove_node_publisher"
        params : {
            did: string,
            jwttoken   : string
        }
        id     : jsonrpc_id
    }
    type remove_node_publisher_response = {
        jsonrpc: "2.0"
        result : null
        params: {
            jwttoken   : string
        }
        id     : jsonrpc_id
    }
    
    // access control read rpc
    type query_channel_creation_permission_request = {
        jsonrpc: "2.0"
        method : "query_channel_creation_permission"
        params: {
            jwttoken   : string
        }
        id     : jsonrpc_id
    }
    type query_channel_creation_permission_response = {
        jsonrpc: "2.0"
        result : {
            authorized : boolean
        }
        id     : jsonrpc_id
    }
    
    // event notification
    type enable_notification_request = {
        jsonrpc: "2.0"
        method : "enable_notification"
        params: {
            jwttoken   : string
        }
        id     : jsonrpc_id
    }
    type enable_notification_response = {
        jsonrpc: "2.0"
        result : null
        id     : jsonrpc_id
    }
    
    type new_post_notification = {
        jsonrpc: "2.0"
        method : "new_post"
        params : {
            channel_id: number
            id   : number
            content   : any
            created_at: number
        }
    }
    
    type new_comment_notification = {
        jsonrpc: "2.0"
        method : "new_comment"
        params : {
            channel_id: number
            post_id   : number
            id        : number
            comment_id: number
            content   : any
            created_at: number
        }
    }
    
    type new_likes_notification = {
        jsonrpc: "2.0"
        method : "new_likes"
        params : {
            channel_id: number
            post_id   : number
            comment_id: number
            count     : number
        }
    }

    type signin_request_challenge_request = { 
        jsonrpc: "2.0"
        method : "signin_request_challenge"
        id     : jsonrpc_id
        params : {
            iss: string
            credential_required: boolean
        }
    }

    type signin_response_challenge_response = {  
        jsonrpc: "2.0"
        id     : jsonrpc_id
        result : {
            credential_required: boolean
            jws: string
            // [credential]: feeds_vc     
        }
    }
    
    type signin_confirm_challenge_request = {
        jsonrpc: "2.0"
        method : "signin_confirm_challenge"
        id     : jsonrpc_id
        params : {
            jws: string
        }
    }


    type signin_confirm_challenge_response = {
        jsonrpc: "2.0"
        id     : jsonrpc_id
        result : {
            access_token: string    //jws = { sub  : dapp_did name : string email: string exp  : number }
            exp: number
        }
    }
    
    type declare_owner_request = {
        jsonrpc: "2.0"
        method : "declare_owner"
        id     : jsonrpc_id
        params : {
            nonce: string
            owner_did: string
        }
    }
    // type declare_owner_response = {
    //     jsonrpc: "2.0"
    //     id     : jsonrpc_id
    //     result : {
    //         phase: "owner_declared" 
    //     } | {
    //         phase: "did_imported"
    //         did: feeds_did
    //         transaction_payload: string
    //     } | {
    //         phase: "credential_issued"
    //     }
    // }
    
    type import_did_request = {
        jsonrpc : "2.0"
        method  : "import_did"
        id      : jsonrpc_id
        params  : {
            mnemonic: string
            passphrase: string
            index: number
        }
    }

    type create_did_request = {
        jsonrpc : "2.0"
        method  : "import_did"
        id      : jsonrpc_id
    }

    type import_did_response = {
        jsonrpc: "2.0"
        id     : jsonrpc_id
        result : {
            // did: feeds_did
            did: string
            transaction_payload: string
        }
    }
    
    type issue_credential_request = {
        jsonrpc: "2.0"
        method : "issue_credential"
        id     : jsonrpc_id
        params : {
            credential: string
        }
    }

    type issue_credential_response = {
        jsonrpc: "2.0"
        id     : jsonrpc_id
        result : null
    }
    
}

