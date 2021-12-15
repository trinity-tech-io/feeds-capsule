import { Injectable } from '@angular/core';
import { DataHelper } from 'src/app/services/DataHelper';
import { Events } from 'src/app/services/events.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { VideoEditor, VideoInfo } from '@ionic-native/video-editor/ngx';
import { Platform } from '@ionic/angular';

import { Logger } from './logger';
import { UtilService } from './utilService';
import { FileHelperService } from 'src/app/services/FileHelperService';
import { CameraService } from 'src/app/services/CameraService';

const TAG: string = 'PostHelper';
@Injectable()
export class PostHelperService {
  constructor(
    private dataHelper: DataHelper,
    private events: Events,
    private ipfsService: IPFSService,
    public videoEditor: VideoEditor,
    private platform: Platform,
    private fileHelperService: FileHelperService,
    private cameraService: CameraService
  ) {
  }

  // version2.0
  // {
  //   "version": "2.0",
  //   "text": "xxx",
  //   "data": [
  //     {
  //       "kind": "image/video/audio"
  //       "image": "imageCid",
  //       "type": "jpg",
  //       "size": 123,
  //       "thumbnail": "thumbnailCid"
  //     }
  //   ]
  // }
  publishPost(nodeId: string, channelId: number, postText: string, imagesBase64: string[], videoData: FeedsData.videoData): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const mediaDatas: FeedsData.mediaData[] = await this.processUploadMeidas(imagesBase64, videoData);

      console.log('mediaDatas-=---------=-', mediaDatas);

      const content = this.createContent(postText, mediaDatas);

