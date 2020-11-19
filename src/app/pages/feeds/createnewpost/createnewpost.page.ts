import { Component, OnInit, NgZone,ElementRef} from '@angular/core';
import { NavController, Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from '../../../services/NativeService';
import { CameraService } from 'src/app/services/CameraService';
import { ThemeService } from '../../../services/theme.service';
import { TranslateService } from "@ngx-translate/core";
import { VideoEditor } from '@ionic-native/video-editor/ngx';
import { AppService } from 'src/app/services/AppService';
import { VgFullscreenAPI} from 'ngx-videogular';
import { UtilService } from 'src/app/services/utilService';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-createnewpost',
  templateUrl: './createnewpost.page.html',
  styleUrls: ['./createnewpost.page.scss'],
})
export class CreatenewpostPage implements OnInit {

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

  constructor(
    private events: Events,
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private navCtrl: NavController,
    private camera: CameraService,
    private zone: NgZone,
    private feedService: FeedService,
    public theme:ThemeService,
    private translate:TranslateService,
    public videoEditor:VideoEditor,
    public appService:AppService,
    public vgFullscreenAPI:VgFullscreenAPI,
    public el:ElementRef
  ) {
  }

  ngOnInit() {
    this.acRoute.params.subscribe((data)=>{
      this.nodeId = data.nodeId;
      this.channelId = data.channelId;

      let channel = this.feedService.getChannelFromId(this.nodeId,this.channelId) || {};

      this.channelName = channel["name"] || "";
      this.subscribers = channel["subscribers"] || "";
      this.channelAvatar = this.feedService.parseChannelAvatar(channel["avatar"]);
    });
  }

