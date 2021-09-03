import { Component, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { PopoverController} from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';

@Component({
  selector: 'app-guidedialog',
  templateUrl: './guidedialog.component.html',
  styleUrls: ['./guidedialog.component.scss'],
})
export class GuidedialogComponent implements OnInit {

  constructor(
    public theme: ThemeService,
    private popoverController: PopoverController,
    private native: NativeService
    ) { }

  ngOnInit() {}

 async goMac(){
   await this.popoverController.dismiss();
   this.native.navigateForward(["guidemac"],"");
  }

  async goUbuntu(){
    await this.popoverController.dismiss();
    this.native.navigateForward(["guideubuntu"],"");
   }

}
