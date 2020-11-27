import { Component, OnInit } from '@angular/core';
import { PostfromComponent } from '../../components/postfrom/postfrom.component';
import { PopoverController } from '@ionic/angular';
import { FeedService } from '../../services/FeedService';
import { NativeService } from '../../services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from 'src/app/services/theme.service';
import { Events } from '@ionic/angular';
import * as _ from 'lodash';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
declare let appManager: AppManagerPlugin.AppManager;

@Component({
  selector: 'app-feeds',
  templateUrl: './feeds.page.html',
  styleUrls: ['./feeds.page.scss'],
})
export class FeedsPage implements OnInit {
  public totalunread:number = 0;
  public title = "";
  public currentTab = "";

  constructor(
    private native: NativeService,
    private feedService: FeedService,
    private popoverController: PopoverController,
    private translate:TranslateService,
    public theme:ThemeService,
    private event:Events
  ) {
  }

  ngOnInit() {

  }

  initTab(){
    let currentTab = this.feedService.getCurTab();
      switch(currentTab){
        case "home":
          this.home();
          break;
      case "profile":
          this.profile();
          break;
      case "notification":
          this.notification();
          break;
      case "search":
          this.search()
          break;             
      }
  }

  ionViewWillEnter() {

    this.getUnReadNum();
    
    this.event.subscribe("feeds:updateTitle",()=>{
      this.initTile();
    });

    this.event.subscribe("feeds:UpdateNotification",()=>{
       this.getUnReadNum();
    });
  }

  ionViewWillLeave(){
    this.event.unsubscribe("feeds:updateTitle");
    this.event.unsubscribe("feeds:UpdateNotification");
  }

  initTile(){
   titleBarManager.setTitle(this.translate.instant(this.title));
  }

  ionViewDidEnter() {
    this.initTab();
    this.initTile();
    this.native.setTitleBarBackKeyShown(false);
    appManager.setVisible("show");
  }

  create(){
    this.event.publish("feeds:tabsendpost");
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    let bindingServer = this.feedService.getBindingServer();
    if (bindingServer == null || bindingServer == undefined){
      this.native.navigateForward(['/bindservice/scanqrcode'],"");
      return ;
    }


    if (!this.feedService.checkBindingServerVersion(()=>{
      this.feedService.hideAlertPopover();
    })) return;


    if(this.feedService.getMyChannelList().length === 0){
      this.native.navigateForward(['/createnewfeed'],"");
      return;
    }

    if(this.feedService.getMyChannelList().length === 1){
      this.event.publish("feeds:createpost");
      let myChannel = this.feedService.getMyChannelList()[0];
      this.native.navigateForward(['createnewpost/',myChannel.nodeId,myChannel.id],"");
      return;
    }
      
    if(this.feedService.getMyChannelList().length>1){
      this.openPopOverComponent();
      return ;
    }
  }

  async openPopOverComponent() {
    this.popoverController.create(
      {
        component:PostfromComponent,
        cssClass: 'bottom-sheet-popover1',
        showBackdrop:true,
      }).then((popoverElement)=>{
        popoverElement.present();
      })
    }

    home(){
      this.currentTab = "home";
      // this.feedService.currentTab = "home";
      this.title = "FeedsPage.tabTitle1";
      this.initTile();
      this.native.setTitleBarBackKeyShown(false);
      this.feedService.setCurTab(this.currentTab);
    }

    profile(){
      this.currentTab = "profile";
      this.title = "FeedsPage.tabTitle2"
      this.initTile();
      this.native.setTitleBarBackKeyShown(false);
      this.feedService.setCurTab(this.currentTab);
    }

    notification(){
      this.currentTab = "notification";
      this.title = "FeedsPage.tabTitle3";
      this.initTile();
      this.native.setTitleBarBackKeyShown(false);
      this.feedService.setCurTab(this.currentTab);
    }

    search(){
      this.currentTab = "search";
      this.title = "FeedsPage.tabTitle4";
      this.initTile();
      this.native.setTitleBarBackKeyShown(false);
      this.feedService.setCurTab(this.currentTab);
    }


    tabChanged(event){
      this.currentTab = event.tab;
    }

    getUnReadNum(){

     let  nList = this.feedService.getNotificationList() || [];
     if(nList.length === 0){
        this.totalunread = 0;
        return;
     }

    let uList =  _.filter(nList,(item:any)=>{ return item.readStatus === 1; });
    this.totalunread = uList.length;

    }
}
