import { Component, OnInit, NgZone } from '@angular/core';
import { NativeService } from 'src/app/services/NativeService';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-about',
  templateUrl: './about.html',
  styleUrls: ['./about.scss'],
})

export class AboutPage implements OnInit {
  public version = "0.11.1";

  constructor(
    private zone: NgZone,
    public native: NativeService
    ) {}

  ngOnInit() {
    titleBarManager.setTitle("About");
    this.native.setTitleBarBackKeyShown(true);
  }

  goWebsite() {
    this.native.openUrl("http://www.elastos.org");
  }

}
