import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events, PopoverController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { PopupProvider } from 'src/app/services/popup';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { ServerlistcomponentComponent } from '../../../components/serverlistcomponent/serverlistcomponent.component';



@Component({
  selector: 'page-create-feed',
  templateUrl: './create-feed.html',
  styleUrls: ['./create-feed.scss'],
})
export class CreateFeedPage implements OnInit {
  private connectStatus = 1;
  // private serverList: any;
  private selectedServer: any = null;
  private buttonText: string = "Select channel source";
  constructor(
    private navCtrl: NavController,
    private feedService: FeedService,
    private zone: NgZone,
    private events: Events,
    private popup: PopupProvider,
    private popoverController: PopoverController,
    private native: NativeService,
    private translate: TranslateService) {
      // this.feedService.getCreationServerMap();
      this.connectStatus = this.feedService.getConnectionStatus();

      this.events.subscribe('feeds:createTopicSuccess', () => {
        this.navigateBack();
        this.native.toast(this.translate.instant("CreatenewfeedPage.createfeedsuccess"));
      });
      this.events.subscribe('feeds:connectionChanged', connectionStatus => {
        this.zone.run(() => {
            this.connectStatus = connectionStatus;
        });
    });
  }

  ngOnInit() {
  }

  createTopic(name: HTMLInputElement, desc: HTMLInputElement){
    if (name.value=="" || desc.value == ""){
      alert("Invalid params");
      return ;
    }

    this.popup.ionicConfirm("Prompt","Confirm new topic?<br>"+"server:"+this.selectedServer.did+"<br>"
                            +"channel:"+name.value+"<br>"+"description:"+desc.value,
                            "ok","cancel").then((data)=>{
                              if (data) {

                                this.feedService.createTopic(this.selectedServer.nodeId, name.value, desc.value, null);
                              }
                            });

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
        this.buttonText = "Change channel source";
        this.selectedServer = result.data;
      })

    });
    return await popover.present();
  }

  getData(msg: String){
  }

  changeChannelSource(){
  }

}
