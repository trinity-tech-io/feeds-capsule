import { Component, OnInit } from '@angular/core';
import { NavController, PopoverController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from '../../services/theme.service';
import { Router } from '@angular/router';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'app-postfrom',
  templateUrl: './postfrom.component.html',
  styleUrls: ['./postfrom.component.scss'],
})


export class PostfromComponent implements OnInit {
  public nodeStatus = {};
  public channels: any = [];
  public channelAvatar = "./assets/images/component-480-47.png";
  constructor(
    private native: NativeService,
    private navCtrl: NavController,
    private feedService: FeedService,
    private router: Router,
    private popover: PopoverController,
    public theme:ThemeService,
    private translate:TranslateService) {
    this.channels = this.feedService.refreshMyChannels();
    this.initnodeStatus();
  }

  ngOnInit() {}


  selectChannel(nodeId, channelId){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }
    this.navCtrl.navigateForward(['createnewpost/',nodeId,channelId]);
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
}
