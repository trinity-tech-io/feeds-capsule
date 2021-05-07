import { Injectable } from '@angular/core';
import { Events } from 'src/app/services/events.service';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { JsonRPCService } from 'src/app/services/JsonRPCService';
import { SerializeDataService } from 'src/app/services/SerializeDataService';
import { FormatInfoService } from 'src/app/services/FormatInfoService';

@Injectable()
export class ConnectionService {
    public friendConnectionMap: {[nodeId:string]: FeedsData.ConnState};

    constructor(
        private events: Events,
        private native: NativeService,
        private translate: TranslateService,
        private jsonRPCService: JsonRPCService,
        private serializeDataService: SerializeDataService,
        private formatInfoService: FormatInfoService) {
    }

    request(){
    }

    createChannel(serverName: string, nodeId: string, name: string, introduction: string,
                 avatar: any, accessToken: FeedsData.AccessToken, tipMethods: string, proof: string){
        if (accessToken == null || accessToken == undefined)
            return ;

        let avatarBin = this.serializeDataService.encodeData(avatar);

        let request: Communication.create_channel_request = {
            version: "2.0",
            method : "create_channel",
            id     : -1,
            params : {
                access_token  : accessToken.token,
                name          : name,
                introduction  : introduction,
                avatar        : avatarBin,
                tip_methods   : tipMethods,
                proof         : proof
            }
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params, "");
    }

    publishPost(serverName: string, nodeId: string, channelId: number, content: any,
                accessToken: FeedsData.AccessToken, tempId: number){
        if (accessToken == null || accessToken == undefined)
            return ;

        let contentBin = this.serializeDataService.encodeData(content);

        let memo = {
            tempId: tempId
        }
        //TODO 2.0
        let thumbnails = "";
        //TODO 2.0
        let hashId = "";
        //TODO 2.0
        let proof = "";
        //TODO 2.0
        let originPostUrl = "";
        let request: Communication.publish_post_request = {
            version: "2.0",
            method : "publish_post",
            id     : -1,
            params : {
                access_token    : accessToken.token,
                channel_id      : Number(channelId),
                content         : contentBin,
                thumbnails      : thumbnails,
                hash_id         : hashId,
                proof           : proof,
                origin_post_url : originPostUrl
            }
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params, memo);
    }

    //added v1.3.0 server
    declarePost(serverName: string, nodeId: string, channelId: number, content: any,
        withNotify: boolean ,accessToken: FeedsData.AccessToken,tempId: number){
        if (accessToken == null || accessToken == undefined)
            return ;

        let contentBin = this.serializeDataService.encodeData(content);

        let request: Communication.declare_post_request = {
            version: "1.0",
            method : "declare_post",
            id     : -1,
            params : {
                access_token    : accessToken.token,
                channel_id  : Number(channelId),
                content     : contentBin,
                with_notify : withNotify
            }
        }
        let memo = {
            tempId: tempId
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params, memo);
    }

    //added v1.3.0 server
    notifyPost(serverName: string, nodeId: string, channelId: number, postId: number,accessToken: FeedsData.AccessToken, tempId: number){
        if (accessToken == null || accessToken == undefined)
            return ;
        let memo = {
            tempId: tempId
        }

        let request: Communication.notify_post_request = {
            version: "1.0",
            method : "notify_post",
            id     : -1,
            params : {
                access_token    : accessToken.token,
                channel_id      : Number(channelId),
                post_id         : Number(postId)
            }
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params, memo);
    }

    postComment(serverName: string, nodeId: string, channelId: number, postId: number,
              commentId: number , content: any, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let contentBin = this.serializeDataService.encodeData(content);

        let request: Communication.post_comment_request = {
            version: "1.0",
            method : "post_comment",
            id     : -1,
            params : {
                access_token    : accessToken.token,
                channel_id      : channelId,
                post_id         : postId,
                comment_id      : commentId,
                content         : contentBin,
            }
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params, "");
    }

