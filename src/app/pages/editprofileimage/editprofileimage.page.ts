import { Component, OnInit, ViewChild } from '@angular/core';
import { FeedService, Avatar } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TranslateService } from '@ngx-translate/core';
import { MenuService } from 'src/app/services/MenuService';
import { CameraService } from 'src/app/services/CameraService';
import { NativeService } from 'src/app/services/NativeService';
import { Events } from 'src/app/services/events.service';

@Component({
  selector: 'app-editprofileimage',
  templateUrl: './editprofileimage.page.html',
  styleUrls: ['./editprofileimage.page.scss'],
})
export class EditprofileimagePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public avatar: Avatar = null;
  public actionSheet: any = null;
  private pictureMenu: any = null;
  public headPortrait: string = '';
  public croppedImage: string = '';
  private isOPenRightMenu: boolean = false;
  constructor(
    private feedService: FeedService,
    public theme: ThemeService,
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private menuService: MenuService,
    private camera: CameraService,
    private native: NativeService,
    private events: Events,
  ) {}

  ngOnInit() {
    this.initTitle();
    let signInData = this.feedService.getSignInData() || {};
    this.avatar = signInData['avatar'] || null;
  }

  ionViewWillEnter() {
    this.isOPenRightMenu = false;
    this.events.subscribe(FeedsEvent.PublishType.openRightMenu, () => {
      this.isOPenRightMenu = true;
    });
    this.initTitle();
    this.headPortrait = this.feedService.getClipProfileIamge();
  }

  ionViewWillLeave() {
    //TODO 显示确认退出对话框

    this.events.unsubscribe(FeedsEvent.PublishType.openRightMenu);
    this.titleBarService.addRight(this.titleBar);
    this.titleBarService.setIcon(
      this.titleBar,
      FeedsData.TitleBarIconSlot.INNER_RIGHT,
      null,
      null,
    );
    let croppedImage = this.feedService.getClipProfileIamge();
    if (this.headPortrait === croppedImage && !this.isOPenRightMenu) {
      this.feedService.setClipProfileIamge('');
    }

    if (this.pictureMenu != null) {
      this.menuService.hideActionSheet();
    }
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('common.setAvatar'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  handleImages() {
    console.log("getClipProfileIamge", this.feedService.getClipProfileIamge());
    const clipImage = this.feedService.getClipProfileIamge();
    if (clipImage != '')
      return clipImage;

    if (this.avatar === null) {
      return 'assets/images/default-contact.svg';
    }
    let contentType =
      this.avatar['contentType'] || this.avatar['content-type'] || '';
    let cdata = this.avatar['data'] || '';
    if (contentType === '' || cdata === '') {
      return 'assets/images/default-contact.svg';
    }
    return 'data:' + contentType + ';base64,' + this.avatar.data;
  }

  editImage() {
    this.pictureMenu = this.menuService.showPictureMenu(
      this,
      this.openCamera,
      this.openGallery,
      this.openNft,
    );
  }

  openNft(that: any) {
    that.native.navigateForward(['profilenftimage'], '');
  }

  openGallery(that: any) {
    that.camera.openCamera(
      30,
      0,
      0,
      (imageUrl: any) => {
        //that.zone.run(() => {
        that.native.navigateForward(['editimage'], '');
        that.feedService.setClipProfileIamge(imageUrl);
        //that.select = 0;
        //that.uploadedAvatar = imageUrl;
        //that.selectedAvatar = imageUrl;
        //});
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
        //that.zone.run(() => {
        that.native.navigateForward(['editimage'], '');
        that.feedService.setClipProfileIamge(imageUrl);
        //that.select = 0;
        //that.uploadedAvatar = imageUrl;
        //that.selectedAvatar = imageUrl;
        //});
      },
      err => {},
    );
  }

  saveAvatar() {
    alert("saveAvatar");
  }
}
