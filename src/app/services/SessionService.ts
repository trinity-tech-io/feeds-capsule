import { Injectable } from '@angular/core';
import { Events } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { CarrierService } from 'src/app/services/CarrierService';
import { SerializeDataService } from 'src/app/services/SerializeDataService';

type WorkedSession = {
    nodeId: string,
    session: CarrierPlugin.Session,
    index: number,
    state: WorkedState
}

const enum WorkedState {
    sessionInitialized = "sessionInitialized",
    streamInitialized = "streamInitialized",
    streamTransportReady = "streamTransportReady",
    sessionCompletion = "sessionCompletion",
    streamConnecting = "streamConnecting",
    streamConnected = "streamConnected",
    streamStateClosed = "streamStateClosed"
}

@Injectable()
export class SessionService {
    private eventBus = null;

    public friendConnectionMap: {[nodeId:string]: FeedsData.ConnState};
    constructor(
        private events: Events,
        private native: NativeService,
        private translate: TranslateService,
        private carrierService: CarrierService,
        // private feedService: FeedService,
        private serializeDataService: SerializeDataService) {
    }
  
    createSession(nodeId: string, onSuccess:(session: CarrierPlugin.Session)=>void ){
        console.log("nodeId =="+nodeId)
        let session: CarrierPlugin.Session ;
        this.carrierService.newSession(nodeId,(mSession)=>{
            session = mSession;
            console.log("newSession success");
            onSuccess(mSession);
            this.carrierService.sessionAddStream(
                session,
                CarrierPlugin.StreamType.APPLICATION,
                CarrierPlugin.StreamMode.RELIABLE, 
                this.streamCallback, 
                (stream)=>{
                    console.log("addStream success");
                },(err) => {
                    console.log("addStream error");
                }
            );
            },(err)=>{

            }
        );
    }

    sessionRequest(session: CarrierPlugin.Session){
        this.carrierService.sessionRequest(
          session,
          this.onSessionRequestCompleteCallback,
          ()=>{
            console.log("sessionRequest success");
          },(err)=>{
            console.log("sessionRequest error");
    
          }
        );
    }
    
    sessionStart(session: CarrierPlugin.Session, sdp: string){
        this.carrierService.sessionStart(session, sdp, ()=>{
          console.log("sessionStart success");
        },(err)=>{
          console.log("sessionStart error");
    
        })
    }

    streamAddData(stream: CarrierPlugin.Stream, data: any){
        stream.write(data,(bytesSent)=>{
            console.log("stream write success");
        },(err)=>{
            console.log("stream write error");
        });
    }
    
    private streamCallback: CarrierPlugin.StreamCallbacks = {
         onStateChanged: this.onStateChangedCallback,
         onStreamData: this.onStreamDataCallback,
    }

    onStateChangedCallback(event){
        this.events.publish("session:onStateChangedCallback", event.state);
        console.log("onStateChangedCallback state = "+event.state);
    }

    onStreamDataCallback(event){
        this.events.publish("session:onStreamDataCallback", event.data);
        console.log("onStreamDataCallback data = "+event.data);
    }
    

    onSessionRequestCompleteCallback(event){
        this.events.publish("session:onSessionRequestCompleteCallback", event.status, event.reason, event.sdp);

        console.log("onSessionRequestCompleteCallback status = "+event.status);
        console.log("onSessionRequestCompleteCallback reason = "+event.reason);
        console.log("onSessionRequestCompleteCallback sdp = "+event.sdp);
    }


  

  
}
