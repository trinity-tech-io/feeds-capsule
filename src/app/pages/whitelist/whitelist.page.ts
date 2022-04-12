import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { ThemeService } from '../../services/theme.service';
import { NativeService } from '../../services/NativeService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { HttpService } from 'src/app/services/HttpService';
import { ApiUrl } from 'src/app/services/ApiUrl';
import { DataHelper } from 'src/app/services/DataHelper';
//https://ipfs.trinity-feeds.app/ipfs/Qmd4CXXv47x2aoo7TBbvusxHBYDtDEcWwcT4EzcMM1VmPh
@Component({
  selector: 'app-whitelist',
  templateUrl: './whitelist.page.html',
  styleUrls: ['./whitelist.page.scss'],
})
export class WhitelistPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public whiteListData: FeedsData.WhiteItem[] = [];
  public ipfsBaseUrl: string = "";
  constructor(
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private HttpService: HttpService,
    private dataHelper: DataHelper,
    private native: NativeService,
    public theme: ThemeService
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
    this.getWhiteList();
    this.ipfsBaseUrl = localStorage.getItem("selectedIpfsNetwork") || ''
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
   let whiteListData = this.dataHelper.getWhiteListData();
   if(whiteListData.length === 0){
     this.ajaxGetWhiteList(true,"");
    return;
   }
   this.whiteListData = whiteListData;
  }

  ajaxGetWhiteList(isLoading: boolean,event: any){
    this.HttpService.ajaxGet(ApiUrl.getWhiteList,isLoading).then((result:any)=>{
      if(result.code === 200){
        this.whiteListData = result.data || [];
        this.dataHelper.setWhiteListData(this.whiteListData);
        this.dataHelper.saveData("feeds.WhiteList",this.whiteListData);
        if(event!=""){
          event.target.complete();
        }
      }
    }).catch((err)=>{
      if(event!=""){
        event.target.complete();
      }
    });
  }

  doRefresh(event:any){
    this.ajaxGetWhiteList(false,event);
  }

  handleavatar(avatar: string){
   return this.ipfsBaseUrl+'/ipfs/'+avatar;
  }

  clickTwitter(whiteListItem: FeedsData.WhiteItem){
    let social: any[] =  whiteListItem.social;
    let twitter =  social[1].twitter || "";
    if(twitter!=""){
      this.native.openUrl(twitter);
    }
  }

  pressAddress(address: string){
    this.native
      .copyClipboard(address)
      .then(() => {
        this.native.toast_trans('common.textcopied');
      })
      .catch(() => {});
  }

}
