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

  constructor(
    private native: NativeService,
    private navCtrl: NavController,
    private events: Events,
    private zone: NgZone,
    private translate: TranslateService,
    private theme: ThemeService, 
    private feedService:FeedService,
    private camera: CameraService
  ) { }

  ngOnInit() {
    
  }

  ionViewWillEnter() {
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
    
    this.select = this.feedService.getSelsectIndex();
    this.selectedAvatar = this.feedService.getProfileIamge() || 'assets/images/profile-1.svg';
      
    // Check if an uploaded avatar exists. If so, select it and have it displayed
    if(this.selectedAvatar.indexOf("data:image") === -1) {;
      this.uploadedAvatar = null;
    } else {
      this.uploadedAvatar = this.selectedAvatar;
    }
   
    this.connectionStatus = this.feedService.getConnectionStatus();

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
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("ProfileimagePage.title"));
  }

  selectIndex(index: number, avatar?: string){
    this.select = index;
    if (index === 0) {
      // If uploaded avatar exists and is selected, use it. Otherwise open camera
      avatar ? this.selectedAvatar = avatar : this.openCamera(0);
    } else {
      this.selectedAvatar = "img://"+avatar;
    }
  }

  confirm(){
    if(!this.selectedAvatar) {
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

  addPic(){
    this.openCamera(0);
  }

  openCamera(type: number){
    this.camera.openCamera(30,0,type,
      (imageUrl) => {
        this.zone.run(() => {
          this.uploadedAvatar = imageUrl;
          this.selectedAvatar = imageUrl;
        });
      }, (err) => {
        this.native.toast_trans('common.noImageSelected');

        // If err, use default avatar 
        this.select = 1;
        this.selectedAvatar = "img://"+"assets/images/profile-1.svg";
      }
    );
  }

}

