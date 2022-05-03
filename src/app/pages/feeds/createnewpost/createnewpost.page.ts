import { Component, OnInit, NgZone, ElementRef, ViewChild, } from '@angular/core';
import { NavController, ModalController, Platform, IonTextarea, } from '@ionic/angular';
import { Events } from 'src/app/services/events.service';
import { FeedService } from '../../../services/FeedService';
import { NativeService } from '../../../services/NativeService';
import { CameraService } from '../../../services/CameraService';
import { ThemeService } from '../../../services/theme.service';
import { TranslateService } from '@ngx-translate/core';
import { VideoEditor } from '@ionic-native/video-editor/ngx';
import { AppService } from '../../../services/AppService';
import { UtilService } from '../../../services/utilService';
import { StorageService } from '../../../services/StorageService';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { Logger } from 'src/app/services/logger';
import { MenuService } from 'src/app/services/MenuService';
import { File } from '@ionic-native/file/ngx';
import { FileHelperService } from 'src/app/services/FileHelperService';
import { IPFSService } from 'src/app/services/ipfs.service';
import { PostHelperService } from 'src/app/services/post_helper.service';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service'

let TAG: string = 'Feeds-createpost';

@Component({
  selector: 'app-createnewpost',
  templateUrl: './createnewpost.page.html',
  styleUrls: ['./createnewpost.page.scss'],
})
export class CreatenewpostPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild('newPostIonTextarea', { static: false })
  newPostIonTextarea: IonTextarea;
  public isLoading: boolean = false;
  public loadingTitle: string = "common.waitMoment";
  public loadingText: string = "common.uploading";
  public loadingCurNumber: string = null;
  public loadingMaxNumber: string = null;
  public channelAvatar = './assets/icon/reserve.svg';
  public channelName = '';
  public subscribers: string = '';
  public newPost: string = '';
  public imgUrl: string = '';
  public nodeId: string = '';
  public channelIdV3: string = '';
  public channelId: string = "0";

  public posterImg: any = '';
  public flieUri: string = '';
  public uploadProgress: number = 0;
  public videotype: string = 'video/mp4';
  public transcode: number = 0;
  public duration: any = 0;

  public totalProgress: number = 0;

  public fullScreenmodal: any = '';

  public channelList = [];
  public hideSwitchFeed: boolean = false;
  private isPublishing: boolean = false;
  public pictureMenu: any = null;
  // 视频data
  private videoData: FeedsData.videoData = null;
  private isUpdateHomePage: boolean = false;
  constructor(
    private platform: Platform,
    private events: Events,
    private native: NativeService,
    private navCtrl: NavController,
    private camera: CameraService,
    private zone: NgZone,
    private feedService: FeedService,
    public theme: ThemeService,
    private translate: TranslateService,
    public videoEditor: VideoEditor,
    public appService: AppService,
    public el: ElementRef,
    public modalController: ModalController,
    private storageService: StorageService,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper,
    private menuService: MenuService,
    private file: File,
    private fileHelperService: FileHelperService,
    private ipfsService: IPFSService,
    private dataHelper: DataHelper,

    private postHelperService: PostHelperService,
    private feedsServiceApi: FeedsServiceApi,
    // private hiveService: HiveService,
    // private hiveVaultApi: HiveVaultApi,
    private hiveVaultController: HiveVaultController

  ) { }

  ngOnInit() {
    let sid = setTimeout(() => {
      this.newPostIonTextarea.setFocus();
      clearTimeout(sid);
    }, 300);
  }

  newPostTextArea() {
    this.newPostIonTextarea.setFocus();
  }

  async initFeed() {
    let currentFeed: FeedsData.ChannelV3 = this.dataHelper.getCurrentChannel();

    if (currentFeed == null) {
      const selfChannelList = await this.dataHelper.getSelfChannelListV3();
      currentFeed = await this.dataHelper.getChannelV3ById(selfChannelList[0].destDid, selfChannelList[0].channelId);
      this.dataHelper.setCurrentChannel(currentFeed);
    }

    this.channelIdV3 = currentFeed.channelId;
    this.channelName = currentFeed['name'] || '';
    this.subscribers = currentFeed['subscribers'] || '';
    let channelAvatarUri = currentFeed['avatar'] || '';
    if (channelAvatarUri != '') {
      let destDid: string = currentFeed.destDid;
      this.handleChannelAvatar(channelAvatarUri, destDid);
    }
  }

  handleChannelAvatar(channelAvatarUri: string, destDid: string) {
    let fileName: string = channelAvatarUri.split("@")[0];
    this.hiveVaultController.getV3Data(destDid, channelAvatarUri, fileName, "0")
      .then((result) => {
        this.channelAvatar = result;
      }).catch((err) => {
      })
  }

  async ionViewWillEnter() {
    this.imgUrl = this.dataHelper.getSelsectNftImage();
    this.dataHelper.setSelsectNftImage(this.imgUrl);
    this.channelList = await this.dataHelper.getSelfChannelListV3() || [];
    this.initTitle();

    this.initFeed();

    this.events.subscribe(FeedsEvent.PublishType.openRightMenu, () => {
      this.pauseVideo();
      this.hideFullScreen();
    });

    this.events.subscribe(FeedsEvent.PublishType.authEssentialFail, () => {
      this.isLoading = false;
      this.isPublishing = false;
      this.native.toast('common.sendFail'); // 需要更改错误提示
    });

    this.events.subscribe(FeedsEvent.PublishType.insertError,() => {
      this.isLoading = false;
      this.isPublishing = false;
      this.native.toast('common.sendFail'); // 需要更改错误提示
    });

  }

  ionViewWillLeave() {

    this.isLoading = false;
    this.hideSwitchFeed = false;
    if (this.pictureMenu != null) {
      this.menuService.hideActionSheet();
    }

    this.events.unsubscribe(FeedsEvent.PublishType.openRightMenu);
    this.events.unsubscribe(FeedsEvent.PublishType.authEssentialFail);
    this.events.unsubscribe(FeedsEvent.PublishType.insertError);
    this.hideFullScreen();

    this.imgUrl = '';
    this.transcode = 0;
    this.uploadProgress = 0;
    this.totalProgress = 0;
    this.removeVideo();

    if (this.isUpdateHomePage) {
      this.native.handleTabsEvents("update");
    }else{
      this.native.handleTabsEvents();
    }

  }

  ionViewDidEnter() { }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('CreatenewpostPage.addingPost'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  post() {
    this.zone.run(async () => {
      let newPost = this.native.iGetInnerText(this.newPost);

      let connect = this.dataHelper.getNetworkStatus();
      if (connect === FeedsData.ConnState.disconnected) {
        this.native.toastWarn('common.connectionError');
        return;
      }

      if (newPost === '' && this.imgUrl === '' && this.flieUri === '') {
        this.native.toast_trans('CreatenewpostPage.tipMsg');
        return false;
      }
      if (this.posterImg != '' && this.flieUri === '') {
        this.native.toast_trans('CreatenewpostPage.tipMsg2');
        return false;
      }
      if (!this.isPublishing) {
        this.isPublishing = true;
        //show dialog
        this.isLoading = true;
        try {
          await this.sendPost();
          this.isLoading = false;
          //dismiss dialog
          this.backHome();
        } catch (error) {
          console.log('======================1');
          this.isLoading = false;
          this.isPublishing = false;
          this.native.toast('common.sendFail'); // 需要更改错误提示
        }
      }
    });
  }

  async sendPost() {
    await this.hiveVaultController.publishPost(this.channelIdV3, this.newPost, [this.imgUrl], this.videoData, '')
  }

  addImg(type: number) {
    this.camera.openCamera(
      30,
      0,
      type,
      (imageUrl: any) => {
        this.zone.run(() => {
          this.imgUrl = imageUrl;
          this.dataHelper.setSelsectNftImage(imageUrl);
        });
      },
      (err: any) => {
        Logger.error(TAG, 'Add img err', err);
        let imgUrl = this.imgUrl || '';
        if (imgUrl === "") {
          this.native.toast_trans('common.noImageSelected');
        }
      },
    );
  }

  showBigImage(content: any) {
    this.viewHelper.openViewer(
      this.titleBar,
      content,
      'common.image',
      'CreatenewpostPage.addingPost',
      this.appService,
    );
  }

  pressName(channelName: string) {
    this.viewHelper.createTip(channelName);
  }

  async videocam() {
    this.removeVideo();
    this.transcode = 0;
    this.uploadProgress = 0;
    this.totalProgress = 0;
    let videoData = null;

    try {
      videoData = await this.postHelperService.recordAVideo((progress: number) => {
        this.zone.run(() => {
          this.totalProgress = progress;
        });
      });
    } catch (error) {
      Logger.error(error);
    }
    this.handleVideoData(videoData);
  }

  /**
   * 1.Get video from camera
   * 2.Get video duration
   * 3.Check video duration
   * 4.Create video thumbnail
   * 5.Transcode video
   * 6.Creat video obj
   */
  async selectvideo() {
    this.removeVideo();
    this.transcode = 0;
    this.uploadProgress = 0;
    this.totalProgress = 0;
    let path = "";

    const videoData = await this.postHelperService.selectvideo((progress: number) => {
      this.zone.run(() => {
        this.totalProgress = progress;
      });
    });
    this.handleVideoData(videoData);
  }

  handleVideoData(videoData: FeedsData.videoData) {
    if (!videoData) {
      this.flieUri = '';
      this.posterImg = '';
      this.imgUrl = '';
      this.transcode = 0;
      this.uploadProgress = 0;
      this.totalProgress = 0;
      this.videoData = null;
      this.native.toast(this.translate.instant('common.filevideodes'));
      return;
    }
    this.transcode = 100;
    this.totalProgress = this.transcode;

    this.posterImg = videoData.thumbnail;
    this.flieUri = videoData.video;

    let sid = setTimeout(() => {
      this.setFullScreen();
      let video: any = document.getElementById('videocreatepost') || '';
      video.setAttribute('poster', this.posterImg);
      this.setOverPlay(this.flieUri);
      clearTimeout(sid);
    }, 0);

    this.videoData = videoData;
  }

  removeVideo() {
    this.totalProgress = 0;
    this.uploadProgress = 0;
    this.totalProgress = 0;
    this.posterImg = '';
    this.flieUri = '';
    let video: any = document.getElementById('videocreatepost') || '';
    if (video != '') {
      video.removeAttribute('poster');
    }
    let source: any = document.getElementById('sourcecreatepost') || '';
    if (source != '') {
      source.removeAttribute('src'); // empty source
    }

    if (video != '') {
      let sid = setTimeout(() => {
        video.load();
        clearTimeout(sid);
      }, 10);
    }
  }

  setFullScreen() {
    let vgfullscreen: any =
      document.getElementById('vgfullscreecreatepost') || '';
    if (vgfullscreen === '') {
      return;
    }
    vgfullscreen.onclick = () => {
      this.pauseVideo();
      let postImg: string = document
        .getElementById('videocreatepost')
        .getAttribute('poster');
      let videoSrc: string = document
        .getElementById('sourcecreatepost')
        .getAttribute('src');
      this.fullScreenmodal = this.native.setVideoFullScreen(postImg, videoSrc);
    };
  }

  hideFullScreen() {
    if (this.fullScreenmodal != '') {
      this.modalController.dismiss();
      this.fullScreenmodal = '';
    }
  }

  setOverPlay(fileUri: string) {
    let vgoverlayplay: any =
      document.getElementById('vgoverlayplaycreatepost') || '';
    if (vgoverlayplay != '') {
      vgoverlayplay.onclick = () => {
        this.zone.run(() => {
          let source: any = document.getElementById('sourcecreatepost') || '';
          let sourceSrc = source.getAttribute('src') || '';
          if (sourceSrc === '') {
            this.loadVideo(fileUri);
          }
        });
      };
    }
  }

  loadVideo(videoData: string) {
    let video: any = document.getElementById('videocreatepost') || '';
    let source: any = document.getElementById('sourcecreatepost') || '';
    source.setAttribute('src', videoData);
    let vgbuffering: any = document.getElementById('vgbufferingcreatepost');
    let vgoverlayplay: any = document.getElementById('vgoverlayplaycreatepost');
    let vgcontrol: any = document.getElementById('vgcontrolscreatepost');

    video.addEventListener('ended', () => {
      vgoverlayplay.style.display = 'block';
      vgbuffering.style.display = 'none';
      vgcontrol.style.display = 'none';
    });

    video.addEventListener('pause', () => {
      vgoverlayplay.style.display = 'block';
      vgbuffering.style.display = 'none';
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

  pauseVideo() {
    if (this.flieUri === '') {
      return;
    }
    let video: any = document.getElementById('videocreatepost') || '';
    if (!video.paused) {
      //判断是否处于暂停状态
      video.pause(); //停止播放
    }
  }

  clickFeedAvatar() {
    if (this.channelList.length > 1) {
      this.hideSwitchFeed = true;
    }
  }

  hideComponent(channel: any) {

    if (channel === null) {
      this.hideSwitchFeed = false;
      return;
    }

    this.channelName = channel['name'] || '';
    this.subscribers = channel['subscribers'] || '';
    this.channelAvatar = this.feedService.parseChannelAvatar(channel['avatar']);

    this.dataHelper.setCurrentChannel(channel);
    this.storageService.set('feeds.currentChannel', JSON.stringify(channel));
    this.initFeed();
    this.hideSwitchFeed = false;
  }

  moreName(name: string) {
    return UtilService.moreNanme(name, 15);
  }

  backHome() {
    this.navCtrl.pop().then(() => {
      this.newPost = '';
      this.imgUrl = '';
      this.posterImg = '';
      this.flieUri = '';
      this.isPublishing = false;
      this.isUpdateHomePage = true;
    });
  }

  createNft() {
    this.native.navigateForward(['mintnft'], {});
  }

  clickImageMenu() {
    this.pictureMenu = this.menuService.showPictureMenu(
      this,
      this.openCamera,
      this.openGallery,
      this.openNft,
    );
  }

  openNft(that: any) {
    that.native.navigateForward(['profilenftimage'], { queryParams: { type: 'postImages' } });
  }

  openGallery(that: any) {
    that.handleImgUri(0, that).then(async (imagePath: string) => {

      // let pathObj = that.handleImgUrlPath(imagePath);
      let pathObj = that.handleImgUrlPath(imagePath);
      let fileName = pathObj['fileName'];
      let filePath = pathObj['filepath'];
      // that.zone.run(async () => {
      //   const file: File = await that.fileHelperService.getUserFile(filePath, fileName);
      //   that.ipfsService.uploadData(file);
      // });
      return that.getFlieObj(fileName, filePath, that);

    }).then((fileBase64: string) => {
      that.zone.run(() => {
        //For test
        // const fileBlob = UtilService.base64ToBlob(fileBase64);
        // that.ipfsService.uploadData(fileBlob);
        that.imgUrl = fileBase64;
        that.dataHelper.setSelsectNftImage(fileBase64);
      });

    });
  }

  openCamera(that: any) {
    that.camera.openCamera(
      30,
      0,
      1,
      (imageUrl: any) => {
        that.zone.run(() => {
          that.imgUrl = imageUrl;
          that.dataHelper.setSelsectNftImage(imageUrl);
        });
      },
      (err: any) => {
        //Logger.error(TAG, 'Add img err', err);
        let imgUrl = that.imgUrl || '';
        if (imgUrl === "") {
          that.native.toast_trans('common.noImageSelected');
        }
      },
    );
  }

  removeImg() {
    this.imgUrl = "";
    this.dataHelper.setSelsectNftImage("");
  }

  handleImgUri(type: number, that: any): Promise<any> {
    return new Promise((resolve, reject) => {
      that.camera.openCamera(
        100,
        1,
        type,
        (imgPath: any) => {
          resolve(imgPath);
        },
        (err: any) => {
          Logger.error(TAG, 'Add img err', err);
          let imgUrl = that.imgUrl || '';
          if (!imgUrl) {
            this.native.toast_trans('common.noImageSelected');
            reject(err);
            return;
          }
        }
      );
    });
  }

  getFlieObj(fileName: string, filepath: string, that: any): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const base64Result = await that.fileHelperService.getUserFileBase64Data(filepath, fileName);
        if (!base64Result) {
          const error = 'Get File object is null';
          Logger.error(TAG, 'Get File object error', error)
          reject(error);
        }
        resolve(base64Result);
      } catch (error) {
        Logger.error(TAG, 'Get File object error', error)
        reject(error);
      }
    });
  }

  handleImgUrlPath(fileUri: string) {
    let pathObj = {};
    fileUri = fileUri.replace('/storage/emulated/0/', '/sdcard/');
    let path = fileUri.split('?')[0];
    let lastIndex = path.lastIndexOf('/');
    pathObj['fileName'] = path.substring(lastIndex + 1, fileUri.length);
    pathObj['filepath'] = path.substring(0, lastIndex);
    pathObj['filepath'] = pathObj['filepath'].startsWith('file://')
      ? pathObj['filepath']
      : `file://${pathObj['filepath']}`;

    return pathObj;
  }
}
