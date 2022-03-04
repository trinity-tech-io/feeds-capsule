import { Injectable } from '@angular/core';
import { FilesService, ScriptingService, QueryHasResultCondition, Executable, InsertOptions, File as HiveFile, StreamResponseParser, InsertExecutable, FileUploadExecutable, FindExecutable, HiveException, VaultServices, AppContext, Logger as HiveLogger, Utils, File, AppContextParameters, DefaultAppContextProvider, VaultSubscriptionService, UpdateResult, UpdateOptions, HttpClient, AndCondition, FindOptions } from "@dchagastelles/elastos-hive-js-sdk";
import { Claims, DIDDocument, JWTParserBuilder, DID, DIDBackend, DefaultDIDAdapter, JSONObject, VerifiableCredential } from '@elastosfoundation/did-js-sdk';
import { StandardAuthService } from 'src/app/services/StandardAuthService';
import { Console } from 'console';
import { resolve } from 'url';
import { FileService } from 'src/app/services/FileService';
import { Logger } from 'src/app/services/logger';
import { DataHelper } from 'src/app/services/DataHelper';
import { InsertResult } from '@dchagastelles/elastos-hive-js-sdk/typings/restclient/database/insertresult';
import { isEqual, isNil, reject } from 'lodash';
import { on } from 'process';
import { VideoService } from './video.service';
import { stringify } from 'querystring';
import { Events } from 'src/app/services/events.service';

let TAG: string = 'Feeds-HiveService';

let eventBus: Events = null;

@Injectable()
export class HiveService {
  public static readonly CHANNEL = "channel"
  public static readonly POST = "post"
  public static readonly SUBSCRIPTION = "subscription"
  public static readonly TARGETDID = "targetDid"
  public static readonly postId = "channelId"
  private static readonly RESOLVE_CACHE = "data/didCache"
  private static collectName = "feeds_subscription"//标识是否备份到hive
  private static isSync = "feeds_subscription_synchronize" // 标识是否同步数据到本地
  private static createCollection = "feeds_subscription_createCollection" // 本地标识是否创建了Collection
  private static INSTANCE: HiveService
  public context: AppContext
  public vault: VaultServices
  public tarDID: string
  public tarAppDID: string
  public avatarParam: string
  public avatarScriptName: string
  public image = null
  public appinstanceDid: string

  private avatarVC: VerifiableCredential
  constructor(
    private standardAuthService: StandardAuthService,
    private fileService: FileService,
    private dataHelper: DataHelper,
    private events: Events,
  ) {
    console.log("++++++ event = " + events);
    eventBus = events;
  }

  public async creat(appInstanceDocumentString: string, userDidString: string, resolverUrl: string): Promise<AppContext> {
    return new Promise(async (resolve, reject) => {
      try {
        HiveLogger.setDefaultLevel(HiveLogger.TRACE)
        DIDBackend.initialize(new DefaultDIDAdapter("mainnet"))
        AppContext.setupResolver("mainnet", HiveService.RESOLVE_CACHE)
        const rootDirEntry = await this.fileService.resolveLocalFileSystemURL()
        const path = rootDirEntry.fullPath

        let self = this
        this.context = await AppContext.build({
          getLocalDataDir(): string {
            return path
          },
          getAppInstanceDocument(): Promise<DIDDocument> {
            return new Promise(async (resolve, reject) => {
              try {
                let appInstanceDidDocument = DIDDocument._parseOnly(appInstanceDocumentString)
                resolve(appInstanceDidDocument)
              } catch (error) {
                Logger.error(TAG, "get AppInstanceDocument Error: ", error)
                reject(error)
              }
            })
          },
          getAuthorization(jwtToken: string): Promise<string> {
            return new Promise(async (resolve, reject) => {
              try {
                const authToken = await self.standardAuthService.generateHiveAuthPresentationJWT(jwtToken)
                resolve(authToken)
              } catch (error) {
                Logger.error(TAG, "get Authorization Error: ", error)
                reject(error)
              }
            })
          }
        }, userDidString);
        resolve(this.context)
      } catch (error) {
        Logger.error(TAG, "creat Error: ", error)
        reject(error)
      }
    })
  }

