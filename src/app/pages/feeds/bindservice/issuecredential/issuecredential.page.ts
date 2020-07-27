import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, AlertController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { Events } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-issuecredential',
  templateUrl: './issuecredential.page.html',
  styleUrls: ['./issuecredential.page.scss'],
})
export class IssuecredentialPage implements OnInit {
  private title = "IssuecredentialPage.bindingServer";
  private nodeId = "";
  private did = "";
  constructor(
    public alertController: AlertController,
    private native: NativeService,
    private zone: NgZone,
    private events: Events,
    private acRoute: ActivatedRoute,
    private feedService:FeedService,
    private translate:TranslateService,
    private router: Router,
    private navCtrl: NavController
    ) {
      acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
        this.did = data.did;
      });

      this.events.subscribe('feeds:issue_credential', () => {
        this.zone.run(() => {
          this.navCtrl.pop().then(()=>{
            this.native.getNavCtrl().navigateForward(['/bindservice/finish/',this.nodeId]);
          });
        });
      });
    }

    ionViewDidEnter() {
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
      titleBarManager.setTitle(this.translate.instant(this.title));
    }
  
  ngOnInit() {
  }
  issueCredential(){
    this.presentPrompt();
  }

  abort(){
    this.navCtrl.pop();
  }

  async presentPrompt() {//确认弹框
    let promotAlert = await this.alertController.create({
      header: this.translate.instant('IssuecredentialPage.serverInfo'),
      inputs: [
        {
          name: 'serverName',
          placeholder: this.translate.instant('IssuecredentialPage.serverName')
        },
        {
          name: 'serverDes',
          placeholder: this.translate.instant('IssuecredentialPage.serverDes'),
        }
      ],
      buttons: [
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          handler: data => {
          }
        },
        {
          text: this.translate.instant('common.ok'),
          handler: data => {//回调为假时弹框将保持不消失
            let serverName = data.serverName;
            let serverDes = data.serverDes;

            if (serverName == ""){
              alert(this.translate.instant('common.pleaseInput')+this.translate.instant('IssuecredentialPage.serverName'));
              return ;
            }
              

            if (serverDes == ""){
              alert(this.translate.instant('common.pleaseInput')+this.translate.instant('IssuecredentialPage.serverDes'))
              return ;
            }
              
            this.feedService.issueCredential(this.nodeId,this.did, serverName, serverDes);
          }
        }
      ]
    });
    await promotAlert.present();//切记
  }

}

