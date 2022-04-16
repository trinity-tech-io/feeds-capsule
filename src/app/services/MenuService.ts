import { Injectable } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { FeedService, SignInData } from './FeedService';
import { NativeService } from './NativeService';
import { PopupProvider } from 'src/app/services/popup';
import { IntentService } from 'src/app/services/IntentService';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { Events } from 'src/app/services/events.service';
import { Config } from './config';
import { Logger } from './logger';
import { DataHelper } from 'src/app/services/DataHelper';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';
import { HiveVaultController } from './hivevault_controller.service';
import { result } from 'lodash';

@Injectable()
export class MenuService {
  public destDid: string = '';
  public channelId: string = "";
  public postId: string = "";
  public commentId: string = "";
  private refcommentId: string = '0';
  public saleOrderId: any = '';
  public assItem: any = {};

  public postDetail: any = null;
  public popover: any = null;
  public commentPostDetail: any = null;
  public replyDetail: any = null;
  public onSaleMenu: any = null;
  public buyMenu: any = null;
  public createdMenu: any = null;
  public shareOnSaleMenu: any = null;
  public saveImageMenu: any = null;
  public channelCollectionsMenu: any = null;
  public channelCollectionsPublishedMenu: any = null;
  private comment: FeedsData.CommentV3 = null;
  constructor(
    private feedService: FeedService,
    private actionSheetController: ActionSheetController,
    private translate: TranslateService,
    private native: NativeService,
    public popupProvider: PopupProvider,
    private intentService: IntentService,
    private viewHelper: ViewHelper,
    private nftContractControllerService: NFTContractControllerService,
    private events: Events,
    private dataHelper: DataHelper,
    private feedsServiceApi: FeedsServiceApi,
    private hiveVaultController: HiveVaultController
  ) { }

  async showChannelMenu(
    destDid: string,
    channelId: string,
    channelName: string,
    postId: string,
  ) {
    this.postDetail = await this.actionSheetController.create({
      cssClass: 'editPost',
      buttons: [
        {
          text: this.translate.instant('common.share'),
          icon: 'share',
          handler: async () => {
            let post: any = await this.dataHelper.getPostV3ById(this.destDid, this.postId) || null;
            let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(this.destDid, this.channelId) || null;
            let ownerDid = (await this.dataHelper.getSigninData()).did;
            let postContent = '';
            if (post != null) {
              postContent = post.content.content || "";
            }
            if (this.postDetail != null) {
              this.postDetail.dismiss();
              this.postDetail = null;
            }
            await this.native.showLoading("common.generateSharingLink");
            try {
              const sharedLink = await this.intentService.createShareLink(destDid, channelId, postId, ownerDid, channel);
              this.intentService
                .share(this.intentService.createSharePostTitle(destDid, channelId, postId, postContent), sharedLink);
            } catch (error) {
            }
            this.native.hideLoading();
          },
        },
        {
          text: this.translate.instant('common.unsubscribe'),
          role: 'destructive',
          icon: 'person-remove',
          handler: () => {
            let connect = this.dataHelper.getNetworkStatus();
            if (connect === FeedsData.ConnState.disconnected) {
              this.native.toastWarn('common.connectionError');
              return;
            }
            this.hiveVaultController.unSubscribeChannel(
              destDid, channelId
            ).then(async (result) => {
              let channel: FeedsData.SubscribedChannelV3 = {
                destDid: destDid,
                channelId: channelId
              };
              await this.native.showLoading("common.waitMoment");
              try {
                this.hiveVaultController.unSubscribeChannel(
                  destDid, channelId
                ).then(async (result) => {
                  let channel: FeedsData.SubscribedChannelV3 = {
                    destDid: destDid,
                    channelId: channelId
                  };
                  await this.hiveVaultController.removePostListByChannel(destDid, channelId);
                  this.events.publish(FeedsEvent.PublishType.unfollowFeedsFinish, channel);
                  this.native.hideLoading();
                }).catch(() => {
                  this.native.hideLoading();
                });
              } catch (error) {
                this.native.hideLoading();
              }
            }).catch(() => {

            });
          },
        },
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          icon: 'close-circle',
          handler: () => {
            if (this.postDetail != null) {
              this.postDetail.dismiss();
            }
          },
        },
      ],
    });