  async creatVault() {
    try {
      // auth
      let appinstanceDocument = await this.standardAuthService.getInstanceDIDDoc()
      let userDid = (await this.dataHelper.getSigninData()).did
      const resolverUrl = "https://api.elastos.io/eid"
      // "https://did.elastos.net"
      if (this.context == null) {
        this.context = await this.creat(appinstanceDocument, userDid, resolverUrl)
      }
      // userdid : "did:elastos:ikHP389FhssAADnUwM3RFF415F1wviZ8CC"
      const userDID = DID.from(userDid)
      const userDiddocument = await userDID.resolve()
      const ccount = userDiddocument.getCredentialCount()
      const avatarDid = userDid + "#avatar"
      this.avatarVC = userDiddocument.getCredential(avatarDid)
      console.log("avatarVC ==== ", this.avatarVC)
      if (this.avatarVC != null) { // 有头像
        const sub = this.avatarVC.getSubject()
        const pro = sub.getProperty("avatar")
        const data: string = pro["data"]
        const type = pro["type"]
        const prefix = "hive://"
        this.avatarParam = data.substr(prefix.length)
        const parts = this.avatarParam.split("/")
        // TODO 验证parts是否大于2个 ，否则 抛出异常
        const dids = parts[0].split("@")
        // TODO 验证dids是否等于2个 ，否则 抛出异常
        const star = data.length - (prefix.length + parts[0].length + 1)
        const values = parts[1].split("?")
        // TODO 验证values是否等于2个 ，否则 抛出异常
        this.avatarScriptName = values[0]
        const paramStr = values[1]
        const scriptParam = JSON.parse(paramStr.substr(7))
        // 创建
        this.tarDID = dids[0]
        this.tarAppDID = dids[1]
      }

      const serviceDid = userDid + "#hivevault"
      const service = userDiddocument.getService(serviceDid)
      console.log("service ==== ", service)
      const provider = service.getServiceEndpoint() + ":443"

      const vaultSubscription: VaultSubscriptionService = new VaultSubscriptionService(this.context, provider)
      this.vault = new VaultServices(this.context, provider)
    }
    catch (error) {
      Logger.error(TAG, 'Create vault error:', error);
    }
  }

  async getVault() {
    try {
      if (this.vault == null) {
        await this.creatVault()
      }
      return this.vault
    } catch (error) {
      Logger.error(TAG, 'Get vault error:', error);
    }
  }

  async createCollection(channelName: string): Promise<void> {
    return await (await this.getVault()).getDatabaseService().createCollection(channelName)
  }

  async sendChannle(channelName: string, intro: string, avatar: any): Promise<string> {

    let userDid = (await this.dataHelper.getSigninData()).did
    const postId = localStorage.getItem(userDid + HiveService.postId) || ''
    let channel_id = Number(new Date().getTime().toString())
    // const channel_id = 0
    console.log("channel_id ==== ", channel_id)
    const created_at = this.getCurrentTimeNum()
    const updated_at = this.getCurrentTimeNum()
    const memo = ""
    const doc = { "channel_id": channel_id, "name": channelName, "intro": intro, "avatar": avatar, "created_at": created_at, "updated_at": updated_at, "memo": memo, }
    let result = (await this.getVault()).getDatabaseService().insertOne(HiveService.CHANNEL, doc, new InsertOptions(false, true))
    this.handleResult(
      "create_channel", channel_id, userDid, channelName, channel_id, doc
    );

    return channel_id.toString()
  }

