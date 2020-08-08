import { Component, OnInit } from '@angular/core';
import { PostfromComponent } from '../../components/postfrom/postfrom.component';
import { NavController, PopoverController } from '@ionic/angular';
import { FeedService } from '../../services/FeedService';
import { NativeService } from '../../services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from 'src/app/services/theme.service';
import { Events } from '@ionic/angular';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
declare let appManager: AppManagerPlugin.AppManager;

@Component({
  selector: 'app-feeds',
  templateUrl: './feeds.page.html',
  styleUrls: ['./feeds.page.scss'],
})
export class FeedsPage implements OnInit {
  public title = "FeedsPage.tabTitle1";
  public currentTab = "home";
  constructor(
    private navCtrl: NavController,
    private native: NativeService,
    private feedService: FeedService,
    private popoverController: PopoverController,
    private translate:TranslateService,
    public theme:ThemeService,
    private event:Events) {
    }

  ngOnInit() {
  
  }

  ionViewWillEnter() {
    this.event.subscribe("feeds:updateTitle",()=>{
      this.initTile();
    });
  }

  ionViewWillLeave(){
    this.event.unsubscribe("feeds:updateTitle");
  }

  initTile(){
   titleBarManager.setTitle(this.translate.instant(this.title));
  }

  ionViewDidEnter() {
    this.initTile();
    this.native.setTitleBarBackKeyShown(false);
    appManager.setVisible("show");
  }

  create(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    let bindingServer = this.feedService.getBindingServer();
    if (bindingServer == null || bindingServer == undefined){
      this.navCtrl.navigateForward(['/bindservice/scanqrcode']);
      return ;
    }
      
    if(this.feedService.getMyChannelList().length>0){
      this.openPopOverComponent();
      return ;
    }

    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }
    this.native.navigateForward(['/createnewfeed'],"");
  }

  async openPopOverComponent() {
    this.popoverController.create(
      {
        component:PostfromComponent,
        // componentProps: {nodeId:this.nodeId,id:this.id},
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
    }

    profile(){
      this.currentTab = "profile";
      this.title = "FeedsPage.tabTitle2"
      this.initTile();
      this.native.setTitleBarBackKeyShown(false);
    }

    notification(){
      this.currentTab = "notification";
      this.title = "FeedsPage.tabTitle3";
      this.initTile();
      this.native.setTitleBarBackKeyShown(false);
    }

    search(){
      this.currentTab = "search";
      this.feedService.refreshChannels();
      this.title = "FeedsPage.tabTitle4";
      this.initTile();
      this.native.setTitleBarBackKeyShown(false);
    }


    tabChanged(event){
      this.currentTab = event.tab;
    }
}
