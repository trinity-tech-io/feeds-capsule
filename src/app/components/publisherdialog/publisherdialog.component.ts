import { Component, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { PopoverController} from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';

@Component({
  selector: 'app-publisherdialog',
  templateUrl: './publisherdialog.component.html',
  styleUrls: ['./publisherdialog.component.scss'],
})
export class PublisherdialogComponent implements OnInit {

  constructor(
    public theme: ThemeService,
    private popoverController: PopoverController,
    private native: NativeService
  ) { }

  ngOnInit() {}

 async cancel(){
   await this.popoverController.dismiss();
  }

}
