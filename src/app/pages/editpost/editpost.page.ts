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
import { CameraService } from 'src/app/services/CameraService';
import { ThemeService } from '../../services/theme.service';
import { TranslateService } from '@ngx-translate/core';
import { VideoEditor } from '@ionic-native/video-editor/ngx';
import { AppService } from 'src/app/services/AppService';
import { UtilService } from 'src/app/services/utilService';
import { LogUtils } from 'src/app/services/LogUtils';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

import * as _ from 'lodash';

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
  public channelAvatar = '';
  public channelName = '';
  public subscribers: string = '';
  public newPost: string = '';
  public oldNewPost: string = '';
  public imgUrl: string = '';
  public nodeId: string = '';
  public channelId: number = 0;
  public postId: number = 0;

  public posterImg: any = '';
  public flieUri: string = '';
  public uploadProgress: number = 0;
  public videotype: string = 'video/mp4';
  public transcode: number = 0;

  public cachedMediaType = '';
  public duration: any = 0;

  public totalProgress: number = 0;

  public isShowVideo: boolean = false;
  private editState: FeedsData.EditState = FeedsData.EditState.NoChange;
  private throwMsgTransDataLimit = 4 * 1000 * 1000;
  private transDataChannel: FeedsData.TransDataChannel =
    FeedsData.TransDataChannel.MESSAGE;
  public fullScreenmodal: any = '';
  constructor(
    private events: Events,
    private native: NativeService,
    private navCtrl: NavController,
    private acRoute: ActivatedRoute,
    private camera: CameraService,
    private zone: NgZone,
    private feedService: FeedService,
    public theme: ThemeService,
    private translate: TranslateService,
    public modalController: ModalController,
    public videoEditor: VideoEditor,
    public appService: AppService,
    public el: ElementRef,
    private logUtils: LogUtils,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper,
  ) {}

  ngOnInit() {
    this.acRoute.queryParams.subscribe(data => {
      let item = _.cloneDeep(data);
      this.nodeId = item['nodeId'] || '';
      this.channelId = item['channelId'] || '';
      this.postId = item['postId'] || '';
    });
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

    this.events.subscribe(FeedsEvent.PublishType.editPostSuccess, () => {
      this.zone.run(() => {
        this.events.publish(FeedsEvent.PublishType.updateTab);
        this.native.hideLoading();
        this.native.pop();
      });
    });

    this.events.subscribe(
      FeedsEvent.PublishType.streamError,
      (streamErrorData: FeedsEvent.StreamErrorData) => {
        this.zone.run(() => {
          let nodeId = streamErrorData.nodeId;
          let error = streamErrorData.error;
          this.feedService.handleSessionError(nodeId, error);
          this.pauseVideo();
          this.native.hideLoading();
        });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.streamOnStateChangedCallback,
      (streamStateChangedData: FeedsEvent.StreamStateChangedData) => {
        this.zone.run(() => {
          let state = streamStateChangedData.streamState;
          let nodeId = streamStateChangedData.nodeId;
          if (state != FeedsData.StreamState.CONNECTED) return;

          if (
            this.editState == FeedsData.EditState.TextImageChange ||
            this.editState == FeedsData.EditState.TextVideoChange
          ) {
            this.feedService.sendData(
              this.nodeId,
              this.channelId,
              this.postId,
              0,
              0,
              this.flieUri,
              this.imgUrl,
              0,
            );
          }
        });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.setBinaryFinish,
      (setBinaryFinishData: FeedsEvent.setBinaryFinishData) => {
        this.zone.run(() => {
          this.processSetBinaryResult();
        });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.streamSetBinarySuccess,
      (setBinaryFinishData: FeedsEvent.setBinaryFinishData) => {
        this.zone.run(() => {
          let nodeId = setBinaryFinishData.nodeId;
          this.feedService.closeSession(nodeId);
          this.processSetBinaryResult();
        });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.streamSetBinaryError,
      (streamErrorData: FeedsEvent.StreamErrorData) => {
        this.zone.run(() => {
          let nodeId = streamErrorData.nodeId;
          let error = streamErrorData.error;
          this.feedService.closeSession(nodeId);
          this.native.hideLoading();
        });
      },
    );

    this.events.subscribe(FeedsEvent.PublishType.openRightMenu, () => {
      //this.clVideo();
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
    this.events.unsubscribe(FeedsEvent.PublishType.editPostSuccess);

    this.events.unsubscribe(FeedsEvent.PublishType.setBinaryFinish);

    this.events.unsubscribe(FeedsEvent.PublishType.streamError);
    this.events.unsubscribe(FeedsEvent.PublishType.streamSetBinarySuccess);
    this.events.unsubscribe(FeedsEvent.PublishType.streamSetBinaryError);
    this.events.unsubscribe(
      FeedsEvent.PublishType.streamOnStateChangedCallback,
    );
    this.events.unsubscribe(FeedsEvent.PublishType.openRightMenu);

    this.imgUrl = '';
    this.native.hideLoading();
    this.hideFullScreen();
    this.removeVideo();
    this.events.publish(FeedsEvent.PublishType.addBinaryEvevnt);
    this.feedService.closeSession(this.nodeId);
  }

  newPostTextArea() {
    this.newPostIonTextarea.setFocus();
  }

  pauseVideo() {
    if (this.posterImg != '') {
      let id = this.nodeId + this.channelId + this.postId;
      let video: any = document.getElementById(id + 'videoeditpost') || '';
      if (!video.paused) {
        //判断是否处于暂停状态
        video.pause(); //停止播放
      }
    }
  }

  ionViewDidEnter() {
    document.getElementById('editPost').click();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('EditPostPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  post() {
    if (this.feedService.getServerStatusFromId(this.nodeId) != 0) {
      this.native.toast_trans('common.connectionError');
      return;
    }

    if (this.checkServerStatus(this.nodeId) != 0) {
      this.native.toastWarn('common.connectionError1');
      return;
    }

    let newPost = this.native.iGetInnerText(this.newPost);
    if (newPost === '' && this.imgUrl === '' && this.flieUri === '') {
      this.native.toast_trans('CreatenewpostPage.tipMsg');
      return false;
    }

    if (this.oldNewPost === newPost) {
      this.native.toast_trans('common.nochanges');
      return false;
    }

    this.native
      .showLoading('common.waitMoment', isDismiss => {})
      .then(() => {
        this.editPost();
      })
      .catch(() => {
        this.native.hideLoading();
      });
  }

  editPost() {
    // if (this.feedService.getServerStatusFromId(this.nodeId) != 0){
    //   this.native.toast_trans("common.connectionError");
    //   return;
    // }

    if (this.imgUrl == '' && this.posterImg == '' && this.flieUri == '') {
      this.editState = FeedsData.EditState.TextChange;
      let content = this.feedService.createContent(this.newPost, null, null);
      this.publishEditedPost(content);
      return;
    }

    //content img & only text changed
    if (this.newPost != this.oldNewPost && this.imgUrl != '') {
      this.editState = FeedsData.EditState.TextChange;
      let size = this.feedService.getContentDataSize(
        this.nodeId,
        this.channelId,
        this.postId,
        0,
        0,
        FeedsData.MediaType.containsImg,
      );
      //this.feedService.compress(this.imgUrl).then((imageThumb)=>{
      let content = this.feedService.createOneImgContent(
        this.newPost,
        this.imgUrl,
        size,
      );
      this.publishEditedPost(content);
      //});
      return;
    }

    //content video && only text changed
    if (this.newPost != this.oldNewPost && this.posterImg != '') {
      this.editState = FeedsData.EditState.TextChange;
      let size = this.feedService.getContentDataSize(
        this.nodeId,
        this.channelId,
        this.postId,
        0,
        0,
        FeedsData.MediaType.containsVideo,
      );
      let content = this.feedService.createVideoContent(
        this.newPost,
        this.posterImg,
        this.duration,
        size,
      );
      this.publishEditedPost(content);
      return;
    }

    this.publishPostThrowMsg();
  }

  publishPostThrowMsg() {
    // if (this.feedService.getServerStatusFromId(this.nodeId) != 0){
    //   this.native.toast_trans("common.connectionError");
    //   return;
    // }

    let videoSize = this.flieUri.length;
    let imgSize = this.imgUrl.length;

    if (
      videoSize > this.throwMsgTransDataLimit ||
      imgSize > this.throwMsgTransDataLimit
    ) {
      this.transDataChannel = FeedsData.TransDataChannel.SESSION;
      // this.feedService.restoreSession(this.nodeId);
    } else {
      this.transDataChannel = FeedsData.TransDataChannel.MESSAGE;
    }

    if (this.flieUri != '') {
      this.editState = FeedsData.EditState.TextVideoChange;
      let content = this.feedService.createVideoContent(
        this.newPost,
        this.posterImg,
        this.duration,
        videoSize,
      );
      this.publishEditedPost(content);
      return;
    }

    if (this.imgUrl != '') {
      this.feedService.compress(this.imgUrl).then(imageThumb => {
        this.editState = FeedsData.EditState.TextImageChange;
        let content = this.feedService.createOneImgContent(
          this.newPost,
          imageThumb,
          imgSize,
        );
        this.publishEditedPost(content);
      });
    }
  }

  publishEditedPost(content: any) {
    this.feedService.editPost(
      this.nodeId,
      this.channelId,
      this.postId,
      content,
    );
  }

  addImg(type: number) {
    this.camera.openCamera(
      30,
      0,
      type,
      (imageUrl: any) => {
        this.zone.run(() => {
          this.imgUrl = imageUrl;
        });
      },
      (err: any) => {
        console.error('Add img err', err);
        let imgUrl = this.imgUrl || '';
        if (imgUrl === '') {
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
      'EditPostPage.title',
      this.appService,
    );
  }

  checkServerStatus(nodeId: string) {
    return this.feedService.getServerStatusFromId(nodeId);
  }

  initnodeStatus() {
    let status = this.checkServerStatus(this.nodeId);
    this.nodeStatus[this.nodeId] = status;
  }

  pressName(channelName: string) {
    this.viewHelper.createTip(channelName);
  }

  getImage() {
    let thumbkey = this.feedService.getImgThumbKeyStrFromId(
      this.nodeId,
      this.channelId,
      this.postId,
      0,
      0,
    );
    this.feedService
      .getData(thumbkey)
      .then(image => {
        this.imgUrl = image || '';
      })
      .catch(reason => {
        this.logUtils.loge(
          "Excute 'getImage' in editpost page is error,error msg is " +
            JSON.stringify(reason),
          TAG,
        );
      });
  }

  getContent() {
    let post = this.feedService.getPostFromId(
      this.nodeId,
      this.channelId,
      this.postId,
    );
    let postContent = post.content;
    this.oldNewPost = this.feedService.parsePostContentText(postContent) || '';
    this.newPost = this.feedService.parsePostContentText(postContent) || '';
  }

  initData() {
    let channel =
      this.feedService.getChannelFromId(this.nodeId, this.channelId) || {};

    this.channelName = channel['name'] || '';
    this.subscribers = channel['subscribers'] || '';
    this.channelAvatar = this.feedService.parseChannelAvatar(channel['avatar']);
    let post = this.feedService.getPostFromId(
      this.nodeId,
      this.channelId,
      this.postId,
    );
    if (post.content.mediaType === 1) {
      this.isShowVideo = false;
      this.getImage();
    }

    if (post.content.mediaType === 2) {
      this.isShowVideo = true;
      this.duration = post.content['videoThumbKey']['duration'];
      this.initVideo();
    }

    this.getContent();

    this.connectionStatus = this.feedService.getConnectionStatus();
  }

  videocam() {
    this.removeVideo();
    this.transcode = 0;
    this.uploadProgress = 0;
    this.totalProgress = 0;
    navigator.device.capture.captureVideo(
      (videosdata: any) => {
        this.zone.run(() => {
          let videodata = videosdata[0];
          this.getVideoInfo(videodata);
        });
      },
      error => {},
      { limit: 1, duration: 30 },
    );
  }

  selectvideo() {
    this.removeVideo();
    this.camera
      .getVideo()
      .then(flieUri => {
        let path = flieUri.startsWith('file://')
          ? flieUri
          : `file://${flieUri}`;
        this.getVideoInfo(path);
      })
      .catch(reason => {
        this.logUtils.loge(
          "Excute 'selectvideo' in editpost page is error, error is " +
            JSON.stringify(reason),
          TAG,
        );
      });
  }

  readFile(fileName: string, filepath: string) {
    window.resolveLocalFileSystemURL(
      filepath,
      (dirEntry: DirectoryEntry) => {
        dirEntry.getFile(
          fileName,
          { create: true, exclusive: false },
          fileEntry => {
            fileEntry.file(
              file => {
                let filesize = parseFloat((file.size / 1000 / 1000).toFixed(2));
                if (this.isVideoTipDes(filesize)) {
                  this.zone.run(() => {
                    this.flieUri = '';
                    this.posterImg = '';
                    this.imgUrl = '';
                    this.transcode = 0;
                    this.uploadProgress = 0;
                    this.totalProgress = 0;
                    this.native.toast_trans(
                      this.translate.instant('common.filevideodes'),
                    );
                  });
                  return;
                }

                let fileReader = new FileReader();
                fileReader.onloadend = (event: any) => {
                  this.zone.run(() => {
                    //  this.flieUri = fileReader.result;
                    let result = fileReader.result;
                    if (typeof result == 'string') this.flieUri = result;
                    else {
                      ab2str(result, function(str) {
                        this.flieUri = str;
                      });
                    }
                    this.isShowVideo = true;
                    let sid = setTimeout(() => {
                      //let img = new Image;
                      let id = this.nodeId + this.channelId + this.nodeId;
                      this.setFullScreen(id);
                      clearInterval(sid);
                    }, 20);
                  });
                };

                fileReader.onprogress = (event: any) => {
                  this.zone.run(() => {
                    this.uploadProgress = parseInt(
                      ((event.loaded / event.total) * 100) / 2 + '',
                    );
                    if (this.uploadProgress === 50) {
                      this.totalProgress = 100;
                    } else {
                      this.totalProgress = 50 + this.uploadProgress;
                    }
                  });
                };

                fileReader.readAsDataURL(file);
              },
              err => {
                this.logUtils.loge(
                  "Excute 'readFile' in editpost page is error ,readFileData error, error msg is " +
                    JSON.stringify(err),
                  TAG,
                );
              },
            );
          },
          err => {
            this.logUtils.loge(
              "Excute 'readFile' in editpost page is error ,getFileData error, error msg is " +
                JSON.stringify(err),
              TAG,
            );
          },
        );
      },
      (err: any) => {
        this.logUtils.loge(
          "Excute 'readFile' in editpost page is error ,path error, error msg is " +
            JSON.stringify(err),
          TAG,
        );
      },
    );
  }

  async transcodeVideo(path: any): Promise<string> {
    const fileUri = path.startsWith('file://') ? path : `file://${path}`;
    const videoInfo = await this.videoEditor.getVideoInfo({ fileUri });
    this.duration = videoInfo['duration'];
    let width: number = 0;
    let height: number = 0;

    // 视频比例
    const ratio = videoInfo.width / videoInfo.height;

    if (ratio > 1) {
      width = videoInfo.width > 480 ? 480 : videoInfo.width;
    } else if (ratio < 1) {
      width = videoInfo.width > 360 ? 360 : videoInfo.width;
    } else if (ratio === 1) {
      width = videoInfo.width > 480 ? 480 : videoInfo.width;
    }

    let videoBitrate = videoInfo['bitrate'] / 2;

    height = +(width / ratio).toFixed(0);

    return this.videoEditor.transcodeVideo({
      fileUri,
      outputFileName: `${Date.now()}`,
      outputFileType: this.videoEditor.OutputFileType.MPEG4,
      saveToLibrary: false,
      width,
      height,
      videoBitrate: videoBitrate,
      progress: (info: number) => {
        this.zone.run(() => {
          this.transcode = parseInt((info * 100) / 2 + '');
          this.totalProgress = this.transcode;
        });
      },
    });
  }

  isVideoTipDes(filesize: number) {
    return filesize > 10;
  }

  initVideo() {
    let key = this.feedService.getVideoThumbStrFromId(
      this.nodeId,
      this.channelId,
      this.postId,
      0,
    );
    this.feedService.getData(key).then((idata: string) => {
      let imgageData: string = idata || '';
      if (imgageData != '') {
        this.zone.run(() => {
          this.isShowVideo = true;
          this.posterImg = imgageData;
          let id = this.nodeId + this.channelId + this.postId;
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

  removeVideo() {
    this.isShowVideo = false;
    this.totalProgress = 0;
    this.uploadProgress = 0;
    this.totalProgress = 0;
    this.posterImg = '';
    this.flieUri = '';
    let id = this.nodeId + this.channelId + this.postId;
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
            let key = this.feedService.getVideoKey(
              this.nodeId,
              this.channelId,
              this.postId,
              0,
              0,
            );
            this.getVideo(key);
          }
        });
      };
    }
  }

  getVideo(key: string) {
    this.logUtils.logi('getVideo >> key = ' + key, TAG);
    this.feedService.getData(key).then((videodata: string) => {
      this.zone.run(() => {
        let videoData = videodata || '';
        this.flieUri = videoData;
        this.loadVideo(videoData);
      });
    });
  }

  loadVideo(videoData: string) {
    let id = this.nodeId + this.channelId + this.postId;
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

  async getVideoInfo(fileUri: string) {
    let videoInfo = await this.videoEditor.getVideoInfo({ fileUri: fileUri });
    this.duration = videoInfo['duration'];
    this.createThumbnail(fileUri);
  }

  handleTotal(duration: any) {
    return UtilService.timeFilter(duration);
  }

  createThumbnail(path: string) {
    this.videoEditor
      .createThumbnail({
        fileUri: path,
        outputFileName: `${Date.now()}`,
        atTime: this.duration / 10,
        width: 320,
        height: 480,
        quality: 30,
      })
      .then(newfileUri => {
        newfileUri = 'cdvfile://localhost' + newfileUri.replace('file//', '');
        newfileUri = newfileUri.replace('/storage/emulated/0/', '/sdcard/');
        let lastIndex = newfileUri.lastIndexOf('/');
        let fileName = newfileUri.substring(lastIndex + 1, newfileUri.length);
        let filepath = newfileUri.substring(0, lastIndex);
        this.readThumbnail(fileName, filepath);

        this.transcodeVideo(path).then(newfileUri => {
          this.transcode = 100;
          newfileUri = 'cdvfile://localhost' + newfileUri.replace('file//', '');
          newfileUri = newfileUri.replace('/storage/emulated/0/', '/sdcard/');
          let lastIndex = newfileUri.lastIndexOf('/');
          let fileName = newfileUri.substring(lastIndex + 1, newfileUri.length);
          let filepath = newfileUri.substring(0, lastIndex);
          this.readFile(fileName, filepath);
        });
      });
  }

  readThumbnail(fileName: string, filepath: string) {
    window.resolveLocalFileSystemURL(
      filepath,
      (dirEntry: DirectoryEntry) => {
        dirEntry.getFile(
          fileName,
          { create: true, exclusive: false },
          fileEntry => {
            fileEntry.file(
              file => {
                let fileReader = new FileReader();
                fileReader.onloadend = (event: any) => {
                  this.zone.run(() => {
                    this.posterImg = fileReader.result;
                  });
                };

                fileReader.onprogress = (event: any) => {
                  // this.zone.run(()=>{
                  //   this.uploadProgress = parseInt((event.loaded/event.total)*100/2+'');
                  //   if(this.uploadProgress === 50){
                  //      this.totalProgress = 100;
                  //   }else{
                  //     this.totalProgress = 50+this.uploadProgress;
                  //   }
                  // })
                };

                fileReader.readAsDataURL(file);
              },
              err => {
                this.logUtils.loge(
                  "Excute 'readThumbnail' in editpost page, readFileData error, error msg is " +
                    JSON.stringify(err),
                  TAG,
                );
              },
            );
          },
          err => {
            this.logUtils.loge(
              "Excute 'readThumbnail' in editpost page, getFileData error, error msg is " +
                JSON.stringify(err),
              TAG,
            );
          },
        );
      },
      (err: any) => {
        this.logUtils.loge(
          "Excute 'readThumbnail' in editpost page, path error, error msg is " +
            JSON.stringify(err),
          TAG,
        );
      },
    );
  }

  processSetBinaryResult() {
    this.navCtrl.pop().then(() => {
      this.events.publish(FeedsEvent.PublishType.updateTab);
      this.posterImg = '';
      this.flieUri = '';
      this.imgUrl = '';
      this.native.hideLoading();
      this.native.toast_trans('CreatenewpostPage.tipMsg1');
    });
  }
}

function ab2str(u, f) {
  var b = new Blob([u]);
  var r = new FileReader();
  r.readAsText(b, 'utf-8');
  r.onload = function() {
    if (f) f.call(null, r.result);
  };
}
