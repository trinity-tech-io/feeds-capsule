import { Injectable } from '@angular/core';
import { Events } from 'src/app/services/events.service';
import { CarrierService } from 'src/app/services/CarrierService';
import { FeedService } from 'src/app/services/FeedService';
let eventBus = null;

@Injectable()
export class TransportService {
  private signInServerList = [];
  constructor(private carrierService: CarrierService, private events: Events) {
    eventBus = events;

    this.events.subscribe(
      FeedsEvent.PublishType.signInServerListChanged,
      list => {
        this.signInServerList = list;
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.carrierFriendMessage,
      event => {
        console.log("FeedsEvent.PublishType.transportReceiveMessage + carrierFriendMessage");
        if (this.check(event.from))
          eventBus.publish(
            FeedsEvent.PublishType.transportReceiveMessage,
            event,
          );

        else
          eventBus.publish(
            FeedsEvent.PublishType.transportReceiveJWTMessage,
            event,
          );
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.carrierFriendBinaryMessage,
      event => {
        eventBus.publish(FeedsEvent.PublishType.transportReceiveMessage, event);
      },
    );
  }

  check(nodeId: string) {
    return this.signInServerList.indexOf(nodeId) != -1;
  }

  sendStrMessage(
    nodeId: string,
    msg: string,
    onSuccess: () => void,
    onError?: (err: string) => void,
  ) {
    this.carrierService.sendMessage(nodeId, msg, onSuccess, onError);
  }

  sendArrayMessage(
    nodeId: string,
    msg: any,
    onSuccess: () => void,
    onError?: (err: string) => void,
  ) {
    this.carrierService.sendBinaryMessage(nodeId, msg, onSuccess, onError);
  }
}
