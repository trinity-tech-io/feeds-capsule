import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { Logger } from './logger';

const TAG: string = 'sqlite-helper';

@Injectable()
export class FeedsSqliteHelper {
  private readonly TABLE_POST: string = 'poststest';
  private readonly TABLE_CHANNEL: string = 'channeltest';
  private readonly TABLE_COMMENT: string = 'commenttest';
  private readonly TABLE_LIKE: string = 'liketest';
  private readonly TABLE_SUBSCRIPTION_CHANNEL: string = 'subscriptionchanneltest';
  private readonly TABLE_SUBSCRIPTION: string = 'subscriptiontest';

  private readonly LIMIT: number = 2;

  private sqliteObject: SQLiteObject = null;
  constructor(private sqlite: SQLite) {
  }

  private createSqlite(): Promise<SQLiteObject> {
    return new Promise(async (resolve, reject) => {
      try {
        const sqliteObject = await this.sqlite.create({
          name: 'feedsdata.db',
          location: 'default'
        });
        resolve(sqliteObject);
      } catch (error) {
        Logger.error(TAG, 'Create sqlite obj error', error);
        reject(error);
      }
    });
  }

  private getSqliteObj(): Promise<SQLiteObject> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.sqliteObject)
          this.sqliteObject = await this.createSqlite();

        resolve(this.sqliteObject);
      } catch (error) {
        Logger.error(TAG, 'Get sqlite obj error', error);
        reject(error);
      }
    });
  }

  private executeSql(statement: string, params?: any[]): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let db: SQLiteObject = null;
      try {
        Logger.log(TAG, 'Exec sql statement is ', statement);
        Logger.log(TAG, 'Exec sql params is ', params);
        db = await this.getSqliteObj();
        await db.open();
        const result = await db.executeSql(statement, params);
        if (result) {
          resolve(result);
        } else {
          Logger.error(TAG, 'Excutesql error, result is', result);
          reject('Excutesql error, result is' + result);
        }
      } catch (error) {
        Logger.error(TAG, 'Excutesql error', error);
        reject(error);
      } finally {
        try {
          if (db) {
            await db.close();
          }
        } catch (error) {
        }
      }
    });
  }

  createTables(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.cretePostTable();
        await this.createChannelTable();
        await this.createSubscriptionChannelTable();
        await this.createSubscriptionTable();
        await this.createCommentTable();
        await this.createLikeTable();

        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create table error', error);
        reject(error);
      }
    });
  }

  // Post
  private cretePostTable(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'create table ' + this.TABLE_POST
          + '('
          + 'post_id VARCHAR(64), dest_did VARCHAR(64), channel_id VARCHAR(64), created_at REAL(64), updated_at REAL(64),'
          + 'content BLOB, status INTEGER, type VARCHAR(64), tag VARCHAR(64), proof VARCHAR(64), memo TEXT'
          + ')';

        const result = await this.executeSql(statement);
        console.log('cretePostTable-------------------', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create post table error', error);
        reject(error);
      }
    });
  }

  queryPostData(): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_POST;
        const result = await this.executeSql(statement);
        const postList = this.parsePostData(result);
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'Create post table error', error);
        reject(error);
      }
    });
  }

  queryPostDataByTime(start: number, end: number): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_POST + ' WHERE updated_at>=? and updated_at<=?';
        const result = await this.executeSql(statement, [start, end]);
        const postList = this.parsePostData(result);
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'Create post table error', error);
        reject(error);
      }
    });
  }

  queryPostDataByID(postId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_POST + ' WHERE post_id=?';
        const params = [postId];
        const result = await this.executeSql(statement, params);
        const postList = this.parsePostData(result);

        console.log('queryData-------------------', postList);
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'Create post table error', error);
        reject(error);
      }
    });
  }

  insertPostData(postV3: FeedsData.PostV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'INSERT INTO ' + this.TABLE_POST
          + '(post_id, dest_did, channel_id, created_at, updated_at, content, status, type, tag, proof, memo) VALUES'
          + '(?,?,?,?,?,?,?,?,?,?,?)';
        const params = [postV3.postId, postV3.destDid, postV3.channelId, postV3.createdAt, postV3.updatedAt
          , JSON.stringify(postV3.content), postV3.status, postV3.type, postV3.tag, postV3.proof, postV3.memo];

        const result = await this.executeSql(statement, params);
        Logger.log(TAG, 'InsertData result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create post table error', error);
        reject(error);
      }
    });
  }

  updatePostData(postV3: FeedsData.PostV3) {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'UPDATE ' + this.TABLE_POST
          + ' SET updated_at=?, content=?, status=?, type=?, tag=?, proof=?, memo=? WHERE post_id=?';
        const params = [postV3.updatedAt, JSON.stringify(postV3.content), postV3.status, postV3.type, postV3.tag, postV3.proof, postV3.memo, postV3.postId];

        const result = await this.executeSql(statement, params);
        Logger.log(TAG, 'InsertData result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create post table error', error);
        reject(error);
      }
    });
  }

  deletePostData(channelId: string, postId: string) {

  }

  // channel
  private createChannelTable(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'create table ' + this.TABLE_CHANNEL
          + '('
          + 'dest_did VARCHAR(64), channel_id VARCHAR(64), channel_name VARCHAR(64), intro TEXT, created_at REAL(64), updated_at REAL(64),'
          + 'avatarAddress TEXT, tippingAddress TEXT, type VARCHAR(64), proof VARCHAR(64),nft TEXT, memo TEXT, category TEXT'
          + ')';
        const result = await this.executeSql(statement);
        console.log('creteChannelTable-------------------', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create channel table error', error);
        reject(error);
      }
    });
  }

  insertChannelData(channelV3: FeedsData.ChannelV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'INSERT INTO ' + this.TABLE_CHANNEL
          + '(dest_did, channel_id, channel_name, intro, created_at, updated_at, avatarAddress, tippingAddress, type, proof, nft, memo, category) VALUES'
          + '(?,?,?,?,?,?,?,?,?,?,?,?,?)';

        const params = [channelV3.destDid, channelV3.channelId, channelV3.name, channelV3.intro, channelV3.createdAt, channelV3.updatedAt
          , JSON.stringify(channelV3.avatar), channelV3.tipping_address, channelV3.type, channelV3.proof, channelV3.nft, channelV3.memo, channelV3.category];

        const result = await this.executeSql(statement, params);
        Logger.log(TAG, 'Insert channel Data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Insert channel table date error', error);
        reject(error);
      }
    });
  }

  queryChannelData(): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_CHANNEL;
        const result = await this.executeSql(statement);
        const channelList = this.parseChannelData(result);
        resolve(channelList);
      } catch (error) {
        Logger.error(TAG, 'query Channel Data error', error);
        reject(error);
      }
    });
  }

  queryChannelDataByChannelId(channelId: string): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_CHANNEL + ' WHERE channel_id=?';
        const params = [channelId];
        const result = await this.executeSql(statement, params);
        const channelList = this.parseChannelData(result);

        console.log('queryData-------------------', channelList);
        resolve(channelList);
      } catch (error) {
        Logger.error(TAG, 'query Channel Data By ID  error', error);
        reject(error);
      }
    });
  }

  queryMyChannel(userDid: string): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_CHANNEL
        const result = await this.executeSql(statement)
        const channelList = this.parseChannelData(result)
        let list = [];
        channelList.forEach(channel => {
          if (channel.destDid = userDid) list.push(channel)
        })
        console.log('queryData-------------------', channelList);
        resolve(list);
      } catch (error) {
        Logger.error(TAG, 'query Channel Data By ID  error', error);
        reject(error);
      }
    });
  }

  updateChannelData(channelV3: FeedsData.ChannelV3) {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'UPDATE ' + this.TABLE_CHANNEL
          + ' SET channel_name=?, intro=?, created_at=?, updated_at=?, avatarAddress=?, tippingAddress=?, type=?, proof=?, nft=?, memo=?, category=? WHERE channel_id=?';
        const params = [channelV3.name, JSON.stringify(channelV3.intro), channelV3.createdAt, channelV3.updatedAt, channelV3.avatar, channelV3.tipping_address, channelV3.type, channelV3.proof, channelV3.nft, channelV3.memo, channelV3.category];

        const result = await this.executeSql(statement, params);
        Logger.log(TAG, 'update channel data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'update channel data error', error);
        reject(error);
      }
    });
  }

  // subscription channel 本地存储使用
  private createSubscriptionChannelTable(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'create table ' + this.TABLE_SUBSCRIPTION_CHANNEL
          + '('
          + 'dest_did VARCHAR(64), channel_id VARCHAR(64)'
          + ')';
        const result = await this.executeSql(statement);
        console.log('Create subscription table-------------------', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create subscriptionChannel table error', error);
        reject(error);
      }
    });
  }

  insertSubscriptionChannelData(subscribedChannelV3: FeedsData.SubscribedChannelV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'INSERT INTO ' + this.TABLE_SUBSCRIPTION_CHANNEL
          + '(dest_did, channel_id) VALUES'
          + '(?,?)';

        const params = [subscribedChannelV3.destDid, subscribedChannelV3.channelId];

        const result = await this.executeSql(statement, params);
        Logger.log(TAG, 'Insert subscription Data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Insert subscriptionChannel table date error', error);
        reject(error);
      }
    });
  }

  querySubscriptionChannelList(): Promise<FeedsData.SubscribedChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_SUBSCRIPTION_CHANNEL;
        const result = await this.executeSql(statement);
        const subscribedChannelList = this.parseSubscriptionChannelData(result);
        resolve(subscribedChannelList);
      } catch (error) {
        Logger.error(TAG, 'query subscriptionChannel Data error', error);
        reject(error);
      }
    });
  }

  querySubscriptionChannelDataByChannelId(channelId: string): Promise<FeedsData.SubscribedChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_SUBSCRIPTION_CHANNEL + ' WHERE channel_id=?';
        const params = [channelId];
        const result = await this.executeSql(statement, params);
        const subscriptionChannelList = this.parseSubscriptionChannelData(result);

        console.log('queryData-------------------', subscriptionChannelList);
        resolve(subscriptionChannelList);
      } catch (error) {
        Logger.error(TAG, 'query subscriptionChannel Data By ID  error', error);
        reject(error);
      }
    });
  }

  removeSubscriptionChannelData(subscribedChannelV3: FeedsData.SubscribedChannelV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const statement = 'DELETE FROM ' + this.TABLE_SUBSCRIPTION_CHANNEL + ' WHERE channel_id=?'
      const params = [subscribedChannelV3.channelId];
      const result = await this.executeSql(statement, params);
      Logger.log(TAG, 'remove subscription channel result is', result);
      resolve('SUCCESS');
    });
  }

  // SubscriptionV3
  private createSubscriptionTable(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'create table ' + this.TABLE_SUBSCRIPTION
          + '('
          + 'dest_did VARCHAR(64), channel_id VARCHAR(64), user_did VARCHAR(64), created_at VARCHAR(64), display_name VARCHAR(64)'
          + ')';

        const result = await this.executeSql(statement);
        console.log('Create subscription table-------------------', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create subscription table error', error);
        reject(error);
      }
    });
  }

  insertSubscriptionData(subscriptionV3: FeedsData.SubscriptionV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'INSERT INTO ' + this.TABLE_SUBSCRIPTION
          + '(dest_did, channel_id, user_did, created_at, display_name) VALUES'
          + '(?,?,?,?,?)';

        const params = [subscriptionV3.destDid, subscriptionV3.channelId, subscriptionV3.userDid, subscriptionV3.createdAt, subscriptionV3.displayName];

        const result = await this.executeSql(statement, params);
        Logger.log(TAG, 'Insert subscription Data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Insert subscription table date error', error);
        reject(error);
      }
    });
  }

  querySubscriptionList(): Promise<FeedsData.SubscriptionV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_SUBSCRIPTION;
        const result = await this.executeSql(statement);
        const subscriptionList = this.parseSubscriptionData(result);
        resolve(subscriptionList);
      } catch (error) {
        Logger.error(TAG, 'query subscription Data error', error);
        reject(error);
      }
    });
  }

  querySubscriptionDataByChannelId(channelId: string): Promise<FeedsData.SubscriptionV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_SUBSCRIPTION + ' WHERE channel_id=?';
        const params = [channelId];
        const result = await this.executeSql(statement, params);
        const subscriptionList = this.parseSubscriptionData(result);

        console.log('queryData-------------------', subscriptionList);
        resolve(subscriptionList);
      } catch (error) {
        Logger.error(TAG, 'query subscription Data By ID  error', error);
        reject(error);
      }
    });
  }

  removeSubscriptionData(subscriptionV3: FeedsData.SubscriptionV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const statement = 'DELETE * FROM ' + this.TABLE_SUBSCRIPTION_CHANNEL + ' WHERE channel_id=?'
      const params = [subscriptionV3.channelId];
      const result = await this.executeSql(statement, params);
      Logger.log(TAG, 'remove subscription result is', result);
      resolve('SUCCESS');
    });
  }

  // comment
  private createCommentTable(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'create table ' + this.TABLE_COMMENT
          + '('
          + 'dest_did VARCHAR(64), comment_id VARCHAR(64), channel_id VARCHAR(64), post_id VARCHAR(64), refcomment_id VARCHAR(64), content TEXT, created_at REAL(64)'
          + ')';
        const result = await this.executeSql(statement);
        console.log('create Comment table-------------------', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create Comment table error', error);
        reject(error);
      }
    });
  }

  insertCommentData(commentV3: FeedsData.CommentV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'INSERT INTO ' + this.TABLE_CHANNEL
          + '(dest_did, comment_id, channel_id, post_id, refcomment_id, content, created_at) VALUES'
          + '(?,?,?,?,?,?,?)';

        const params = [commentV3.destDid, commentV3.commentId, commentV3.channelId, commentV3.postId, commentV3.refcommentId, JSON.stringify(commentV3.content)
          , commentV3.createdAt];

        const result = await this.executeSql(statement, params);
        Logger.log(TAG, 'Insert comment Data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Insert comment table date error', error);
        reject(error);
      }
    });
  }

  updateCommentData(commentV3: FeedsData.CommentV3) {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'UPDATE ' + this.TABLE_CHANNEL
          + ' SET content=? WHERE comment_id=?'; // 条件是否使用refcomment_id
        const params = [commentV3.destDid, commentV3.commentId, commentV3.channelId, commentV3.postId, commentV3.refcommentId, JSON.stringify(commentV3.content), commentV3.createdAt];
        + '(dest_did, comment_id, channel_id, post_id, refcomment_id, content, created_at) VALUES'

        const result = await this.executeSql(statement, params);
        Logger.log(TAG, 'update comment data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'update comment data error', error);
        reject(error);
      }
    });
  }

  queryCommentById(commentId: string): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_COMMENT + ' WHERE comment_id=?';
        const params = [commentId];
        const result = await this.executeSql(statement, params);
        const commentList = this.parseCommentData(result);

        console.log('queryData-------------------', commentList);
        resolve(commentList);
      } catch (error) {
        Logger.error(TAG, 'query comment Data By ID  error', error);
        reject(error);
      }
    });
  }

  queryCommentData(): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_COMMENT;
        const result = await this.executeSql(statement);
        const commentList = this.parseCommentData(result);
        resolve(commentList);
      } catch (error) {
        Logger.error(TAG, 'query comment Data error', error);
        reject(error);
      }
    });
  }

  queryCommentNum(destDid: string, channelId: string, postId: string, commentId: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT COUNT(*) FROM ' + this.TABLE_COMMENT + ' WHERE comment_id=?'
        const params = [commentId];
        const result = await this.executeSql(statement, params);

        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'Query comment num error', error);
        reject(error);
      }
    });
  }

  // like 
  private createLikeTable(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'create table ' + this.TABLE_LIKE
          + '('
          + 'dest_did VARCHAR(64), channel_id VARCHAR(64), post_id VARCHAR(64), comment_id VARCHAR(64), created_at REAL(64)'
          + ')';
        const result = await this.executeSql(statement);
        console.log('create like table-------------------', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create like table error', error);
        reject(error);
      }
    });
  }

  insertLike(likeV3: FeedsData.LikeV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'INSERT INTO ' + this.TABLE_CHANNEL
          + '(dest_did, channel_id, post_id, comment_id, created_at) VALUES'
          + '(?,?,?,?,?)';
        const params = [likeV3.destDid, likeV3.channelId, likeV3.postId, likeV3.commentId, likeV3.createdAt];

        const result = await this.executeSql(statement, params);
        Logger.log(TAG, 'Insert like result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Insert like table date error', error);
        reject(error);
      }
    });
  }

  queryLikeData(): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_LIKE;
        const result = await this.executeSql(statement);
        const likeList = this.parseLikeData(result);
        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'query comment Data error', error);
        reject(error);
      }
    });
  }

  queryLikeNum(destDid: string, channelId: string, postId: string, commentId: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT COUNT(*) FROM ' + this.TABLE_LIKE + ' WHERE comment_id=?'
        const params = [commentId];
        const result = await this.executeSql(statement, params);

        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'Query comment num error', error);
        reject(error);
      }
    });
  }

  removeLike(likeV3: FeedsData.LikeV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const statement = 'DELETE * FROM ' + this.TABLE_LIKE + ' WHERE dest_did=? & post_id=? & comment_id=? & channel_id=?'
      const params = [likeV3.destDid, likeV3.postId, likeV3.commentId, likeV3.channelId];
      const result = await this.executeSql(statement, params);
      Logger.log(TAG, 'remove like result is', result);
      resolve('SUCCESS');
    });
  }

  test() {
    let testdb: SQLiteObject;
    this.sqlite.create({
      name: 'data.db',
      location: 'default'
    })
      // .then((db: SQLiteObject) => {
      //   testdb = db;

      //   return db.executeSql('create table danceMoves(name VARCHAR(32))', []);
      //   // .then(() => console.log('Executed SQL'))
      //   // .catch(e => console.log(e));


      // })
      .then((db: SQLiteObject) => {
        testdb = db;
        // const statement = 'INSERT INTO ' + this.TABLE_POST
        // + '(post_id, dest_did, channel_id, created_at, updated_at, content, status, type, tag, proof, memo) VALUES'
        // + '(' + postV3.postId + ',' + postV3.destDid + ',' + postV3.channelId + ',' + postV3.createdAt + ',' + postV3.updatedAt
        // + ',' + postV3.content + ',' + postV3.type + ',' + postV3.tag + ',' + postV3.proof + ',' + postV3.memo + ')';

        // console.log('result ==', result);
        return testdb.executeSql('insert into danceMoves(name) values ("new name")', []);
      })
      .then((result) => {
        console.log('result ==', result);
        return testdb.executeSql('select * from danceMoves', []);
      }).then((result) => {
        console.log('result ==', result);
      })
      .catch(e => console.log(e));

  }

  parsePostData(result: any): FeedsData.PostV3[] {
    Logger.log(TAG, 'Parse post result from sql, result is', result);
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      list.push(element);
    }
    Logger.log(TAG, 'Parse post list from sql, list is', list);
    return list;
  }

  parseChannelData(result: any): FeedsData.ChannelV3[] {
    Logger.log(TAG, 'Parse channel result from sql, result is', result);
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      list.push(element);
    }
    Logger.log(TAG, 'Parse channel list from sql, list is', list);
    return list;
  }

  parseCommentData(result: any): FeedsData.CommentV3[] {
    Logger.log(TAG, 'Parse comment result from sql, result is', result);
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      list.push(element);
    }
    Logger.log(TAG, 'Parse comment list from sql, list is', list);
    return list;
  }

  parseLikeData(result: any): FeedsData.LikeV3[] {
    Logger.log(TAG, 'Parse like result from sql, result is', result);
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      list.push(element);
    }
    Logger.log(TAG, 'Parse like list from sql, list is', list);
    return list;
  }

  parseSubscriptionChannelData(result: any): FeedsData.SubscribedChannelV3[] {
    Logger.log(TAG, 'Parse subscription channel result from sql, result is', result);
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      list.push(element);
    }
    Logger.log(TAG, 'Parse subscription channel list from sql, list is', list);
    return list;
  }

  parseSubscriptionData(result: any): FeedsData.SubscriptionV3[] {
    Logger.log(TAG, 'Parse subscription result from sql, result is', result);
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      list.push(element);
    }
    Logger.log(TAG, 'Parse subscription list from sql, list is', list);
    return list;
  }
}