    postLike(serverName: string, nodeId: string, channelId: number, postId: number,
            commentId: number, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let request: Communication.post_like_request = {
            version: "1.0",
            method : "post_like",
            id     : -1,
            params : {
                access_token  : accessToken.token,
                channel_id    : channelId,
                post_id       : postId,
                comment_id    : commentId,
            }
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params, "");
    }

    postUnlike(serverName: string, nodeId:string, channelId: number, postId: number,
            commentId: number, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let request: Communication.post_unlike_request = {
            version: "1.0",
            method : "post_unlike",
            id     : -1,
            params : {
                access_token  : accessToken.token,
                channel_id    : channelId,
                post_id       : postId,
                comment_id    : commentId,
            }
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params, "");
    }

   getMyChannels(serverName: string, nodeId: string, field: Communication.field, upper_bound: number,
                lower_bound: number, max_counts: number, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let request: Communication.get_my_channels_request = {
            version: "1.0",
            method : "get_my_channels",
            id     : -1,
            params : {
                access_token    : accessToken.token,
                by              : field,
                upper_bound     : upper_bound,
                lower_bound     : lower_bound,
                max_count       : max_counts,
            }
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params,"", false);
    }

    // getMyChannelsMetaData(serverName: string, nodeId: string, field: Communication.field, upper_bound: number,
    //                     lower_bound: number, max_counts: number, accessToken: FeedsData.AccessToken){
    //     if (accessToken == undefined)
    //         return ;

    //     let request: Communication.get_my_channels_metadata_request = {
    //         version: "1.0",
    //         method : "get_my_channels_metadata",
    //         id     : -1,
    //         params : {
    //             access_token    : accessToken.token,
    //             by              : field,
    //             upper_bound     : upper_bound,
    //             lower_bound     : lower_bound,
    //             max_count       : max_counts,
    //         }
    //     }
    //     this.sendRPCMessage(serverName, nodeId, request.method, request.params,"" ,false);
    // }

    getChannels(serverName: string, nodeId: string, field: Communication.field, upper_bound: number,
              lower_bound: number, max_counts: number, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let request: Communication.get_channels_request = {
            version: "1.0",
            method : "get_channels",
            id     : -1,
            params : {
                access_token    : accessToken.token,
                by              : field,
                upper_bound     : upper_bound,
                lower_bound     : lower_bound,
                max_count       : max_counts,
            }
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params, "",false);
    }

    getChannelDetail(serverName: string, nodeId: string, id: number, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let request: Communication.get_channel_detail_request = {
            version: "1.0",
            method : "get_channel_detail",
            id     : -1,
            params : {
                access_token  : accessToken.token,
                id            : id,
            },
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params, "", false);
    }

    getSubscribedChannels(serverName: string, nodeId: string, field: Communication.field, upper_bound: number,
                            lower_bound: number, max_counts: number, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let request: Communication.get_subscribed_channels_request = {
            version: "1.0",
            method : "get_subscribed_channels",
            id     : -1,
            params : {
                access_token    : accessToken.token,
                by              : field,
                upper_bound     : upper_bound,
                lower_bound     : lower_bound,
                max_count       : max_counts,
            },
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params, "", false);
    }

    getPost(serverName: string, nodeId: string, channel_id: number, by: Communication.field,
            upper_bound: number, lower_bound: number , max_counts: number, memo: any,
            accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let request: Communication.get_posts_request = {
            version: "1.0",
            method : "get_posts",
            id     : -1,
            params : {
                access_token    : accessToken.token,
                channel_id      : Number(channel_id),
                by              : by,
                upper_bound     : upper_bound,
                lower_bound     : lower_bound,
                max_count       : max_counts,
            },
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params, memo, false);
    }

