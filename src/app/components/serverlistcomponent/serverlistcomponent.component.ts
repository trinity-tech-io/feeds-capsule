import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { NavParams } from '@ionic/angular'; 
import { PopoverController } from '@ionic/angular';
@Component({
  selector: 'app-serverlistcomponent',
  templateUrl: './serverlistcomponent.component.html',
  styleUrls: ['./serverlistcomponent.component.scss'],
})
export class ServerlistcomponentComponent implements OnInit {
  private serverList: any;
  @Output() output = new EventEmitter();
  constructor(
    private navParams: NavParams,
    private popover: PopoverController) {}

  ngOnInit() {
    this.serverList = this.navParams.data.serverList;
  }

  select(server: any){
    this.popover.dismiss(server);
  }

}
