import { Injectable } from '@angular/core';
import { Events } from 'src/app/services/events.service';
import { TransportService } from 'src/app/services/TransportService';
let eventBus = null;

@Injectable()
export class JWTMessageService {
  constructor(
    private transportService: TransportService,
    private events: Events,
  ) {
    eventBus = events;

    this.events.subscribe(
      FeedsEvent.PublishType.transportReceiveJWTMessage,
      event => {
        eventBus.publish(
          FeedsEvent.PublishType.jwtReceiveJWTMessage,
          this.parseJWT(event.message),
        );
      },
    );
  }

  request(
    nodeId: string,
    properties: any,
    onSuccess: () => void,
    onError?: (err: string) => void,
  ) {
    this.createJWT(properties, token => {
      this.transportService.sendStrMessage(nodeId, token, onSuccess, onError);
    });
  }

  parseJWT(msg: string): any {
    //TODO
    return msg;
  }

  createJWT(properties: any, onSuccess: (token: string) => void) {
    //TODO
  }
}
