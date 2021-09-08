import { Component, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { PopoverController} from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { Events } from 'src/app/services/events.service';

@Component({
  selector: 'app-guidedialog',
  templateUrl: './guidedialog.component.html',
  styleUrls: ['./guidedialog.component.scss'],
})
export class GuidedialogComponent implements OnInit {

  constructor(
    public theme: ThemeService,
    private popoverController: PopoverController,
    private native: NativeService,
    private events: Events
    ) { }

  ngOnInit() {}

 async goMac(){
   this.events.publish(FeedsEvent.PublishType.clickDialog,{dialogName:"guide",clickButton:"guidemac"});
  }

  async goUbuntu(){
    //await this.popoverController.dismiss();
    this.events.publish(FeedsEvent.PublishType.clickDialog,{dialogName:"guide",clickButton:"guideubuntu"});
   }

  async skip(){
    //await this.popoverController.dismiss();
    this.events.publish(FeedsEvent.PublishType.clickDialog,{dialogName:"guide",clickButton:"skip"});
  }

}
