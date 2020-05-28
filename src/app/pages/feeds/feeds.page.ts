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
  private title = "My Timeline";
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
    if(this.feedService.getMyChannelList().length>0){
      this.openPopOverComponent();
    }else{
      this.router.navigate(['/createnewfeed']);
    }
    
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
      this.title = "My Timeline";
      titleBarManager.setTitle(this.title);
      this.native.setTitleBarBackKeyShown(false);
      console.log("uuid = "+this.feedService.generateNonce());
    }

    profile(){
      this.title = "My Profile"
      titleBarManager.setTitle(this.title);
      this.native.setTitleBarBackKeyShown(false);
    }

    notification(){
      this.title = "Notification";
      titleBarManager.setTitle(this.title);
      this.native.setTitleBarBackKeyShown(false);
    }

    search(){
      this.title = "Explore Feeds";
      titleBarManager.setTitle("Explore Feeds");
      this.native.setTitleBarBackKeyShown(false);
    }
}
