import { Injectable } from '@angular/core';
import { ActionSheetController} from '@ionic/angular';
import { TranslateService} from '@ngx-translate/core';
import { FeedService } from './FeedService';
import { NativeService } from './NativeService';
import { PopupProvider } from 'src/app/services/popup';
declare let appManager: AppManagerPlugin.AppManager;

@Injectable()

export class MenuService {
    public nodeId:string ="";
    public channelId:number =0;
    public postId:number =0;

    public postDetail:any = null;
    public popover:any = null;
    constructor(
        private feedService: FeedService,
        private actionSheetController: ActionSheetController,
        private translate: TranslateService,
        private native: NativeService,
        public popupProvider:PopupProvider
    ) {
    }

    async showChannelMenu(nodeId: string, channelId: number, channelName: string,postId:number){
        this.postDetail = await this.actionSheetController.create({
            cssClass: 'editPost',
            buttons: [
            {
                text: this.translate.instant("common.share"),
                icon: 'share',
                handler: () => {
                    let post = this.feedService.getPostFromId(nodeId,channelId,postId) || null;
                    let postContent = ""
                    if(post!=null){
                       postContent = this.feedService.parsePostContentText(post.content);
                    }
                    appManager.sendIntent("share", {
                        title:"",
                        url: postContent
                      }, {}, () => {
                        this.postDetail.dismiss();
                    });
                }
            },{
                text: this.translate.instant("common.unsubscribe"),
                role: 'destructive',
                icon: 'person-remove',
                handler: () => {
                    if(this.feedService.getConnectionStatus() != 0){
                        this.native.toastWarn('common.connectionError');
                        return;
                    }

                    this.feedService.unsubscribeChannel(nodeId,channelId);
                }
            },{
                text: this.translate.instant("common.cancel"),
                role: 'cancel',
                icon: 'close-circle',
                handler: () => {
                    if(this.postDetail !=null){
                       this.postDetail.dismiss();
                    }
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

    async showShareMenu(nodeId?: string, channelId?: number, channelName?: string, postId?:number) {
        this.postDetail = await this.actionSheetController.create({
            cssClass: 'editPost',
            buttons: [
            {
                text: this.translate.instant("common.share"),
                icon: 'share',
                handler: () => {
                    let post = this.feedService.getPostFromId(nodeId,channelId,postId) || null;
                    let postContent = ""
                    if(post!=null){
                       postContent = this.feedService.parsePostContentText(post.content);
                    }
                    appManager.sendIntent("share", {
                        title:"",
                        url: postContent
                      }, {}, () => {
                        this.postDetail.dismiss();
                    });
                }
            },
            {
                text: this.translate.instant("common.cancel"),
                role: 'cancel',
                icon: 'close-circle',
                handler: () => {
                    if(this.postDetail !=null){
                       this.postDetail.dismiss();
                    }
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

    async showQRShareMenu(title: string, qrCodeString: string) {
        this.postDetail = await this.actionSheetController.create({
            cssClass: 'editPost',
            buttons: [
                {
                    text: this.translate.instant("common.share"),
                    icon: 'share',
                    handler: () => {
                        appManager.sendIntent("share", {
                            title:title,
                            url: qrCodeString
                          }, {}, () => {
                            this.postDetail.dismiss();
                        });
                    }
                },
                {
                    text: this.translate.instant("common.cancel"),
                    role: 'cancel',
                    icon: 'close-circle',
                    handler: () => {
                        if(this.postDetail !=null){
                           this.postDetail.dismiss();
                        }
                    }
                }
            ]
        });

        this.postDetail.onWillDismiss().then(()=>{
            if(this.postDetail) {
                this.postDetail = null;
            }
        })
        await this.postDetail.present();
    }

    async showUnsubscribeMenu(nodeId: string, channelId: number, channelName: string){
        this.postDetail  = await this.actionSheetController.create({
            cssClass: 'editPost',
            buttons: [{
              text: this.translate.instant("common.unsubscribe")+' @'+channelName,
              role: 'destructive',
              icon: 'person-remove',
              handler: () => {
                this.feedService.unsubscribeChannel(nodeId, channelId);
              }
            },
            {
                text: this.translate.instant("common.cancel"),
                role: 'cancel',
                icon: 'close-circle',
                handler: () => {
                    if(this.postDetail !=null){
                       this.postDetail.dismiss();
                    }
                }
            }
        ]
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
              icon: 'person-remove',
              handler: () => {
                this.feedService.unsubscribeChannel(nodeId, channelId);
              }
            },
            {
                text: this.translate.instant("common.cancel"),
                role: 'cancel',
                icon: 'close-circle',
                handler: () => {
                    if(this.postDetail !=null){
                       this.postDetail.dismiss();
                    }
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
        if(this.postDetail!=null){
          this.postDetail.dismiss();
        }
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
                    icon: 'create',
                    handler: () => {
                       this.handlePostDetailMenun(nodeId,channelId,channelName,postId,"editPost");
                    }
            },
            {
                text: this.translate.instant("common.removepost"),
                role: 'destructive',
                icon: 'trash',
                handler: () => {
                    this.handlePostDetailMenun(nodeId,channelId,channelName,postId,"removePost");
                }
            },
            {
                text: this.translate.instant("common.cancel"),
                role: 'cancel',
                icon: 'close-circle',
                handler: () => {
                    if(this.postDetail !=null){
                       this.postDetail.dismiss();
                    }
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
                   icon: 'create',
                   handler: () => {
                      this.handlePostDetailMenun(nodeId,channelId,channelName,postId,"editPost");
                   }
           },
           {
               text: this.translate.instant("common.removepost"),
               role: 'destructive',
               icon: 'trash',
               handler: () => {
                   this.handlePostDetailMenun(nodeId,channelId,channelName,postId,"removePost");
               }
           },
           {
            text: this.translate.instant("common.unsubscribe"),
            role: 'destructive',
            icon: 'person-remove',
            handler: () => {
                if(this.feedService.getConnectionStatus() != 0){
                    this.native.toastWarn('common.connectionError');
                    return;
                }

                this.feedService.unsubscribeChannel(nodeId,channelId);
            }
        },{
            text: this.translate.instant("common.cancel"),
            role: 'cancel',
            icon: 'close-circle',
            handler: () => {
                if(this.postDetail !=null){
                   this.postDetail.dismiss();
                }
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
        this.nodeId =nodeId;
        this.channelId=channelId;
        this.postId = postId;
        let server = this.feedService.getServerbyNodeId(nodeId);

        switch(clickName){
            case "editPost":
                if (!this.feedService.checkBindingServerVersion(()=>{
                    this.feedService.hideAlertPopover();
                })) return;

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
                let post = this.feedService.getPostFromId(nodeId,channelId,postId) || null;
                let postContent = ""
                if(post!=null){
                   postContent = this.feedService.parsePostContentText(post.content);
                }
                appManager.sendIntent("share", {
                    title:"",
                    url: postContent
                  }, {}, () => {
                    this.postDetail.dismiss();
                });
                break;
            case "removePost":
                if (!this.feedService.checkBindingServerVersion(()=>{
                    this.feedService.hideAlertPopover();
                })) return;

                this.popover = this.popupProvider.ionicConfirm(this,"","common.confirmdeletion",this.cancel,this.confirm,'tskth.svg');
                break;
        }
    }

    cancel(that:any){
        if(this.popover!=null){
            this.popover.dismiss();
         }
    }

    confirm(that:any){
        if(this.popover!=null){
            this.popover.dismiss();
        }
        that.native.showLoading("common.waitMoment",50000).then(()=>{
            that.feedService.deletePost(that.nodeId, Number(that.channelId), Number(that.postId));
        }).catch(()=>{
            that.native.hideLoading();
       });
    }

   async showPictureMenu(that:any,openCamera:any,openGallery:any){
        this.postDetail = await this.actionSheetController.create({
            cssClass: 'editPost',
            buttons: [
            {
                text:this.translate.instant("common.takePicture"),
                icon: 'camera',
                handler:()=>{
                    openCamera(that)
                },
            },
            {
                text:this.translate.instant("common.photolibary"),
                icon: 'images',
                handler:()=>{
                openGallery(that)
                },
            },
            {
                text: this.translate.instant("common.cancel"),
                role: 'cancel',
                icon: 'close-circle',
                handler: () => {
                    if(this.postDetail !=null){
                       this.postDetail.dismiss();
                    }
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

        return this.postDetail;
    }

  async showCommentDetailMenu(comment:any){

        let nodeId = comment["nodeId"];
        let feedId = comment["channel_id"];
        let postId = comment["post_id"];
        let commentById = comment["comment_id"]
        let commentId = comment["id"];
        let content = comment["content"];
        this.postDetail = await this.actionSheetController.create({
            cssClass: 'editPost',
            buttons: [
            {
                    text: this.translate.instant("common.editcomment"),
                    icon: 'create',
                    handler: () => {
                       //this.handlePostDetailMenun(nodeId,channelId,channelName,postId,"editPost");
                       this.native.go("editcomment",{
                        nodeId:nodeId,
                        channelId:feedId,
                        postId:postId,
                        commentById:commentById,
                        commentId:commentId,
                        content:content,
                        titleKey:'common.editcomment',

                      });
                    }
            },
            {
                text: this.translate.instant("common.removecomment"),
                role: 'destructive',
                icon: 'trash',
                handler: () => {
                    this.native.showLoading("common.waitMoment",50000).then(()=>{
                        this.feedService.deleteComment(nodeId,Number(feedId),Number(postId),Number(commentId));
                      }).catch(()=>{

                      })
                }
            },
            {
                text: this.translate.instant("common.cancel"),
                role: 'cancel',
                icon: 'close-circle',
                handler: () => {
                    if(this.postDetail !=null){
                       this.postDetail.dismiss();
                    }
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
}
