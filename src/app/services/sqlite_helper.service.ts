import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { Logger } from './logger';

const TAG: string = 'sqlite-helper';

@Injectable()
export class FeedsSqliteHelper {
  private readonly TABLE_POST: string = 'posts';
  private readonly TABLE_CHANNEL: string = 'channel';
  private readonly TABLE_COMMENT: string = 'comment';
  private readonly TABLE_LIKE: string = 'like';
  private readonly TABLE_SUBSCRIPTION_CHANNEL: string = 'subscriptionchannel';
  private readonly TABLE_SUBSCRIPTION: string = 'subscription';

  public isOpen: boolean = false;
  private limitNum: number = 30;

  // private sqliteObject: SQLiteObject = null;
  private sqliteMap: { [did: string]: SQLiteObject } = {};
  constructor(private sqlite: SQLite) {
  }

  private createSqlite(dbUserDid: string): Promise<SQLiteObject> {
    return new Promise(async (resolve, reject) => {
      try {
        const dbName = dbUserDid + '_feedsdata.db';
        const sqliteObject = await this.sqlite.create({
          name: dbName,
          location: 'default'
        });
        Logger.log(TAG, 'Create sql', sqliteObject);
        resolve(sqliteObject);
      } catch (error) {
        Logger.error(TAG, 'Create sqlite obj error', error);
        reject(error);
      }
    });
  }

