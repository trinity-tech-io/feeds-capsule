import { Component, OnInit, NgZone } from '@angular/core';
import { CameraService } from 'src/app/services/CameraService';
import { NavController, Events } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from '../../../services/theme.service';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-profileimage',
  templateUrl: './profileimage.page.html',
  styleUrls: ['./profileimage.page.scss'],
})
export class ProfileimagePage implements OnInit {
  private userAvatar = "";
  private select: number = 1;
  private avatar = "assets/images/profile-1.svg";
  constructor(
    private native: NativeService,
    private navCtrl: NavController,
    private events: Events,
    private zone: NgZone,
    private translate:TranslateService,
    public theme:ThemeService, 
    private camera: CameraService) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    if(this.theme.darkMode){
      this.userAvatar = './assets/images/profile-add-dark.svg';
    }else{
      this.userAvatar = './assets/images/profile-add.svg';
    }
    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
  }

  ionViewWillUnload(){
    this.events.unsubscribe("feeds:updateTitle");
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
    this.events.publish("feeds:selectavatar",this.avatar);
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
        });
      },
      (err)=>{alert(err)});
  }

}