  ionViewWillEnter() {
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
    
    this.connectionStatus = this.feedService.getConnectionStatus();

    // if (this.connectionStatus == 0){
    //   this.feedService.restoreSession(this.nodeId);
    // }
    
    this.events.subscribe('feeds:connectionChanged',(status) => {
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe("feeds:friendConnectionChanged", (nodeId, status)=>{
      this.zone.run(()=>{
        this.nodeStatus[nodeId] = status;
        // if (this.connectionStatus == 0 && this.nodeId == nodeId && status == 0){
        //   this.feedService.restoreSession(this.nodeId);
        // }
      });
     });

    this.events.subscribe('feeds:publishPostSuccess', (postId) => {
      this.postId = postId;
      this.zone.run(()=>{
        if(this.imgUrl === "" && this.posterImg ===""){
          this.zone.run(() => {
            this.navCtrl.pop().then(()=>{
              this.events.publish("update:tab",true);
              this.native.hideLoading();
              this.native.toast_trans("CreatenewpostPage.tipMsg1");
            });
          });
          return;
        }
        
        // this.feedService.sendData(this.nodeId,this.channelId,postId, 0 ,0, this.flieUri,this.imgUrl);
      });
    });

    this.events.subscribe('feeds:declarePostSuccess', (postId) => {
      this.zone.run(()=>{
        this.postId = postId;
        if (this.transDataChannel == FeedsData.TransDataChannel.MESSAGE){
          this.feedService.sendDataFromMsg(this.nodeId,this.channelId,postId, 0 ,0, this.flieUri,this.imgUrl);
          return;
        }

        if (this.transDataChannel == FeedsData.TransDataChannel.SESSION){
          if (this.sessionState === FeedsData.StreamState.CONNECTED)
            this.feedService.sendData(this.nodeId,this.channelId,this.postId, 0 ,0, this.flieUri,this.imgUrl);
            this.native.updateLoadingMsg(this.translate.instant("common.uploading"));
          return;
        }
      });
    });

    

    this.events.subscribe('rpcRequest:error', () => {
      this.pauseVideo();
      this.native.hideLoading();
    });

    this.events.subscribe('rpcResponse:error', () => {
      this.zone.run(() => {
        this.pauseVideo();
        this.native.hideLoading();
      });
    });

    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });

    this.events.subscribe('feeds:setBinaryFinish', (nodeId, key) => {
      this.zone.run(() => {
        if (this.postId != 0){
          this.feedService.closeSession(this.nodeId);
          this.feedService.notifyPost(this.nodeId, this.channelId, this.postId);
        }
      });
    });

    this.events.subscribe('stream:setBinarySuccess', (nodeId, key) => {
      this.zone.run(() => {
        if (this.postId != 0){
          this.feedService.closeSession(this.nodeId);
          this.feedService.notifyPost(this.nodeId, this.channelId, this.postId);
        }
      });
    });

    this.events.subscribe('feeds:notifyPostSuccess', () => {
      this.zone.run(() => {
        this.navCtrl.pop().then(()=>{
          this.events.publish("update:tab",true);
          this.imgUrl ='';
          this.posterImg ='';
          this.flieUri ='';
          this.native.hideLoading();
          this.native.toast_trans("CreatenewpostPage.tipMsg1");
        });
      });
    });
    

    this.events.subscribe('stream:setBinaryError', (nodeId, response) => {
      this.zone.run(() => {
        //response.code
        this.native.hideLoading();
        this.feedService.closeSession(this.nodeId);
      });
    });

    this.events.subscribe('stream:progress',(nodeId,progress)=>{
      this.zone.run(() => {
        this.native.updateLoadingMsg(this.translate.instant("common.uploading")+" "+progress+"%");
      });
    })
   
    this.events.subscribe('stream:onStateChangedCallback', (nodeId, state) => {
      this.zone.run(() => {
        this.sessionState = state;
        if (state === 4 && this.postId != 0){
          this.feedService.sendData(this.nodeId,this.channelId,this.postId, 0 ,0, this.flieUri,this.imgUrl);
          this.native.updateLoadingMsg(this.translate.instant("common.uploading"));
        }
      });
    });

    this.events.subscribe("feeds:openRightMenu",()=>{
      //this.clVideo();
      this.pauseVideo();
    });

    this.initnodeStatus();

    let server = this.feedService.getServerbyNodeId(this.nodeId);
    this.feedService.checkBindingServerVersion(server,()=>{
      this.zone.run(() => {
        this.navCtrl.pop().then(()=>{
          this.feedService.hideAlertPopover();
        });
      });
    });
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:friendConnectionChanged");
    this.events.unsubscribe("feeds:updateTitle");
    this.events.unsubscribe("feeds:publishPostSuccess");
    this.events.unsubscribe("rpcRequest:error");
    this.events.unsubscribe("rpcResponse:error");
    
    this.events.unsubscribe("feeds:setBinaryFinish");
    
    this.events.unsubscribe("stream:setBinarySuccess");
    this.events.unsubscribe("stream:setBinaryError");
    this.events.unsubscribe("stream:onStateChangedCallback");
    this.events.unsubscribe("stream:getBinarySuccess");
    this.events.unsubscribe("feeds:openRightMenu");

    this.events.unsubscribe("feeds:declarePostSuccess");
    this.events.unsubscribe("feeds:notifyPostSuccess");
    

    this.imgUrl="";
    this.transcode = 0;
    this.uploadProgress =0;
    this.totalProgress = 0;
    this.removeVideo();
    this.events.publish("addBinaryEvevnt");
    this.feedService.closeSession(this.nodeId);
  }

