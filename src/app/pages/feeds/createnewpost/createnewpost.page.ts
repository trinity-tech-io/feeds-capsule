import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from '../../../services/NativeService';
import { CameraService } from 'src/app/services/CameraService';
import { ThemeService } from '../../../services/theme.service';
import { TranslateService } from "@ngx-translate/core";
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-createnewpost',
  templateUrl: './createnewpost.page.html',
  styleUrls: ['./createnewpost.page.scss'],
})
export class CreatenewpostPage implements OnInit {
  public connectionStatus = 1;
  public nodeStatus = {};
  public channelAvatar = "";
  public channelName = "";
  public subscribers;
  public newPost="";
  public imgUrl: string = "";
  public bigImageUrl:string ="";
  public bigImage:boolean = false;
  // private content ;


  public  nodeId: string;
  public  channelId: number;
  public  isNewPost:boolean = true;
  constructor(
    private events: Events,
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private navCtrl: NavController,
    private camera: CameraService,
    private zone: NgZone,
    private feedService: FeedService,
    public theme:ThemeService,
    private translate:TranslateService) {
     
      acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
        this.channelId = data.channelId;

        let channel = this.feedService.getChannelFromId(this.nodeId,this.channelId) || {};

        this.channelName = channel["name"] || "";
        this.subscribers = channel["subscribers"] || "";
        this.channelAvatar = this.feedService.parseChannelAvatar(channel["avatar"]);
      });
    }

    ngOnInit() {
    }

    ionViewWillEnter() {
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.isNewPost = true;

    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe("feeds:friendConnectionChanged", (nodeId, status)=>{
      this.zone.run(()=>{
        this.nodeStatus[nodeId] = status;
      });
     });

    this.events.subscribe('feeds:publishPostSuccess', () => {
      this.zone.run(()=>{
        this.navCtrl.pop().then(()=>{
          this.native.toast_trans("CommentPage.tipMsg1");
        });
      });
    });

    this.events.subscribe('rpcRequest:error', () => {
       this.isNewPost = true;
    });

    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });
    this.initnodeStatus();
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:friendConnectionChanged");
    this.events.unsubscribe("feeds:updateTitle");
    this.events.unsubscribe("feeds:publishPostSuccess");
    this.events.unsubscribe("rpcRequest:error");
    this.isNewPost =true;
  }

  ionViewDidEnter() {
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }


  initTitle(){
    titleBarManager.setTitle(this.translate.instant("CreatenewpostPage.addingPost"));
  }


  post(){
    if(!this.isNewPost){
      this.native.toast_trans("common.sending");
    }else{
      this.isNewPost = false;
      let  newPost = this.native.iGetInnerText(this.newPost);
      if (newPost == "" && this.imgUrl == ""){
        this.isNewPost = true;
        this.native.toast_trans("CreatenewpostPage.tipMsg");
      }else{
        let myContent = {};
        myContent["text"] = this.newPost;
        myContent["img"] = this.imgUrl;
          
        this.feedService.publishPost(
            this.nodeId,
            this.channelId,
            JSON.stringify(myContent));
        }
      }
    }
 

  addImg(){
    if(!this.isNewPost){
      this.native.toast_trans("common.sending");
      return;
    }
    this.openCamera(0);
  }

  openCamera(type: number){
    this.camera.openCamera(30,0,type,
      (imageUrl)=>{
        this.zone.run(() => {
          this.imgUrl = imageUrl;
        });
      },
      (err)=>{
        let imgUrl = this.imgUrl || "";
        if(imgUrl === ""){
          this.native.toast_trans('common.noImageSelected');
        }
      });
  }

  

  showBigImage(content: any){
    this.native.openViewer(content);
  }

  checkServerStatus(nodeId: string){
    return this.feedService.getServerStatusFromId(nodeId);
  }

  initnodeStatus(){
    let status = this.checkServerStatus(this.nodeId);
   this.nodeStatus[this.nodeId] = status;
 }
}
 