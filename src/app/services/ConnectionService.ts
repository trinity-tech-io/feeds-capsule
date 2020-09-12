import { Injectable } from '@angular/core';
import { Events } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { JsonRPCService } from 'src/app/services/JsonRPCService';
import { FeedService } from '../services/FeedService';
import { SerializeDataService } from 'src/app/services/SerializeDataService';

@Injectable()
export class ConnectionService {
    public friendConnectionMap: {[nodeId:string]: FeedsData.ConnState};

    constructor(
        private events: Events,
        private native: NativeService,
        private translate: TranslateService,
        private jsonRPCService: JsonRPCService,
        // private feedService: FeedService,
        private serializeDataService: SerializeDataService) {
    }

    request(){
    }

    createChannel(nodeId: string, name: string, introduction: string,
                 avatar: any, accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
            return ;
            
        let avatarBin = this.serializeDataService.encodeData(avatar);
    
        let request: Communication.create_channel_request = {
            version: "1.0",
            method : "create_channel",
            id     : -1,
            params : {
                access_token  : accessToken.token,
                name          : name,
                introduction  : introduction,
                avatar        : avatarBin
            }
        }
        this.sendRPCMessage(nodeId, request.method, request.params, "");
    }

    publishPost(nodeId: string, channelId: number, content: any, 
                accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
            return ;

        let contentBin = this.serializeDataService.encodeData(content);
    
        let request: Communication.publish_post_request = {
            version: "1.0",
            method : "publish_post",
            id     : -1,
            params : {
                access_token  : accessToken.token,
                channel_id    : Number(channelId),
                content       : contentBin,
            }
        }
        this.sendRPCMessage(nodeId, request.method, request.params, "");
    }

    postComment(nodeId: string, channelId: number, postId: number,
              commentId: number , content: any, accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
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
        this.sendRPCMessage(nodeId, request.method, request.params, "");
    }

    postLike(nodeId: string, channelId: number, postId: number, 
            commentId: number, accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
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
        this.sendRPCMessage(nodeId, request.method, request.params, "");
    }

    postUnlike(nodeId:string, channelId: number, postId: number, 
            commentId: number, accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
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
        this.sendRPCMessage(nodeId, request.method, request.params, "");
    }

   getMyChannels(nodeId: string, field: Communication.field, upper_bound: number,
                lower_bound: number, max_counts: number, accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
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
        this.sendRPCMessage(nodeId, request.method, request.params,"", false);
    }   

    getMyChannelsMetaData(nodeId: string, field: Communication.field, upper_bound: number,
                        lower_bound: number, max_counts: number, accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
            return ;
                
        let request: Communication.get_my_channels_metadata_request = {
            version: "1.0",
            method : "get_my_channels_metadata",
            id     : -1,
            params : {
                access_token    : accessToken.token,
                by              : field,
                upper_bound     : upper_bound,
                lower_bound     : lower_bound,
                max_count       : max_counts,
            }
        }
        this.sendRPCMessage(nodeId, request.method, request.params,"" ,false);
    }

    getChannels(nodeId: string, field: Communication.field, upper_bound: number,
              lower_bound: number, max_counts: number, accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
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
        this.sendRPCMessage(nodeId, request.method, request.params, "",false);
    }

    getChannelDetail(nodeId: string, id: number, accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
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
        this.sendRPCMessage(nodeId, request.method, request.params, "", false);
    }

    getSubscribedChannels(nodeId: string, field: Communication.field, upper_bound: number,
                            lower_bound: number, max_counts: number, accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
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
        this.sendRPCMessage(nodeId, request.method, request.params, "", false);
    }

    getPost(nodeId: string, channel_id: number, by: Communication.field,
            upper_bound: number, lower_bound: number , max_counts: number, memo: any, 
            accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
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
        this.sendRPCMessage(nodeId, request.method, request.params, memo, false);
    }

    getComments(nodeId: string, channel_id: number, post_id: number,
              by:Communication.field, upper_bound: number, lower_bound: number, 
              max_counts:number, isShowOfflineToast: boolean, accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
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
        this.sendRPCMessage(nodeId, request.method, request.params, "", isShowOfflineToast);
    }

    getStatistics(nodeId: string, accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
            return ;
    
        let request:Communication.get_statistics_request = {
            version: "1.0",
            method : "get_statistics",
            id     : -1,
            params : {
                access_token    : accessToken.token
            },
        }
        this.sendRPCMessage(nodeId, request.method, request.params, "", false);
    }

    subscribeChannel(nodeId: string, id: number, accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
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
        this.sendRPCMessage(nodeId, request.method, request.params,"");
    }

