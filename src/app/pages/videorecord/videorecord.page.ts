import { Component, OnInit,NgZone  } from '@angular/core';
import { CameraService } from 'src/app/services/CameraService';
import { DomSanitizer } from '@angular/platform-browser';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
declare let appManager: AppManagerPlugin.AppManager;
declare let cordova:Cordova;
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
  public flieUri:string ="";
  public videotype:string = "video/mp4";
  constructor(private camera: CameraService,
              private zone:NgZone,
              private sanitizer: DomSanitizer) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    appManager.setVisible('show');
  }


  videorecord(){
    navigator.device.capture.captureVideo((videosdata:any)=>{
      this.zone.run(()=>{
        let videodata = videosdata[0];
        //this.successVideo(videodata);
        this.flieUri = videodata['localURL'];
        //this.flieUri = this.sanitizer.bypassSecurityTrustResourceUrl(videodata['localURL']);
        //console.log("========"+JSON.stringify());
        //this.flieUri = 
        console.log("========"+videodata['localURL']);
        window.resolveLocalFileSystemURL(videodata['localURL'],(dirEntry: CordovaFilePlugin.DirectoryEntry)=>{
               console.log("==11111=="+dirEntry.toInternalURL());
              //this.zone.run(()=>{
                  // dirEntry.getFile(videodata['localURL'],{},(file)=>{
                  //         file.createWriter((data)=>{
                  //           console.log("====="+JSON.stringify(data));
                  //         },()=>{

                  //         })
                  // },(err)=>{

                  // })
              //});
        },(err)=>{
          console.log("==22222==err"+JSON.stringify(err));
        })
     });
  }, (error)=>{
       console.log("========"+JSON.stringify(error));
  }, {limit:1,duration:30});
  }

  browsevideo() {
    this.camera.getVideo().then((flieUri)=>{
      console.log("====flieUri===="+flieUri); 
      flieUri = flieUri.replace("/storage/emulated/0/","/sdcard/")      
      this.zone.run(()=>{
        this.flieUri = "cdvfile://localhost"+flieUri;
        let lastIndex = this.flieUri.lastIndexOf("/");
        let fileName = this.flieUri.substring(lastIndex+1,this.flieUri.length);
        console.log("====fileName===="+fileName); 
        let path = this.flieUri.substring(0,lastIndex);
        console.log("====path===="+path); 
        //this.flieUri = "assets/movie.mp4";
        //打开选择的路径
         window.resolveLocalFileSystemURL(path,(dirEntry: CordovaFilePlugin.DirectoryEntry)=>{
              console.log("========sucess"+dirEntry.toInternalURL());
              dirEntry.getFile(fileName, { create: true, exclusive: false }, (fileEntry) => {
                console.log('Downloaded file entry', fileEntry);

                //read
                fileEntry.file((file)=>{
                   let  fileReader = new FileReader();
                   fileReader.onloadend = function(event:any){
                    console.log("File loadend");
                    console.log("===result===="+this.result);
                   };

                   let blod = new Blob();

                   fileReader.readAsText(file);

                },(err)=>{

                });
                
                //write

                // fileEntry.createWriter((fileWriter) => {
                //   let blob = new Blob();
                //     fileWriter.onwriteend = (event) => {
                //         console.log("File written");
                //         //resolve('trinity:///data/' + fileName);
                //         console.log("========"+blob.size);
                //     };
                //     fileWriter.onerror = (event) => {
                //         console.error('createWriter ERROR - ' + JSON.stringify(event));
                //         //reject(event);
                //         //this.resetProgress();
                //     };
                //     fileWriter.write(blob);
                // }, (err) => {
                //     console.error('createWriter ERROR - ' + JSON.stringify(err));
                //     //reject(err);
                //     //this.resetProgress();
                // });



             
                },(err) => {
                    console.error('createWriter ERROR - ' + JSON.stringify(err));
                    //reject(err);
                    //this.resetProgress();
                });
       
              },(err)=>{
                console.log("========error"+JSON.stringify(err));
              });
    
      });
  }).catch((err)=>{

  })
  }
  

}
