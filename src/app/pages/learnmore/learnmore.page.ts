import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingController, IonSlides } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { AppService } from '../../services/AppService';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

@Component({
  selector: 'app-learnmore',
  templateUrl: './learnmore.page.html',
  styleUrls: ['./learnmore.page.scss'],
})
export class LearnmorePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild('slide', { static: false }) slides: IonSlides;
  private showBack: string = '';
  public signedIn: boolean = false;
  public did: string = '';
  public userName: string = '';
  public emailAddress: string = '';
  public lightThemeType: number = 2;
  constructor(
    private native: NativeService,
    private activatedRoute: ActivatedRoute,
    public loadingController: LoadingController,
    private translate: TranslateService,
    private event: Events,
    private titleBarService: TitleBarService,
    public theme: ThemeService,
    public appService: AppService,
  ) {}

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(queryParams => {
      this.showBack = queryParams.showBack || '';
    });
  }

  initTile() {
    this.titleBarService.setTitle(
      this.titleBar,
      null
    );
    if (this.showBack === '') {
      this.titleBarService.setTitleBarBlankButton(this.titleBar);
    } else {
      this.titleBarService.setTitleBarBlankButton(this.titleBar);
    }
  }

  ionViewWillEnter() {
    this.initTile();
  }

  ionViewDidEnter() {}

  ionViewWillLeave() {}

  next() {
    this.slides.isEnd().then(isEnd => {
      if (isEnd) {
        if (this.showBack === '') {
          localStorage.setItem('org.elastos.dapp.feeds.isLearnMore', '11');
          this.appService.initializeApp();
        } else {
          this.native.pop();
        }
      } else {
        this.slides.slideNext();
      }
    });
  }

  onSlideDidChange() {
    //swiper滑动以后的变化
  }

  skip() {
    if (this.showBack === '') {
      localStorage.setItem('org.elastos.dapp.feeds.isLearnMore', '11');
      this.appService.initializeApp();
    } else {
      this.native.pop();
    }
  }
}
