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
import Web3 from "web3";
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
  public fileName:string = "";
  private imageObj:any = {};
  private tokenId:any = null;
  private web3:any;
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
    this.testWeb3();
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
        this.sendIpfsJSON();
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
              this.sendIpfsImage(fileName,this.assetBase64);
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

  sendIpfsImage(fileName:string,file:any){
    let blob = this.dataURLtoBlob(file);
    let formData = new FormData();
    formData.append("",blob);
    this.httpService.ajaxNftPost(ApiUrl.nftAdd,formData).then((result)=>{
        //{"Name":"blob","Hash":"QmaxWgjheueDc1XW2bzDPQ6qnGi9UKNf23EBQSUAu4GHGF","Size":"17797"};
        let hash = result["Hash"] || null;
        let imgFormat = fileName.split(".")[1];
        if(hash != null){
          this.imageObj["imgSize"] = result["Size"];
          this.imageObj["imgHash"] = "feeds:imgage:"+hash;
          this.imageObj["imgFormat"] = imgFormat;
        }
        console.log("========"+JSON.stringify(this.imageObj));
        //feeds:imgage:
        //feeds:json:
    }).catch((err)=>{
         console.log("========"+JSON.stringify(err));
    });
  }

  sendIpfsJSON(){
   let ipfsJSON = {
      "version":"1",
      "type": "image",
      "name":this.nftName,
      "description":this.nftDescription,
      "image":this.imageObj['imgHash'],
      "kind":this.imageObj['imgFormat'],
      "size":this.imageObj["imgSize"]
   }

   let formData = new FormData();
   formData.append("",JSON.stringify(ipfsJSON));

   this.httpService.ajaxNftPost(ApiUrl.nftAdd,formData).then((result)=>{
    //{"Name":"blob","Hash":"QmaxWgjheueDc1XW2bzDPQ6qnGi9UKNf23EBQSUAu4GHGF","Size":"17797"};
    let hash = result["Hash"] || null;
    if(hash != null){
       this.tokenId = "0x"+UtilService.SHA256(hash);
       console.log("====this.tokenId====="+this.tokenId);
       let jsonHash = "feeds:json:"+hash;
       console.log("====jsonHash===="+jsonHash);
    }
    //feeds:imgage:
    //feeds:json:
}).catch((err)=>{
     console.log("========"+JSON.stringify(err));
});

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
    this.fileName = pathObj["fileName"];
    pathObj["filepath"] =  path.substring(0,lastIndex);
    pathObj["filepath"] = pathObj["filepath"].startsWith('file://') ? pathObj["filepath"] : `file://${pathObj["filepath"]}`;
    return pathObj;
  }

  async getWeb3(){

    if (typeof this.web3 !== 'undefined') {
       this.web3 = new Web3(this.web3.currentProvider);
    } else {
      let options = {
        agent: {

        }
    };
    this.web3 = new Web3(new Web3.providers.HttpProvider("https://api-testnet.elastos.io/eth",options));
    }
    return this.web3;
  }

  async testWeb3(){
    await this.getWeb3();
    let account = await this.web3.eth.accounts.privateKeyToAccount('04868f294d8ef6e1079752cd2e1f027a126b44ee27040d949a88f89bddc15f31');
    console.log("===account=="+JSON.stringify(account));
    let gasPrice = await this.web3.eth.getGasPrice();
    console.log("===gasPrice=="+gasPrice);
  }

}
