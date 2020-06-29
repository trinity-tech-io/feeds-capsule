import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from '../../../services/NativeService';
import { CameraService } from 'src/app/services/CameraService';

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
  // private content ;


  private nodeId: string;
  private channelId: number;
  constructor(
    private events: Events,
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private navCtrl: NavController,
    private camera: CameraService,
    private zone: NgZone,
    private feedService: FeedService) {
      this.events.subscribe('feeds:publishPostSuccess', () => {
        this.native.toast("Publish post success!");
        this.navCtrl.pop();
      });



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
    titleBarManager.setTitle("Adding Post");
    this.native.setTitleBarBackKeyShown(true);
  }


  post(){
    if (this.newPost == ""){
      alert("Please input message!");
      return;
    }else{

      let myContent = {};
      myContent["text"] = this.newPost;
      myContent["img"] = this.imgUrl;
      
      this.feedService.publishPost(
        this.nodeId,
        this.channelId,
        JSON.stringify(myContent));
  
      // this.navCtrl.pop();
    }
  }

  addImg(){
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
}
 