import { Injectable } from '@angular/core';
import { Events } from 'src/app/services/events.service';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class FormatInfoService {
  public friendConnectionMap: { [nodeId: string]: FeedsData.ConnState };

  constructor(
    private events: Events,
    private native: NativeService,
    private translate: TranslateService,
  ) {}

  formatErrorMsg(serverName: string, errorMsg: string): string {
    return '#' + serverName + ' - ' + errorMsg;
  }

  formatSigninMsg(serverName: string): string {
    return this.translate.instant('common.loggingIn') + ' #' + serverName;
  }

  formatSigninSuccessMsg(serverName: string): string {
    return (
      this.translate.instant('common.signedInto') +
      ' #' +
      serverName +
      ' ' +
      this.translate.instant('common.successfully')
    );
  }

  formatOfflineMsg(serverName: string): string {
    return (
      this.translate.instant('AddServerPage.feedsSource') +
      ' #' +
      serverName +
      this.translate.instant('AddServerPage.serverWentOffline')
    );
  }

  formatFollowSuccessMsg(feedsName: string): string {
    return (
      this.translate.instant('common.followed') +
      ' ' +'-'+' '+
      feedsName
    );
  }

  formatUnFollowSuccessMsg(feedsName: string): string {
    return (
      this.translate.instant('common.unfollowed') +
      ' ' +
      feedsName +
      ' ' +
      this.translate.instant('common.successfully')
    );
  }
}
