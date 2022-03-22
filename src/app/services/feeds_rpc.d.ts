declare module Communication {
  type jsonrpc_id = string | number | null;

  const enum field {
    id = 1,
    last_update = 2,
    created_at = 3,
  }

  type declare_owner_request = {
    version: '1.0';
    method: 'declare_owner';
    id: jsonrpc_id;
    params: {
      nonce: string;
      owner_did: string;
    };
  };

  type declare_owner_response = {
    jsonrpc: '1.0';
    id: jsonrpc_id;
    result:
      | {
          phase: 'owner_declared';
        }
      | {
          phase: 'did_imported';
          did: string; //feeds_did
          transaction_payload: string;
        }
      | {
          phase: 'credential_issued';
        };
  };

  type import_did_request = {
    version: '1.0';
    method: 'import_did';
    id: jsonrpc_id;
    params: {
      mnemonic: string;
      passphrase: string;
      index: number;
    };
  };

  type create_did_request = {
    version: '1.0';
    method: 'import_did';
    id: jsonrpc_id;
  };

  type import_did_response = {
    version: '1.0';
    id: jsonrpc_id;
    result: {
      // did: feeds_did
      did: string;
      transaction_payload: string;
    };
  };

  type issue_credential_request = {
    version: '1.0';
    method: 'issue_credential';
    id: jsonrpc_id;
    params: {
      credential: string;
    };
  };

  type issue_credential_response = {
    version: '1.0';
    id: jsonrpc_id;
    result: null;
  };

  type signin_request_challenge_request = {
    version: '1.0';
    method: 'signin_request_challenge';
    id: jsonrpc_id;
    params: {
      iss: string;
      credential_required: boolean;
    };
  };

  type signin_response_challenge_response = {
    version: '1.0';
    id: jsonrpc_id;
    result: {
      credential_required: boolean;
      jws: string;
      // [credential]: feeds_vc
    };
  };

  type signin_confirm_challenge_request = {
    version: '1.0';
    method: 'signin_confirm_challenge';
    id: jsonrpc_id;
    params: {
      jws: string;
      // [credential]: feeds_vc
    };
  };

  type signin_confirm_challenge_credential_request = {
    version: '1.0';
    method: 'signin_confirm_challenge';
    id: jsonrpc_id;
    params: {
      jws: string;
      credential: string;
    };
  };

  type signin_confirm_challenge_response = {
    version: '1.0';
    id: jsonrpc_id;
    result: {
      access_token: string; //jws = { sub  : dapp_did name : string email: string exp  : number }
      exp: number;
    };
  };

  //Update to 2.0
  //Add tip_methods string
  //Add proof string
  type create_channel_request = {
    version: '2.0';
    method: 'create_channel';
    id: jsonrpc_id;
    params: {
      access_token: string;
      name: string;
      introduction: string;
      avatar: any;
      tip_methods: string;
      proof: string;
    };
  };

  type create_channel_response = {
    version: '2.0';
    id: jsonrpc_id;
    result: {
      id: number;
    };
  };

  //Update to 2.0
  //Add tip_methods string
  //Add proof string
  type update_feedinfo_request = {
    version: '2.0';
    method: 'update_feedinfo';
    id: jsonrpc_id;
    params: {
      access_token: string;
      id: number; //channelId
      name: string;
      introduction: string;
      avatar: any;
      tip_methods: string;
      proof: string;
    };
  };

  type update_feedinfo_response = {
    version: '2.0';
    id: jsonrpc_id;
    result: null;
  };

  //Update to 2.0
  //Add thumbnails      : any
  //Add hash_id         : string
  //Add proof           : string
  //Add origin_post_url : string
  type publish_post_request = {
    version: '2.0';
    method: 'publish_post';
    id: jsonrpc_id;
    params: {
      access_token: string;
      channel_id: number;
      content: any;
      thumbnails: any;
      hash_id: string;
      proof: string;
      origin_post_url: string;
    };
  };

  type publish_post_response = {
    version: '2.0';
    id: jsonrpc_id;
    result: {
      id: number;
    };
  };

  //Update to 2.0
  //Add thumbnails : any
  //Add hash_id : string
  //Add proof : string
  //Add origin_post_url : string
  type edit_post_request = {
    version: '2.0';
    method: 'edit_post';
    id: jsonrpc_id;
    params: {
      access_token: string;
      channel_id: number; //channel_id
      id: number; //post_id
      content: Uint8Array; //bin
      thumbnails: any;
      hash_id: string;
      proof: string;
      origin_post_url: string;
    };
  };

  // new api
  type edit_post_response = {
    version: '2.0';
    id: jsonrpc_id;
    result: null;
  };

  //new api
  type delete_post_request = {
    version: '1.0';
    method: 'delete_post';
    id: jsonrpc_id;
    params: {
      access_token: string;
      channel_id: number; //channel_id
      id: number; //post_id
    };
  };

  // new api
  type delete_post_response = {
    version: '1.0';
    id: jsonrpc_id;
    result: null;
  };

  //Update to 2.0
  //Add thumbnails : any
  //Add hash_id : string
  //Add proof : string
  type post_comment_request = {
    version: '2.0';
    method: 'post_comment';
    id: jsonrpc_id;
    params: {
      access_token: string;
      channel_id: number;
      post_id: number;
      comment_id: number | null;
      content: any;
      thumbnails: any;
      hash_id: string;
      proof: string;
    };
  };

  type post_comment_response = {
    version: '2.0';
    id: jsonrpc_id;
    result: {
      id: number;
    };
  };

  //Update to 2.0
  //Add thumbnails : any
  //Add hash_id : string
  //Add proof : string
  type edit_comment_request = {
    version: '2.0';
    method: 'edit_comment';
    id: jsonrpc_id;
    params: {
      access_token: string;
      channel_id: number; //channel_id
      post_id: number; //post_id
      id: number; //comment_id
      comment_id: number | 0; //comment_id | 0
      content: any; //bin
      thumbnails: any;
      hash_id: string;
      proof: string;
    };
  };

  // new api
  type edit_comment_response = {
    version: '2.0';
    id: jsonrpc_id;
    result: null;
  };

  // new api
  type delete_comment_request = {
    version: '1.0';
    method: 'delete_comment';
    id: jsonrpc_id;
    params: {
      access_token: string;
      channel_id: number; //channel_id
      post_id: number; //post_id
      id: number; //comment_id
    };
  };

  // new api
  type delete_comment_response = {
    version: '1.0';
    id: jsonrpc_id;
    result: null;
  };

  //Update to 2.0
  //Add proof : string
  type post_like_request = {
    version: '2.0';
    method: 'post_like';
    id: jsonrpc_id;
    params: {
      access_token: string;
      channel_id: string;
      post_id: string;
      comment_id: number | null;
      proof: string;
    };
  };

  type post_like_response = {
    version: '2.0';
    result: null;
    id: jsonrpc_id;
  };

  type post_unlike_request = {
    version: '1.0';
    method: 'post_unlike';
    id: jsonrpc_id;
    params: {
      access_token: string;
      channel_id: string;
      post_id: string;
      comment_id: number | 0;
    };
  };

  type post_unlike_response = {
    version: '1.0';
    id: jsonrpc_id;
    result: null;
  };

  type get_my_channels_request = {
    version: '1.0';
    method: 'get_my_channels';
    id: jsonrpc_id;
    params: {
      access_token: string;
      by: field;
      upper_bound: number | null;
      lower_bound: number | null;
      max_count: number;
    };
  };

  type get_my_channels_response = {
    version: '1.0';
    id: jsonrpc_id;
    result: {
      is_last: boolean;
      channels: {
        id: number;
        name: string;
        introduction: string;
        subscribers: number;
        avatar: any;
      }[];
    };
  };

  // type get_my_channels_metadata_request = {
  //     version: "1.0"
  //     method : "get_my_channels_metadata"
  //     id     : jsonrpc_id
  //     params : {
  //         access_token    : string
  //         by              : field
  //         upper_bound     : number | null
  //         lower_bound     : number | null
  //         max_count       : number
  //     }
  // }

  // type get_my_channels_metadata_response = {
  //     version: "1.0"
  //     id     : jsonrpc_id
  //     result : {
  //         id          : number
  //         subscribers : number
  //     }[]
  // }

  //Update to 2.0
  type get_channels_request = {
    version: '2.0';
    method: 'get_channels';
    id: jsonrpc_id;
    params: {
      access_token: string;
      by: field;
      upper_bound: number | null;
      lower_bound: number | null;
      max_count: number;
    };
  };

  //Update to 2.0
  //Add tip_methods :string
  //Add proof       : string
  //Add status      : number
  type get_channels_response = {
    version: '2.0';
    id: jsonrpc_id;
    result: {
      is_last: boolean;
      channels: {
        id: number;
        name: string;
        introduction: string;
        owner_name: string;
        owner_did: string;
        subscribers: number;
        last_update: number;
        avatar: any;
        tip_methods: string;
        proof: string;
        status: number;
      }[];
    };
  };

  type get_channel_detail_request = {
    version: '1.0';
    method: 'get_channel_detail';
    id: jsonrpc_id;
    params: {
      access_token: string;
      id: string;
    };
  };
  type get_channel_detail_response = {
    version: '1.0';
    id: jsonrpc_id;
    result: {
      id: number;
      name: string;
      introduction: string;
      owner_name: string;
      owner_did: string;
      subscribers: number;
      last_update: number;
      avatar: any;
    }[];
  };

  //Update to 2.0
  type get_subscribed_channels_request = {
    version: '2.0';
    method: 'get_subscribed_channels';
    id: jsonrpc_id;
    params: {
      access_token: string;
      by: field;
      upper_bound: number | null;
      lower_bound: number | null;
      max_count: number;
    };
  };

  //Update to 2.0
  //Add create_at:number
  //Add subscribed_time : number
  //Add proof : string
  type get_subscribed_channels_response = {
    version: '2.0';
    id: jsonrpc_id;
    result: {
      is_last: boolean;
      channels: {
        id: number;
        name: string;
        introduction: string;
        owner_name: string;
        owner_did: string;
        subscribers: number;
        last_update: number;
        avatar: any;
        create_at: number;
        subscribed_time: number;
        proof: string;
      }[];
    };
  };

  //Update to 2.0
  type get_posts_request = {
    version: '2.0';
    method: 'get_posts';
    id: jsonrpc_id;
    params: {
      access_token: string;
      channel_id: number;
      by: field;
      upper_bound: number | null;
      lower_bound: number | null;
      max_count: number;
    };
  };

  //Update to 2.0
  //Add thumbnails : any
  //Add hash_id : string
  //Add proof : string
  //Add origin_post_url : string
  type get_posts_response = {
    version: '2.0';
    id: jsonrpc_id;
    result: {
      is_last: boolean;
      posts: {
        channel_id: number; //channel_id
        id: number; //post_id
        status: FeedsData.PostCommentStatus; // post_status
        content: any; //bin | null
        comments: number;
        likes: number;
        created_at: number;
        updated_at: number;
        thumbnails: any;
        hash_id: string;
        proof: string;
        origin_post_url: string;
      }[];
    };
  };

  // new api
  type get_posts_likes_and_comments_request = {
    version: '1.0';
    method: 'get_posts_likes_and_comments';
    id: jsonrpc_id;
    params: {
      access_token: string;
      channel_id: number; //channel_id
      by: field;
      upper_bound: number;
      lower_bound: number;
      max_count: number;
    };
  };

  // new api
  type get_posts_likes_and_comments_response = {
    version: '1.0';
    id: jsonrpc_id;
    result: {
      posts: {
        channel_id: number; //channel_id
        post_id: number; //post_id
        comments: number;
        likes: number;
      }[];
    };
  };

  type get_liked_posts_request = {
    version: '1.0';
    method: 'get_liked_posts';
    id: jsonrpc_id;
    params: {
      access_token: string;
      by: field;
      upper_bound: number;
      lower_bound: number;
      max_count: number;
    };
  };

  type get_liked_posts_response = {
    version: '1.0';
    id: jsonrpc_id;
    result: {
      is_last: boolean;
      posts: {
        channel_id: number;
        id: number;
        content: any;
        comments: number;
        likes: number;
        created_at: number;
      }[];
    };
  };

  //Update to 2.0
  type get_comments_request = {
    version: '2.0';
    method: 'get_comments';
    id: jsonrpc_id;
    params: {
      access_token: string;
      channel_id: string;
      post_id: string;
      by: field;
      upper_bound: number | null;
      lower_bound: number | null;
      max_count: number;
    };
  };

  //Update to 2.0
  //Add thumbnails : any
  //Add hash_id : string
  //Add proof : string
  type get_comments_response = {
    version: '2.0';
    id: jsonrpc_id;
    result: {
      is_last: boolean;
      comments: {
        channel_id: number; //channel_id
        post_id: number; //post_id
        id: number; //comment_id
        status: FeedsData.PostCommentStatus;
        comment_id: number | 0; //comment_id | 0
        user_name: string;
        content: any | null; //bin | null
        likes: number;
        created_at: number;
        updated_at: number;
        thumbnails: any;
        hash_id: string;
        proof: string;
      }[];
    };
  };

  type get_statistics_request = {
    version: '1.0';
    method: 'get_statistics';
    id: jsonrpc_id;
    params: {
      access_token: string;
    };
  };
  type get_statistics_response = {
    version: '1.0';
    id: jsonrpc_id;
    result: {
      did: string;
      connecting_clients: number;
      total_clients: number;
    };
  };

  //Update to 2.0
  //Add proof
  type subscribe_channel_request = {
    version: '2.0';
    method: 'subscribe_channel';
    id: jsonrpc_id;
    params: {
      access_token: string;
      id: string;
      proof: string;
    };
  };

  //Update to 2.0
  //Add channel object to result
  type subscribe_channel_response = {
    version: '2.0';
    id: jsonrpc_id;
    result: {
      channel: {
        id: number;
        name: string;
        introduction: string;
        owner_name: string;
        owner_did: string;
        subscribers: number;
        last_update: number;
        avatar: any;
        tip_methods: string;
        proof: string;
        status: number;
      };
    };
  };

  type unsubscribe_channel_request = {
    version: '1.0';
    method: 'unsubscribe_channel';
    id: jsonrpc_id;
    params: {
      access_token: string;
      id: string;
    };
  };

  type unsubscribe_channel_response = {
    version: '1.0';
    id: jsonrpc_id;
    result: null;
  };

  // event notification
  type enable_notification_request = {
    version: '1.0';
    method: 'enable_notification';
    id: jsonrpc_id;
    params: {
      access_token: string;
    };
  };

  type enable_notification_response = {
    version: '1.0';
    id: jsonrpc_id;
    result: null;
  };

  //Update to 2.0
  //Add thumbnails : any
  //Add hash_id : string
  //Add proof : string
  //Add origin_post_url : string
  type new_post_notification = {
    version: '1.0';
    method: 'new_post';
    params: {
      channel_id: number;
      id: number;
      content: any;
      created_at: number;
      thumbnails: any;
      hash_id: string;
      proof: string;
      origin_post_url: string;
    };
  };

  //new api
  type post_update_notification = {
    version: '1.0';
    method: 'post_update';
    params: {
      channel_id: number; //channel_id
      id: number; //post_id
      status: FeedsData.PostCommentStatus;
      content: any; //bin | null
      comments: number;
      likes: number;
      created_at: number;
      updated_at: number;
    };
  };

  type new_comment_notification = {
    version: '1.0';
    method: 'new_comment';
    params: {
      channel_id: number;
      post_id: number;
      id: number;
      comment_id: number;
      user_name: string;
      content: any;
      created_at: number;
    };
  };

  // new api
  type comment_update_notification = {
    version: '1.0';
    method: 'comment_update';
    params: {
      channel_id: number; //channel_id
      post_id: number; //post_id
      id: number; //comment_id
      status: FeedsData.PostCommentStatus; //comment_status
      comment_id: number; //comment_id | 0
      user_name: string;
      content: any; //bin | null
      likes: number;
      created_at: number;
      updated_at: number;
    };
  };

  type new_like_notification = {
    version: '1.0';
    method: 'new_like';
    params: {
      channel_id: number; //channel_id
      post_id: number; //post_id
      comment_id: number; //channel_id | 0
      user_name: string;
      user_did: string;
      total_count: number;
    };
  };

  type new_subscription_notification = {
    version: '1.0';
    method: 'new_subscription';
    params: {
      channel_id: number; //channel_id
      user_name: string;
      user_did: string;
    };
  };

  // api update
  type feedinfo_update_notification = {
    version: '1.0';
    method: 'feedinfo_update';
    params: {
      id: number; //channelId
      name: string;
      introduction: string;
      subscribers: number;
      avatar: any;
      last_update: number;
    };
  };

  type set_binary_request = {
    version: '1.0';
    method: 'set_binary';
    id: jsonrpc_id;
    params: {
      access_token: string;
      key: string;
      algo: string; // "None", "SHA256", "CRC"...
      checksum: string;
      content: any;
    };
  };

  type set_binary_response = {
    version: '1.0';
    id: jsonrpc_id;
    result: {
      key: string;
    };
    //or error : {
    //    code : int64_t;
    //    message: string
    //}
  };

  type get_binary_request = {
    version: '1.0';
    method: 'get_binary';
    id: jsonrpc_id;
    params: {
      access_token: string;
      key: string;
    };
  };

  type get_binary_response = {
    version: '1.0';
    id: jsonrpc_id;
    result: {
      key: string;
      algo: string; // "None", "SHA256", "CRC"...
      checksum: string;
      content: any;
    };
    //or error : {
    //    code : int64_t;
    //    message: string
    //}
  };

  type get_service_version_request = {
    version: '1.0';
    method: 'get_service_version';
    id: jsonrpc_id;
    params: {
      access_token: string;
    };
  };

  type get_service_version_response = {
    version: '1.0';
    id: jsonrpc_id;
    result: {
      version: string;
      version_code: number;
    };
  };

  type update_credential_request = {
    version: '1.0';
    method: 'update_credential';
    id: jsonrpc_id;
    params: {
      access_token: string;
      credential: string;
    };
  };

  type update_credential_response = {
    version: '1.0';
    id: jsonrpc_id;
    result: null;
  };

  //Update to 2.0
  //Add thumbnails : any
  //Add hash_id : string
  //Add proof : string
  //Add origin_post_url : string
  type declare_post_request = {
    version: '2.0';
    method: 'declare_post';
    id: jsonrpc_id;
    params: {
      access_token: string;
      channel_id: number;
      content: any;
      with_notify: boolean;
      thumbnails: any;
      hash_id: string;
      proof: string;
      origin_post_url: string;
    };
  };

  //Update to 2.0
  type declare_post_response = {
    version: '2.0';
    id: jsonrpc_id;
    result: {
      id: number;
    };
  };

  type notify_post_request = {
    version: '1.0';
    method: 'notify_post';
    id: jsonrpc_id;
    params: {
      access_token: string;
      channel_id: number;
      post_id: number;
    };
  };

  type notify_post_response = {
    version: '1.0';
    id: jsonrpc_id;
  };

  type standard_sign_in_request = {
    version: '1.0';
    method: 'standard_sign_in';
    id: jsonrpc_id;
    params: {
      document: string;
    };
  };

  type standard_sign_in_response = {
    version: '1.0';
    result: {
      jwt_challenge: string;
    };
  };

  type standard_did_auth_request = {
    version: '1.0';
    method: 'standard_did_auth';
    id: jsonrpc_id;
    params: {
      user_name: string;
      jwt_vp: string;
    };
  };

  type standard_did_auth_response = {
    version: '1.0';
    result: {
      access_token: string;
    };
  };

  //Update to 2.0
  type get_multi_comments_request = {
    version: '2.0';
    method: 'get_multi_comments';
    id: jsonrpc_id;
    params: {
      access_token: string;
      channel_id: string; //channel_id
      post_id: string; //post_id
      by: field; //id
      upper_bound: number;
      lower_bound: number;
      max_count: number;
    };
  };

  //Update to 2.0
  //Add thumbnails : any
  //Add hash_id : string
  //Add proof : string
  type get_multi_comments_response = {
    version: '2.0';
    id: jsonrpc_id;
    result: {
      is_last: boolean;
      comments: {
        channel_id: number; //channel_id    ->feeds
        post_id: number; //post_id       ->post
        comment_id: number; //comment_id    -> comment
        refer_comment_id: number | 0;
        status: FeedsData.PostCommentStatus;
        user_did: string;
        user_name: string;
        content: any | null; //bin | null
        likes: number;
        created_at: number;
        updated_at: number;
        thumbnails: any;
        hash_id: string;
        proof: string;
      }[];
    };
  };

  type get_multi_likes_and_comments_count_request = {
    version: '1.0';
    method: 'get_multi_likes_and_comments_count';
    id: jsonrpc_id;
    params: {
      access_token: string;
      channel_id: number;
      post_id: number;
      by: field;
      upper_bound: number;
      lower_bound: number;
      max_count: number;
    };
  };

  // new api
  type get_multi_likes_and_comments_count_response = {
    version: '1.0';
    id: jsonrpc_id;
    result: {
      is_last: boolean;
      posts: {
        channel_id: number; //channel_id
        post_id: number; //post_id
        comments_count: number;
        likes_count: number;
      }[];
    };
  };

  type get_multi_subscribers_count_request = {
    version: '1.0';
    method: 'get_multi_subscribers_count';
    id: jsonrpc_id;
    params: {
      access_token: string;
      channel_id: number; // 0
    };
  };

  type get_multi_subscribers_count_response = {
    version: '1.0';
    id: jsonrpc_id;
    result: {
      is_last: boolean;
      channels: {
        channel_id: number;
        subscribers_count: number;
      }[];
    };
  };
}
