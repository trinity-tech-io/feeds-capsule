import { Component, OnInit} from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { PopoverController} from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';
import { Events } from 'src/app/services/events.service';
import { NavParams } from '@ionic/angular';

@Component({
  selector: 'app-publisherdialog',
  templateUrl: './publisherdialog.component.html',
  styleUrls: ['./publisherdialog.component.scss'],
})
export class PublisherdialogComponent implements OnInit {
  public pageName:string = "";
  constructor(
    public theme: ThemeService,
    private popoverController: PopoverController,
    private native: NativeService,
    private feedService: FeedService,
    private events: Events,
    private navParams: NavParams
  ) {
    this.pageName = this.navParams.get('pageName') || "";
  }

  ngOnInit() {}

  async cancel(){
   await this.popoverController.dismiss();
  }

  async learnMore(){
    await this.popoverController.dismiss();
    this.feedService.setBindPublisherAccountType('new');
    this.native.navigateForward(['bindservice/introduce'], '');
  }

 async createNewPublisherAccount(){
  await this.popoverController.dismiss();
  this.events.publish(FeedsEvent.PublishType.clickDialog,{dialogName:"publisherAccount",clickButton:"createNewPublisherAccount",pageName:this.pageName});
  }

 async bindExistingPublisherAccount(){
  await this.popoverController.dismiss();
  this.events.publish(FeedsEvent.PublishType.clickDialog,{dialogName:"publisherAccount",clickButton:"bindExistingPublisherAccount",pageName:this.pageName});
 }

}
