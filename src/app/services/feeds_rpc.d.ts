declare module Communication{
    type jsonrpc_id = string | number | null
    type create_channel_request = {
        version: "1.0"
        method : "create_channel"
        id     : jsonrpc_id
        params : {
            access_token    : string
            name        : string
            introduction: string  
            avatar      : any
        } 
    }
    type create_channel_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : {
            id: number 
        }
        
    }
    
    type publish_post_request = {
        version: "1.0"
        method : "publish_post"
        id     : jsonrpc_id
        params : {
            access_token    : string
            channel_id  : number
            content     : any
        } 
    }
    type publish_post_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : {
            id: number
        }
    }
    
    type post_comment_request = {
        version: "1.0"
        method : "post_comment"
        id     : jsonrpc_id
        params : {
            access_token  : string
            channel_id: number
            post_id   : number
            comment_id: number | null
            content   : any
        } 
    }
    type post_comment_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : {
            id: number
        }
    }
    
    type post_like_request = {
        version: "1.0"
        method : "post_like"
        id     : jsonrpc_id
        params : {
            access_token  : string
            channel_id: number
            post_id   : number
            comment_id: number | null
        } 
    }
    
    type post_like_response = {
        version: "1.0"
        result : null
        id     : jsonrpc_id
    }

    type post_unlike_request = {
        version: "1.0"
        method : "post_unlike"
        id     : jsonrpc_id
        params : {
            access_token: string
            channel_id  : number
            post_id     : number
            comment_id  : number | 0
        } 
    }

    type post_unlike_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : null
    }
    
    const enum field {
        id = 1,
        last_update = 2,
        created_at = 3
    }
    
    type get_my_channels_request = {
        version: "1.0"
        method : "get_my_channels"
        id     : jsonrpc_id
        params : {
            access_token   : string
            by         : field
            upper_bound: number | null
            lower_bound: number | null
            max_count : number
        }
    }
    type get_my_channels_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : {
            is_last : boolean
            channels: {
                id          : number
                name        : string
                introduction: string
                subscribers : number
                avatar      : any
           }[]
        }
    }
    
    type get_my_channels_metadata_request = {
        version: "1.0"
        method : "get_my_channels_metadata"
        id     : jsonrpc_id
        params : {
            access_token   : string
            by         : field
            upper_bound: number | null
            lower_bound: number | null
            max_count : number
        }
    }

    type get_my_channels_metadata_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : {
            id          : number
            subscribers : number
        }[]
    }
    
    type get_channels_request = {
        version: "1.0"
        method : "get_channels"
        id     : jsonrpc_id
        params : {
            access_token   : string
            by         : field
            upper_bound: number | null
            lower_bound: number | null
            max_count : number
        }
    }

    type get_channels_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : {
            is_last : boolean
            channels: {
                id          : number
                name        : string
                introduction: string
                owner_name  : string
                owner_did   : string 
                subscribers : number
                last_update : number
                avatar      : any
            }[]  
        }
        
    }
    
    type get_channel_detail_request = {
        version: "1.0"
        method : "get_channel_detail"
        id     : jsonrpc_id
        params : {
            access_token : string
            id       : number 
        }
    }
    type get_channel_detail_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : {
            id          : number
            name        : string
            introduction: string
            owner_name  : string
            owner_did   : string 
            subscribers : number
            last_update : number
            avatar      : any
        }[]  
    }
    
    type get_subscribed_channels_request = {
        version: "1.0"
        method : "get_subscribed_channels"
        id     : jsonrpc_id
        params : {
            access_token   : string
            by         : field
            upper_bound: number | null
            lower_bound: number | null
            max_count : number
        }
    }

    type get_subscribed_channels_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : {
            is_last : boolean
            channels: {
                id          : number
                name        : string
                introduction: string
                owner_name  : string
                owner_did   : string 
                subscribers : number
                last_update : number
                avatar      : any
            }[]
        }
    }
    
    type get_posts_request = {
        version: "1.0"
        method : "get_posts"
        id     : jsonrpc_id
        params : {
            access_token   : string
            channel_id : number
            by         : field
            upper_bound: number | null 
            lower_bound: number | null
            max_count : number
        }
    }
    type get_posts_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : {
            is_last: boolean
            posts  : {
                channel_id: number
                id        : number
                content   : any
                comments  : number
                likes     : number
                created_at: number
            }[]
        }
        
    }
    
    type get_liked_posts_request = {
        version: "1.0"
        method : "get_liked_posts"
        id     : jsonrpc_id
        params : {
            access_token: string
            by          : field
            upper_bound : number
            lower_bound : number
            max_count   : number
        }
    }
    type get_liked_posts_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : {
            is_last: boolean
            posts  : {
                channel_id: number
                id        : number
                content   : any
                comments  : number
                likes     : number
                created_at: number
            }[]
        }
    }

    type get_comments_request = {
        version: "1.0"
        method : "get_comments"
        id     : jsonrpc_id
        params : {
            access_token   : string
            channel_id : number
            post_id    : number
            by         : field
            upper_bound: number | null 
            lower_bound: number | null
            max_count : number
        }
    }
    type get_comments_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : {
            is_last : boolean
            comments: {
                channel_id: number
                post_id   : number
                id        : number
                comment_id: number | null
                user_name : string  
                content   : any
                likes     : number
                created_at: number
            }[]
        }
    }
    
    type get_statistics_request = {
        version: "1.0"
        method : "get_statistics"
        id     : jsonrpc_id
        params : {
            access_token   : string
        }
    }
    type get_statistics_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : {
            did               : string
            connecting_clients: number
        }
    }
    
    // access control write rpc
    type subscribe_channel_request = {
        version: "1.0"
        method : "subscribe_channel"
        id     : jsonrpc_id
        params : {
            access_token   : string
            id: number
        }
    }
    type subscribe_channel_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : null
    }
    
    type unsubscribe_channel_request = {
        version: "1.0"
        method : "unsubscribe_channel"
        id     : jsonrpc_id
        params : {
            access_token   : string
            id: number
        }
    }

    type unsubscribe_channel_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : null
    }
    
    type add_node_publisher_request = {
        version: "1.0"
        method : "add_node_publisher"
        id     : jsonrpc_id
        params : {
            access_token   : string
            did: string
        }
    }
    // type add_node_publisher_response = {
    //     version: "1.0"
    //     id     : jsonrpc_id
    //     result : null
    //     params: {
    //         access_token   : string
    //     }
        
    // }
    
    type remove_node_publisher_request = {
        version: "1.0"
        method : "remove_node_publisher"
        id     : jsonrpc_id
        params : {
            access_token   : string
            did: string,
        }
    }
    type remove_node_publisher_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : null,
        params: {
            access_token   : string
        }
    }
    
    // access control read rpc
    type query_channel_creation_permission_request = {
        version: "1.0"
        id     : jsonrpc_id
        method : "query_channel_creation_permission"
        params: {
            access_token   : string
        }
    }
    type query_channel_creation_permission_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : {
            authorized : boolean
        }
    }
    type update_feedinfo_request = {
        version: "1.0"
        method : "update_feedinfo"
        id     : jsonrpc_id
        params : {
            access_token: string
            id          : number //channelId
            name        : string
            introduction: string  
            avatar      : any
        } 
    }

    type update_feedinfo_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : null
    }
    
        
    // event notification
    type enable_notification_request = {
        version: "1.0"
        method : "enable_notification"
        id     : jsonrpc_id
        params: {
            access_token   : string
        }
    }
    type enable_notification_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : null
    }

    type feedinfo_update_notification = {
        version: "1.0"
        method : "feedinfo_update"
        params : {
            id          : number    //channel_id
            name        : string
            introduction: string
            subscribers : number
            last_update : number
            avatar      : any       //bin
        }
    }

    type new_post_notification = {
        version: "1.0"
        method : "new_post"
        params : {
            channel_id: number
            id   : number
            content   : any
            created_at: number
        }
    }
    
    type new_comment_notification = {
        version: "1.0"
        method : "new_comment"
        params : {
            channel_id: number
            post_id   : number
            id        : number
            comment_id: number
            user_name : string 
            content   : any
            created_at: number
        }
    }
    
    type new_likes_notification = {
        version: "1.0"
        method : "new_like"
        params : {
            channel_id : number
            post_id    : number
            comment_id : number
            user_name  : string
            user_did   : string
            total_count: number
        }
    }

    type new_subscription_notification = {
        version: "1.0"
        method : "new_subscription"
        params : {
            channel_id: number
            user_name : string
            user_did  : string
        }
    }

    type signin_request_challenge_request = { 
        version: "1.0"
        method : "signin_request_challenge"
        id     : jsonrpc_id
        params : {
            iss: string
            credential_required: boolean
        }
    }

    type signin_response_challenge_response = {  
        version: "1.0"
        id     : jsonrpc_id
        result : {
            credential_required: boolean
            jws: string
            // [credential]: feeds_vc     
        }
    }
    
    type signin_confirm_challenge_request = {
        version: "1.0"
        method : "signin_confirm_challenge"
        id     : jsonrpc_id
        params : {
            jws: string
        }
    }

    type signin_confirm_challenge_credential_request = {
        version: "1.0"
        method : "signin_confirm_challenge"
        id     : jsonrpc_id
        params : {
            jws: string
            credential:string
        }
    }


    type signin_confirm_challenge_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : {
            access_token: string    //jws = { sub  : dapp_did name : string email: string exp  : number }
            exp: number
        }
    }
    
    type declare_owner_request = {
        version: "1.0"
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
        version: "1.0"
        method  : "import_did"
        id      : jsonrpc_id
        params  : {
            mnemonic: string
            passphrase: string
            index: number
        }
    }

    type create_did_request = {
        version: "1.0"
        method  : "import_did"
        id      : jsonrpc_id
    }

    type import_did_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : {
            // did: feeds_did
            did: string
            transaction_payload: string
        }
    }
    
    type issue_credential_request = {
        version: "1.0"
        method : "issue_credential"
        id     : jsonrpc_id
        params : {
            credential: string
        }
    }

    type issue_credential_response = {
        version: "1.0"
        id     : jsonrpc_id
        result : null
    }
    
}