  async sendPost(channel_id: number, content: any, status: string): Promise<number> {
    const post_id = this.dataHelper.generateLastTempIdData()
    const created_at = this.getCurrentTimeNum()
    const update_at = this.getCurrentTimeNum()
    const memo = ""
    const type = ""
    const tag = ""
    const channle = this.dataHelper.getChannel(channel_id.toString())
    // content 中可能包含文字和图片
    const doc = { "channel_id": channel_id, "post_id": post_id, "created_at": created_at, "update_at": update_at, "content": content, "status": status, "memo": memo, "type": type, "tag": tag }
    let result = (await this.getVault()).getDatabaseService().insertOne(HiveService.POST, doc, new InsertOptions(false, true))

    return post_id
  }
  // 查询channel信息
  async registerChannel(channleName: string, channel_id: string) {
    let executablefilter = { "channel_id": channel_id }
    let options = { "projection": { "_id": false }, "limit": 100 }
    let userDid = (await this.dataHelper.getSigninData()).did
    let conditionfilter = { "channel_id": channel_id, "user_did": userDid }
    let scriptingService = (await this.getVault()).getScriptingService()
    console.log("registerChannel ====== ")
    await scriptingService.registerScript(channleName,
      new FindExecutable("find_message", HiveService.CHANNEL, executablefilter, options).setOutput(true),
      new QueryHasResultCondition("verify_user_permission", HiveService.SUBSCRIPTION, conditionfilter, null), false);
  }        
  //  查询指定post内容
  async registerPost(post_id: string, channel_id: string): Promise<string> {
    let executablefilter = { "channel_id": channel_id, "post_id": post_id }
    let options = { "projection": { "_id": false }, "limit": 100 }
    let userDid = (await this.dataHelper.getSigninData()).did
    let conditionfilter1 = { "channel_id": channel_id, "user_did": userDid }
    let conditionfilter2 = { "channel_id": channel_id, "post_id": post_id, "type": "public" }
    let scriptingService = (await this.getVault()).getScriptingService()
    console.log("registerPost ====== ")
    let timeStamp = new Date().getTime().toString()
    let queryCondition1 = new QueryHasResultCondition("subscription_permission", HiveService.SUBSCRIPTION, conditionfilter1, null)
    let queryCondition2 = new QueryHasResultCondition("post_permission", HiveService.POST, conditionfilter2, null)
    let andCondition = new AndCondition("verify_user_permission", [queryCondition1, queryCondition2])
    let findExe = new FindExecutable("find_message", HiveService.POST, executablefilter, options).setOutput(true)

    await scriptingService.registerScript(timeStamp, findExe, andCondition, false, false)

    return timeStamp
  }
  // 查询channel下所有post
  async registerAllPost(channel_id: string): Promise<string> {
    let executablefilter = { "channel_id": channel_id }
    let options = { "projection": { "_id": false }, "limit": 100 }
    let userDid = (await this.dataHelper.getSigninData()).did
    let conditionfilter = { "channel_id": channel_id, "user_did": userDid }
    let scriptingService = (await this.getVault()).getScriptingService()
    console.log("registerPost ====== ")
    let timeStamp = new Date().getTime().toString()
    let queryCondition = new QueryHasResultCondition("verify_user_permission", HiveService.SUBSCRIPTION, conditionfilter, null)
    let findExe = new FindExecutable("find_message", HiveService.POST, executablefilter, options).setOutput(true)

    await scriptingService.registerScript(timeStamp, findExe, queryCondition, false, false)

    return timeStamp
  }

  // 查询时间段的内容
  async registerSomeTimePost(channel_id: string, post_id: string) {
    let executablefilter = { "channel_id": channel_id, "post_id": post_id, "update_at": "" }
    let options = { "projection": { "_id": false }, "limit": 100 }
    let userDid = (await this.dataHelper.getSigninData()).did
    let conditionfilter = { "channel_id": channel_id, "user_did": userDid }
    let scriptingService = (await this.getVault()).getScriptingService()
    console.log("registerPost ====== ")
    let timeStamp = new Date().getTime().toString()
    let queryCondition = new QueryHasResultCondition("verify_user_permission", HiveService.SUBSCRIPTION, conditionfilter, null)
    let findExe = new FindExecutable("find_message", HiveService.POST, executablefilter, options).setOutput(true)

    await scriptingService.registerScript(timeStamp, findExe, queryCondition, false, false)

    return timeStamp
  }

  // 
  async callChannel(scriptName: string, channel_id: string) {
    let scriptingService = (await this.getVault()).getScriptingService()
    let userDid = (await this.dataHelper.getSigninData()).did
    let appinstanceDid = (await this.standardAuthService.getInstanceDID()).getDIDString()
    let appid = await this.standardAuthService.getAppId()
    console.log("appid ===== ", appid)
    console.log("userDid ===== ", userDid)
    let result = await scriptingService.callScript<any>(scriptName, { "channel_id": channel_id }, userDid, appid)
    console.log("callChannel result ======= ", result)
  }