    getComments(serverName: string, nodeId: string, channel_id: number, post_id: number,
              by:Communication.field, upper_bound: number, lower_bound: number,
              max_counts:number, isShowOfflineToast: boolean, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let request:Communication.get_comments_request = {
            version: "1.0",
            method : "get_comments",
            id     : -1,
            params : {
                access_token    : accessToken.token,
                channel_id      : channel_id,
                post_id         : post_id,
                by              : by,
                upper_bound     : upper_bound,
                lower_bound     : lower_bound ,
                max_count       : max_counts,
            },
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params, "", isShowOfflineToast);
    }

    getStatistics(serverName: string, nodeId: string, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let request:Communication.get_statistics_request = {
            version: "1.0",
            method : "get_statistics",
            id     : -1,
            params : {
                access_token    : accessToken.token
            },
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params, "", false);
    }

    subscribeChannel(serverName: string, nodeId: string, id: number, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let request: Communication.subscribe_channel_request = {
            version: "1.0",
            method : "subscribe_channel",
            id     : -1,
            params : {
                access_token  : accessToken.token,
                id            : id,
            },
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params,"");
    }

    unsubscribeChannel(serverName: string, nodeId: string, id: number, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let request: Communication.unsubscribe_channel_request = {
            version: "1.0",
            method : "unsubscribe_channel",
            id     : -1,
            params : {
                access_token  : accessToken.token,
                id            : id
            },
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params,"");
    }

    editFeedInfo(serverName: string, nodeId: string, channelId: number, name: string , desc: string, avatarBin: any, 
        accessToken: FeedsData.AccessToken, tipMethods: string, proof: string){
        if (accessToken == null || accessToken == undefined)
            return ;

        let request: Communication.update_feedinfo_request = {
            version: "2.0",
            method : "update_feedinfo",
            id     : -1,
            params : {
                access_token    : accessToken.token,
                id              : channelId, //channelId
                name            : name,
                introduction    : desc,
                avatar          : avatarBin,
                tip_methods     : tipMethods,
                proof           : proof
            }
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params,"");
    }

    enableNotification(serverName: string, nodeId: string, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let request: Communication.enable_notification_request = {
            version: "1.0",
            method : "enable_notification",
            id     : -1,
            params : {
                access_token   : accessToken.token
            },
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params,"");
    }

    signinChallengeRequest(serverName: string, nodeId: string , requiredCredential: boolean, did: string){
        let request: Communication.signin_request_challenge_request = {
          version: "1.0",
          method : "signin_request_challenge",
          id     : -1,
          params : {
              iss                   : did,
              credential_required   : requiredCredential,
          }
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params,"");
    }

    // signinConfirmRequest(serverName: string, nodeId: string, nonce: string, realm: string, requiredCredential: boolean, presentation: string , credential: string){
    //     let request: any;
    //     if (requiredCredential){
    //         request = {
    //             ver: "1.0",
    //             method : "signin_confirm_challenge",
    //             id     : -1,
    //             params : {
    //                 jws           : presentation,
    //                 credential    : credential
    //             }
    //         }
    //     }else {
    //         request = {
    //             ver: "1.0",
    //             method : "signin_confirm_challenge",
    //             id     : -1,
    //             params : {
    //                 jws: presentation,
    //             }
    //         }
    //     }
    //     this.sendRPCMessage(serverName, nodeId, request.method, request.params,"");
    // }

    declareOwnerRequest(serverName: string, nodeId: string, nonce: string, did: string){
        let request: Communication.declare_owner_request = {
          version: "1.0",
          method : "declare_owner",
          id     : -1,
          params : {
              nonce: nonce,
              owner_did: did
          }
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params,"", false);
    }

    importDidRequest(serverName: string, nodeId: string, mnemonic: string, passphrase: string, index: number){
        let request: Communication.import_did_request = {
          version: "1.0",
          method  : "import_did",
          id      : -1,
          params  : {
            mnemonic    : mnemonic,
            passphrase  : passphrase,
            index       : index
          }
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params,"");
    }

    createDidRequest(serverName: string, nodeId: string){
        let request: Communication.create_did_request = {
          version: "1.0",
          method  : "import_did",
          id      : -1,
        }
        this.sendRPCMessage(serverName, nodeId, request.method, null, "");
    }

