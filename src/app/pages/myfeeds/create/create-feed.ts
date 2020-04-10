import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events, PopoverController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { PopupProvider } from 'src/app/services/popup';
import { NativeService } from 'src/app/services/NativeService';
import { ServerlistcomponentComponent } from '../../../components/serverlistcomponent/serverlistcomponent.component';



@Component({
  selector: 'page-create-feed',
  templateUrl: './create-feed.html',
  styleUrls: ['./create-feed.scss'],
})
export class CreateFeedPage implements OnInit {
  private connectStatus = 1;
  private serverList: any;
  private selectedServer: any = null;
  private buttonText: string = "Select channel source";
  constructor(
    private navCtrl: NavController,
    private feedService: FeedService,
    private zone: NgZone,
    private events: Events,
    private popup: PopupProvider,
    private popoverController: PopoverController,
    private native: NativeService) {
      this.connectStatus = this.feedService.getConnectionStatus();
      this.serverList = feedService.getServerList();
      this.events.subscribe('feeds:createTopicSuccess', () => {
        this.navigateBack();
        this.native.toast("Create topic success!");
      });
      this.events.subscribe('feeds:connectionChanged', connectionStatus => {
        this.zone.run(() => {
            this.connectStatus = connectionStatus;
        });
    });
  }

  ngOnInit() {
  }

  createTopic(name: HTMLInputElement, desc: HTMLInputElement, select: HTMLInputElement){
    if (select.value=="" || name.value=="" || desc.value == ""){
      alert("Invalid params");
      return ;
    }

    this.popup.ionicConfirm("Prompt","Confirm new topic?<br>"+"server:"+select.value+"<br>"+"topic:"+name.value+"<br>"+"description:"+desc.value,
                            "ok","cancel").then((data)=>{
                              if (data) {
                                
                                this.feedService.createTopic(select.value, name.value, desc.value);
                              }
                            });
    
  }

  navigateBack() {
    this.navCtrl.pop();
  }

  async selectChannelSource(){
    // alert("selectChannelSource");
    
    const popover = await this.popoverController.create({
      component: ServerlistcomponentComponent,
      componentProps: {serverList:this.serverList},
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
    console.log("onevent--->"+msg);
  }

  changeChannelSource(){
    alert("changeChannelSource");
  }
  
}
