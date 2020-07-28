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

      acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
      });
    }
    ionViewWillEnter(){
      this.initTitle();
      this.native.setTitleBarBackKeyShown(true);
    }
  
    ionViewWillUnload(){
    
    }
  
  
    initTitle(){
      titleBarManager.setTitle(this.title);
    }

  ngOnInit() {
  }

  createChannel(){
    this.native.getNavCtrl().pop().then(()=>{
      this.native.getRouter().navigate(['/createnewfeed']);
    });
  }

  returnMain(){
    this.native.getRouter().navigate(['/tabs/home']);
  }
}