    this.postDetail.onWillDismiss().then(() => {
      if (this.postDetail != null) {
        this.postDetail = null;
      }
    });
    await this.postDetail.present();
  }

  async showShareMenu(
    nodeId?: string,
    channelId?: string,
    channelName?: string,
    postId?: string,
  ) {
    this.postDetail = await this.actionSheetController.create({
      cssClass: 'editPost',
      buttons: [
        {
          text: this.translate.instant('common.share'),
          icon: 'share',
          handler: async () => {
            let post: any = await this.dataHelper.getPostV3ById(this.destDid, this.postId) || null;
            let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(this.destDid, this.channelId) || null;
            let ownerDid = (await this.dataHelper.getSigninData()).did;
            let postContent = '';
            if (post != null) {
              postContent = post.content.content || "";
            }
            if (this.postDetail != null) {
              this.postDetail.dismiss();
              this.postDetail = null;
            }
            //Share post
            await this.native.showLoading("common.generateSharingLink");
            try {
              const sharedLink = await this.intentService.createShareLink(nodeId, channelId, postId, ownerDid, channel);
              this.intentService
                .share(this.intentService.createSharePostTitle(nodeId, channelId, postId, postContent), sharedLink);
            } catch (error) {
            }
            this.native.hideLoading();
          },
        },
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          icon: 'close-circle',
          handler: () => {
            if (this.postDetail != null) {
              this.postDetail.dismiss();
            }
          },
        },
      ],
    });

    this.postDetail.onWillDismiss().then(() => {
      if (this.postDetail != null) {
        this.postDetail = null;
      }
    });
    await this.postDetail.present();
  }

  async showQRShareMenu(title: string, qrCodeString: string) {
    this.postDetail = await this.actionSheetController.create({
      cssClass: 'editPost',
      buttons: [
        {
          text: this.translate.instant('common.share'),
          icon: 'share',
          handler: () => {
            this.intentService
              .share(title, qrCodeString)
              .then(() => this.postDetail.dismiss());
          },
        },
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          icon: 'close-circle',
          handler: () => {
            if (this.postDetail != null) {
              this.postDetail.dismiss();
            }
          },
        },
      ],
    });

    this.postDetail.onWillDismiss().then(() => {
      if (this.postDetail) {
        this.postDetail = null;
      }
    });
    await this.postDetail.present();
  }

  async showUnsubscribeMenu(
    destDid: string,
    channelId: string,
    channelName: string,
  ) {
    this.postDetail = await this.actionSheetController.create({
      cssClass: 'editPost',
      buttons: [
        {
          text:
            this.translate.instant('common.unsubscribe') + ' @' + channelName,
          role: 'destructive',
          icon: 'person-remove',
          handler: async () => {
            await this.native.showLoading("common.waitMoment");
            this.hiveVaultController.unSubscribeChannel(
              destDid, channelId
            ).then(async (result) => {
              let channel: FeedsData.SubscribedChannelV3 = {
                destDid: destDid,
                channelId: channelId
              };

              await this.hiveVaultController.removePostListByChannel(destDid, channelId);
              this.events.publish(FeedsEvent.PublishType.unsubscribeFinish, channel);
              this.native.hideLoading();
            }).catch(() => {
              this.native.hideLoading();
            });
          },
        },
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          icon: 'close-circle',
          handler: () => {
            if (this.postDetail != null) {
              this.postDetail.dismiss();
            }
          },
        },
      ],
    });

    this.postDetail.onWillDismiss().then(() => {
      if (this.postDetail != null) {
        this.postDetail = null;
      }
    });

    await this.postDetail.present();
  }

  async showUnsubscribeMenuWithoutName(destDid: string, channelId: string) {
    this.postDetail = await this.actionSheetController.create({
      cssClass: 'editPost',
      buttons: [
        {
          text: this.translate.instant('common.unsubscribe'),
          role: 'destructive',
          icon: 'person-remove',
          handler: async () => {
            await this.native.showLoading("common.waitMoment");
            try {
              this.hiveVaultController.unSubscribeChannel(
                destDid, channelId
              ).then(async (result) => {
                let channel: FeedsData.SubscribedChannelV3 = {
                  destDid: destDid,
                  channelId: channelId
                };

                await this.hiveVaultController.removePostListByChannel(destDid, channelId);
                this.events.publish(FeedsEvent.PublishType.unsubscribeFinish, channel);
                this.native.hideLoading();
              }).catch(() => {
                this.native.hideLoading();
              });
            } catch (error) {
              this.native.hideLoading();
            }
          },
        },
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          icon: 'close-circle',
          handler: () => {
            if (this.postDetail != null) {
              this.postDetail.dismiss();
            }
          },
        },
      ],
    });

    this.postDetail.onWillDismiss().then(() => {
      if (this.postDetail != null) {
        this.postDetail = null;
      }
    });

    await this.postDetail.present();
  }

  hideActionSheet() {
    if (this.postDetail != null) {
      this.postDetail.dismiss();
    }
  }

  hideCommetActionSheet() {
    if (this.commentPostDetail != null) {
      this.commentPostDetail.dismiss();
    }
  }

  hideReplyActionSheet() {
    if (this.replyDetail != null) {
      this.replyDetail.dismiss();
    }
  }

  async showPostDetailMenu(
    nodeId: string,
    channelId: string,
    channelName: string,
    postId: string,
  ) {
    this.postDetail = await this.actionSheetController.create({
      cssClass: 'editPost',
      buttons: [
        {
          text: this.translate.instant('common.sharepost'),
          icon: 'share',
          handler: async () => {
            await this.handlePostDetailMenun(
              nodeId,
              channelId,
              channelName,
              postId,
              'sharepost',
            );
          },
        },
        {
          text: this.translate.instant('common.editpost'),
          icon: 'create',
          handler: () => {
            this.handlePostDetailMenun(
              nodeId,
              channelId,
              channelName,
              postId,
              'editPost',
            );
          },
        },
        {
          text: this.translate.instant('common.removepost'),
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.handlePostDetailMenun(
              nodeId,
              channelId,
              channelName,
              postId,
              'removePost',
            );
          },
        },
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          icon: 'close-circle',
          handler: () => {
            if (this.postDetail != null) {
              this.postDetail.dismiss();
            }
          },
        },
      ],
    });

    this.postDetail.onWillDismiss().then(() => {
      if (this.postDetail != null) {
        this.postDetail = null;
      }
    });
    await this.postDetail.present();
  }

  async showHomeMenu(
    destDid: string,
    channelId: string,
    channelName: string,
    postId: string,
  ) {
    this.postDetail = await this.actionSheetController.create({
      cssClass: 'editPost',

      buttons: [
        {
          text: this.translate.instant('common.sharepost'),
          icon: 'share',
          handler: () => {
            this.handlePostDetailMenun(
              destDid,
              channelId,
              channelName,
              postId,
              'sharepost',
            );
          },
        },
        {
          text: this.translate.instant('common.editpost'),
          icon: 'create',
          handler: () => {
            this.handlePostDetailMenun(
              destDid,
              channelId,
              channelName,
              postId,
              'editPost',
            );
          },
        },
        {
          text: this.translate.instant('common.removepost'),
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.handlePostDetailMenun(
              destDid,
              channelId,
              channelName,
              postId,
              'removePost',
            );
          },
        },
        {
          text: this.translate.instant('common.unsubscribe'),
          role: 'destructive',
          icon: 'person-remove',
          handler: async () => {
            let connect = this.dataHelper.getNetworkStatus();
            if (connect === FeedsData.ConnState.disconnected) {
              this.native.toastWarn('common.connectionError');
              return;
            }
            await this.native.showLoading("common.waitMoment");
            try {
              this.hiveVaultController.unSubscribeChannel(
                destDid, channelId
              ).then(async (result) => {
                let channel: FeedsData.SubscribedChannelV3 = {
                  destDid: destDid,
                  channelId: channelId
                };
                await this.hiveVaultController.removePostListByChannel(destDid,channelId);
                this.events.publish(FeedsEvent.PublishType.unfollowFeedsFinish, channel);
                this.native.hideLoading();
              }).catch(() => {
                this.native.hideLoading();
              });
            } catch (error) {
              this.native.hideLoading();
            }

          },
        },
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          icon: 'close-circle',
          handler: () => {
            if (this.postDetail != null) {
              this.postDetail.dismiss();
            }
          },
        },
      ],
    });

    this.postDetail.onWillDismiss().then(() => {
      if (this.postDetail != null) {
        this.postDetail = null;
      }
    });
    await this.postDetail.present();
  }

  async handlePostDetailMenun(
    destDid: string,
    channelId: string,
    channelName: string,
    postId: string,
    clickName: string,
  ) {
    this.destDid = destDid;
    this.channelId = channelId;
    this.postId = postId;

    switch (clickName) {
      case 'editPost':
        this.native.go('/editpost', {
          destDid: destDid,
          channelId: channelId,
          postId: postId,
          channelName: channelName,
        });
        break;
      case 'sharepost':

        let post: any = await this.dataHelper.getPostV3ById(this.destDid, this.postId) || null;
        let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(this.destDid, this.channelId) || null;
        let ownerDid = (await this.dataHelper.getSigninData()).did;
        let postContent = '';
        if (post != null) {
          postContent = post.content.content || "";
        }

        //home share post
        if (this.postDetail != null) {
          this.postDetail.dismiss();
          this.postDetail = null;
        }
        await this.native.showLoading("common.generateSharingLink");
        try {
          const sharedLink = await this.intentService.createShareLink(destDid, channelId, postId, ownerDid, channel);
          this.intentService
            .share(this.intentService.createSharePostTitle(destDid, channelId, postId, postContent), sharedLink);
        } catch (error) {
        }
        this.native.hideLoading();

        break;
      case 'removePost':
        // if (
        //   !this.feedService.checkBindingServerVersion(() => {
        //     this.feedService.hideAlertPopover();
        //   })
        // )
        //   return;

        this.popover = this.popupProvider.ionicConfirm(
          this,
          'common.deletePost',
          'common.confirmdeletion',
          this.cancel,
          this.confirm,
          './assets/images/shanchu.svg',
        );
        break;
    }
  }

  cancel(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  async confirm(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
    that.events.publish(FeedsEvent.PublishType.deletePostFinish, { 'destDid': that.destDid, 'channelId': that.channelId, 'postId': that.postId });
  }

  async showPictureMenu(
    that: any,
    openCamera: any,
    openGallery: any,
    openNft: any,
  ) {
    this.postDetail = await this.actionSheetController.create({
      cssClass: 'editPost',
      buttons: [
        {
          text: this.translate.instant('common.takePicture'),
          icon: 'camera',
          handler: () => {
            openCamera(that);
          },
        },
        {
          text: this.translate.instant('common.photolibary'),
          icon: 'images',
          handler: () => {
            openGallery(that);
          },
        },
        {
          text: this.translate.instant('common.collectibles'),
          icon: 'list-circle',
          handler: () => {
            let accountAddress =
              this.nftContractControllerService.getAccountAddress() || '';
            if (accountAddress === '') {
              this.native.toastWarn('common.connectWallet');
              return false;
            }
            openNft(that);
          },
        },
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          icon: 'close-circle',
          handler: () => {
            if (this.postDetail != null) {
              this.postDetail.dismiss();
            }
          },
        },
      ],
    });

    this.postDetail.onWillDismiss().then(() => {
      if (this.postDetail != null) {
        this.postDetail = null;
      }
    });
    await this.postDetail.present();

    return this.postDetail;
  }

  async showCommentDetailMenu(comment: FeedsData.CommentV3) {
    this.comment = comment;
    this.destDid = comment['destDid'];
    this.channelId = comment['channelId'];
    this.postId = comment['postId'];
    this.commentId = comment['commentId'];
    this.refcommentId = comment['refcommentId'];
    let destDid = comment['destDid'];
    let channelId = comment['channelId'];
    let postId = comment['postId'];
    let refcommentId = comment['refcommentId'] || '0';
    let commentId = comment['commentId'];
    let content = comment['content'];

    this.commentPostDetail = await this.actionSheetController.create({
      cssClass: 'editPost',
      buttons: [
        {
          text: this.translate.instant('common.editcomment'),
          icon: 'create',
          handler: () => {
            this.native.go('editcomment', {
              destDid: destDid,
              channelId: channelId,
              postId: postId,
              refcommentId: refcommentId,
              commentId: commentId,
              content: content,
              titleKey: 'common.editcomment',
            });
          },
        },
        {
          text: this.translate.instant('common.removecomment'),
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.popover = this.popupProvider.ionicConfirm(
              this,
              'common.deleteComment',
              'common.confirmdeletion1',
              this.cancel1,
              this.confirm1,
              './assets/images/shanchu.svg',
            );
          },
        },
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          icon: 'close-circle',
          handler: () => {
            if (this.commentPostDetail != null) {
              this.commentPostDetail.dismiss();
            }
          },
        },
      ],
    });

    this.commentPostDetail.onWillDismiss().then(() => {
      if (this.commentPostDetail != null) {
        this.commentPostDetail = null;
      }
    });
    await this.commentPostDetail.present();
  }

  cancel1() {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  confirm1(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }

      that.events.publish(FeedsEvent.PublishType.deleteCommentFinish,
        that.comment
       );

  }

  async showReplyDetailMenu(reply: FeedsData.CommentV3) {
    this.comment = reply;
    this.destDid = reply['destDid'];
    this.channelId = reply['channelId'];
    this.postId = reply['postId'];
    this.commentId = reply['commentId'];
    let destDid = reply['destDid'];
    let channelId = reply['channelId'];
    let postId = reply['postId'];
    let refcommentId = reply['refcommentId'] || '0';
    let commentId = reply['commentId'];
    let content = reply['content'];
    this.replyDetail = await this.actionSheetController.create({
      cssClass: 'editPost',
      buttons: [
        {
          text: this.translate.instant('CommentlistPage.editreply'),
          icon: 'create',
          handler: () => {
            this.native.go('editcomment', {
              destDid: destDid,
              channelId: channelId,
              postId: postId,
              refcommentId: refcommentId,
              commentId: commentId,
              content: content,
              titleKey: 'CommentlistPage.editreply',
            });
          },
        },
        {
          text: this.translate.instant('CommentlistPage.deletereply'),
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.popover = this.popupProvider.ionicConfirm(
              this,
              'common.deleteReply',
              'common.confirmdeletion2',
              this.cancel1,
              this.confirm1,
              './assets/images/shanchu.svg',
            );
          },
        },
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          icon: 'close-circle',
          handler: () => {
            if (this.replyDetail != null) {
              this.replyDetail.dismiss();
            }
          },
        },
      ],
    });

    this.replyDetail.onWillDismiss().then(() => {
      if (this.replyDetail != null) {
        this.replyDetail = null;
      }
    });
    await this.replyDetail.present();
  }

  async showOnSaleMenu(assItem: any) {
    this.assItem = assItem || '';
    this.onSaleMenu = await this.actionSheetController.create({
      cssClass: 'editPost',
      buttons: [
        {
          text: this.translate.instant('common.share'),
          icon: 'share',
          handler: async () => {
            this.sharePasarLink(assItem);
          },
        },
        {
          text: this.translate.instant('BidPage.changePrice'),
          icon: 'create',
          handler: () => {
            this.viewHelper.showNftPrompt(
              assItem,
              'BidPage.changePrice',
              'sale',
            );
          },
        },
        {
          text: this.translate.instant('BidPage.cancelOrder'),
          role: 'destructive',
          icon: 'arrow-redo-circle',
          handler: () => {
            this.popover = this.popupProvider.ionicConfirm(
              this,
              'BidPage.cancelOrder',
              'BidPage.cancelOrder',
              this.cancelOnSaleMenu,
              this.confirmOnSaleMenu,
              './assets/images/shanchu.svg',
            );
          },
        },
        {
          text: this.translate.instant('CollectionsPage.details'),
          icon: 'information-circle',
          handler: () => {
            this.dataHelper.setAssetPageAssetItem(assItem);
            this.native.navigateForward(['assetdetails'], {});
          },
        },
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          icon: 'close-circle',
          handler: () => {
            if (this.onSaleMenu != null) {
              this.onSaleMenu.dismiss();
            }
          },
        },
      ],
    });

    this.onSaleMenu.onWillDismiss().then(() => {
      if (this.onSaleMenu != null) {
        this.onSaleMenu = null;
      }
    });
    await this.onSaleMenu.present();
  }

  cancelOnSaleMenu() {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  cancelChannelCollectionMenu() {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  async confirmChannelCollectionMenu(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
    that.events.publish(FeedsEvent.PublishType.startLoading, { des: "common.cancelingOrderDesc", title: "common.waitMoment", curNum: "1", maxNum: "1", type: "changePrice" });
    let sId = setTimeout(() => {
      that.nftContractControllerService.getGalleria().cancelRemovePanelProcess();
      this.events.publish(FeedsEvent.PublishType.endLoading);
      clearTimeout(sId);
      that.popupProvider.showSelfCheckDialog('common.cancelOrderTimeoutDesc');
    }, Config.WAIT_TIME_CANCEL_ORDER)

    that.doCancelChannelOrder(that)
      .then(() => {
        that.nftContractControllerService.getGalleria().cancelRemovePanelProcess();;
        that.events.publish(FeedsEvent.PublishType.endLoading);
        clearTimeout(sId);
        that.native.toast_trans('common.cancelSuccessfully');
      })
      .catch(() => {
        // cancel order error
        that.events.publish(FeedsEvent.PublishType.endLoading);
        clearTimeout(sId);
        that.native.toast_trans('common.cancellationFailed');
        that.nftContractControllerService.getPasar().cancelCancelOrderProcess();
      });
  }

  async confirmOnSaleMenu(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
    that.events.publish(FeedsEvent.PublishType.startLoading, { des: "common.cancelingOrderDesc", title: "common.waitMoment", curNum: "1", maxNum: "1", type: "changePrice" });
    let sId = setTimeout(() => {
      that.nftContractControllerService.getPasar().cancelCancelOrderProcess();
      this.events.publish(FeedsEvent.PublishType.endLoading);
      clearTimeout(sId);
      that.popupProvider.showSelfCheckDialog('common.cancelOrderTimeoutDesc');
    }, Config.WAIT_TIME_CANCEL_ORDER)

    that.doCancelOrder(that)
      .then(() => {
        that.nftContractControllerService.getPasar().cancelCancelOrderProcess();
        that.events.publish(FeedsEvent.PublishType.endLoading);
        clearTimeout(sId);
        that.native.toast_trans('common.cancelSuccessfully');
      })
      .catch(() => {
        // cancel order error
        that.events.publish(FeedsEvent.PublishType.endLoading);
        clearTimeout(sId);
        that.native.toast_trans('common.cancellationFailed');
        that.nftContractControllerService.getPasar().cancelCancelOrderProcess();
      });
  }

  async cancelOrder(that: any, saleOrderId: string) {
    return await that.nftContractControllerService
      .getPasar()
      .cancelOrder(saleOrderId);
  }

  async doCancelOrder(that: any): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let saleOrderId = this.assItem['saleOrderId'] || '';
      if (saleOrderId === '') {
        reject('error');
        return;
      }
      let cancelStatus = await that.cancelOrder(that, saleOrderId);
      this.dataHelper.deletePasarItem(saleOrderId);

      if (!cancelStatus) {
        reject('error');
        return;
      }

      that.events.publish(FeedsEvent.PublishType.nftCancelOrder, this.assItem);
      resolve('Success');
    });

  }


  async cancelChannelOrder(that: any, panelId: string) {
    return await that.nftContractControllerService.getGalleria().removePanel(panelId);
  }

  async doCancelChannelOrder(that: any): Promise<string> {
    return new Promise(async (resolve, reject) => {

      let panelId = this.assItem['panelId'] || '';
      if (panelId === '') {
        reject('error');
        return;
      }
      try {
        let cancelStatus = await that.cancelChannelOrder(that, panelId) || null;
        if (cancelStatus === null) {
          reject('error');
          return;
        }
        that.events.publish(FeedsEvent.PublishType.nftCancelChannelOrder, this.assItem);
        resolve('Success');
      } catch (error) {
        reject('error');
      }
    });

  }


  async showBuyMenu(assItem: any) {
    this.buyMenu = await this.actionSheetController.create({
      cssClass: 'editPost',
      buttons: [
        {
          text: this.translate.instant('CollectionsPage.onSale'),
          icon: 'create',
          handler: () => {
            this.viewHelper.showNftPrompt(
              assItem,
              'CollectionsPage.putOnSale',
              'buy',
            );
          },
        },
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          icon: 'close-circle',
          handler: () => {
            if (this.buyMenu != null) {
              this.buyMenu.dismiss();
            }
          },
        },
      ],
    });

    this.buyMenu.onWillDismiss().then(() => {
      if (this.buyMenu != null) {
        this.buyMenu = null;
      }
    });
    await this.buyMenu.present();
  }

  async showCreatedMenu(assItem: any) {
    this.createdMenu = await this.actionSheetController.create({
      cssClass: 'editPost',
      buttons: [
        {
          text: this.translate.instant('CollectionsPage.onSale'),
          icon: 'create',
          handler: () => {
            this.viewHelper.showNftPrompt(
              assItem,
              'CollectionsPage.putOnSale',
              'created',
            );
          },
        },
        {
          text: this.translate.instant('common.transferCollectible'),
          icon: 'swap-horizontal',
          handler: () => {
            this.viewHelper.showTransferPrompt(
              assItem,
              'common.transferCollectible'
            );
          },
        },
        {
          text: this.translate.instant('CollectionsPage.details'),
          icon: 'information-circle',
          handler: () => {
            this.dataHelper.setAssetPageAssetItem(assItem);
            this.native.navigateForward(['assetdetails'], {});
          },
        },
        {
          text: this.translate.instant('common.burnNFTs'),
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.viewHelper.showNftPrompt(
              assItem,
              'common.burnNFTs',
              'burn',
            );
          },
        },
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          icon: 'close-circle',
          handler: () => {
            if (this.createdMenu != null) {
              this.createdMenu.dismiss();
            }
          },
        },
      ],
    });

    this.createdMenu.onWillDismiss().then(() => {
      if (this.createdMenu != null) {
        this.createdMenu = null;
      }
    });
    await this.createdMenu.present();
  }

  async showShareOnSaleMenu(assItem: any) {
    this.shareOnSaleMenu = await this.actionSheetController.create({
      cssClass: 'editPost',
      buttons: [
        {
          text: this.translate.instant('common.share'),
          icon: 'share',
          handler: async () => {
            this.sharePasarLink(assItem);
          },
        },
        {
          text: this.translate.instant('CollectionsPage.details'),
          icon: 'information-circle',
          handler: () => {
            assItem['showType'] = 'buy';
            this.native.navigateForward(['bid'], {
              queryParams: assItem,
            });
          },
        },
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          icon: 'close-circle',
          handler: () => {
            if (this.shareOnSaleMenu != null) {
              this.shareOnSaleMenu.dismiss();
            }
          },
        },
      ],
    });

    this.shareOnSaleMenu.onWillDismiss().then(() => {
      if (this.shareOnSaleMenu != null) {
        this.shareOnSaleMenu = null;
      }
    });
    await this.shareOnSaleMenu.present();
  }

  async sharePasarLink(assItem: any) {
    await this.native.showLoading("common.generateSharingLink");
    try {
      const saleOrderId = assItem.saleOrderId;
      Logger.log('Share pasar orderId is', saleOrderId);
      const sharedLink = await this.intentService.createSharePasarLink(saleOrderId);
      this.intentService
        .share(this.intentService.createSharePasarTitle(), sharedLink);
    } catch (error) {
    }
    this.native.hideLoading();
  }

  async showChannelCollectionsMenu(channelItem: FeedsData.ChannelCollections) {
    this.channelCollectionsMenu = await this.actionSheetController.create({
      cssClass: 'editPost',
      buttons: [
        {
          text: this.translate.instant('ChannelcollectionsPage.openCollections'),
          icon: 'create',
          handler: () => {
            this.viewHelper.showNftPrompt(
              channelItem,
              'ChannelcollectionsPage.openCollections',
              'created',
            );
          },
        },
        {
          text: this.translate.instant('common.burnNFTs'),
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.viewHelper.showNftPrompt(
              channelItem,
              'common.burnNFTs',
              'burn',
            );
          },
        },
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          icon: 'close-circle',
          handler: () => {
            if (this.channelCollectionsMenu != null) {
              this.channelCollectionsMenu.dismiss();
            }
          },
        },
      ],
    });

    this.channelCollectionsMenu.onWillDismiss().then(() => {
      if (this.channelCollectionsMenu != null) {
        this.channelCollectionsMenu = null;
      }
    });
    await this.channelCollectionsMenu.present();
  }

  async showChannelCollectionsPublishedMenu(channelItem: FeedsData.ChannelCollections) {
    this.assItem = channelItem || '';
    this.channelCollectionsPublishedMenu = await this.actionSheetController.create({
      cssClass: 'editPost',
      buttons: [
        {
          text: this.translate.instant('ChannelcollectionsPage.cancelPublicCollections'),
          role: 'destructive',
          icon: 'arrow-redo-circle',
          handler: () => {
            this.popover = this.popupProvider.ionicConfirm(
              this,
              'ChannelcollectionsPage.cancelPublicCollections',
              'ChannelcollectionsPage.cancelPublicCollections',
              this.cancelChannelCollectionMenu,
              this.confirmChannelCollectionMenu,
              './assets/images/shanchu.svg',
            );
          },
        },
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          icon: 'close-circle',
          handler: () => {
            if (this.channelCollectionsPublishedMenu != null) {
              this.channelCollectionsPublishedMenu.dismiss();
            }
          },
        },
      ],
    });

    this.channelCollectionsPublishedMenu.onWillDismiss().then(() => {
      if (this.channelCollectionsPublishedMenu != null) {
        this.channelCollectionsPublishedMenu = null;
      }
    });
    await this.channelCollectionsPublishedMenu.present();
  }
}
