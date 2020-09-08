import { Component, OnInit } from '@angular/core';
import { PopoverController,NavParams} from '@ionic/angular';
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
@Component({
  selector: 'app-edittool',
  templateUrl: './edittool.component.html',
  styleUrls: ['./edittool.component.scss'],
})
export class EdittoolComponent implements OnInit {
  public nodeId:string ="";
  public channelId:number =0;
  public postId:number = 0;
  constructor(
    public theme:ThemeService,
    private navParams: NavParams,
    private popover: PopoverController, 
    private native:NativeService
  ) { }

  ngOnInit() {
    this.nodeId = this.navParams.get('nodeId')||"";
    this.channelId = this.navParams.get('channelId')|| 0;
    this.postId = this.navParams.get('postId')|| 0;
  }

  edit(){
    this.popover.dismiss();
    this.native.go("editcomment",{
      nodeId:this.nodeId,
      channelId:this.channelId,
      postId:this.postId
    });
  }

  remove(){
    this.popover.dismiss();
  }

}
