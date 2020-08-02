import { Injectable } from '@angular/core';
import { Events } from '@ionic/angular';

type JSONRPC = {
    jsonrpc: "2.0",
    method: string,
    params:any,
    id: string | number | null
}
let eventBus: Events;

@Injectable()
export class AgentService {
    constructor(private events: Events) {
        eventBus = events;
    }

    request(nodeId: string, requestJson: string, success: any, error: any){
        let ret: JSONRPC = JSON.parse(requestJson);
        let response: any ;
        switch(ret.method){
            case FeedsData.MethodType.create_channel:
                break;
            case FeedsData.MethodType.publish_post:
                break;
            case FeedsData.MethodType.post_comment:
                break;
            case FeedsData.MethodType.post_like:
                break;
            case FeedsData.MethodType.get_my_channels:
                break;
            case FeedsData.MethodType.get_my_channels_metadata:
                break;
            case FeedsData.MethodType.get_channels:
                break;
            case FeedsData.MethodType.get_channel_detail:
                break;
            case FeedsData.MethodType.get_subscribed_channels:

                for (let index = 0; index < 10; index++) {
                    // channel = Chan
                    
                }

                break;
            case FeedsData.MethodType.get_posts:
                break;
            case FeedsData.MethodType.get_comments:
                break;
            case FeedsData.MethodType.get_statistics:
                break;
            case FeedsData.MethodType.subscribe_channel:
                break;
            case FeedsData.MethodType.unsubscribe_channel:
                break;
            case FeedsData.MethodType.query_channel_creation_permission:
                break;                                                                                                                                                        
            case FeedsData.MethodType.enable_notification:
                break;
        }

        eventBus.publish('carrier:friendMessage',this.response());

    }

    response(): any{
        let event = {};
        event["from"]="1234567890";
        event["message"]=this.fakeResponse;
        return event;
    }

    fakeResponse(): string{
        return "testmsg"
    }
}
