import { Component, OnInit , NgZone,ViewChild } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from '../../../services/theme.service';
import { CameraService } from '../../../services/CameraService';
import { NativeService } from '../../../services/NativeService';
import { UtilService } from '../../../services/utilService';
import { FeedService } from '../../../services/FeedService';
import { Events } from '../../../services/events.service';
import { TitleBarService } from '../../../services/TitleBarService';
import { TitleBarComponent } from '../../..//components/titlebar/titlebar.component';
import { File,DirectoryEntry} from '@ionic-native/file/ngx';
import { HttpService } from '../../../services/HttpService';
import { ApiUrl } from '../../../services/ApiUrl';

@Component({
  selector: 'app-mintnft',
  templateUrl: './mintnft.page.html',
  styleUrls: ['./mintnft.page.scss'],
})
export class MintnftPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public assetBase64:string = "";
  public nftName:string = "";
  public nftDescription:string = "";
  public curPublishtoPasar:boolean = true;
  /**single  multiple*/
  public issueRadionType:string="single";
  public nftRoyalties:string="";
  public nftQuantity:string = "1";
  public nftFixedAmount:number = null;
  public nftMinimumAmount:number = null;
  /**fixedPrice highestBid */
  public sellMethod:string = "fixedPrice";
  public expirationDate:string = "";
  public maxExpirationDate:string = "";
  public minExpirationDate:string = "";
  constructor(
    private translate:TranslateService,
    private event:Events,
    private zone: NgZone,
    private camera: CameraService,
    private native: NativeService,
    private feedService:FeedService,
    private titleBarService: TitleBarService,
    private httpService:HttpService,
    private file:File,
    public theme:ThemeService) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.minExpirationDate = UtilService.dateFormat(new Date());
    this.expirationDate = UtilService.dateFormat(new Date(new Date().getTime()+24*60*60*1000));
    this.maxExpirationDate = UtilService.dateFormat(new Date(new Date().getTime()+10*365*24*60*60*1000));
    this.initTile();
    this.addEvent();
  }

  ionViewWillLeave(){
    this.removeEvent();
    this.event.publish(FeedsEvent.PublishType.notification);
    this.event.publish(FeedsEvent.PublishType.addProflieEvent);
  }

  initTile(){
    this.titleBarService.setTitle(this.titleBar,this.translate.instant('MintnftPage.title'));
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
   }

   addEvent(){
    this.event.subscribe(FeedsEvent.PublishType.updateTitle,()=>{
      this.initTile();
    });
   }

   removeEvent(){
    this.event.unsubscribe(FeedsEvent.PublishType.updateTitle);
   }

   clickPublishtoPasar(){
    this.zone.run(()=>{
      this.curPublishtoPasar = !this.curPublishtoPasar;
    });
  }

  addAsset(){
    this.addImg(0);
  }

  mint(){
    if(this.checkParms()){
       let parms = {
            "asset":this.assetBase64,
            "name":this.nftName,
            "description":this.nftDescription,
            "fixedAmount":this.nftFixedAmount,
            "minimumAmount":this.nftMinimumAmount,
            "expirationDate":this.expirationDate,
            "type":this.issueRadionType,
            "royalties":this.nftRoyalties,
            "quantity":this.nftQuantity
        }
        let nftAssetList = this.feedService.getNftAssetList();
        nftAssetList.push(parms);
        this.feedService.setNftAssetList(nftAssetList);
        this.native.pop();
    }
  }

  getFlieObj(fileName:string,filepath:string){

    this.file.resolveLocalFilesystemUrl(filepath)
    .then((dirEntry: DirectoryEntry)=>{
      dirEntry.getFile(fileName,{ create: true, exclusive: false},
      (fileEntry)=>{
        fileEntry.file(
        (file)=>{
          let fileReader = new FileReader();
          fileReader.onloadend =(event:any)=>{
            this.zone.run(()=>{
              this.assetBase64 = fileReader.result.toString();
              this.sendIpfs(fileName,this.assetBase64);
            });
          };

          fileReader.onprogress = (event:any)=>{
            this.zone.run(()=>{
              console.log("====event.loaded==="+event.loaded);
            })
          };

          fileReader.readAsDataURL(file);
        },
        ()=>{

        })
      },()=>{

      });
    }).catch((dirEntryErr)=>{
      console.log("====dirEntryErr===="+JSON.stringify(dirEntryErr))
    });
  }

  sendIpfs(fileName:string,file:any){
    // let blob = this.dataURLtoBlob(file);
    // var formData = new FormData();
    // formData.append("",blob);
    // this.httpService.ajaxNftPost(ApiUrl.nftAdd,formData).then((res)=>{
    //      console.log("========"+JSON.stringify(res));
    // }).catch((err)=>{
    //   console.log("========"+JSON.stringify(err));
    // });
  }

  dataURLtoBlob(dataurl:string) {
    let arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
 }

  addImg(type: number) {
    this.camera.openCamera(
      30,1, type,
      (imgPath: any) => {
        this.zone.run(() => {
          let pathObj =this.handlePath(imgPath);
          this.getFlieObj(pathObj["fileName"],pathObj["filepath"])
        });
      },
      (err: any) => {
        console.error('Add img err', err);
        let imgUrl = this.assetBase64 || "";
        if(imgUrl) {
          this.native.toast_trans('common.noImageSelected');
        }
      }
    );
  }

  removeImg(){
    this.assetBase64 = "";
  }

  checkParms(){
    if(this.assetBase64 === ""){
      this.native.toastWarn("MintnftPage.nftAssetPlaceholder");
      return false;
    }

    if(this.nftName === ""){
      this.native.toastWarn("MintnftPage.nftNamePlaceholder");
      return false;
    }

    if(this.nftDescription === ""){
      this.native.toastWarn("MintnftPage.nftDescriptionPlaceholder");
      return false;
    }

    if(this.curPublishtoPasar&&this.issueRadionType=== "oneTimeIssue" && this.nftFixedAmount === null){
      this.native.toastWarn("MintnftPage.nftFixedAmount");
      return false;
    }

    if(this.curPublishtoPasar&&this.issueRadionType=== "reIssueable" && this.nftMinimumAmount === null){
      this.native.toastWarn("MintnftPage.nftMinimumAmount");
      return false;
    }

    if(this.nftRoyalties === ""){
      this.native.toastWarn("MintnftPage.nftRoyaltiesPlaceholder");
      return false;
    }

    if(this.nftQuantity === ""){
      this.native.toastWarn("MintnftPage.nftQuantityPlaceholder");
      return false;
    }
    return true;
  }

  radioChange(){
    if(this.issueRadionType === 'single'){
        this.nftQuantity = "1";
    }else{
        this.nftQuantity = "";
    }
  }

  handlePath(fileUri:string){
    let pathObj = {};
    fileUri =  fileUri.replace("/storage/emulated/0/","/sdcard/");
    let path = fileUri.split("?")[0];
    let lastIndex = path.lastIndexOf("/");
    pathObj["fileName"] =  path.substring(lastIndex+1,fileUri.length);
    pathObj["filepath"] =  path.substring(0,lastIndex);
    pathObj["filepath"] = pathObj["filepath"].startsWith('file://') ? pathObj["filepath"] : `file://${pathObj["filepath"]}`;
    return pathObj;
  }
}
