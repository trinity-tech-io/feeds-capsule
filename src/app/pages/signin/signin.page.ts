import { Component, OnInit, NgZone } from '@angular/core';
import { FeedService } from 'src/app/services/FeedService';
import { CarrierService } from 'src/app/services/CarrierService';
import { NavController, Events, LoadingController } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";

declare let appManager: AppManagerPlugin.AppManager;
declare let didManager: DIDPlugin.DIDManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
})
export class SigninPage implements OnInit {
  private fakedata:boolean = false;
  public signedIn: boolean = false;
  public did: string = "";
  public userName: string = "";
  public emailAddress: string = "";

  constructor(
    private events: Events,
    private navCtrl: NavController,
    private native: NativeService,
    private zone: NgZone,
    private feedService: FeedService,
    public loadingController: LoadingController,
    private carrierService:CarrierService,
    private translate:TranslateService,
    private event:Events) { }

  ngOnInit() {
     this.event.subscribe("feeds:updateTitle",()=>{
         this.initTile();
     });
  }

  initTile(){
    titleBarManager.setTitle(this.translate.instant("SigninPage.signIn"));
  }

  ionViewDidEnter() {
    this.initTile();
    this.native.setTitleBarBackKeyShown(false);
    appManager.setVisible("show");
  }

  ionViewWillUnload(){
    this.event.unsubscribe("feeds:updateTitle");
  }

  signIn(){
    if (this.fakedata){
      this.saveData("did:elastos:iaP7GCmtcbf3Kiy7PX8zUVaWTzZQG3Kkka",
              "fakename",
              "fakeemail",
              "faketelephone",
              "fakelocation",
              "fakedescription");

      this.feedService.updateSignInDataExpTimeTo(this.feedService.getSignInData(),0);
      this.initApp();
      return;
    }

    this.zone.run(()=>{
      this.presentLoading();
    });
    appManager.sendIntent("credaccess", {
      claims: {
        name: true,
        email: {
          required: false,
          reason: "Maybe Feeds dapp need"
        },
        gender: {
          required: false,
          reason: "Maybe Feeds dapp need"
        },
        telephone: {
          required: false,
          reason: "Maybe Feeds dapp need"
        },
        nation: {
          required: false,
          reason: "Maybe Feeds dapp need"
        },
        description:{
          required: false,
          reason: "Maybe Feeds dapp need"
        }
      }
    }, {}, (response: any) => {
      if (response && response.result && response.result.presentation) {
        let data = response.result;

        // Create a real presentation object from json data
        didManager.VerifiablePresentationBuilder.fromJson(JSON.stringify(response.result.presentation), (presentation)=>{
          this.zone.run(()=>{
            let credentials = presentation.getCredentials();
            this.saveCredentialById(data.did,credentials, "name");

            this.saveData(
              data.did,
              this.findCredentialValueById(data.did, credentials, "name", this.translate.instant("DIDdata.Notprovided")),
              this.findCredentialValueById(data.did, credentials, "email", this.translate.instant("DIDdata.Notprovided")),
              this.findCredentialValueById(data.did, credentials, "telephone", this.translate.instant("DIDdata.Notprovided")),
              this.findCredentialValueById(data.did, credentials, "nation", this.translate.instant("DIDdata.Notprovided")),
              this.findCredentialValueById(data.did, credentials, "description", this.translate.instant("DIDdata.Notprovided"))
              );

            this.events.publish("feeds:signinSuccess");
            this.initApp();
          });
        });
      }
    });

  }

  async presentLoading() {
    const loading = await this.loadingController.create({
      message: this.translate.instant("SigninPage.Pleasewait"),
      duration: 2000
    });
    await loading.present();

    const { role, data } = await loading.onDidDismiss();
  }

  findCredentialValueById(did: string, credentials: DIDPlugin.VerifiableCredential[], fragment: string, defaultValue: string) {
    let matchingCredential = credentials.find((c)=>{
      return c.getFragment() == fragment;
    });

    if (!matchingCredential)
      return defaultValue;
    else
      return matchingCredential.getSubject()[fragment];
  }

  saveCredentialById(did: string, credentials: DIDPlugin.VerifiableCredential[], fragment: string) {
    let matchingCredential = credentials.find((c)=>{
      return c.getFragment() == fragment;
    });

    if (matchingCredential){
      this.feedService.saveCredential(JSON.stringify(matchingCredential));
    }
  }

  initApp(){
    this.carrierService.init();
    this.navCtrl.navigateRoot(['/tabs/home'])
  }

  saveData(did: string, name: string, email: string, telephone: string, location: string, description: string){
    this.feedService.saveSignInData(did,name,email,telephone,location, description);
  }

}
