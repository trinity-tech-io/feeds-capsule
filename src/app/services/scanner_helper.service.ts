import { Injectable } from '@angular/core';
import { Logger } from './logger';

const TAG = 'ScannerHelper';

@Injectable()
export class ScannerHelper {
  //feeds://v3/ownerDid/channelId/channelName
  public static parseScannerResult(url: string): ParseResult {
    const checkResult = this.checkValid(url);
    if (checkResult == ScannerCode.INVALID_FORMAT) {
      return { code: ScannerCode.INVALID_FORMAT, feedsUrl: null };
    }
    return this.pasreUrl(url);
  }

  private static checkValid(result: string): ScannerCode {
    if (result === "") {
      return ScannerCode.INVALID_FORMAT;
    }

    if (result.length < 54 || !result.startsWith('feeds://') || !result.indexOf('did:elastos:')) {
      return ScannerCode.INVALID_FORMAT;
    }
  }

  private static pasreUrl(url: string): ParseResult {
    let urlArr = url.replace("feeds://", "").split("/");
    const version = urlArr[0];
    const destDid = urlArr[1];
    const channelId = urlArr[2];
    const channelName = urlArr[3];

    if (!version || !destDid || !channelId || !channelName) {
      return { code: ScannerCode.INVALID_FORMAT, feedsUrl: null };
    }

    const feedsUrl: FeedsUrl = {
      version: version,
      destDid: destDid,
      channelId: channelId,
      channelName: channelName
    }
    return { code: ScannerCode.VALID, feedsUrl: feedsUrl };
  }

}
export type FeedsUrl = {
  version: string,
  destDid: string,
  channelId: string,
  channelName: string
}

export type ParseResult = {
  code: ScannerCode,
  feedsUrl: FeedsUrl
}

export enum ScannerCode {
  VALID,
  INVALID_FORMAT
}
