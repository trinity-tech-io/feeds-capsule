import { Component, OnInit,NgZone  } from '@angular/core';
import { CameraService } from 'src/app/services/CameraService';
import { VideoEditor } from '@ionic-native/video-editor/ngx';
declare let appManager: AppManagerPlugin.AppManager;
@Component({
  selector: 'app-videorecord',
  templateUrl: './videorecord.page.html',
  styleUrls: ['./videorecord.page.scss'],
})
export class VideorecordPage implements OnInit {
  //videodata
  // {
  //   "name": "video_20201012_144635.mp4",
  //   "localURL": "cdvfile://localhost/sdcard/DCIM/Camera/video_20201012_144635.mp4",
  //   "type": "video/mp4",
  //   "lastModified": null,
  //   "lastModifiedDate": 1602485203000,
  //   "size": 7455582,
  //   "start": 0,
  //   "end": 0,
  //   "fullPath": "file:///storage/emulated/0/DCIM/Camera/video_20201012_144635.mp4"
  // }
  public flieUri:any ="";
  public videotype:string = "video/mp4";
  public uploadProgress:number=0;
  public posterImg:string="";
  public transcode:number =0;
  constructor(private camera: CameraService,
              private zone:NgZone,
              public videoEditor:VideoEditor) { }

  ngOnInit() {
         
  }

  ionViewWillEnter() {
    appManager.setVisible('show');
  }


 videorecord(){
    this.flieUri = '';
    this.posterImg='';
    this.transcode =0;
    this.uploadProgress =0;
    navigator.device.capture.captureVideo((videosdata:any)=>{
      this.zone.run(()=>{
        let videodata = videosdata[0];
        this.transcodeVideo(videodata['fullPath']).then((newfileUri)=>{
          this.transcode =100;
          console.log("====newfileUri====="+newfileUri)
          newfileUri = "cdvfile://localhost"+newfileUri.replace("file//","");
          newfileUri = newfileUri.replace("/storage/emulated/0/","/sdcard/");  
          console.log("====newfileUri====="+newfileUri)
          let lastIndex = newfileUri.lastIndexOf("/");
          let fileName =  newfileUri.substring(lastIndex+1,newfileUri.length);
          console.log("====fileName====="+fileName);
          let filepath =  newfileUri.substring(0,lastIndex);
          console.log("====filepath====="+filepath);
          this.readFile(fileName,filepath);
        });
     });
  }, (error)=>{
       console.log("===captureVideoErr==="+JSON.stringify(error));
  }, {limit:1,duration:30});
  }

  browsevideo(){
    this.flieUri = '';
    this.posterImg='';
    this.transcode =0;
    this.uploadProgress =0;
    this.camera.getVideo().then((flieUri)=>{
      this.transcodeVideo(flieUri).then((newfileUri)=>{
        console.log('video transcode success',newfileUri);
      this.transcode =100;    
      this.zone.run(()=>{
        console.log("====newfileUri====="+newfileUri)
        newfileUri = "cdvfile://localhost"+newfileUri.replace("file//","");
        newfileUri = newfileUri.replace("/storage/emulated/0/","/sdcard/");  
        console.log("====newfileUri====="+newfileUri)
        let lastIndex = newfileUri.lastIndexOf("/");
        let fileName =  newfileUri.substring(lastIndex+1,newfileUri.length);
        console.log("====fileName====="+fileName);
        let filepath =  newfileUri.substring(0,lastIndex);
        console.log("====filepath====="+filepath);
        this.readFile(fileName,filepath);
      });

      }).catch((err)=>{
        console.log('video transcode error', err);
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

  writeFile(fileName:string,filepath:string){
    //打开选择的路径
    window.resolveLocalFileSystemURL(filepath,(dirEntry: CordovaFilePlugin.DirectoryEntry)=>{
      console.log("========sucess"+dirEntry.toInternalURL());
      dirEntry.getFile(fileName, { create: true, exclusive: false }, (fileEntry) => {
        console.log('Downloaded file entry', fileEntry);
        //write

        fileEntry.createWriter((fileWriter) => {
          let blob = new Blob();
            fileWriter.onwriteend = (event) => {
                console.log("File written");
                //resolve('trinity:///data/' + fileName);
                console.log("========"+blob.size);
            };
            fileWriter.onerror = (event) => {
                console.error('createWriter ERROR - ' + JSON.stringify(event));
                //reject(event);
                //this.resetProgress();
            };
            fileWriter.write(blob);
        }, (err) => {
            console.error('createWriter ERROR - ' + JSON.stringify(err));
            //reject(err);
            //this.resetProgress();
        });



     
        },(err) => {
            console.error('createWriter ERROR - ' + JSON.stringify(err));
            //reject(err);
            //this.resetProgress();
        });

      },(err)=>{
        console.log("========error"+JSON.stringify(err));
      });
  }

  async transcodeVideo(path:any):Promise<string>{
    const fileUri = path.startsWith('file://') ? path : `file://${path}`;
    console.log("====fileUrl===="+fileUri);
    const videoInfo = await this.videoEditor.getVideoInfo({ fileUri });
    let width: number = 0;
    let height: number = 0;

    console.log("===videoInfo="+JSON.stringify(videoInfo));
 
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

    console.log("===videoBitrate====="+videoBitrate);

    height = +(width / ratio).toFixed(0);

    return this.videoEditor.transcodeVideo({
      fileUri,
      outputFileName: `${Date.now()}`,
      outputFileType: this.videoEditor.OutputFileType.MPEG4,
      width,
      height,
      videoBitrate:videoBitrate,
      progress:(info:number)=>{
        this.zone.run(()=>{
          this.transcode = parseInt(info*100+'');
        })
      }
    });
  }


}
