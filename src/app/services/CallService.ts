import { Injectable } from '@angular/core';
import { LogUtils } from 'src/app/services/LogUtils';

let TAG: string = 'CallService';

@Injectable()
export class CallService {
  constructor(private logUtils: LogUtils) {}
}
