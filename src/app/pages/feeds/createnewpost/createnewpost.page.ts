import { Component, OnInit, NgZone,ElementRef,ViewChild} from '@angular/core';
import {  NavController, Events,ModalController,Platform,IonTextarea} from '@ionic/angular';
import { FeedService } from '../../../services/FeedService';
import { NativeService } from '../../../services/NativeService';
import { CameraService } from '../../../services/CameraService';
import { ThemeService } from '../../../services/theme.service';
import { TranslateService } from "@ngx-translate/core";
import { VideoEditor } from '@ionic-native/video-editor/ngx';
import { AppService } from '../../../services/AppService';
import { UtilService } from '../../../services/utilService';
import { LogUtils } from '../../../services/LogUtils';
import { StorageService } from '../../../services/StorageService';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
let TAG: string = "Feeds-createpost";

@Component({
  selector: 'app-createnewpost',
  templateUrl: './createnewpost.page.html',
  styleUrls: ['./createnewpost.page.scss'],
})

export class CreatenewpostPage implements OnInit {
  @ViewChild('newPostIonTextarea', {static: false}) newPostIonTextarea:IonTextarea;
  public connectionStatus = 1;
  public nodeStatus = {};
  public channelAvatar = "";
  public channelName = "";
  public subscribers: string = "";
  public newPost: string= "";
  public imgUrl: string = "";
  public nodeId: string = "";
  public channelId: number = 0;

  public posterImg:any = "";
  public flieUri:string = "";
  public uploadProgress:number = 0;
  public videotype:string = "video/mp4";
  public transcode:number = 0;
  public duration:any =0;

  private postId = 0;
  private sessionState = -1;

  public totalProgress:number = 0;
  private throwMsgTransDataLimit = 4 * 1000 * 1000;
  private transDataChannel:FeedsData.TransDataChannel = FeedsData.TransDataChannel.MESSAGE;
  public fullScreenmodal:any ="";

  public feedList = [];
  public hideSwitchFeed:boolean = false;
  constructor(
    private platform: Platform,
    private events: Events,
    private native: NativeService,
    private navCtrl: NavController,
    private camera: CameraService,
    private zone: NgZone,
    private feedService: FeedService,
    public theme:ThemeService,
    private translate:TranslateService,
    public videoEditor:VideoEditor,
    public appService:AppService,
    public el:ElementRef,
    public modalController:ModalController,
    private logUtils: LogUtils,
    private storageService: StorageService,
  ) {
  }

  ngOnInit() {

  }

  newPostTextArea(){
    this.newPostIonTextarea.setFocus();
  }

  initFeed(){

    let currentFeed = this.feedService.getCurrentFeed();

    this.nodeId = currentFeed["nodeId"];
    this.channelId = currentFeed["feedId"];

    let myFeed = this.feedService.getChannelFromId(this.nodeId,this.channelId) || {};

    this.channelName = myFeed["name"] || "";
    this.subscribers = myFeed["subscribers"] || "";
    this.channelAvatar = this.feedService.parseChannelAvatar(myFeed["avatar"]);
  }

  ionViewWillEnter() {

    this.feedList = this.feedService.getMyChannelList() || [];
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);

    this.connectionStatus = this.feedService.getConnectionStatus();
    this.initFeed();

