import { Injectable } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { TranslateService} from '@ngx-translate/core';
import { FeedService } from './FeedService';
import { NativeService } from './NativeService';


@Injectable()
export class MenuService {
    constructor(
        private feedService: FeedService,
        private actionSheetController: ActionSheetController,
        private translate: TranslateService,
        private native: NativeService
    ) {
    }

    async showChannelMenu(nodeId: string, channelId: number, channelName: string){
        const actionSheet = await this.actionSheetController.create({
            buttons: [
            {
                text: this.translate.instant("common.share"),
                icon: 'share',
                handler: () => {
                    this.native.toast("common.comingSoon");
                }
            }, {
                text: this.translate.instant("common.unsubscribe"),
                role: 'destructive',
                icon: 'trash',
                handler: () => {
                    if(this.feedService.getConnectionStatus() != 0){
                        this.native.toastWarn('common.connectionError');
                        return;
                    }
                    
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
        let actionSheet = await this.actionSheetController.create({
            buttons: [
            {
                text: this.translate.instant("common.share"),
                icon: 'share',
                handler: () => {
                    this.native.toast("common.comingSoon");
                }
            },
            {
                text: this.translate.instant("common.cancel"),
                icon: 'close',
                role: 'cancel',
                handler: () => {
                }
            }
        ]
        });

        actionSheet.onWillDismiss().then(()=>{
            if(actionSheet!=null){
                actionSheet = null;
            }
           
        })
        await actionSheet.present();
    }

    async showUnsubscribeMenu(nodeId: string, channelId: number, channelName: string){
        const actionSheet = await this.actionSheetController.create({
            buttons: [{
              text: this.translate.instant("common.unsubscribe")+' @'+channelName,
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

    async showUnsubscribeMenuWithoutName(nodeId: string, channelId: number){
        const actionSheet = await this.actionSheetController.create({
            buttons: [{
              text: this.translate.instant("common.unsubscribe"),
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

    hideActionSheet(){
        this.actionSheetController.dismiss();
    }

    async showPostDetailMenu(nodeId: string, channelId: number, channelName: string,postId:number){
        let actionSheet = await this.actionSheetController.create({
            cssClass: 'editPost',
            buttons: [
            {
                    text: this.translate.instant("common.editpost"),
                    icon: 'create',
                    handler: () => {
                       this.handlePostDetailMenun(nodeId,channelId,channelName,postId,"editPost");
                    }
            },
            {
                text: this.translate.instant("common.share"),
                icon: 'share',
                handler: () => {
                this.handlePostDetailMenun(nodeId,channelId,channelName,postId,"share");
                }
            },
            {
                text: this.translate.instant("common.removepost"),
                icon: 'trash',
                handler: () => {
                    this.handlePostDetailMenun(nodeId,channelId,channelName,postId,"removePost");
                }
            }
        ]
        });

        actionSheet.onWillDismiss().then(()=>{
            if(actionSheet!=null){
                actionSheet = null;
            }
           
        })
        await actionSheet.present();
    }

    handlePostDetailMenun(nodeId: string, channelId: number, channelName: string,postId:number,clickName:string){
            switch(clickName){
                case "editPost":
                    this.native.go(
                        "/editpost", 
                        { 
                          "nodeId":nodeId,
                          "channelId":channelId,
                          "postId":postId,
                          "channelName":channelName
                        }
                      );
                    break;
                case "share":
                    this.native.toast("common.comingSoon");
                    break;
                case "removePost":
                    this.native.toast("common.comingSoon");
                    break;    
            }
    }
}
