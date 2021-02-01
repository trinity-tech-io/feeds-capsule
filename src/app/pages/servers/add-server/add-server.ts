import { Component, OnInit, NgZone } from '@angular/core';
import { Events,PopoverController} from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { FeedService } from '../../../services/FeedService';
import { NativeService } from '../../../services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from '../../../services/theme.service';
import { CameraService } from '../../../services/CameraService';
import { PopupProvider } from '../../../services/popup';
import jsQR from "jsqr";
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
declare let appManager: AppManagerPlugin.AppManager;
@Component({
  selector: 'page-add-server',
  templateUrl: 'add-server.html',
  styleUrls: ['add-server.scss'],
})

export class AddServerPage implements OnInit {
  public  connectionStatus = 1;
  public  address: string = '';

  public  buttonDisabled = false;

  public  name: string;
  public  owner: string;
  public  introduction: string;
  public  did: string;
  public  feedsUrl: string;
  public  popover:any = null;

  constructor(
    private events: Events,
    private zone: NgZone,
    private native: NativeService,
    private feedService: FeedService,
    private translate:TranslateService,
    public theme: ThemeService,
    public route: ActivatedRoute,
    private camera: CameraService,
    public popupProvider:PopupProvider,
    private popoverController:PopoverController
  ) {
 /*    this.route.queryParams.subscribe(params => {
      if(params.source) {
        this.checkValid(params.source);
      }
    }); */

      // this.acRoute.params.subscribe(data => {
      //   this.address = data.address;
      //   if (this.address == null ||
      //     this.address == undefined||
      //     this.address == '')
      //     return;
      //     this.zone.run(()=>{
      //       this.presentLoading();
      //     });
      //   this.queryServer();
      // });
    }


  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);

    this.connectionStatus = this.feedService.getConnectionStatus();
    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });

    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe('intent:addsource',(intentSource)=>{
      this.zone.run(() => {
        this.checkValid(intentSource);
      });
    });

    this.events.subscribe('feeds:updateServerList', ()=>{
      this.zone.run(() => {
          //this.native.pop();
          // this.native.go('/menu/servers');
      });
    });
   }


  ionViewDidEnter() {
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:updateTitle");
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:updateServerList");
    this.events.unsubscribe("intent:addsource");
    this.events.publish("feeds:search");
    let value =  this.popoverController.getTop()["__zone_symbol__value"] || "";
    if(value!=""){
      this.popoverController.dismiss();
      this.popover = "";
    }
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant('AddServerPage.title'));
  }

  navToBack() {
    this.native.pop();
  }

  scanCode(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }
    this.checkDid("scanCode");
  }

  alertError(error: string){
    alert (error);
  }

  // onChange(){
  //   this.queryServer();
  // }

  confirm(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }
    this.checkDid("confirm");
  }

  checkValid(result: string){
    if (result.length < 54 ||
      !result.startsWith('feeds://')||
      !result.indexOf("did:elastos:")){
        this.native.toastWarn("AddServerPage.tipMsg");
        return ;
    }

    let splitStr = result.split("/")
    if (splitStr.length!=5||
      splitStr[4] == ""){
        this.native.toastWarn("AddServerPage.tipMsg");
        return ;
    }

    this.feedService.addFeed(result,"",0,"").then((isSuccess)=>{
      if (isSuccess){
        this.native.pop();
        return;
      }
    });
    // this.native.getNavCtrl().navigateForward(['/menu/servers/server-info', result, "0", false]);
  }

  scanImage(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }
    this.checkDid("scanImage");
  }

  addImg(type: number) {
    this.camera.openCamera(
      80, 0, type,
      (imageUrl: any) => {
        this.zone.run(() => {
           this.base64ToqR(imageUrl);
        });
      },
      (err: any) => {
        console.error('Add img err', err);
      }
    );
  }

 base64ToqR(data:string) {
  let qrcanvas:any = document.getElementById("qrcanvas");
  let ctx = qrcanvas.getContext("2d");
    let img = new Image();
    img.src = data;
    img.onload = ()=>{
       ctx.drawImage(img, 0, 0,500,500);
       let imageData = ctx.getImageData(0, 0,500,500);
       const code = jsQR(imageData.data,500,500, {
            inversionAttempts: "dontInvert",
        });
        if(code){
           this.checkValid(code.data);
        }else{
          this.native.toastWarn("AddServerPage.tipMsg1");
        }
    };
}

checkDid(clickType:string){
  let signInData = this.feedService.getSignInData() || {};
  let did = signInData["did"];
  this.feedService.checkDIDDocument(did).then((isOnSideChain)=>{
    if (!isOnSideChain){
      //show one button dialog
      //if click this button
      //call feedService.promptpublishdid() function
      this.openAlert();
      return;
    }
    this.handleJump(clickType);
  });
}

openAlert(){
  this.popover = this.popupProvider.ionicAlert(
    this,
    // "ConfirmdialogComponent.signoutTitle",
    "",
    "common.didnotrelease",
    this.confirm1,
    'tskth.svg'
  );
}

confirm1(that:any){
    if(this.popover!=null){
       this.popover.dismiss();
       that.feedService.promptpublishdid();
    }
}

handleJump(clickType:string){
    if(clickType === "scanCode"){
      appManager.sendIntent("https://scanner.elastos.net/scanqrcode", {}, {}, (res) => {
        let result: string = res.result.scannedContent;
        this.checkValid(result);
      }, (err: any) => {
          console.error(err);
      });
         return;
    }
    if(clickType === "scanImage"){
      this.addImg(0);
      return;
    }

    if(clickType === "confirm"){
      this.checkValid(this.address);
      return;
    }


}

}
