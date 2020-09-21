import { Component, OnInit } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from 'src/app/services/theme.service';
import { CarrierService } from 'src/app/services/CarrierService';
import { Events, Platform, LoadingController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { SessionService } from 'src/app/services/SessionService';

declare let appManager: AppManagerPlugin.AppManager;

@Component({
  selector: 'app-testsession',
  templateUrl: './testsession.page.html',
  styleUrls: ['./testsession.page.scss'],
})
export class TestsessionPage implements OnInit {
  private session:CarrierPlugin.Session;
  public address;
  private nodeId: string = "";
  constructor(
    private events: Events,
    private translate:TranslateService,
    public theme: ThemeService,
    public carrierService: CarrierService,
    public feedService: FeedService,
    public sessionService: SessionService) { }

  ngOnInit() {
    this.events.subscribe("carrier:friendConnection",(ret)=>{
      let friendId = ret.friendId;
      let friendStatus = ret.status;
      console.log("friendId = "+friendId);
      console.log("friendStatus = "+friendStatus);


      if (this.nodeId == friendId){
        console.log("==========================");
        console.log("friendStatus = "+friendStatus);
      }

    });


    this.events.subscribe("")
  }

  scanCode(){
    appManager.sendIntent("scanqrcode", {}, {}, (res) => {
      let result: string = res.result.scannedContent;
      console.log("scanqrcode result = "+result);
      console.log("my nodeId = "+this.carrierService.getNodeId());

      this.getNodeId(result);
      this.addFriends(result);
      // this.carrierService.isFriends(result, (isFriends)=>{
      //   this.getNodeId(result);
      //   console.log("111111111");
      //   console.log("isFriends = "+JSON.stringify(isFriends));
      //   console.log("2222222222");
      //   if(isFriends){

      //   }else{
      //     this.addFriends(result);
      //   }
      // });
      
    }, (err: any) => {
        console.error(err);
    });
  }

  confirm(){
    this.addFriends(this.address);
  }

  addFriends(address: string){
    this.getNodeId(address);
    console.log("addFriends");
    this.carrierService.addFriend(address,"auto-auth",()=>{
      console.log("addFriends success");
    },()=>{

    })
  }

  getNodeId(address: string){
    this.carrierService.getIdFromAddress(address,(userId)=>{
      this.nodeId = userId;
    })
  }

  newSession(){
    console.log("newSession = ");
    this.sessionService.createSession(this.nodeId, (mSession)=>{
      this.session = mSession;
    }); 
  }

  requestSession(){
    this.sessionService.sessionRequest(this.session);
  }

  startSession(){
    this.sessionService.sessionStart(this.session,"sdp")
  }
}
