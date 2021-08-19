import { Component, Input, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
@Component({
  selector: 'app-nftloading',
  templateUrl: './nftloading.component.html',
  styleUrls: ['./nftloading.component.scss'],
})
export class NftloadingComponent implements OnInit {
  @Input() public loadingTitle:string = "";
  @Input() public loadingText:string = "";
  @Input() public loadingCurNumber:string = "";
  @Input() public loadingMaxNumber:string = "";
  constructor(
    public theme:ThemeService,
  ) { }

  ngOnInit() {}

}
