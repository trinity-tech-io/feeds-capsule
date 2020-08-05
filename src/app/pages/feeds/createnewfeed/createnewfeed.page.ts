import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events, PopoverController } from '@ionic/angular';
import { ServerlistcomponentComponent } from '../../../components/serverlistcomponent/serverlistcomponent.component';
import { FeedService } from 'src/app/services/FeedService';
import { PopupProvider } from 'src/app/services/popup';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from "@ngx-translate/core";
import { Router } from '@angular/router';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-createnewfeed',
  templateUrl: './createnewfeed.page.html',
  styleUrls: ['./createnewfeed.page.scss'],
})
export class CreatenewfeedPage implements OnInit {
  private connectionStatus = 1;
  public channelAvatar = "";
  private avatar = "";
  private selectedServer: any = null;
  private selectedChannelSource:string = 'Select channel source';
  constructor(
    private router: Router,
    private navCtrl: NavController,
    private feedService: FeedService,
    private popoverController: PopoverController,
    private popup: PopupProvider,
    private zone: NgZone,
    private events: Events,
    private native: NativeService,
    public theme:ThemeService,
    private translate:TranslateService) {

    

    }

  ngOnInit() {
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.selectedServer = this.feedService.getBindingServer();
    this.selectedChannelSource = this.selectedServer.did;
  }

  ionViewWillEnter() {
    this.channelAvatar = this.feedService.getProfileIamge();
    this.avatar = this.feedService.parseChannelAvatar(this.channelAvatar);
    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });
    this.events.subscribe('feeds:createTopicSuccess', () => {
      this.navCtrl.pop().then(()=>{
        this.native.toast(this.translate.instant("CreatenewfeedPage.createfeedsuccess"));
      })
    });

    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });
  
  }

  ionViewDidEnter() {
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:createTopicSuccess");
    this.events.unsubscribe("feeds:updateTitle");
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("CreatenewfeedPage.createNewFeed"));
  }

  async selectChannelSource(event){
    // alert("selectChannelSource");

    const popover = await this.popoverController.create({
      component: ServerlistcomponentComponent,
      componentProps: {serverList:this.feedService.getCreationServerList()},
      event:event,
      translucent: true
    });

    popover.onDidDismiss().then((result)=>{
      if(result.data == undefined){
        return;
      }

      this.zone.run(() => {
        this.selectedServer = result.data;

        this.selectedChannelSource = this.selectedServer.did;
      })

    });
    return await popover.present();
  }

  createChannel(name: HTMLInputElement, desc: HTMLInputElement){
    let nameValue = name.value || "";
        nameValue = this.native.iGetInnerText(nameValue);
    if (nameValue==""){
      this.native.toast_trans("CreatenewfeedPage.tipMsg1");
      return ;
    }
    let descValue = desc.value || "";
        descValue = this.native.iGetInnerText(descValue);
    if (descValue == ""){
      this.native.toast_trans("CreatenewfeedPage.tipMsg2");
      return ;
    }

    if (desc.value.length > 128){
      this.native.toast_trans("CreatenewfeedPage.tipMsgLength");
      return ;
    }

    this.channelAvatar = this.feedService.getProfileIamge() || "";

    if (this.channelAvatar == ""){
      this.native.toast_trans("CreatenewfeedPage.tipMsg");
      return ;
    }

    this.avatar = this.feedService.parseChannelAvatar(this.channelAvatar);

    if (this.selectedServer == null){
      this.native.toast_trans("CreatenewfeedPage.tipMsg3");
      return ;
    }

    this.popup.ionicConfirm(this.translate.instant("common.prompt"),this.translate.instant('common.des1')+this.selectedServer.did+"<br>"
                            +this.translate.instant('common.channel')+name.value+"<br>"+this.translate.instant('common.description')+desc.value,
                            this.translate.instant("common.ok"),this.translate.instant("common.cancel")).then((data)=>{
                              if (data) {
                                this.feedService.createTopic(this.selectedServer.nodeId, name.value, desc.value, this.channelAvatar);
                              }
                            });
  }

  profileimage(){
    this.native.navigateForward(['/profileimage'],"");
  }

}
