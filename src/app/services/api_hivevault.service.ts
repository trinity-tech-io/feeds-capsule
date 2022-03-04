import { Injectable } from '@angular/core';
import { HiveService } from 'src/app/services/HiveService';

const TAG = 'API-HiveVault';

@Injectable()
export class HiveVaultApi {
  constructor(
    private hiveService: HiveService
  ) {
  }

  //API
  //channel/post/comment/
  createCollection(collectName: string) {
    this.hiveService.createChannel(collectName);
  }

  //API
  //Channel
  //Insert
  insertDataToChannelDB() {
  }

  //API
  //Channel
  //Update
  updateDataToChannelDB() {
  }

  //API
  //Post
  //insert
  insertDataToPostDB() {
  }

  //API
  //Post
  //Update
  updateDataToPostDB() {
  }

  //API
  //Post
  //Delete
  deleteDataFromPostDB() {
  }

  //API
  //Post
  //Register Get
  registerGetPostScripting() {

  }

  //API
  //Post
  //Call Get
  callGetPostScripting() {

  }

  //API
  //Comment
  //Update
  insertDataToCommentDB() {
  }


  registerGetCommentScripting() {
  }

  callGetCommentScripting() {
  }

  createComment() {
  }

  updateComment() {
  }

  deleteComment() {
  }

}
