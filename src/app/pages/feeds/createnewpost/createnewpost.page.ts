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
  private channelAvatar = "";
  private channelName;
  private subscribers;
  private newPost="";
  private imgUrl: string = "";
  public bigImageUrl:string ="";
  public bigImage:boolean = false;
  // private content ;


  private nodeId: string;
  private channelId: number;
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

        let channel = this.feedService.getChannelFromId(this.nodeId,this.channelId);

        this.channelName = channel.name;
        this.subscribers = channel.subscribers;
        this.channelAvatar = this.feedService.parseChannelAvatar(channel.avatar);
      });
    }

    ngOnInit() {
    }

    ionViewWillEnter() {
    this.isNewPost = true;
    this.events.subscribe('feeds:publishPostSuccess', () => {
      this.navCtrl.pop().then(()=>{
        this.native.toast_trans("CreatenewpostPage.tipMsg1");
      });
    });

    this.events.subscribe('rpcRequest:error', () => {
       this.isNewPost = true;
    });

    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

  ionViewWillUnload(){
    this.hideBigImage();
    this.events.unsubscribe("feeds:updateTitle");
    this.events.unsubscribe("feeds:publishPostSuccess");
    this.events.unsubscribe("rpcRequest:error");
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
    this.camera.openCamera(50,0,type,
      (imageUrl)=>{
        this.zone.run(() => {
          this.imgUrl = imageUrl;
        });
      },
      (err)=>{alert(err)});
  }

  

  showBigImage(content: any){
    this.bigImage = true;
    this.bigImageUrl = content;  
  }

  hideBigImage(){
    this.bigImage = false;
  }
}
 