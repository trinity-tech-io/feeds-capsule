import { Injectable } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { TranslateService} from '@ngx-translate/core';
import { FeedService } from './FeedService';
import { NativeService } from './NativeService';


@Injectable()
export class MenuService {
    constructor(
        private feedService: FeedService,
        private actionSheetController:ActionSheetController,
        private translate: TranslateService,
        private native: NativeService) {
    }

    async showChannelMenu(nodeId: string, channelId: number, channelName: string){
        const actionSheet = await this.actionSheetController.create({
            buttons: [
            {
                text: this.translate.instant("common.share"),
                icon: 'share',
                handler: () => {
                    this.native.toast("TODO");
                }
            }, {
                text: this.translate.instant("common.unsubscribe")+' @'+channelName+"?",
                role: 'destructive',
                icon: 'trash',
                handler: () => {
                    this.feedService.unsubscribeChannel(nodeId,channelId);
                }
            },{
                text: this.translate.instant("common.cancel"),
                icon: 'close',
                role: 'cancel',
                handler: () => {
                }
            }]
        });
        await actionSheet.present();
    }

    async showShareMenu(nodeId: string, channelId: number, channelName: string){
        const actionSheet = await this.actionSheetController.create({
            buttons: [
            {
                text: this.translate.instant("common.share"),
                icon: 'share',
                handler: () => {
                    this.native.toast("TODO");
                }
            },{
                text: this.translate.instant("common.cancel"),
                icon: 'close',
                role: 'cancel',
                handler: () => {
                }
            }]
        });
        await actionSheet.present();
    }

    async showUnsubscribeMenu(nodeId: string, channelId: number, channelName: string){
        const actionSheet = await this.actionSheetController.create({
            buttons: [{
              text: this.translate.instant("common.unsubscribe")+' @'+channelName+"?",
              role: 'destructive',
              icon: 'trash',
              handler: () => {
                this.feedService.unsubscribeChannel(nodeId, channelId);
              }
            },{
              text: this.translate.instant("common.cancel"),
              icon: 'close',
              role: 'cancel',
              handler: () => {
              }
            }]
          });
        await actionSheet.present();
    }
}
