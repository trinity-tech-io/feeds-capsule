import { Component, Input, OnInit } from '@angular/core';
type videoId = {
  "videoId": string,
  "sourceId": string
  "vgbufferingId": string,
  "vgcontrolsId": string
  "vgoverlayplayId": string,
  "vgfullscreeId": string
};
@Component({
  selector: 'app-videostyle',
  templateUrl: './videostyle.component.html',
  styleUrls: ['./videostyle.component.scss'],
})
export class VideostyleComponent implements OnInit {
  @Input() public videoIdObj: videoId = null;
  constructor() {

  }

  ngOnInit() {
  }

}
