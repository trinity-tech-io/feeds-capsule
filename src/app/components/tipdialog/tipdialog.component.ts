import { Component, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { NavParams,Events} from '@ionic/angular';

@Component({
  selector: 'app-tipdialog',
  templateUrl: './tipdialog.component.html',
  styleUrls: ['./tipdialog.component.scss'],
})
export class TipdialogComponent implements OnInit {
  public did:string = "";
  public feedName:string = "";
  public feedDesc:string = "";
  public feedPublicStatus:boolean = true;
  constructor(
    public theme: ThemeService,
    private navParams: NavParams,
    private events:Events){ }

  ngOnInit() {
    this.did = this.navParams.get('did');
    this.feedName = this.navParams.get('name');
    this.feedDesc = this.navParams.get('des');
    this.feedPublicStatus =  this.navParams.get('feedPublicStatus') || true;
  }

  cancel(){
    this.events.publish(FeedsEvent.PublishType.tipdialogCancel);
  }

  confirm(){
    this.events.publish(FeedsEvent.PublishType.tipdialogConfirm,this.feedName,this.feedDesc);
  }

}
