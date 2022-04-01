import { Injectable } from '@angular/core';
// import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { Logger } from './logger';

const TAG: string = 'sqlite-helper';
@Injectable()
export class SqliteHelper {
  // private readonly TABLE_POST: string = 'posts';

  // private sqliteObject: SQLiteObject = null;
  // constructor(private sqlite: SQLite) {
  // }

  // private createSqlite(): Promise<SQLiteObject> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const sqliteObject = await this.sqlite.create({
  //         name: 'feedsdata.db',
  //         location: 'default'
  //       });
  //       resolve(sqliteObject);
  //     } catch (error) {
  //       Logger.error(TAG, 'Create sqlite obj error', error);
  //       reject(error);
  //     }
  //   });
  // }

  // private getSqliteObj(): Promise<SQLiteObject> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       if (!this.sqliteObject)
  //         this.sqliteObject = await this.createSqlite();

  //       resolve(this.sqliteObject);
  //     } catch (error) {
  //       Logger.error(TAG, 'Get sqlite obj error', error);
  //       reject(error);
  //     }
  //   });
  // }

  // createTables(): Promise<any> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       await this.cretePostTable();
  //       resolve('SUCCESS');
  //     } catch (error) {
  //       Logger.error(TAG, 'Create table error', error);
  //       reject(error);
  //     }
  //   });
  // }

  // private executeSql(statement: string): Promise<any> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const db: SQLiteObject = await this.getSqliteObj();
  //       const result = await db.executeSql(statement);
  //       if (result) {
  //         resolve('SUCCESS');
  //       } else {
  //         Logger.error(TAG, 'Excutesql error, result is', result);
  //         reject('Excutesql error, result is' + result);
  //       }
  //     } catch (error) {
  //       Logger.error(TAG, 'Excutesql error', error);
  //       reject(error);
  //     }
  //   });
  // }

  // private cretePostTable(): Promise<any> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const statement = 'create table ' + this.TABLE_POST
  //         + '('
  //         + 'postId VARCHAR(64), destDid VARCHAR(64), channelId VARCHAR(64), createdAt REAL(64), updatedAt REAL(64),'
  //         + 'content BLOB, status INTEGER, type VARCHAR(64), tag VARCHAR(64), proof VARCHAR(64), memo TEXT'
  //         + ')';

  //       const result = await this.executeSql(statement);
  //       console.log('cretePostTable-------------------', result);
  //       resolve('SUCCESS');
  //     } catch (error) {
  //       Logger.error(TAG, 'Create post table error', error);
  //       reject(error);
  //     }
  //   });
  // }

  // queryPostData() {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const statement = 'SELECT * FROM ' + this.TABLE_POST;
  //       const result = await this.executeSql(statement);
  //       console.log('queryData-------------------', result);
  //       resolve('SUCCESS');
  //     } catch (error) {
  //       Logger.error(TAG, 'Create post table error', error);
  //       reject(error);
  //     }
  //   });
  // }

  // queryPostDataByID(postId: string) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const statement = 'SELECT * FROM ' + this.TABLE_POST + 'WHERE postId =' + postId;
  //       const result = await this.executeSql(statement);
  //       console.log('queryData-------------------', result);
  //       resolve('SUCCESS');
  //     } catch (error) {
  //       Logger.error(TAG, 'Create post table error', error);
  //       reject(error);
  //     }
  //   });
  // }

  // insertPostData(postV3: FeedsData.PostV3) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const statement = 'INSERT INTO ' + this.TABLE_POST
  //         + '(post_id, dest_did, channel_id, created_at, updated_at, content, status, type, tag, proof, memo) VALUES'
  //         + '(' + postV3.postId + ',' + postV3.destDid + ',' + postV3.channelId + ',' + postV3.createdAt + ',' + postV3.updatedAt
  //         + ',' + postV3.content + ',' + postV3.type + ',' + postV3.tag + ',' + postV3.proof + ',' + postV3.memo + ')';
  //       const result = await this.executeSql(statement);
  //       console.log('insertData-------------------', result);
  //       resolve('SUCCESS');
  //     } catch (error) {
  //       Logger.error(TAG, 'Create post table error', error);
  //       reject(error);
  //     }
  //   });
  // }

  // updateData() {

  // }

  // deleteData() {

  // }

  // /** post */
  // insertPost() {

  // }

  // updatePost() {

  // }

  // queryPost() {

  // }

  // deletePost() {

  // }
}