  // 查询指定的post
  async callPost(scriptName: string, channel_id: string) {
    let scriptingService = (await this.getVault()).getScriptingService()
    let userDid = (await this.dataHelper.getSigninData()).did
    let appinstanceDid = (await this.standardAuthService.getInstanceDID()).getDIDString()
    let appid = await this.standardAuthService.getAppId()
    console.log("appid ===== ", appid)
    console.log("userDid ===== ", userDid)
    let result = await scriptingService.callScript<any>(scriptName, { "channel_id": channel_id }, userDid, appid)
    console.log("callChannel result ======= ", result)
  }

  // 订阅
  async subscriptions(channel_id: string) {
    let userDid = (await this.dataHelper.getSigninData()).did

    const channel = this.dataHelper.getChannel(channel_id.toString())
    let document = { "channel_id": channel_id, "user_did": userDid, "created_at": channel.created_at, "display_name": channel.name }
    let options = { "projection": { "_id": false } }
    let conditionfilter = { "channel_id": channel_id, "type": "public" }
    let scriptingService = (await this.getVault()).getScriptingService()
    console.log("registerPost ====== ")
    let timeStamp = new Date().getTime().toString()
    // 此nama与订阅频道无关，可随意取，保持在vault中唯一即可，此处为确定唯一使用时间戳
    await scriptingService.registerScript(timeStamp, new InsertExecutable("database_insert", HiveService.SUBSCRIPTION, document, options), new QueryHasResultCondition("verify_user_permission", HiveService.CHANNEL, conditionfilter, null))
  }

  async updatePost(channelName: string, channel_id: number, origin: any, content: any, status: string): Promise<UpdateResult> {
    // const channle = this.dataHelper.getChannel(channel_id.toString())
    const post_id = 0 // todo
    const created_at = this.getCurrentTimeNum()
    const update_at = this.getCurrentTimeNum()
    const memo = ""
    const type = ""
    const tag = ""
    // content 中可能包含文字和图片
    const update = { "channel_id": channel_id, "post_id": post_id, "created_at": created_at, "update_at": update_at, "content": content, "status": status, "memo": memo, "type": type, "tag": tag }
    let updateNode = { "$set": update }
    const doc = { "channel_id": channel_id, "post_id": post_id, "created_at": created_at, "update_at": update_at, "content": content, "status": status, "memo": memo, "type": type, "tag": tag }
    return (await this.getVault()).getDatabaseService().updateOne(channelName, origin, updateNode, new UpdateOptions(false, true))
  }

  async deleatePost(channelName: string, one: any,): Promise<void> {
    return (await this.getVault()).getDatabaseService().deleteOne(channelName, one)
  }

  async getMyChannelList() {
    let userDid = (await this.dataHelper.getSigninData()).did
    this.dataHelper.getMyChannelListWithHive(userDid)
  }

  handleResult(
    method: string,
    channel_id: number,
    userDid: string,
    channleName: string,
    post_id: any,
    request: any,
  ) {
    let requestParams = request.requestParams;
    switch (method) {
      // 在这里存到了本地
      case FeedsData.MethodType.create_channel:
        this.handleCreateChannelResult(channel_id, userDid, post_id, channleName, request);
        break;
    }
  }

  handleCreateChannelResult(
    channel_id: number,
    userDid: string,
    post_id: any,
    channleName: string,
    request: any
  ) {
    // let channel_id = result.channel_id;
    let created_at = request.created_at;
    let updated_at = request.updated_at;
    let name = request.name;
    let introduction = request.intro;
    let avatar = request.avatar;
    let memo = request.memo;
    let type = request.type;

    let channelId = channel_id
    // let channelName = channleName
    let channelIntro = request.intro
    console.log("created_at ==== ", created_at)
    console.log("updated_at ==== ", updated_at)
    console.log("channelId ===== ", request)
    // let owner_name = this.getSignInData().name;
    // let owner_did = this.getSignInData().did;
    let avatarBin = request.avatar;
    // let avatar = this.serializeDataService.decodeData(avatarBin);
    let nodeChannelId = userDid + HiveService.CHANNEL

    console.log("nodeChannelId ===== ", nodeChannelId)
    console.log("channel_id ===== ", channel_id)
    console.log("name ===== ", name)

    let channel: FeedsData.Channels = {
      channel_id: channel_id,
      created_at: created_at,
      updated_at: updated_at,
      name: name,
      introduction: introduction,
      avatar: avatar,
      memo: memo,
      type: type,

      nodeId: nodeChannelId,
      id: 0,
      // name: channelName,
      // introduction: channelIntro,
      owner_name: "123",
      owner_did: "321",
      subscribers: 0,
      last_update: this.getCurrentTimeNum(),
      last_post: '',
      // avatar: avatar,
      isSubscribed: false,
    };
    this.dataHelper.updateChannel(channelId.toString(), channel)
    localStorage.setItem(userDid + HiveService.postId, channelId.toString())

    // this.hiveService.insertOne(channel)
    // this.subscribeChannel(nodeId, channelId);
    console.log("++++++ event = " + eventBus);
    let createTopicSuccessData: FeedsEvent.CreateTopicSuccessData = {
      nodeId: userDid,
      channelId: channelId,
    };
    eventBus.publish(
      FeedsEvent.PublishType.createTopicSuccess,
      createTopicSuccessData,
    );
    eventBus.publish(FeedsEvent.PublishType.channelsDataUpdate);
  }

