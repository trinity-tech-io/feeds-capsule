import { Component, Input, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { Events } from 'src/app/services/events.service';

@Component({
  selector: 'app-guidedialog',
  templateUrl: './guidedialog.component.html',
  styleUrls: ['./guidedialog.component.scss'],
})
export class GuidedialogComponent implements OnInit {
  @Input () pageName:string = "";
  constructor(
    public theme: ThemeService,
    private events: Events
    ) {
     }

  ngOnInit() {}

 goMac(){
   this.events.publish(FeedsEvent.PublishType.clickDialog,{dialogName:"guide",clickButton:"guidemac",pageName:this.pageName});
  }

  goUbuntu(){
    this.events.publish(FeedsEvent.PublishType.clickDialog,{dialogName:"guide",clickButton:"guideubuntu",pageName:this.pageName});
   }

  skip(){
    this.events.publish(FeedsEvent.PublishType.clickDialog,{dialogName:"guide",clickButton:"skip",pageName:this.pageName});
  }

}
