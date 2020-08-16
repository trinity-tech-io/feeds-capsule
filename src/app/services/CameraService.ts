import { Injectable } from '@angular/core';

declare let Camera: CordovaCameraPlugin.Camera;

let eventBus = null;

@Injectable()
export class CameraService {
    constructor(){
    }
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
    openCamera(imgQuality, destType, type, success , error){
        navigator.camera.getPicture(onSuccess, onFail, {
            correctOrientation: true,
            quality: imgQuality,
            destinationType: destType,
            sourceType: type
        });
    
        function onSuccess(imageURL) {
            //将选择的控件放到要显示的控件上
            let imgUrl = "";
            if (destType == 0){
                imgUrl = "data:image/jpeg;base64," + imageURL;
            } else {
                imgUrl = imageURL;
            }
            
            success(imgUrl);
        };
    
        function onFail(message) {
            error(message);
        };
    }
}
