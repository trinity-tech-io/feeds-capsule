import { Component, OnInit , NgZone,ViewChild} from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { FeedService } from '../../../../services/FeedService';
import { ThemeService } from '../../../../services/theme.service';
import { NativeService } from '../../../../services/NativeService';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

@Component({
  selector: 'app-introduce',
  templateUrl: './introduce.page.html',
  styleUrls: ['./introduce.page.scss'],
})
export class IntroducePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public connectionStatus = 1;
  public bindPublisherAccountType:string = "";
  constructor(
    private feedService: FeedService,
    private translate:TranslateService,
    private zone:NgZone,
    private events:Events,
    private native:NativeService,
    private titleBarService: TitleBarService,
    public theme:ThemeService,
  ) { }

  ngOnInit() {
  }


  ionViewWillEnter() {
    this.bindPublisherAccountType = this.feedService.getBindPublisherAccountType();
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.initTile();
    this.addEvent();
  }

  ionViewWillLeave(){
    this.removeEvent();
    this.events.publish(FeedsEvent.PublishType.search);
  }

  initTile(){
    this.titleBarService.setTitle(this.titleBar, this.translate.instant("IntroducePage.title"));
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
   }

   addEvent(){
    this.events.subscribe(FeedsEvent.PublishType.updateTitle,()=>{
      this.initTile();
    });

    this.events.subscribe(FeedsEvent.PublishType.connectionChanged,(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });
   }

   removeEvent(){
    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
   }

   next(){
    // this.native.navigateForward(['bindservice/scanqrcode'],{
    //   replaceUrl: true
    //  });
    this.native.pop();
   }

   back(){
    this.native.pop();
   }

   gotoWebsite(){
    this.native.openUrl("https://trinity-feeds.app");
   }

}
