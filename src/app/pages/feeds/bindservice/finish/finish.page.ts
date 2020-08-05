import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from 'src/app/services/NativeService';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-finish',
  templateUrl: './finish.page.html',
  styleUrls: ['./finish.page.scss'],
})
export class FinishPage implements OnInit {
  private title = "06/06";
  private nodeId = "";
  constructor(
    private native: NativeService,
    private acRoute: ActivatedRoute,
    ) {

    }

    ngOnInit(){
      this.acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
      });
    }

    ionViewDidEnter() {
      this.initTitle();
      this.native.setTitleBarBackKeyShown(true);
    }
  
    ionViewWillLeave(){
     
    }
  
  
    initTitle(){
      titleBarManager.setTitle(this.title);
    }

  createChannel(){
      this.native.navigateForward(['/createnewfeed'],{
        replaceUrl: true
      });
  }

  returnMain(){
    this.native.pop();
  }
}
