import { Component, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { NavParams } from '@ionic/angular';
import { Events } from '../../services/events.service';
import { HiveService } from 'src/app/services/HiveService'

@Component({
  selector: 'app-tipdialog',
  templateUrl: './tipdialog.component.html',
  styleUrls: ['./tipdialog.component.scss'],
})
export class TipdialogComponent implements OnInit {
  public did: string = '';
  public feedName: string = '';
  public feedDesc: string = '';
  public feedPublicStatus: boolean = true;
  public developerMode: boolean = false;
  constructor(
    public theme: ThemeService,
    private navParams: NavParams,
    private events: Events,
    private hiveService: HiveService

  ) {}

  ngOnInit() {
    this.did = this.navParams.get('did');
    this.feedName = this.navParams.get('name');
    this.feedDesc = this.navParams.get('des');
    this.feedPublicStatus = this.navParams.get('feedPublicStatus');
    this.developerMode = this.navParams.get('developerMode');
  }

  cancel() {
    this.events.publish(FeedsEvent.PublishType.tipdialogCancel);
  }

  confirm() {
    let tipDialogData: FeedsEvent.TipDialogData = {
      name: this.feedName,
      desc: this.feedDesc,
    };
    this.events.publish(FeedsEvent.PublishType.tipdialogConfirm, tipDialogData);
  }
}
