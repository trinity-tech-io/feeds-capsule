import { Component, OnInit } from '@angular/core';
import { PopoverController,NavParams} from '@ionic/angular';
import { ThemeService } from 'src/app/services/theme.service';
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
  ) { }

  ngOnInit() {
    this.nodeId = this.navParams.get('nodeId')||"";
    this.channelId = this.navParams.get('channelId')|| 0;
    this.postId = this.navParams.get('postId')|| 0;

    console.log("===nodeId==="+this.nodeId);

    console.log("===channelId==="+this.channelId);

    console.log("===postId==="+this.postId);
  }

  edit(){
    this.popover.dismiss();
  }

  remove(){
    this.popover.dismiss();
  }

}
