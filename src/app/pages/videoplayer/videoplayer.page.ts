import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { VgAPI } from 'ngx-videogular';
export interface IMedia {
    title: string;
    src: string;
    type: string;
}
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
declare let appManager: AppManagerPlugin.AppManager;
@Component({
  selector: 'app-videoplayer',
  templateUrl: './videoplayer.page.html',
  styleUrls: ['./videoplayer.page.scss'],
})
export class VideoplayerPage implements OnInit {
  public api: VgAPI;
  public sources: Array<Object>;
  constructor() { 
    this.sources = [
      {
          src: 'assets/movie.mp4',
          type: 'video/mp4'
      }
    ];
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    appManager.setVisible('show');
  }

}
