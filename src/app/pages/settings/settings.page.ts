import { Component, OnInit } from '@angular/core';
import { Events } from '@ionic/angular';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';
import { PopupProvider } from 'src/app/services/popup';
import { StorageService } from '../../services/StorageService';
import { AppService } from '../../services/AppService';


declare let titleBarManager: TitleBarPlugin.TitleBarManager;
@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  public developerMode:boolean =  false;
  public popover:any = null;
  constructor(
    private feedService:FeedService,
    private events: Events,
    private native: NativeService,
    private translate:TranslateService,
    private appService: AppService,
    public theme:ThemeService,
    public popupProvider:PopupProvider,
    public storageService:StorageService,
    ) { 

  }

  ngOnInit() {
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("app.settings"));
  }

  ionViewWillEnter() {
    this.developerMode = this.feedService.getDeveloperMode();
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
    
    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });
  }

  ionViewDidEnter(){
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:updateTitle");
    // if(this.popover!=null){
    //   this.popover.dismiss();
    // }
  }

  toggleDeveloperMode(){
    this.developerMode = !this.developerMode;
    this.feedService.setDeveloperMode(this.developerMode);
    this.feedService.setData("feeds.developerMode",this.developerMode);
  }

  cleanData(){
    this.popover = this.popupProvider.ionicConfirm(
      this,
      // "ConfirmdialogComponent.signoutTitle",
      "",
      "SettingsPage.des",
      this.cancel,
      this.confirm,
      'tskth.svg'
    );
  }

  cancel(that:any){
    if(this.popover!=null){
       this.popover.dismiss();
    }
  }

  confirm(that:any){
    if(this.popover!=null){
       this.popover.dismiss();
    }
    
     that.removeData();
  }


  removeData(){
    this.feedService.removeAllServerFriends();
    this.storageService.clearAll().then(()=>{
      localStorage.clear();
      this.feedService.resetConnectionStatus();
      this.feedService.destroyCarrier();
      this.appService.hideright();
      this.native.setRootRouter('disclaimer');
      this.native.toast("SettingsPage.des1"); 
    }).catch((err)=>{
       
    })
  }

}