  getCurrentTimeNum(): number {
    return new Date().getTime();
  }

  async downloadEssAvatar() {
    try {
      // 检测本地是否存在
      let userDid = (await this.dataHelper.getSigninData()).did
      const loadKey = userDid + "_ess_avatar"
      let essavatar = await this.dataHelper.loadUserAvatar(loadKey)
      if (essavatar) {
        return
      }
      let scriptingService: ScriptingService
      const vault = await this.getVault()
      if (this.avatarVC === null) {
        return
      }
      scriptingService = vault.getScriptingService()
      const result = await scriptingService.callScript(this.avatarScriptName, this.avatarParam, this.tarDID, this.tarAppDID)
      const transaction_id = result["download"]["transaction_id"]
      let self = this
      let dataBuffer = await scriptingService.downloadFile(transaction_id)

      const savekey = userDid + "_ess_avatar"
      const rawImage = await rawImageToBase64DataUrl(dataBuffer)
      self.dataHelper.saveUserAvatar(savekey, rawImage)
    }
    catch (error) {
      Logger.error(TAG, "Download Ess Avatar error: ", error);
    }
  }

  async uploadCustomeAvatar(remotePath: string, img: any) {
    try {
      const vault = await this.getVault()
      const fileService = vault.getFilesService()
      const file = await fileService.upload(remotePath, Buffer.from(img, 'utf8'))
    }
    catch (error) {
      Logger.error(TAG, "Upload custome avatar error: ", error);
    }
  }

  async downloadCustomeAvatar(remotePath: string) {
    try {
      // 检测本地是否存在
      let userDid = (await this.dataHelper.getSigninData()).did
      let avatar = await this.dataHelper.loadUserAvatar(userDid);

      if (avatar) {
        return
      }

      const vault = await this.getVault()
      const fileService = vault.getFilesService()
      let self = this
      let imgstr = ''
      try {
        var dataBuffer = await fileService.download(remotePath)
        // dataBuffer = dataBuffer.slice(1, -1)
        imgstr = dataBuffer.toString()
        self.dataHelper.saveUserAvatar(userDid, imgstr)
      } catch (error) {
        Logger.error(TAG, 'Download custom avatar error: ', JSON.stringify(error))
      }
    } catch (error) {
      Logger.error(TAG, 'Download error', error)
    }
  }

