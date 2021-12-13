import { Injectable } from '@angular/core';
import { DataHelper } from 'src/app/services/DataHelper';
import { Events } from 'src/app/services/events.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { VideoEditor, VideoInfo } from '@ionic-native/video-editor/ngx';

import { Logger } from './logger';
import { UtilService } from './utilService';

const TAG: string = 'PostHelper';
@Injectable()
export class PostHelperService {
  constructor(
    private dataHelper: DataHelper,
    private events: Events,
    private ipfsService: IPFSService,
    public videoEditor: VideoEditor,
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
  publishPost(nodeId: string, channelId: number, postText: string, imagesBase64: string[], videosBase64: string[]): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const mediaDatas: FeedsData.mediaData[] = await this.processUploadMeidas(imagesBase64, videosBase64);
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

  processUploadMeidas(imagesBase64: string[], videosBase64: string[]): Promise<FeedsData.mediaData[]> {
    return new Promise(async (resolve, reject) => {
      try {
        let mediasData: FeedsData.mediaData[] = [];
        if (imagesBase64 && imagesBase64.length > 0) {
          for (let index = 0; index < imagesBase64.length; index++) {
            const element = imagesBase64[index];
            const originMediaData: FeedsData.originMediaData = await this.uploadDataToIpfs(element);
            const thumbnail = await UtilService.compress(element);
            const thumbnailMediaData: FeedsData.originMediaData = await this.uploadDataToIpfs(thumbnail)
            const mediaData = this.createMediaData("image", originMediaData.cid, originMediaData.type, originMediaData.size, thumbnailMediaData.cid, 0, {}, {});
            mediasData.push(mediaData);
          }
        }
        // TODO Video data 
        // if (videosBase64 && videosBase64.length > 0) {
        //   for (let index = 0; index < imagesBase64.length; index++) {
        //     const element = imagesBase64[index];
        //     this.uploadDataToIpfs(element, "video");
        //   }
        // }
        resolve(mediasData);
      } catch (error) {
      }
    });
  }

  uploadDataToIpfs(base64Data: string): Promise<FeedsData.originMediaData> {
    return new Promise(async (resolve, reject) => {
      try {
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
  // handlePath(fileUri: string) {
  //   let pathObj = {};
  //   if (this.platform.is('android')) {
  //     // fileUri = 'cdvfile://localhost' + fileUri.replace('file//', '');
  //     // fileUri = fileUri.replace('/storage/emulated/0/', '/sdcard/');
  //     // let lastIndex = fileUri.lastIndexOf('/');
  //     // pathObj['fileName'] = fileUri.substring(lastIndex + 1, fileUri.length);
  //     // pathObj['filepath'] = fileUri.substring(0, lastIndex);
  //     fileUri = 'cdvfile://localhost' + fileUri.replace('file//', '');
  //     fileUri = fileUri.replace('/storage/emulated/0/', '/sdcard/');
  //     let lastIndex = fileUri.lastIndexOf('/');
  //     pathObj['fileName'] = fileUri.substring(lastIndex + 1, fileUri.length);
  //     pathObj['filepath'] = fileUri.substring(0, lastIndex);
  //   } else if (this.platform.is('ios')) {
  //     let lastIndex = fileUri.lastIndexOf('/');
  //     pathObj['fileName'] = fileUri.substring(lastIndex + 1, fileUri.length);
  //     let filepath = fileUri.substring(0, lastIndex);
  //     filepath = filepath.startsWith('file://')
  //       ? filepath
  //       : `file://${filepath}`;
  //     pathObj['filepath'] = filepath;
  //   }

  //   return pathObj;
  // }

  // async transcodeVideo(path: any): Promise<string> {
  //   const fileUri = path.startsWith('file://') ? path : `file://${path}`;
  //   const videoInfo = await this.videoEditor.getVideoInfo({ fileUri: fileUri });
  //   this.duration = videoInfo['duration'];
  //   let width: number = 0;
  //   let height: number = 0;

  //   // 视频比例
  //   const ratio = videoInfo.width / videoInfo.height;

  //   if (ratio > 1) {
  //     width = videoInfo.width > 480 ? 480 : videoInfo.width;
  //   } else if (ratio < 1) {
  //     width = videoInfo.width > 360 ? 360 : videoInfo.width;
  //   } else if (ratio === 1) {
  //     width = videoInfo.width > 480 ? 480 : videoInfo.width;
  //   }

  //   let videoBitrate = videoInfo['bitrate'] / 2;

  //   height = +(width / ratio).toFixed(0);

  //   return this.videoEditor.transcodeVideo({
  //     fileUri,
  //     outputFileName: `${Date.now()}`,
  //     outputFileType: this.videoEditor.OutputFileType.MPEG4,
  //     saveToLibrary: false,
  //     width,
  //     height,
  //     videoBitrate: videoBitrate,
  //     progress: (info: number) => {
  //       this.zone.run(() => {
  //         if (info > 0 && info < 1) {
  //           this.transcode = parseInt((info * 100) / 2 + '');
  //           this.totalProgress = this.transcode;
  //         }
  //       });
  //     },
  //   });
  // }
}