  private getSqliteObj(dbUserDid: string): Promise<SQLiteObject> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.sqliteMap)
          this.sqliteMap = {};

        if (!this.sqliteMap[dbUserDid])
          this.sqliteMap[dbUserDid] = await this.createSqlite(dbUserDid);

        resolve(this.sqliteMap[dbUserDid]);
      } catch (error) {
        Logger.error(TAG, 'Get sqlite obj error', error);
        reject(error);
      }
    });
  }

  private executeSql(dbUserDid: string, statement: string, params?: any[]): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let db: SQLiteObject = null;
      try {
        Logger.log(TAG, 'Exec sql statement is ', statement);
        Logger.log(TAG, 'Exec sql params is ', params);
        db = await this.getSqliteObj(dbUserDid);

        if (this.isOpen == false) {
          await db.open();
          this.isOpen = true;
        }
        const result = await db.executeSql(statement, params);

        Logger.log(TAG, 'Exec sql result is ', result);

        if (result) {
          resolve(result);
        } else {
          Logger.error(TAG, 'Excutesql error, result is', result);
          reject('Excutesql error, result is' + result);
        }
      } catch (error) {
        try {
          if (error.message.includes("UNIQUE")) {
            Logger.log(error.message);
            resolve(null);
          } else {
            Logger.error(TAG, 'Excutesql error', error);
            reject(error);
          }
        } catch (error) {
          Logger.error(TAG, 'Excutesql error', error);
          reject(error);
        }

      } finally {
        // try {
        //   if (db) {
        //     await db.close();
        //   }
        // } catch (error) {
        // }
      }
    });
  }

  createTables(dbUserDid: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.cretePostTable(dbUserDid);
        await this.createChannelTable(dbUserDid);
        await this.createSubscribedChannelTable(dbUserDid);
        await this.createSubscriptionTable(dbUserDid);
        await this.createCommentTable(dbUserDid);
        await this.createLikeTable(dbUserDid);

        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create table error', error);
        reject(error);
      }
    });
  }

  // Post
  private cretePostTable(dbUserDid: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'create table if not exists ' + this.TABLE_POST
          + '('
          + 'post_id VARCHAR(64) UNIQUE, dest_did VARCHAR(64), channel_id VARCHAR(64), created_at REAL(64), updated_at REAL(64),'
          + 'content TEXT, status INTEGER, type VARCHAR(64), tag VARCHAR(64), proof VARCHAR(64), memo TEXT'
          + ')';

        const result = await this.executeSql(dbUserDid, statement);
        Logger.log(TAG, 'crete post table result: ', result)
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create post table error', error);
        reject(error);
      }
    });
  }

  queryPostData(dbUserDid: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_POST;
        const result = await this.executeSql(dbUserDid, statement);
        const postList = this.parsePostData(result);
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'query post data error', error);
        reject(error);
      }
    });
  }

  queryPostDataByTime(dbUserDid: string, start: number, end: number): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_POST + ' WHERE updated_at>=? and updated_at<=?  ORDER BY updated_at Desc limit ' + this.limitNum;
        const result = await this.executeSql(dbUserDid, statement, [start, end]);
        const postList = this.parsePostData(result);
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'query post data by time error', error);
        reject(error);
      }
    });
  }

  queryPostDataByID(dbUserDid: string, postId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_POST + ' WHERE post_id=?';
        const params = [postId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const postList = this.parsePostData(result);
        Logger.log(TAG, 'query post data by id result: ', postList)
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'query post table error', error);
        reject(error);
      }
    });
  }

  queryPostDataByChannelId(dbUserDid: string, channelId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_POST + ' WHERE channel_id=?';
        const params = [channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const postList = this.parsePostData(result);

        Logger.log(TAG, 'query post data by channel id result: ', postList)
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'query post table error', error);
        reject(error);
      }
    });
  }

  insertPostData(dbUserDid: string, postV3: FeedsData.PostV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'INSERT INTO ' + this.TABLE_POST
          + '(post_id, dest_did, channel_id, created_at, updated_at, content, status, type, tag, proof, memo) VALUES'
          + '(?,?,?,?,?,?,?,?,?,?,?)';
        const params = [postV3.postId, postV3.destDid, postV3.channelId, postV3.createdAt, postV3.updatedAt
          , JSON.stringify(postV3.content), postV3.status, postV3.type, postV3.tag, postV3.proof, postV3.memo];

        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'InsertData result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'insert post data error', error);
        reject(error);
      }
    });
  }

  updatePostData(dbUserDid: string, postV3: FeedsData.PostV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'UPDATE ' + this.TABLE_POST
          + ' SET updated_at=?, content=?, status=?, type=?, tag=?, proof=?, memo=? WHERE post_id=?';
        const params = [postV3.updatedAt, JSON.stringify(postV3.content), postV3.status, postV3.type, postV3.tag, postV3.proof, postV3.memo, postV3.postId];
        const result = await this.executeSql(dbUserDid, statement, params);

        Logger.log(TAG, 'update post data result: ', result)
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'update post data error', error);
        reject(error);
      }
    });
  }

  deletePostData(dbUserDid: string, postId: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_POST + ' WHERE post_id=?'
        const params = [postId];
        const result = await this.executeSql(dbUserDid, statement, params);

        Logger.log(TAG, 'delete post data result: ', result)
        resolve('SUCCESS');
      }
      catch (error) {
        Logger.error(TAG, 'delete post data error', error);
        reject(error);
      }
    });
  }

  // channel
  private createChannelTable(dbUserDid: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'create table if not exists ' + this.TABLE_CHANNEL
          + '('
          + 'dest_did VARCHAR(64), channel_id VARCHAR(64) UNIQUE, channel_name VARCHAR(64), intro TEXT, created_at REAL(64), updated_at REAL(64),'
          + 'avatar_address TEXT, tipping_address TEXT, type VARCHAR(64), proof VARCHAR(64), nft TEXT, memo TEXT, category TEXT'
          + ')';
        const result = await this.executeSql(dbUserDid, statement);

        Logger.log(TAG, 'create cahnnel table result: ', result)
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create channel table error', error);
        reject(error);
      }
    });
  }

  insertChannelData(dbUserDid: string, channelV3: FeedsData.ChannelV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'INSERT INTO ' + this.TABLE_CHANNEL
          + '(dest_did, channel_id, channel_name, intro, created_at, updated_at, avatar_address, tipping_address, type, proof, nft, memo, category) VALUES'
          + '(?,?,?,?,?,?,?,?,?,?,?,?,?)';

        const params = [channelV3.destDid, channelV3.channelId, channelV3.name, channelV3.intro, channelV3.createdAt, channelV3.updatedAt
          , channelV3.avatar, channelV3.tipping_address, channelV3.type, channelV3.proof, channelV3.nft, channelV3.memo, channelV3.category];

        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'Insert channel Data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Insert channel table date error', error);
        reject(error);
      }
    });
  }

  queryChannelData(dbUserDid: string): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_CHANNEL;
        const result = await this.executeSql(dbUserDid, statement);
        const channelList = this.parseChannelData(result);
        resolve(channelList);
      } catch (error) {
        Logger.error(TAG, 'query Channel Data error', error);
        reject(error);
      }
    });
  }



  queryChannelDataByChannelId(dbUserDid: string, channelId: string): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_CHANNEL + ' WHERE channel_id=?';
        const params = [channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const channelList = this.parseChannelData(result);

        Logger.log(TAG, 'query channel data by channel id result is', channelList);
        resolve(channelList);
      } catch (error) {
        Logger.error(TAG, 'query channel data by channel id error', error);
        reject(error);
      }
    });
  }

  queryChannelWithDid(dbUserDid: string, userDid: string): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_CHANNEL + ' WHERE dest_did=?'
        const result = await this.executeSql(dbUserDid, statement, [userDid]);
        const channelList = this.parseChannelData(result)
        Logger.log(TAG, 'query self channel with userDid result is', channelList);
        resolve(channelList);
      } catch (error) {
        Logger.error(TAG, 'query Channel Data with user error', error);
        reject(error);
      }
    });
  }

  updateChannelData(dbUserDid: string, channelV3: FeedsData.ChannelV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'UPDATE ' + this.TABLE_CHANNEL
          + ' SET channel_name=?, intro=?, created_at=?, updated_at=?, avatar_address=?, tipping_address=?, type=?, proof=?, nft=?, memo=?, category=? WHERE channel_id=?';
        const params = [channelV3.name, channelV3.intro, channelV3.createdAt, channelV3.updatedAt, channelV3.avatar, channelV3.tipping_address, channelV3.type, channelV3.proof, channelV3.nft, channelV3.memo, channelV3.category, channelV3.channelId];
        const result = await this.executeSql(dbUserDid, statement, params);

        Logger.log(TAG, 'update channel data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'update channel data error', error);
        reject(error);
      }
    });
  }

  deleteChannelData(dbUserDid: string, channelId: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_CHANNEL + ' WHERE channel_id=?'
        const params = [channelId];
        const result = await this.executeSql(dbUserDid, statement, params);

        Logger.log(TAG, 'delete channel data result is', result);
        resolve('SUCCESS');
      }
      catch (error) {
        Logger.error(TAG, 'delete channel data error', error);
        reject(error);
      }
    });
  }

  // subscription channel 本地存储使用
  private createSubscribedChannelTable(dbUserDid: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'create table if not exists ' + this.TABLE_SUBSCRIPTION_CHANNEL
          + '('
          + 'dest_did VARCHAR(64), channel_id VARCHAR(64)'
          + ')';
        const result = await this.executeSql(dbUserDid, statement);
        Logger.log(TAG, 'Create subscribed channel table result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create subscriptionChannel table error', error);
        reject(error);
      }
    });
  }

  insertSubscribedChannelData(dbUserDid: string, subscribedChannelV3: FeedsData.SubscribedChannelV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'INSERT INTO ' + this.TABLE_SUBSCRIPTION_CHANNEL
          + '(dest_did, channel_id) VALUES'
          + '(?,?)';

        const params = [subscribedChannelV3.destDid, subscribedChannelV3.channelId];

        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'Insert subscription Data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Insert subscriptionChannel table date error', error);
        reject(error);
      }
    });
  }

  querySubscribedChannelData(dbUserDid: string): Promise<FeedsData.SubscribedChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_SUBSCRIPTION_CHANNEL;
        const result = await this.executeSql(dbUserDid, statement);
        const subscribedChannelList = this.parseSubscriptionChannelData(result);
        resolve(subscribedChannelList);
      } catch (error) {
        Logger.error(TAG, 'query subscriptionChannel Data error', error);
        reject(error);
      }
    });
  }

  querySubscribedChannelDataByChannelId(dbUserDid: string, channelId: string): Promise<FeedsData.SubscribedChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_SUBSCRIPTION_CHANNEL + ' WHERE channel_id=?';
        const params = [channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const subscriptionChannelList = this.parseSubscriptionChannelData(result);

        Logger.log(TAG, 'query subscribed channel data by channel id result is', subscriptionChannelList);
        resolve(subscriptionChannelList);
      } catch (error) {
        Logger.error(TAG, 'query subscriptionChannel Data By ID  error', error);
        reject(error);
      }
    });
  }

  deleteSubscribedChannelData(dbUserDid: string, subscribedChannelV3: FeedsData.SubscribedChannelV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_SUBSCRIPTION_CHANNEL + ' WHERE channel_id=?'
        const params = [subscribedChannelV3.channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'remove subscription channel result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'delete subscriptionChannel Data error', error);
        reject(error);
      }
    });
  }

  // SubscriptionV3
  private createSubscriptionTable(dbUserDid: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'create table if not exists ' + this.TABLE_SUBSCRIPTION
          + '('
          + 'dest_did VARCHAR(64), channel_id VARCHAR(64), user_did VARCHAR(64), created_at REAL(64), display_name VARCHAR(64), updated_at REAL(64), status INTEGER'
          + ')';

        const result = await this.executeSql(dbUserDid, statement);
        Logger.log(TAG, 'Create subscribed  table result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create subscription table error', error);
        reject(error);
      }
    });
  }

  insertSubscriptionData(dbUserDid: string, subscriptionV3: FeedsData.SubscriptionV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'INSERT INTO ' + this.TABLE_SUBSCRIPTION
          + '(dest_did, channel_id, user_did, created_at, display_name, updated_at, status) VALUES'
          + '(?,?,?,?,?,?,?)';

        const params = [subscriptionV3.destDid, subscriptionV3.channelId, subscriptionV3.userDid, subscriptionV3.createdAt, subscriptionV3.displayName, subscriptionV3.updatedAt, subscriptionV3.status];

        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'Insert subscription Data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Insert subscription table date error', error);
        reject(error);
      }
    });
  }

  querySubscriptionList(dbUserDid: string): Promise<FeedsData.SubscriptionV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_SUBSCRIPTION;
        const result = await this.executeSql(dbUserDid, statement);
        const subscriptionList = this.parseSubscriptionData(result);
        resolve(subscriptionList);
      } catch (error) {
        Logger.error(TAG, 'query subscription Data error', error);
        reject(error);
      }
    });
  }

  querySubscriptionDataByChannelId(dbUserDid: string, channelId: string): Promise<FeedsData.SubscriptionV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_SUBSCRIPTION + ' WHERE channel_id=?';
        const params = [channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const subscriptionList = this.parseSubscriptionData(result);

        Logger.log(TAG, 'query subscription data by channel id result is', result);
        resolve(subscriptionList);
      } catch (error) {
        Logger.error(TAG, 'query subscription Data By ID  error', error);
        reject(error);
      }
    });
  }

  querySubscriptionNumByChannelId(dbUserDid: string, channelId: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT COUNT(*) FROM ' + this.TABLE_SUBSCRIPTION + ' WHERE channel_id=?'
        const params = [channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const num = this.parseNum(result);

        Logger.log(TAG, 'query subscription Num by channel id result is', num);
        resolve(num);
      } catch (error) {
        Logger.error(TAG, 'query subscription num By ID  error', error);
        reject(error);
      }
    });
  }

  updateSubscriptionData(dbUserDid: string, subscriptionV3: FeedsData.SubscriptionV3) {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'UPDATE ' + this.TABLE_SUBSCRIPTION
          + ' SET display_name=? WHERE channel_id=?';
        const params = [subscriptionV3.displayName, subscriptionV3.channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'update subscription data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'update subscription data error', error);
        reject(error);
      }
    });
  }

  deleteSubscriptionData(dbUserDid: string, subscriptionV3: FeedsData.SubscriptionV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_SUBSCRIPTION + ' WHERE channel_id=?'
        const params = [subscriptionV3.channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'remove subscription result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'delete subscription data error', error);
        reject(error);
      }
    });
  }

  // comment
  private createCommentTable(dbUserDid: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'create table if not exists ' + this.TABLE_COMMENT
          + '('
          + 'dest_did VARCHAR(64), comment_id VARCHAR(64) UNIQUE, channel_id VARCHAR(64), post_id VARCHAR(64), refcomment_id VARCHAR(64), content TEXT, status INTEGER, created_at REAL(64), updated_at REAL(64), proof TEXT, memo TEXT, creater_did VARCHAR(64)'
          + ')';
        const result = await this.executeSql(dbUserDid, statement);
        Logger.log(TAG, 'create Comment table result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create Comment table error', error);
        reject(error);
      }
    });
  }

  insertCommentData(dbUserDid: string, commentV3: FeedsData.CommentV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'INSERT INTO ' + this.TABLE_COMMENT
          + '(dest_did, comment_id, channel_id, post_id, refcomment_id, content, status, created_at, updated_at, proof, memo, creater_did) VALUES'
          + '(?,?,?,?,?,?,?,?,?,?,?,?)';

        const params = [commentV3.destDid, commentV3.commentId, commentV3.channelId, commentV3.postId, commentV3.refcommentId, commentV3.content
          , commentV3.status, commentV3.createdAt, commentV3.updatedAt, commentV3.proof, commentV3.memo, commentV3.createrDid];

        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'Insert comment Data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Insert comment table date error', error);
        reject(error);
      }
    });
  }

  updateCommentData(dbUserDid: string, commentV3: FeedsData.CommentV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'UPDATE ' + this.TABLE_COMMENT
          + ' SET content=?, status=?, updated_at=?, proof=?, memo=? WHERE comment_id=?'; // 条件是否使用refcomment_id
        const params = [commentV3.content, commentV3.status, commentV3.updatedAt, commentV3.proof, commentV3.memo, commentV3.commentId];

        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'update comment data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'update comment data error', error);
        reject(error);
      }
    });
  }

  queryCommentByCommentId(dbUserDid: string, commentId: string): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_COMMENT + ' WHERE comment_id=?';
        const params = [commentId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const commentList = this.parseCommentData(result);

        Logger.log(TAG, 'query comment by commentId result is', commentList);
        resolve(commentList);
      } catch (error) {
        Logger.error(TAG, 'query comment Data By ID  error', error);
        reject(error);
      }
    });
  }

  queryCommentById(dbUserDid: string, postId: string, commentId: string): Promise<FeedsData.CommentV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_COMMENT + ' WHERE comment_id=?';
        const params = [commentId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const commentList = this.parseCommentData(result);

        Logger.log(TAG, 'query comment by Id result is', commentList);
        resolve(commentList[0]);
      } catch (error) {
        Logger.error(TAG, 'query comment Data By ID  error', error);
        reject(error);
      }
    });
  }

  queryCommentByRefId(dbUserDid: string, postId: string, refCommentId: string): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_COMMENT + ' WHERE post_id=? and refcomment_id=?';
        const params = [postId, refCommentId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const commentList = this.parseCommentData(result);

        Logger.log(TAG, 'query comment by ref Id result is', commentList);
        resolve(commentList);
      } catch (error) {
        Logger.error(TAG, 'query comment Data By ref ID  error', error);
        reject(error);
      }
    });
  }

  queryCommentData(dbUserDid: string): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_COMMENT;
        const result = await this.executeSql(dbUserDid, statement);
        const commentList = this.parseCommentData(result);
        resolve(commentList);
      } catch (error) {
        Logger.error(TAG, 'query comment Data error', error);
        reject(error);
      }
    });
  }

  deleteCommentData(dbUserDid: string, commentId: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_COMMENT + ' WHERE comment_id=?'
        const params = [commentId];
        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'Remove comment data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Remove comment from sql error', error);
        reject(error);
      }
    });
  }

  queryCommentNum(dbUserDid: string, commentId: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT COUNT(*) FROM ' + this.TABLE_COMMENT + ' WHERE comment_id=?'
        const params = [commentId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const num = this.parseNum(result);

        resolve(num);
      } catch (error) {
        Logger.error(TAG, 'Query comment num error', error);
        reject(error);
      }
    });
  }

  // like
  private createLikeTable(dbUserDid: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'create table if not exists ' + this.TABLE_LIKE
          + '('
          + 'like_id VARCHAR(64) UNIQUE, dest_did VARCHAR(64), channel_id VARCHAR(64), post_id VARCHAR(64), comment_id VARCHAR(64), created_at REAL(64), creater_did VARCHAR(64), proof TEXT, memo TEXT,updated_at REAL(64), status INTEGER'
          + ')';
        const result = await this.executeSql(dbUserDid, statement);
        Logger.log(TAG, 'create like table result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create like table error', error);
        reject(error);
      }
    });
  }

  insertLike(dbUserDid: string, likeV3: FeedsData.LikeV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'INSERT INTO ' + this.TABLE_LIKE
          + '(like_id, dest_did, channel_id, post_id, comment_id, created_at, creater_did, proof, memo, updated_at, status) VALUES'
          + '(?,?,?,?,?,?,?,?,?,?,?)';
        const params = [likeV3.likeId, likeV3.destDid, likeV3.channelId, likeV3.postId, likeV3.commentId, likeV3.createdAt, likeV3.createrDid, likeV3.proof, likeV3.memo, likeV3.updatedAt, likeV3.status];

        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'Insert like result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Insert like table date error', error);
        reject(error);
      }
    });
  }

  queryLikeData(dbUserDid: string): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_LIKE;
        const result = await this.executeSql(dbUserDid, statement);
        const likeList = this.parseLikeData(result);
        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'Query like Data error', error);
        reject(error);
      }
    });
  }

  queryLikeDataById(dbUserDid: string, postId: string, commentId: string): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_LIKE + ' WHERE post_id=? and comment_id=? and status=?'
        const params = [postId, commentId, FeedsData.PostCommentStatus.available];

        const result = await this.executeSql(dbUserDid, statement, params);
        const likeList = this.parseLikeData(result);
        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'query like Data error', error);
        reject(error);
      }
    });
  }

  queryLikeDataById2(dbUserDid: string, likeId: string): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_LIKE + ' WHERE like_id=? and status=?'
        const params = [likeId, FeedsData.PostCommentStatus.available];

        const result = await this.executeSql(dbUserDid, statement, params);
        const likeList = this.parseLikeData(result);
        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'query like Data error', error);
        reject(error);
      }
    });
  }

  queryLikeNum(dbUserDid: string, postId: string, commentId: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT COUNT(*) FROM ' + this.TABLE_LIKE + ' WHERE post_id=? and comment_id=? and status=?'
        const params = [postId, commentId, FeedsData.PostCommentStatus.available];
        const result = await this.executeSql(dbUserDid, statement, params);
        const num = this.parseNum(result)
        resolve(num);
      } catch (error) {
        Logger.error(TAG, 'Query like num error', error);
        reject(error);
      }
    });
  }

  queryUserLikeData(dbUserDid: string, postId: string, commentId: string, userDid: string): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_LIKE + ' WHERE post_id=? and comment_id=? and creater_did=? '
        const params = [postId, commentId, userDid];

        const result = await this.executeSql(dbUserDid, statement, params);
        const likeList = this.parseLikeData(result);
        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'Query user likes data error', error);
        reject(error);
      }
    });
  }

  queryUserAllLikeData(dbUserDid: string, userDid: string): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_LIKE + ' WHERE creater_did=? and status=?'
        const params = [userDid, FeedsData.PostCommentStatus.available];

        const result = await this.executeSql(dbUserDid, statement, params);
        const likeList = this.parseLikeData(result);
        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'Query user all like data error', error);
        reject(error);
      }
    });
  }

  deleteLike(dbUserDid: string, likeV3: FeedsData.LikeV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_LIKE + ' WHERE like_id=?'
        const params = [likeV3.likeId];

        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'delete like result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'delete like error', error);
        reject(error);
      }
    });
  }

  updateLike(dbUserDid: string, likeV3: FeedsData.LikeV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'UPDATE ' + this.TABLE_LIKE
          + ' SET proof=?, memo=?, updated_at=?, status=? WHERE like_id=?';
        const params = [likeV3.proof, likeV3.memo, likeV3.updatedAt, likeV3.status, likeV3.likeId];

        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'update comment data result is', result);
        resolve('SUCCESS');
      }
      catch (error) {
        Logger.error(TAG, 'update like error', error);
        reject(error)
      }
    });
  }

  parsePostData(result: any): FeedsData.PostV3[] {
    Logger.log(TAG, 'Parse post result from sql, result is', result);
    if (!result) {
      return [];
    }
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);

      // content
      const contentData = element['content']
      const contentDatas = JSON.parse(contentData)
      //mediaDataV3
      const mediaDataV3Data = contentDatas['mediaData'][0]
      let mediaDataV3Array = []

      if (mediaDataV3Data != undefined) {
        const mediaDataV3: FeedsData.mediaDataV3 = {
          kind: mediaDataV3Data['kind'],       //"image/video/audio"
          originMediaPath: mediaDataV3Data['originMediaPath'],
          type: mediaDataV3Data['type'],           //"image/jpg",
          size: mediaDataV3Data['size'],           //origin file size
          thumbnailPath: mediaDataV3Data['thumbnailPath'],   //"thumbnailCid"
          duration: mediaDataV3Data['duration'],
          imageIndex: mediaDataV3Data['imageIndex'],
          additionalInfo: mediaDataV3Data['additionalInfo'],
          memo: mediaDataV3Data['memo'],
        }
        mediaDataV3Array.push(mediaDataV3)
      }

      let postContentV3: FeedsData.postContentV3 = {
        version: contentDatas['version'],
        content: contentDatas['content'],
        mediaData: mediaDataV3Array,// 已经上传的到hive(size/type/scriptName@path)
        mediaType: contentDatas['mediaType'],
      }

      let postV3: FeedsData.PostV3 = {
        destDid: element['dest_did'],
        postId: element['post_id'],
        channelId: element['channel_id'],
        createdAt: element['created_at'],
        updatedAt: element['updated_at'],
        content: postContentV3,// string 转mediaDataV3
        status: element['status'],// PostCommentStatus
        type: element['type'],
        tag: element['tag'],
        proof: element['proof'],
        memo: element['memo'],
      }
      list.push(postV3);
    }

    Logger.log(TAG, 'Parse post list from sql, list is', list);
    return list;
  }

  parseChannelData(result: any): FeedsData.ChannelV3[] {
    Logger.log(TAG, 'Parse channel result from sql, result is', result);
    if (!result) {
      return [];
    }
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      let channelV3: FeedsData.ChannelV3 = {
        destDid: element['dest_did'],
        channelId: element['channel_id'],
        createdAt: element['created_at'],
        updatedAt: element['updated_at'],
        name: element['channel_name'],
        intro: element['intro'],
        avatar: element['avatar_address'],
        type: element['type'],
        tipping_address: element['tipping_address'],
        nft: element['nft'],
        category: element['category'],
        proof: element['proof'],
        memo: element['memo']
      }

      list.push(channelV3);
    }
    Logger.log(TAG, 'Parse channel list from sql, list is', list);
    return list;
  }

  parseCommentData(result: any): FeedsData.CommentV3[] {
    Logger.log(TAG, 'Parse comment result from sql, result is', result);
    if (!result) {
      return [];
    }
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      let commentV3: FeedsData.CommentV3 = {
        destDid: element['dest_did'],
        commentId: element['comment_id'],
        channelId: element['channel_id'],
        postId: element['post_id'],
        refcommentId: element['refcomment_id'],
        content: element['content'],
        status: element['status'],//PostCommentStatus
        createdAt: element['created_at'],
        updatedAt: element['updated_at'],
        proof: element['proof'],
        memo: element['memo'],
        createrDid: element['creater_did'],
      }
      list.push(commentV3);
    }
    Logger.log(TAG, 'Parse comment list from sql, list is', list);
    return list;
  }

  parseLikeData(result: any): FeedsData.LikeV3[] {
    Logger.log(TAG, 'Parse like result from sql, result is', result);
    if (!result) {
      return [];
    }
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      let likeV3: FeedsData.LikeV3 = {
        likeId: element['like_id'],

        destDid: element['dest_did'],
        postId: element['post_id'],
        commentId: element['comment_id'],
        channelId: element['channel_id'],
        createdAt: element['created_at'],
        createrDid: element['creater_did'],
        proof: element['proof'],
        memo: element['memo'],

        updatedAt: element['updated_at'],
        status: element['status'],
      }
      list.push(likeV3);
    }
    Logger.log(TAG, 'Parse like list from sql, list is', list);
    return list;
  }

  parseNum(result: any): number {
    Logger.log(TAG, 'Parse like count result from sql, result is', result);
    if (!result) {
      return 0;
    }
    let num = 0;
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      num = element['COUNT(*)']
    }
    Logger.log(TAG, 'Parse count from sql, count is', num);
    return num;
  }

  parseSubscriptionChannelData(result: any): FeedsData.SubscribedChannelV3[] {
    Logger.log(TAG, 'Parse subscription channel result from sql, result is', result);
    if (!result) {
      return [];
    }
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      let subscribedChannel: FeedsData.SubscribedChannelV3 = {
        destDid: element['dest_did'],
        channelId: element['channel_id']
      }
      list.push(subscribedChannel);
    }
    Logger.log(TAG, 'Parse subscription channel list from sql, list is', list);
    return list;
  }

  parseSubscriptionData(result: any): FeedsData.SubscriptionV3[] {
    Logger.log(TAG, 'Parse subscription result from sql, result is', result);
    if (!result) {
      return [];
    }
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      let subscriptionV3: FeedsData.SubscriptionV3 = {
        destDid: element['dest_did'],
        channelId: element['channel_id'],
        userDid: element['user_did'],
        createdAt: element['created_at'],
        displayName: element['display_name'],

        updatedAt: element['updated_at'],
        status: element['status'],
      }
      list.push(subscriptionV3);
    }
    Logger.log(TAG, 'Parse subscription list from sql, list is', list);
    return list;
  }
}
