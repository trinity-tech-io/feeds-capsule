import { Component, OnInit,ViewChild} from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TranslateService } from "@ngx-translate/core";
import { NativeService } from 'src/app/services/NativeService';

@Component({
  selector: 'app-walletteach',
  templateUrl: './walletteach.page.html',
  styleUrls: ['./walletteach.page.scss'],
})
export class WalletteachPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public lightThemeType:number= 2;
  constructor(
    private native:NativeService,
    private titleBarService: TitleBarService,
    private translate:TranslateService,
    public theme:ThemeService,) { }

  ngOnInit() {
  }

  initTile(){
    this.titleBarService.setTitle(this.titleBar, this.translate.instant("WalletteachPage.title"));
    this.titleBarService.setTitleBarBlankButton(this.titleBar);
  }

  ionViewWillEnter() {
    this.initTile();
  }

  connectWallet(){
     alert("connect Wallet");
  }

  skip(){
   this.native.pop();
  }

}
