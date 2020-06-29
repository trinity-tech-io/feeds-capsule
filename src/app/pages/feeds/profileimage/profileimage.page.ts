import { Component, OnInit, NgZone } from '@angular/core';
import { CameraService } from 'src/app/services/CameraService';
import { NavController, Events } from '@ionic/angular';

@Component({
  selector: 'app-profileimage',
  templateUrl: './profileimage.page.html',
  styleUrls: ['./profileimage.page.scss'],
})
export class ProfileimagePage implements OnInit {
  private userAvatar = "assets/images/profile-add.svg";
  private select: number = 1;
  private avatar = "assets/images/profile-1.svg";
  constructor(
    private navCtrl: NavController,
    private events: Events,
    private zone: NgZone,
    private camera: CameraService) { }

  ngOnInit() {
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

  comfirm(){
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
