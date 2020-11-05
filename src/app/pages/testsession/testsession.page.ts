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
  private session: CarrierPlugin.Session;
  private stream: CarrierPlugin.Stream;
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

      if (this.nodeId == friendId){

      }

    });


    this.events.subscribe("")
  }

  scanCode(){
    appManager.sendIntent("scanqrcode", {}, {}, (res) => {
      let result: string = res.result.scannedContent;

      this.getNodeId(result);
      this.addFriends(result);
    }, (err: any) => {
        console.error(err);
    });
  }

  confirm(){
    this.addFriends(this.address);
  }

  addFriends(address: string){
    // console.log("Address ===> "+ this.carrierService.getAddress());
    this.getNodeId("9Rcw5zVkWC4ftw1YBfVfWow6iYHpK7W2H6JSo7dbWT4RMsWaV19k");
    // console.log("addFriends");
    this.carrierService.addFriend("9Rcw5zVkWC4ftw1YBfVfWow6iYHpK7W2H6JSo7dbWT4RMsWaV19k","auto-auth",()=>{
      // console.log("addFriends success");
    },()=>{

    })
  }

  getNodeId(address: string){
    this.carrierService.getIdFromAddress(address,(userId)=>{
      this.nodeId = userId;
    })
  }

  newSession(){
    // console.log("newSession = ");
    this.sessionService.createSession(this.nodeId, (mSession, mStream)=>{
      this.session = mSession ;
      this.stream = mStream ;
    }); 
  }

  requestSession(){
    // this.sessionService.sessionRequest(this.session,()=>{});
  }

  closeSession(){
    this.carrierService.sessionClose(this.session,
      ()=>{
        // console.log("close success");
      })
  }

  streamAddData(){
    let data = this.sessionService.stringToUint8Array("Hahahaha");
    // this.sessionService.streamAddData(this.stream, data);
    // this.sessionService.streamAddData(this.stream, data);

  }

  writeData(){
    // this.streamAddData();

    // this.sessionService.toBytes(null);
    let imgThumbs: FeedsData.ImgThumb[] = [];

    let imgThumb: FeedsData.ImgThumb = {
      index: 0,
      imgThumb: "this.imgUrl"
    }
    imgThumbs.push(imgThumb);

    let videoThumbs: FeedsData.VideoThumb = {
      videoThumb   :   "videoThumb",
      duration        :   0
    };

    // let json = this.feedService.createContent("text", imgThumbs, videoThumbs);

    let json = {};
    json["text"] = "test";
    json["img"] = "img";

    this.feedService.parseContent("nodeId",1,2,3,json);
  }

  startSession(){

  }

  test(){
    
  }


}
