import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from '../../../services/NativeService';
import { CameraService } from 'src/app/services/CameraService';
import { ThemeService } from '../../../services/theme.service';
import { TranslateService } from "@ngx-translate/core";
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
  
  public posterImg:string = "";
  public flieUri:any = "";
  public uploadProgress:number = 0;
  public videotype:string = "video/mp4";

  constructor(
    private events: Events,
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private navCtrl: NavController,
    private camera: CameraService,
    private zone: NgZone,
    private feedService: FeedService,
    public theme:ThemeService,
    private translate:TranslateService
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
    this.flieUri ="";
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
    
    this.connectionStatus = this.feedService.getConnectionStatus();

    this.events.subscribe('feeds:connectionChanged',(status) => {
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe("feeds:friendConnectionChanged", (nodeId, status)=>{
      this.zone.run(()=>{
        this.nodeStatus[nodeId] = status;
      });
     });

    this.events.subscribe('feeds:publishPostSuccess', () => {
      this.zone.run(()=>{
        this.navCtrl.pop().then(()=>{
          this.posterImg ='';
          this.flieUri ='';
          this.native.hideLoading();
          this.native.toast_trans("CreatenewpostPage.tipMsg1");
        });
      });
    });

    this.events.subscribe('rpcRequest:error', () => {
      this.native.hideLoading();
    });

    this.events.subscribe('rpcResponse:error', () => {
      this.zone.run(() => {
        this.native.hideLoading();
      });
    });

    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });

    this.initnodeStatus();
  }

  ionViewWillLeave(){
    this.flieUri ="";
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:friendConnectionChanged");
    this.events.unsubscribe("feeds:updateTitle");
    this.events.unsubscribe("feeds:publishPostSuccess");
    this.events.unsubscribe("rpcRequest:error");
    this.events.unsubscribe("rpcResponse:error");
  }

  ionViewDidEnter() {
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("CreatenewpostPage.addingPost"));
  }

  post(){
    let  newPost = this.native.iGetInnerText(this.newPost);
    if (newPost === "" && this.imgUrl === ""){
      this.native.toast_trans("CreatenewpostPage.tipMsg");
      return false;
    }
    this.native.showLoading("common.waitMoment").then(()=>{
      this.sendPost();
    }).catch(()=>{
      this.native.hideLoading();
    });
  }

  sendPost(){
    let myContent = {};
    myContent["text"] = this.newPost;
    myContent["img"] = this.imgUrl;
      
    this.feedService.publishPost(
      this.nodeId,
      this.channelId,
      JSON.stringify(myContent)
    );
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
    this.native.openViewer(content,"common.image","CreatenewpostPage.addingPost");
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
    this.flieUri = '';
    this.posterImg='';
    navigator.device.capture.captureVideo((videosdata:any)=>{
      this.zone.run(()=>{
        let videodata = videosdata[0];
        let flieUri = videodata['localURL'];
        let lastIndex = flieUri.lastIndexOf("/");
        let fileName =  flieUri.substring(lastIndex+1,flieUri.length);
        let filepath =  flieUri.substring(0,lastIndex);
        this.readFile(fileName,filepath);
     });
  }, (error)=>{
       console.log("===captureVideoErr==="+JSON.stringify(error));
  }, {limit:1,duration:14});
  }

  selectvideo(){
    this.flieUri = '';
    this.posterImg='';
    this.camera.getVideo().then((flieUri)=>{
      flieUri = flieUri.replace("/storage/emulated/0/","/sdcard/")      
      this.zone.run(()=>{
        flieUri = "cdvfile://localhost"+flieUri;
        let lastIndex = flieUri.lastIndexOf("/");
        let fileName =  flieUri.substring(lastIndex+1,flieUri.length);
        let filepath =  flieUri.substring(0,lastIndex);
        this.readFile(fileName,filepath);
      });
    }).catch((err)=>{
      console.log("=====getVideoErr===="+JSON.stringify(err));
     })
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
                 this.flieUri = fileReader.result;
                 
                 let sid = setTimeout(()=>{
                  //let img = new Image;
                  let video:any = document.getElementById('singleVideo');
                  video.setAttribute('crossOrigin', 'anonymous')
                  let canvas = document.createElement('canvas');
                  canvas.width = video.clientWidth
                  canvas.height = video.clientHeight
                  video.onloadeddata = (() => {
                    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
                    this.posterImg= canvas.toDataURL("image/png");      
                    video.setAttribute("poster",this.posterImg);
                  });
                  clearInterval(sid);
                 },0);
                
               })
              };

              fileReader.onprogress = (event:any)=>{
                this.zone.run(()=>{
                  this.uploadProgress = parseInt((event.loaded/event.total)*100+'');
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
}
 