    issueCredentialRequest(serverName: string, nodeId: string, credential: string){
        let request: Communication.issue_credential_request = {
          version: "1.0",
          method : "issue_credential",
          id     : -1,
          params : {
              credential: credential,
          }
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params,"");
    }

    editPost(serverName: string, nodeId: string, channelId: number, postId: number, content: any, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;
        //TODO 2.0
        let thumbnails = "";
        //TODO 2.0
        let hashId = ""
        //TODO 2.0
        let proof = "";
        //TODO 2.0
        let originPostUrl = "";

        let contentBin = this.serializeDataService.encodeData(content);
        let request: Communication.edit_post_request = {
            version: "2.0",
            method : "edit_post",
            id     : -1,
            params : {
                access_token    : accessToken.token,
                channel_id      : Number(channelId),
                id              : Number(postId),
                content         : contentBin,
                thumbnails      : thumbnails,
                hash_id         : hashId,
                proof           : proof,
                origin_post_url : originPostUrl
            }
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params,"");
    }

    deletePost(serverName: string, nodeId: string, channelId: number, postId: number, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let request: Communication.delete_post_request = {
            version: "1.0",
            method : "delete_post",
            id     : -1,
            params : {
                access_token: accessToken.token,
                channel_id  : channelId,
                id          : postId
            }
        }

        this.sendRPCMessage(serverName, nodeId, request.method, request.params,"");
    }

    editComment(serverName: string, nodeId: string, channelId: number, postId: number, commentId: number,
                commentById: number, content: any, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let contentBin = this.serializeDataService.encodeData(content);

        let request: Communication.edit_comment_request = {
            version: "1.0",
            method : "edit_comment",
            id     : -1,
            params : {
                access_token: accessToken.token,
                channel_id  : channelId,        //channel_id
                post_id     : postId,        //post_id
                id          : commentId,        //comment_id
                comment_id  : commentById,   //comment_id | 0
                content     : contentBin           //bin
            }
        }

        this.sendRPCMessage(serverName, nodeId, request.method, request.params,"");
    }

    deleteComment(serverName: string, nodeId: string, channelId: number, postId: number,
                commentId: number, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let request: Communication.delete_comment_request = {
            version: "1.0",
            method : "delete_comment",
            id     : -1,
            params : {
                access_token: accessToken.token,
                channel_id  : channelId,        //channel_id
                post_id     : postId,        //post_id
                id          : commentId        //comment_id
            }
        }

        this.sendRPCMessage(serverName, nodeId, request.method, request.params, "");
    }

    getServerVersion(serverName: string, nodeId: string){
        let request: Communication.get_service_version_request = {
            version: "1.0",
            method : "get_service_version",
            id     : -1,
            params : {
                access_token: ""
            }
        }

        this.sendRPCMessage(serverName, nodeId, request.method, request.params, "");
    }

    updateCredential(serverName: string, nodeId: string, credential: string, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let request: Communication.update_credential_request = {
            version: "1.0",
            method : "update_credential",
            id     : -1,
            params : {
                access_token: accessToken.token,
                credential: credential
            }
        }

        this.sendRPCMessage(serverName, nodeId, request.method, request.params, "");
    }

    setBinary(serverName: string, nodeId: string, key: string,  content: any, accessToken: FeedsData.AccessToken, memo: any){
        if (accessToken == null || accessToken == undefined)
            return ;
        
        let contentBin = this.serializeDataService.encodeData(content);
        let request: Communication.set_binary_request = {
            version: "1.0",
            method : "set_binary",
            id     : -1,
            params : {
                access_token: accessToken.token,
                key         : key,
                algo        : "None", // "None", "SHA256", "CRC"...
                checksum    : "",
                content     : contentBin
            }
        }

        this.sendRPCMessage(serverName, nodeId, request.method, request.params, memo);
    }

