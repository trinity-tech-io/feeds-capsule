import { Component, OnInit, NgZone } from '@angular/core';
import { Events } from '@ionic/angular';
import { CarrierService } from 'src/app/services/CarrierService';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from '../../services/NativeService';
import { ActionSheetController } from '@ionic/angular';
import { CameraService } from 'src/app/services/CameraService';

class Attribute {
  constructor(
    public iconName: string,
    public attrName: string,
    public attrValue: string,
    public freeze: boolean) {}
}

@Component({
  selector: 'page-myprofile',
  templateUrl: './myprofile.html',
  styleUrls: ['./myprofile.scss'],
})

export class MyprofilePage implements OnInit {
  private connectStatus: number = 1;
  private changing = false ;
  private changeObj = {};
  private attrs:Attribute[] = [];
  private avatarUrl: string = "../../../assets/images/avatar.svg";
   constructor(
    private event: Events,
    private zone: NgZone,
    private carrierService: CarrierService,
    private native: NativeService,
    private feedService: FeedService,
    private actionSheetController:ActionSheetController,
    private camera: CameraService) {
    this.connectStatus = this.feedService.getConnectionStatus();
    this.getUserInfo();
    this.event.subscribe('feeds:connectionChanged', connectionStatus => {
      this.zone.run(() => {
          this.connectStatus = connectionStatus;
          this.getUserInfo();
      });
    });
    
  }

  getUserInfo(){
    if (this.connectStatus == 0){
      if(this.feedService.getAvator() != undefined) 
        this.avatarUrl = this.feedService.getAvator();
      this.native.toast("press lable copy text to clipboard");
      this.carrierService.getSelfInfo(
        (userInfo)=>{
            this.attrs = [
              new Attribute('radio-button-on', 'NodeId',this.checkNull(this.carrierService.getNodeId()),true),
              new Attribute('home', 'Address', this.checkNull(this.carrierService.getAddress()),true),
              new Attribute('home', 'Name', this.checkNull(userInfo.name),false),
              new Attribute('home', 'Description', this.checkNull(userInfo.description),false),
              new Attribute('home', 'Gender', this.checkNull(userInfo.gender),false),
              new Attribute('home', 'Phone', this.checkNull(userInfo.phone),false),
              new Attribute('home', 'Email', this.checkNull(userInfo.email),false),
              new Attribute('home', 'Location', this.checkNull(userInfo.region),false)
            ];
        },
        (error)=>{});
      }
  }

  ngOnInit() {
  }

  copyText(name:string, text: string){
    // this.native.toast("The "+ name +" is copied to the clipboard");
    this.native.toast("Text Copied");
    this.native.copyClipboard(text);
  }

  updateProfile(){
    this.changing = true;
  }

  onChangeText(name: string, value: string){
    this.changeObj[name] = value;
  }
  saveProfile(){
    this.changing = false;

    let keys: string[] = Object.keys(this.changeObj);
    for (const index in keys) {
      if (this.changeObj[keys[index]] == undefined) 
        continue;
      this.carrierService.setSelfInfo(keys[index],this.changeObj[keys[index]]);
    }

    this.changeObj = {};
    this.feedService.saveAvator(this.avatarUrl);
  }

  async change(){
    if(!this.changing){
      return;
    }
    const actionSheet = await this.actionSheetController.create({
      // header: 'Albums',
      buttons: [{
        text: 'Take a picture',
        // role: 'destructive',
        // icon: 'trash',
        handler: () => {

          this.openCamera(1);
        }
      },{
        text: 'Open photo library',
        // icon: 'close',
        // role: 'cancel',
        handler: () => {
          this.openCamera(0);
        }
      }]
    });
    await actionSheet.present();
  }

  openCamera(type: number){
    this.camera.openCamera(50,0,type,
      (imageUrl)=>{
        // alert(imageUrl);
        console.log(imageUrl);
        this.zone.run(() => {
          this.avatarUrl = imageUrl;
        });
      },
      (err)=>{alert(err)});
  }

  checkNull(str: string){
    // console.log(str+";"+"str.length="+str.length);
    if(str.length <= 0){
      return "N/A";
    }

    return str;
  }
}