      console.log('content-=---------=-', content);
    });
  }

  createContent(postText: string, mediaDatas: FeedsData.mediaData[]): FeedsData.postContent {
    const content: FeedsData.postContent = {
      version: "2.0",
      text: postText,
      data: mediaDatas
    }
    return content;
  }

  processUploadMeidas(imagesBase64: string[], videoData: FeedsData.videoData): Promise<FeedsData.mediaData[]> {
    return new Promise(async (resolve, reject) => {
      try {
        let mediasData: FeedsData.mediaData[] = [];

        console.log('imagesBase64===========>', imagesBase64);
        console.log('videosBase64===========>', videoData);

        if (imagesBase64 && imagesBase64.length > 0) {
          for (let index = 0; index < imagesBase64.length; index++) {
            const element = imagesBase64[index];
            if (!element || element == '')
              continue;
            const originMediaData: FeedsData.originMediaData = await this.uploadDataToIpfs(element);
            const thumbnail = await UtilService.compress(element);
            const thumbnailMediaData: FeedsData.originMediaData = await this.uploadDataToIpfs(thumbnail)
            if (!originMediaData || !thumbnailMediaData)
              continue
            const mediaData = this.createMediaData("image", originMediaData.cid, originMediaData.type, originMediaData.size, thumbnailMediaData.cid, 0, {}, {});
            mediasData.push(mediaData);
          }
        }
        // TODO Video data 

        if (videoData) {
          const originMediaData: FeedsData.originMediaData = await this.uploadDataToIpfs(videoData.video);
          const thumbnailMediaData: FeedsData.originMediaData = await this.uploadDataToIpfs(videoData.thumbnail);
          if (originMediaData && thumbnailMediaData) {
            const mediaData = this.createMediaData("video", originMediaData.cid, originMediaData.type, originMediaData.size, thumbnailMediaData.cid, videoData.duration, {}, {});
            mediasData.push(mediaData);
          }
        }
        resolve(mediasData);
      } catch (error) {

        const errorMsg = 'Upload medias error';
        Logger.error(TAG, errorMsg, error);
        reject(error);
      }
    });
  }

  uploadDataToIpfs(base64Data: string): Promise<FeedsData.originMediaData> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!base64Data && base64Data == '') {
          Logger.error('Upload data to Ipfs error, input is null');
          resolve(null);
        }
        const elementBlob = UtilService.base64ToBlob(base64Data);
        const size = elementBlob.size;
        const type = elementBlob.type;
        const cid = await this.ipfsService.uploadData(elementBlob);
        const originMediaData: FeedsData.originMediaData = {
          size: size,
          type: type,
          cid: cid
        }
        resolve(originMediaData);
      } catch (error) {
        const errorMsg = 'Upload data to ipfs error';
        Logger.error(TAG, errorMsg, error);
        reject(error);
      }
    });
  }

  createMediaData(kind: string, originMediaCid: string, type: string, size: number, thumbnailCid: string, duration: number, additionalInfo: any, memo: any): FeedsData.mediaData {
    const mediaData: FeedsData.mediaData = {
      kind: kind,
      originMediaCid: originMediaCid,
      type: type,
      size: size,
      thumbnailCid: thumbnailCid,
      duration: duration,
      additionalInfo: additionalInfo,
      memo: memo
    }

    return mediaData;
  }

  // createVideoThumbnail(path: string) {
  //   this.videoEditor
  //     .createThumbnail({
  //       fileUri: path,
  //       outputFileName: `${Date.now()}`,
  //       atTime: this.duration / 10,
  //       width: 320,
  //       height: 480,
  //       quality: 30,
  //     })
  //     .then(newfileUri => {
  //       let pathObj = this.handlePath(newfileUri);
  //       let fileName = pathObj['fileName'];
  //       let filepath = pathObj['filepath'];
  //       this.readThumbnail(fileName, filepath);

  //       this.transcodeVideo(path).then(newfileUri => {
  //         this.transcode = 100;
  //         let pathObj = this.handlePath(newfileUri);
  //         let fileName = pathObj['fileName'];
  //         let filepath = pathObj['filepath'];
  //         this.readFile(fileName, filepath);
  //       });
  //     });
  // }

  getVideoDuration(fileUri: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      const videoInfo: VideoInfo = await this.videoEditor.getVideoInfo({ fileUri: fileUri });
      if (!videoInfo) {
        const error = 'Video info is null';
        Logger.error(TAG, error);
        resolve(0);
        return;
      }
      const duration = videoInfo.duration;
      if (!duration) {
        const error = 'Video duration is null';
        Logger.error(TAG, error);
        resolve(0);
        return;
      }

      resolve(duration);
    });
    // this.createThumbnail(fileUri);
  }

  checkVideoDurationValid(duration: number): boolean {
    if (duration > 15)
      return false;
    return true;
  }

  createVideoThumbnail(path: string, duration: number): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const options = {
          fileUri: path,
          outputFileName: `${Date.now()}`,
          atTime: duration / 10,
          width: 320,
          height: 480,
          quality: 30,
        }
        const newImagePath = await this.videoEditor.createThumbnail(options);
        console.log('createVideoThumbnail==newImagePath=', newImagePath);
        let pathObj = this.handlePath(newImagePath);
        let fileName = pathObj['fileName'];
        let filepath = pathObj['filepath'];
        console.log('createVideoThumbnail==filepath=', filepath);
        const base64Data = await this.fileHelperService.getUserFileBase64Data(filepath, fileName);
        console.log('createVideoThumbnail==base64Data=', base64Data);
        resolve(base64Data);
      } catch (error) {
        reject()
      }
    });
  }

  handlePath(fileUri: string) {
    let pathObj = {};
    if (this.platform.is('android')) {
      fileUri = 'cdvfile://localhost' + fileUri.replace('file//', '');
      fileUri = fileUri.replace('/storage/emulated/0/', '/sdcard/');
      let lastIndex = fileUri.lastIndexOf('/');
      pathObj['fileName'] = fileUri.substring(lastIndex + 1, fileUri.length);
      pathObj['filepath'] = fileUri.substring(0, lastIndex);
    } else if (this.platform.is('ios')) {
      let lastIndex = fileUri.lastIndexOf('/');
      pathObj['fileName'] = fileUri.substring(lastIndex + 1, fileUri.length);
      let filepath = fileUri.substring(0, lastIndex);
      filepath = filepath.startsWith('file://')
        ? filepath
        : `file://${filepath}`;
      pathObj['filepath'] = filepath;
    }

    return pathObj;
  }

  async transcodeVideo(path: string, progressCallback?: (info: number) => void): Promise<string> {
    const fileUri = path.startsWith('file://') ? path : `file://${path}`;
    const videoInfo: VideoInfo = await this.videoEditor.getVideoInfo({ fileUri: fileUri });
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

    let videoBitrate = videoInfo['bitrate'] / 2;

    height = +(width / ratio).toFixed(0);

    return this.videoEditor.transcodeVideo({
      fileUri,
      outputFileName: `${Date.now()}`,
      outputFileType: this.videoEditor.OutputFileType.MPEG4,
      saveToLibrary: false,
      width,
      height,
      videoBitrate: videoBitrate,
      progress: (info: number) => {
        // this.zone.run(() => {
        //   if (info > 0 && info < 1) {
        //     this.transcode = parseInt((info * 100) / 2 + '');
        //     this.totalProgress = this.transcode;
        //   }
        // });
        progressCallback(info);
      },
    });
  }

  /**
   * 1.Get video from camera
   * 2.Get video duration
   * 3.Check video duration
   * 4.Create video thumbnail
   * 5.Transcode video
   * 6.Creat video obj
  */
  selectvideo(progressCallback: (info: number) => void): Promise<FeedsData.videoData> {
    return new Promise(async (resolve, reject) => {
      try {
        const videoFileUri = await this.cameraService.selectVideo();
        console.log('videoFileUri=====>', videoFileUri);
        const path = videoFileUri.startsWith('file://')
          ? videoFileUri
          : `file://${videoFileUri}`;
        console.log('path=====>', path);
        const duration = await this.getVideoDuration(path);
        console.log('duration=====>', duration);
        const isValid = this.checkVideoDurationValid(duration);
        if (!isValid) {
          Logger.warn('Video duration invalid');
          resolve(null);
          return;
        }
        // const videoThumbnailPath = this.handlePath(path);
        // console.log('videoThumbnailPath', videoThumbnailPath);
        const videoThumbnail = await this.createVideoThumbnail(path, duration);
        console.log('videoThumbnail=====>', videoThumbnail);

        const transcodeVideoPath = await this.transcodeVideo(path, (info) => {
          progressCallback(info);
        });
        const videoBase64 = await this.getVideoBase64Data(transcodeVideoPath);
        const videoData: FeedsData.videoData = {
          video: videoBase64,
          thumbnail: videoThumbnail,
          duration: duration
        }
        resolve(videoData);
      } catch (error) {
        const errorMsg = 'Select video error';
        Logger.error(TAG, errorMsg, error);
        reject(error);
      }
    });
  }

  getVideoBase64Data(transcodeVideoPath: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const transcodeCDVVideoObj = this.handlePath(transcodeVideoPath);
        let fileName = transcodeCDVVideoObj['fileName'];
        let filepath = transcodeCDVVideoObj['filepath'];
        console.log('createVideoThumbnail==filepath=', filepath);

        const videoBase64 = await this.fileHelperService.getUserFileBase64Data(filepath, fileName);
        console.log('videoBase64=====>', videoBase64);
        resolve(videoBase64);
      } catch (error) {
        const errorMsg = "Get video base64 data error";
        Logger.error(TAG, errorMsg, error);
        reject(error);
      }
    });
  }

      //   .then((flieUri: string) => {
      //   path = flieUri.startsWith('file://')
      //     ? flieUri
      //     : `file://${flieUri}`;
      //   return this.postHelperService.getVideoDuration(path);
      // })
      //   .then((duration: number) => {
      //     const isValid = this.postHelperService.checkVideoDurationValid(duration);
      //     if (!isValid) {
      //       this.flieUri = '';
      //       this.posterImg = '';
      //       this.imgUrl = '';
      //       this.transcode = 0;
      //       this.uploadProgress = 0;
      //       this.totalProgress = 0;
      //       this.native.toast(this.translate.instant('common.filevideodes'));
      //       return;
      //     }

      //     this.duration = duration;
      //     return this.postHelperService.createVideoThumbnail(path, duration);
      //   }).then((videoThumbnail) => {
      //     //TODO

        //   }).then(() => {
        //TODO
        // const videoBase64 = await this.postHelperService.transcodeVideo(path, (info) => {
        //   this.zone.run(() => {
        //     if (info > 0 && info < 1) {
        //       this.transcode = parseInt((info * 100) / 2 + '');
        //       this.totalProgress = this.transcode;
        //     }
        //   });
    // })
  // })
  //     .catch(err => {
  //   const errorMsg = "Excute 'selectvideo' in createpost page is error , getVideo error";
  //   Logger.error(TAG, errorMsg, err);
  //     });
  // }
}
