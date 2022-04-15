import { Injectable } from '@angular/core';
import _ from 'lodash';
import { HiveVaultController } from './hivevault_controller.service';
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
             if(likedCommentNum[commentId] > 0){
              likedCommentNum[commentId] = likedCommentNum[commentId] - 1;
             }
             isloadingLikeMap[commentId] = "";
          });
      } catch (err) {
         likedCommentMap[commentId] = "";
         if(likedCommentNum[commentId] > 0){
          likedCommentNum[commentId] = likedCommentNum[commentId] - 1;
         }
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
           likedCommentNum[commentId] = likedCommentNum[commentId] + 1;
           isloadingLikeMap[commentId] = "";

        });
      } catch (error) {
        likedCommentMap[postId] = "like";
        likedCommentNum[commentId] = likedCommentNum[commentId] + 1;
        isloadingLikeMap[commentId] = "";
      }
      }
  }

  public static initLikeData(
    destDid: string,
    channelId: string,
    postId: string,
    commentId: string,
    hiveVaultController: any,
    isInitLike: any,
    likedCommentNum: any,
    likedCommentMap: any
    ) {
    try {
      hiveVaultController.getLikeByPost(
        destDid, channelId, postId).then((likeList) => {
          isInitLike[postId] = "13";
          let list = likeList || [];

          //计算comment like的数量
          let newList = _.filter(list,((item)=>{
            return item.commentId === commentId;
          }))
            likedCommentNum[commentId] = newList.length;

          //检测comment like状态
          let index = _.find(list, (item) => {
            return item.channelId === channelId && item.postId === postId && item.commentId === commentId;
          }) || "";
          if (index === "") {
              likedCommentMap[commentId] = "";
          } else {
              likedCommentMap[commentId] = "like";
          }

        }).catch((err) => {
            likedCommentMap[commentId] = "";
            likedCommentNum[commentId] = 0;
            isInitLike[commentId] = "";
        });
    } catch (err) {
      //this.likesNum = 0;
        likedCommentMap[commentId] = "";
        likedCommentNum[commentId] = 0;
        isInitLike[commentId] = "";
    }
  }

  public static likePost(
        destDid: string,
        channelId: string,
        postId: string,
        isLoadingLikeMap: any,
        likeMap: any,
        likeNumMap: any,
        hiveVaultController: any,
        ) {
    let isLoading  = isLoadingLikeMap[postId] || '';
    if(isLoading === "loading"){
        return;
    }
    let isLike = likeMap[postId] || '';
    if (isLike === '') {
      try {
        isLoadingLikeMap[postId] = "loading";
        likeMap[postId] = "like";
        likeNumMap[postId] = likeNumMap[postId] + 1;
        hiveVaultController.like(
          destDid, channelId, postId, '0').then(()=>{
              isLoadingLikeMap[postId] = "";
          }).catch(err=>{
              isLoadingLikeMap[postId] = "";
              likeMap[postId] = "";
              if(likeNumMap[postId] > 0){
                likeNumMap[postId] = likeNumMap[postId] - 1;
              }
          });
      } catch (err) {
              isLoadingLikeMap[postId] = "";
              likeMap[postId] = "";
              if(likeNumMap[postId] > 0){
                likeNumMap[postId] = likeNumMap[postId] - 1;
              }
      }

      return;
    }

    if(isLike === "like")
    {
      try {
        isLoadingLikeMap[postId] = "loading";
        likeMap[postId] = "";
        if(likeNumMap[postId] > 0){
          likeNumMap[postId] = likeNumMap[postId] - 1;
        }
        hiveVaultController.removeLike(
          destDid, channelId, postId, '0').then(()=>{
              isLoadingLikeMap[postId] = "";
          }).catch(()=>{
              isLoadingLikeMap[postId] = "";
              likeMap[postId] = "like";
              likeNumMap[postId] = likeNumMap[postId] + 1;
          });
      } catch (error) {
              isLoadingLikeMap[postId] = "";
              likeMap[postId] = "like";
              likeNumMap[postId] = likeNumMap[postId] + 1;
      }
    }
  }

