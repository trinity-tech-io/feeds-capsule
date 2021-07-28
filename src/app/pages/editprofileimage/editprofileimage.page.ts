import { Component, OnInit, ViewChild } from '@angular/core';
import { FeedService, Avatar } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TranslateService } from "@ngx-translate/core";
import { ActionSheetController } from '@ionic/angular';
import { MenuService } from 'src/app/services/MenuService';
@Component({
  selector: 'app-editprofileimage',
  templateUrl: './editprofileimage.page.html',
  styleUrls: ['./editprofileimage.page.scss'],
})
export class EditprofileimagePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public avatar: Avatar = null;
  public actionSheet:any = null;
  private pictureMenu: any = null;
  constructor(
    private feedService: FeedService,
    public theme: ThemeService,
    private translate:TranslateService,
    private titleBarService: TitleBarService,
    private menuService: MenuService) { }

  ngOnInit() {
    this.initTitle();
    let signInData = this.feedService.getSignInData() || {};
    this.avatar = signInData["avatar"] || null;
  }

  ionViewWillLeave(){
    if(this.pictureMenu!=null){
      this.menuService.hideActionSheet();
    }
  }
  initTitle(){
    this.titleBarService.setTitle(this.titleBar, this.translate.instant('ProfiledetailPage.profileDetails'));
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  handleImages(){
    if(this.avatar === null){
       return 'assets/images/default-contact.svg';
    }
    let contentType = this.avatar['contentType'] || this.avatar['content-type'] || "";
    let cdata = this.avatar['data'] || "";
    if(contentType === "" || cdata === ""){
      return 'assets/images/default-contact.svg';
    }

    return 'data:'+contentType+';base64,'+this.avatar.data;
  }


  async editImage(){
    this.pictureMenu = this.menuService.showPictureMenu(this,this.openCamera,this.openGallery);
  }

  openGallery(that:any){
    that.camera.openCamera(30,0,0,
      (imageUrl:any) => {
        //that.zone.run(() => {
          that.native.navigateForward(['editimage'],"");
          that.feedService.setClipProfileIamge(imageUrl);
          //that.select = 0;
          //that.uploadedAvatar = imageUrl;
          //that.selectedAvatar = imageUrl;
        //});
      }, (err) => {

      }
    );
  }

  openCamera(that:any){
    that.camera.openCamera(30,0,1,
      (imageUrl:any) => {
        //that.zone.run(() => {
          that.native.navigateForward(['editimage'],"");
          that.feedService.setClipProfileIamge(imageUrl);
          //that.select = 0;
          //that.uploadedAvatar = imageUrl;
          //that.selectedAvatar = imageUrl;
        //});
      }, (err) => {

      }
    );
  }
}
