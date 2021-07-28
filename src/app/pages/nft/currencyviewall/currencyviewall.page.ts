import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NativeService } from '../../../services/NativeService';
import { ThemeService } from '../../../services/theme.service';
import { Events } from '../../../services/events.service';
import { TitleBarService } from '../../../services/TitleBarService';
import { TitleBarComponent } from '../../..//components/titlebar/titlebar.component';

@Component({
  selector: 'app-currencyviewall',
  templateUrl: './currencyviewall.page.html',
  styleUrls: ['./currencyviewall.page.scss'],
})
export class CurrencyviewallPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public hotBidsList: any = [
    {
      asset: './assets/images/test.png',
      name: 'test',
      description: '12',
      fixedAmount: '1',
      minimumAmount: null,
      expirationDate: '2021-04-29',
      type: 'single',
      royalties: '1',
      quantity: '1',
    },
    {
      asset: './assets/images/test.png',
      name: 'test',
      description: '12',
      fixedAmount: '1',
      minimumAmount: null,
      expirationDate: '2021-04-29',
      type: 'single',
      royalties: '1',
      quantity: '1',
    },
    {
      asset: './assets/images/test.png',
      name: 'test',
      description: '12',
      fixedAmount: '1',
      minimumAmount: null,
      expirationDate: '2021-04-29',
      type: 'single',
      royalties: '1',
      quantity: '1',
    },
    {
      asset: './assets/images/test.png',
      name: 'test',
      description: '12',
      fixedAmount: '1',
      minimumAmount: null,
      expirationDate: '2021-04-29',
      type: 'single',
      royalties: '1',
      quantity: '1',
    },
    {
      asset: './assets/images/test.png',
      name: 'test',
      description: '12',
      fixedAmount: '1',
      minimumAmount: null,
      expirationDate: '2021-04-29',
      type: 'single',
      royalties: '1',
      quantity: '1',
    },
  ];
  public isSearch: string = '';
  public scanServiceStyle = { right: '' };
  constructor(
    private translate: TranslateService,
    private event: Events,
    private native: NativeService,
    private titleBarService: TitleBarService,
    public theme: ThemeService,
  ) {}

  ngOnInit() {
    this.scanServiceStyle['right'] = (screen.width * 7.5) / 100 + 5 + 'px';
  }

  ionViewWillEnter() {
    this.initTile();
    this.addEvent();
  }

  ionViewWillLeave() {
    this.removeEvent();
    this.event.publish(FeedsEvent.PublishType.search);
    this.event.publish(FeedsEvent.PublishType.notification);
    this.event.publish(FeedsEvent.PublishType.addProflieEvent);
  }

  initTile() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('CurrencyviewallPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  addEvent() {
    this.event.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      this.initTile();
    });
  }

  removeEvent() {
    this.event.unsubscribe(FeedsEvent.PublishType.updateTitle);
  }

  clickAssetItem(parms: any) {
    this.native.navigateForward(['assetdetails'], {});
  }

  doRefresh(event: any) {}

  scanService() {}

  getItems(event: any) {}

  ionClear() {}
}
