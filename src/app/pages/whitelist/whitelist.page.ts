import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { ThemeService } from '../../services/theme.service';
import { NativeService } from '../../services/NativeService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { HttpService } from 'src/app/services/HttpService';
import { ApiUrl } from 'src/app/services/ApiUrl';
import { FeedService } from 'src/app/services/FeedService';

@Component({
  selector: 'app-whitelist',
  templateUrl: './whitelist.page.html',
  styleUrls: ['./whitelist.page.scss'],
})
export class WhitelistPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public whiteListData: FeedsData.WhiteItem[] = [];
  constructor(
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private HttpService: HttpService,
    private feedService: FeedService,
    public theme: ThemeService
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
    this.getWhiteList();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('WhitelistPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewWillLeave(){
  }

  getWhiteList(){
   let whiteListData = this.feedService.getWhiteListData();
   if(whiteListData.length === 0){
     this.ajaxGetWhiteList(true);
    return;
   }
   this.whiteListData = whiteListData;
  }

  ajaxGetWhiteList(isLoading:boolean){
    this.HttpService.ajaxGet(ApiUrl.getWhiteList,isLoading).then((result:any)=>{
      if(result.code === 200){
        this.whiteListData = result.data || [];
        this.feedService.setWhiteListData(this.whiteListData);
        this.feedService.setData("feeds.WhiteList",this.whiteListData);
      }
    }).catch((err)=>{

    });
  }
}
