import { Component, OnInit, NgZone } from '@angular/core';
import { Events} from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from 'src/app/services/theme.service';
import { CameraService } from 'src/app/services/CameraService';
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

  constructor(
    private events: Events,
    private zone: NgZone,
    private native: NativeService,
    private feedService: FeedService,
    private translate:TranslateService,
    public theme: ThemeService,
    public route: ActivatedRoute,
    private camera: CameraService
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
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant('AddServerPage.title'));
  }

  navToBack() {
    this.native.pop();
  }

  scanCode(){
    appManager.sendIntent("scanqrcode", {}, {}, (res) => {
      let result: string = res.result.scannedContent;
      this.checkValid(result);
    }, (err: any) => {
        console.error(err);
    });
  }

  alertError(error: string){
    alert (error);
  }

  // onChange(){
  //   this.queryServer();
  // }

  confirm(){
    this.checkValid(this.address);
  }

  checkValid(result: string){
    if (result.length < 54 ||
      !result.startsWith('feeds://')||
      !result.indexOf("did:elastos:") || result.indexOf("/")!=4){
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
    this.addImg(0);
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

}
