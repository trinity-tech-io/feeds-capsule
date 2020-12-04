import { Injectable } from '@angular/core';

enum LogLevel {
    NONE,
    ERROR,
    WARN,
    INFO,
    DEBUG,
}

let TAG = "Feeds";
@Injectable()
export class LogUtils {
    private level:LogLevel = LogLevel.WARN;

    constructor() {}
    log(msg: string, tag: string, level: LogLevel){
        if (!this.checkLogLevel(level)){
            return ;
        }
        console.log(tag+"::"+msg);
    }

    logd(msg: string, tag:string = TAG){
        this.log(msg, tag, LogLevel.DEBUG);
    }

    logi(msg: string, tag: string = TAG){
        this.log(msg, tag, LogLevel.INFO);
    }

    logw(msg: string, tag: string = TAG){
        this.log(msg, tag, LogLevel.WARN);
    }

    loge(msg: string, tag: string = TAG){
        this.log(msg, tag, LogLevel.ERROR);
    }

    checkLogLevel(level: LogLevel): boolean{
        if (this.level < level)
            return false;
        return true;
    }

    setLogLevel(level: LogLevel){
        if (level< LogLevel.NONE){
            this.level = LogLevel.NONE;
            return;
        }

        if (level > LogLevel.DEBUG){
            this.level = LogLevel.DEBUG;
            return;
        }

        this.level = level;
    }

    getLogLevel():LogLevel{
        return this.level;
    }
}
