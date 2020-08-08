import { Component, OnInit ,Input} from '@angular/core';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { MenuService } from 'src/app/services/MenuService';
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'app-myfeeds',
  templateUrl: './myfeeds.component.html',
  styleUrls: ['./myfeeds.component.scss'],
})
export class MyfeedsComponent implements OnInit {
  @Input() channels:any = [];
  @Input() nodeStatus:any = {};
  constructor(
    private feedService: FeedService,
    public theme:ThemeService,
    private native:NativeService,
    private menuService: MenuService,
    private translate:TranslateService) {
    
  }

  ngOnInit() {
   
  }

  createNewFeed(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    let bindServer = this.feedService.getBindingServer();
    
    if (bindServer != null && bindServer != undefined){
      if(this.feedService.getConnectionStatus() != 0){
        this.native.toastWarn('common.connectionError');
        return;
      }
      this.native.navigateForward(['/createnewfeed'],"");
    }
    else 
      this.native.getNavCtrl().navigateForward(['/bindservice/scanqrcode']);
  }


  navTo(nodeId, channelId){
    this.native.getNavCtrl().navigateForward(['/channels', nodeId, channelId]);
  }


  parseAvatar(avatar: string): string{
    return this.feedService.parseChannelAvatar(avatar);
  }

  menuMore(nodeId: string , channelId: number, channelName: string){
    this.menuService.showShareMenu(nodeId, channelId, channelName);
  }

  handleClientNumber(nodeId){
    return this.feedService.getServerStatisticsNumber(nodeId);
  }
}

