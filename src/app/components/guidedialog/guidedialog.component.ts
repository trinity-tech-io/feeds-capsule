import { Component, Input, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { PopoverController} from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { Events } from 'src/app/services/events.service';
import { NavParams } from '@ionic/angular';

@Component({
  selector: 'app-guidedialog',
  templateUrl: './guidedialog.component.html',
  styleUrls: ['./guidedialog.component.scss'],
})
export class GuidedialogComponent implements OnInit {
  public pageName:string = "";
  constructor(
    public theme: ThemeService,
    private popoverController: PopoverController,
    private native: NativeService,
    private events: Events,
    private navParams: NavParams
    ) {
      this.pageName = this.navParams.get('pageName') || "";
     }

  ngOnInit() {}

 goMac(){
   this.events.publish(FeedsEvent.PublishType.clickDialog,{dialogName:"guide",clickButton:"guidemac",pageName:this.pageName});
  }

  goUbuntu(){
    //await this.popoverController.dismiss();
    this.events.publish(FeedsEvent.PublishType.clickDialog,{dialogName:"guide",clickButton:"guideubuntu",pageName:this.pageName});
   }

  skip(){
    //await this.popoverController.dismiss();
    this.events.publish(FeedsEvent.PublishType.clickDialog,{dialogName:"guide",clickButton:"skip",pageName:this.pageName});
  }

}
