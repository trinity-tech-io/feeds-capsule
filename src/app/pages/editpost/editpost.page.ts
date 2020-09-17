import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from '../../services/NativeService';
import { CameraService } from 'src/app/services/CameraService';
import { ThemeService } from '../../services/theme.service';
import { TranslateService } from "@ngx-translate/core";
import * as _ from 'lodash';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
@Component({
  selector: 'app-editpost',
  templateUrl: './editpost.page.html',
  styleUrls: ['./editpost.page.scss'],
})
export class EditpostPage implements OnInit {

  public connectionStatus = 1;
  public nodeStatus = {};
  public channelAvatar = "";
  public channelName = "";
  public subscribers:string = "";
  public newPost: string="";
  public oldNewPost: string = "";
  public imgUrl: string = "";
  public oldImgUrl: string = "";
  public nodeId: string = "";
  public channelId: number = 0;
  public postId: number = 0;

  constructor(
    private events: Events,
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private navCtrl: NavController,
    private camera: CameraService,
    private zone: NgZone,
    private feedService: FeedService,
    public theme:ThemeService,
    private translate:TranslateService
  ) {
  }

  ngOnInit() {
    this.acRoute.queryParams.subscribe((data) => {
      let item = _.cloneDeep(data);
      this.nodeId = item["nodeId"] || "";
      this.channelId = item["channelId"] || "";  
      this.postId = item["postId"] || "";    
    });
  }

  ionViewWillEnter() {
    this.initData();

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

    this.events.subscribe('rpcRequest:error', () => {
          this.native.hideLoading();
    });

    this.events.subscribe('rpcResponse:error', () => {
      this.zone.run(() => {
        this.native.hideLoading();
      });
    });

    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });

    this.events.subscribe('feeds:editPostFinish', () => {
      //let post = this.feedService.getPostFromId(this.nodeId, this.channelId, this.postId);
      //console.log("editPostFinish = "+JSON.stringify(post));
      this.events.publish("update:tab");
      this.native.hideLoading();
      this.native.pop();
    });

    this.initnodeStatus();
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:friendConnectionChanged");
    this.events.unsubscribe("feeds:updateTitle");
    this.events.unsubscribe("rpcRequest:error");
    this.events.unsubscribe("rpcResponse:error");
    this.events.unsubscribe("feeds:editPostFinish");
  }

  ionViewDidEnter() {
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("EditpostPage.title"));
  }

  post(){
    let newPost = this.native.iGetInnerText(this.newPost);
    if (newPost === "" && this.imgUrl === ""){
      this.native.toast_trans("CreatenewpostPage.tipMsg");
      return false;
    }

    if(this.oldNewPost === newPost && this.oldImgUrl === this.imgUrl){
      this.native.toast_trans("common.nochanges");
      return false;
    }
    this.native.showLoading("common.waitMoment").then(()=>{
          this.editPost();
    }).catch(()=>{
          this.native.hideLoading();
    });
  }

  editPost(){
    let myContent = {};
    myContent["text"] = this.newPost;
    myContent["img"] = this.imgUrl;

    this.feedService.editPost(this.nodeId,Number(this.channelId),Number(this.postId),myContent);
    //add edit post     
  }  
 
  addImg(type: number) {
    this.camera.openCamera(
      30, 0, type,
      (imageUrl: any) => {
        this.zone.run(() => {
          this.imgUrl = imageUrl;
        });
      },
      (err: any) => {
        console.error('Add img err', err);
        let imgUrl = this.imgUrl || "";
        if (imgUrl === "") {
          this.native.toast_trans('common.noImageSelected');
        }
      }
    );
  }

  showBigImage(content: any){
    this.native.openViewer(content,"common.image","CreatenewpostPage.addingPost");
  }

  checkServerStatus(nodeId: string){
    return this.feedService.getServerStatusFromId(nodeId);
  }

  initnodeStatus(){
    let status = this.checkServerStatus(this.nodeId);
   this.nodeStatus[this.nodeId] = status;
  }

  pressName(channelName:string){
    this.native.createTip(channelName);
  }

  getImage(){
    let nodeChannelPostId = this.nodeId+this.channelId+this.postId;
    this.feedService.loadPostContentImg(nodeChannelPostId).then((image)=>{
      this.oldImgUrl = image || "";
      this.imgUrl = image || "";
    }).catch(()=>{
      console.log("getImageError");
    })
  }

  getContent(){
    let post = this.feedService.getPostFromId(this.nodeId, this.channelId, this.postId);
    let postContent = post.content;
    this.oldNewPost = this.feedService.parsePostContentText(postContent) || "";
    this.newPost = this.feedService.parsePostContentText(postContent) || "";
  }

  initData(){
    let channel = this.feedService.getChannelFromId(this.nodeId,this.channelId) || {};

    this.channelName = channel["name"] || "";
    this.subscribers = channel["subscribers"] || "";
    this.channelAvatar = this.feedService.parseChannelAvatar(channel["avatar"]);

    this.getImage();
    this.getContent();

    this.connectionStatus = this.feedService.getConnectionStatus();
  }
}
