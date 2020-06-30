import { Component, OnInit } from '@angular/core';
import { NavController, PopoverController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-postfrom',
  templateUrl: './postfrom.component.html',
  styleUrls: ['./postfrom.component.scss'],
})


export class PostfromComponent implements OnInit {
  private channels: any;
  private channelAvatar = "../../../../assets/images/component-480-47.png";
  constructor(
    private navCtrl: NavController,
    private feedService: FeedService,
    private router: Router,
    private popover: PopoverController) {
    this.channels = this.feedService.refreshMyChannels();
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
}
