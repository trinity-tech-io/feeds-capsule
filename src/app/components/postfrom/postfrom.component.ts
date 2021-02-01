import { Component, OnInit } from '@angular/core';
import { NavController, PopoverController,Events} from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from '../../services/theme.service';
import { NativeService } from 'src/app/services/NativeService';



@Component({
  selector: 'app-postfrom',
  templateUrl: './postfrom.component.html',
  styleUrls: ['./postfrom.component.scss'],
})


export class PostfromComponent implements OnInit {
  public nodeStatus = {};
  public channels: any = [];
  public channelAvatar = "";
  constructor(
    private native: NativeService,
    private navCtrl: NavController,
    private feedService: FeedService,
    private event: Events,
    private popover: PopoverController,
    public theme:ThemeService) {
    this.channels = this.feedService.refreshMyChannels();
    this.initnodeStatus();
  }

  ngOnInit() {}


  selectChannel(nodeId, channelId){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (!this.feedService.checkBindingServerVersion(()=>{
      this.feedService.hideAlertPopover();
    })) return;
    this.event.publish(FeedsEvent.PublishType.createpost);
    this.navCtrl.navigateForward(['/createnewpost',nodeId,channelId]);
    
    // this.router.navigate(['createnewpost/',nodeId,channelId]);
    // this.router.navigate(['createnewpost']);

    // this.router.navigate(['/createnewfeed']);
    this.popover.dismiss();
  }

  parseAvatar(avatar: string): string{
    return this.feedService.parseChannelAvatar(avatar);
  }

  handleClientNumber(nodeId){
    return this.feedService.getServerStatisticsNumber(nodeId);
  }

  checkServerStatus(nodeId: string){
    return this.feedService.getServerStatusFromId(nodeId);
  }

  initnodeStatus(){
    for(let index =0 ;index<this.channels.length;index++){
           let nodeId = this.channels[index]['nodeId'];
           let status = this.checkServerStatus(nodeId);
           this.nodeStatus[nodeId] = status;
    }
 }

 pressName(channelName:string){
  let name =channelName || "";
  if(name != "" && name.length>15){
    this.native.createTip(name);
  }
 }
}
