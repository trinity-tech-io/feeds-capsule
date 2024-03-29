import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { CameraService } from 'src/app/services/CameraService';
import { NavController } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../../services/theme.service';
import { FeedService } from 'src/app/services/FeedService';
import { MenuService } from 'src/app/services/MenuService';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { IPFSService } from 'src/app/services/ipfs.service';
@Component({
  selector: 'app-profileimage',
  templateUrl: './profileimage.page.html',
  styleUrls: ['./profileimage.page.scss'],
})
export class ProfileimagePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public connectionStatus = 1;

  public uploadedAvatar: string = null;

  public select = 1;
  public selectedAvatar: string = null;

  public avatars = [
    {
      index: 1,
      image: 'assets/images/profile-1.svg',
    },
    {
      index: 2,
      image: 'assets/images/profile-2.svg',
    },
    {
      index: 3,
      image: 'assets/images/profile-3.svg',
    },
    {
      index: 4,
      image: 'assets/images/profile-4.svg',
    },
    {
      index: 5,
      image: 'assets/images/profile-5.svg',
    },
    {
      index: 6,
      image: 'assets/images/profile-6.svg',
    },
    {
      index: 7,
      image: 'assets/images/profile-7.svg',
    },
    {
      index: 8,
      image: 'assets/images/profile-8.svg',
    },
    {
      index: 9,
      image: 'assets/images/profile-9.svg',
    },
  ];
  public pictureMenu: any = null;
  constructor(
    private native: NativeService,
    private navCtrl: NavController,
    private events: Events,
    private zone: NgZone,
    private translate: TranslateService,
    public theme: ThemeService,
    private feedService: FeedService,
    private camera: CameraService,
    private menuService: MenuService,
    private titleBarService: TitleBarService,
    private ipfsService: IPFSService
  ) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.initTitle();
    this.select = this.feedService.getSelsectIndex();
    let clipProfileIamge = this.feedService.getClipProfileIamge();
    if (clipProfileIamge != '') {
      this.select = 0;
      this.selectedAvatar = clipProfileIamge;
      this.feedService.setClipProfileIamge('');
    } else {
      this.selectedAvatar =
        this.feedService.getProfileIamge() || 'assets/images/profile-1.svg';
    }

    // Check if an uploaded avatar exists. If so, select it and have it displayed
    if (this.selectedAvatar.indexOf('data:image') === -1 &&
        this.selectedAvatar.indexOf('feeds:imgage:') === -1 &&
        this.selectedAvatar.indexOf('feeds:image:') === -1 &&
        this.selectedAvatar.indexOf('pasar:image:') === -1
        ) {
      this.uploadedAvatar = null;
    } else {
      let imgUri = "";
      if (this.selectedAvatar.indexOf('feeds:imgage:') > -1) {
        imgUri = this.selectedAvatar.replace('feeds:imgage:', '');
        imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
      }else if(this.selectedAvatar.indexOf('feeds:image:') > -1){
        imgUri = this.selectedAvatar.replace('feeds:image:', '');
        imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
      }else if(this.selectedAvatar.indexOf('pasar:image:') > -1){
        imgUri = this.selectedAvatar.replace('pasar:image:', '');
        imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
      }else{
        imgUri = this.selectedAvatar;
      }
      this.uploadedAvatar = imgUri;
    }

    this.connectionStatus = this.feedService.getConnectionStatus();

    this.events.subscribe(FeedsEvent.PublishType.connectionChanged, status => {
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    this.events.publish(FeedsEvent.PublishType.addProflieEvent);
    if (this.pictureMenu != null) {
      this.menuService.hideActionSheet();
    }
  }

  ionViewDidEnter() {}

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('ProfileimagePage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  selectIndex(index: number, avatar?: string) {
    if (index === 0) {
      this.select = 0;
      // If uploaded avatar exists and is selected, use it. Otherwise open camera
      avatar ? (this.selectedAvatar = avatar) : this.addPic();
    } else {
      this.select = index;
      this.selectedAvatar = 'img://' + avatar;
    }
  }

  confirm() {
    if (!this.selectedAvatar) {
      // Usually this is avoided by using a default avatar if one isn't selected
      this.native.toast_trans('common.noImageSelected');
      return false;
    } else {
      // Set selected index and selected avatar
      this.feedService.setSelsectIndex(this.select);
      this.feedService.setProfileIamge(this.selectedAvatar);
      this.navCtrl.pop();
    }
  }

  addPic() {
    this.pictureMenu = this.menuService.showPictureMenu(
      this,
      this.openCamera,
      this.openGallery,
      this.openNft,
    );
  }

  openNft(that: any) {
    that.native.navigateForward(['nftavatarlist'], '');
  }

  openGallery(that: any) {
    that.camera.openCamera(
      30,
      0,
      0,
      (imageUrl: any) => {
        that.native.navigateForward(['editimage'], '');
        that.feedService.setClipProfileIamge(imageUrl);
      },
      err => {},
    );
  }

  openCamera(that: any) {
    that.camera.openCamera(
      30,
      0,
      1,
      (imageUrl: any) => {
        that.native.navigateForward(['editimage'], '');
        that.feedService.setClipProfileIamge(imageUrl);
      },
      err => {},
    );
  }
}