    getBinary(serverName: string, nodeId: string, key: string, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let request: Communication.get_binary_request = {
            version: "1.0",
            method : "get_binary",
            id     : -1,
            params : {
                access_token: accessToken.token,
                key         : key
            }
        }

        this.sendRPCMessage(serverName, nodeId, request.method, request.params, "");
    }


    standardSignIn(serverName: string, nodeId: string, didDocument: string){
        let request: Communication.standard_sign_in_request = {
            version: "1.0",
            method : "standard_sign_in",
            id     : -1,
            params : {
                document    : didDocument
            }
        }

        this.sendRPCMessage(serverName, nodeId, request.method, request.params, ""); 
    }

    standardDidAuth(serverName: string, nodeId: string, verifiablePresentation: string, name: string){
        let request: Communication.standard_did_auth_request = {
            version: "1.0",
            method : "standard_did_auth",
            id     : -1,
            params : {
                user_name   : name,
                jwt_vp      : verifiablePresentation
            }
        }

        this.sendRPCMessage(serverName, nodeId, request.method, request.params, ""); 
    }

    getMultiComments(serverName: string, nodeId: string, channelId: number, postId: number,
                    by:Communication.field, upperBound: number, lowerBound: number,
                    maxCounts:number, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let request: Communication.get_multi_comments_request = {
            version: "1.0",
            method : "get_multi_comments",
            id     : -1,
            params : {
                access_token: accessToken.token,
                channel_id  : channelId,    //channel_id
                post_id     : postId,    //post_id
                by          : by,     //id
                upper_bound : upperBound,
                lower_bound : lowerBound,
                max_count   : maxCounts
            }
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params, "", false); 
    }

    getMultiSubscribers(serverName: string,nodeId: string, channelId: number, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let request: Communication.get_multi_subscribers_count_request = {
            version: "1.0",
            method : "get_multi_subscribers_count",
            id     : -1,
            params : {
                access_token    : accessToken.token,
                channel_id      : channelId // 0
            }
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params, "", false); 
    }

    getMultiLikesAndCommentsCount(serverName: string,nodeId: string, channelId: number,
                    postId: number, by: Communication.field, upperBound:number, lowerBound: number,
                    maxCount: number, accessToken: FeedsData.AccessToken){
        if (accessToken == null || accessToken == undefined)
            return ;

        let request: Communication.get_multi_likes_and_comments_count_request = {
            version: "1.0",
            method : "get_multi_likes_and_comments_count",
            id     : -1,
            params : {
                access_token: accessToken.token,
                channel_id  : channelId,
                post_id     : postId,
                by          : by,
                upper_bound : upperBound,
                lower_bound : lowerBound,
                max_count   : maxCount
            }
        }
        this.sendRPCMessage(serverName, nodeId, request.method, request.params, "", false); 
    }

    sendRPCMessage(serverName: string, nodeId: string, method: string, params: any, memo: any, isShowOfflineToast: boolean = true){
        if(!this.checkServerConnection(nodeId)){
          this.events.publish(FeedsEvent.PublishType.rpcRequestError);
          return;
        }
        this.jsonRPCService.request(
            method,
            nodeId,
            params,
            memo,
            ()=>{

            },
            (error)=>{
                this.events.publish(FeedsEvent.PublishType.rpcRequestError);
            }
        );
    }

    response(){

    }

    checkServerConnection(nodeId: string): boolean{
        if(this.friendConnectionMap == null ||
          this.friendConnectionMap == undefined ||
          this.friendConnectionMap[nodeId] == undefined||
          this.friendConnectionMap[nodeId] == FeedsData.ConnState.disconnected)
          return false ;

        return true ;
    }


    resetConnectionStatus(){
        let connectionMap = this.friendConnectionMap||{};
        let keys: string[] = Object.keys(connectionMap) || [];
        for (let index = 0; index < keys.length; index++) {
            if (this.friendConnectionMap[keys[index]] == undefined)
                continue;
            this.friendConnectionMap[keys[index]] = FeedsData.ConnState.disconnected;
        }
    }
}
