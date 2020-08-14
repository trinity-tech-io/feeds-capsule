import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

@Injectable()
export class StorageService {
    constructor(private storage: Storage) {
    }

    ready(): Promise<LocalForage>{
        return this.storage.ready();
    }

    set(key: string, value: any):Promise<any>{
        return this.storage.set(key, value);
    }

    get(key: string):Promise<any>{
        return this.storage.get(key);
    }

    remove(key: string): Promise<any>{
        return this.storage.remove(key);
    }

    savePostContentImg(nodeChannelPostId:string, content: any): Promise<any>{
        return this.storage.set("postContentImg"+nodeChannelPostId, content);
    }

    loadPostContentImg(nodeChannelPostId:string): Promise<any>{
        return this.storage.get("postContentImg"+nodeChannelPostId);
    }
    setInfo(){
    }
}
