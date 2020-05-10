import { Component, OnInit } from '@angular/core';
import { PostfromComponent } from '../../components/postfrom/postfrom.component';
import { PopoverController } from '@ionic/angular';
import { FeedService } from '../../services/FeedService';
import { Router } from '@angular/router';

declare let appManager: AppManagerPlugin.AppManager;

@Component({
  selector: 'app-feeds',
  templateUrl: './feeds.page.html',
  styleUrls: ['./feeds.page.scss'],
})
export class FeedsPage implements OnInit {

  constructor(
    private feedService: FeedService,
    private router: Router,
    private popoverController: PopoverController) {
      
    }

  ngOnInit() {
  }

  ionViewDidEnter() {
    // appManager.setVisible("show", ()=>{}, (err)=>{});
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
}
