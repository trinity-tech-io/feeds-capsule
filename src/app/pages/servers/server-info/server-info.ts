import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from 'src/app/services/NativeService';

class Attribute {
  constructor(
    public iconName: string,
    public attrName: string,
    public attrValue: string) {}
}

@Component({
  selector: 'page-server-info',
  templateUrl: 'server-info.html',
  styleUrls: ['server-info.scss'],
})

export class ServerInfoPage implements OnInit {
  state: number = 0;

  constructor(
    private native: NativeService,
    private route: ActivatedRoute) {}

  attrs = [
    new Attribute('radio-button-on', 'nodeid', 'J7xW32cH52WBfdYZ9Wgtghzc7DbbHSuvvxgmy2Nqa2Mo'.slice(0, 31)),
    new Attribute('home', 'address', 'edTfdBfDVXMvQfXMhEvKrbvxaDxGGURyRfxDVMhbdHZFgAcwmGtS'.slice(0, 31)),
    new Attribute('person', 'name', 'coding'),
    new Attribute('mail', 'email', 'abc@example.com'),
    new Attribute('locate', 'region', 'shanbhai')
  ];

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      /*
      if (!paramMap.has('dappId')) {
        this.navCtrl.navigateBack('/store/tabs/dapps');
        return;
      }
      this.dapp = this.dappsService.getDapp(paramMap.get('dappId'));
      this.dappIcon = this.dappsService.getAppIcon(this.dapp);
      this.dappBanner = this.dappsService.getAppBanner(this.dapp);
      console.log('Dapp', this.dapp);
      */
    });
  }

  navigateBackPage() {
    this.native.pop();
  }
}