  async backupSubscriptionToHive() {
    try {
      const list = this.dataHelper.getSubscribedFeedsList()
      let userDid = (await this.dataHelper.getSigninData()).did

      const feeds_logo_subscription = localStorage.getItem(userDid + HiveService.collectName) || ''
      const feeds_logo_createCollection = localStorage.getItem(userDid + HiveService.createCollection) || ''
      const isSync = localStorage.getItem(userDid + HiveService.isSync) || ''

      if (isSync === '' && list.length === 0 && feeds_logo_subscription === '') { // 新用户/换手机
        let query = {}
        const vault = await this.getVault()
        // 容错处理： 新用户去hive端拿备份数据 会拿不到error，会有风险 // 
        localStorage.setItem(HiveService.isSync, "true")
        const result = await vault.getDatabaseService().query(HiveService.collectName, query, null)

        let i = 0
        let array = []
        result.forEach((obj) => {
          const nodeId = obj["nodeId"].toString()
          const channelId = Number(obj["id"])
          const name = obj["name"].toString()
          const desc = obj["introduction"].toString()
          const owner_name = obj["owner_name"].toString()
          const owner_did = obj["owner_did"].toString()
          const subscribers = Number(obj["subscribers"])
          const last_update = Number(obj["last_update"])
          const last_post = obj["last_post"].toString()
          const avatar = obj["avatar"].toString()
          const isSubscribed = Boolean(obj["isSubscribed"])
          const nodeChannelId = this.dataHelper.getKey(nodeId, channelId, 0, 0)

          let channel_id = 0
          let created_at = 0
          let updated_at = 0
          // let name = 
          let introduction = desc
          // let avatar = ""
          let memo = ""
          let type = ""

          array.push(nodeChannelId)
          i = i + 1
          let channel: FeedsData.Channels = {
            channel_id: channel_id,
            created_at: created_at,
            updated_at: updated_at,
            name: name,
            introduction: introduction,
            avatar: avatar,
            memo: memo,
            type: type,

            nodeId: nodeId,
            id: channelId,
            // name: name,
            // introduction: desc,
            owner_name: owner_name,
            owner_did: owner_did,
            subscribers: subscribers,
            last_update: last_update,
            last_post: last_post,
            // avatar: avatar,
            isSubscribed: isSubscribed,
          }

          this.dataHelper.updateChannel(nodeChannelId, channel)
        })

        const list0 = this.dataHelper.getSubscribedFeedsList() //删除

        localStorage.setItem(userDid + HiveService.isSync, "true")
        localStorage.setItem(userDid + HiveService.createCollection, "true")
      }
      else if (feeds_logo_subscription === '' && feeds_logo_createCollection != '' && list.length > 0) {
        let vault = await this.getVault()
        await vault.getDatabaseService().insertMany(HiveService.collectName, list, new InsertOptions(false, true))
        localStorage.setItem(userDid + HiveService.collectName, "true")
      }
      else if (feeds_logo_createCollection === '' && list.length > 0) {
        // const status = await this.createCollection(userDid, list);
      }
    }
    catch (error) {
      Logger.error(TAG, 'Backup error', error);
    }
  }

  async insertOne(one: any) {
    try {
      // 检测app启动时是否 备份成功
      let userDid = (await this.dataHelper.getSigninData()).did
      const feeds_subscription = localStorage.getItem(userDid + HiveService.collectName) || ''
      if (feeds_subscription === '') {
        this.backupSubscriptionToHive()
      }
      else {
        let vault = await this.getVault()
        let result = vault.getDatabaseService().insertOne(HiveService.collectName, one, new InsertOptions(false, true))
        Logger.log(TAG, 'Insert success', result);
      }
    }
    catch (error) {
      Logger.error(TAG, 'Insert error:', error);
    }
  }

  async deleteOne(one: any) {
    try {
      let userDid = (await this.dataHelper.getSigninData()).did
      const feeds_subscription = localStorage.getItem(userDid + HiveService.collectName) || ''
      if (feeds_subscription === '') {
        // 如果本地没有本分成功，则直接返回，不做处理
        this.backupSubscriptionToHive()
      }
      else {
        let vault = await this.getVault()
        let result = vault.getDatabaseService().deleteOne(HiveService.collectName, one)
        Logger.log(TAG, 'Delete success', result);
      }
    } catch (error) {
      Logger.error(TAG, 'Delete error', error);
    }
  }

