import { Component, OnInit, NgZone } from '@angular/core';
import { Events,PopoverController} from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from "@ngx-translate/core";
import { PopupProvider } from 'src/app/services/popup';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
    selector: 'page-servers',
    templateUrl: './servers.html',
    styleUrls: ['./servers.scss'],
})

export class ServersPage implements OnInit {

    public connectionStatus = 1;
    public myFeedSource = null;
    public serverStatisticsMap: any;

    public showMyFeeds = true;
    public popover:any = "";
    constructor(
        private events: Events,
        private zone: NgZone,
        private native: NativeService,
        private feedService: FeedService,
        private popoverController: PopoverController,
        public theme:ThemeService,
        private translate:TranslateService,
        public popupProvider:PopupProvider) {
    }

    ngOnInit() {
    }

    addSubscribe(){
        this.events.subscribe('feeds:connectionChanged',(status)=>{
            this.zone.run(() => {
                this.connectionStatus = status;
            });
        });


        this.events.subscribe('feeds:serverStatisticsChanged', serverStatisticsMap =>{
            this.zone.run(() => {
                this.serverStatisticsMap = serverStatisticsMap;
            });
        });

        this.events.subscribe('feeds:login_finish',(nodeId)=>{
            this.zone.run(() => {
                this.checkSignIn(nodeId);
            });
        });


        this.events.subscribe('feeds:bindServerFinish',()=>{
            this.zone.run(() => {
                let bindingServer = this.feedService.getBindingServer();

                if (bindingServer != null && bindingServer != undefined)
                    this.myFeedSource = bindingServer;
                    this.serverStatisticsMap = this.feedService.getServerStatisticsMap();
            });
        });
    }

    removeSubscribe(){
        this.events.unsubscribe("feeds:connectionChanged");
        this.events.unsubscribe("feeds:serverStatisticsChanged");
        this.events.unsubscribe("feeds:login_finish");
        this.events.unsubscribe("feeds:bindServerFinish");
    }

    initData(){
        let bindingServer = this.feedService.getBindingServer() || null;
        if (bindingServer != null){
            this.myFeedSource = this.feedService.getServerbyNodeId(bindingServer.nodeId);
        }else{
            this.myFeedSource = null;
        }
        this.serverStatisticsMap = this.feedService.getServerStatisticsMap();
    }

    doRefresh(event:any) {

      let sid= setTimeout(() => {

        let bindingServer = this.feedService.getBindingServer() || null;
        if (bindingServer != null){
            this.myFeedSource = this.feedService.getServerbyNodeId(bindingServer.nodeId);
        }else{
            this.myFeedSource = null;
        }

        this.serverStatisticsMap = this.feedService.getServerStatisticsMap();

            event.target.complete();
            clearTimeout(sid);
       }, 2000);
    }

    ionViewWillEnter(){
        this.initTitle();
        this.native.setTitleBarBackKeyShown(true);

        this.connectionStatus = this.feedService.getConnectionStatus();
        this.initData();
        this.events.subscribe("feeds:updateTitle",()=>{
            this.initTitle();
        });

        this.addSubscribe();
    }

    ionViewDidEnter() {
    }

    ionViewWillLeave(){
        let value =  this.popoverController.getTop()["__zone_symbol__value"] || "";
        if(value!=""){
          this.popoverController.dismiss();
          this.popover = "";
        }
        this.removeSubscribe();
        this.events.unsubscribe("feeds:updateTitle");
    }

    initTitle(){
        titleBarManager.setTitle(this.translate.instant('ServersPage.feedSources'));
    }

    navToServerInfo(nodeId: string, isOwner: boolean) {
        this.native.navigateForward(['/menu/servers/server-info',nodeId, isOwner],"");
    }

    checkSignIn(nodeId: string):boolean{
        return this.feedService.checkSignInServerStatus(nodeId);
    }

    checkConnectClient(nodeId: string){
        if (this.serverStatisticsMap == null ||
            this.serverStatisticsMap == undefined ||
            this.serverStatisticsMap[nodeId] == undefined)
            return 0;

        return this.serverStatisticsMap[nodeId].total_clients||0;
    }

    bindFeedSource(){
        if(this.feedService.getConnectionStatus() != 0){
            this.native.toastWarn('common.connectionError');
            return;
        }
        this.checkDid("/bindservice/scanqrcode");
    }

    checkDid(jumpPage:string){
        let signInData = this.feedService.getSignInData() || {};
        let did = signInData["did"];
        this.feedService.checkDIDDocument(did).then((isOnSideChain)=>{
          if (!isOnSideChain){
            //show one button dialog
            //if click this button
            //call feedService.promptpublishdid() function
            this.openAlert();
            return;
          }
          if(jumpPage === "/bindservice/scanqrcode"){
            this.native.navigateForward(['/bindservice/scanqrcode'],"");
          }else if(jumpPage === "/menu/servers/add-server"){
            this.native.navigateForward(['/menu/servers/add-server'],"");
          }
        });
      }

      openAlert(){
        this.popover = this.popupProvider.ionicAlert(
          this,
          // "ConfirmdialogComponent.signoutTitle",
          "",
          "common.didnotrelease",
          this.confirm,
          'tskth.svg'
        );
      }

      confirm(that:any){
          if(this.popover!=null){
             this.popover.dismiss();
             that.feedService.promptpublishdid();
          }
      }

     checkServerStatus(nodeId: string){
        return this.feedService.getServerStatusFromId(nodeId);
     }

}
