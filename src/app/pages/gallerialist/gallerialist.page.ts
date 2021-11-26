import { Component, OnInit,ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { NativeService } from 'src/app/services/NativeService';
@Component({
  selector: 'app-gallerialist',
  templateUrl: './gallerialist.page.html',
  styleUrls: ['./gallerialist.page.scss'],
})
export class GallerialistPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public activePanelList:any =  [];
  constructor(
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private nftContractControllerService: NFTContractControllerService,
    private nativeService: NativeService
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
    this.getList();
  }

  initTitle() {

    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant("gallerialist"),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

 async getList(){

    let activePanelCount = await this.nftContractControllerService.getGalleria().getActivePanelCount();
    for (let index = 0; index < activePanelCount; index++) {
      try {
        const item:any = await this.nftContractControllerService.getGalleria().getActivePanelByIndex(index);
        let activePanelItem:any = {panelId:item[0]};
        this.activePanelList.push(activePanelItem)
      } catch (error) {
        console.error("Get Sale item error", error);
      }
    }
  }

  clickActivePanel(activePanel: any){
    let panelId = activePanel.panelId;
    let accountAddress =
    this.nftContractControllerService.getAccountAddress() || '';
    if (accountAddress === '') {
     this.nativeService.toastWarn('common.connectWallet');
     return;
    }
    this.nativeService.showLoading("loading....")
    this.nftContractControllerService.getGalleria().removePanel(panelId).then((info)=>{
         console.log("===info===",info);
         this.nativeService.hideLoading();
         this.getList();
         alert("sucess");
    }).catch((err)=>{
      this.nativeService.hideLoading();
      console.log("===err===",err);
      alert("err");
    })
  }

}
