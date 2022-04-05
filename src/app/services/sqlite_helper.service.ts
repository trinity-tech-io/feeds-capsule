import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { Logger } from './logger';

const TAG: string = 'sqlite-helper';

@Injectable()
export class FeedsSqliteHelper {
  private readonly TABLE_POST: string = 'poststest';
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
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create table error', error);
        reject(error);
      }
    });
  }


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

  deletePostData(postId: string) {

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
}
