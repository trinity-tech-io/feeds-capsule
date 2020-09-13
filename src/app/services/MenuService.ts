import { Injectable } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { TranslateService} from '@ngx-translate/core';
import { FeedService } from './FeedService';
import { NativeService } from './NativeService';


@Injectable()
export class MenuService {
    public postDetail:any;
    constructor(
        private feedService: FeedService,
        private actionSheetController: ActionSheetController,
        private translate: TranslateService,
        private native: NativeService
    ) {
    }

    async showChannelMenu(nodeId: string, channelId: number, channelName: string){
        this.postDetail = await this.actionSheetController.create({
            cssClass: 'editPost',
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
            }]
        });

        this.postDetail.onWillDismiss().then(()=>{
            if(this.postDetail !=null){
                this.postDetail  = null;
            }
        });
        await this.postDetail.present();
    }

    async showShareMenu(nodeId: string, channelId: number, channelName: string,postId:number){
        this.postDetail = await this.actionSheetController.create({
            cssClass: 'editPost',
            buttons: [
            {
                text: this.translate.instant("common.share"),
                icon: 'share',
                handler: () => {
                    this.native.toast("common.comingSoon");
                }
            }
        ]
        });

       
        this.postDetail.onWillDismiss().then(()=>{
            if(this.postDetail !=null){
                this.postDetail  = null;
            }
           
        })
        await this.postDetail.present();
    }

    async showUnsubscribeMenu(nodeId: string, channelId: number, channelName: string){
        this.postDetail  = await this.actionSheetController.create({
            buttons: [{
              text: this.translate.instant("common.unsubscribe")+' @'+channelName,
              role: 'destructive',
              icon: 'trash',
              handler: () => {
                this.feedService.unsubscribeChannel(nodeId, channelId);
              }
            }]
          });
          
          this.postDetail.onWillDismiss().then(()=>{
            if(this.postDetail !=null){
                this.postDetail  = null;
            }
          });

        await this.postDetail.present();
    }

    async showUnsubscribeMenuWithoutName(nodeId: string, channelId: number){
        this.postDetail = await this.actionSheetController.create({
            cssClass: 'editPost',
            buttons: [{
              text: this.translate.instant("common.unsubscribe"),
              role: 'destructive',
              icon: 'trash',
              handler: () => {
                this.feedService.unsubscribeChannel(nodeId, channelId);
              }
            }]
          });

          this.postDetail.onWillDismiss().then(()=>{
            if(this.postDetail !=null){
                this.postDetail  = null;
            }
          });

        await this.postDetail.present();
    }

    hideActionSheet(){
        if(this.postDetail !=null)
        this.postDetail.dismiss();
    }

    async showPostDetailMenu(nodeId: string, channelId: number, channelName: string,postId:number){
         this.postDetail = await this.actionSheetController.create({
            cssClass: 'editPost',
            
            buttons: [
            {
                    text: this.translate.instant("common.sharepost"), 
                    icon: 'share',
                    handler: () => {
                    this.handlePostDetailMenun(nodeId,channelId,channelName,postId,"sharepost");
                    }
            },
            {
                    text: this.translate.instant("common.editpost"),
                    icon: 'edit',
                    handler: () => {
                       this.handlePostDetailMenun(nodeId,channelId,channelName,postId,"editPost");
                    }
            },
            {
                text: this.translate.instant("common.removepost"),
                icon: 'detle',
                handler: () => {
                    this.handlePostDetailMenun(nodeId,channelId,channelName,postId,"removePost");
                }
            }
        ]
        });

        this.postDetail.onWillDismiss().then(()=>{
            if(this.postDetail !=null){
                this.postDetail  = null;
            }
           
        })
        await this.postDetail.present();
    }


    async showHomeMenu(nodeId: string, channelId: number, channelName: string,postId:number){
        this.postDetail = await this.actionSheetController.create({
           cssClass: 'editPost',
           
           buttons: [
           {
                   text: this.translate.instant("common.sharepost"), 
                   icon: 'share',
                   handler: () => {
                   this.handlePostDetailMenun(nodeId,channelId,channelName,postId,"sharepost");
                   }
           },
           {
                   text: this.translate.instant("common.editpost"),
                   icon: 'edit',
                   handler: () => {
                      this.handlePostDetailMenun(nodeId,channelId,channelName,postId,"editPost");
                   }
           },
           {
               text: this.translate.instant("common.removepost"),
               icon: 'detle',
               handler: () => {
                   this.handlePostDetailMenun(nodeId,channelId,channelName,postId,"removePost");
               }
           },
           {
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
        }
       ]
       });

       this.postDetail.onWillDismiss().then(()=>{
           if(this.postDetail !=null){
               this.postDetail  = null;
           }
          
       })
       await this.postDetail.present();
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
                case "sharepost":
                    this.native.toast("common.comingSoon");
                    break;
                case "removePost":
                    this.native.showLoading("common.waitMoment",50000).then(()=>{
                        this.feedService.deletePost(nodeId, Number(channelId), Number(postId));
                    }).catch(()=>{
                        this.native.hideLoading();
                   });
                    break;    
            }
    }
}
