import { Component, OnInit, NgZone } from '@angular/core';
import { CameraService } from 'src/app/services/CameraService';
import { NavController, Events } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from '../../../services/theme.service';
import { FeedService } from 'src/app/services/FeedService';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-profileimage',
  templateUrl: './profileimage.page.html',
  styleUrls: ['./profileimage.page.scss'],
})
export class ProfileimagePage implements OnInit {
  private connectionStatus = 1;
  private userAvatar = "";
  private select: number = 1;
  private avatar = "assets/images/profile-1.svg";
  constructor(
    private native: NativeService,
    private navCtrl: NavController,
    private events: Events,
    private zone: NgZone,
    private translate:TranslateService,
    private theme:ThemeService, 
    private feedService:FeedService,
    private camera: CameraService) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.connectionStatus = this.feedService.getConnectionStatus();

    if(this.theme.darkMode){
      this.userAvatar = './assets/images/profile-add-dark.svg';
    }else{
      this.userAvatar = './assets/images/profile-add.svg';
    }

    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });
  }

  ionViewWillLeave(){
    this.camera = null;
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:updateTitle"); 
  }

  ionViewDidEnter() {
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("ProfileimagePage.title"));
  }

  selectIndex(index: number, avatar: string){
    this.select = index;
    if (index == 0){
      this.openCamera(0);
      return ;
    }else{
      this.avatar = "img://"+avatar;
    }
  }

  confirm(){
    if(this.avatar === ""){
      this.native.toast_trans('common.noImageSelected');
      return false;
    }
    this.feedService.setProfileIamge(this.avatar);
    this.navCtrl.pop();
  }

  addPic(){
    this.openCamera(0);
  }

  openCamera(type: number){
    this.camera.openCamera(50,0,type,
      (imageUrl)=>{
        this.zone.run(() => {
          this.userAvatar = this.avatar = imageUrl;
          this.feedService.setProfileIamge(this.userAvatar);
        });
      },
      (err)=>{
        //this.camera = null;
        this.avatar = "";
        this.feedService.setProfileIamge(this.avatar);
        this.native.toast_trans('common.noImageSelected');
        }
        );
  }

}