    this.events.subscribe(FeedsEvent.PublishType.connectionChanged,(status) => {
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.friendConnectionChanged, (nodeId, status)=>{
      this.zone.run(()=>{
        this.nodeStatus[nodeId] = status;
        // if (this.connectionStatus == 0 && this.nodeId == nodeId && status == 0){
        //   this.feedService.restoreSession(this.nodeId);
        // }
      });
     });

export class CreatenewpostPage implements OnInit {
    @ViewChild('newPostIonTextarea', {static: false}) newPostIonTextarea:IonTextarea;
    public connectionStatus = 1;
    public nodeStatus = {};
    public channelAvatar = "";
    public channelName = "";
    public subscribers: string = "";
    public newPost: string= "";
    public imgUrl: string = "";
    public nodeId: string = "";
    public channelId: number = 0;

    public posterImg:any = "";
    public flieUri:string = "";
    public uploadProgress:number = 0;
    public videotype:string = "video/mp4";
    public transcode:number = 0;
    public duration:any =0;

    private postId = 0;
    private sessionState = -1;

    public totalProgress:number = 0;
    private throwMsgTransDataLimit = 4 * 1000 * 1000;
    private transDataChannel:FeedsData.TransDataChannel = FeedsData.TransDataChannel.MESSAGE;
    public fullScreenmodal:any ="";

    public feedList = [];
    public hideSwitchFeed:boolean = false;
    constructor(
      private platform: Platform,
      private events: Events,
      private native: NativeService,
      private navCtrl: NavController,
      private camera: CameraService,
      private zone: NgZone,
      private feedService: FeedService,
      public theme:ThemeService,
      private translate:TranslateService,
      public videoEditor:VideoEditor,
      public appService:AppService,
      public el:ElementRef,
      public modalController:ModalController,
      private logUtils: LogUtils,
      private storageService: StorageService,
    ) {}

    ngOnInit() {

    }

    newPostTextArea(){
      this.newPostIonTextarea.setFocus();
    }

    initFeed(){

      let currentFeed = this.feedService.getCurrentFeed();

      this.nodeId = currentFeed["nodeId"];
      this.channelId = currentFeed["feedId"];

      let myFeed = this.feedService.getChannelFromId(this.nodeId,this.channelId) || {};

      this.channelName = myFeed["name"] || "";
      this.subscribers = myFeed["subscribers"] || "";
      this.channelAvatar = this.feedService.parseChannelAvatar(myFeed["avatar"]);
    }

    ionViewWillEnter() {
      this.feedList = this.feedService.getMyChannelList() || [];
      this.initTitle();
      this.native.setTitleBarBackKeyShown(true);

      this.connectionStatus = this.feedService.getConnectionStatus();
      this.initFeed();

      this.events.subscribe(FeedsEvent.PublishType.connectionChanged,(status) => {
        this.zone.run(() => {
          this.connectionStatus = status;
        });
      });

      this.events.subscribe(FeedsEvent.PublishType.friendConnectionChanged, (nodeId, status)=>{
        this.zone.run(()=>{
          this.nodeStatus[nodeId] = status;
          // if (this.connectionStatus == 0 && this.nodeId == nodeId && status == 0){
          //   this.feedService.restoreSession(this.nodeId);
          // }
        });
      });

      this.events.subscribe(FeedsEvent.PublishType.publishPostSuccess, (postId) => {
        this.postId = postId;
        this.zone.run(()=>{
          if(this.imgUrl === "" && this.posterImg ===""){
            this.zone.run(() => {
              this.navCtrl.pop().then(()=>{
                this.events.publish(FeedsEvent.PublishType.updateTab, true);
                this.native.toast_trans("CreatenewpostPage.tipMsg1");
              });
            });
            return;
          }

          // this.feedService.sendData(this.nodeId,this.channelId,postId, 0 ,0, this.flieUri,this.imgUrl);
        });
      });

      this.events.subscribe(FeedsEvent.PublishType.declarePostSuccess, (postId, tempId) => {
        this.zone.run(()=>{
          this.postId = postId;
          if (this.transDataChannel == FeedsData.TransDataChannel.MESSAGE){
            this.feedService.sendDataFromMsg(this.nodeId,this.channelId,postId, 0 ,0, this.flieUri,this.imgUrl, tempId);
            return;
          }

          if (this.transDataChannel == FeedsData.TransDataChannel.SESSION){
            if (this.sessionState === FeedsData.StreamState.CONNECTED)
              this.feedService.sendData(this.nodeId,this.channelId,this.postId, 0 ,0, this.flieUri,this.imgUrl, tempId);
              this.native.updateLoadingMsg(this.translate.instant("common.uploading"));
            return;
          }
        });
      });



      this.events.subscribe(FeedsEvent.PublishType.rpcRequestError, () => {
        //this.pauseVideo();
      });

      this.events.subscribe(FeedsEvent.PublishType.rpcResponseError, () => {
        this.zone.run(() => {
          //this.pauseVideo();
        });
      });

      this.events.subscribe(FeedsEvent.PublishType.updateTitle,()=>{
        this.initTitle();
      });

      // this.events.subscribe(FeedsEvent.PublishType.setBinaryFinish, (nodeId, tempId) => {
      //   this.zone.run(() => {
      //     if (this.postId != 0){
      //       this.feedService.closeSession(this.nodeId);
      //       this.feedService.notifyPost(this.nodeId, this.channelId, this.postId, tempId);
      //     }
      //   });
      // });

      // this.events.subscribe(FeedsEvent.PublishType.streamSetBinarySuccess, (nodeId, tempId) => {
      //   this.zone.run(() => {
      //     if (this.postId != 0){
      //       this.feedService.closeSession(this.nodeId);
      //       this.feedService.notifyPost(this.nodeId, this.channelId, this.postId, tempId);
      //     }
      //   });
      // });

      // this.events.subscribe(FeedsEvent.PublishType.notifyPostSuccess, () => {
      //   this.zone.run(() => {
      //       this.backHome();
      //   });
      // });


      this.events.subscribe(FeedsEvent.PublishType.streamError, (nodeId, response) => {
        this.zone.run(() => {
          //response.code
          this.feedService.closeSession(this.nodeId);
        });
      });

      this.events.subscribe(FeedsEvent.PublishType.streamProgress,(nodeId,progress)=>{
        this.zone.run(() => {
          this.native.updateLoadingMsg(this.translate.instant("common.uploading")+" "+progress+"%");
        });
      })

      // this.events.subscribe(FeedsEvent.PublishType.streamOnStateChangedCallback, (nodeId, state) => {
      //   this.zone.run(() => {
      //     this.sessionState = state;
      //     if (state === 4 && this.postId != 0){
      //       this.feedService.sendData(this.nodeId,this.channelId,this.postId, 0 ,0, this.flieUri,this.imgUrl);
      //       this.native.updateLoadingMsg(this.translate.instant("common.uploading"));
      //     }
      //   });
      // });

      this.events.subscribe(FeedsEvent.PublishType.openRightMenu,()=>{
        //this.clVideo();
        this.pauseVideo();
        this.hideFullScreen();
      });


      this.initnodeStatus();

      this.feedService.checkBindingServerVersion(()=>{
        this.zone.run(() => {
          this.navCtrl.pop().then(()=>{
            this.feedService.hideAlertPopover();
          });
        });
      });

    }

    ionViewWillLeave(){
      this.hideSwitchFeed = false;
      this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
      this.events.unsubscribe(FeedsEvent.PublishType.friendConnectionChanged);
      this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
      this.events.unsubscribe(FeedsEvent.PublishType.publishPostSuccess);
      this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestError);
      this.events.unsubscribe(FeedsEvent.PublishType.rpcResponseError);

      // this.events.unsubscribe(FeedsEvent.PublishType.setBinaryFinish);

      // this.events.unsubscribe(FeedsEvent.PublishType.streamSetBinarySuccess);
      this.events.unsubscribe(FeedsEvent.PublishType.streamError);
      this.events.unsubscribe(FeedsEvent.PublishType.streamOnStateChangedCallback);
      this.events.unsubscribe(FeedsEvent.PublishType.streamGetBinarySuccess);
      this.events.unsubscribe(FeedsEvent.PublishType.openRightMenu);
      this.events.unsubscribe(FeedsEvent.PublishType.streamProgress);

      this.events.unsubscribe(FeedsEvent.PublishType.declarePostSuccess);
      this.events.unsubscribe(FeedsEvent.PublishType.notifyPostSuccess);

      this.hideFullScreen();

      this.imgUrl="";
      this.transcode = 0;
      this.uploadProgress =0;
      this.totalProgress = 0;
      this.removeVideo();
      this.events.publish(FeedsEvent.PublishType.addBinaryEvevnt);
      this.feedService.closeSession(this.nodeId);
    }

    ionViewDidEnter() {}

    initTitle(){
      titleBarManager.setTitle(this.translate.instant("CreatenewpostPage.addingPost"));
    }

    post(){
      this.zone.run(async () => {
        let newPost = this.native.iGetInnerText(this.newPost);

        if(this.feedService.getConnectionStatus() != 0){
          this.native.toastWarn('common.connectionError');
          return;
        }
  
        if(this.checkServerStatus(this.nodeId) != 0){
          this.native.toastWarn('common.connectionError1');
          return;
        }
  
        if (newPost === "" && this.imgUrl === ""&&this.flieUri === ""){
          this.native.toast_trans("CreatenewpostPage.tipMsg");
          return false;
        }
        if(this.posterImg!=""&& this.flieUri=== ""){
            this.native.toast_trans("CreatenewpostPage.tipMsg2");
            return false;
        }
  
        await this.sendPost();
        this.backHome();
      });
    }

    prepareTempPost(){

    }

    async sendPost(){
      let tempPostId = this.feedService.generateTempPostId();
      if (this.imgUrl == ""&& this.flieUri == ""){
        let content = this.feedService.createContent(this.newPost,null,null);
        this.feedService.publishPost(
          this.nodeId,
          this.channelId,
          content,
          tempPostId
        );
        return ;
      }

      await this.publishPostThrowMsg(tempPostId);
    }

    async publishPostThrowMsg(tempPostId: number){
      let videoSize = this.flieUri.length;
      let imgSize = this.imgUrl.length;

      if (videoSize > this.throwMsgTransDataLimit || imgSize > this.throwMsgTransDataLimit){
        this.transDataChannel = FeedsData.TransDataChannel.SESSION
        this.feedService.restoreSession(this.nodeId);
      }else{
        this.transDataChannel = FeedsData.TransDataChannel.MESSAGE
      }

      let content = "";
      if (this.flieUri != ""){
        let videoThumbs: FeedsData.VideoThumb = {
          videoThumb  :   this.posterImg,
          duration    :   this.duration,
          videoSize   :   videoSize
        };
        content = this.feedService.createContent(this.newPost, null, videoThumbs);
      }

      if (this.imgUrl != ""){
        let imageThumb = await this.feedService.compress(this.imgUrl);
        let imgThumbs: FeedsData.ImgThumb[] = [];
          let imgThumb: FeedsData.ImgThumb = {
            index   : 0,
            imgThumb: imageThumb,
            imgSize : imgSize
          }
          imgThumbs.push(imgThumb);

          content = this.feedService.createContent(this.newPost,imgThumbs,null);
        // this.feedService.compress(this.imgUrl).then((imageThumb)=>{
          
        // });
      }

      this.feedService.declarePost(this.nodeId,this.channelId,content,false,tempPostId,
            this.transDataChannel,this.imgUrl,this.flieUri)
    }
    
    addImg(type: number) {
      this.camera.openCamera(
        30, 0, type,
        (imageUrl: any) => {
          this.zone.run(() => {
            this.imgUrl = imageUrl;
          });
        },
        (err: any) => {
          console.error('Add img err', err);
          let imgUrl = this.imgUrl || "";
          if(imgUrl) {
            this.native.toast_trans('common.noImageSelected');
          }
        }
      );
    }

    showBigImage(content: any){
      this.native.openViewer(content,"common.image","CreatenewpostPage.addingPost",this.appService);
    }

    checkServerStatus(nodeId: string){
      return this.feedService.getServerStatusFromId(nodeId);
    }

    initnodeStatus(){
      let status = this.checkServerStatus(this.nodeId);
      this.nodeStatus[this.nodeId] = status;
    }

    pressName(channelName:string){
      this.native.createTip(channelName);
    }

    videocam(){
      this.removeVideo();
      navigator.device.capture.captureVideo((videosdata:any)=>{
        this.zone.run(()=>{
          let videodata = videosdata[0];
          this.getVideoInfo(videodata['fullPath']);
        });
      }, (error)=>{
        this.logUtils.loge("Excute 'videocam' in createpost page is error , captureVideo error, error msg is "+JSON.stringify(error),TAG);
      }, {limit:1,duration:15});
    }

    selectvideo(){
        this.removeVideo();
        this.transcode =0;
        this.uploadProgress =0;
        this.totalProgress = 0;
        this.camera.getVideo().then((flieUri:string)=>{
          let path = flieUri.startsWith('file://') ? flieUri : `file://${flieUri}`;
          this.getVideoInfo(path);
        }).catch((err)=>{
          this.logUtils.loge("Excute 'selectvideo' in createpost page is error , getVideo error, error msg is "+JSON.stringify(err),TAG);
        })
    }

    async getVideoInfo(fileUri:string){
      let videoInfo = await this.videoEditor.getVideoInfo({ fileUri:fileUri });
      this.duration = videoInfo["duration"];
      if(parseInt(this.duration) >15){
        this.flieUri ="";
        this.posterImg ="";
        this.imgUrl="";
        this.transcode = 0;
        this.uploadProgress =0;
        this.totalProgress = 0;
        this.native.toast(this.translate.instant("common.filevideodes"));
        return;
      }
      this.createThumbnail(fileUri);
    }


    readFile(fileName:string,filepath:string){
      window.resolveLocalFileSystemURL(filepath,
        (dirEntry: CordovaFilePlugin.DirectoryEntry)=>{
          dirEntry.getFile(fileName,
            { create: true, exclusive: false },
            (fileEntry) => {

              fileEntry.file((file)=>{
                let fileReader = new FileReader();
                fileReader.onloadend =(event:any)=>{
                this.zone.run(()=>{
                    let result = fileReader.result;
                    if (typeof result == "string")
                      this.flieUri = result;
                    else{
                      ab2str(result,function(str){
                        this.flieUri = str;
                      });
                    }

                    let sid = setTimeout(()=>{
                    //let img = new Image;
                    this.setFullScreen();
                    let video:any = document.getElementById("videocreatepost") || "";
                    video.setAttribute("poster",this.posterImg);
                    this.setOverPlay(this.flieUri)
                    clearInterval(sid);
                    },0);
                })
                };

                fileReader.onprogress = (event:any)=>{
                  this.zone.run(()=>{
                    this.uploadProgress = parseInt((event.loaded/event.total)*100/2+'');
                    if(this.uploadProgress === 50){
                      this.totalProgress = 100;
                    }else{
                      this.totalProgress = 50+this.uploadProgress;
                    }
                  })
                };

                fileReader.readAsDataURL(file);

            },(err)=>{
              this.logUtils.loge("Excute 'readFile' in createpost page is error , readVideo error, error msg is "+JSON.stringify(err),TAG);
            });
            },
            (err)=>{
              this.logUtils.loge("Excute 'readFile' in createpost page is error , getFile error, error msg is "+JSON.stringify(err),TAG);
            });
        },
        (err:any)=>{
          this.logUtils.loge("Excute 'readFile' in createpost page is error , path error, error msg is "+JSON.stringify(err),TAG);
        });
    }

    async transcodeVideo(path:any):Promise<string>{
      const fileUri = path.startsWith('file://') ? path : `file://${path}`;
      const videoInfo = await this.videoEditor.getVideoInfo({ fileUri:fileUri });
      this.duration = videoInfo["duration"];
      let width: number = 0;
      let height: number = 0;

      // 视频比例
      const ratio = videoInfo.width / videoInfo.height;

      if (ratio > 1) {
        width = videoInfo.width > 480 ? 480 : videoInfo.width;
      } else if (ratio < 1) {
        width = videoInfo.width > 360 ? 360 : videoInfo.width;
      } else if (ratio === 1) {
        width = videoInfo.width > 480 ? 480 : videoInfo.width;
      }

      let videoBitrate = videoInfo["bitrate"]/2;

      height = +(width / ratio).toFixed(0);

      return this.videoEditor.transcodeVideo({
        fileUri,
        outputFileName: `${Date.now()}`,
        outputFileType: this.videoEditor.OutputFileType.MPEG4,
        saveToLibrary:false,
        width,
        height,
        videoBitrate:videoBitrate,
        progress:(info:number)=>{
          this.zone.run(()=>{
            this.transcode = parseInt(info*100/2+'');
            this.totalProgress = this.transcode;
          })
        }
      });
    }

    removeVideo(){
      this.totalProgress = 0;
      this.uploadProgress =0;
      this.totalProgress = 0;
      this.posterImg ="";
      this.flieUri ="";
      let  video:any = document.getElementById("videocreatepost") || "";
      if(video!=""){
            video.removeAttribute('poster');
        }
      let source:any = document.getElementById("sourcecreatepost") || "";
      if(source!=""){
          source.removeAttribute('src'); // empty source
      }

      if(video!=""){
        let sid=setTimeout(()=>{
          video.load();
          clearTimeout(sid);
        },10)
      }
    }

    setFullScreen(){

      let vgfullscreen:any = document.getElementById("vgfullscreecreatepost") || "";
      if(vgfullscreen ===""){
        return;
      }
      vgfullscreen.onclick=()=>{
        this.pauseVideo();
        let postImg:string = document.getElementById("videocreatepost").getAttribute("poster");
        let videoSrc:string = document.getElementById("sourcecreatepost").getAttribute("src");
        this.fullScreenmodal = this.native.setVideoFullScreen(postImg,videoSrc);
      }
    }

    hideFullScreen(){
      if(this.fullScreenmodal != ""){
        this.modalController.dismiss();
        this.fullScreenmodal = "";
      }
    }

    setOverPlay(fileUri:string){
        let vgoverlayplay:any = document.getElementById("vgoverlayplaycreatepost") || "";
        if(vgoverlayplay!=""){
            vgoverlayplay.onclick = ()=>{
                this.zone.run(()=>{
                  let source:any = document.getElementById("sourcecreatepost") || "";
                  let  sourceSrc = source.getAttribute("src") || "";
                  if(sourceSrc === ""){
                      this.loadVideo(fileUri);
                  }
                });
            }
        }
    }

    loadVideo(videoData:string){
        let video:any = document.getElementById("videocreatepost") || "";
        let source:any = document.getElementById("sourcecreatepost") || "";
        source.setAttribute("src",videoData);
        let vgbuffering:any = document.getElementById("vgbufferingcreatepost");
        let vgoverlayplay:any = document.getElementById("vgoverlayplaycreatepost");
        let vgcontrol:any = document.getElementById("vgcontrolscreatepost");


        video.addEventListener('ended',()=>{
            vgoverlayplay.style.display = "block";
            vgbuffering.style.display ="none";
            vgcontrol.style.display = "none";
        });

        video.addEventListener('pause',()=>{
            vgoverlayplay.style.display = "block";
            vgbuffering.style.display ="none";
            vgcontrol.style.display = "none";
        });

        video.addEventListener('play',()=>{
            vgcontrol.style.display = "block";
        });

        video.addEventListener('canplay',()=>{
            vgbuffering.style.display ="none";
            video.play();
        });

        video.load();
    }

    pauseVideo(){
        if(this.flieUri === ""){
          return;
        }
        let  video:any = document.getElementById("videocreatepost") || "";
        if(!video.paused){  //判断是否处于暂停状态
            video.pause();  //停止播放
        }
    }

    createThumbnail(path:string){
        this.videoEditor.createThumbnail({fileUri:path,
          outputFileName:`${Date.now()}`,
          atTime: this.duration/10,
          width: 320,
          height: 480,
          quality: 30
        }).then((newfileUri)=>{
            //newfileUri = "cdvfile://localhost"+newfileUri.replace("file//","");
            //newfileUri = newfileUri.replace("/storage/emulated/0/","/sdcard/");
            // let lastIndex = newfileUri.lastIndexOf("/");
            // let fileName =  newfileUri.substring(lastIndex+1,newfileUri.length);
            // let filepath =  newfileUri.substring(0,lastIndex);
            let pathObj = this.handlePath(newfileUri);
            let fileName =  pathObj["fileName"];
            let filepath =  pathObj["filepath"];
            this.readThumbnail(fileName,filepath);

            this.transcodeVideo(path).then((newfileUri)=>{
              this.transcode =100;
              //newfileUri = "cdvfile://localhost"+newfileUri.replace("file//","");
              //newfileUri = newfileUri.replace("/storage/emulated/0/","/sdcard/");
              // let lastIndex = newfileUri.lastIndexOf("/");
              // let fileName =  newfileUri.substring(lastIndex+1,newfileUri.length);
              // let filepath =  newfileUri.substring(0,lastIndex);
              let pathObj = this.handlePath(newfileUri);
              let fileName =  pathObj["fileName"];
              let filepath =  pathObj["filepath"];
              this.readFile(fileName,filepath);
            });
            //this.iosReadFile(path);
        });
    }

    handlePath(fileUri:string){
      let pathObj = {};
      if (this.platform.is('android')) {
            fileUri = "cdvfile://localhost"+fileUri.replace("file//","");
            fileUri =  fileUri.replace("/storage/emulated/0/","/sdcard/");
            let lastIndex = fileUri.lastIndexOf("/");
            pathObj["fileName"] =  fileUri.substring(lastIndex+1,fileUri.length);
            pathObj["filepath"] =  fileUri.substring(0,lastIndex);
      }else if (this.platform.is('ios')) {
            let lastIndex = fileUri.lastIndexOf("/");
            pathObj["fileName"] =  fileUri.substring(lastIndex+1,fileUri.length);
            let filepath = fileUri.substring(0,lastIndex);
            filepath = filepath.startsWith('file://') ? filepath : `file://${filepath}`;
            pathObj["filepath"] =  filepath;
      }

      return pathObj;
    }

    readThumbnail(fileName:string,filepath:string){
      window.resolveLocalFileSystemURL(filepath,
        (dirEntry: CordovaFilePlugin.DirectoryEntry)=>{
          dirEntry.getFile(fileName,
            { create: true, exclusive: false },
            (fileEntry) => {

              fileEntry.file((file)=>{

                let fileReader = new FileReader();
                fileReader.onloadend =(event:any)=>{

                this.zone.run(()=>{
                  this.posterImg = fileReader.result;
                })
                };

                fileReader.onprogress = (event:any)=>{
                  // this.zone.run(()=>{
                  //   this.uploadProgress = parseInt((event.loaded/event.total)*100/2+'');
                  //   if(this.uploadProgress === 50){
                  //      this.totalProgress = 100;
                  //   }else{
                  //     this.totalProgress = 50+this.uploadProgress;
                  //   }
                  // })
                };

                fileReader.readAsDataURL(file);

            },(err)=>{
                this.logUtils.loge("Excute 'readThumbnail' in createpost page is error , readFile error, error msg is "+JSON.stringify(err),TAG);
            });
            },
            (err)=>{
              this.logUtils.loge("Excute 'readThumbnail' in createpost page is error , getFile error, error msg is "+JSON.stringify(err),TAG);
            });
        },
        (err:any)=>{
          this.logUtils.loge("Excute 'readThumbnail' in createpost page is error , path error, error msg is "+JSON.stringify(err),TAG);
        });
    }

    handleTotal(duration:any){
      return UtilService.timeFilter(duration);
    }

    clickFeedAvatar(){
      if(this.feedList.length>1){
        this.hideSwitchFeed = true;
      }
    }

    hideComponent(feed:any){
      if(feed === null){
        this.hideSwitchFeed = false;
        return;
      }
      this.nodeId = feed.nodeId;
      this.channelId = feed.id;
      let currentFeed = {
        "nodeId": this.nodeId,
        "feedId": this.channelId
      }
      this.feedService.setCurrentFeed(currentFeed);
      this.storageService.set("feeds.currentFeed",JSON.stringify(currentFeed));
      this.initFeed();
      this.hideSwitchFeed = false;
    }

moreName(name:string){
  return UtilService.moreNanme(name,15);
}
    backHome(){
        this.navCtrl.pop().then(()=>{
          this.events.publish(FeedsEvent.PublishType.updateTab,true);
          this.imgUrl ='';
          this.posterImg ='';
          this.flieUri ='';
          this.native.toast_trans("CreatenewpostPage.tipMsg1");
        });
    }
}

function ab2str(u,f) {
    var b = new Blob([u]);
    var r = new FileReader();
    r.readAsText(b, 'utf-8');
    r.onload = function (){if(f)f.call(null,r.result)}
}
