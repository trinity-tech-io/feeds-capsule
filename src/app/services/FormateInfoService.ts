import { Injectable } from '@angular/core';
import { Events } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class FormateInfoService {
    public friendConnectionMap: {[nodeId:string]: FeedsData.ConnState};

    constructor(
        private events: Events,
        private native: NativeService,
        private translate: TranslateService) {
    }

    formatErrorMsg(serverName: string, errorMsg: string): string{
        return "#"+ serverName + " - "+errorMsg;
    }

    formatSigninMsg(serverName: string): string{
        return this.translate.instant("common.loggingIn")+" #"+serverName;
    }

    formatSigninSuccessMsg(serverName: string): string{
        return this.translate.instant("common.signedInto")+" #"+serverName+ " "+this.translate.instant("common.successfully");
    }

    formatOfflineMsg(serverName: string): string{
        return this.translate.instant("AddServerPage.serverMsg1") + " #"+serverName + this.translate.instant("AddServerPage.serverMsg2")
    }

    formatFollowSuccessMsg(feedsName: string): string{
        return this.translate.instant("common.followed")+" "+feedsName+" "+this.translate.instant("common.successfully");
    }

    formatUnFollowSuccessMsg(feedsName: string): string{
        return this.translate.instant("common.unfollowed")+" "+feedsName+" "+this.translate.instant("common.successfully");
    }

}