public static handlePostLikeStatusData(
    id: any, srcId: any, postgridindex: any, postgrid: any,
    clientHeight: any, isInitLikeStatus: any, hiveVaultController: any,
    likeMap: any,isLoadingLikeMap: any
    ){
      try {
        if (
          id != '' &&
          postgrid.getBoundingClientRect().top >= -100 &&
          postgrid.getBoundingClientRect().bottom <= clientHeight
        ) {
          let arr = srcId.split('-');
          let destDid = arr[0];
          let channelId = arr[1];
          let postId = arr[2];
          let isInit = isInitLikeStatus[postId] || '';
          if (isInit === '') {
            isInitLikeStatus[postId] = "11";
            this.initPostLikeStatusData(destDid, channelId, postId,
              isLoadingLikeMap, hiveVaultController,likeMap, isInitLikeStatus);
          }
        }
      } catch (error) {
      }
  }

  static initPostLikeStatusData(
    destDid: string, channelId: string, postId: string,
    isLoadingLikeMap: any, hiveVaultController: any,
    likeMap: any, isInitLikeStatus: any
    ) {

    try{
      isLoadingLikeMap[postId] = "loading";
      hiveVaultController.getLikeStatus(postId, '0').then((status)=>{
          if(status){
            likeMap[postId] = "like";
          }else{
            likeMap[postId] = "";
          }
          isLoadingLikeMap[postId] = "";
      }).catch((err)=>{
         isLoadingLikeMap[postId] = "";
         isInitLikeStatus[postId] = "";
      });
    }catch(err){
       isLoadingLikeMap[postId] = "";
       isInitLikeStatus[postId] = "";
    }

  }

  public static  handlePostLikeNumData(
    id: string, srcId: string, rowindex: number, postgrid: any,
    clientHeight: any, hiveVaultController: any,
    likeNumMap:any, isInitLikeNum: any
    ) {
    try {
      if (
        id != '' &&
        postgrid.getBoundingClientRect().top >= -100 &&
        postgrid.getBoundingClientRect().bottom <= clientHeight
      ) {
        let arr = srcId.split('-');
        let destDid = arr[0];
        let channelId = arr[1];
        let postId = arr[2];
        let isInit = isInitLikeNum[postId] || '';
        if (isInit === '') {
           isInitLikeNum[postId] = "11";
           this.initPostLikeNumData(destDid, channelId, postId,
            hiveVaultController, likeNumMap, isInitLikeNum);
        }
      }
    } catch (error) {
    }
  }

 static initPostLikeNumData(
   destDid: string, channelId: string, postId: string,
   hiveVaultController: any, likeNumMap: any,
   isInitLikeNum: any
   ) {
    try {
      hiveVaultController.getLikeNum(
         postId, '0'
      ).then((result) => {
        let listNum = result || 0;
        likeNumMap[postId]= listNum;
      }).catch((err) => {
        isInitLikeNum[postId] = "";
        likeNumMap[postId]= 0;
      });
    } catch (err) {
       isInitLikeNum[postId] = "";
       likeNumMap[postId]= 0;
    }

  }

public static handlePostCommentData(
  id: string, srcId: string, rowindex: number, postgrid: any,
  clientHeight: any, hiveVaultController:any,
  isInitComment: any, commentNumMap: any
  ) {
    try {
      if (
        id != '' &&
        postgrid.getBoundingClientRect().top >= -100 &&
        postgrid.getBoundingClientRect().bottom <= clientHeight
      ) {
        let arr = srcId.split('-');
        let destDid = arr[0];
        let channelId = arr[1];
        let postId = arr[2];
        let isInit = isInitComment[postId] || '';
        if (isInit === '') {
           isInitComment[postId] = "11";
           this.initPostCommentData(destDid, channelId, postId,
            hiveVaultController, isInitComment, commentNumMap
            );
        }
      }
    } catch (error) {
    }
  }
  static initPostCommentData(destDid: string, channelId: string, postId: string,
    hiveVaultController: any, isInitComment: any ,commentNumMap: any
    ) {
    try {
       hiveVaultController.getCommentList(
         postId, '0'
      ).then((result: any) => {
        console.log("=======result======="+JSON.stringify(result));
        isInitComment[postId] = "13";
        commentNumMap[postId] = result.length;
      }).catch((err) => {
         isInitComment[postId] = "";
         commentNumMap[postId] = 0;
      });
    } catch (error) {
       isInitComment[postId] = "";
       commentNumMap[postId] = 0;
    }
  }

}
