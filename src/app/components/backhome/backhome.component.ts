import { Component, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { PopoverController} from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
@Component({
  selector: 'app-backhome',
  templateUrl: './backhome.component.html',
  styleUrls: ['./backhome.component.scss'],
})
export class BackhomeComponent implements OnInit {
  
  constructor(
    private native:NativeService, 
    public theme: ThemeService,
    private popover: PopoverController) { }

  ngOnInit() {}


  cancel(){
    this.popover.dismiss();
  }

  confirm(){
    this.popover.dismiss();
    this.native.setRootRouter(['/tabs/home']);
  }

}
