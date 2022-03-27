import {
  Component,
  OnInit,
  NgZone,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { NavController, ModalController, IonTextarea } from '@ionic/angular';
import { Events } from 'src/app/services/events.service';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from '../../services/NativeService';
import { ThemeService } from '../../services/theme.service';
import { TranslateService } from '@ngx-translate/core';
import { VideoEditor } from '@ionic-native/video-editor/ngx';
import { AppService } from 'src/app/services/AppService';
import { UtilService } from 'src/app/services/utilService';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import  _ from 'lodash';
import { Logger } from 'src/app/services/logger';
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';

let TAG: string = 'Feeds-editpost';
@Component({
  selector: 'app-editpost',
  templateUrl: './editpost.page.html',
  styleUrls: ['./editpost.page.scss'],
})
export class EditPostPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild('newPostIonTextarea', { static: false })
  newPostIonTextarea: IonTextarea;
  public connectionStatus = 1;
  public nodeStatus = {};
  public channelAvatar = './assets/icon/reserve.svg';
  public channelName = '';
  public subscribers: string = '';
  public editContent: string = '';
  public unEditContent: string = '';
  public imgUrl: string = '';
  public destDid: string = '';
  public channelId: string = '';
  public postId: string = '';

  public posterImg: any = '';
  public flieUri: string = '';
  public uploadProgress: number = 0;
  public videotype: string = 'video/mp4';
  public transcode: number = 0;

  public cachedMediaType = '';
  public duration: any = 0;

  public totalProgress: number = 0;

  public isShowVideo: boolean = false;
  public fullScreenmodal: any = '';
  private postData: FeedsData.PostV3 = null;
  public mediaType: FeedsData.MediaType;
  constructor(
    private events: Events,
    private native: NativeService,
    private navCtrl: NavController,
    private acRoute: ActivatedRoute,
    private zone: NgZone,
    private feedService: FeedService,
    public theme: ThemeService,
    private translate: TranslateService,
    public modalController: ModalController,
    public videoEditor: VideoEditor,
    public appService: AppService,
    public el: ElementRef,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController
  ) { }

  ngOnInit() {
    this.acRoute.queryParams.subscribe(data => {
      let item = _.cloneDeep(data);
      this.destDid = item['destDid'] || '';
      this.channelId = item['channelId'] || '';
      this.postId = item['postId'] || '';
    });
    let sid = setTimeout(() => {
      this.newPostIonTextarea.setFocus();
      clearTimeout(sid);
    }, 300);
  }

  ionViewWillEnter() {
    this.initTitle();
    this.initData();

    this.events.subscribe(FeedsEvent.PublishType.connectionChanged, status => {
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe(
      FeedsEvent.PublishType.friendConnectionChanged,
      (friendConnectionChangedData: FeedsEvent.FriendConnectionChangedData) => {
        this.zone.run(() => {
          let nodeId = friendConnectionChangedData.nodeId;
          let connectionStatus = friendConnectionChangedData.connectionStatus;
          this.nodeStatus[nodeId] = connectionStatus;
        });
      },
    );

    this.events.subscribe(FeedsEvent.PublishType.rpcRequestError, () => {
      this.pauseVideo();
      this.native.hideLoading();
    });

    this.events.subscribe(FeedsEvent.PublishType.rpcResponseError, () => {
      this.zone.run(() => {
        this.pauseVideo();
        this.native.hideLoading();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      this.initTitle();
    });

    this.events.subscribe(FeedsEvent.PublishType.openRightMenu, () => {
      this.pauseVideo();
      this.hideFullScreen();
    });

    this.initnodeStatus();

    this.feedService.checkBindingServerVersion(() => {
      this.zone.run(() => {
        this.navCtrl.pop().then(() => {
          this.feedService.hideAlertPopover();
        });
      });
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.friendConnectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestError);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcResponseError);
    this.events.unsubscribe(FeedsEvent.PublishType.openRightMenu);

    this.imgUrl = '';
    this.native.hideLoading();
    this.hideFullScreen();
    this.removeVideo();
  }

  removeVideo() {
    this.isShowVideo = false;
    this.totalProgress = 0;
    this.uploadProgress = 0;
    this.totalProgress = 0;
    this.posterImg = '';
    this.flieUri = '';
    let id = this.destDid + this.channelId + this.postId;
    let video: any = document.getElementById(id + 'videoeditpost') || '';
    if (video != '') {
      video.removeAttribute('poster');
    }
    let source: any = document.getElementById(id + 'sourceeditpost') || '';
    if (source != '') {
      source.removeAttribute('poster');
    }

    if (video != '') {
      let sid = setTimeout(() => {
        video.load();
        clearTimeout(sid);
      }, 10);
    }
  }

  clickTextArea() {
    this.newPostIonTextarea.setFocus();
  }

  pauseVideo() {
    if (this.posterImg != '') {
      let id = this.destDid + this.channelId + this.postId;
      let video: any = document.getElementById(id + 'videoeditpost') || '';
      if (!video.paused) {
        //判断是否处于暂停状态
        video.pause(); //停止播放
      }
    }
  }

  ionViewDidEnter() {
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('EditPostPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  clickEidtPost() {

    let editContent = this.native.iGetInnerText(this.editContent);
    if (editContent === '') {
      this.native.toast_trans('CreatenewpostPage.tipMsg');
      return false;
    }

    if (this.unEditContent === editContent) {
      this.native.toast_trans('common.nochanges');
      return false;
    }

    this.native
      .showLoading('common.waitMoment', isDismiss => { })
      .then(() => {
        this.updatePost();
      })
      .catch(() => {
        this.native.hideLoading();
      });
  }

  showBigImage(content: any) {
    this.viewHelper.openViewer(
      this.titleBar,
      content,
      'common.image',
      'EditPostPage.title',
      this.appService,
    );
  }

  checkServerStatus(destDid: string) {
    return this.feedService.getServerStatusFromId(destDid);
  }

  initnodeStatus() {
    let status = this.checkServerStatus(this.destDid);
    this.nodeStatus[this.destDid] = status;
  }

  pressName(channelName: string) {
    this.viewHelper.createTip(channelName);
  }

  getImage(post: FeedsData.PostV3) {
    this.imgUrl = './assets/icon/reserve.svg';//set Reserve Image
    let mediaDatas = post.content.mediaData;
    const elements = mediaDatas[0];
    let thumbnailKey = elements.thumbnailPath;
    let type = elements.type;
    //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
    let fileName:string = "thumbnail-"+thumbnailKey.split("@")[0];
    this.hiveVaultController.getV3Data(this.destDid,thumbnailKey,fileName,type)
    .then((cacheResult)=>{
      let thumbImage = cacheResult || "";
      if(thumbImage != ""){
        this.imgUrl  = thumbImage;
      }
    }).catch(()=>{
    })
  }


  async initData() {
    let channel :any = await this.feedService.getChannelFromIdV3(this.destDid, this.channelId);
    this.channelName = channel['name'] || '';
    this.subscribers = channel['subscribers'] || '';
    let channelAvatarUri = channel['avatar'] || '';
    if(channelAvatarUri != ''){
        this.handleChannelAvatar(channelAvatarUri);
    }
    let post: any = await this.dataHelper.getPostV3ById(this.destDid,this.postId);
    this.postData = post;
    this.mediaType = post.content.mediaType;

    if (this.mediaType === FeedsData.MediaType.containsImg) {
      this.isShowVideo = false;
      this.getImage(post);
    }

    if (this.mediaType === FeedsData.MediaType.containsVideo) {
      this.isShowVideo = true;
      this.duration =  post.content.mediaData[0].duration;
      this.initVideo(post);
    }

    this.unEditContent = this.postData.content.content || '';
    this.editContent = this.postData.content.content || '';

    this.connectionStatus = this.feedService.getConnectionStatus();
  }

  handleChannelAvatar(channelAvatarUri: string){
    let fileName:string = "channel-avatar-"+channelAvatarUri.split("@")[0];
    this.hiveVaultController.getV3Data(this.destDid,channelAvatarUri,fileName,"0")
    .then((result)=>{
        this.channelAvatar = result;
    }).catch((err)=>{
    })
  }


  initVideo(post: FeedsData.PostV3) {
    this.posterImg = './assets/icon/reserve.svg';//set Reserve Image
    let mediaDatas = post.content.mediaData;
    const elements = mediaDatas[0];
    let thumbnailKey = elements.thumbnailPath;
    let type = elements.type;
    //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
    let fileName:string = "poster-"+thumbnailKey.split("@")[0];

    this.hiveVaultController
    .getV3Data(this.destDid, thumbnailKey, fileName, type)
    .then((idata: string) => {
      let imgageData: string = idata || '';
      if (imgageData != '') {
        this.zone.run(() => {
          this.isShowVideo = true;
          this.posterImg = imgageData;
          let id = this.destDid + this.channelId + this.postId;
          let sid = setTimeout(() => {
            let video = document.getElementById(id + 'videoeditpost');
            video.setAttribute('poster', imgageData);
            this.setFullScreen(id);
            this.setOverPlay(id);
            clearTimeout(sid);
          }, 0);
        });
      }
    });
  }

  setFullScreen(id: string) {
    let vgfullscreen: any =
      document.getElementById(id + 'vgfullscreeneditpost') || '';
    if (vgfullscreen != '') {
      vgfullscreen.onclick = () => {
        this.pauseVideo();
        let postImg: string = document
          .getElementById(id + 'videoeditpost')
          .getAttribute('poster');
        let videoSrc: string = document
          .getElementById(id + 'sourceeditpost')
          .getAttribute('src');
        this.fullScreenmodal = this.native.setVideoFullScreen(
          postImg,
          videoSrc,
        );
      };
    }
  }

  hideFullScreen() {
    if (this.fullScreenmodal != '') {
      this.modalController.dismiss();
      this.fullScreenmodal = '';
    }
  }

  setOverPlay(id: string) {
    let vgoverlayplay: any =
      document.getElementById(id + 'vgoverlayplayeditpost') || '';
    if (vgoverlayplay != '') {
      vgoverlayplay.onclick = () => {
        this.zone.run(() => {
          let source: any =
            document.getElementById(id + 'sourceeditpost') || '';
          let sourceSrc = source.getAttribute('src') || '';
          if (sourceSrc === '') {
              this.getVideo();
          }
        });
      };
    }
  }

  getVideo() {

    let mediaDatas = this.postData.content.mediaData;
    const elements = mediaDatas[0];
    let originKey = elements.originMediaPath;
    let type = elements.type;
    //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
    let fileName:string = "origin-"+originKey.split("@")[0];

    this.hiveVaultController
      .getV3Data(this.destDid, originKey, fileName, type)
    .then((videodata: string) => {
      this.zone.run(() => {
        let videoData = videodata || '';
        this.flieUri = videoData;
        this.loadVideo(videoData);
      });
    });
  }

  loadVideo(videoData: string) {
    let id = this.destDid + this.channelId + this.postId;
    let source: any = document.getElementById(id + 'sourceeditpost') || '';
    source.setAttribute('src', videoData);
    let vgbuffering: any = document.getElementById(id + 'vgbufferingeditpost');
    let vgoverlayplay: any = document.getElementById(
      id + 'vgoverlayplayeditpost',
    );
    let vgcontrol: any = document.getElementById(id + 'vgcontrolseditpost');
    let video: any = document.getElementById(id + 'videoeditpost') || '';

    video.addEventListener('ended', () => {
      vgoverlayplay.style.display = 'block';
      vgbuffering.style.display = 'none';
      vgcontrol.style.display = 'none';
    });

    video.addEventListener('pause', () => {
      vgbuffering.style.display = 'none';
      vgoverlayplay.style.display = 'block';
      vgcontrol.style.display = 'none';
    });

    video.addEventListener('play', () => {
      vgcontrol.style.display = 'block';
    });

    video.addEventListener('canplay', () => {
      vgbuffering.style.display = 'none';
      video.play();
    });

    video.load();
  }


  updatePost() {
    try {
      let content = _.cloneDeep(this.postData.content);
      content.content = this.editContent;
      console.log("======this.postId======",this.postId);
      console.log("======this.channelId======",this.channelId);
      console.log("========content========="+JSON.stringify(content));
      this.hiveVaultController.updatePost(this.postId,this.channelId,"public",TAG,JSON.stringify(content))
        .then((result)=>{
          console.log("===result===",result);
          this.zone.run(() => {
            this.events.publish(FeedsEvent.PublishType.updateTab);
            this.native.hideLoading();
            this.native.pop();
          });
        }).catch((err)=>{
         this.pauseVideo();
         this.native.hideLoading();
        });
    } catch (error) {
      this.pauseVideo();
      this.native.hideLoading();
    }
  }
}

