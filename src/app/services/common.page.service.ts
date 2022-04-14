import { Injectable } from '@angular/core';
import { UtilService } from './utilService';
@Injectable()
export class CommonPageService {

 public static removeAllAvatar(isLoadAvatarImage: any, elementId: string) {
    let avatarImageIds = isLoadAvatarImage;
    for (let key in avatarImageIds) {
      let value = avatarImageIds[key] || '';
      if (value === '13') {
        let id = key +"-"+elementId;
        let htmlElement: HTMLElement = document.getElementById(id) || null;
        if (htmlElement != null) {
          htmlElement.setAttribute('src',"./assets/icon/reserve.svg");
        }
      }
    }
  }

 public static handleDisplayUserName(
        id: string,
        srcId: string,
        rowindex: number,
        postgrid: any,
        clientHeight: any,
        isInitUserNameMap: any,
        userNameMap: any,
        hiveVaultController: any)
    {
    try {
      if (
        id != '' &&
        postgrid.getBoundingClientRect().top >= -100 &&
        postgrid.getBoundingClientRect().bottom <= clientHeight
      ) {
        let arr = srcId.split('-');
        let destDid = arr[0];
        let channelId = arr[1];
        let commentId = arr[3];
        let userDid = arr[4];
        let isInit = isInitUserNameMap[commentId] || '';
        if (isInit === '') {
          userNameMap[userDid] = this.indexText(userDid);
          isInitUserNameMap[commentId] = "11";
          hiveVaultController.getDisplayName(destDid, channelId, userDid).
          then((result: string)=>{
             let name = result || "";
             if(name != ""){
               userNameMap[userDid] = name;
             }
          }).catch(()=>{
             userNameMap[userDid] = this.indexText(userDid);
          });
        }
      }
    } catch (error) {
    }
  }

  static indexText(text: string): string {
    text = text || "";
    if(text != ''){
      text = text.replace('did:elastos:', '');
      return UtilService.resolveAddress(text);
    }
  }

  public static likeComment(comment: FeedsData.CommentV3,
              likedCommentMap: any,
              isloadingLikeMap: any,
              likedCommentNum: any,
              hiveVaultController: any,
              ){

    let destDid = comment.destDid;
    let channelId = comment.channelId;
    let postId = comment.postId;
    let commentId = comment.commentId;
    let isLike = likedCommentMap[commentId] || '';
    let isLikeLoading = isloadingLikeMap[commentId] || ''
      if(isLikeLoading === "loading"){
         return;
      }
      if (isLike === '') {
      try {
          isloadingLikeMap[commentId] = "loading";
          likedCommentMap[commentId] = "like";
          likedCommentNum[commentId] = likedCommentNum[commentId] + 1;

          hiveVaultController.like(destDid, channelId, postId, commentId).then(()=>{
              isloadingLikeMap[commentId] = "";
          }).catch(()=>{
             likedCommentMap[commentId] = "";
             likedCommentNum[commentId] = likedCommentNum[commentId] + 1;
             isloadingLikeMap[commentId] = "";
          });
      } catch (err) {
         likedCommentMap[commentId] = "";
         likedCommentNum[commentId] = likedCommentNum[commentId] + 1;
         isloadingLikeMap[commentId] = "";
      }
      return;
      }

      if(likedCommentMap[commentId] === "like"){

      try {
        isloadingLikeMap[commentId] = "loading";
        likedCommentNum[commentId] = likedCommentNum[commentId] - 1;
        likedCommentMap[commentId] = "";
        hiveVaultController.removeLike(destDid, channelId, postId, commentId).then(()=>{
           isloadingLikeMap[commentId] = "";
        }).catch(()=>{
           likedCommentMap[commentId] = "like";
           likedCommentNum[commentId] = likedCommentNum[commentId] - 1;
           isloadingLikeMap[commentId] = "";

        });
      } catch (error) {
        likedCommentMap[postId] = "like";
        likedCommentNum[commentId] = likedCommentNum[commentId] - 1;
        isloadingLikeMap[commentId] = "";
      }
      }
  }
}