  async updateOne(origin: FeedsData.Channels, update: FeedsData.Channels) {
    try {
      let userDid = (await this.dataHelper.getSigninData()).did
      const feeds_subscription = localStorage.getItem(userDid + HiveService.collectName) || ''

      if (feeds_subscription === '') {
        // 如果本地没有本分成功，则直接返回，不做处理
        this.backupSubscriptionToHive()
      }
      else {
        let vault = await this.getVault()
        let updateNode = { "$set": update }
        let result = vault.getDatabaseService().updateOne(HiveService.collectName, origin, updateNode, new UpdateOptions(false, true))
        Logger.log(TAG, 'Update success', result);
      }
    } catch (error) {
      Logger.error(TAG, 'Update error', error);
    }
  }
/*
  createCollection(userDid: string, list: FeedsData.Channels[]): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let vault = await this.getVault()
      // localStorage.setItem(userDid + HiveService.createCollection, "true")// 容错：拿不到error
      let createCollectionFlag = localStorage.getItem(userDid + HiveService.createCollection) || ""

      if (!createCollectionFlag) {
        try {
          await vault.getDatabaseService().createCollection(HiveService.collectName)
          createCollectionFlag = "true";
          localStorage.setItem(userDid + HiveService.createCollection, createCollectionFlag)
        } catch (error) {
        }
      }

      if (!createCollectionFlag) {
        resolve('NotFinish');
        return;
      }

      try {
        await vault.getDatabaseService().insertMany(HiveService.collectName, list, new InsertOptions(false, true))
        localStorage.setItem(userDid + HiveService.collectName, "true")
        resolve('Finish');
      } catch (error) {
      }
    })

  }
  */
}

interface Mime {
  mime: string;
  pattern: (number | undefined)[];
}

const imageMimes: Mime[] = [
  {
    mime: 'image/png',
    pattern: [0x89, 0x50, 0x4e, 0x47]
  },
  {
    mime: 'image/jpeg',
    pattern: [0xff, 0xd8, 0xff]
  },
  {
    mime: 'image/gif',
    pattern: [0x47, 0x49, 0x46, 0x38]
  },
  {
    mime: 'image/webp',
    pattern: [0x52, 0x49, 0x46, 0x46, undefined, undefined, undefined, undefined, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50],
  }
];

/**
 * Encodes a raw binary picture data into a base64 string.
 * Ex: âPNG   IHDR... ---> "iVe89...."
 */
export function rawImageToBase64(rawImageData: Buffer): string {
  if (!rawImageData)
    return null

  return Buffer.from(rawImageData).toString("base64")
}

/**
 * Converts a base64 encoded raw binary picture data into its original raw binary buffer.
 * Ex: "iVe89...." ---> âPNG   IHDR...
 */
export function base64ImageToBuffer(base64Picture: string): Buffer {
  return Buffer.from(base64Picture, "base64")
}

/**
 * Converts a raw binary picture data to a base64 data url usable on UI.
 * Ex: âPNG   IHDR... ---> "data:image/png;base64,iVe89...."
 */
export async function rawImageToBase64DataUrl(rawImageData: Buffer): Promise<string> {
  if (!rawImageData)
    return null;

  let mimeType = await pictureMimeType(rawImageData)
  if (!mimeType) {
    Logger.warn("picturehelper", "Unable to extract mime type from picture buffer. rawImageToBase64DataUrl() returns null picture.")
    return null
  }

  return "data:" + mimeType + ";base64," + rawImageToBase64(rawImageData)
}

/**
 * Returns a 1x1 px fully transparent picture, encoded as base64 data url.
 * Use https://png-pixel.com/ to generate.
 */
export function transparentPixelIconDataUrl(): string {
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
}

function isMime(bytes: Uint8Array, mime: Mime): boolean {
  return mime.pattern.every((p, i) => !p || bytes[i] === p)
}

/**
 * @param rawOrBase64ImageData Raw picture buffer, or base64 encoded raw picture (not a base64 data url)
 */
export function pictureMimeType(rawOrBase64ImageData: Buffer | string): Promise<string> {
  if (typeof rawOrBase64ImageData === "string")
    rawOrBase64ImageData = base64ImageToBuffer(rawOrBase64ImageData)

  const numBytesNeeded = Math.max(...imageMimes.map(m => m.pattern.length))
  const blob = new Blob([rawOrBase64ImageData.slice(0, numBytesNeeded)]) // Read the needed bytes of the file

  const fileReader = new FileReader()
  let p = new Promise<string>((resolve) => {
    fileReader.onloadend = e => {
      if (!e || !fileReader.result) {
        resolve(null)
        return
      }

      const bytes = new Uint8Array(fileReader.result as ArrayBuffer)

      const mime = imageMimes.find(mime => isMime(bytes, mime))

      if (!mime)
        resolve(null)
      else
        resolve(mime.mime)
    };
  });

  fileReader.readAsArrayBuffer(blob)

  return p
}