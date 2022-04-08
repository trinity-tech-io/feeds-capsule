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
import { HiveVaultHelper } from 'src/app/services/hivevault_helper.service';

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
    private cameraService: CameraService,
    private hiveVaultHelper: HiveVaultHelper
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
  prepareMediaData(imagesBase64: string[], videoData: FeedsData.videoData): Promise<FeedsData.mediaData[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const mediaDatas: FeedsData.mediaData[] = await this.processUploadMeidas(imagesBase64, videoData);
        // resolve(JSON.stringify(mediaDatas));
        resolve(mediaDatas)
      } catch (error) {
        const errorMsg = 'Prepare publish post error';
        Logger.error(TAG, errorMsg, error);
        reject(error);
      }

    });
  }

  prepareMediaDataV3(imagesBase64: string[], videoData: FeedsData.videoData): Promise<FeedsData.mediaDataV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const mediaDatas: FeedsData.mediaDataV3[] = await this.processUploadMeidasV3(imagesBase64, videoData);
        // resolve(JSON.stringify(mediaDatas));
        resolve(mediaDatas)
      } catch (error) {
        const errorMsg = 'Prepare publish post error';
        Logger.error(TAG, errorMsg, error);
        reject(error);
      }

    });
  }

  preparePublishPostContentV3(postText: string, mediaData: FeedsData.mediaDataV3[], mediaType: FeedsData.MediaType): FeedsData.postContentV3 {
    // TODO mediaData 需要处理
    const content: FeedsData.postContentV3 = {
      version: "3.0",
      content: postText,
      mediaData: mediaData,
      mediaType: mediaType
    }
    return content
  }

  preparePublishPostContent(postText: string, mediaData: FeedsData.mediaDataV3[]): FeedsData.postContentV3 {
    const content: FeedsData.postContentV3 = {
      version: "3.0",
      content: postText,
      mediaData: mediaData,
      mediaType: 0
    }
    return content;
  }

  preparePublishPost(nodeId: string, channelId: number, postText: string, imagesBase64: string[], videoData: FeedsData.videoData): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const mediaDatas: FeedsData.mediaData[] = await this.processUploadMeidas(imagesBase64, videoData);
        const content = this.createContent(postText, mediaDatas);
        resolve(JSON.stringify(content));
      } catch (error) {
        const errorMsg = 'Prepare publish post error';
        Logger.error(TAG, errorMsg, error);
        reject(error);
      }
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

  processUploadMeidasV3(imagesBase64: string[], videoData: FeedsData.videoData): Promise<FeedsData.mediaDataV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        let mediasData: FeedsData.mediaDataV3[] = [];
        if (imagesBase64.length > 0 && imagesBase64[0] != null && imagesBase64[0] != '') {
          for (let index = 0; index < imagesBase64.length; index++) {
            const element = imagesBase64[index];
            if (!element || element == '')
              continue;

            const elementBlob = this.base64ToBlob(element);
            //const blob2Buffer = await UtilService.blob2Buffer(elementBlob)
            const originMediaData: FeedsData.originMediaDataV3 = await this.uploadDataToHiveWithString(element, elementBlob.type);
            if (originMediaData) {
              const medaPath = originMediaData.medaPath;
              // this.fileHelperService.savePostData(medaPath, elementBuffer);
              let fileOriginName: string =  medaPath.split("@")[0];
              await this.fileHelperService.saveV3Data(fileOriginName,element);
            }

            const thumbnail = await UtilService.compress(element);
            const thumbnailBlob = this.base64ToBlob(thumbnail);
            //const thumbnailBlob2Buffer = await UtilService.blob2Buffer(thumbnailBlob)
            const thumbnailMediaData: FeedsData.originMediaDataV3 = await this.uploadDataToHiveWithString(thumbnail, thumbnailBlob.type);
            if (thumbnailMediaData) {
              const path = thumbnailMediaData.medaPath;
              let fileThumbnaiName: string = path.split("@")[0];
              await this.fileHelperService.saveV3Data(fileThumbnaiName, thumbnail);
            }

            if (originMediaData && thumbnailMediaData) {
              const mediaData = this.createMediaDataV3("image", originMediaData.medaPath, originMediaData.type, originMediaData.size, thumbnailMediaData.medaPath, 0, 0, {}, {});
              mediasData.push(mediaData);
            }
          }
        }
        // TODO Video data

        if (videoData) {
          const videoBlob = this.base64ToBlob(videoData.video);
          //const videoBlob2Buffer = await UtilService.blob2Buffer(videoBlob)
          const originMediaData: FeedsData.originMediaDataV3 = await this.uploadDataToHiveWithString(videoData.video, videoBlob.type);
          if (originMediaData) {
            const medaPath = originMediaData.medaPath;
            let fileName: string = medaPath.split("@")[0];
            await this.fileHelperService.saveV3Data(fileName,videoData.video);
          }

          const videoThumbBlob = this.base64ToBlob(videoData.thumbnail);
          //const videoThumbBlob2Buffer = await UtilService.blob2Buffer(videoThumbBlob)
          const thumbnailMediaData: FeedsData.originMediaDataV3 = await this.uploadDataToHiveWithString(videoData.thumbnail, videoThumbBlob.type);
          if (thumbnailMediaData) {
            const medaPath = thumbnailMediaData.medaPath;
            let fileName: string = medaPath.split("@")[0];
            await this.fileHelperService.saveV3Data(fileName,videoData.thumbnail);
          }

          if (originMediaData && thumbnailMediaData) {
            const mediaData = this.createMediaDataV3("video", originMediaData.medaPath, originMediaData.type, originMediaData.size, thumbnailMediaData.medaPath, videoData.duration, 0, {}, {});
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

  uploadDataToHiveWithString(elementBlob: string, type: string): Promise<FeedsData.originMediaDataV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const size = elementBlob.length;
        const path = await this.hiveVaultHelper.uploadMediaDataWithString(elementBlob);
        const originMediaData: FeedsData.originMediaDataV3 = {
          size: size,
          type: type,
          medaPath: path
        }
        resolve(originMediaData);
      } catch (error) {
        const errorMsg = 'Upload data to hive error';
        Logger.error(TAG, errorMsg, error);
        reject(error);
      }
    });
  }

  uploadDataToHiveWithBuffer(elementBuffer: Buffer, type: string): Promise<FeedsData.originMediaDataV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const size = elementBuffer.length;
        const path = await this.hiveVaultHelper.uploadMediaDataWithBuffer(elementBuffer);
        const originMediaData: FeedsData.originMediaDataV3 = {
          size: size,
          type: type,
          medaPath: path
        }
        resolve(originMediaData);
      } catch (error) {
        const errorMsg = 'Upload data to hive error';
        Logger.error(TAG, errorMsg, error);
        reject(error);
      }
    });
  }

  processUploadMeidas(imagesBase64: string[], videoData: FeedsData.videoData): Promise<FeedsData.mediaData[]> {
    return new Promise(async (resolve, reject) => {
      try {
        let mediasData: FeedsData.mediaData[] = [];

        if (imagesBase64 && imagesBase64.length > 0) {
          for (let index = 0; index < imagesBase64.length; index++) {
            const element = imagesBase64[index];
            if (!element || element == '')
              continue;

            const elementBlob = this.base64ToBlob(element);
            const originMediaData: FeedsData.originMediaData = await this.uploadDataToIpfs(elementBlob);
            if (originMediaData) {
              const cid = originMediaData.cid;
              this.fileHelperService.savePostData(cid, elementBlob);
            }

            const thumbnail = await UtilService.compress(element);
            const thumbnailBlob = this.base64ToBlob(thumbnail);
            const thumbnailMediaData: FeedsData.originMediaData = await this.uploadDataToIpfs(thumbnailBlob);
            if (thumbnailMediaData) {
              const cid = thumbnailMediaData.cid;
              this.fileHelperService.savePostData(cid, thumbnailBlob);
            }

            if (originMediaData && thumbnailMediaData) {
              const mediaData = this.createMediaData("image", originMediaData.cid, originMediaData.type, originMediaData.size, thumbnailMediaData.cid, 0, 0, {}, {});
              mediasData.push(mediaData);
            }
          }
        }
        // TODO Video data

        if (videoData) {
          const videoBlob = this.base64ToBlob(videoData.video);
          const originMediaData: FeedsData.originMediaData = await this.uploadDataToIpfs(videoBlob);
          if (originMediaData) {
            const cid = originMediaData.cid;
            this.fileHelperService.savePostData(cid, videoBlob);
          }

          const videoThumbBlob = this.base64ToBlob(videoData.thumbnail);
          const thumbnailMediaData: FeedsData.originMediaData = await this.uploadDataToIpfs(videoThumbBlob);
          if (thumbnailMediaData) {
            const cid = thumbnailMediaData.cid;
            this.fileHelperService.savePostData(cid, videoThumbBlob);
          }

          if (originMediaData && thumbnailMediaData) {
            const mediaData = this.createMediaData("video", originMediaData.cid, originMediaData.type, originMediaData.size, thumbnailMediaData.cid, videoData.duration, 0, {}, {});
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

  uploadDataToIpfs(elementBlob: Blob): Promise<FeedsData.originMediaData> {
    return new Promise(async (resolve, reject) => {
      try {
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

  createMediaData(kind: string, originMediaCid: string, type: string, size: number, thumbnailCid: string, duration: number, index: number, additionalInfo: any, memo: any): FeedsData.mediaData {
    const mediaData: FeedsData.mediaData = {
      kind: kind,
      originMediaCid: originMediaCid,
      type: type,
      size: size,
      imageIndex: index,
      thumbnailCid: thumbnailCid,
      duration: duration,
      additionalInfo: additionalInfo,
      memo: memo
    }

    return mediaData;
  }

  createMediaDataV3(kind: string, originMediaPath: string, type: string, size: number, thumbnailPath: string, duration: number, index: number, additionalInfo: any, memo: any): FeedsData.mediaDataV3 {
    const mediaData: FeedsData.mediaDataV3 = {
      kind: kind,
      originMediaPath: originMediaPath,
      type: type,
      size: size,
      imageIndex: index,
      thumbnailPath: thumbnailPath,
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
        let pathObj = this.handlePath(newImagePath);
        let fileName = pathObj['fileName'];
        let filepath = pathObj['filepath'];
        const base64Data = await this.fileHelperService.getUserFileBase64Data(filepath, fileName);
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
  selectvideo(progressCallback: (progress: number) => void): Promise<FeedsData.videoData> {
    return new Promise(async (resolve, reject) => {
      try {
        const videoUri = await this.cameraService.selectVideo();
        const videoData = await this.processVideo(videoUri, (progress: number) => {
          progressCallback(progress);
        });
        resolve(videoData);
      } catch (error) {
        const errorMsg = 'Select video error';
        Logger.error(TAG, errorMsg, error);
        reject(error);
      }
    });
  }

  processVideo(videoFileUri: string, progressCallback: (info: number) => void): Promise<FeedsData.videoData> {
    return new Promise(async (resolve, reject) => {
      const path = videoFileUri.startsWith('file://')
        ? videoFileUri
        : `file://${videoFileUri}`;
      const duration = await this.getVideoDuration(path);
      const isValid = this.checkVideoDurationValid(duration);
      if (!isValid) {
        Logger.warn('Video duration invalid');
        resolve(null);
        return;
      }

      const videoThumbnail = await this.createVideoThumbnail(path, duration);

      let progress: number = 0;
      //0-49percent
      const transcodeVideoPath = await this.transcodeVideo(path, (info) => {
        if (info > 0 && info < 1) {
          progress = parseInt((info * 100) / 2 + '');
          progressCallback(progress);
        }
      });

      //50-100percent
      const videoBase64 = await this.getVideoBase64Data(transcodeVideoPath, (loaded: number, total: number) => {
        progress = parseInt(((loaded / total) * 100) / 2 + '',);
        if (progress >= 50) {
          progress = 100;
        } else {
          progress = 50 + progress;
        }
        progressCallback(progress);
      });

      const videoData: FeedsData.videoData = {
        video: videoBase64,
        thumbnail: videoThumbnail,
        duration: duration
      }
      resolve(videoData);
    });
  }

  getVideoBase64Data(transcodeVideoPath: string, progressCallback?: (loaded: number, total: number) => void): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const transcodeCDVVideoObj = this.handlePath(transcodeVideoPath);
        let fileName = transcodeCDVVideoObj['fileName'];
        let filepath = transcodeCDVVideoObj['filepath'];

        const videoBase64 = await this.fileHelperService.getUserFileBase64Data(filepath, fileName, progressCallback);
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

  recordAVideo(progressCallback: (info: number) => void): Promise<FeedsData.videoData> {
    return new Promise(async (resolve, reject) => {
      try {
        const videoUri = await this.cameraService.recordAVideo();
        const videoData = await this.processVideo(videoUri, (info: number) => {
          progressCallback(info);
        });
        resolve(videoData);
      } catch (error) {
        const errorMsg = 'Select video error';
        Logger.error(TAG, errorMsg, error);
        reject(error);
      }
    });
  }

  getPostData(name: string, type: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const fetchUrl = this.ipfsService.getNFTGetUrl() + name;
        const result = await this.fileHelperService.getPostData(fetchUrl, name, type);
        resolve(result);
      } catch (error) {
        const errorMsg = 'Get post data error';
        Logger.error(TAG, errorMsg, error);
        reject(error);
      }
    });
  }

  base64ToBlob(base64Data: string): Blob {
    if (!base64Data && base64Data == '') {
      Logger.error('Base64 data to blob error, input is null');
      return null;
    }
    return UtilService.base64ToBlob(base64Data);
  }

  base64ToBuffer(base64Data: string): Buffer {
    if (!base64Data && base64Data == '') {
      Logger.error('Base64 data to blob error, input is null');
      return null;
    }
    return UtilService.base64ToBuffer(base64Data);
  }
}