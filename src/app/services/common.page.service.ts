import { Injectable } from '@angular/core';
@Injectable()
export class CommonPageService {

 public static removeAllAvatar(isLoadAvatarImage: any, elementId: string) {
    let avatarImageIds = isLoadAvatarImage;
    for (let key in avatarImageIds) {
      let value = avatarImageIds[key] || '';
      if (value === '13') {
        let id = key +"-"+elementId;
        let htmlElement: HTMLElement = document.getElementById(id) || null;
        if (htmlElement != null) {
          htmlElement.setAttribute('src',"./assets/icon/reserve.svg");
        }
      }
    }
  }
}
