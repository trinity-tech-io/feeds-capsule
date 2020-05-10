import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events, PopoverController } from '@ionic/angular';
import { ServerlistcomponentComponent } from '../../../components/serverlistcomponent/serverlistcomponent.component';
import { FeedService } from 'src/app/services/FeedService';
import { PopupProvider } from 'src/app/services/popup';
import { NativeService } from 'src/app/services/NativeService';

declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-createnewfeed',
  templateUrl: './createnewfeed.page.html',
  styleUrls: ['./createnewfeed.page.scss'],
})
export class CreatenewfeedPage implements OnInit {
  private selectedServer: any = null;
  private selectedChannelSource:string = 'Select channel source';
  constructor(
    private navCtrl: NavController,
    private feedService: FeedService,
    private popoverController: PopoverController,
    private popup: PopupProvider,
    private zone: NgZone,
    private events: Events,
    private native: NativeService) {
      this.events.subscribe('feeds:createTopicSuccess', () => {
        this.navigateBack();
        this.native.toast("Create topic success!");
      });
    }

  ngOnInit() {
    // titleBarManager.setTitle("Create New Feed");
    // titleBarManager.setBackgroundColor("#FFFFFF");
    // titleBarManager.setForegroundMode(TitleBarPlugin.TitleBarForegroundMode.DARK);
    // titleBarManager.setNavigationMode(TitleBarPlugin.TitleBarNavigationMode.BACK);
     
    // titleBarManager.setupMenuItems([{key: 'registerApp', iconPath: '/assets/images/register.png', title: 'Register Capsule'}], null);

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
    if (name.value=="" || desc.value == "" || this.selectedServer == null){
      alert("Invalid params");
      return ;
    }

    this.popup.ionicConfirm("Prompt","Confirm new topic?<br>"+"server:"+this.selectedServer.did+"<br>"
                            +"channel:"+name.value+"<br>"+"description:"+desc.value,
                            "ok","cancel").then((data)=>{
                              if (data) {
                                
                                this.feedService.createTopic(this.selectedServer.nodeId, name.value, desc.value);
                              }
                            });
  }
}
