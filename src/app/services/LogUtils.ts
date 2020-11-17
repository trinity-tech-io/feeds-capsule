import { Injectable } from '@angular/core';

@Injectable()
export class LogUtils {
    private isDebug = true;
    private tag = "Feeds>>"
    constructor() {}
    log(tag:string, msg: string){
        if(this.isDebug)
            console.log(msg);
    }

    logd(msg: string){
        if(this.isDebug)
            console.log(this.tag+msg);
    }
}
