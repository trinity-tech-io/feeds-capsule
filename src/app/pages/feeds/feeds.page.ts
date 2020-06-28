import { Component, OnInit } from '@angular/core';
import { PostfromComponent } from '../../components/postfrom/postfrom.component';
import { PopoverController } from '@ionic/angular';
import { FeedService } from '../../services/FeedService';
import { Router } from '@angular/router';
import { NativeService } from '../../services/NativeService';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-feeds',
  templateUrl: './feeds.page.html',
  styleUrls: ['./feeds.page.scss'],
})
export class FeedsPage implements OnInit {
  public title = "My Timeline";
  public currentTab = "home";
  constructor(
    private native: NativeService,
    private feedService: FeedService,
    private router: Router,
    private popoverController: PopoverController) {
    }

  ngOnInit() {
    titleBarManager.setBackgroundColor("#FFFFFF");
    titleBarManager.setForegroundMode(TitleBarPlugin.TitleBarForegroundMode.DARK);
  }

  ionViewDidEnter() {
    titleBarManager.setTitle(this.title);
    this.native.setTitleBarBackKeyShown(false);
  }

  create(){
    let bindingServer = this.feedService.getBindingServer();
    if (bindingServer == null || bindingServer == undefined){
      // this.router.navigate(['/bindservice/scanqrcode']);
      this.router.navigateByUrl('/bindservice/scanqrcode');
      return ;
    }
      
    if(this.feedService.getMyChannelList().length>0){
      this.openPopOverComponent();
      return ;
    }

    this.router.navigate(['/createnewfeed']);
  }

  async openPopOverComponent() {
    this.popoverController.create(
      {
        component:PostfromComponent,
        // componentProps: {nodeId:this.nodeId,id:this.id},
        cssClass: 'bottom-sheet-popover'
      }).then((popoverElement)=>{
        popoverElement.present();
      })
    }

    home(){
      this.currentTab = "home";
      // this.feedService.currentTab = "home";
      this.title = "My Timeline";
      titleBarManager.setTitle(this.title);
      this.native.setTitleBarBackKeyShown(false);
    }

    profile(){
      this.currentTab = "profile";
      this.title = "My Profile"
      titleBarManager.setTitle(this.title);
      this.native.setTitleBarBackKeyShown(false);
    }

    notification(){
      this.currentTab = "notification";
      this.title = "Notification";
      titleBarManager.setTitle(this.title);
      this.native.setTitleBarBackKeyShown(false);
    }

    public search(){
      this.currentTab = "search";
      this.feedService.refreshChannels();
      this.title = "Explore Feeds";
      titleBarManager.setTitle("Explore Feeds");
      this.native.setTitleBarBackKeyShown(false);
    }
}
