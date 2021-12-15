import { Injectable } from '@angular/core';
import { reject } from 'lodash';
import { Logger } from './logger';

const TAG: string = 'CameraService';
@Injectable()
export class CameraService {
  constructor() {}
  /**
   *Camera.DestinationType
   *      DATA_URL : 0,   Return image as base64-encoded string
   *      FILE_URI : 1,   Return image file URI
   *      NATIVE_URI : 2  Return image native URI
   */

  /**
   * Set the source of the picture.
   * Defined in navigator.camera.PictureSourceType. Default is CAMERA.
   *      PHOTOLIBRARY : 0,
   *      CAMERA : 1,
   *      SAVEDPHOTOALBUM : 2
   */
  openCamera(imgQuality, destType, type, success, error) {
    navigator.camera.getPicture(onSuccess, onFail, {
      correctOrientation: true,
      quality: imgQuality,
      destinationType: destType,
      sourceType: type,
    });

    function onSuccess(imageURL) {
      //将选择的控件放到要显示的控件上
      let imgUrl = '';
      if (destType == 0) {
        imgUrl = 'data:image/jpeg;base64,' + imageURL;
      } else {
        imgUrl = imageURL;
      }

      success(imgUrl);
    }

    function onFail(message) {
      error(message);
    }
  }

  getVideo(): Promise<string> {
    return new Promise((resolve, reject) => {
      navigator.camera.getPicture(
        (fileuri: string) => {
          resolve(fileuri);
        },
        (message: any) => {
          reject(message);
        },
        {
          quality: 30,
          destinationType: 0,
          correctOrientation: true,
          sourceType: 0,
          mediaType: 1,
        },
      );
    });
  }

  selectPicture(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.openCamera(
        30,
        0,
        1,
        (imageUrl: any) => {
          resolve(imageUrl);
        },
        (err: any) => {
          reject(err);
        },
      );
    });
  }

  takeAPicture(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.openCamera(
        30,
        0,
        0,
        (imageUrl: any) => {
          resolve(imageUrl);
        },
        (err: any) => {
          reject(err);
        },
      );
    });
  }

  selectVideo(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const fileUri = await this.getVideo();
        resolve(fileUri);
      } catch (error) {
        reject(error);
      }
    });
  }

  recordAVideo(): Promise<string> {
    return new Promise((resolve, reject) => {
      navigator.device.capture.captureVideo(
        (videosdata: MediaFile[]) => {
          let videodata = videosdata[0];
          resolve(videodata.fullPath);
        },
        error => {
          const errorMsg = 'Record new video error';
          Logger.error(TAG, errorMsg, error);
          reject(error);
        },
        { limit: 1, duration: 15 },
      );
    });
  }
}
