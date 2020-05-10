import { Component, OnInit } from '@angular/core';
import { FeedService } from 'src/app/services/FeedService';
import { Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-postfrom',
  templateUrl: './postfrom.component.html',
  styleUrls: ['./postfrom.component.scss'],
})


export class PostfromComponent implements OnInit {
  private channels: any;
  constructor(private feedService: FeedService,
    private router: Router,
    private popover: PopoverController) {
    this.channels = this.feedService.refreshMyChannels();

  }

  ngOnInit() {}


  selectChannel(nodeId, channelId){
    this.router.navigate(['createnewpost/',nodeId,channelId]);
    // this.router.navigate(['createnewpost']);

    // this.router.navigate(['/createnewfeed']);
    this.popover.dismiss();
  }
}