    unsubscribeChannel(nodeId: string, id: number, accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
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
        this.sendRPCMessage(nodeId, request.method, request.params,"");
    }

    editFeedInfo(nodeId: string, channelId: number, name: string , desc: string, avatarBin: any, accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
            return ;
        
        let request: Communication.update_feedinfo_request = {
            version: "1.0",
            method : "update_feedinfo",
            id     : -1,
            params : {
                access_token  : accessToken.token,
                id            : channelId, //channelId
                name          : name,
                introduction  : desc,
                avatar        : avatarBin
            } 
        }
        this.sendRPCMessage(nodeId, request.method, request.params,"");
    }

    enableNotification(nodeId: string, accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
            return ;
    
        let request: Communication.enable_notification_request = {
            version: "1.0",
            method : "enable_notification",
            id     : -1,
            params : {
                access_token   : accessToken.token
            },
        }
        this.sendRPCMessage(nodeId, request.method, request.params,"");
    }

    signinChallengeRequest(nodeId: string , requiredCredential: boolean, did: string){
        let request: Communication.signin_request_challenge_request = {
          version: "1.0",
          method : "signin_request_challenge",
          id     : -1,
          params : {
              iss                   : did,
              credential_required   : requiredCredential,
          }
        }
        this.sendRPCMessage(nodeId, request.method, request.params,"");
    }

    signinConfirmRequest(nodeId: string, nonce: string, realm: string, requiredCredential: boolean, presentation: string , credential: string){
        let request: any;
        if (requiredCredential){
            request = {
                ver: "1.0",
                method : "signin_confirm_challenge",
                id     : -1,
                params : {
                    jws           : presentation,
                    credential    : credential
                }
            }
        }else {
            request = {
                ver: "1.0",
                method : "signin_confirm_challenge",
                id     : -1,
                params : {
                    jws: presentation,
                }
            }
        }
        this.sendRPCMessage(nodeId, request.method, request.params,"");
    }

    declareOwnerRequest(nodeId: string, nonce: string, did: string){
        let request: Communication.declare_owner_request = {
          version: "1.0",
          method : "declare_owner",
          id     : -1,
          params : {
              nonce: nonce,
              owner_did: did
          }
        }
        this.sendRPCMessage(nodeId, request.method, request.params,"", false);
    }

    importDidRequest(nodeId: string, mnemonic: string, passphrase: string, index: number){
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
        this.sendRPCMessage(nodeId, request.method, request.params,"");
    }

    createDidRequest(nodeId: string){
        let request: Communication.create_did_request = {
          version: "1.0",
          method  : "import_did",
          id      : -1,
        }
        this.sendRPCMessage(nodeId, request.method, null, "");
    }
    
    issueCredentialRequest(nodeId: string, credential: any){
        let request: Communication.issue_credential_request = {
          version: "1.0",
          method : "issue_credential",
          id     : -1,
          params : {
              credential: credential,
          }
        }
        this.sendRPCMessage(nodeId, request.method, request.params,"");
    }

    editPost(nodeId: string, channelId: number, postId: number, content: any, accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
            return ;
        let contentBin = this.serializeDataService.encodeData(content);
        let request: Communication.edit_post_request = {
            version: "1.0",
            method : "edit_post",
            id     : -1,
            params : {
                access_token: accessToken.token,
                channel_id  : channelId,
                id          : postId,
                content     : contentBin
            } 
        }
        this.sendRPCMessage(nodeId, request.method, request.params,"");
    }

    deletePost(nodeId: string, channelId: number, postId: number, accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
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
    
        this.sendRPCMessage(nodeId, request.method, request.params,"");
    }

    editComment(nodeId: string, channelId: number, postId: number, commentId: number,
                commentById: number, content: any, accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
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
    
        this.sendRPCMessage(nodeId, request.method, request.params,"");
    }

    deleteComment(nodeId: string, channelId: number, postId: number, 
                commentId: number, accessToken: FeedsData.AccessToken){
        if (accessToken == undefined)
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
    
        this.sendRPCMessage(nodeId, request.method, request.params,"");
    }

    sendRPCMessage(nodeId: string, method: string, params: any, memo: any, isShowOfflineToast: boolean = true){
        if(!this.checkServerConnection(nodeId)){
          this.events.publish("rpcRequest:error");
          if (isShowOfflineToast)
            this.native.toast(this.translate.instant("AddServerPage.serverMsg1") + nodeId + this.translate.instant("AddServerPage.serverMsg2"));
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
                this.events.publish("rpcRequest:error");
                this.native.toast(JSON.stringify(error));
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
