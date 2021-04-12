import { Injectable } from '@angular/core';
import { LogUtils } from 'src/app/services/LogUtils';

let TAG: string = "TitleBarService";

@Injectable()
export class TitleBarService {
    constructor(private logUtils: LogUtils) {
    }
    
}