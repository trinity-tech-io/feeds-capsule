import { Component, OnInit, ViewChild } from '@angular/core';
import { FeedService, Avatar, SignInData } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TranslateService } from '@ngx-translate/core';
import { MenuService } from 'src/app/services/MenuService';
import { CameraService } from 'src/app/services/CameraService';
import { NativeService } from 'src/app/services/NativeService';
import { Events } from 'src/app/services/events.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { IPFSService } from 'src/app/services/ipfs.service';
import { HiveService } from 'src/app/services/HiveService';

@Component({
  selector: 'app-editprofileimage',
  templateUrl: './editprofileimage.page.html',
  styleUrls: ['./editprofileimage.page.scss'],
})
export class EditprofileimagePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public avatar: string = '';
  public actionSheet: any = null;
  private pictureMenu: any = null;
  public headPortrait: string = '';
  public croppedImage: string = '';

  private isOPenRightMenu: boolean = false;
  private userDid: string = '';
  constructor(
    private feedService: FeedService,
    public theme: ThemeService,
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private menuService: MenuService,
    private camera: CameraService,
    private native: NativeService,
    private events: Events,
    private dataHelper: DataHelper,
    private ipfsService: IPFSService,
    private hiveService: HiveService,
  ) {}

  async ngOnInit() {
    this.initTitle();
    this.userDid = (await this.dataHelper.getSigninData()).did;
    this.avatar = await this.feedService.getUserAvatar(this.userDid);
  }

  ionViewWillEnter() {
    this.isOPenRightMenu = false;
    this.events.subscribe(FeedsEvent.PublishType.openRightMenu, () => {
      this.isOPenRightMenu = true;
    });
    this.initTitle();
    this.headPortrait = this.dataHelper.getClipProfileIamge();

    this.croppedImage = this.dataHelper.getClipProfileIamge();
    if (this.croppedImage != '')
      this.avatar = this.croppedImage;
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
    this.croppedImage = this.dataHelper.getClipProfileIamge();
    if (this.headPortrait === this.croppedImage && !this.isOPenRightMenu) {
        this.dataHelper.setClipProfileIamge('');
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
    let imgUri = "";
    if (this.avatar.indexOf('feeds:imgage:') > -1) {
      imgUri = this.avatar.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }else if(this.avatar.indexOf('feeds:image:') > -1){
      imgUri = this.avatar.replace('feeds:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }else if(this.avatar.indexOf('pasar:image:') > -1){
      imgUri = this.avatar.replace('pasar:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }
    else{
      imgUri = this.avatar;
    }
    return imgUri;
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
    that.native.navigateForward(['nftavatarlist'], '');
  }

  openGallery(that: any) {
    that.camera.openCamera(
      30,
      0,
      0,
      (imageUrl: any) => {
        that.native.navigateForward(['editimage'], '');
        that.dataHelper.setClipProfileIamge(imageUrl);
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
        that.dataHelper.setClipProfileIamge(imageUrl);
      },
      err => {},
    );
  }

  async saveAvatar() {
    await this.native.showLoading('common.waitMoment');
    try {
      await this.hiveService.uploadScriptWithString("custome", this.avatar)
      this.native.hideLoading()
      this.dataHelper.saveUserAvatar(this.userDid, this.avatar);
      this.native.pop();
    } catch (error) {
      this.native.hideLoading()
      this.native.toast('common.saveFailed');
    }
  }
}
