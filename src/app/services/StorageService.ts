import { Injectable } from '@angular/core';
// import { Events, Platform } from '@ionic/angular';

@Injectable()
export class StorageService {
    constructor() {
    }

    set(key: string, value: any){
        localStorage.setItem(key,JSON.stringify(value));
    }

    get(key: string):any{
        return JSON.parse(localStorage.getItem(key));
    }

    remove(key: string){
        localStorage.removeItem(key);
    }


    setInfo(){

    }
}
