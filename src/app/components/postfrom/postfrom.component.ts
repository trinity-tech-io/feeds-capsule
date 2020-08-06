import { Component, OnInit } from '@angular/core';
import { NavController, PopoverController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from '../../services/theme.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-postfrom',
  templateUrl: './postfrom.component.html',
  styleUrls: ['./postfrom.component.scss'],
})


export class PostfromComponent implements OnInit {
  public nodeStatus = {};
  private channels: any = [];
  private channelAvatar = "./assets/images/component-480-47.png";
  constructor(
    private navCtrl: NavController,
    private feedService: FeedService,
    private router: Router,
    private popover: PopoverController,
    public theme:ThemeService) {
    this.channels = this.feedService.refreshMyChannels();
    this.initnodeStatus();
  }

  ngOnInit() {}


  selectChannel(nodeId, channelId){
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
