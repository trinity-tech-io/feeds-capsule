import { Component, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { PopoverController } from '@ionic/angular';
import { Events } from '../../services/events.service';
import { FeedService } from '../../services/FeedService';

@Component({
  selector: 'app-nftdisclaimer',
  templateUrl: './nftdisclaimer.component.html',
  styleUrls: ['./nftdisclaimer.component.scss'],
})
export class NftdisclaimerComponent implements OnInit {

  constructor(
    private popover: PopoverController,
    private events: Events,
    private feedService: FeedService,
    public theme: ThemeService,
  ) { }

  ngOnInit() {}

  cancel(){
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

 async confirm(){
  await this.popover.dismiss();
  this.events.publish(FeedsEvent.PublishType.nftdisclaimer);
  this.feedService.setNftFirstdisclaimer("1");
  this.feedService.setData("feeds:nftFirstdisclaimer","1");
 }

}
