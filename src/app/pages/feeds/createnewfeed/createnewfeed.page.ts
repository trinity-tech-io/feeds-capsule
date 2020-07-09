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
      this.events.subscribe('feeds:createTopicSuccess', () => {
        // this.navigateBack();
        this.navCtrl.pop().then(()=>{
          this.native.toast("Create topic success!");
        })
          
      });

      this.events.subscribe('feeds:selectavatar', (avatar)=>{
        this.channelAvatar = avatar;

        this.avatar = this.feedService.parseChannelAvatar(avatar);
      });
    }

  ngOnInit() {
    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

  ionViewWillUnload(){
    this.events.unsubscribe("feeds:updateTitle");
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("CreatenewfeedPage.createNewFeed"));
  }

  navigateBack() {
    this.navCtrl.pop();
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
    if (this.channelAvatar == ""){
      alert(this.translate.instant("CreatenewfeedPage.tipMsg"));
      return ;
    }

    if (name.value==""){
      alert(this.translate.instant("CreatenewfeedPage.tipMsg1"));
      return ;
    }

    if(desc.value == ""){
      alert(this.translate.instant("CreatenewfeedPage.tipMsg2"));
      return ;
    }
    
    if (this.selectedServer == null){
      alert(this.translate.instant("CreatenewfeedPage.tipMsg3"));
      return ;
    }

    this.popup.ionicConfirm("Prompt","Confirm new topic?<br>"+"server:"+this.selectedServer.did+"<br>"
                            +"channel:"+name.value+"<br>"+"description:"+desc.value,
                            "ok","cancel").then((data)=>{
                              if (data) {
                                this.feedService.createTopic(this.selectedServer.nodeId, name.value, desc.value, this.channelAvatar);
                              }
                            });
  }

  profileimage(){
    // this.router.navigate(['/profileimage']);
    this.navCtrl.navigateForward(['/profileimage']);
  }

}
