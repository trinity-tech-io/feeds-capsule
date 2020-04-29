import { Component, OnInit, NgZone } from '@angular/core';
import { Events } from '@ionic/angular';
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
  private did: string = "";
  private name: string = "";
  private gender: string = "";
  private email: string = "";
  private telephone: string = "";
  private location: string = "";

  private ownedChannelsNum:number = 0;
  private ownedChannelSourceNum:number = 0;
  private subscribedNum:number = 0;
  private connectedChannelSourceNum:number = 0;
  private connectStatus: number = 1;

  private avatarUrl: string = "../../../assets/images/avatar.svg";
   constructor(
    private event: Events,
    private zone: NgZone,
    private native: NativeService,
    private feedService: FeedService){

    let signInData = this.feedService.getSignInData();
    this.did = signInData.did;
    this.name = signInData.name;
    this.email = signInData.email;
    this.telephone = signInData.telephone;
    this.location = signInData.location;
    

    this.subscribedNum = this.feedService.getSubscribedChannelNumber();
    this.ownedChannelsNum = this.feedService.getOwnChannelNumber();
    this.connectedChannelSourceNum = this.feedService.getServerList().length;
    this.ownedChannelSourceNum = this.feedService.getCreationServerList().length;
    this.connectStatus = this.feedService.getConnectionStatus();
    
    this.event.subscribe('feeds:connectionChanged', connectionStatus => {
      this.zone.run(() => {
          this.connectStatus = connectionStatus;
      });
    });  
  }

  ngOnInit() {
  }

  copyText(name:string, text: string){
    // this.native.toast("The "+ name +" is copied to the clipboard");
    this.native.toast("Text Copied");
    this.native.copyClipboard(text);
  }
}
