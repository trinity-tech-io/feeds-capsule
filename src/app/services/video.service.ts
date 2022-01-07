import { Injectable, NgZone } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { NativeService } from '../services/NativeService';

type videoId = {
    "videoId": string,
    "sourceId": string
    "vgbufferingId": string,
    "vgcontrolsId": string
    "vgoverlayplayId": string,
    "vgfullscreeId": string
};
@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private videoIdObj: videoId = {
    videoId: '',
    sourceId: '',
    vgbufferingId: '',
    vgcontrolsId: '',
    vgoverlayplayId: '',
    vgfullscreeId: ''
  }
  public fullScreenmodal: any = '';
  constructor(
    private zone: NgZone,
    private native: NativeService,
    private modalController: ModalController
  ) { }

  intVideoAllId(page:string){
    this.videoIdObj.sourceId = this.setId("source",page);
    this.videoIdObj.videoId = this.setId("video",page);
    this.videoIdObj.vgbufferingId = this.setId("vgbuffering",page);
    this.videoIdObj.vgcontrolsId = this.setId("vgcontrols",page);
    this.videoIdObj.vgoverlayplayId = this.setId("vgoverlayplay",page);
    this.videoIdObj.vgfullscreeId = this.setId("vgfullscreeId",page);
  }


  setId(elementName: string,page:string){
       return elementName+"_"+page;
  }

  getVideoAllId(){
    return this.videoIdObj;
  }

  getVideoPoster(thumbnailUri:string,kind:string,videoUri:string){
    let sid = setTimeout(()=>{
      let videoId = this.videoIdObj.videoId;
      let video: any = document.getElementById(videoId) || '';
      if(video != ""){
        video.setAttribute('poster',thumbnailUri);
      }
      this.setFullScreen();
      this.setOverPlay(videoUri,kind);
      this.native.hideLoading();
      clearTimeout(sid);
    },0);
   }

   setFullScreen() {
    let vgfullscreen: any =
      document.getElementById(this.videoIdObj.vgfullscreeId) || '';
    if (vgfullscreen != '') {
      vgfullscreen.onclick = () => {
        this.pauseVideo();
        let postImg: string = document
          .getElementById(this.videoIdObj.videoId)
          .getAttribute('poster');
        let videoSrc: string = document
          .getElementById(this.videoIdObj.sourceId)
          .getAttribute('src');
        this.fullScreenmodal = this.native.setVideoFullScreen(
          postImg,
          videoSrc,
        );
      };
    }
  }


  pauseVideo() {
      let video: any = document.getElementById(this.videoIdObj.videoId) || '';
      if (video!="" && !video.paused) {
        //判断是否处于暂停状态
        video.pause(); //停止播放
      }
  }

  hideFullScreen() {
    if (this.fullScreenmodal != '') {
      this.modalController.dismiss();
      this.fullScreenmodal = '';
    }
  }

   setOverPlay(file:any,type:string) {
    let vgoverlayplay: any =
      document.getElementById(this.videoIdObj.vgoverlayplayId) || '';
    if (vgoverlayplay != '') {
      vgoverlayplay.onclick = () => {
        this.zone.run(() => {
          let source: any = document.getElementById(this.videoIdObj.sourceId) || '';
          let sourceSrc = source.getAttribute('src') || '';
          if (sourceSrc === '') {
            this.loadVideo(file,type);
          }
        });
      };
    }
  }

  loadVideo(file: any,type: string) {
    let video: any = document.getElementById(this.videoIdObj.videoId) || '';
    let source: any = document.getElementById(this.videoIdObj.sourceId) || '';
    source.setAttribute('src',file);
    source.setAttribute('type',type);
    let vgbuffering: any = document.getElementById(this.videoIdObj.vgbufferingId);
    let vgoverlayplay: any = document.getElementById(this.videoIdObj.vgoverlayplayId);
    let vgcontrol: any = document.getElementById(this.videoIdObj.vgcontrolsId);

    video.addEventListener('loadeddata', function() {
    });

    video.addEventListener('ended', () => {
      vgoverlayplay.style.display = 'block';
      vgbuffering.style.display = 'none';
      vgcontrol.style.display = 'none';
    });

    video.addEventListener('pause', () => {
      vgoverlayplay.style.display = 'block';
      vgbuffering.style.display = 'none';
      vgcontrol.style.display = 'none';
    });

    video.addEventListener('play', () => {
      vgcontrol.style.display = 'block';
    });

    video.addEventListener('canplay', () => {
      vgbuffering.style.display = 'none';
      video.play();
    });
   let sid = setTimeout(() => {
    video.load();
    clearTimeout(sid);
   }, 0);

  }

}