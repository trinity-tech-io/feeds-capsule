import { Component, OnInit, NgZone } from '@angular/core';
import { Events } from '@ionic/angular';
import { CarrierService } from 'src/app/services/CarrierService';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from '../../services/NativeService';

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

   constructor(
    private event: Events,
    private zone: NgZone,
    private carrierService: CarrierService,
    private native: NativeService,
    private feedService: FeedService) {
    

    this.connectStatus = this.feedService.getConnectionStatus();
    // if (this.connectStatus == 0){
      
    //     (error)=>{
    //       alert(error);
    //     }
    //   );

    //   carrierService.setSelfInfo("name","999999");
    //   this.attrs = [
    //     new Attribute('radio-button-on', 'nodeId',carrierService.getNodeId()),
    //     new Attribute('person', 'userId', carrierService.getNodeId()),
    //     new Attribute('home', 'address', carrierService.getAddress())
    //   ];
    // }
    this.getUserInfo();
    this.event.subscribe('feeds:connectionChanged', connectionStatus => {
      this.zone.run(() => {
          this.connectStatus = connectionStatus;
          // this.attrs = [
          //   new Attribute('radio-button-on', 'nodeId',carrierService.getNodeId()),
          //   new Attribute('person', 'userId', carrierService.getNodeId()),
          //   new Attribute('home', 'address', carrierService.getAddress())
          // ];
          this.getUserInfo();
      });
    });
    
  }

  getUserInfo(){
    if (this.connectStatus == 0){
      this.native.toast("press lable copy text to clipboard");
      this.carrierService.getSelfInfo(
        (userInfo)=>{
            this.attrs = [
              new Attribute('radio-button-on', 'nodeId',this.carrierService.getNodeId(),true),
              new Attribute('home', 'address', this.carrierService.getAddress(),true),
              new Attribute('home', 'name', userInfo.name,false),
              new Attribute('home', 'description', userInfo.description,false),
              new Attribute('home', 'gender', userInfo.gender,false),
              new Attribute('home', 'phone', userInfo.phone,false),
              new Attribute('home', 'email', userInfo.email,false),
              new Attribute('home', 'region', userInfo.region,false)
            ];
        },
        (error)=>{});
      }
  }

  ngOnInit() {
  }

  copyText(name:string, text: string){
    this.native.toast("The "+ name +" is copied to the clipboard");
    this.native.copyClipboard(text);
  }

  updateProfile(){
    this.changing = true;

    // alert("updateProfile");
  }

  onChangeText(name: string, value: string){
    // alert(name+";"+value);
    this.changeObj[name] = value;
  }
  saveProfile(){
    this.changing = false;
    // alert("saveProfile");

    let keys: string[] = Object.keys(this.changeObj);
    for (const index in keys) {
      if (this.changeObj[keys[index]] == undefined) 
        continue;
      this.carrierService.setSelfInfo(keys[index],this.changeObj[keys[index]]);
    }

    this.changeObj = {};

  }
}