  ionViewDidEnter() {
   
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("CreatenewpostPage.addingPost"));
  }

  post(){
    let  newPost = this.native.iGetInnerText(this.newPost);
    if (this.feedService.getServerStatusFromId(this.nodeId) != 0){
      this.native.toast_trans("common.connectionError");
      return;
    }

    if (newPost === "" && this.imgUrl === ""&&this.flieUri === ""){
      this.native.toast_trans("CreatenewpostPage.tipMsg");
      return false;
    }
    if(this.flieUri!=""&&this.posterImg === ""){
        this.native.toast_trans("CreatenewpostPage.tipMsg2");
         return false;
    }

    this.native.showLoading("common.waitMoment", 5*60*1000).then(()=>{
      this.sendPost();
    }).catch(()=>{
      this.native.hideLoading();
    });
  }

  sendPost(){
    if (this.imgUrl == ""&& this.flieUri == ""){
      let content = this.feedService.createContent(this.newPost,null,null);
      this.feedService.publishPost(
        this.nodeId,
        this.channelId,
        content
      );
      return ;
    }

    this.publishPostThrowMsg(); 
  }

  publishPostThrowMsg(){
    // if (this.feedService.getServerStatusFromId(this.nodeId) != 0){
    //   this.native.toast_trans("common.connectionError");
    //   return;
    // }

    let videoSize = this.flieUri.length;
    let imgSize = this.imgUrl.length;

    if (videoSize > this.throwMsgTransDataLimit || imgSize > this.throwMsgTransDataLimit){
      this.transDataChannel = FeedsData.TransDataChannel.SESSION
      this.feedService.restoreSession(this.nodeId);
    }else{
      this.transDataChannel = FeedsData.TransDataChannel.MESSAGE
    }
    
    if (this.flieUri != ""){
      let videoThumbs: FeedsData.VideoThumb = {
        videoThumb  :   this.posterImg,
        duration    :   this.duration,
        videoSize   :   videoSize
      };
    let content = this.feedService.createContent(this.newPost, null, videoThumbs);
      this.feedService.declarePost(
        this.nodeId,
        this.channelId,
        content,
        false
      )
      return;
    }

    if (this.imgUrl != ""){
      this.feedService.compress(this.imgUrl).then((imageThumb)=>{
        let imgThumbs: FeedsData.ImgThumb[] = [];
        let imgThumb: FeedsData.ImgThumb = {
          index   : 0,
          imgThumb: imageThumb,
          imgSize : imgSize
        }
        imgThumbs.push(imgThumb);

        let content = this.feedService.createContent(this.newPost,imgThumbs,null);
        this.feedService.declarePost(
          this.nodeId,
          this.channelId,
          content,
          false
        )
      });
    }
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
        // this.transcodeVideo(videodata['fullPath']).then((newfileUri)=>{
        //   this.transcode =100;
        //   newfileUri = "cdvfile://localhost"+newfileUri.replace("file//","");
        //   newfileUri = newfileUri.replace("/storage/emulated/0/","/sdcard/");  
        //   let lastIndex = newfileUri.lastIndexOf("/");
        //   let fileName =  newfileUri.substring(lastIndex+1,newfileUri.length);
        //   let filepath =  newfileUri.substring(0,lastIndex);
        //   this.readFile(fileName,filepath);
        // });
     });
  }, (error)=>{
       console.log("===captureVideoErr==="+JSON.stringify(error));
  }, {limit:1,duration:30});
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
      console.log("=====getVideoErr===="+JSON.stringify(err));
     })
  } 
  async getVideoInfo(fileUri:string){
    let videoInfo = await this.videoEditor.getVideoInfo({ fileUri:fileUri });
    this.duration = videoInfo["duration"]
    this.createThumbnail(fileUri);
  } 
  

  readFile(fileName:string,filepath:string){

    window.resolveLocalFileSystemURL(filepath,
      (dirEntry: CordovaFilePlugin.DirectoryEntry)=>{
        dirEntry.getFile(fileName, 
          { create: true, exclusive: false }, 
          (fileEntry) => {

            fileEntry.file((file)=>{
              let filesize  = parseFloat((file.size/1000/1000).toFixed(2));
              if(this.isVideoTipDes(filesize)){
                this.zone.run(()=>{
                  this.flieUri ="";
                  this.posterImg ="";
                  this.imgUrl="";
                  this.transcode = 0;
                  this.uploadProgress =0;
                  this.totalProgress = 0;
                  this.native.toast_trans(this.translate.instant("common.filevideodes"));
                });
                return;
              }
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
              console.log("=====readFileErr====="+JSON.stringify(err));
           });
          },
          (err)=>{
            console.log("=====getFileErr====="+JSON.stringify(err));
          });
      },
      (err:any)=>{
            console.log("=====pathErr====="+JSON.stringify(err));
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

  isVideoTipDes(filesize:number){
   return filesize>10;
  }

  removeVideo(){
    this.totalProgress = 0;
    this.uploadProgress =0;
    this.totalProgress = 0;
    if(this.posterImg != ""){
       this.posterImg ="";
       let  video:any = document.getElementById("videocreatepost") || "";
       video.removeAttribute('poster');
       if(this.flieUri!=""){
        this.flieUri ="";
        let source:any = document.getElementById("sourcecreatepost") || "";
        source.removeAttribute('src'); // empty source
        let sid=setTimeout(()=>{
          video.load();
          clearTimeout(sid);
        },10)
       }
    }
  }

  setFullScreen(){

    let vgfullscreen:any = document.getElementById("vgfullscreecreatepost") || "";
    if(vgfullscreen ===""){
      return;
    }
    vgfullscreen.onclick=()=>{
    // let isFullScreen = this.vgFullscreenAPI.isFullscreen;
    // if(isFullScreen){
    //   this.native.setTitleBarBackKeyShown(true);
    //   titleBarManager.setTitle(this.translate.instant("CreatenewpostPage.addingPost"));
    //   this.appService.addright();
    // }else{
    //   this.native.setTitleBarBackKeyShown(false);
    //   titleBarManager.setTitle(this.translate.instant("common.video"));
    //   this.appService.hideright();
     
    // }
    this.vgFullscreenAPI.toggleFullscreen(vgfullscreen);
   
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
  let vgscrubbar:any = document.getElementById("vgscrubbarcreatepost");
  let vgcontrol:any = document.getElementById("vgcontrolscreatepost");  


   video.addEventListener('ended',()=>{
  vgbuffering.style.display ="none";
  vgoverlayplay.style.display = "block";
  vgscrubbar.style.display ="none";
  vgcontrol.style.display = "none";   
});

video.addEventListener('pause',()=>{
vgbuffering.style.display ="none";
vgoverlayplay.style.display = "block"; 
vgscrubbar.style.display ="none";
vgcontrol.style.display = "none";  
});

video.addEventListener('play',()=>{
  vgscrubbar.style.display ="block";
  vgcontrol.style.display = "block";  
 });


video.addEventListener('canplay',()=>{
      vgbuffering.style.display ="none";
      video.play(); 
});

video.load();
// let sid = setTimeout(()=>{
//   video.play();
//   clearTimeout(sid);
// },20);
}

 pauseVideo(){
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
      newfileUri = "cdvfile://localhost"+newfileUri.replace("file//","");
      newfileUri = newfileUri.replace("/storage/emulated/0/","/sdcard/");  
      let lastIndex = newfileUri.lastIndexOf("/");
      let fileName =  newfileUri.substring(lastIndex+1,newfileUri.length);
      let filepath =  newfileUri.substring(0,lastIndex);
      this.readThumbnail(fileName,filepath);

      this.transcodeVideo(path).then((newfileUri)=>{
        this.transcode =100;
        newfileUri = "cdvfile://localhost"+newfileUri.replace("file//","");
        newfileUri = newfileUri.replace("/storage/emulated/0/","/sdcard/");  
        let lastIndex = newfileUri.lastIndexOf("/");
        let fileName =  newfileUri.substring(lastIndex+1,newfileUri.length);
        let filepath =  newfileUri.substring(0,lastIndex);
        this.readFile(fileName,filepath);
      });
  });
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
            console.log("=====readFileErr====="+JSON.stringify(err));
         });
        },
        (err)=>{
          console.log("=====getFileErr====="+JSON.stringify(err));
        });
    },
    (err:any)=>{
          console.log("=====pathErr====="+JSON.stringify(err));
    });
}

handleTotal(duration:any){ 
  return UtilService.timeFilter(duration);
}



  
  // videocam(){
  //   this.flieUri = '';
  //   this.posterImg='';
  //   navigator.device.capture.captureVideo((videosdata:any)=>{
  //     this.zone.run(()=>{
  //       let videodata = videosdata[0];
  //       let flieUri = videodata['localURL'];
  //       let lastIndex = flieUri.lastIndexOf("/");
  //       let fileName =  flieUri.substring(lastIndex+1,flieUri.length);
  //       let filepath =  flieUri.substring(0,lastIndex);
  //       this.readFile(fileName,filepath);
  //    });
  // }, (error)=>{
  //      console.log("===captureVideoErr==="+JSON.stringify(error));
  // }, {limit:1,duration:14});
  // }
}
function ab2str(u,f) {
  var b = new Blob([u]);
  var r = new FileReader();
   r.readAsText(b, 'utf-8');
   r.onload = function (){if(f)f.call(null,r.result)}
}