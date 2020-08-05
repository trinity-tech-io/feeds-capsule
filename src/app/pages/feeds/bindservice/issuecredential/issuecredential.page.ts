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
  private connectionStatus = 1;
  private title = "05/06";
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
     
    }

    ngOnInit() {
      this.connectionStatus = this.feedService.getConnectionStatus();
      this.acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
        this.did = data.did;
      });
    }

    ionViewWillEnter(){
      this.events.subscribe('feeds:connectionChanged',(status)=>{
        this.zone.run(() => {
          this.connectionStatus = status;
        });
      });

      this.events.subscribe('feeds:issue_credential', () => {
        this.zone.run(() => {
            this.native.navigateForward(['/bindservice/finish/',this.nodeId],{
              replaceUrl: true
          });
        });
      });
    }

    ionViewDidEnter() {
      this.initTitle();
      this.native.setTitleBarBackKeyShown(true);
    }

    ionViewWillLeave(){
      this.events.unsubscribe("feeds:connectionChanged");
      this.events.unsubscribe('feeds:issue_credential');
    }
  
  
    initTitle(){
      titleBarManager.setTitle(this.translate.instant(this.title));
    }
  
  issueCredential(){
    this.presentPrompt();
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

